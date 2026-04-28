import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Literal

import stripe
from fastapi import APIRouter, HTTPException, Depends, Query

from models import Item, ItemCreate, CO2EstimateRequest
from database import db
from auth_utils import get_current_user
from stripe_utils import get_stripe_config
from co2_estimator import estimate_co2_with_ai, get_base_co2_estimate, calculate_environmental_equivalents
from zone_utils import check_zone_coverage
from gamification import award_points
from stripe_webhooks import handle_stripe_webhook
from fastapi import Request

logger = logging.getLogger(__name__)
router = APIRouter(tags=["items"])

stripe_config = get_stripe_config()
stripe.api_key = stripe_config["secret_key"]


@router.post("/items", response_model=Item)
async def create_item(item_data: ItemCreate, current_user: dict = Depends(get_current_user)):
    if not item_data.location:
        item_data.location = current_user.get("location") or {
            "lat": 46.5802, "lng": 0.3404, "city": "Poitiers", "address": "Centre-ville"
        }

    if not await check_zone_coverage(location=item_data.location):
        raise HTTPException(status_code=403, detail="La zone de cette annonce n'est pas couverte par Yondly.")

    if current_user.get("is_partner"):
        pro_seller = await db.pro_sellers.find_one({"user_id": current_user["id"]})
        if not pro_seller:
            raise HTTPException(status_code=403, detail="Vous devez compléter votre inscription professionnelle avant de publier des annonces.")
        if pro_seller.get("status") != "verified":
            status_messages = {
                "pending": "Votre compte professionnel est en cours de vérification.",
                "rejected": "Votre inscription professionnelle a été rejetée. Contactez le support.",
                "suspended": "Votre compte professionnel est suspendu. Contactez le support.",
            }
            raise HTTPException(status_code=403, detail=status_messages.get(pro_seller.get("status"), "Compte non vérifié"))

    if item_data.type == "donation":
        if not item_data.food_type:
            raise HTTPException(status_code=400, detail="food_type is required for donations")
        if item_data.price_cents:
            raise HTTPException(status_code=400, detail="Donations cannot have a price")
        if not item_data.urgency_hours:
            raise HTTPException(status_code=400, detail="urgency_hours is required for donations")
        if item_data.photos:
            from food_validator import validate_food_image
            for photo_url in item_data.photos:
                validation = await validate_food_image(photo_url)
                if not validation["is_valid"]:
                    raise HTTPException(status_code=400, detail={
                        "error": "INVALID_FOOD_ITEM",
                        "message": validation["reason"],
                        "detected_items": validation.get("detected_items", []),
                        "confidence": validation.get("confidence", 0.0),
                    })

    if item_data.type == "sale" and (not item_data.price_cents or item_data.price_cents <= 0):
        raise HTTPException(status_code=400, detail="price_cents is required for sales")

    if item_data.type == "rent" and (not item_data.price_per_day_cents or item_data.price_per_day_cents <= 0):
        raise HTTPException(status_code=400, detail="price_per_day_cents is required for rentals")

    item_id = str(uuid.uuid4())

    if item_data.photos:
        from cloudinary_service import upload_item_image
        cloudinary_urls = []
        for idx, photo in enumerate(item_data.photos):
            if photo and "cloudinary.com" in photo:
                cloudinary_urls.append(photo)
            elif photo and (photo.startswith("data:") or photo.startswith("/9j") or len(photo) > 500):
                result = upload_item_image(photo, f"{item_id}_{idx}")
                cloudinary_urls.append(result["url"] if result.get("success") and result.get("url") else photo)
            else:
                cloudinary_urls.append(photo)
        item_data.photos = cloudinary_urls

    expires_at = None
    if item_data.type == "donation" and item_data.urgency_hours:
        expires_at = datetime.utcnow() + timedelta(hours=item_data.urgency_hours)

    item_dict = item_data.dict()
    item_dict.update({
        "id": item_id,
        "owner_id": current_user["id"],
        "status": "active",
        "created_at": datetime.utcnow(),
        "expires_at": expires_at,
    })

    try:
        co2_estimate = await estimate_co2_with_ai(
            title=item_data.title,
            description=item_data.description or "",
            category=item_data.category,
            price_cents=item_data.price_cents if item_data.type == "sale" else (item_data.price_per_day_cents if item_data.type == "rent" else None),
            condition=item_data.condition,
            image_urls=item_data.photos,
        )
        item_dict["co2_estimate"] = co2_estimate
    except Exception as e:
        logger.warning(f"Initial CO2 estimation failed: {e}")

    await db.items.insert_one(item_dict)
    await award_points(current_user["id"], 20)
    item_dict.pop("_id", None)

    try:
        from analytics_routes import track_event_internal
        mode_map = {"donation": "don", "sale": "vente", "rent": "location"}
        estimated_value = (item_data.price_cents or item_data.price_per_day_cents or 0) / 100
        await track_event_internal(
            user_id=current_user["id"],
            event_name="listing_created",
            territory_type="code_postal",
            territory_code="00000",
            event_value=estimated_value,
            metadata={"item_id": item_id, "type": mode_map.get(item_data.type, "autre"), "category": item_data.category},
        )
    except Exception:
        pass

    return item_dict


