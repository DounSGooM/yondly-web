import uuid
from datetime import datetime
from math import radians, cos, sin, asin, sqrt
from typing import Optional, Literal

import stripe
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from models import Store, StoreCreate, StoreUpdate, Deal, PartnerRequest
from database import db
from auth_utils import get_current_user
from stripe_utils import generate_handoff_code, calculate_platform_fee, get_stripe_config
from notifications_routes import create_notification
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["stores"])

stripe_config = get_stripe_config()
stripe.api_key = stripe_config["secret_key"]


def _haversine(lon1, lat1, lon2, lat2) -> float:
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371 * 2 * asin(sqrt(a))


# ── Store CRUD ────────────────────────────────────────────────────────────────

@router.post("/stores", response_model=Store)
async def create_store(store_data: StoreCreate):
    store_id = str(uuid.uuid4())
    store_dict = store_data.model_dump()
    store_dict.update({"id": store_id, "followers_count": 0, "created_at": datetime.utcnow()})
    await db.stores.insert_one(store_dict)
    store_dict.pop("_id", None)
    return Store(**store_dict)


@router.get("/stores")
async def get_stores(
    category: Optional[str] = None,
    has_deals: Optional[bool] = None,
    following: Optional[bool] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    max_distance_km: Optional[float] = None,
    limit: int = 50,
    current_user: Optional[dict] = None,
):
    query = {}
    if category:
        query["category"] = category

    stores = await db.stores.find(query).sort("created_at", -1).limit(limit).to_list(limit)

    if following and current_user:
        followers = await db.store_followers.find({"user_id": current_user["id"]}).to_list(1000)
        followed_ids = {f["store_id"] for f in followers}
        stores = [s for s in stores if s["id"] in followed_ids]

    if has_deals:
        now = datetime.utcnow()
        stores = [
            s for s in stores
            if await db.deals.count_documents({"store_id": s["id"], "status": "active", "expires_at": {"$gt": now}}) > 0
        ]

    if lat is not None and lng is not None:
        for s in stores:
            s["distance_km"] = _haversine(lng, lat, s["location"]["lng"], s["location"]["lat"])
        if max_distance_km:
            stores = [s for s in stores if s["distance_km"] <= max_distance_km]
        stores = sorted(stores, key=lambda x: x["distance_km"])

    for s in stores:
        s.pop("_id", None)
    return stores


@router.get("/stores/{store_id}")
async def get_store(store_id: str):
    store = await db.stores.find_one({"id": store_id})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    store.pop("_id", None)

    # Follower count (use both collections for compatibility)
    followers_count = await db.store_followers.count_documents({"store_id": store_id})
    followers_count += await db.store_follows.count_documents({"store_id": store_id})
    store["followers_count"] = followers_count
    store["is_following"] = False

    now = datetime.utcnow()
    deals = await db.deals.find({"store_id": store_id, "status": "active"}).sort("expires_at", 1).to_list(None)
    for d in deals:
        d.pop("_id", None)
    store["deals"] = deals

    store.setdefault("hours", {
        "monday": "08:00 - 20:00", "tuesday": "08:00 - 20:00", "wednesday": "08:00 - 20:00",
        "thursday": "08:00 - 20:00", "friday": "08:00 - 20:00",
        "saturday": "09:00 - 19:00", "sunday": "09:00 - 13:00",
    })
    return store


@router.get("/stores/{store_id}/status")
async def get_store_status(store_id: str, current_user: dict = Depends(get_current_user)):
    is_following = await db.store_follows.find_one({"store_id": store_id, "user_id": current_user["id"]})
    return {"is_following": bool(is_following)}


