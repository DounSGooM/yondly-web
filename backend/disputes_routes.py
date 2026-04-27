import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends

from models import DisputeCreate, DisputeResolution
from database import db
from auth_utils import get_current_user
from stripe_webhooks import process_refund
from push_service import send_push_notification

logger = logging.getLogger(__name__)
router = APIRouter(tags=["disputes"])


@router.post("/disputes")
async def create_dispute(dispute: DisputeCreate, current_user: dict = Depends(get_current_user)):
    if not dispute.order_id and not dispute.rental_id:
        raise HTTPException(status_code=400, detail="Must provide either order_id or rental_id")

    respondent_id = None

    if dispute.order_id:
        transaction = await db.orders.find_one({"id": dispute.order_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Order not found")
        if transaction["buyer_id"] == current_user["id"]:
            respondent_id = transaction["seller_id"]
        elif transaction["seller_id"] == current_user["id"]:
            respondent_id = transaction["buyer_id"]
        else:
            raise HTTPException(status_code=403, detail="Not authorized to dispute this order")
    else:
        transaction = await db.rentals.find_one({"id": dispute.rental_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Rental not found")
        if transaction["renter_id"] == current_user["id"]:
            respondent_id = transaction["owner_id"]
        elif transaction["owner_id"] == current_user["id"]:
            respondent_id = transaction["renter_id"]
        else:
            raise HTTPException(status_code=403, detail="Not authorized to dispute this rental")

    existing = await db.disputes.find_one({
        "$or": [
            {"order_id": dispute.order_id, "status": {"$in": ["open", "under_review"]}},
            {"rental_id": dispute.rental_id, "status": {"$in": ["open", "under_review"]}},
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="A dispute is already open for this transaction")

    dispute_id = str(uuid.uuid4())
    dispute_dict = {
        "id": dispute_id,
        "order_id": dispute.order_id,
        "rental_id": dispute.rental_id,
        "complainant_id": current_user["id"],
        "respondent_id": respondent_id,
        "reason": dispute.reason,
        "description": dispute.description,
        "evidence_photos": dispute.evidence_photos,
        "status": "open",
        "created_at": datetime.utcnow(),
    }

    await db.disputes.insert_one(dispute_dict)

    if dispute.order_id:
        await db.orders.update_one({"id": dispute.order_id}, {"$set": {"dispute_status": "open"}})
    elif dispute.rental_id:
        await db.rentals.update_one({"id": dispute.rental_id}, {"$set": {"status": "dispute"}})

    await db.notifications.insert_one({
        "user_id": respondent_id,
        "type": "dispute_opened",
        "title": "Litige ouvert",
        "message": "Un litige a été ouvert concernant une de vos transactions.",
        "dispute_id": dispute_id,
        "read": False,
        "created_at": datetime.utcnow(),
    })
    await send_push_notification(
        respondent_id,
        "Litige ouvert",
        "Un litige a été ouvert concernant une de vos transactions.",
    )

    dispute_dict.pop("_id", None)
    return dispute_dict


@router.get("/disputes")
async def get_my_disputes(current_user: dict = Depends(get_current_user)):
    disputes = await db.disputes.find({
        "$or": [
            {"complainant_id": current_user["id"]},
            {"respondent_id": current_user["id"]},
        ]
    }).sort("created_at", -1).to_list(50)

    for d in disputes:
        d.pop("_id", None)

    return disputes


@router.get("/disputes/{dispute_id}")
async def get_dispute(dispute_id: str, current_user: dict = Depends(get_current_user)):
    dispute = await db.disputes.find_one({"id": dispute_id})
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    if dispute["complainant_id"] != current_user["id"] and dispute["respondent_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    dispute.pop("_id", None)

    if dispute.get("order_id"):
        order = await db.orders.find_one({"id": dispute["order_id"]})
        if order:
            order.pop("_id", None)
            dispute["order"] = order
    elif dispute.get("rental_id"):
        rental = await db.rentals.find_one({"id": dispute["rental_id"]})
        if rental:
            rental.pop("_id", None)
            dispute["rental"] = rental

    return dispute


@router.post("/disputes/{dispute_id}/respond")
async def respond_to_dispute(dispute_id: str, response: str, current_user: dict = Depends(get_current_user)):
    dispute = await db.disputes.find_one({"id": dispute_id})
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    if dispute["respondent_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only respondent can respond")

    await db.disputes.update_one(
        {"id": dispute_id},
        {"$set": {"respondent_response": response, "responded_at": datetime.utcnow()}},
    )

    return {"message": "Response added"}


@router.get("/pro/disputes")
async def get_pro_disputes(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_partner"):
        raise HTTPException(status_code=403, detail="Pro only")

    disputes = await db.disputes.find({"respondent_id": current_user["id"]}).sort("created_at", -1).to_list(100)

    results = []
    for d in disputes:
        d.pop("_id", None)
        if d.get("order_id"):
            order = await db.orders.find_one({"id": d["order_id"]})
            if order:
                item = await db.items.find_one({"id": order["item_id"]})
                d["item_title"] = item["title"] if item else "Unknown Item"
                d["amount"] = order["amount_cents"] / 100
        results.append(d)

    return results


@router.get("/admin/disputes")
async def get_admin_disputes(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("email") != "admin@yondly.com":
        raise HTTPException(status_code=403, detail="Admin only")

    query = {}
    if status:
        query["status"] = status

    disputes = await db.disputes.find(query).sort("created_at", -1).to_list(100)

    results = []
    for d in disputes:
        d.pop("_id", None)
        if d.get("order_id"):
            order = await db.orders.find_one({"id": d["order_id"]})
            d["amount"] = order["amount_cents"] / 100 if order else 0
        results.append(d)

    return results


@router.post("/admin/disputes/{dispute_id}/resolve")
async def resolve_dispute(
    dispute_id: str,
    resolution: DisputeResolution,
    current_user: dict = Depends(get_current_user),
):
    dispute = await db.disputes.find_one({"id": dispute_id})
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    if dispute["status"] not in ["open", "under_review"]:
        raise HTTPException(status_code=400, detail="Dispute already resolved")

    refund_amount_cents = 0
    transaction = None

    if dispute.get("order_id"):
        transaction = await db.orders.find_one({"id": dispute["order_id"]})
        if transaction:
            if resolution.resolution == "refund_full":
                refund_amount_cents = transaction["amount_cents"]
            elif resolution.resolution == "refund_partial" and resolution.refund_percentage:
                refund_amount_cents = int(transaction["amount_cents"] * resolution.refund_percentage / 100)
    elif dispute.get("rental_id"):
        transaction = await db.rentals.find_one({"id": dispute["rental_id"]})
        if transaction:
            if resolution.resolution == "refund_full":
                refund_amount_cents = transaction["total_price_cents"] + transaction["deposit_cents"]
            elif resolution.resolution == "refund_partial" and resolution.refund_percentage:
                refund_amount_cents = int(
                    (transaction["total_price_cents"] + transaction["deposit_cents"]) * resolution.refund_percentage / 100
                )

    status = "closed"
    if resolution.resolution in ["refund_full", "refund_partial"]:
        status = "resolved_buyer"
    elif resolution.resolution == "no_refund":
        status = "resolved_seller"

    await db.disputes.update_one(
        {"id": dispute_id},
        {"$set": {
            "status": status,
            "resolution_notes": resolution.notes,
            "refund_amount_cents": refund_amount_cents,
            "resolved_by": current_user["id"],
            "resolved_at": datetime.utcnow(),
        }},
    )

    if refund_amount_cents > 0 and transaction:
        try:
            ref_id = dispute.get("order_id") or dispute.get("rental_id")
            await process_refund(db, ref_id, f"Dispute resolution: {resolution.notes}")
        except Exception as e:
            logger.error(f"Refund error: {e}")

    if dispute.get("order_id"):
        await db.orders.update_one({"id": dispute["order_id"]}, {"$set": {"dispute_status": status}})
    elif dispute.get("rental_id"):
        await db.rentals.update_one(
            {"id": dispute["rental_id"]},
            {"$set": {"status": "returned" if status == "resolved_seller" else "cancelled"}},
        )

    for user_id in [dispute["complainant_id"], dispute["respondent_id"]]:
        await db.notifications.insert_one({
            "user_id": user_id,
            "type": "dispute_resolved",
            "title": "Litige résolu",
            "message": (
                f"Le litige a été résolu. "
                f"{'Remboursement de ' + str(refund_amount_cents/100) + '€' if refund_amount_cents > 0 else 'Aucun remboursement.'}"
            ),
            "dispute_id": dispute_id,
            "read": False,
            "created_at": datetime.utcnow(),
        })

    return {"message": "Dispute resolved", "refund_amount_cents": refund_amount_cents}
