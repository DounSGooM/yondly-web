import logging
import uuid
from datetime import datetime
from typing import Optional

import httpx
from bson import ObjectId
from fastapi import APIRouter, HTTPException

from models import GeoZoneCreate, GeoZoneUpdate, CommuneToggle, Commune
from database import db
from location_analytics import (
    get_analytics_by_city,
    get_analytics_by_neighborhood,
    get_analytics_by_street,
    get_zone_summary,
    get_time_series_analytics,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["zones"])


# ── Public zone endpoints ─────────────────────────────────────────────────────

@router.get("/zones")
async def get_all_zones():
    try:
        zones = await db.zones.find({}).to_list(100)
        return [{
            "id": str(z.get("_id", "")),
            "name": z.get("name", ""),
            "displayName": z.get("displayName", ""),
            "type": z.get("type", "agglomeration"),
            "isActive": z.get("isActive", False),
            "communes": z.get("communes", []),
            "created_at": z.get("created_at"),
            "updated_at": z.get("updated_at"),
        } for z in zones]
    except Exception as e:
        logger.error(f"Get zones error: {e}")
        return []


@router.get("/zones/active")
async def get_active_zones():
    try:
        zones = await db.zones.find({"isActive": True}).to_list(100)
        result = []
        for z in zones:
            active_communes = [c for c in z.get("communes", []) if c.get("isActive", False)]
            if active_communes:
                result.append({
                    "id": str(z.get("_id", "")),
                    "name": z.get("name", ""),
                    "displayName": z.get("displayName", ""),
                    "type": z.get("type", "agglomeration"),
                    "communes": active_communes,
                })
        return result
    except Exception as e:
        logger.error(f"Get active zones error: {e}")
        return []


# ── Admin zone management ─────────────────────────────────────────────────────

