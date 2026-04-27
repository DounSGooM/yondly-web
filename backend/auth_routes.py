import logging
import random
import re
import uuid
from datetime import datetime, timedelta
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from models import UserRegister, UserLogin, UserUpdate
from database import db
from auth_utils import (
    get_current_user,
    hash_password,
    verify_password,
    create_access_token,
)
from zone_utils import check_zone_coverage

logger = logging.getLogger(__name__)
router = APIRouter(tags=["auth"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def generate_beneficiary_id() -> str:
    import string
    chars = string.ascii_uppercase + string.digits
    code = "".join(random.choices(chars, k=6))
    return f"YND-{code}"


def _validate_password_strength(pwd: str):
    if len(pwd) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caractères")
    if not any(c.isupper() for c in pwd):
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins une majuscule")
    if not any(c.islower() for c in pwd):
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins une minuscule")
    if not any(c.isdigit() for c in pwd):
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins un chiffre")
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"|,.<>/?`~]', pwd):
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins un caractère spécial")


# ── Inline request models ─────────────────────────────────────────────────────

class VerifyEmailRequest(BaseModel):
    email: str
    code: str


class ResendCodeRequest(BaseModel):
    email: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str


class SocialLoginRequest(BaseModel):
    provider: str
    id_token: str
    display_name: Optional[str] = None


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/auth/register")
async def register(user_data: UserRegister):
    if await db.users.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    is_allowed = await check_zone_coverage(
        postcode=user_data.postcode,
        citycode=user_data.citycode,
        location=user_data.location,
    )
    if not is_allowed:
        raise HTTPException(
            status_code=403,
            detail="Votre zone n'est pas encore ouverte. Rejoignez la liste d'attente !",
        )

    _validate_password_strength(user_data.password)

    phone = user_data.phone
    if not phone:
        raise HTTPException(status_code=400, detail="Le numéro de téléphone est obligatoire")
    clean_phone = re.sub(r"[\s.\-]", "", phone)
    if not re.match(r"^(\+33[1-9]\d{8}|0[1-9]\d{8})$", clean_phone):
        raise HTTPException(status_code=400, detail="Numéro de téléphone invalide. Format attendu : +33 6 12 34 56 78")

    user_id = str(uuid.uuid4())
    user_dict = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "display_name": user_data.display_name,
        "phone": user_data.phone,
        "photo_url": None,
        "ratings_avg": 0.0,
        "ratings_count": 0,
        "wallet_balance_cents": 0,
        "points": 0,
        "level": "Graine",
        "stripe_account_id": None,
        "is_partner": user_data.is_partner,
        "services": user_data.services if user_data.is_partner else [],
        "street": user_data.street,
        "city": user_data.city,
        "postcode": user_data.postcode,
        "citycode": user_data.citycode,
        "context": user_data.context,
        "location": user_data.location.dict() if user_data.location else None,
        "co2_saved": 0.0,
        "beneficiary_id": generate_beneficiary_id(),
        "created_at": datetime.utcnow(),
        "email_verified": False,
    }

    await db.users.insert_one(user_dict)

    code = f"{random.randint(100000, 999999)}"
    await db.email_verifications.insert_one({
        "email": user_data.email,
        "code": code,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "created_at": datetime.utcnow(),
    })

    try:
        from email_service import send_verification_email
        send_verification_email(user_data.email, code)
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")

    try:
        from analytics_routes import track_event_internal
        await track_event_internal(
            user_id=user_id,
            event_name="user_signup",
            territory_type="code_postal",
            territory_code=user_data.postcode or "00000",
        )
    except Exception:
        pass

    return {
        "requires_verification": True,
        "email": user_data.email,
        "message": "Un code de vérification a été envoyé à votre adresse email.",
    }


@router.post("/auth/verify-email")
async def verify_email(data: VerifyEmailRequest):
    verification = await db.email_verifications.find_one({
        "email": data.email,
        "code": data.code,
        "expires_at": {"$gt": datetime.utcnow()},
    })
    if not verification:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré")

    await db.users.update_one({"email": data.email}, {"$set": {"email_verified": True}})
    await db.email_verifications.delete_many({"email": data.email})

    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    access_token = create_access_token(data={"sub": user["id"]})
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "access_token": access_token, "token_type": "bearer"}


