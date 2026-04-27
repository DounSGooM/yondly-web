import logging

import stripe
from fastapi import APIRouter, HTTPException, Depends

from database import db
from auth_utils import get_current_user
from stripe_utils import get_stripe_config

logger = logging.getLogger(__name__)
router = APIRouter(tags=["payments"])

stripe_config = get_stripe_config()
stripe.api_key = stripe_config["secret_key"]


@router.post("/payments/onboard")
async def create_connected_account(current_user: dict = Depends(get_current_user)):
    try:
        user = await db.users.find_one({"id": current_user["id"]})
        account_id = user.get("stripe_account_id")

        cfg = get_stripe_config()
        if not cfg["secret_key"].startswith("sk_test_"):
            raise HTTPException(status_code=500, detail="Stripe is not configured")

        if not account_id:
            account = stripe.Account.create(
                type="express",
                country="FR",
                email=user["email"],
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
            )
            account_id = account.id
            await db.users.update_one({"id": user["id"]}, {"$set": {"stripe_account_id": account_id}})

        account_link = stripe.AccountLink.create(
            account=account_id,
            refresh_url="http://localhost:8081/payouts?status=refresh",
            return_url="http://localhost:8081/payouts?status=success",
            type="account_onboarding",
        )

        return {"url": account_link.url, "account_id": account_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stripe Connect error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/payments/status")
async def get_payout_status(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]})
    account_id = user.get("stripe_account_id")

    if not account_id:
        return {"onboarded": False, "details_submitted": False}

    try:
        account = stripe.Account.retrieve(account_id)
        return {
            "onboarded": account.charges_enabled and account.payouts_enabled,
            "details_submitted": account.details_submitted,
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
