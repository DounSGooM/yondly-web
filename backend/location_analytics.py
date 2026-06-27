"""
Location Analytics Module
Agrège l'activité et les transactions par localisation géographique.

Réécrit pour la couche Supabase : agrégation Python (le wrapper ne supporte
pas les pipelines Mongo). Les annonces n'ont pas de ville → on passe par la
ville du propriétaire. Pas de granularité quartier/rue dans le schéma actuel.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging


def _parse_dt(v):
    if isinstance(v, datetime):
        return v.replace(tzinfo=None)
    if isinstance(v, str):
        try:
            return datetime.fromisoformat(v.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            return None
    return None


async def _load(db):
    users = await db.users.find({}).to_list(50000)
    user_city = {u["id"]: (u.get("city") or None) for u in users}
    items = await db.items.find({}).to_list(50000)
    orders = await db.orders.find({}).to_list(50000)
    return user_city, items, orders, {it["id"]: it for it in items}


async def get_analytics_by_city(db, zone_id: Optional[str] = None) -> List[Dict]:
    """Analytics agrégées par commune (ville du propriétaire de l'annonce)."""
    try:
        user_city, items, orders, items_by_id = await _load(db)

        by: Dict[str, Dict] = {}
        sellers: Dict[str, set] = {}

        def bucket(c):
            return by.setdefault(c, {
                "city": c, "users_count": 0, "items_count": 0, "donations": 0,
                "sales": 0, "rentals": 0, "baskets": 0, "transactions_count": 0,
                "co2_saved_kg": 0.0, "total_revenue": 0.0, "total_value": 0.0,
            })

        for it in items:
            c = user_city.get(it.get("owner_id"))
            if not c:
                continue
            d = bucket(c)
            d["items_count"] += 1
            t = it.get("type")
            if t == "donation": d["donations"] += 1
            elif t == "sale": d["sales"] += 1
            elif t == "rent": d["rentals"] += 1
            d["total_value"] += (it.get("price_cents") or 0) / 100
            est = it.get("co2_estimate") or {}
            if isinstance(est, dict):
                d["co2_saved_kg"] += float(est.get("co2_saved_kg") or 0)
            sellers.setdefault(c, set()).add(it.get("owner_id"))

        for o in orders:
            if o.get("payment_status") != "released":
                continue
            it = items_by_id.get(o.get("item_id"))
            c = user_city.get((it or {}).get("owner_id"))
            if not c:
                continue
            d = bucket(c)
            d["transactions_count"] += 1
            d["total_revenue"] += (o.get("amount_cents") or 0) / 100

        results = []
        for c, d in by.items():
            d["users_count"] = len(sellers.get(c, set()))
            d["co2_saved_kg"] = round(d["co2_saved_kg"], 2)
            d["total_revenue"] = round(d["total_revenue"], 2)
            d["total_value"] = round(d["total_value"], 2)
            results.append(d)
        return sorted(results, key=lambda x: -x["items_count"])
    except Exception as e:
        logging.error(f"Analytics by city error: {e}")
        return []


async def get_analytics_by_neighborhood(db, city: str) -> List[Dict]:
    """Pas de granularité quartier dans le schéma actuel (annonces géolocalisées
    par lat/lng sans quartier). Retourne une vue agrégée 'Commune entière'."""
    try:
        cities = await get_analytics_by_city(db)
        match = next((c for c in cities if (c["city"] or "").lower() == (city or "").lower()), None)
        if not match:
            return []
        return [{
            "neighborhood": "Commune entière",
            "items_count": match["items_count"],
            "donations": match["donations"],
            "sales": match["sales"],
            "users_count": match["users_count"],
        }]
    except Exception as e:
        logging.error(f"Analytics by neighborhood error: {e}")
        return []


async def get_analytics_by_street(db, city: str, neighborhood: Optional[str] = None) -> List[Dict]:
    """Pas de granularité rue dans le schéma actuel."""
    return []


async def get_zone_summary(db, zone_name: str) -> Dict:
    """Résumé agrégé d'une zone (EPCI) sur ses communes actives."""
    try:
        zone = await db.zones.find_one({"name": zone_name})
        if not zone:
            return {"error": "Zone not found"}
        active = {c["name"].lower() for c in zone.get("communes", []) if c.get("isActive")}

        user_city, items, orders, items_by_id = await _load(db)
        total_items = total_don = total_sale = 0
        total_value = 0.0
        sellers = set()
        for it in items:
            c = (user_city.get(it.get("owner_id")) or "").lower()
            if c not in active:
                continue
            total_items += 1
            if it.get("type") == "donation": total_don += 1
            elif it.get("type") == "sale": total_sale += 1
            total_value += (it.get("price_cents") or 0) / 100
            sellers.add(it.get("owner_id"))

        orders_count = sum(1 for o in orders if o.get("payment_status") == "released")
        return {
            "zone_name": zone_name,
            "display_name": zone.get("display_name", zone_name),
            "type": zone.get("type", "agglomeration"),
            "communes_total": len(zone.get("communes", [])),
            "communes_active": len(active),
            "total_items": total_items,
            "total_donations": total_don,
            "total_sales": total_sale,
            "total_users": len(sellers),
            "total_transactions": orders_count,
            "co2_saved_kg": round(orders_count * 3.75, 2),
            "total_value": round(total_value, 2),
        }
    except Exception as e:
        logging.error(f"Zone summary error: {e}")
        return {"error": str(e)}


async def get_time_series_analytics(db, city: Optional[str] = None, days: int = 30) -> List[Dict]:
    """Séries temporelles quotidiennes (création d'annonces) pour les graphes."""
    try:
        start = datetime.utcnow() - timedelta(days=days)
        user_city, items, orders, _ = await _load(db)
        cl = city.lower() if city else None

        daily: Dict[str, Dict] = {}
        for it in items:
            dt = _parse_dt(it.get("created_at"))
            if not dt or dt < start:
                continue
            if cl and (user_city.get(it.get("owner_id")) or "").lower() != cl:
                continue
            key = dt.strftime("%Y-%m-%d")
            d = daily.setdefault(key, {"date": key, "items_count": 0, "donations": 0,
                                       "sales": 0, "rentals": 0, "baskets": 0})
            d["items_count"] += 1
            t = it.get("type")
            if t == "donation": d["donations"] += 1
            elif t == "sale": d["sales"] += 1
            elif t == "rent": d["rentals"] += 1
        return [daily[k] for k in sorted(daily)]
    except Exception as e:
        logging.error(f"Time series analytics error: {e}")
        return []
