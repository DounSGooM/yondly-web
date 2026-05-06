"""
Admin routes — Supabase-compatible rewrite.
Mounted at /api/admin via app.include_router().
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import logging


# ── Models ──────────────────────────────────────────────────────────────────

class TrustUpdate(BaseModel):
    trust_level: str
    reason: Optional[str] = ""

class DataDictionaryEntry(BaseModel):
    field_name: str
    data_type: str
    description: str
    example: Optional[str] = None
    source_collection: str
    sensitivity_tag: str
    usage_policy: str
    export_transform: Optional[str] = None

class ExportDefinition(BaseModel):
    name: str
    period_granularity: str
    geo_level: str
    metrics: List[str]
    k_min_threshold: int = 30

class DisputeResolution(BaseModel):
    resolution: str
    notes: Optional[str] = None
    refund_percentage: Optional[int] = None

AVAILABLE_METRICS = [
    {"id": "don_listings_created", "name": "Dons créés"},
    {"id": "don_pickups_completed", "name": "Dons récupérés"},
    {"id": "secondhand_items_sold", "name": "Ventes seconde main"},
    {"id": "rental_completed", "name": "Locations terminées"},
    {"id": "pro_baskets_sold", "name": "Paniers pro vendus"},
    {"id": "food_kg_saved_est", "name": "Nourriture sauvée (kg)"},
    {"id": "co2e_kg_saved_est", "name": "CO2 évité (kg)"},
    {"id": "active_users", "name": "Utilisateurs actifs"},
    {"id": "new_users", "name": "Nouveaux inscrits"},
]

INITIAL_DATA_DICTIONARY = [
    {"field_name": "user_id", "data_type": "uuid", "description": "Identifiant unique utilisateur", "source_collection": "users", "sensitivity_tag": "NEVER_EXPORT", "usage_policy": "JAMAIS_EXPORTER"},
    {"field_name": "email", "data_type": "string", "description": "Adresse email", "source_collection": "users", "sensitivity_tag": "NEVER_EXPORT", "usage_policy": "JAMAIS_EXPORTER"},
    {"field_name": "display_name", "data_type": "string", "description": "Nom affiché", "source_collection": "users", "sensitivity_tag": "INTERNAL", "usage_policy": "INTERNE"},
    {"field_name": "postcode", "data_type": "string", "description": "Code postal", "source_collection": "users", "sensitivity_tag": "EXPORT_SAFE", "usage_policy": "EXPORT_AGREGE", "export_transform": "aggregate_by_zone"},
    {"field_name": "city", "data_type": "string", "description": "Ville", "source_collection": "users", "sensitivity_tag": "EXPORT_SAFE", "usage_policy": "EXPORT_AGREGE", "export_transform": "aggregate_by_zone"},
    {"field_name": "price_cents", "data_type": "integer", "description": "Prix en centimes", "source_collection": "items", "sensitivity_tag": "EXPORT_SAFE", "usage_policy": "EXPORT_AGREGE", "export_transform": "price_class"},
    {"field_name": "category", "data_type": "string", "description": "Catégorie de l'article", "source_collection": "items", "sensitivity_tag": "EXPORT_SAFE", "usage_policy": "EXPORT_AGREGE"},
    {"field_name": "type", "data_type": "string", "description": "Type de transaction", "source_collection": "items", "sensitivity_tag": "EXPORT_SAFE", "usage_policy": "EXPORT_AGREGE"},
    {"field_name": "co2_saved", "data_type": "float", "description": "CO2 économisé en kg", "source_collection": "users", "sensitivity_tag": "EXPORT_SAFE", "usage_policy": "EXPORT_AGREGE"},
    {"field_name": "lat", "data_type": "float", "description": "Latitude GPS précise", "source_collection": "users", "sensitivity_tag": "NEVER_EXPORT", "usage_policy": "JAMAIS_EXPORTER"},
    {"field_name": "phone", "data_type": "string", "description": "Numéro de téléphone", "source_collection": "users", "sensitivity_tag": "NEVER_EXPORT", "usage_policy": "JAMAIS_EXPORTER"},
]


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _log_admin_action(db, admin_id: str, action: str, target_type: str, target_id: str = None, metadata: dict = None):
    """Log admin action — silently ignore if audit_logs table doesn't exist."""
    try:
        await db.admin_audit_logs.insert_one({
            "id": str(uuid.uuid4()),
            "admin_id": admin_id,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "metadata": metadata or {},
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass


def _price_class(cents: int) -> str:
    if cents == 0: return "gratuit"
    if cents < 500: return "0-5€"
    if cents < 1500: return "5-15€"
    if cents < 5000: return "15-50€"
    if cents < 10000: return "50-100€"
    return "100€+"


# ── Factory ──────────────────────────────────────────────────────────────────

def create_admin_routes(db, get_current_user_func):
    router = APIRouter(prefix="/api/admin", tags=["admin-enhanced"])

    # ── Trust level ──────────────────────────────────────────────────────────

    @router.put("/users/{user_id}/trust")
    async def update_user_trust(user_id: str, update: TrustUpdate, current_user: dict = Depends(get_current_user_func)):
        valid = ["NEW", "BASIC_VERIFIED", "TRUSTED", "RESTRICTED", "BANNED"]
        if update.trust_level not in valid:
            raise HTTPException(status_code=400, detail=f"trust_level must be one of {valid}")
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": {"trust_level": update.trust_level}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        await _log_admin_action(db, current_user["id"], "UPDATE_TRUST", "user", user_id, {"level": update.trust_level, "reason": update.reason})
        return {"message": "Trust level updated", "trust_level": update.trust_level}

    # ── Safety events ────────────────────────────────────────────────────────

    @router.get("/safety-events")
    async def get_safety_events(limit: int = 100, current_user: dict = Depends(get_current_user_func)):
        try:
            events = await db.safety_events.find().sort("created_at", -1).limit(limit).to_list(limit)
            # Enrich with user display_name
            for e in events:
                if e.get("user_id"):
                    u = await db.users.find_one({"id": e["user_id"]})
                    e["user_name"] = u.get("display_name", "?") if u else "Supprimé"
            return events
        except Exception as ex:
            logging.error(f"safety-events error: {ex}")
            return []

    # ── Event Explorer ───────────────────────────────────────────────────────

    @router.get("/events/types")
    async def get_event_types(current_user: dict = Depends(get_current_user_func)):
        return [
            {"id": "listing_created", "name": "Annonce créée"},
            {"id": "listing_reserved", "name": "Annonce réservée"},
            {"id": "order_created", "name": "Commande créée"},
            {"id": "order_completed", "name": "Commande terminée"},
            {"id": "donation_pickup", "name": "Don récupéré"},
            {"id": "rental_started", "name": "Location commencée"},
            {"id": "basket_sold", "name": "Panier vendu"},
            {"id": "user_signup", "name": "Inscription utilisateur"},
        ]

    @router.get("/events/funnel")
    async def get_events_funnel(current_user: dict = Depends(get_current_user_func)):
        try:
            listings = await db.items.count_documents({})
            orders = await db.orders.count_documents({})
            completed = await db.orders.count_documents({"payment_status": "released"})
            return {
                "funnel": [
                    {"step": "Annonces créées", "count": listings},
                    {"step": "Réservées", "count": orders},
                    {"step": "Complétées", "count": completed},
                ],
                "conversion_rates": {
                    "listings_to_reserved": round((orders / max(listings, 1)) * 100, 1),
                    "reserved_to_completed": round((completed / max(orders, 1)) * 100, 1),
                    "overall": round((completed / max(listings, 1)) * 100, 1),
                },
            }
        except Exception as ex:
            logging.error(f"events/funnel error: {ex}")
            return {"funnel": [], "conversion_rates": {}}

    @router.get("/events")
    async def get_events(limit: int = 50, event_type: str = None, current_user: dict = Depends(get_current_user_func)):
        try:
            events = []
            if not event_type or event_type in ("listing_created", ""):
                items = await db.items.find().sort("created_at", -1).limit(limit).to_list(limit)
                for i in items:
                    events.append({
                        "id": i.get("id", ""),
                        "event_type": "listing_created",
                        "timestamp": i.get("created_at"),
                        "admin_area_id": i.get("city", "?"),
                        "metadata": {"category": i.get("category"), "type": i.get("type"), "price_class": _price_class(i.get("price_cents") or 0)},
                    })
            if not event_type or event_type in ("order_created", ""):
                orders = await db.orders.find().sort("created_at", -1).limit(limit).to_list(limit)
                for o in orders:
                    events.append({
                        "id": o.get("id", ""),
                        "event_type": "order_created",
                        "timestamp": o.get("created_at"),
                        "admin_area_id": "?",
                        "metadata": {"status": o.get("payment_status"), "amount_class": _price_class(o.get("amount_cents") or 0)},
                    })
            events.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
            return events[:limit]
        except Exception as ex:
            logging.error(f"events error: {ex}")
            return []

    # ── Data Dictionary ──────────────────────────────────────────────────────

    @router.get("/data-dictionary")
    async def get_data_dictionary(current_user: dict = Depends(get_current_user_func)):
        try:
            return await db.admin_data_dictionary.find().to_list(1000)
        except Exception:
            return []

    @router.post("/data-dictionary/seed")
    async def seed_data_dictionary(current_user: dict = Depends(get_current_user_func)):
        try:
            existing = await db.admin_data_dictionary.count_documents({})
            if existing > 0:
                return {"message": "Already seeded", "count": existing}
            for entry in INITIAL_DATA_DICTIONARY:
                entry["id"] = str(uuid.uuid4())
                entry["created_at"] = datetime.utcnow()
                await db.admin_data_dictionary.insert_one(entry)
            return {"message": "Seeded", "count": len(INITIAL_DATA_DICTIONARY)}
        except Exception as ex:
            raise HTTPException(status_code=500, detail=str(ex))

    @router.post("/data-dictionary")
    async def create_data_dictionary_entry(entry: DataDictionaryEntry, current_user: dict = Depends(get_current_user_func)):
        try:
            d = entry.dict()
            d["id"] = str(uuid.uuid4())
            d["created_at"] = datetime.utcnow()
            await db.admin_data_dictionary.insert_one(d)
            return d
        except Exception as ex:
            raise HTTPException(status_code=500, detail=str(ex))

    @router.delete("/data-dictionary/{entry_id}")
    async def delete_data_dictionary_entry(entry_id: str, current_user: dict = Depends(get_current_user_func)):
        try:
            result = await db.admin_data_dictionary.delete_one({"id": entry_id})
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Not found")
            return {"message": "Deleted"}
        except HTTPException:
            raise
        except Exception as ex:
            raise HTTPException(status_code=500, detail=str(ex))

    # ── Audit Logs ───────────────────────────────────────────────────────────

    @router.get("/audit-logs")
    async def get_audit_logs(action: str = None, limit: int = 100, current_user: dict = Depends(get_current_user_func)):
        try:
            f = {}
            if action:
                f["action"] = action
            logs = await db.admin_audit_logs.find(f).sort("created_at", -1).limit(limit).to_list(limit)
            for log in logs:
                if log.get("admin_id"):
                    admin = await db.users.find_one({"id": log["admin_id"]})
                    log["admin_name"] = admin.get("display_name", "?") if admin else "?"
            return logs
        except Exception:
            return []

    # ── Disputes (admin view) ────────────────────────────────────────────────

    @router.get("/disputes-detail")
    async def get_disputes_admin(status: str = None, limit: int = 100, current_user: dict = Depends(get_current_user_func)):
        try:
            f = {}
            if status:
                f["status"] = status
            disputes = await db.disputes.find(f).sort("created_at", -1).limit(limit).to_list(limit)
            for d in disputes:
                if d.get("complainant_id"):
                    u = await db.users.find_one({"id": d["complainant_id"]})
                    d["complainant_name"] = u.get("display_name", "?") if u else "?"
                if d.get("respondent_id"):
                    u = await db.users.find_one({"id": d["respondent_id"]})
                    d["respondent_name"] = u.get("display_name", "?") if u else "?"
            return disputes
        except Exception as ex:
            logging.error(f"disputes error: {ex}")
            return []

    # ── PRO Verifications ────────────────────────────────────────────────────

    @router.get("/pro/verifications")
    async def get_pro_verifications(status: str = None, current_user: dict = Depends(get_current_user_func)):
        try:
            f = {}
            if status:
                f["status"] = status
            verifs = await db.trader_verifications.find(f).sort("created_at", -1).to_list(200)
            for v in verifs:
                pro = await db.pro_profiles.find_one({"pro_id": v.get("pro_id")})
                v["pro_profile"] = {
                    "legal_name": pro.get("legal_name") if pro else "N/A",
                    "siret": pro.get("siret") if pro else "N/A",
                    "trade_name": pro.get("trade_name") if pro else None,
                } if pro else {"legal_name": "N/A", "siret": "N/A"}
            return verifs
        except Exception as ex:
            logging.error(f"pro/verifications error: {ex}")
            return []

    @router.post("/pro/verifications/{verification_id}/approve")
    async def approve_verification(verification_id: str, current_user: dict = Depends(get_current_user_func)):
        verif = await db.trader_verifications.find_one({"id": verification_id})
        if not verif:
            raise HTTPException(status_code=404, detail="Verification not found")
        now = datetime.utcnow()
        await db.trader_verifications.update_one(
            {"id": verification_id},
            {"$set": {"status": "APPROVED", "verified_at": now, "updated_at": now, "notes_admin": f"Approved by admin {current_user.get('id')}"}}
        )
        await _log_admin_action(db, current_user["id"], "APPROVE_PRO", "trader_verification", verification_id)
        return {"message": "Approved", "status": "APPROVED"}

    @router.post("/pro/verifications/{verification_id}/reject")
    async def reject_verification(verification_id: str, reason: str = "", current_user: dict = Depends(get_current_user_func)):
        verif = await db.trader_verifications.find_one({"id": verification_id})
        if not verif:
            raise HTTPException(status_code=404, detail="Verification not found")
        now = datetime.utcnow()
        await db.trader_verifications.update_one(
            {"id": verification_id},
            {"$set": {"status": "REJECTED", "updated_at": now, "notes_admin": reason}}
        )
        await _log_admin_action(db, current_user["id"], "REJECT_PRO", "trader_verification", verification_id, {"reason": reason})
        return {"message": "Rejected", "status": "REJECTED"}

    # ── PRO Offers ───────────────────────────────────────────────────────────

    @router.get("/pro/offers")
    async def get_pro_offers(status: str = None, current_user: dict = Depends(get_current_user_func)):
        try:
            f = {}
            if status:
                f["status"] = status
            offers = await db.offer_pro.find(f).sort("created_at", -1).to_list(200)
            for o in offers:
                pro = await db.pro_profiles.find_one({"pro_id": o.get("pro_id")})
                o["pro_info"] = {"legal_name": pro.get("legal_name") if pro else "N/A", "siret": pro.get("siret") if pro else "N/A"}
            return offers
        except Exception as ex:
            logging.error(f"pro/offers error: {ex}")
            return []

    @router.post("/pro/offers/{offer_id}/suspend")
    async def suspend_offer(offer_id: str, reason: str = "", current_user: dict = Depends(get_current_user_func)):
        offer = await db.offer_pro.find_one({"id": offer_id})
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        now = datetime.utcnow()
        await db.offer_pro.update_one(
            {"id": offer_id},
            {"$set": {"status": "SUSPENDED", "suspension_reason": reason, "updated_at": now}}
        )
        await _log_admin_action(db, current_user["id"], "SUSPEND_OFFER", "offer_pro", offer_id, {"reason": reason})
        return {"message": "Suspended"}

    @router.post("/pro/offers/{offer_id}/unsuspend")
    async def unsuspend_offer(offer_id: str, current_user: dict = Depends(get_current_user_func)):
        offer = await db.offer_pro.find_one({"id": offer_id})
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        await db.offer_pro.update_one(
            {"id": offer_id},
            {"$set": {"status": "PUBLISHED", "suspension_reason": None, "updated_at": datetime.utcnow()}}
        )
        await _log_admin_action(db, current_user["id"], "UNSUSPEND_OFFER", "offer_pro", offer_id)
        return {"message": "Unsuspended"}

    # ── PRO Stats ────────────────────────────────────────────────────────────

    @router.get("/pro/stats")
    async def get_pro_stats(current_user: dict = Depends(get_current_user_func)):
        try:
            total_pros = await db.pro_profiles.count_documents({})
            pending = await db.trader_verifications.count_documents({"status": "PENDING"})
            approved = await db.trader_verifications.count_documents({"status": "APPROVED"})
            rejected = await db.trader_verifications.count_documents({"status": "REJECTED"})
            total_offers = await db.offer_pro.count_documents({})
            published = await db.offer_pro.count_documents({"status": "PUBLISHED"})
            suspended_offers = await db.offer_pro.count_documents({"status": "SUSPENDED"})
            open_disputes = await db.disputes.count_documents({"status": "open"})
            return {
                "pros": {"total": total_pros, "pending_verification": pending, "approved": approved, "rejected": rejected},
                "offers": {"total": total_offers, "published": published, "suspended": suspended_offers},
                "disputes": {"open": open_disputes},
            }
        except Exception as ex:
            logging.error(f"pro/stats error: {ex}")
            return {}

    # ── Transparency (DSA) ───────────────────────────────────────────────────

    _DEFAULT_TRANSPARENCY = {
        "ranking_text": "Tri par proximité, disponibilité, qualité de l'annonce et historique de fiabilité.",
        "dereferencing_rules_text": "Offre suspendue si : infos manquantes, contenu trompeur, signalements répétés, fraude, non-respect des conditions.",
    }

    @router.get("/transparency")
    async def get_transparency(current_user: dict = Depends(get_current_user_func)):
        try:
            config = await db.admin_transparency.find_one({})
            return config or _DEFAULT_TRANSPARENCY
        except Exception:
            return _DEFAULT_TRANSPARENCY

    @router.put("/transparency")
    async def update_transparency(ranking_text: str, dereferencing_rules_text: str, current_user: dict = Depends(get_current_user_func)):
        try:
            existing = await db.admin_transparency.find_one({})
            data = {"ranking_text": ranking_text, "dereferencing_rules_text": dereferencing_rules_text, "updated_at": datetime.utcnow()}
            if existing:
                await db.admin_transparency.update_one({"id": existing["id"]}, {"$set": data})
            else:
                data["id"] = str(uuid.uuid4())
                await db.admin_transparency.insert_one(data)
            await _log_admin_action(db, current_user["id"], "UPDATE_TRANSPARENCY", "platform_transparency")
            return {"message": "Updated"}
        except Exception as ex:
            raise HTTPException(status_code=500, detail=str(ex))

    # ── DAC7 ─────────────────────────────────────────────────────────────────

    @router.get("/dac7/jobs")
    async def get_dac7_jobs(current_user: dict = Depends(get_current_user_func)):
        try:
            return await db.dac7_export_jobs.find().sort("created_at", -1).to_list(100)
        except Exception:
            return []

    @router.post("/dac7/generate")
    async def generate_dac7(year: int, current_user: dict = Depends(get_current_user_func)):
        job = {
            "id": str(uuid.uuid4()),
            "year": year,
            "status": "processing",
            "created_at": datetime.utcnow(),
            "created_by": current_user["id"],
        }
        try:
            await db.dac7_export_jobs.insert_one(job)
        except Exception:
            pass
        await _log_admin_action(db, current_user["id"], "GENERATE_DAC7", "dac7_export", job["id"], {"year": year})
        return {"message": "DAC7 generation started", "job_id": job["id"]}

    # ── Export Definitions ────────────────────────────────────────────────────

    @router.get("/export-definitions/metrics")
    async def get_metrics(current_user: dict = Depends(get_current_user_func)):
        return AVAILABLE_METRICS

    @router.get("/export-definitions")
    async def get_export_definitions(current_user: dict = Depends(get_current_user_func)):
        try:
            return await db.admin_export_definitions.find().sort("created_at", -1).to_list(100)
        except Exception:
            return []

    @router.post("/export-definitions")
    async def create_export_definition(definition: ExportDefinition, current_user: dict = Depends(get_current_user_func)):
        try:
            d = definition.dict()
            d["id"] = str(uuid.uuid4())
            d["created_at"] = datetime.utcnow()
            d["created_by"] = current_user["id"]
            await db.admin_export_definitions.insert_one(d)
            await _log_admin_action(db, current_user["id"], "CREATE", "export_definition", d["id"])
            return d
        except Exception as ex:
            raise HTTPException(status_code=500, detail=str(ex))

    @router.get("/exports")
    async def get_export_runs(current_user: dict = Depends(get_current_user_func)):
        try:
            return await db.admin_export_runs.find().sort("created_at", -1).to_list(100)
        except Exception:
            return []

    return router
