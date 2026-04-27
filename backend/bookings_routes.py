import uuid
from datetime import datetime, date

from fastapi import APIRouter, HTTPException, Depends, status

from models import BookingCreate
from database import db
from auth_utils import get_current_user
from gamification import award_points
from notifications_routes import create_notification

router = APIRouter(tags=["bookings"])


@router.post("/bookings", status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingCreate, current_user: dict = Depends(get_current_user)):
    item_doc = await db.items.find_one({"id": booking.item_id})
    if not item_doc:
        raise HTTPException(status_code=404, detail="Item not found")
    if item_doc.get("type") != "rent":
        raise HTTPException(status_code=400, detail="Item is not available for rent")
    if item_doc.get("owner_id") == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot book your own item")

    try:
        start = datetime.fromisoformat(booking.start_date).date()
        end = datetime.fromisoformat(booking.end_date).date()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    today = date.today()
    if start < today:
        raise HTTPException(status_code=400, detail="Start date cannot be in the past")
    if end <= start:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    existing_bookings = await db.bookings.find({
        "item_id": booking.item_id,
        "status": {"$in": ["pending", "accepted"]},
    }).to_list(None)

    for existing in existing_bookings:
        existing_start = datetime.fromisoformat(existing["start_date"]).date()
        existing_end = datetime.fromisoformat(existing["end_date"]).date()
        if not (end < existing_start or start > existing_end):
            raise HTTPException(status_code=409, detail="Dates conflict with existing booking")

    days = (end - start).days
    total_price = days * item_doc.get("price_per_day_cents", 0)
    booking_id = str(uuid.uuid4())

    booking_doc = {
        "_id": booking_id,
        "item_id": booking.item_id,
        "renter_id": current_user["id"],
        "owner_id": item_doc["owner_id"],
        "start_date": booking.start_date,
        "end_date": booking.end_date,
        "status": "pending",
        "total_price_cents": total_price,
        "deposit_cents": item_doc.get("deposit_cents", 0),
        "message": booking.message,
        "created_at": datetime.utcnow(),
        "updated_at": None,
    }

    await db.bookings.insert_one(booking_doc)
    booking_doc["id"] = booking_doc.pop("_id")

    start_formatted = datetime.fromisoformat(booking.start_date).strftime("%d/%m/%Y")
    end_formatted = datetime.fromisoformat(booking.end_date).strftime("%d/%m/%Y")
    message_text = f"📅 Nouvelle demande de réservation pour '{item_doc['title']}'\n\nDu {start_formatted} au {end_formatted}\nTotal: {(total_price / 100):.2f}€"
    if booking.message:
        message_text += f"\n\nMessage: {booking.message}"

    await db.messages.insert_one({
        "id": str(uuid.uuid4()),
        "item_id": booking.item_id,
        "from_id": current_user["id"],
        "to_id": item_doc["owner_id"],
        "text": message_text,
        "booking_id": booking_id,
        "created_at": datetime.utcnow(),
    })

    await award_points(current_user["id"], 50)

    await create_notification(
        user_id=item_doc["owner_id"],
        notif_type="new_booking",
        title="📅 Nouvelle demande de réservation",
        message=f"Demande de réservation pour '{item_doc['title']}' du {start_formatted} au {end_formatted}",
        data={"booking_id": booking_id, "item_id": booking.item_id},
    )

    return booking_doc


@router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["renter_id"] != current_user["id"] and booking["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    booking["id"] = booking.pop("_id")
    return booking


@router.get("/bookings/item/{item_id}")
async def get_item_bookings(item_id: str):
    bookings = await db.bookings.find({
        "item_id": item_id,
        "status": {"$in": ["pending", "accepted"]},
    }).to_list(None)
    for b in bookings:
        b["id"] = b.pop("_id")
    return bookings


@router.get("/bookings/my")
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    bookings = await db.bookings.find({
        "$or": [{"renter_id": current_user["id"]}, {"owner_id": current_user["id"]}]
    }).sort("created_at", -1).to_list(None)

    for booking in bookings:
        booking["id"] = booking.pop("_id")
        item_doc = await db.items.find_one({"id": booking["item_id"]})
        if item_doc:
            item_doc["id"] = item_doc.pop("_id", item_doc.get("id"))
            booking["item"] = item_doc
        renter_doc = await db.users.find_one({"id": booking["renter_id"]})
        if renter_doc:
            renter_doc.pop("password_hash", None)
            renter_doc.pop("_id", None)
            booking["renter"] = renter_doc

    return bookings


@router.put("/bookings/{booking_id}/accept")
async def accept_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the owner can accept bookings")
    if booking["status"] != "pending":
        raise HTTPException(status_code=400, detail="Booking is not pending")

    await db.bookings.update_one({"_id": booking_id}, {"$set": {"status": "accepted", "updated_at": datetime.utcnow()}})
    booking["status"] = "accepted"
    booking["id"] = booking.pop("_id")
    return booking


@router.put("/bookings/{booking_id}/decline")
async def decline_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the owner can decline bookings")
    if booking["status"] != "pending":
        raise HTTPException(status_code=400, detail="Booking is not pending")

    await db.bookings.update_one({"_id": booking_id}, {"$set": {"status": "declined", "updated_at": datetime.utcnow()}})
    booking["status"] = "declined"
    booking["id"] = booking.pop("_id")
    return booking


@router.put("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["renter_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the renter can cancel bookings")
    if booking["status"] in ["cancelled", "completed", "declined"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel a {booking['status']} booking")

    await db.bookings.update_one({"_id": booking_id}, {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}})
    booking["status"] = "cancelled"
    booking["id"] = booking.pop("_id")
    return booking
