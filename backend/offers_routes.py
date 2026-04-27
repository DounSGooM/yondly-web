import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Depends

from models import OfferCreate
from database import db
from auth_utils import get_current_user
from notifications_routes import create_notification

router = APIRouter(tags=["offers"])


@router.post("/offers")
async def create_offer(offer_data: OfferCreate, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({"id": offer_data.item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not item.get("allow_offers"):
        raise HTTPException(status_code=400, detail="Item does not accept offers")
    if item["owner_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot make offer on your own item")

    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    if await db.offers.count_documents({
        "item_id": item["id"],
        "buyer_id": current_user["id"],
        "created_at": {"$gte": twenty_four_hours_ago},
    }) >= 1:
        raise HTTPException(status_code=429, detail="Vous avez déjà fait une offre sur cet article dans les dernières 24h.")

    if await db.offers.count_documents({"buyer_id": current_user["id"], "status": "pending"}) >= 2:
        raise HTTPException(status_code=429, detail="Vous avez déjà 2 offres en attente. Attendez qu'elles soient traitées avant d'en faire une nouvelle.")

    offer_id = str(uuid.uuid4())
    offer_dict = {
        "id": offer_id,
        "item_id": item["id"],
        "buyer_id": current_user["id"],
        "amount_cents": offer_data.amount_cents,
        "days": offer_data.days if item.get("type") == "rent" else None,
        "status": "pending",
        "created_at": datetime.utcnow(),
    }
    await db.offers.insert_one(offer_dict)

    base_price = item.get("price_per_day_cents") if item.get("type") == "rent" else item.get("price_cents", 0)
    percentage = ((base_price - offer_data.amount_cents) / base_price) * 100 if base_price and base_price > 0 else 0
    price_suffix = "/jour" if item.get("type") == "rent" else ""
    message_text = f"💰 Offre de {(offer_data.amount_cents / 100):.2f}€{price_suffix} (-{percentage:.0f}%) pour {item['title']}"

    message_id = str(uuid.uuid4())
    await db.messages.insert_one({
        "id": message_id,
        "item_id": item["id"],
        "from_id": current_user["id"],
        "to_id": item["owner_id"],
        "text": message_text,
        "offer_id": offer_id,
        "created_at": datetime.utcnow(),
    })

    await create_notification(
        user_id=item["owner_id"],
        notif_type="new_offer",
        title="💰 Nouvelle offre !",
        message=f"Vous avez reçu une offre de {(offer_data.amount_cents / 100):.2f}€ pour '{item['title']}'",
        data={"item_id": item["id"], "offer_id": offer_id, "amount_cents": offer_data.amount_cents, "message_id": message_id},
    )

    offer_dict.pop("_id", None)
    return offer_dict


@router.get("/offers/{offer_id}")
async def get_offer(offer_id: str, current_user: dict = Depends(get_current_user)):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    item = await db.items.find_one({"id": offer["item_id"]})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if offer["buyer_id"] != current_user["id"] and item["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    offer.pop("_id", None)
    return offer


@router.get("/offers/item/{item_id}")
async def get_item_offers(item_id: str, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    query = {"item_id": item_id}
    if item["owner_id"] != current_user["id"]:
        query["buyer_id"] = current_user["id"]

    offers = await db.offers.find(query).sort("created_at", -1).to_list(100)
    for offer in offers:
        offer.pop("_id", None)
        buyer = await db.users.find_one({"id": offer["buyer_id"]})
        if buyer:
            buyer.pop("password_hash", None)
            buyer.pop("_id", None)
            offer["buyer"] = buyer
    return offers


@router.put("/offers/{offer_id}/accept")
async def accept_offer(offer_id: str, current_user: dict = Depends(get_current_user)):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    item = await db.items.find_one({"id": offer["item_id"]})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    is_seller = item["owner_id"] == current_user["id"]
    is_buyer = offer["buyer_id"] == current_user["id"]

    if offer["status"] == "pending" and not is_seller:
        raise HTTPException(status_code=403, detail="Only seller can accept initial offer")
    elif offer["status"] == "countered" and not is_buyer:
        raise HTTPException(status_code=403, detail="Only buyer can accept counter-offer")
    elif offer["status"] not in ["pending", "countered"]:
        raise HTTPException(status_code=400, detail=f"Cannot accept offer with status {offer['status']}")

    accepted_at = datetime.utcnow()
    expires_at = accepted_at + timedelta(hours=4)
    final_amount = offer.get("counter_offer_amount_cents", offer["amount_cents"])

    await db.offers.update_one(
        {"id": offer_id},
        {"$set": {"status": "accepted", "accepted_at": accepted_at, "expires_at": expires_at}},
    )

    buyer_id = offer["buyer_id"] if is_seller else item["owner_id"]
    await create_notification(
        user_id=buyer_id,
        notif_type="offer_accepted",
        title="✅ Offre acceptée !",
        message=f"Votre offre de {(final_amount / 100):.2f}€ a été acceptée ! Procédez au paiement dans les 4h.",
        data={"item_id": item["id"], "offer_id": offer_id, "expires_at": expires_at.isoformat()},
    )

    return {
        "message": "Offer accepted",
        "expires_at": expires_at.isoformat(),
        "locked_until": expires_at.isoformat(),
        "offer_amount": final_amount,
    }


@router.put("/offers/{offer_id}/decline")
async def decline_offer(offer_id: str, current_user: dict = Depends(get_current_user)):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    item = await db.items.find_one({"id": offer["item_id"]})
    if not item or item["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.offers.update_one({"id": offer_id}, {"$set": {"status": "declined"}})
    return {"message": "Offer declined"}


@router.put("/offers/{offer_id}/counter")
async def counter_offer(offer_id: str, counter_amount_cents: int, current_user: dict = Depends(get_current_user)):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    item = await db.items.find_one({"id": offer["item_id"]})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if counter_amount_cents <= offer["amount_cents"] or counter_amount_cents >= item["price_cents"]:
        raise HTTPException(status_code=400, detail="Counter offer must be between the original offer and the item price")

    await db.offers.update_one(
        {"id": offer_id},
        {"$set": {"counter_offer_amount_cents": counter_amount_cents, "status": "countered"}},
    )

    percentage_from_price = ((item["price_cents"] - counter_amount_cents) / item["price_cents"]) * 100
    message_text = f"🔄 Contre-offre: {(counter_amount_cents / 100):.2f}€ (-{percentage_from_price:.0f}%) pour {item['title']}"
    message_id = str(uuid.uuid4())
    await db.messages.insert_one({
        "id": message_id,
        "item_id": item["id"],
        "from_id": current_user["id"],
        "to_id": offer["buyer_id"],
        "text": message_text,
        "offer_id": offer_id,
        "created_at": datetime.utcnow(),
    })

    await create_notification(
        user_id=offer["buyer_id"],
        notif_type="counter_offer",
        title="🔄 Contre-offre reçue",
        message=f"Le vendeur propose {(counter_amount_cents / 100):.2f}€ pour '{item['title']}'",
        data={"item_id": item["id"], "offer_id": offer_id, "amount_cents": counter_amount_cents, "message_id": message_id},
    )

    return {"message": "Counter offer sent", "counter_amount_cents": counter_amount_cents}