@router.post("/auth/resend-code")
async def resend_code(data: ResendCodeRequest):
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if user.get("email_verified"):
        raise HTTPException(status_code=400, detail="Email déjà vérifié")

    await db.email_verifications.delete_many({"email": data.email})
    code = f"{random.randint(100000, 999999)}"
    await db.email_verifications.insert_one({
        "email": data.email,
        "code": code,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "created_at": datetime.utcnow(),
    })

    try:
        from email_service import send_verification_email
        send_verification_email(data.email, code)
    except Exception as e:
        logger.error(f"Failed to resend verification email: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'envoi de l'email")

    return {"message": "Un nouveau code a été envoyé."}


@router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    user = await db.users.find_one({"email": data.email})
    if not user:
        return {"message": "Si ce compte existe, un code de réinitialisation a été envoyé."}

    await db.password_resets.delete_many({"email": data.email})
    code = f"{random.randint(100000, 999999)}"
    await db.password_resets.insert_one({
        "email": data.email,
        "code": code,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "created_at": datetime.utcnow(),
    })

    try:
        from email_service import send_password_reset_email
        send_password_reset_email(data.email, code)
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'envoi de l'email")

    return {"message": "Si ce compte existe, un code de réinitialisation a été envoyé."}


@router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    reset = await db.password_resets.find_one({
        "email": data.email,
        "code": data.code,
        "expires_at": {"$gt": datetime.utcnow()},
    })
    if not reset:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré")

    _validate_password_strength(data.new_password)

    await db.users.update_one(
        {"email": data.email},
        {"$set": {"password_hash": hash_password(data.new_password)}},
    )
    await db.password_resets.delete_many({"email": data.email})
    return {"message": "Mot de passe réinitialisé avec succès."}


@router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.get("email_verified", True) and not user.get("auth_provider"):
        code = f"{random.randint(100000, 999999)}"
        await db.email_verifications.delete_many({"email": credentials.email})
        await db.email_verifications.insert_one({
            "email": credentials.email,
            "code": code,
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
            "created_at": datetime.utcnow(),
        })
        try:
            from email_service import send_verification_email
            send_verification_email(credentials.email, code)
        except Exception:
            pass
        raise HTTPException(status_code=403, detail="Email non vérifié. Un nouveau code a été envoyé.")

    access_token = create_access_token(data={"sub": user["id"]})
    user.pop("password_hash")
    user.pop("_id", None)
    return {"user": user, "access_token": access_token, "token_type": "bearer"}


@router.post("/auth/social")
async def social_login(data: SocialLoginRequest):
    email = None
    social_name = data.display_name

    if data.provider == "google":
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={data.id_token}"
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")
            payload = resp.json()
            email = payload.get("email")
            if not social_name:
                social_name = payload.get("name", email.split("@")[0] if email else "User")

    elif data.provider == "apple":
        try:
            import jwt as pyjwt
            unverified = pyjwt.decode(data.id_token, options={"verify_signature": False})
            email = unverified.get("email")
            if not social_name:
                social_name = email.split("@")[0] if email else "Apple User"
        except Exception as e:
            logger.error(f"Apple token decode error: {e}")
            raise HTTPException(status_code=401, detail="Invalid Apple token")

    elif data.provider == "facebook":
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://graph.facebook.com/me?fields=id,name,email&access_token={data.id_token}"
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Facebook token")
            payload = resp.json()
            email = payload.get("email")
            if not social_name:
                social_name = payload.get("name", "Facebook User")
    else:
        raise HTTPException(status_code=400, detail="Unsupported provider")

    if not email:
        raise HTTPException(status_code=400, detail="Could not extract email from token")

    user = await db.users.find_one({"email": email})
    if not user:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": email,
            "password_hash": None,
            "display_name": social_name or email.split("@")[0],
            "phone": None,
            "photo_url": None,
            "ratings_avg": 0.0,
            "ratings_count": 0,
            "wallet_balance_cents": 0,
            "points": 0,
            "level": "Graine",
            "stripe_account_id": None,
            "is_partner": False,
            "services": [],
            "street": None,
            "city": None,
            "postcode": None,
            "citycode": None,
            "context": None,
            "location": None,
            "co2_saved": 0.0,
            "beneficiary_id": generate_beneficiary_id(),
            "auth_provider": data.provider,
            "created_at": datetime.utcnow(),
        }
        await db.users.insert_one(user)
        try:
            from analytics_routes import track_event_internal
            await track_event_internal(
                user_id=user_id,
                event_name="user_signup",
                territory_type="social",
                territory_code=data.provider,
            )
        except Exception:
            pass

    access_token = create_access_token(data={"sub": user["id"]})
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "access_token": access_token, "token_type": "bearer"}


