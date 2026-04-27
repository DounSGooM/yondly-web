import logging
import uuid
from datetime import datetime
from math import radians, cos, sin, asin, sqrt
from typing import Literal, Optional

import stripe
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from models import Deal
from database import db
from auth_utils import get_current_user
from stripe_utils import generate_handoff_code, calculate_platform_fee, get_stripe_config
from notifications_routes import create_notification

logger = logging.getLogger(__name__)
router = APIRouter(tags=["deals"])

stripe_config = get_stripe_config()
stripe.api_key = stripe_config["secret_key"]


class DealCreate(BaseModel):
    title: str
    description: str
    original_price: float
    deal_price: float
    category: Literal["Food", "Flowers", "Other"]
    expires_at: datetime


# ── Deal listing ──────────────────────────────────────────────────────────────

@router.get("/deals")
async def get_deals(lat: float = None, lng: float = None):
    deals = await db.deals.find({"status": "active"}).sort("created_at", -1).to_list(100)
    results = []
    for deal in deals:
        deal.pop("_id", None)
        store = await db.stores.find_one({"id": deal["store_id"]})
        if store:
            store.pop("_id", None)
            if lat is not None and lng is not None and store.get("lat") and store.get("lng"):
                r = 6371
                dlat = radians(store["lat"] - lat)
                dlon = radians(store["lng"] - lng)
                a = sin(dlat / 2) ** 2 + cos(radians(lat)) * cos(radians(store["lat"])) * sin(dlon / 2) ** 2
                store["distance_km"] = round(r * 2 * __import__("math").asin(__import__("math").sqrt(a)), 1)
            deal["store"] = store
        results.append(deal)
    return results


@router.get("/deals/{deal_id}")
async def get_deal(deal_id: str):
    deal = await db.deals.find_one({"id": deal_id})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    deal.pop("_id", None)
    store = await db.stores.find_one({"id": deal["store_id"]})
    if store:
        store.pop("_id", None)
        deal["store"] = store
    return deal


@router.post("/deals", response_model=Deal)
async def create_deal(deal_data: DealCreate, current_user: dict = Depends(get_current_user)):
    store = await db.stores.find_one({"owner_id": current_user["id"]})
    if not store:
        raise HTTPException(status_code=400, detail="User must have a registered store to post deals")

    discount_val = int(((deal_data.original_price - deal_data.deal_price) / deal_data.original_price) * 100)
    deal_id = str(uuid.uuid4())
    new_deal = {
        "id": deal_id,
        "store_id": store.get("id") or str(store["_id"]),
        "title": deal_data.title,
        "description": deal_data.description,
        "original_price": deal_data.original_price,
        "deal_price": deal_data.deal_price,
        "discount_value": discount_val,
        "discount_type": "percentage",
        "category": deal_data.category,
        "status": "active",
        "created_at": datetime.utcnow(),
        "expires_at": deal_data.expires_at,
    }
    await db.deals.insert_one(new_deal)
    return new_deal


# ── Deal orders ───────────────────────────────────────────────────────────────

@router.post("/deals/{deal_id}/order")
async def create_deal_order(
    deal_id: str,
    is_suspension_gift: bool = False,
    current_user: dict = Depends(get_current_user),
):
    deal = await db.deals.find_one({"id": deal_id})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal["status"] != "active":
        raise HTTPException(status_code=400, detail="Deal is no longer active")

    store = await db.stores.find_one({"id": deal["store_id"]})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    pickup_code = generate_handoff_code()
    amount_cents = int(deal["deal_price"] * 100) if isinstance(deal["deal_price"], float) else deal["deal_price"]
    fee_info = calculate_platform_fee(amount_cents)

    order_id = str(uuid.uuid4())
    order_doc = {
        "id": order_id,
        "item_id": deal_id,
        "buyer_id": current_user["id"],
        "seller_id": store["owner_id"],
        "amount_cents": fee_info["amount_cents"],
        "platform_fee_cents": fee_info["platform_fee_cents"],
        "payout_cents": fee_info["payout_cents"],
        "payment_status": "released",
        "type": "suspension_gift" if is_suspension_gift else "deal",
        "store_id": store["id"],
        "handoff": {"mode": "store_pickup", "code": None if is_suspension_gift else pickup_code, "photo_url": None},
        "created_at": datetime.utcnow(),
    }

    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=order_doc["amount_cents"],
            currency="eur",
            metadata={"order_id": order_id, "type": order_doc["type"]},
            automatic_payment_methods={"enabled": True},
        )
        order_doc["payment_intent_id"] = payment_intent.id
        client_secret = payment_intent.client_secret
    except Exception as e:
        logger.error(f"Stripe error: {e}")
        client_secret = "mock_secret"

    await db.orders.insert_one(order_doc)

    if is_suspension_gift:
        await db.deals.update_one({"id": deal_id}, {"$inc": {"suspended_quantity": 1, "suspended_available": 1}})
    else:
        new_remaining = deal.get("remaining", 1) - 1
        if new_remaining <= 0:
            await db.deals.update_one({"id": deal_id}, {"$set": {"status": "sold", "remaining": 0}})
        else:
            await db.deals.update_one({"id": deal_id}, {"$set": {"remaining": new_remaining}})

    order_doc.pop("_id", None)
    order_doc["client_secret"] = client_secret
    return order_doc


