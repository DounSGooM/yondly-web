import logging
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends

from models import ProSellerCreate, ProSellerUpdate, ProSellerVerification
from database import db
from auth_utils import get_current_user
from siren_validator import (
    validate_siren_format,
    validate_siret_format,
    validate_tva_format,
    validate_siren_with_insee,
    mask_siren,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["pro_sellers"])


@router.post("/pro/register")
async def register_pro_seller(pro_data: ProSellerCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    existing = await db.pro_sellers.find_one({"user_id": user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà un profil professionnel")

    siren = pro_data.siren.replace(" ", "")
    existing_siren = await db.pro_sellers.find_one({"siren": siren})
    if existing_siren:
        raise HTTPException(status_code=400, detail="Ce SIREN est déjà enregistré sur la plateforme")

    if not validate_siren_format(siren):
        raise HTTPException(status_code=400, detail="Format SIREN invalide (9 chiffres requis)")

    if pro_data.siret:
        siret = pro_data.siret.replace(" ", "")
        if not validate_siret_format(siret):
            raise HTTPException(status_code=400, detail="Format SIRET invalide (14 chiffres requis)")
        if not siret.startswith(siren):
            raise HTTPException(status_code=400, detail="Le SIRET doit commencer par le SIREN")

    if pro_data.tva_number:
        if not validate_tva_format(pro_data.tva_number):
            raise HTTPException(status_code=400, detail="Format TVA invalide (FR + 11 chiffres)")

    pro_id = str(uuid.uuid4())
    now = datetime.utcnow()

    pro_dict = {
        "id": pro_id,
        "user_id": user_id,
        "business_name": pro_data.business_name,
        "trade_name": pro_data.trade_name,
        "legal_form": pro_data.legal_form,
        "siren": siren,
        "siret": pro_data.siret.replace(" ", "") if pro_data.siret else None,
        "rcs_number": pro_data.rcs_number,
        "tva_number": pro_data.tva_number.replace(" ", "").upper() if pro_data.tva_number else None,
        "address_line1": pro_data.address_line1,
        "address_line2": pro_data.address_line2,
        "city": pro_data.city,
        "postcode": pro_data.postcode,
        "country": pro_data.country,
        "contact_first_name": pro_data.contact_first_name,
        "contact_last_name": pro_data.contact_last_name,
        "contact_email": pro_data.contact_email,
        "contact_phone": pro_data.contact_phone,
        "services": pro_data.services,
        "kbis_document_url": pro_data.kbis_document_url,
        "identity_document_url": pro_data.identity_document_url,
        "status": "pending",
        "siren_validated": False,
        "created_at": now,
        "updated_at": now,
    }

    await db.pro_sellers.insert_one(pro_dict)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_partner": True, "services": pro_data.services}},
    )

    pro_dict.pop("_id", None)
    logger.info(f"New Pro seller registered: {pro_data.business_name} (SIREN: {mask_siren(siren)})")

    return {
        "message": "Inscription professionnelle enregistrée. En attente de vérification.",
        "pro_seller": pro_dict,
    }


@router.get("/pro/profile")
async def get_pro_profile(current_user: dict = Depends(get_current_user)):
    pro = await db.pro_sellers.find_one({"user_id": current_user["id"]})
    if not pro:
        raise HTTPException(status_code=404, detail="Aucun profil professionnel trouvé")
    pro.pop("_id", None)
    return pro


@router.put("/pro/profile")
async def update_pro_profile(update_data: ProSellerUpdate, current_user: dict = Depends(get_current_user)):
    pro = await db.pro_sellers.find_one({"user_id": current_user["id"]})
    if not pro:
        raise HTTPException(status_code=404, detail="Aucun profil professionnel trouvé")

    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()

    await db.pro_sellers.update_one({"user_id": current_user["id"]}, {"$set": update_dict})

    if update_data.services:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"services": update_data.services}},
        )

    return {"message": "Profil mis à jour"}


@router.get("/pro/verify-siren")
async def verify_siren(siren: str):
    insee_token = os.environ.get("INSEE_API_TOKEN")
    return await validate_siren_with_insee(siren, insee_token)


@router.get("/pro/public/{user_id}")
async def get_pro_public_info(user_id: str):
    pro = await db.pro_sellers.find_one({"user_id": user_id, "status": "verified"})
    if not pro:
        return None
    return {
        "business_name": pro.get("business_name"),
        "trade_name": pro.get("trade_name"),
        "legal_form": pro.get("legal_form"),
        "siren_masked": mask_siren(pro.get("siren", "")),
        "city": pro.get("city"),
        "country": pro.get("country"),
        "verified": True,
        "verified_at": pro.get("verified_at"),
    }


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.get("/admin/pro-sellers")
async def get_admin_pro_sellers(
    status: Optional[str] = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("email") != "admin@yondly.com":
        raise HTTPException(status_code=403, detail="Not authorized")

    query = {}
    if status:
        query["status"] = status

    pros = await db.pro_sellers.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    for pro in pros:
        pro.pop("_id", None)
        user = await db.users.find_one({"id": pro.get("user_id")})
        if user:
            pro["user_email"] = user.get("email")
            pro["user_display_name"] = user.get("display_name")

    return pros


@router.get("/admin/pro-sellers/{pro_id}")
async def get_admin_pro_seller_detail(pro_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != "admin@yondly.com":
        raise HTTPException(status_code=403, detail="Not authorized")

    pro = await db.pro_sellers.find_one({"id": pro_id})
    if not pro:
        raise HTTPException(status_code=404, detail="Pro seller not found")

    pro.pop("_id", None)

    user = await db.users.find_one({"id": pro.get("user_id")})
    if user:
        pro["user"] = {
            "id": user.get("id"),
            "email": user.get("email"),
            "display_name": user.get("display_name"),
            "created_at": user.get("created_at"),
        }

    pro["total_orders"] = await db.orders.count_documents({"seller_id": pro.get("user_id")})
    return pro


@router.post("/admin/pro-sellers/{pro_id}/verify")
async def admin_verify_pro_seller(
    pro_id: str,
    verification: ProSellerVerification,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("email") != "admin@yondly.com":
        raise HTTPException(status_code=403, detail="Not authorized")

    pro = await db.pro_sellers.find_one({"id": pro_id})
    if not pro:
        raise HTTPException(status_code=404, detail="Pro seller not found")

    now = datetime.utcnow()
    update_data = {"updated_at": now}

    if verification.action == "verify":
        update_data.update({
            "status": "verified",
            "verified_at": now,
            "verified_by": current_user["id"],
            "verification_notes": verification.notes,
        })
    elif verification.action == "reject":
        update_data.update({
            "status": "rejected",
            "rejection_reason": verification.rejection_reason,
            "verification_notes": verification.notes,
        })
    elif verification.action == "suspend":
        from dateutil.relativedelta import relativedelta
        update_data.update({
            "status": "suspended",
            "verification_notes": verification.notes,
            "deactivated_at": now,
            "retention_until": now + relativedelta(months=6),
        })
    elif verification.action == "reactivate":
        update_data.update({
            "status": "verified",
            "deactivated_at": None,
            "retention_until": None,
            "verification_notes": verification.notes,
        })

    await db.pro_sellers.update_one({"id": pro_id}, {"$set": update_data})
    logger.info(f"Admin {current_user['email']} performed {verification.action} on Pro seller {pro_id}")

    return {"message": f"Action '{verification.action}' effectuée avec succès"}
