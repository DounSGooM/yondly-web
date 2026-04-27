from fastapi import APIRouter, HTTPException, Depends

from database import db
from auth_utils import get_current_user

router = APIRouter(tags=["sponsors"])


async def _get_next_sponsor():
    sponsors = await db.sponsors.find({"active": True}).sort("display_count", 1).to_list(100)
    if not sponsors:
        return None
    sponsor = sponsors[0]
    await db.sponsors.update_one({"id": sponsor["id"]}, {"$inc": {"display_count": 1}})
    sponsor.pop("_id", None)
    return sponsor


@router.get("/sponsors/current")
async def get_current_sponsor_for_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["buyer_id"] != current_user["id"] and order["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if order["amount_cents"] > 0:
        return {"message": "This is not a donation, no sponsor"}

    if order.get("sponsor_id"):
        sponsor = await db.sponsors.find_one({"id": order["sponsor_id"]})
        if sponsor:
            sponsor.pop("_id", None)
            return sponsor

    sponsor = await _get_next_sponsor()
    if not sponsor:
        raise HTTPException(status_code=404, detail="No active sponsors available")

    await db.orders.update_one({"id": order_id}, {"$set": {"sponsor_id": sponsor["id"]}})
    return sponsor


@router.post("/sponsors/mark-shown/{order_id}")
async def mark_sponsor_shown(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["buyer_id"] != current_user["id"] and order["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.orders.update_one({"id": order_id}, {"$set": {"sponsor_shown": True}})
    return {"message": "Sponsor marked as shown"}