@router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user.pop("password_hash", None)
    current_user.pop("_id", None)
    return current_user


@router.get("/users/me/impact")
async def get_user_impact(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    pipeline = [
        {"$match": {
            "$or": [{"seller_id": user_id}, {"buyer_id": user_id}],
            "payment_status": "released",
        }},
        {"$lookup": {"from": "items", "localField": "item_id", "foreignField": "id", "as": "item"}},
        {"$unwind": "$item"},
        {"$group": {"_id": "$item.type", "count": {"$sum": 1}}},
    ]

    results = await db.orders.aggregate(pipeline).to_list(length=100)
    counts = {"basketsCount": 0, "donationsCount": 0, "salesCount": 0, "rentalsCount": 0}
    for r in results:
        t, c = r["_id"], r["count"]
        if t == "sale":
            counts["salesCount"] = c
        elif t == "donation":
            counts["donationsCount"] = c
        elif t == "rent":
            counts["rentalsCount"] = c

    counts["basketsCount"] = await db.orders.count_documents({
        "$or": [{"seller_id": user_id}, {"buyer_id": user_id}],
        "payment_status": "released",
        "type": "deal",
    })
    return counts


@router.put("/auth/profile")
async def update_profile(update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_dict})

    updated_user = await db.users.find_one({"id": current_user["id"]})
    updated_user.pop("password_hash", None)
    updated_user.pop("_id", None)
    return updated_user


@router.delete("/auth/me", status_code=204)
async def delete_account(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    await db.users.delete_one({"id": user_id})
    await db.items.delete_many({"owner_id": user_id})
    await db.public_lists.delete_many({"owner_id": user_id})
    return None


@router.get("/users/{user_id}")
async def get_user_info(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user["id"],
        "email": user["email"],
        "display_name": user.get("display_name", user["email"].split("@")[0]),
        "created_at": user.get("created_at"),
    }


@router.get("/auth/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    sales_count = await db.orders.count_documents({"seller_id": user_id, "payment_status": "released"})
    purchases_count = await db.orders.count_documents({"buyer_id": user_id, "payment_status": "released"})
    donations_count = await db.items.count_documents({"owner_id": user_id, "type": "donation", "status": "completed"})
    total_transactions = sales_count + purchases_count + donations_count

    pipeline = [
        {"$match": {"seller_id": user_id, "payment_status": "released"}},
        {"$group": {"_id": "$buyer_id"}},
    ]
    unique_buyers = await db.orders.aggregate(pipeline).to_list(1000)
    people_helped = len(unique_buyers) + donations_count

    user = await db.users.find_one({"id": user_id})
    co2_saved = user.get("co2_saved", 0) if user else 0

    return {
        "total_transactions": total_transactions,
        "people_helped": people_helped,
        "sales_count": sales_count,
        "donations_count": donations_count,
        "co2_saved": round(co2_saved, 2),
    }