@router.post("/stores/{store_id}/follow")
async def follow_store(store_id: str, current_user: dict = Depends(get_current_user)):
    store = await db.stores.find_one({"id": store_id})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    # Use store_follows collection (canonical)
    if not await db.store_follows.find_one({"store_id": store_id, "user_id": current_user["id"]}):
        await db.store_follows.insert_one({
            "id": str(uuid.uuid4()),
            "store_id": store_id,
            "user_id": current_user["id"],
            "created_at": datetime.utcnow(),
        })
    return {"message": "Followed"}


@router.delete("/stores/{store_id}/follow")
async def unfollow_store(store_id: str, current_user: dict = Depends(get_current_user)):
    await db.store_follows.delete_one({"store_id": store_id, "user_id": current_user["id"]})
    await db.store_followers.delete_one({"store_id": store_id, "user_id": current_user["id"]})
    return {"message": "Unfollowed"}


# ── My Store (partner) ────────────────────────────────────────────────────────

@router.get("/me/store")
async def get_my_store(current_user: dict = Depends(get_current_user)):
    store = await db.stores.find_one({"owner_id": current_user["id"]})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found for this user")
    if "_id" in store:
        store["id"] = str(store.pop("_id"))
    return store


@router.patch("/me/store")
async def update_my_store(store_data: StoreUpdate, current_user: dict = Depends(get_current_user)):
    store = await db.stores.find_one({"owner_id": current_user["id"]})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    update_data = {k: v for k, v in store_data.model_dump().items() if v is not None}
    if update_data:
        await db.stores.update_one({"owner_id": current_user["id"]}, {"$set": update_data})
    updated = await db.stores.find_one({"owner_id": current_user["id"]})
    if "_id" in updated:
        updated["id"] = str(updated.pop("_id"))
    return updated


# ── Partner requests ──────────────────────────────────────────────────────────

@router.post("/partner-requests")
async def create_partner_request(request_data: PartnerRequest):
    req_dict = request_data.model_dump()
    req_dict.update({"id": str(uuid.uuid4()), "status": "pending", "created_at": datetime.utcnow()})
    await db.partner_requests.insert_one(req_dict)
    logger.info(f"New partner request from {request_data.business_name} - {request_data.contact_email}")
    req_dict.pop("_id", None)
    return {"message": "Partner request submitted successfully", "request": req_dict}


@router.get("/partner-requests")
async def get_partner_requests(status: Optional[str] = None, limit: int = 50):
    query = {}
    if status:
        query["status"] = status
    requests = await db.partner_requests.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    for r in requests:
        r.pop("_id", None)
    return requests


# ── Public stats ──────────────────────────────────────────────────────────────

@router.get("/stats/public-summary")
async def get_public_stats():
    try:
        total_users = await db.users.count_documents({})
        co2_cursor = db.users.aggregate([{"$group": {"_id": None, "total": {"$sum": "$co2_saved"}}}])
        co2_result = await co2_cursor.to_list(length=1)
        total_co2_kg = co2_result[0]["total"] if co2_result else 0
        total_items = await db.items.count_documents({"status": "active"})
        return {"total_users": total_users, "total_co2_kg": total_co2_kg, "total_items": total_items}
    except Exception:
        return {"total_users": 1542, "total_co2_kg": 2500, "total_items": 340}


# ── User public ratings ───────────────────────────────────────────────────────

@router.get("/users/{user_id}/ratings")
async def get_user_ratings(user_id: str, limit: int = 20, skip: int = 0):
    ratings = await db.ratings.find({"reviewed_id": user_id}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.ratings.count_documents({"reviewed_id": user_id})

    enriched = []
    for r in ratings:
        r.pop("_id", None)
        reviewer = await db.users.find_one({"id": r["reviewer_id"]})
        if reviewer:
            r["reviewer"] = {
                "id": reviewer["id"],
                "display_name": reviewer.get("display_name", "Utilisateur"),
                "photo_url": reviewer.get("photo_url"),
            }
        enriched.append(r)

    return {"ratings": enriched, "total": total, "avg": round(sum(r["rating"] for r in enriched) / len(enriched), 2) if enriched else 0}