@router.get("/pro/stats")
async def get_pro_stats(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_partner"):
        raise HTTPException(status_code=403, detail="Not authorized (Pro only)")

    user_id = current_user["id"]
    now = datetime.utcnow()
    week_start = now - timedelta(days=6)
    week_start = datetime(week_start.year, week_start.month, week_start.day)

    active_baskets_count = await db.items.count_documents({"owner_id": user_id, "type": "donation", "status": "active"})
    pending_pickups_count = await db.orders.count_documents({"seller_id": user_id, "payment_status": "escrowed"})
    active_items_count = await db.items.count_documents({"owner_id": user_id, "type": "sale", "status": "active"})

    week_sale = [0] * 7
    week_rental = [0] * 7
    today_sales_revenue = 0
    today_sales_count = 0

    recent_orders = await db.orders.find({"seller_id": user_id, "created_at": {"$gte": week_start}}).to_list(1000)
    for order in recent_orders:
        days_diff = (order["created_at"].date() - week_start.date()).days
        if 0 <= days_diff <= 6:
            if days_diff == 6:
                today_sales_revenue += order["amount_cents"]
                today_sales_count += 1
            week_sale[days_diff] += 1

    recent_bookings = await db.bookings.find({"owner_id": user_id, "created_at": {"$gte": week_start}}).to_list(1000)
    for booking in recent_bookings:
        days_diff = (booking["created_at"].date() - week_start.date()).days
        if 0 <= days_diff <= 6:
            week_rental[days_diff] += 1

    active_rentals_count = await db.bookings.count_documents({
        "owner_id": user_id, "status": "accepted", "end_date": {"$gte": now.isoformat()}
    })
    pending_returns_count = await db.bookings.count_documents({
        "owner_id": user_id, "status": "accepted", "end_date": {"$lt": now.isoformat()}
    })

    return {
        "anti_waste": {
            "active_baskets": active_baskets_count,
            "pending_pickups": pending_pickups_count,
            "today_revenue_cents": today_sales_revenue,
            "today_sales_count": today_sales_count,
            "week_stats": week_sale,
        },
        "rental": {
            "active_rentals": active_rentals_count,
            "pending_returns": pending_returns_count,
            "today_revenue_cents": 0,
            "week_stats": week_rental,
        },
        "sale": {
            "active_items": active_items_count,
            "today_sales_count": today_sales_count,
            "today_revenue_cents": today_sales_revenue,
            "week_stats": week_sale,
        },
    }


@router.get("/pro/items")
async def get_pro_items(type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_partner"):
        raise HTTPException(status_code=403, detail="Not authorized (Pro only)")

    query = {"owner_id": current_user["id"], "status": {"$ne": "deleted"}}
    if type:
        query["type"] = type

    items = await db.items.find(query).sort("created_at", -1).to_list(100)
    for item in items:
        item["id"] = item.pop("_id")
        item.setdefault("price_cents", 0)
    return {"items": items}


@router.get("/items")
async def get_items(
    type: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = "active",
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    limit: int = 50,
    min_rating: Optional[float] = None,
    radius_km: Optional[float] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    condition: Optional[List[str]] = Query(None),
    sort_by: Optional[str] = "date_desc",
):
    query = {}
    if type:
        query["type"] = type
    if category:
        query["category"] = category
    if status:
        query["status"] = status

    if min_price is not None or max_price is not None:
        price_query = {}
        if min_price is not None:
            price_query["$gte"] = min_price
        if max_price is not None:
            price_query["$lte"] = max_price
        query["price_cents"] = price_query

    if condition:
        query["condition"] = {"$in": condition}

    now = datetime.utcnow()
    await db.items.update_many(
        {"expires_at": {"$lte": now}, "status": "active"},
        {"$set": {"status": "expired"}},
    )

    sort_criteria = [("created_at", -1)]
    if sort_by == "price_asc":
        sort_criteria = [("price_cents", 1)]
    elif sort_by == "price_desc":
        sort_criteria = [("price_cents", -1)]

    items = await db.items.find(query).sort(sort_criteria).limit(limit * 5).to_list(limit * 5)
    filtered_items = []

    for item in items:
        item.pop("_id", None)
        owner = await db.users.find_one({"id": item["owner_id"]})
        if owner:
            owner.pop("password_hash", None)
            owner.pop("_id", None)
            item["owner"] = owner
            if min_rating is not None and (owner.get("ratings_avg") or 0) < min_rating:
                continue

        if lat is not None and lng is not None and "location" in item:
            from location_utils import calculate_distance, reverse_geocode, calculate_proximity_score, format_address_short
            item_lat = item["location"]["lat"]
            item_lng = item["location"]["lng"]
            distance = calculate_distance(lat, lng, item_lat, item_lng)
            item["distance_km"] = distance
            if radius_km is not None and distance > radius_km:
                continue
            user_address = reverse_geocode(lat, lng)
            item_address = reverse_geocode(item_lat, item_lng)
            score, level = calculate_proximity_score(user_address, item_address, distance)
            item["proximity_score"] = score
            item["proximity_level"] = level
            if item_address:
                item["address_short"] = format_address_short(item_address)

        filtered_items.append(item)

    if lat is not None and lng is not None:
        filtered_items.sort(key=lambda x: (-x.get("proximity_score", 0), x.get("distance_km", 999)))

    return filtered_items[:limit]


@router.get("/items/my-items")
async def get_my_items(current_user: dict = Depends(get_current_user)):
    items = await db.items.find(
        {"owner_id": current_user["id"], "status": {"$ne": "deleted"}}
    ).sort("created_at", -1).to_list(100)
    for item in items:
        item.pop("_id", None)
    return items


@router.get("/items/{item_id}")
async def get_item(item_id: str):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.pop("_id", None)

    owner = await db.users.find_one({"id": item["owner_id"]})
    if owner:
        owner.pop("password_hash", None)
        owner.pop("_id", None)
        item["owner"] = owner

    if item.get("store_id"):
        store = await db.stores.find_one({"id": item["store_id"]})
        if store:
            store.pop("_id", None)
            item["store"] = store

    return item


@router.get("/items/{item_id}/co2")
async def get_item_co2_estimate(item_id: str):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.get("co2_estimate"):
        estimate = item["co2_estimate"]
        equivalents = calculate_environmental_equivalents(estimate.get("co2_saved_kg", 0))
        return {**estimate, **equivalents}

    estimate = await estimate_co2_with_ai(
        title=item.get("title", ""),
        description=item.get("description", ""),
        category=item.get("category", "Autre"),
        price_cents=item.get("price_cents"),
        condition=item.get("condition"),
        image_urls=item.get("photos", []),
    )
    await db.items.update_one({"id": item_id}, {"$set": {"co2_estimate": estimate}})
    return {**estimate, **calculate_environmental_equivalents(estimate["co2_saved_kg"])}


@router.post("/co2/estimate")
async def estimate_co2_preview(request: CO2EstimateRequest):
    estimate = await estimate_co2_with_ai(
        title=request.title,
        description=request.description,
        category=request.category,
        price_cents=request.price_cents,
        condition=request.condition,
        image_urls=request.image_urls,
    )
    return {**estimate, **calculate_environmental_equivalents(estimate["co2_saved_kg"])}


@router.put("/items/{item_id}/status")
async def update_item_status(
    item_id: str,
    status: Literal["active", "reserved", "completed", "expired"],
    current_user: dict = Depends(get_current_user),
):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this item")
    await db.items.update_one({"id": item_id}, {"$set": {"status": status}})
    return {"message": "Status updated successfully"}


@router.put("/items/{item_id}")
async def update_item(item_id: str, item_data: ItemCreate, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this item")

    if await db.offers.find_one({"item_id": item_id, "status": {"$in": ["pending", "countered", "accepted"]}}):
        raise HTTPException(status_code=400, detail="Cannot modify item with active offers. Please handle offers first.")

    update_data = {
        "title": item_data.title,
        "description": item_data.description,
        "category": item_data.category,
        "photos": item_data.photos,
        "location": item_data.location.dict() if item_data.location else None,
        "radius_km": item_data.radius_km,
        "updated_at": datetime.utcnow(),
    }
    if item_data.type == "donation":
        update_data.update({
            "food_type": item_data.food_type,
            "urgency_hours": item_data.urgency_hours,
            "expires_at": datetime.utcnow() + timedelta(hours=item_data.urgency_hours) if item_data.urgency_hours else None,
        })
    else:
        update_data.update({"price_cents": item_data.price_cents, "condition": item_data.condition})

    await db.items.update_one({"id": item_id}, {"$set": update_data})
    updated_item = await db.items.find_one({"id": item_id})
    updated_item.pop("_id", None)
    return updated_item


@router.delete("/items/{item_id}")
async def delete_item(item_id: str, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")

    if await db.offers.find_one({"item_id": item_id, "status": {"$in": ["pending", "countered", "accepted"]}}):
        raise HTTPException(status_code=400, detail="Cannot delete item with active offers. Please handle offers first.")
    if await db.orders.find_one({"item_id": item_id, "payment_status": {"$in": ["initiated", "confirmed"]}}):
        raise HTTPException(status_code=400, detail="Cannot delete item with active orders.")

    await db.items.update_one({"id": item_id}, {"$set": {"status": "deleted", "deleted_at": datetime.utcnow()}})
    return {"message": "Item deleted successfully"}


@router.post("/items/{item_id}/boost/free")
async def free_boost_item(item_id: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("co2_saved", 0) < 100:
        raise HTTPException(status_code=403, detail="Le boost gratuit est réservé au niveau Pousse (100+ kg de CO2).")

    now = datetime.utcnow()
    last_reset = user.get("last_boost_reset")
    if last_reset is None or last_reset.month != now.month or last_reset.year != now.year:
        await db.users.update_one({"id": user["id"]}, {"$set": {"free_boosts_available": 1, "last_boost_reset": now}})
        user["free_boosts_available"] = 1

    if user.get("free_boosts_available", 0) <= 0:
        raise HTTPException(status_code=400, detail="Vous avez déjà utilisé votre boost gratuit pour ce mois-ci.")

    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="You can only boost your own items")

    boost_duration = timedelta(days=7)
    current_boost = item.get("boosted_until")
    new_boost_until = (current_boost + boost_duration) if (current_boost and current_boost > now) else (now + boost_duration)

    await db.items.update_one({"id": item_id}, {"$set": {"boosted_until": new_boost_until}})
    await db.users.update_one({"id": user["id"]}, {"$inc": {"free_boosts_available": -1}})

    return {"message": "Utilisation du boost gratuit réussie !", "boosted_until": new_boost_until.isoformat()}


@router.post("/items/{item_id}/boost/checkout")
async def paid_boost_checkout(item_id: str, pack: int = 1, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({"id": item_id})
    if not item or item["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Item not found or unauthorized")

    prices = {1: 199, 3: 499, 5: 799}
    if pack not in prices:
        raise HTTPException(status_code=400, detail="Invalid pack size")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            customer=current_user.get("stripe_customer_id"),
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {"name": f"Boost d'annonce ({pack}x) - {item.get('title', 'Item')}", "description": "Mise en avant pour 7 jours par boost."},
                    "unit_amount": prices[pack],
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"exp://localhost:8081/--/item-detail?id={item_id}&boost_success=true",
            cancel_url=f"exp://localhost:8081/--/item-detail?id={item_id}&boost_cancelled=true",
            metadata={"type": "pay_boost", "item_id": item_id, "user_id": current_user["id"], "boost_pack": str(pack)},
        )
        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    return await handle_stripe_webhook(request, db, stripe_config)