@router.post("/admin/zones")
async def create_zone(zone: GeoZoneCreate):
    try:
        zone_doc = {
            "name": zone.name,
            "displayName": zone.displayName,
            "type": zone.type,
            "isActive": zone.isActive,
            "communes": [c.dict() for c in zone.communes],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await db.zones.insert_one(zone_doc)
        zone_doc["id"] = str(result.inserted_id)
        zone_doc.pop("_id", None)
        return zone_doc
    except Exception as e:
        logger.error(f"Create zone error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/zones/{zone_id}")
async def update_zone(zone_id: str, zone: GeoZoneUpdate):
    try:
        update_data = {"updated_at": datetime.utcnow()}
        if zone.name is not None:
            update_data["name"] = zone.name
        if zone.displayName is not None:
            update_data["displayName"] = zone.displayName
        if zone.type is not None:
            update_data["type"] = zone.type
        if zone.isActive is not None:
            update_data["isActive"] = zone.isActive
        if zone.communes is not None:
            update_data["communes"] = [c.dict() for c in zone.communes]

        result = await db.zones.update_one({"_id": ObjectId(zone_id)}, {"$set": update_data})
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Zone not found")
        return {"success": True, "updated": zone_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update zone error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/zones/{zone_id}/toggle")
async def toggle_zone(zone_id: str, data: CommuneToggle):
    try:
        result = await db.zones.update_one(
            {"_id": ObjectId(zone_id)},
            {"$set": {"isActive": data.isActive, "updated_at": datetime.utcnow()}},
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Zone not found")
        return {"success": True, "isActive": data.isActive}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Toggle zone error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/zones/{zone_id}/communes/{commune_name}")
async def toggle_commune(zone_id: str, commune_name: str, data: CommuneToggle):
    try:
        result = await db.zones.update_one(
            {"_id": ObjectId(zone_id), "communes.name": commune_name},
            {"$set": {"communes.$.isActive": data.isActive, "updated_at": datetime.utcnow()}},
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Zone or commune not found")
        return {"success": True, "commune": commune_name, "isActive": data.isActive}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Toggle commune error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/zones/{zone_id}")
async def delete_zone(zone_id: str):
    try:
        result = await db.zones.delete_one({"_id": ObjectId(zone_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Zone not found")
        return {"success": True, "deleted": zone_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete zone error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/zones/{zone_id}/communes")
async def add_commune(zone_id: str, commune: Commune):
    try:
        result = await db.zones.update_one(
            {"_id": ObjectId(zone_id)},
            {"$push": {"communes": commune.dict()}, "$set": {"updated_at": datetime.utcnow()}},
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Zone not found")
        return {"success": True, "added": commune.name}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add commune error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Geo API integration (EPCI) ────────────────────────────────────────────────

@router.get("/admin/search-epci")
async def search_epci(q: str):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            results = []
            epci_resp = await client.get("https://geo.api.gouv.fr/epcis", params={"nom": q, "fields": "nom,code,population", "limit": 5})
            if epci_resp.status_code == 200:
                for e in epci_resp.json():
                    results.append({"type": "epci", "code": e["code"], "name": e["nom"], "population": e.get("population", 0), "label": f"🏛️ {e['nom']}", "sublabel": f"EPCI • {(e.get('population', 0) or 0):,} hab.".replace(",", " ")})

            commune_resp = await client.get("https://geo.api.gouv.fr/communes", params={"nom": q, "fields": "nom,code,population,codeEpci,departement", "limit": 5})
            if commune_resp.status_code == 200:
                for c in commune_resp.json():
                    dept = c.get("departement", {})
                    results.append({"type": "commune", "code": c["code"], "epci_code": c.get("codeEpci"), "name": c["nom"], "population": c.get("population", 0), "label": f"📍 {c['nom']}", "sublabel": f"Commune • {dept.get('nom', '')} ({dept.get('code', '')})"})

            return results
    except Exception as e:
        logger.error(f"Search EPCI error: {e}")
        return []


@router.get("/admin/epci/{epci_code}/communes")
async def get_epci_communes(epci_code: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://geo.api.gouv.fr/epcis/{epci_code}/communes", params={"fields": "nom,code,population,codesPostaux"})
            if response.status_code == 200:
                return [{"name": c["nom"], "code": c["code"], "population": c.get("population", 0), "postalCodes": c.get("codesPostaux", []), "isActive": True} for c in response.json()]
            return []
    except Exception as e:
        logger.error(f"Get EPCI communes error: {e}")
        return []


@router.post("/admin/zones/create-from-epci")
async def create_zone_from_epci(data: dict):
    try:
        epci_code = data.get("epci_code")
        zone_type = data.get("type", "agglomeration")

        async with httpx.AsyncClient() as client:
            epci_resp = await client.get(f"https://geo.api.gouv.fr/epcis/{epci_code}", params={"fields": "nom,code,population"})
            if epci_resp.status_code != 200:
                raise HTTPException(status_code=404, detail="EPCI not found")
            epci = epci_resp.json()

            communes_resp = await client.get(f"https://geo.api.gouv.fr/epcis/{epci_code}/communes", params={"fields": "nom,code,population,codesPostaux"})
            communes = communes_resp.json() if communes_resp.status_code == 200 else []

        zone_doc = {
            "name": epci["nom"].lower().replace(" ", "_").replace("'", ""),
            "displayName": epci["nom"],
            "type": zone_type,
            "epci_code": epci_code,
            "isActive": True,
            "communes": [{"name": c["nom"], "code": c["code"], "population": c.get("population", 0), "postalCodes": c.get("codesPostaux", []), "isActive": True} for c in communes],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = await db.zones.insert_one(zone_doc)
        zone_doc["id"] = str(result.inserted_id)
        zone_doc.pop("_id", None)
        return {"success": True, "zone": zone_doc, "communes_count": len(communes)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create zone from EPCI error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Location analytics ────────────────────────────────────────────────────────

@router.get("/admin/analytics/cities")
async def analytics_by_city():
    return await get_analytics_by_city(db)


@router.get("/admin/analytics/cities/{city}/neighborhoods")
async def analytics_by_neighborhood(city: str):
    return await get_analytics_by_neighborhood(db, city)


@router.get("/admin/analytics/cities/{city}/streets")
async def analytics_by_street(city: str, neighborhood: Optional[str] = None):
    return await get_analytics_by_street(db, city, neighborhood)


@router.get("/admin/analytics/zone/{zone_name}")
async def zone_analytics_summary(zone_name: str):
    return await get_zone_summary(db, zone_name)


@router.get("/admin/analytics/timeseries")
async def analytics_timeseries(city: Optional[str] = None, days: int = 30):
    return await get_time_series_analytics(db, city, days)


@router.get("/admin/analytics/dashboard")
async def analytics_dashboard():
    try:
        zones = await db.zones.find({"isActive": True}).to_list(100)
        total_users = await db.users.count_documents({})
        total_items = await db.items.count_documents({})
        total_orders = await db.orders.count_documents({"status": "completed"})
        cities = await get_analytics_by_city(db)
        return {
            "global": {"total_users": total_users, "total_items": total_items, "total_transactions": total_orders, "co2_saved_kg": round(total_orders * 3.75, 2), "zones_count": len(zones)},
            "zones": [{"id": str(z.get("_id", "")), "name": z.get("name", ""), "displayName": z.get("displayName", ""), "communes_count": len(z.get("communes", [])), "active_communes": len([c for c in z.get("communes", []) if c.get("isActive")])} for z in zones],
            "cities": cities[:20],
        }
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return {"error": str(e)}
