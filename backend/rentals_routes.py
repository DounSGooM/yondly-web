import logging
import uuid
from datetime import datetime
from typing import List, Optional

import stripe
from fastapi import APIRouter, HTTPException, Depends

from models import RentalBookingCreate, InspectionReport
from database import db
from auth_utils import get_current_user
from stripe_utils import calculate_platform_fee, generate_handoff_code, get_stripe_config
from notifications_routes import create_notification
from push_service import send_push_notification

logger = logging.getLogger(__name__)
router = APIRouter(tags=["rentals"])

stripe_config = get_stripe_config()
stripe.api_key = stripe_config["secret_key"]


async def _get_or_create_stripe_customer(user: dict) -> str:
    if user.get("stripe_customer_id"):
        return user["stripe_customer_id"]
    try:
        customer = stripe.Customer.create(
            email=user.get("email"),
            name=user.get("display_name"),
            metadata={"user_id": user["id"]},
        )
        await db.users.update_one({"id": user["id"]}, {"$set": {"stripe_customer_id": customer.id}})
        return customer.id
    except Exception as e:
        logger.error(f"Failed to create Stripe customer: {e}")
        raise HTTPException(status_code=500, detail="Payment setup failed")


@router.post("/rentals")
async def create_rental(booking: RentalBookingCreate, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({"id": booking.item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item["type"] != "rent":
        raise HTTPException(status_code=400, detail="This item is not available for rent")
    if item["status"] != "active":
        raise HTTPException(status_code=400, detail="Item is not available")
    if item["owner_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot rent your own item")

    if booking.start_date >= booking.end_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    today = datetime.utcnow().date()
    if booking.start_date.date() < today:
        raise HTTPException(status_code=400, detail="Start date cannot be in the past")

    overlap = await db.rentals.find_one({
        "item_id": booking.item_id,
        "status": {"$in": ["pending", "confirmed", "active"]},
        "$or": [{"start_date": {"$lt": booking.end_date}, "end_date": {"$gt": booking.start_date}}],
    })
    if overlap:
        raise HTTPException(status_code=400, detail="These dates are already booked")

    duration_days = max((booking.end_date - booking.start_date).days, 1)
    price_per_day_cents = item.get("price_per_day_cents", 0)

    offer = await db.offers.find_one({
        "item_id": item["id"],
        "buyer_id": current_user["id"],
        "status": "accepted",
        "expires_at": {"$gt": datetime.utcnow()},
    })
    if offer:
        negotiated_price = offer.get("counter_offer_amount_cents") or offer.get("amount_cents")
        if negotiated_price:
            price_per_day_cents = negotiated_price

    deposit_cents = item.get("deposit_cents", 0)
    total_price_cents = price_per_day_cents * duration_days
    fee_info = calculate_platform_fee(total_price_cents)

    pickup_code = generate_handoff_code()
    return_code = generate_handoff_code()

    rental_id = str(uuid.uuid4())
    rental_dict = {
        "id": rental_id,
        "item_id": item["id"],
        "renter_id": current_user["id"],
        "owner_id": item["owner_id"],
        "start_date": booking.start_date,
        "end_date": booking.end_date,
        "duration_days": duration_days,
        "price_per_day_cents": price_per_day_cents,
        "total_price_cents": total_price_cents,
        "deposit_cents": deposit_cents,
        "platform_fee_cents": fee_info["platform_fee_cents"],
        "payout_cents": fee_info["payout_cents"],
        "status": "pending",
        "payment_status": "pending",
        "pickup_code": pickup_code,
        "return_code": return_code,
        "created_at": datetime.utcnow(),
    }

    await db.rentals.insert_one(rental_dict)

    client_secret = None
    if stripe_config["secret_key"].startswith("sk_test_") and len(stripe_config["secret_key"]) > 20:
        try:
            stripe_customer_id = await _get_or_create_stripe_customer(current_user)
            payment_intent = stripe.PaymentIntent.create(
                amount=total_price_cents,
                currency="eur",
                customer=stripe_customer_id,
                setup_future_usage="off_session",
                payment_method_types=["card"],
                metadata={
                    "rental_id": rental_id,
                    "type": "rental",
                    "renter_id": current_user["id"],
                    "owner_id": item["owner_id"],
                },
            )
            await db.rentals.update_one({"id": rental_id}, {"$set": {"payment_intent_id": payment_intent.id}})
            client_secret = payment_intent.client_secret
        except Exception as e:
            logger.error(f"Stripe error for rental: {e}")
            client_secret = f"pi_demo_{rental_id[:8]}_secret_demo"
    else:
        client_secret = f"pi_demo_{rental_id[:8]}_secret_demo"

    rental_dict.pop("_id", None)
    rental_dict["client_secret"] = client_secret

    await create_notification(
        user_id=item["owner_id"],
        notif_type="rental_status",
        title="📅 Nouvelle demande de location !",
        message=f"Votre article '{item['title']}' a été réservé du {booking.start_date.strftime('%d/%m')} au {booking.end_date.strftime('%d/%m')}.",
        data={"rental_id": rental_id, "item_id": item["id"]},
    )

    return rental_dict


@router.get("/rentals")
async def get_user_rentals(current_user: dict = Depends(get_current_user)):
    rentals = await db.rentals.find({
        "$or": [{"renter_id": current_user["id"]}, {"owner_id": current_user["id"]}]
    }).sort("created_at", -1).to_list(100)

    for rental in rentals:
        rental.pop("_id", None)
        item = await db.items.find_one({"id": rental["item_id"]})
        if item:
            item.pop("_id", None)
            rental["item"] = item

    return rentals


@router.get("/rentals/{rental_id}")
async def get_rental(rental_id: str, current_user: dict = Depends(get_current_user)):
    rental = await db.rentals.find_one({"id": rental_id})
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental["renter_id"] != current_user["id"] and rental["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    rental.pop("_id", None)
    item = await db.items.find_one({"id": rental["item_id"]})
    if item:
        item.pop("_id", None)
        rental["item"] = item

    return rental


@router.post("/rentals/{rental_id}/confirm-payment")
async def confirm_rental_payment(rental_id: str, current_user: dict = Depends(get_current_user)):
    rental = await db.rentals.find_one({"id": rental_id})
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental["renter_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.rentals.update_one(
        {"id": rental_id},
        {"$set": {"status": "confirmed", "payment_status": "fully_paid", "paid_at": datetime.utcnow()}},
    )

    await db.notifications.insert_one({
        "user_id": rental["owner_id"],
        "type": "rental_booked",
        "title": "Nouvelle réservation!",
        "message": f"Votre article a été réservé du {rental['start_date'].strftime('%d/%m')} au {rental['end_date'].strftime('%d/%m')}",
        "rental_id": rental_id,
        "read": False,
        "created_at": datetime.utcnow(),
    })
    await send_push_notification(
        rental["owner_id"],
        "Nouvelle réservation!",
        f"Votre article a été réservé du {rental['start_date'].strftime('%d/%m')} au {rental['end_date'].strftime('%d/%m')}.",
    )

    return {"message": "Rental confirmed", "status": "confirmed"}


@router.post("/rentals/{rental_id}/pay-with-wallet")
async def pay_rental_with_wallet(rental_id: str, current_user: dict = Depends(get_current_user)):
    rental = await db.rentals.find_one({"id": rental_id})
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental["renter_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if rental.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Rental already processed")

    user = await db.users.find_one({"id": current_user["id"]})
    wallet_balance = user.get("wallet_balance_cents", 0)
    total_amount = rental["total_price_cents"]

    if wallet_balance < total_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Solde insuffisant. Vous avez {wallet_balance/100:.2f}€, il faut {total_amount/100:.2f}€",
        )

    await db.users.update_one({"id": current_user["id"]}, {"$inc": {"wallet_balance_cents": -total_amount}})
    await db.rentals.update_one(
        {"id": rental_id},
        {"$set": {
            "status": "confirmed",
            "payment_status": "fully_paid",
            "payment_method": "wallet",
            "paid_at": datetime.utcnow(),
        }},
    )
    await db.transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "amount_cents": -total_amount,
        "type": "rental",
        "status": "completed",
        "reference_id": rental_id,
        "description": "Paiement location via wallet",
        "created_at": datetime.utcnow(),
    })
    await db.items.update_one({"id": rental["item_id"]}, {"$set": {"status": "reserved"}})

    await db.notifications.insert_one({
        "user_id": rental["owner_id"],
        "type": "rental_booked",
        "title": "Nouvelle réservation!",
        "message": f"Votre article a été réservé du {rental['start_date'].strftime('%d/%m')} au {rental['end_date'].strftime('%d/%m')}",
        "rental_id": rental_id,
        "read": False,
        "created_at": datetime.utcnow(),
    })
    await send_push_notification(
        rental["owner_id"],
        "Nouvelle réservation!",
        f"Votre article a été réservé du {rental['start_date'].strftime('%d/%m')} au {rental['end_date'].strftime('%d/%m')}.",
    )

    return {"message": "Rental paid with wallet", "status": "confirmed"}


@router.post("/rentals/{rental_id}/pickup")
async def confirm_rental_pickup(rental_id: str, code: str, current_user: dict = Depends(get_current_user)):
    rental = await db.rentals.find_one({"id": rental_id})
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can confirm pickup")
    if rental["status"] not in ["confirmed"]:
        raise HTTPException(status_code=400, detail="Rental must be confirmed first")
    if code.upper() != rental["pickup_code"]:
        raise HTTPException(status_code=400, detail="Invalid pickup code")

    await db.rentals.update_one(
        {"id": rental_id},
        {"$set": {"status": "active", "pickup_confirmed_at": datetime.utcnow()}},
    )

    return {"message": "Pickup confirmed", "status": "active", "return_date": rental["end_date"]}


@router.post("/rentals/{rental_id}/return")
async def confirm_rental_return(
    rental_id: str,
    code: str,
    condition_ok: bool = True,
    notes: Optional[str] = None,
    photos: Optional[List[str]] = None,
    current_user: dict = Depends(get_current_user),
):
    rental = await db.rentals.find_one({"id": rental_id})
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can confirm return")
    if rental["status"] != "active":
        raise HTTPException(status_code=400, detail="Rental must be active")
    if code.upper() != rental["return_code"]:
        raise HTTPException(status_code=400, detail="Invalid return code")

    final_payment_status = "deposit_released" if condition_ok else "deposit_charged"

    if not condition_ok:
        try:
            original_intent_id = rental.get("payment_intent_id")
            if original_intent_id and not original_intent_id.startswith("pi_demo"):
                original_intent = stripe.PaymentIntent.retrieve(original_intent_id)
                customer_id = original_intent.customer
                payment_method_id = original_intent.payment_method
                if customer_id and payment_method_id:
                    deposit_intent = stripe.PaymentIntent.create(
                        amount=rental.get("deposit_cents", 0),
                        currency="eur",
                        customer=customer_id,
                        payment_method=payment_method_id,
                        off_session=True,
                        confirm=True,
                        metadata={"rental_id": rental_id, "type": "rental_deposit_charge", "reason": "damage_reported"},
                    )
                    await db.rentals.update_one(
                        {"id": rental_id},
                        {"$set": {"deposit_charge_id": deposit_intent.id}},
                    )
                else:
                    logger.error("Cannot charge deposit: Missing customer or payment method")
        except Exception as e:
            logger.error(f"Failed to charge deposit: {e}")

    update_data = {
        "status": "returned",
        "payment_status": final_payment_status,
        "return_confirmed_at": datetime.utcnow(),
        "return_condition_ok": condition_ok,
    }
    if notes:
        update_data["return_notes"] = notes
    if photos:
        update_data["return_photos"] = photos

    await db.rentals.update_one({"id": rental_id}, {"$set": update_data})
    await db.items.update_one({"id": rental["item_id"]}, {"$set": {"status": "active"}})

    msg_status = (
        "Aucun frais supplémentaire ne sera débité."
        if condition_ok
        else f"La caution de {rental['deposit_cents']/100:.2f}€ a été débitée pour dédommagement."
    )
    await db.notifications.insert_one({
        "user_id": rental["renter_id"],
        "type": "rental_completed",
        "title": "Location terminée",
        "message": f"Retour confirmé. {msg_status}",
        "rental_id": rental_id,
        "read": False,
        "created_at": datetime.utcnow(),
    })

    return {"message": "Return confirmed", "deposit_status": final_payment_status}


@router.get("/items/{item_id}/availability")
async def get_item_availability(item_id: str):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    rentals = await db.rentals.find({
        "item_id": item_id,
        "status": {"$in": ["pending", "confirmed", "active"]},
    }).to_list(100)

    booked_ranges = [
        {"start": r["start_date"].isoformat(), "end": r["end_date"].isoformat()}
        for r in rentals
    ]

    return {
        "item_id": item_id,
        "booked_ranges": booked_ranges,
        "max_duration_days": item.get("max_duration_days", 30),
    }


# ── Inspection reports ────────────────────────────────────────────────────────

@router.post("/rentals/{booking_id}/inspection/in")
async def create_inspection_in(
    booking_id: str,
    report: InspectionReport,
    current_user: dict = Depends(get_current_user),
):
    booking = await db.rentals.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if current_user["id"] not in [booking["renter_id"], booking["owner_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if report.type != "in":
        raise HTTPException(status_code=400, detail="Invalid report type for entry")

    report.created_by = current_user["id"]
    report_dict = report.dict()
    await db.rentals.update_one(
        {"id": booking_id},
        {"$set": {"inspection_in": report_dict, "status": "active"}},
    )

    return {"message": "Entry inspection saved", "report": report_dict}


@router.post("/rentals/{booking_id}/inspection/out")
async def create_inspection_out(
    booking_id: str,
    report: InspectionReport,
    current_user: dict = Depends(get_current_user),
):
    booking = await db.rentals.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if current_user["id"] not in [booking["renter_id"], booking["owner_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if report.type != "out":
        raise HTTPException(status_code=400, detail="Invalid report type for exit")

    report.created_by = current_user["id"]
    report_dict = report.dict()
    await db.rentals.update_one({"id": booking_id}, {"$set": {"inspection_out": report_dict}})

    return {"message": "Exit inspection saved (return must be confirmed separately)", "report": report_dict}