@router.post("/deals/{deal_id}/claim-suspended")
async def claim_suspended_deal(
    deal_id: str,
    quantity: int = 1,
    current_user: dict = Depends(get_current_user),
):
    is_association = current_user.get("is_association", False)
    is_beneficiary_claim = False

    if is_association:
        if not current_user.get("association_verified", False):
            raise HTTPException(status_code=403, detail="Votre association doit être vérifiée par un administrateur")
    else:
        beneficiary = await db.beneficiaries.find_one({"linked_user_id": current_user["id"], "is_active": True})
        if not beneficiary:
            raise HTTPException(status_code=403, detail="Accès réservé aux associations et bénéficiaires habilités")
        if not beneficiary.get("allow_self_service", False):
            raise HTTPException(status_code=403, detail="Votre association ne vous a pas activé le Mode Autonomie")
        is_beneficiary_claim = True

    if quantity < 1:
        raise HTTPException(status_code=400, detail="La quantité doit être au moins 1")

    if is_association:
        DAILY_QUOTA = 10
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_claims = await db.orders.aggregate([
            {"$match": {"buyer_id": current_user["id"], "type": "suspension_claim", "created_at": {"$gte": today_start}}},
            {"$group": {"_id": None, "total_quantity": {"$sum": "$quantity"}}},
        ]).to_list(1)
        claimed_today = today_claims[0]["total_quantity"] if today_claims else 0
        if claimed_today + quantity > DAILY_QUOTA:
            raise HTTPException(status_code=429, detail=f"Quota journalier dépassé ({DAILY_QUOTA} paniers/jour)")

    deal = await db.deals.find_one({"id": deal_id})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    available = deal.get("suspended_available", 0)
    if available < quantity:
        raise HTTPException(status_code=400, detail=f"Seulement {available} panier(s) suspendu(s) disponible(s)")

    store = await db.stores.find_one({"id": deal["store_id"]})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    order_id = str(uuid.uuid4())
    order_doc = {
        "id": order_id,
        "item_id": deal_id,
        "buyer_id": current_user["id"],
        "seller_id": store["owner_id"],
        "amount_cents": 0,
        "platform_fee_cents": 0,
        "payout_cents": 0,
        "payment_status": "released",
        "type": "suspension_claim",
        "quantity": quantity,
        "store_id": store["id"],
        "handoff": {"mode": "store_pickup", "code": generate_handoff_code(), "photo_url": None},
        "created_at": datetime.utcnow(),
    }

    if is_beneficiary_claim:
        order_doc["beneficiary_id"] = beneficiary["id"]
        order_doc["beneficiary_name"] = beneficiary.get("first_name", "") + " " + beneficiary.get("last_name", "")

    await db.orders.insert_one(order_doc)
    await db.deals.update_one({"id": deal_id}, {"$inc": {"suspended_available": -quantity}})

    order_doc.pop("_id", None)
    return {
        "success": True,
        "order": order_doc,
        "message": f"{quantity} panier(s) suspendu(s) réservé(s) avec succès",
        "pickup_code": order_doc["handoff"]["code"],
    }
