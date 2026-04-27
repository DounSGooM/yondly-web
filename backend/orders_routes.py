import logging
import uuid
from datetime import datetime
from typing import Optional

import stripe
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from models import OrderCreate, RatingCreate
from database import db, client
from auth_utils import get_current_user
from stripe_utils import calculate_platform_fee, generate_handoff_code, hash_handoff_code, get_stripe_config
from co2_estimator import get_base_co2_estimate
from gamification import check_and_update_level
from notifications_routes import create_notification

logger = logging.getLogger(__name__)
router = APIRouter(tags=["orders"])

stripe_config = get_stripe_config()
stripe.api_key = stripe_config["secret_key"]


@router.post("/orders")
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({"id": order_data.item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item["type"] not in ["sale", "donation"]:
        raise HTTPException(status_code=400, detail="Can only create orders for sale or donation items")
    if item["status"] != "active":
        raise HTTPException(status_code=400, detail="Item is not available")
    if item["owner_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot reserve your own item")

    is_donation = item["type"] == "donation"
    price_cents = 0 if is_donation else item.get("price_cents", 0)

    if not is_donation:
        offer = await db.offers.find_one({
            "item_id": item["id"],
            "buyer_id": current_user["id"],
            "status": "accepted",
            "expires_at": {"$gt": datetime.utcnow()},
        })
        if offer:
            negotiated_price = offer.get("counter_offer_amount_cents") or offer.get("amount_cents")
            if negotiated_price:
                price_cents = negotiated_price

    seller_user = await db.users.find_one({"id": item["owner_id"]})
    seller_level = seller_user.get("level", "Novice") if seller_user else "Novice"
    fee_info = calculate_platform_fee(price_cents, seller_level) if price_cents > 0 else {
        "platform_fee_cents": 0, "payout_cents": 0
    }

    handoff_code = generate_handoff_code()
    order_id = str(uuid.uuid4())
    order_dict = {
        "id": order_id,
        "item_id": item["id"],
        "buyer_id": current_user["id"],
        "seller_id": item["owner_id"],
        "amount_cents": price_cents,
        "platform_fee_cents": fee_info["platform_fee_cents"],
        "payout_cents": fee_info["payout_cents"],
        "payment_status": "escrowed" if is_donation else "initiated",
        "payment_intent_id": None,
        "handoff": {"mode": "local", "code": handoff_code, "photo_url": None},
        "dispute_status": None,
        "created_at": datetime.utcnow(),
    }

    try:
        client_secret = None
        if stripe_config["secret_key"].startswith("sk_test_") and len(stripe_config["secret_key"]) > 20:
            try:
                transfer_data = None
                if seller_user and seller_user.get("stripe_account_id", "").startswith("acct_"):
                    transfer_data = {"destination": seller_user["stripe_account_id"]}

                try:
                    payment_intent = stripe.PaymentIntent.create(
                        amount=item["price_cents"],
                        currency="eur",
                        payment_method_types=["card"],
                        transfer_data=transfer_data,
                        application_fee_amount=fee_info["platform_fee_cents"] if transfer_data else None,
                        metadata={"order_id": order_id, "item_id": item["id"], "buyer_id": current_user["id"], "seller_id": item["owner_id"]},
                    )
                except stripe.error.InvalidRequestError as e:
                    if transfer_data:
                        logger.warning(f"Stripe Connect failed ({e}), falling back to Direct Charge.")
                        payment_intent = stripe.PaymentIntent.create(
                            amount=item["price_cents"],
                            currency="eur",
                            payment_method_types=["card"],
                            metadata={"order_id": order_id, "item_id": item["id"], "buyer_id": current_user["id"], "seller_id": item["owner_id"], "fallback": "true"},
                        )
                    else:
                        raise

                order_dict["payment_intent_id"] = payment_intent.id
                client_secret = payment_intent.client_secret
            except Exception as stripe_e:
                logger.error(f"Stripe error: {stripe_e}")

        order_dict["client_secret"] = client_secret
        await db.orders.insert_one(order_dict)
        order_dict.pop("_id", None)

        notif_title = "🎁 Demande de don !" if is_donation else "🛒 Nouvelle réservation !"
        notif_message = (
            f"Quelqu'un souhaite récupérer votre don '{item['title']}'."
            if is_donation
            else f"Votre article '{item['title']}' a été réservé par un acheteur."
        )
        await create_notification(
            user_id=item["owner_id"],
            notif_type="order_status",
            title=notif_title,
            message=notif_message,
            data={"order_id": order_id, "item_id": item["id"]},
        )

        return order_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")


@router.get("/orders")
async def get_orders(role: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"$or": [{"buyer_id": current_user["id"]}, {"seller_id": current_user["id"]}]}
    if role == "buyer":
        query = {"buyer_id": current_user["id"]}
    elif role == "seller":
        query = {"seller_id": current_user["id"]}

    orders = await db.orders.find(query).sort("created_at", -1).to_list(100)
    for order in orders:
        order.pop("_id", None)
        if order.get("type") == "deal":
            item = await db.deals.find_one({"id": order["item_id"]})
            if item:
                store = await db.stores.find_one({"id": item["store_id"]})
                if store:
                    item["store_name"] = store["name"]
        else:
            item = await db.items.find_one({"id": order["item_id"]})
        if item:
            item.pop("_id", None)
            order["item"] = item
    return orders


@router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["buyer_id"] != current_user["id"] and order["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    order.pop("_id", None)
    item = await db.deals.find_one({"id": order["item_id"]}) if order.get("type") == "deal" else await db.items.find_one({"id": order["item_id"]})
    if item:
        item.pop("_id", None)
        order["item"] = item
    return order


@router.post("/orders/{order_id}/confirm-payment")
async def confirm_payment(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["buyer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.orders.update_one({"id": order_id}, {"$set": {"payment_status": "escrowed"}})
    await db.items.update_one({"id": order["item_id"]}, {"$set": {"status": "reserved"}})

    item_doc = await db.items.find_one({"id": order["item_id"]})
    item_title = item_doc.get("title", "Article") if item_doc else "Article"
    await create_notification(
        user_id=order["seller_id"],
        notif_type="new_order",
        title="🎉 Nouvelle commande !",
        message=f"Votre article '{item_title}' a été réservé ! Préparez-le pour le retrait.",
        data={"order_id": order_id},
    )
    return {"message": "Payment confirmed", "status": "escrowed"}


@router.post("/orders/{order_id}/generate-handoff")
async def generate_handoff(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["buyer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only buyer can generate code")

    code = generate_handoff_code()
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"handover_status": "pending", "handover_code_hash": hash_handoff_code(code), "handover_generated_at": datetime.utcnow()}},
    )
    return {"code": code}


@router.post("/orders/{order_id}/confirm-handoff")
async def confirm_handoff(order_id: str, code: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only seller can complete handoff")

    stored_hash = order.get("handover_code_hash")
    verified = (
        hash_handoff_code(code.upper()) == stored_hash
        if stored_hash
        else order.get("handoff", {}).get("code") == code.upper()
    )
    if not verified:
        raise HTTPException(status_code=400, detail="Invalid handoff code")

    payout_amount = order["payout_cents"]
    seller_id = order["seller_id"]
    tx_dict = {
        "id": str(uuid.uuid4()),
        "user_id": seller_id,
        "amount_cents": payout_amount,
        "type": "sale",
        "status": "completed",
        "reference_id": order_id,
        "description": "Vente",
        "created_at": datetime.utcnow(),
    }

    async with await client.start_session() as session:
        async with session.start_transaction():
            await db.orders.update_one(
                {"id": order_id},
                {"$set": {"payment_status": "released", "handover_status": "confirmed", "status": "completed"}},
                session=session,
            )
            if "item_id" in order:
                await db.items.update_one({"id": order["item_id"]}, {"$set": {"status": "completed"}}, session=session)
            await db.users.update_one({"id": seller_id}, {"$inc": {"wallet_balance_cents": payout_amount}}, session=session)
            await db.transactions.insert_one(tx_dict, session=session)

    await create_notification(user_id=order["buyer_id"], notif_type="order_completed", title="✅ Retrait confirmé", message="Vous avez récupéré votre commande. Merci pour votre achat !", data={"order_id": order_id})
    await create_notification(user_id=seller_id, notif_type="funds_released", title="💰 Paiement débloqué", message=f"La remise est confirmée. {payout_amount/100:.2f}€ ajoutés à votre porte-monnaie.", data={"order_id": order_id})

    co2_kg = 0
    item_title = "Article"
    item_type = "sale"
    try:
        item = await db.items.find_one({"id": order["item_id"]})
        buyer_id = order.get("buyer_id")
        if item:
            item_title = item.get("title", "Article")
            item_type = item.get("type", "sale")
            co2_kg = item.get("co2_estimate", {}).get("co2_saved_kg", 0) or get_base_co2_estimate(item.get("category", "Autre"), title=item.get("title", ""), description=item.get("description", ""))
        if co2_kg > 0:
            await db.users.update_one({"id": seller_id}, {"$inc": {"co2_saved": co2_kg}})
            await check_and_update_level(seller_id, db)
            if buyer_id:
                await db.users.update_one({"id": buyer_id}, {"$inc": {"co2_saved": co2_kg}})
                await check_and_update_level(buyer_id, db)
    except Exception as e:
        logger.debug(f"CO2 update failed: {e}")

    try:
        from analytics_routes import track_event_internal
        mode_map = {"donation": "don", "sale": "vente", "rent": "location"}
        if item:
            await track_event_internal(
                user_id=seller_id, event_name="transaction_completed",
                territory_type="code_postal", territory_code="00000",
                mode=mode_map.get(item.get("type", "sale")),
                category=item.get("category"), estimated_value=payout_amount / 100,
            )
    except Exception:
        pass

    return {"message": "Handoff completed successfully", "payout_cents": payout_amount, "status": "released", "co2_kg": co2_kg, "item_title": item_title, "item_type": item_type}


@router.get("/orders/{order_id}/can-rate")
async def check_can_rate(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["buyer_id"] != current_user["id"]:
        return {"can_rate": False, "reason": "only_buyer"}
    if order.get("payment_status") != "released":
        return {"can_rate": False, "reason": "not_completed"}
    if await db.ratings.find_one({"order_id": order_id}):
        return {"can_rate": False, "reason": "already_rated"}
    return {"can_rate": True, "seller_id": order["seller_id"]}


@router.post("/ratings")
async def submit_rating(data: RatingCreate, current_user: dict = Depends(get_current_user)):
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    order = await db.orders.find_one({"id": data.order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["buyer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only buyer can rate this order")
    if order.get("payment_status") != "released":
        raise HTTPException(status_code=400, detail="Order not completed yet")
    if await db.ratings.find_one({"order_id": data.order_id}):
        raise HTTPException(status_code=400, detail="Already rated this order")

    rating_id = str(uuid.uuid4())
    await db.ratings.insert_one({
        "id": rating_id,
        "order_id": data.order_id,
        "reviewer_id": current_user["id"],
        "reviewed_id": order["seller_id"],
        "rating": data.rating,
        "comment": data.comment,
        "created_at": datetime.utcnow(),
    })

    seller_id = order["seller_id"]
    all_ratings = await db.ratings.find({"reviewed_id": seller_id}).to_list(1000)
    total = sum(r["rating"] for r in all_ratings)
    count = len(all_ratings)
    new_avg = round(total / count, 2) if count > 0 else 0.0
    await db.users.update_one({"id": seller_id}, {"$set": {"ratings_avg": new_avg, "ratings_count": count}})

    await create_notification(
        user_id=seller_id,
        notif_type="rating_received",
        title="⭐ Nouvel avis reçu !",
        message=f"Vous avez reçu une note de {data.rating}/5.",
        data={"rating_id": rating_id, "order_id": data.order_id},
    )
    return {"message": "Rating submitted", "new_avg": new_avg, "count": count}


class PickupValidation(BaseModel):
    pickup_code: str


@router.post("/orders/validate-pickup")
async def validate_pickup_by_code(data: PickupValidation, current_user: dict = Depends(get_current_user)):
    code = data.pickup_code.upper().strip()
    order = await db.orders.find_one({"handoff.code": code, "payment_status": {"$in": ["escrowed", "initiated"]}})
    if not order:
        raise HTTPException(status_code=404, detail="Code invalide ou commande introuvable")
    if order["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Ce code n'appartient pas à votre boutique")

    buyer = await db.users.find_one({"id": order["buyer_id"]})
    item = await db.items.find_one({"id": order["item_id"]})
    payout_amount = order.get("payout_cents", 0)
    seller_id = order["seller_id"]
    order_id = order["id"]

    await db.orders.update_one({"id": order_id}, {"$set": {"payment_status": "released"}})
    if item:
        await db.items.update_one({"id": order["item_id"]}, {"$set": {"status": "completed"}})
    await db.users.update_one({"id": seller_id}, {"$inc": {"wallet_balance_cents": payout_amount}})
    await db.transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": seller_id,
        "amount_cents": payout_amount,
        "type": "sale",
        "status": "completed",
        "reference_id": order_id,
        "description": f"Vente: {item.get('title', 'Panier Surprise') if item else 'Panier Surprise'}",
        "created_at": datetime.utcnow(),
    })

    await create_notification(user_id=order["buyer_id"], notif_type="order_completed", title="✅ Retrait validé", message="Le vendeur a validé le retrait. Merci pour votre achat !", data={"order_id": order_id})
    await create_notification(user_id=seller_id, notif_type="funds_released", title="💰 Vente terminée", message=f"Le retrait est validé ! {payout_amount/100:.2f}€ ont été crédités sur votre compte.", data={"order_id": order_id})

    try:
        co2_kg = 0
        if item:
            co2_kg = item.get("co2_estimate", {}).get("co2_saved_kg", 0) or get_base_co2_estimate(item.get("category", "Autre"), title=item.get("title", ""), description=item.get("description", ""))
        if co2_kg > 0:
            await db.users.update_one({"id": seller_id}, {"$inc": {"co2_saved": co2_kg}})
            buyer_id = order.get("buyer_id")
            if buyer_id:
                await db.users.update_one({"id": buyer_id}, {"$inc": {"co2_saved": co2_kg}})
    except Exception as e:
        logger.debug(f"CO2 update failed: {e}")

    return {
        "success": True,
        "order_id": order_id,
        "buyer_name": buyer.get("display_name", "Client") if buyer else "Client",
        "item_title": item.get("title", "Panier Surprise") if item else "Panier Surprise",
        "amount_cents": order.get("amount_cents", 0),
        "payout_cents": payout_amount,
    }
