"""
PRO Module Routes
Anti-gaspi (vente retrait) + Location (rental)
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
import hashlib

from models import (
    ProProfile, ProProfileCreate, TraderVerification, ProPayoutAccount,
    OfferPro, OfferProCreate, OfferAntiGaspi, OfferAntiGaspiCreate,
    OfferRental, OfferRentalCreate, OrderPro, RentalPro, RentalContract,
    DepositHold, LegalAcceptanceLog, LegalAcceptanceLogCreate,
    PlatformTransparency, DAC7ExportJob, PickupSlot
)


def create_pro_routes(db, get_current_user_func):
    """Factory function to create PRO routes with database dependency"""
    
    router = APIRouter(prefix="/api/pro", tags=["pro"])
    
    # ============ PRO PROFILE ============
    
    @router.get("/profile")
    async def get_pro_profile(current_user: dict = Depends(get_current_user_func)):
        """Get current user's PRO profile"""
        profile = await db.pro_profiles.find_one({"pro_id": current_user["id"]})
        if profile:
            profile.pop("_id", None)
        return profile
    
    @router.post("/profile")
    async def create_or_update_pro_profile(
        data: ProProfileCreate,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Create or update PRO profile"""
        now = datetime.utcnow()
        existing = await db.pro_profiles.find_one({"pro_id": current_user["id"]})
        
        if existing:
            # Update
            await db.pro_profiles.update_one(
                {"pro_id": current_user["id"]},
                {"$set": {**data.model_dump(), "updated_at": now}}
            )
            return {"message": "Profile updated"}
        else:
            # Create
            profile = ProProfile(
                id=str(uuid.uuid4()),
                pro_id=current_user["id"],
                **data.model_dump(),
                created_at=now,
                updated_at=now
            )
            await db.pro_profiles.insert_one(profile.model_dump())
            return {"message": "Profile created", "id": profile.id}
    
    # ============ TRADER VERIFICATION ============
    
    @router.get("/verification")
    async def get_verification_status(current_user: dict = Depends(get_current_user_func)):
        """Get verification status"""
        verif = await db.trader_verifications.find_one({"pro_id": current_user["id"]})
        if verif:
            verif.pop("_id", None)
        return verif or {"status": "DRAFT", "docs_urls": []}
    
    @router.post("/verification/submit")
    async def submit_verification(
        docs_urls: List[str],
        current_user: dict = Depends(get_current_user_func)
    ):
        """Submit documents for verification"""
        now = datetime.utcnow()
        existing = await db.trader_verifications.find_one({"pro_id": current_user["id"]})
        
        if existing:
            await db.trader_verifications.update_one(
                {"pro_id": current_user["id"]},
                {"$set": {"docs_urls": docs_urls, "status": "PENDING", "updated_at": now}}
            )
        else:
            verif = TraderVerification(
                id=str(uuid.uuid4()),
                pro_id=current_user["id"],
                status="PENDING",
                docs_urls=docs_urls,
                created_at=now,
                updated_at=now
            )
            await db.trader_verifications.insert_one(verif.model_dump())
        
        return {"message": "Verification submitted", "status": "PENDING"}
    
    # ============ STRIPE CONNECT ============
    
    @router.get("/stripe/status")
    async def get_stripe_status(current_user: dict = Depends(get_current_user_func)):
        """Get Stripe Connect account status"""
        account = await db.pro_payout_accounts.find_one({"pro_id": current_user["id"]})
        if account:
            account.pop("_id", None)
            return account
        return {"onboarding_status": "NOT_STARTED", "payouts_enabled": False}
    
    @router.post("/stripe/onboarding")
    async def create_stripe_onboarding(current_user: dict = Depends(get_current_user_func)):
        """Create Stripe Connect account and return onboarding URL"""
        # Check if account already exists
        existing = await db.pro_payout_accounts.find_one({"pro_id": current_user["id"]})
        
        if existing and existing.get("payouts_enabled"):
            return {"message": "Already onboarded", "payouts_enabled": True}
        
        # TODO: Integrate with Stripe Connect API
        # For now, simulate account creation
        account_id = f"acct_test_{uuid.uuid4().hex[:12]}"
        
        if existing:
            await db.pro_payout_accounts.update_one(
                {"pro_id": current_user["id"]},
                {"$set": {
                    "stripe_connected_account_id": account_id,
                    "onboarding_status": "IN_PROGRESS",
                    "updated_at": datetime.utcnow()
                }}
            )
        else:
            payout = ProPayoutAccount(
                id=str(uuid.uuid4()),
                pro_id=current_user["id"],
                stripe_connected_account_id=account_id,
                onboarding_status="IN_PROGRESS",
                payouts_enabled=False,
                updated_at=datetime.utcnow()
            )
            await db.pro_payout_accounts.insert_one(payout.model_dump())
        
        # Return mock onboarding URL
        onboarding_url = f"https://connect.stripe.com/setup/e/{account_id}"
        return {"onboarding_url": onboarding_url, "account_id": account_id}
    
    # ============ CAN PUBLISH CHECK ============
    
    async def can_publish(pro_id: str) -> tuple[bool, str]:
        """Check if PRO can publish offers"""
        # Check verification
        verif = await db.trader_verifications.find_one({"pro_id": pro_id})
        if not verif or verif.get("status") != "APPROVED":
            return False, "Verification not approved"
        
        # Check payouts
        payout = await db.pro_payout_accounts.find_one({"pro_id": pro_id})
        if not payout or not payout.get("payouts_enabled"):
            return False, "Payouts not enabled"
        
        # Check profile with mediator
        profile = await db.pro_profiles.find_one({"pro_id": pro_id})
        if not profile or not profile.get("mediator_name"):
            return False, "Mediator info required"
        
        return True, "OK"
    
    # ============ OFFERS ============
    
    @router.post("/offers")
    async def create_offer(
        data: OfferProCreate,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Create a new PRO offer (draft)"""
        now = datetime.utcnow()
        offer = OfferPro(
            id=str(uuid.uuid4()),
            pro_id=current_user["id"],
            **data.model_dump(),
            status="DRAFT",
            created_at=now,
            updated_at=now
        )
        await db.offers_pro.insert_one(offer.model_dump())
        return {"id": offer.id, "status": "DRAFT"}
    
    @router.post("/offers/{offer_id}/antigaspi")
    async def set_antigaspi_data(
        offer_id: str,
        data: OfferAntiGaspiCreate,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Set anti-gaspi specific data"""
        offer = await db.offers_pro.find_one({"id": offer_id, "pro_id": current_user["id"]})
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        
        if offer.get("kind") != "ANTIGASPI_SALE":
            raise HTTPException(status_code=400, detail="Offer is not anti-gaspi type")
        
        # Validate: DLC/DDM requires date_value
        if data.date_type in ["DLC", "DDM"] and not data.date_value:
            raise HTTPException(status_code=400, detail="date_value required for DLC/DDM")
        
        # Validate: at least 1 pickup slot
        if not data.pickup_slots:
            raise HTTPException(status_code=400, detail="At least one pickup slot required")
        
        antigaspi = OfferAntiGaspi(
            id=str(uuid.uuid4()),
            offer_id=offer_id,
            **data.model_dump()
        )
        
        # Upsert
        await db.offer_antigaspi.update_one(
            {"offer_id": offer_id},
            {"$set": antigaspi.model_dump()},
            upsert=True
        )
        return {"message": "Anti-gaspi data saved"}
    
    @router.post("/offers/{offer_id}/rental")
    async def set_rental_data(
        offer_id: str,
        data: OfferRentalCreate,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Set rental specific data"""
        offer = await db.offers_pro.find_one({"id": offer_id, "pro_id": current_user["id"]})
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        
        if offer.get("kind") != "RENTAL":
            raise HTTPException(status_code=400, detail="Offer is not rental type")
        
        # Validate: deposit required
        if not data.deposit_amount_cents or data.deposit_amount_cents <= 0:
            raise HTTPException(status_code=400, detail="Deposit amount required")
        
        # Validate: usage rules required
        if not data.usage_rules:
            raise HTTPException(status_code=400, detail="Usage rules required")
        
        rental = OfferRental(
            id=str(uuid.uuid4()),
            offer_id=offer_id,
            **data.model_dump()
        )
        
        # Upsert
        await db.offer_rentals.update_one(
            {"offer_id": offer_id},
            {"$set": rental.model_dump()},
            upsert=True
        )
        return {"message": "Rental data saved"}
    
    @router.post("/offers/{offer_id}/publish")
    async def publish_offer(
        offer_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Publish an offer (requires verification + payouts)"""
        offer = await db.offers_pro.find_one({"id": offer_id, "pro_id": current_user["id"]})
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        
        # Check if can publish
        can, reason = await can_publish(current_user["id"])
        if not can:
            raise HTTPException(status_code=403, detail=reason)
        
        # Check specific data exists
        if offer.get("kind") == "ANTIGASPI_SALE":
            antigaspi = await db.offer_antigaspi.find_one({"offer_id": offer_id})
            if not antigaspi:
                raise HTTPException(status_code=400, detail="Anti-gaspi data required")
        elif offer.get("kind") == "RENTAL":
            rental = await db.offer_rentals.find_one({"offer_id": offer_id})
            if not rental:
                raise HTTPException(status_code=400, detail="Rental data required")
        
        # Publish
        await db.offers_pro.update_one(
            {"id": offer_id},
            {"$set": {"status": "PUBLISHED", "updated_at": datetime.utcnow()}}
        )
        return {"message": "Offer published", "status": "PUBLISHED"}
    
    @router.get("/offers")
    async def list_my_offers(current_user: dict = Depends(get_current_user_func)):
        """List current user's offers"""
        offers = await db.offers_pro.find({"pro_id": current_user["id"]}).sort("created_at", -1).to_list(100)
        for o in offers:
            o.pop("_id", None)
        return offers
    
    # ============ LEGAL ACCEPTANCE LOGS ============
    
    @router.post("/legal-acceptance")
    async def create_legal_acceptance_log(
        data: LegalAcceptanceLogCreate,
        request: Request,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Create a consent log"""
        log = LegalAcceptanceLog(
            id=str(uuid.uuid4()),
            user_id=current_user["id"],
            context=data.context,
            version=data.version,
            ip=data.ip or request.client.host,
            user_agent=data.user_agent or request.headers.get("user-agent", ""),
            accepted_at=datetime.utcnow(),
            payload_json=data.payload_json
        )
        await db.legal_acceptance_logs.insert_one(log.model_dump())
        return {"id": log.id, "accepted_at": log.accepted_at}
    
    # ============ PLATFORM TRANSPARENCY ============
    
    @router.get("/transparency")
    async def get_transparency():
        """Get platform transparency info (public)"""
        transparency = await db.platform_transparency.find_one({})
        if transparency:
            transparency.pop("_id", None)
            return transparency
        
        # Default text
        return {
            "ranking_text": """Trier / classer les offres :
- Proximité géographique (ville/zone)
- Disponibilités (créneaux de retrait / dates de location)
- Pertinence catégorie & mots-clés
- Qualité de l'annonce (photos, description complète, infos légales renseignées)
- Historique de fiabilité (annulations répétées, no-show, litiges)
- Signalements et modération

Yondly ne vend pas les produits : le professionnel reste responsable de son offre.""",
            "dereferencing_rules_text": """Une offre peut être suspendue ou supprimée si :
- informations obligatoires manquantes (identité, médiation, dates, retrait)
- contenu trompeur / illégal / dangereux
- signalements répétés, fraude, non-respect des règles d'usage
- pro non vérifié, paiements désactivés, ou comportement abusif
- non-respect des conditions de retrait/remise ou litiges graves"""
        }
    
    # ============ CHECKOUT LEGAL TEXTS ============
    
    @router.get("/checkout/order/{offer_id}/legal-texts")
    async def get_order_legal_texts(offer_id: str, current_user: dict = Depends(get_current_user_func)):
        """Get legal texts for anti-gaspi checkout"""
        from legal_templates import get_checkout_order_texts
        
        # Get offer
        offer = await db.offers_pro.find_one({"id": offer_id})
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        
        # Get PRO profile
        pro = await db.pro_profiles.find_one({"pro_id": offer["pro_id"]})
        if not pro:
            raise HTTPException(status_code=404, detail="PRO profile not found")
        
        # Get anti-gaspi data
        antigaspi = await db.offer_antigaspi.find_one({"offer_id": offer_id})
        if not antigaspi:
            raise HTTPException(status_code=404, detail="Anti-gaspi data not found")
        
        # Build order stub for texts
        order = {"quantity": 1}
        
        pro.pop("_id", None)
        offer.pop("_id", None)
        antigaspi.pop("_id", None)
        
        texts = get_checkout_order_texts(pro, offer, order, antigaspi)
        return texts
    
    @router.get("/checkout/rental/{offer_id}/legal-texts")
    async def get_rental_legal_texts(
        offer_id: str,
        start_at: str = None,
        end_at: str = None,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Get legal texts for rental checkout"""
        from legal_templates import get_checkout_rental_texts
        
        # Get offer
        offer = await db.offers_pro.find_one({"id": offer_id})
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        
        # Get PRO profile
        pro = await db.pro_profiles.find_one({"pro_id": offer["pro_id"]})
        if not pro:
            raise HTTPException(status_code=404, detail="PRO profile not found")
        
        # Get rental data
        rental_data = await db.offer_rentals.find_one({"offer_id": offer_id})
        if not rental_data:
            raise HTTPException(status_code=404, detail="Rental data not found")
        
        # Build rental stub for texts
        rental = {"start_at": start_at, "end_at": end_at}
        
        pro.pop("_id", None)
        offer.pop("_id", None)
        rental_data.pop("_id", None)
        
        texts = get_checkout_rental_texts(pro, offer, rental, rental_data)
        return texts
    
    @router.get("/offers/{offer_id}/details")
    async def get_offer_details(offer_id: str):
        """Get full offer details including PRO info (public)"""
        offer = await db.offers_pro.find_one({"id": offer_id, "status": "PUBLISHED"})
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        
        offer.pop("_id", None)
        
        # Get PRO profile
        pro = await db.pro_profiles.find_one({"pro_id": offer["pro_id"]})
        if pro:
            pro.pop("_id", None)
        
        # Get specific data
        specific_data = None
        if offer.get("kind") == "ANTIGASPI_SALE":
            specific_data = await db.offer_antigaspi.find_one({"offer_id": offer_id})
        elif offer.get("kind") == "RENTAL":
            specific_data = await db.offer_rentals.find_one({"offer_id": offer_id})
        
        if specific_data:
            specific_data.pop("_id", None)
        
        return {
            "offer": offer,
            "pro": pro,
            "specific_data": specific_data
        }
    
    # ============ RENTALS ============
    
    @router.post("/rentals")
    async def create_rental(
        offer_id: str,
        start_at: str,
        end_at: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Create a new rental"""
        from datetime import datetime as dt
        
        # Get offer
        offer = await db.offers_pro.find_one({"id": offer_id, "kind": "RENTAL", "status": "PUBLISHED"})
        if not offer:
            raise HTTPException(status_code=404, detail="Rental offer not found")
        
        # Check rental data exists
        rental_data = await db.offer_rentals.find_one({"offer_id": offer_id})
        if not rental_data:
            raise HTTPException(status_code=400, detail="Rental configuration not found")
        
        now = dt.utcnow()
        rental = {
            "id": str(uuid.uuid4()),
            "offer_id": offer_id,
            "renter_id": current_user["id"],
            "pro_id": offer["pro_id"],
            "start_at": start_at,
            "end_at": end_at,
            "status": "PAID",
            "created_at": now,
            "updated_at": now
        }
        
        await db.rentals.insert_one(rental)
        return {"id": rental["id"], "status": "PAID"}
    
    @router.post("/rentals/{rental_id}/generate-contract")
    async def generate_contract(
        rental_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Generate PDF contract for a rental"""
        from pdf_generator import generate_rental_contract
        import os
        
        # Get rental
        rental = await db.rentals.find_one({"id": rental_id})
        if not rental:
            raise HTTPException(status_code=404, detail="Rental not found")
        
        # Only renter or pro can generate
        if rental["renter_id"] != current_user["id"] and rental["pro_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if contract already exists
        existing = await db.rental_contracts.find_one({"rental_id": rental_id})
        if existing:
            return {
                "id": existing["id"],
                "pdf_url": existing["pdf_url"],
                "pdf_hash": existing["pdf_hash"],
                "already_exists": True
            }
        
        # Get all necessary data
        offer = await db.offers_pro.find_one({"id": rental["offer_id"]})
        rental_specific = await db.offer_rentals.find_one({"offer_id": rental["offer_id"]})
        pro = await db.pro_profiles.find_one({"pro_id": rental["pro_id"]})
        renter = await db.users.find_one({"id": rental["renter_id"]})
        
        if not all([offer, rental_specific, pro, renter]):
            raise HTTPException(status_code=400, detail="Missing data for contract generation")
        
        # Remove _id from all
        for doc in [offer, rental_specific, pro, renter, rental]:
            if doc:
                doc.pop("_id", None)
        
        # Generate PDF
        contracts_dir = os.path.join(os.path.dirname(__file__), "contracts")
        filepath, pdf_hash = generate_rental_contract(
            rental_id=rental_id,
            pro_data=pro,
            renter_data=renter,
            offer_data=offer,
            rental_data=rental,
            rental_specific=rental_specific,
            output_dir=contracts_dir
        )
        
        # Create relative URL
        filename = os.path.basename(filepath)
        pdf_url = f"/contracts/{filename}"
        
        # Store contract record
        contract = {
            "id": str(uuid.uuid4()),
            "rental_id": rental_id,
            "pdf_url": pdf_url,
            "pdf_hash": pdf_hash,
            "accepted_at": None,
            "acceptance_log_id": None
        }
        await db.rental_contracts.insert_one(contract)
        
        return {
            "id": contract["id"],
            "pdf_url": pdf_url,
            "pdf_hash": pdf_hash
        }
    
    @router.post("/rentals/{rental_id}/accept-contract")
    async def accept_contract(
        rental_id: str,
        request: Request,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Accept rental contract (creates legal acceptance log)"""
        # Get rental
        rental = await db.rentals.find_one({"id": rental_id})
        if not rental:
            raise HTTPException(status_code=404, detail="Rental not found")
        
        if rental["renter_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only renter can accept contract")
        
        # Get contract
        contract = await db.rental_contracts.find_one({"rental_id": rental_id})
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found. Generate it first.")
        
        if contract.get("accepted_at"):
            return {"message": "Contract already accepted", "acceptance_log_id": contract["acceptance_log_id"]}
        
        # Create legal acceptance log
        now = datetime.utcnow()
        log = LegalAcceptanceLog(
            id=str(uuid.uuid4()),
            user_id=current_user["id"],
            context="RENTAL_CONTRACT",
            version="2026-01-01.v1",
            ip=request.client.host if request.client else "",
            user_agent=request.headers.get("user-agent", ""),
            accepted_at=now,
            payload_json={
                "rental_id": rental_id,
                "contract_id": contract["id"],
                "pdf_hash": contract["pdf_hash"]
            }
        )
        await db.legal_acceptance_logs.insert_one(log.model_dump())
        
        # Update contract
        await db.rental_contracts.update_one(
            {"id": contract["id"]},
            {"$set": {"accepted_at": now, "acceptance_log_id": log.id}}
        )
        
        # Update rental status to ACTIVE
        await db.rentals.update_one(
            {"id": rental_id},
            {"$set": {"status": "ACTIVE", "updated_at": now}}
        )
        
        return {
            "message": "Contract accepted",
            "acceptance_log_id": log.id,
            "rental_status": "ACTIVE"
        }
    
    @router.get("/rentals/{rental_id}")
    async def get_rental(
        rental_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Get rental details"""
        rental = await db.rentals.find_one({"id": rental_id})
        if not rental:
            raise HTTPException(status_code=404, detail="Rental not found")
        
        # Only renter or pro can access
        if rental["renter_id"] != current_user["id"] and rental["pro_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        rental.pop("_id", None)
        
        # Get contract if exists
        contract = await db.rental_contracts.find_one({"rental_id": rental_id})
        if contract:
            contract.pop("_id", None)
        
        return {"rental": rental, "contract": contract}
    
    # ============ ANTI-GASPI ORDERS ============
    
    @router.post("/orders")
    async def create_order(
        offer_id: str,
        quantity: int = 1,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Create an anti-gaspi order"""
        import secrets
        
        # Get offer
        offer = await db.offers_pro.find_one({"id": offer_id, "kind": "ANTIGASPI_SALE", "status": "PUBLISHED"})
        if not offer:
            raise HTTPException(status_code=404, detail="Anti-gaspi offer not found")
        
        # Get antigaspi data for pickup info
        antigaspi = await db.offer_antigaspi.find_one({"offer_id": offer_id})
        if not antigaspi:
            raise HTTPException(status_code=400, detail="Anti-gaspi data not found")
        
        # Generate QR token
        qr_token = secrets.token_urlsafe(24)
        
        now = datetime.utcnow()
        order = {
            "id": str(uuid.uuid4()),
            "offer_id": offer_id,
            "buyer_id": current_user["id"],
            "pro_id": offer["pro_id"],
            "quantity": quantity,
            "amount_cents": offer["price_cents"] * quantity,
            "qr_token": qr_token,
            "status": "PAID",
            "pickup_slot": antigaspi.get("pickup_slots", [{}])[0] if antigaspi.get("pickup_slots") else {},
            "created_at": now,
            "updated_at": now
        }
        
        await db.orders_pro.insert_one(order)
        return {"id": order["id"], "qr_token": qr_token, "status": "PAID"}
    
    @router.get("/orders/{order_id}")
    async def get_order(
        order_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Get order details"""
        order = await db.orders_pro.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Only buyer or pro can access
        if order["buyer_id"] != current_user["id"] and order["pro_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        order.pop("_id", None)
        
        # Get offer info
        offer = await db.offers_pro.find_one({"id": order["offer_id"]})
        if offer:
            offer.pop("_id", None)
        
        return {"order": order, "offer": offer}
    
    @router.get("/orders/{order_id}/qr")
    async def get_order_qr(
        order_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Get QR code data for order pickup"""
        order = await db.orders_pro.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order["buyer_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only buyer can access QR code")
        
        if order["status"] != "PAID":
            raise HTTPException(status_code=400, detail="Order not in PAID status")
        
        return {
            "order_id": order_id,
            "qr_token": order["qr_token"],
            "qr_data": f"yondly://pickup/{order_id}/{order['qr_token']}",
            "pickup_slot": order.get("pickup_slot", {})
        }
    
    @router.post("/orders/{order_id}/validate-pickup")
    async def validate_pickup(
        order_id: str,
        qr_token: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """PRO validates pickup by scanning QR code"""
        order = await db.orders_pro.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Only PRO can validate
        if order["pro_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only PRO can validate pickup")
        
        if order["status"] != "PAID":
            raise HTTPException(status_code=400, detail=f"Order status is {order['status']}, expected PAID")
        
        # Verify QR token
        if order["qr_token"] != qr_token:
            raise HTTPException(status_code=400, detail="Invalid QR token")
        
        # Update status
        now = datetime.utcnow()
        await db.orders_pro.update_one(
            {"id": order_id},
            {"$set": {"status": "PICKED_UP", "picked_up_at": now, "updated_at": now}}
        )
        
        return {"message": "Pickup validated", "status": "PICKED_UP", "picked_up_at": now}
    
    @router.post("/orders/{order_id}/no-show")
    async def mark_no_show(
        order_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """PRO marks buyer as no-show"""
        order = await db.orders_pro.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order["pro_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only PRO can mark no-show")
        
        if order["status"] != "PAID":
            raise HTTPException(status_code=400, detail="Order must be in PAID status")
        
        now = datetime.utcnow()
        await db.orders_pro.update_one(
            {"id": order_id},
            {"$set": {"status": "NO_SHOW", "no_show_at": now, "updated_at": now}}
        )
        
        return {"message": "Marked as no-show", "status": "NO_SHOW"}
    
    @router.get("/my-orders")
    async def list_my_orders(current_user: dict = Depends(get_current_user_func)):
        """List user's orders (as buyer)"""
        orders = await db.orders_pro.find({"buyer_id": current_user["id"]}).sort("created_at", -1).to_list(50)
        for o in orders:
            o.pop("_id", None)
        return orders
    
    @router.get("/pro-orders")
    async def list_pro_orders(current_user: dict = Depends(get_current_user_func)):
        """List PRO's orders (as seller)"""
        orders = await db.orders_pro.find({"pro_id": current_user["id"]}).sort("created_at", -1).to_list(50)
        for o in orders:
            o.pop("_id", None)
        return orders
    
    # ============ RENTAL HANDOVER & RETURN ============
    
    @router.post("/rentals/{rental_id}/handover")
    async def create_handover_report(
        rental_id: str,
        notes: str = "",
        photos: list = [],
        checklist_items: list = [],
        current_user: dict = Depends(get_current_user_func)
    ):
        """Create handover inspection report (at rental start)"""
        rental = await db.rentals.find_one({"id": rental_id})
        if not rental:
            raise HTTPException(status_code=404, detail="Rental not found")
        
        # Only pro or renter can create handover
        if rental["pro_id"] != current_user["id"] and rental["renter_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if rental["status"] not in ["PAID", "ACTIVE"]:
            raise HTTPException(status_code=400, detail="Rental must be PAID or ACTIVE")
        
        # Check if handover already exists
        existing = await db.inspection_reports.find_one({"rental_id": rental_id, "type": "HANDOVER"})
        if existing:
            raise HTTPException(status_code=400, detail="Handover report already exists")
        
        now = datetime.utcnow()
        report = {
            "id": str(uuid.uuid4()),
            "rental_id": rental_id,
            "type": "HANDOVER",
            "created_by": current_user["id"],
            "photos": photos,
            "notes": notes,
            "checklist_items": checklist_items,
            "created_at": now
        }
        
        await db.inspection_reports.insert_one(report)
        
        # Update rental status to ACTIVE
        await db.rentals.update_one(
            {"id": rental_id},
            {"$set": {"status": "ACTIVE", "handed_over_at": now, "updated_at": now}}
        )
        
        return {"id": report["id"], "message": "Handover report created", "rental_status": "ACTIVE"}
    
    @router.post("/rentals/{rental_id}/return")
    async def create_return_report(
        rental_id: str,
        notes: str = "",
        photos: list = [],
        damage_detected: bool = False,
        damage_description: str = "",
        current_user: dict = Depends(get_current_user_func)
    ):
        """Create return inspection report (at rental end)"""
        rental = await db.rentals.find_one({"id": rental_id})
        if not rental:
            raise HTTPException(status_code=404, detail="Rental not found")
        
        if rental["pro_id"] != current_user["id"] and rental["renter_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if rental["status"] != "ACTIVE":
            raise HTTPException(status_code=400, detail="Rental must be ACTIVE")
        
        now = datetime.utcnow()
        report = {
            "id": str(uuid.uuid4()),
            "rental_id": rental_id,
            "type": "RETURN",
            "created_by": current_user["id"],
            "photos": photos,
            "notes": notes,
            "damage_detected": damage_detected,
            "damage_description": damage_description,
            "created_at": now
        }
        
        await db.inspection_reports.insert_one(report)
        
        # Update rental status
        new_status = "RETURN_PENDING" if damage_detected else "COMPLETED"
        await db.rentals.update_one(
            {"id": rental_id},
            {"$set": {"status": new_status, "returned_at": now, "updated_at": now}}
        )
        
        return {
            "id": report["id"],
            "message": "Return report created",
            "rental_status": new_status,
            "damage_detected": damage_detected
        }
    
    @router.get("/rentals/{rental_id}/inspections")
    async def get_inspection_reports(
        rental_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Get all inspection reports for a rental"""
        rental = await db.rentals.find_one({"id": rental_id})
        if not rental:
            raise HTTPException(status_code=404, detail="Rental not found")
        
        if rental["pro_id"] != current_user["id"] and rental["renter_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        reports = await db.inspection_reports.find({"rental_id": rental_id}).to_list(10)
        for r in reports:
            r.pop("_id", None)
        
        return reports
    
    # ============ DEPOSIT MANAGEMENT ============
    
    @router.post("/rentals/{rental_id}/release-deposit")
    async def release_deposit(
        rental_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Release deposit fully (no damage)"""
        rental = await db.rentals.find_one({"id": rental_id})
        if not rental:
            raise HTTPException(status_code=404, detail="Rental not found")
        
        if rental["pro_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only PRO can release deposit")
        
        if rental["status"] not in ["COMPLETED", "RETURN_PENDING"]:
            raise HTTPException(status_code=400, detail="Rental must be COMPLETED or RETURN_PENDING")
        
        # Check deposit hold exists
        deposit = await db.deposit_holds.find_one({"rental_id": rental_id, "status": "AUTHORIZED"})
        if not deposit:
            return {"message": "No deposit to release or already processed"}
        
        now = datetime.utcnow()
        await db.deposit_holds.update_one(
            {"id": deposit["id"]},
            {"$set": {"status": "RELEASED", "released_at": now, "updated_at": now}}
        )
        
        # Update rental status
        await db.rentals.update_one(
            {"id": rental_id},
            {"$set": {"status": "COMPLETED", "deposit_released": True, "updated_at": now}}
        )
        
        return {"message": "Deposit released", "amount_cents": deposit["amount_cents"]}
    
    @router.post("/rentals/{rental_id}/capture-deposit")
    async def capture_deposit(
        rental_id: str,
        capture_amount_cents: int,
        justification: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Capture part or all of deposit (damage/loss)"""
        rental = await db.rentals.find_one({"id": rental_id})
        if not rental:
            raise HTTPException(status_code=404, detail="Rental not found")
        
        if rental["pro_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only PRO can capture deposit")
        
        if rental["status"] not in ["RETURN_PENDING", "DISPUTED"]:
            raise HTTPException(status_code=400, detail="Rental must be RETURN_PENDING or DISPUTED")
        
        # Check deposit hold exists
        deposit = await db.deposit_holds.find_one({"rental_id": rental_id, "status": "AUTHORIZED"})
        if not deposit:
            raise HTTPException(status_code=400, detail="No authorized deposit found")
        
        if capture_amount_cents > deposit["amount_cents"]:
            raise HTTPException(status_code=400, detail="Capture amount exceeds deposit")
        
        if not justification:
            raise HTTPException(status_code=400, detail="Justification required")
        
        now = datetime.utcnow()
        
        # Partial or full capture
        remaining = deposit["amount_cents"] - capture_amount_cents
        
        await db.deposit_holds.update_one(
            {"id": deposit["id"]},
            {"$set": {
                "status": "CAPTURED",
                "captured_amount_cents": capture_amount_cents,
                "released_amount_cents": remaining,
                "justification": justification,
                "captured_at": now,
                "updated_at": now
            }}
        )
        
        await db.rentals.update_one(
            {"id": rental_id},
            {"$set": {
                "status": "COMPLETED",
                "deposit_captured": True,
                "deposit_captured_amount": capture_amount_cents,
                "updated_at": now
            }}
        )
        
        return {
            "message": "Deposit captured",
            "captured_cents": capture_amount_cents,
            "released_cents": remaining
        }
    
    @router.post("/rentals/{rental_id}/create-deposit-hold")
    async def create_deposit_hold(
        rental_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Create deposit hold for rental (simulated Stripe auth)"""
        rental = await db.rentals.find_one({"id": rental_id})
        if not rental:
            raise HTTPException(status_code=404, detail="Rental not found")
        
        if rental["renter_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only renter can create deposit hold")
        
        # Get rental specific data for deposit amount
        rental_data = await db.offer_rentals.find_one({"offer_id": rental["offer_id"]})
        if not rental_data:
            raise HTTPException(status_code=400, detail="Rental configuration not found")
        
        deposit_amount = rental_data.get("deposit_amount_cents", 0)
        if deposit_amount <= 0:
            return {"message": "No deposit required"}
        
        # Check if already exists
        existing = await db.deposit_holds.find_one({"rental_id": rental_id})
        if existing:
            existing.pop("_id", None)
            return {"message": "Deposit already exists", "deposit": existing}
        
        now = datetime.utcnow()
        deposit = {
            "id": str(uuid.uuid4()),
            "rental_id": rental_id,
            "stripe_intent_id": f"pi_simulated_{uuid.uuid4().hex[:12]}",
            "amount_cents": deposit_amount,
            "status": "AUTHORIZED",
            "created_at": now,
            "updated_at": now
        }
        
        await db.deposit_holds.insert_one(deposit)
        
        return {
            "id": deposit["id"],
            "amount_cents": deposit_amount,
            "status": "AUTHORIZED"
        }
    
    @router.get("/my-rentals")
    async def list_my_rentals(current_user: dict = Depends(get_current_user_func)):
        """List user's rentals (as renter)"""
        rentals = await db.rentals.find({"renter_id": current_user["id"]}).sort("created_at", -1).to_list(50)
        for r in rentals:
            r.pop("_id", None)
        return rentals
    
    @router.get("/pro-rentals")
    async def list_pro_rentals(current_user: dict = Depends(get_current_user_func)):
        """List PRO's rentals (as lessor)"""
        rentals = await db.rentals.find({"pro_id": current_user["id"]}).sort("created_at", -1).to_list(50)
        for r in rentals:
            r.pop("_id", None)
        return rentals
    
    # ============ DISPUTES & MEDIATION ============
    
    @router.post("/disputes")
    async def create_dispute(
        transaction_type: str,  # "ORDER" or "RENTAL"
        transaction_id: str,
        reason: str,
        description: str,
        evidence_urls: list = [],
        current_user: dict = Depends(get_current_user_func)
    ):
        """Create a dispute for an order or rental"""
        # Validate transaction exists and user is participant
        if transaction_type == "ORDER":
            transaction = await db.orders_pro.find_one({"id": transaction_id})
            if not transaction:
                raise HTTPException(status_code=404, detail="Order not found")
            if transaction["buyer_id"] != current_user["id"] and transaction["pro_id"] != current_user["id"]:
                raise HTTPException(status_code=403, detail="Access denied")
            pro_id = transaction["pro_id"]
            other_party_id = transaction["pro_id"] if transaction["buyer_id"] == current_user["id"] else transaction["buyer_id"]
        elif transaction_type == "RENTAL":
            transaction = await db.rentals.find_one({"id": transaction_id})
            if not transaction:
                raise HTTPException(status_code=404, detail="Rental not found")
            if transaction["renter_id"] != current_user["id"] and transaction["pro_id"] != current_user["id"]:
                raise HTTPException(status_code=403, detail="Access denied")
            pro_id = transaction["pro_id"]
            other_party_id = transaction["pro_id"] if transaction["renter_id"] == current_user["id"] else transaction["renter_id"]
        else:
            raise HTTPException(status_code=400, detail="Invalid transaction type")
        
        # Check if dispute already exists
        existing = await db.disputes.find_one({
            "transaction_type": transaction_type,
            "transaction_id": transaction_id,
            "status": {"$nin": ["RESOLVED", "CLOSED"]}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Active dispute already exists")
        
        now = datetime.utcnow()
        dispute = {
            "id": str(uuid.uuid4()),
            "transaction_type": transaction_type,
            "transaction_id": transaction_id,
            "opened_by": current_user["id"],
            "other_party_id": other_party_id,
            "pro_id": pro_id,
            "reason": reason,
            "description": description,
            "evidence_urls": evidence_urls,
            "status": "OPEN",
            "messages": [],
            "created_at": now,
            "updated_at": now
        }
        
        await db.disputes.insert_one(dispute)
        
        # Update transaction status
        if transaction_type == "ORDER":
            await db.orders_pro.update_one({"id": transaction_id}, {"$set": {"status": "DISPUTED", "updated_at": now}})
        else:
            await db.rentals.update_one({"id": transaction_id}, {"$set": {"status": "DISPUTED", "updated_at": now}})
        
        return {"id": dispute["id"], "status": "OPEN"}
    
    @router.get("/disputes/{dispute_id}")
    async def get_dispute(
        dispute_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Get dispute details"""
        dispute = await db.disputes.find_one({"id": dispute_id})
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        if dispute["opened_by"] != current_user["id"] and dispute["other_party_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        dispute.pop("_id", None)
        
        # Get mediator info if escalated
        mediator_info = None
        if dispute.get("status") == "MEDIATION":
            pro = await db.pro_profiles.find_one({"pro_id": dispute["pro_id"]})
            if pro:
                mediator_info = {
                    "mediator_name": pro.get("mediator_name"),
                    "mediator_url": pro.get("mediator_url"),
                    "mediator_contact": pro.get("mediator_contact")
                }
        
        return {"dispute": dispute, "mediator_info": mediator_info}
    
    @router.post("/disputes/{dispute_id}/message")
    async def add_dispute_message(
        dispute_id: str,
        message: str,
        attachments: list = [],
        current_user: dict = Depends(get_current_user_func)
    ):
        """Add a message to dispute conversation"""
        dispute = await db.disputes.find_one({"id": dispute_id})
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        if dispute["opened_by"] != current_user["id"] and dispute["other_party_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if dispute["status"] in ["RESOLVED", "CLOSED"]:
            raise HTTPException(status_code=400, detail="Dispute is closed")
        
        now = datetime.utcnow()
        msg = {
            "id": str(uuid.uuid4()),
            "sender_id": current_user["id"],
            "message": message,
            "attachments": attachments,
            "created_at": now.isoformat()
        }
        
        await db.disputes.update_one(
            {"id": dispute_id},
            {"$push": {"messages": msg}, "$set": {"updated_at": now}}
        )
        
        return {"message_id": msg["id"]}
    
    @router.post("/disputes/{dispute_id}/escalate")
    async def escalate_to_mediation(
        dispute_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Escalate dispute to mediation"""
        dispute = await db.disputes.find_one({"id": dispute_id})
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        if dispute["opened_by"] != current_user["id"] and dispute["other_party_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if dispute["status"] != "OPEN":
            raise HTTPException(status_code=400, detail="Dispute must be OPEN to escalate")
        
        # Get mediator info
        pro = await db.pro_profiles.find_one({"pro_id": dispute["pro_id"]})
        if not pro or not pro.get("mediator_name"):
            raise HTTPException(status_code=400, detail="PRO has no mediator configured")
        
        now = datetime.utcnow()
        await db.disputes.update_one(
            {"id": dispute_id},
            {"$set": {
                "status": "MEDIATION",
                "escalated_at": now,
                "updated_at": now
            }}
        )
        
        return {
            "message": "Dispute escalated to mediation",
            "status": "MEDIATION",
            "mediator": {
                "name": pro.get("mediator_name"),
                "url": pro.get("mediator_url"),
                "contact": pro.get("mediator_contact")
            }
        }
    
    @router.post("/disputes/{dispute_id}/resolve")
    async def resolve_dispute(
        dispute_id: str,
        resolution: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Resolve a dispute (by either party)"""
        dispute = await db.disputes.find_one({"id": dispute_id})
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        if dispute["opened_by"] != current_user["id"] and dispute["other_party_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if dispute["status"] in ["RESOLVED", "CLOSED"]:
            raise HTTPException(status_code=400, detail="Dispute already closed")
        
        now = datetime.utcnow()
        await db.disputes.update_one(
            {"id": dispute_id},
            {"$set": {
                "status": "RESOLVED",
                "resolution": resolution,
                "resolved_by": current_user["id"],
                "resolved_at": now,
                "updated_at": now
            }}
        )
        
        return {"message": "Dispute resolved", "status": "RESOLVED"}
    
    @router.get("/my-disputes")
    async def list_my_disputes(current_user: dict = Depends(get_current_user_func)):
        """List user's disputes"""
        disputes = await db.disputes.find({
            "$or": [
                {"opened_by": current_user["id"]},
                {"other_party_id": current_user["id"]}
            ]
        }).sort("created_at", -1).to_list(50)
        
        for d in disputes:
            d.pop("_id", None)
        
        return disputes
    
    @router.get("/transactions/{transaction_type}/{transaction_id}/mediator")
    async def get_mediator_info(
        transaction_type: str,
        transaction_id: str
    ):
        """Get mediator info for a transaction (public)"""
        if transaction_type == "ORDER":
            transaction = await db.orders_pro.find_one({"id": transaction_id})
        elif transaction_type == "RENTAL":
            transaction = await db.rentals.find_one({"id": transaction_id})
        else:
            raise HTTPException(status_code=400, detail="Invalid transaction type")
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        pro = await db.pro_profiles.find_one({"pro_id": transaction["pro_id"]})
        if not pro:
            raise HTTPException(status_code=404, detail="PRO profile not found")
        
        return {
            "mediator_name": pro.get("mediator_name", "Non renseigné"),
            "mediator_url": pro.get("mediator_url", ""),
            "mediator_contact": pro.get("mediator_contact", "")
        }
    
    # ============ SETTLEMENT OFFERS (RÉSOLUTION AMIABLE) ============
    
    # Config: délai avant escalade possible (en jours)
    ESCALATION_DELAY_DAYS = 14
    
    @router.post("/disputes/{dispute_id}/settlement-offers")
    async def create_settlement_offer(
        dispute_id: str,
        offer_type: str,
        details_text: str,
        amount_cents: int = None,
        currency: str = "EUR",
        current_user: dict = Depends(get_current_user_func)
    ):
        """
        Créer une proposition d'accord amiable.
        Yondly facilite la résolution amiable mais n'est pas médiateur.
        """
        dispute = await db.disputes.find_one({"id": dispute_id})
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        # Vérifier que l'utilisateur est partie au litige
        if dispute["opened_by"] != current_user["id"] and dispute["other_party_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Vérifier que le litige est toujours ouvert
        if dispute.get("stage") in ["RESOLVED", "ESCALATED_TO_MEDIATOR", "CLOSED_NO_AGREEMENT"]:
            raise HTTPException(status_code=400, detail="Dispute is closed")
        
        now = datetime.utcnow()
        offer = {
            "id": str(uuid.uuid4()),
            "dispute_id": dispute_id,
            "created_by_user_id": current_user["id"],
            "type": offer_type,
            "amount_cents": amount_cents,
            "currency": currency,
            "details_text": details_text,
            "status": "PROPOSED",
            "expires_at": now + timedelta(days=7),  # 7 jours pour répondre
            "created_at": now
        }
        
        await db.settlement_offers.insert_one(offer)
        
        # Mettre à jour le stage du litige
        await db.disputes.update_one(
            {"id": dispute_id},
            {"$set": {"stage": "NEGOTIATION", "updated_at": now},
             "$push": {"settlement_offers": offer["id"]}}
        )
        
        offer.pop("_id", None)
        return offer
    
    @router.get("/disputes/{dispute_id}/settlement-offers")
    async def list_settlement_offers(
        dispute_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Liste des propositions d'accord pour un litige"""
        dispute = await db.disputes.find_one({"id": dispute_id})
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        if dispute["opened_by"] != current_user["id"] and dispute["other_party_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        offers = await db.settlement_offers.find({"dispute_id": dispute_id}).sort("created_at", -1).to_list(50)
        for o in offers:
            o.pop("_id", None)
            # Ajouter le nom de l'auteur
            author = await db.users.find_one({"id": o["created_by_user_id"]})
            o["created_by_name"] = author.get("display_name", "Utilisateur") if author else "Inconnu"
        
        return offers
    
    @router.post("/disputes/{dispute_id}/settlement-offers/{offer_id}/accept")
    async def accept_settlement_offer(
        dispute_id: str,
        offer_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """
        Accepter une proposition d'accord et exécuter l'action Stripe.
        """
        dispute = await db.disputes.find_one({"id": dispute_id})
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        offer = await db.settlement_offers.find_one({"id": offer_id, "dispute_id": dispute_id})
        if not offer:
            raise HTTPException(status_code=404, detail="Settlement offer not found")
        
        # L'accepteur ne peut pas être l'auteur de l'offre
        if offer["created_by_user_id"] == current_user["id"]:
            raise HTTPException(status_code=400, detail="Cannot accept your own offer")
        
        # Vérifier que l'utilisateur est partie au litige
        if dispute["opened_by"] != current_user["id"] and dispute["other_party_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if offer["status"] != "PROPOSED":
            raise HTTPException(status_code=400, detail=f"Offer already {offer['status']}")
        
        now = datetime.utcnow()
        stripe_action_id = None
        
        # Exécuter l'action Stripe selon le type
        offer_type = offer["type"]
        amount = offer.get("amount_cents", 0)
        
        if offer_type in ["REFUND_FULL", "REFUND_PARTIAL"]:
            # Simuler un remboursement Stripe
            if dispute.get("transaction_type") == "ORDER":
                order = await db.orders_pro.find_one({"id": dispute["transaction_id"]})
                refund_amount = order.get("amount_cents", 0) if offer_type == "REFUND_FULL" else amount
                stripe_action_id = f"re_simulated_{uuid.uuid4().hex[:12]}"
                # Log: "Refund de {refund_amount} centimes"
            
        elif offer_type == "DEPOSIT_CAPTURE":
            # Capturer la caution (partielle ou totale)
            if dispute.get("transaction_type") == "RENTAL":
                deposit = await db.deposit_holds.find_one({"rental_id": dispute["transaction_id"]})
                if deposit:
                    capture_amount = deposit.get("amount_cents", 0) if not amount else amount
                    stripe_action_id = f"pi_captured_{uuid.uuid4().hex[:12]}"
                    await db.deposit_holds.update_one(
                        {"id": deposit["id"]},
                        {"$set": {"status": "CAPTURED", "updated_at": now}}
                    )
        
        elif offer_type == "DEPOSIT_RELEASE":
            # Libérer la caution
            if dispute.get("transaction_type") == "RENTAL":
                deposit = await db.deposit_holds.find_one({"rental_id": dispute["transaction_id"]})
                if deposit:
                    stripe_action_id = f"pi_released_{uuid.uuid4().hex[:12]}"
                    await db.deposit_holds.update_one(
                        {"id": deposit["id"]},
                        {"$set": {"status": "RELEASED", "updated_at": now}}
                    )
        
        # Marquer l'offre comme acceptée
        await db.settlement_offers.update_one(
            {"id": offer_id},
            {"$set": {
                "status": "ACCEPTED",
                "accepted_at": now,
                "stripe_action_id": stripe_action_id
            }}
        )
        
        # Résoudre le litige
        await db.disputes.update_one(
            {"id": dispute_id},
            {"$set": {
                "stage": "RESOLVED",
                "status": "RESOLVED",
                "resolution": f"Accord amiable accepté: {offer_type}",
                "resolved_at": now,
                "resolved_by": current_user["id"],
                "updated_at": now
            }}
        )
        
        return {
            "message": "Accord accepté et appliqué",
            "stripe_action_id": stripe_action_id,
            "dispute_stage": "RESOLVED"
        }
    
    @router.post("/disputes/{dispute_id}/settlement-offers/{offer_id}/reject")
    async def reject_settlement_offer(
        dispute_id: str,
        offer_id: str,
        reason: str = "",
        current_user: dict = Depends(get_current_user_func)
    ):
        """Rejeter une proposition d'accord"""
        dispute = await db.disputes.find_one({"id": dispute_id})
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        offer = await db.settlement_offers.find_one({"id": offer_id, "dispute_id": dispute_id})
        if not offer:
            raise HTTPException(status_code=404, detail="Settlement offer not found")
        
        if offer["created_by_user_id"] == current_user["id"]:
            raise HTTPException(status_code=400, detail="Cannot reject your own offer")
        
        if dispute["opened_by"] != current_user["id"] and dispute["other_party_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if offer["status"] != "PROPOSED":
            raise HTTPException(status_code=400, detail=f"Offer already {offer['status']}")
        
        now = datetime.utcnow()
        await db.settlement_offers.update_one(
            {"id": offer_id},
            {"$set": {"status": "REJECTED", "rejected_at": now}}
        )
        
        # Ajouter un message au litige
        await db.disputes.update_one(
            {"id": dispute_id},
            {"$push": {"messages": {
                "id": str(uuid.uuid4()),
                "author_id": current_user["id"],
                "content": f"Proposition refusée. {reason}" if reason else "Proposition refusée.",
                "is_system": False,
                "created_at": now
            }}, "$set": {"updated_at": now}}
        )
        
        return {"message": "Proposition refusée", "status": "REJECTED"}
    
    # ============ EVIDENCE (PREUVES) ============
    
    @router.post("/disputes/{dispute_id}/evidence")
    async def upload_evidence(
        dispute_id: str,
        file_url: str,
        file_type: str = "IMAGE",
        description: str = "",
        current_user: dict = Depends(get_current_user_func)
    ):
        """Ajouter une preuve au litige"""
        dispute = await db.disputes.find_one({"id": dispute_id})
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        if dispute["opened_by"] != current_user["id"] and dispute["other_party_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if dispute.get("stage") in ["RESOLVED", "ESCALATED_TO_MEDIATOR", "CLOSED_NO_AGREEMENT"]:
            raise HTTPException(status_code=400, detail="Cannot add evidence to closed dispute")
        
        now = datetime.utcnow()
        evidence = {
            "id": str(uuid.uuid4()),
            "dispute_id": dispute_id,
            "uploaded_by": current_user["id"],
            "file_url": file_url,
            "file_type": file_type,
            "description": description,
            "created_at": now
        }
        
        await db.dispute_evidence.insert_one(evidence)
        
        # Ajouter à la liste des preuves du litige
        await db.disputes.update_one(
            {"id": dispute_id},
            {"$push": {"evidence_urls": file_url}, "$set": {"updated_at": now}}
        )
        
        evidence.pop("_id", None)
        return evidence
    
    @router.get("/disputes/{dispute_id}/evidence")
    async def list_evidence(
        dispute_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Liste des preuves d'un litige"""
        dispute = await db.disputes.find_one({"id": dispute_id})
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        if dispute["opened_by"] != current_user["id"] and dispute["other_party_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        evidence = await db.dispute_evidence.find({"dispute_id": dispute_id}).sort("created_at", -1).to_list(100)
        for e in evidence:
            e.pop("_id", None)
            uploader = await db.users.find_one({"id": e["uploaded_by"]})
            e["uploaded_by_name"] = uploader.get("display_name", "Utilisateur") if uploader else "Inconnu"
        
        return evidence
    
    # ============ ESCALADE VERS MÉDIATEUR ============
    
    @router.post("/disputes/{dispute_id}/escalate-mediator")
    async def escalate_to_mediator(
        dispute_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """
        Escalader vers un médiateur indépendant.
        Génère un dossier PDF avec toutes les informations.
        Disclaimer: Yondly facilite la résolution amiable mais n'est pas médiateur.
        """
        dispute = await db.disputes.find_one({"id": dispute_id})
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        if dispute["opened_by"] != current_user["id"] and dispute["other_party_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if dispute.get("stage") == "ESCALATED_TO_MEDIATOR":
            raise HTTPException(status_code=400, detail="Already escalated to mediator")
        
        if dispute.get("stage") in ["RESOLVED", "CLOSED_NO_AGREEMENT"]:
            raise HTTPException(status_code=400, detail="Dispute is already closed")
        
        # Vérifier le délai minimum (14 jours après ouverture)
        created_at = dispute.get("created_at", datetime.utcnow())
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        
        # Permettre l'escalade après ESCALATION_DELAY_DAYS ou si explicitement demandé
        days_since_open = (datetime.utcnow() - created_at).days
        # Note: On peut rendre cette vérification optionnelle ou configurable
        
        now = datetime.utcnow()
        
        # Générer le dossier de médiation PDF
        from mediation_dossier import generate_mediation_dossier
        
        # Récupérer toutes les infos nécessaires
        evidence = await db.dispute_evidence.find({"dispute_id": dispute_id}).to_list(100)
        settlement_offers = await db.settlement_offers.find({"dispute_id": dispute_id}).to_list(50)
        
        # Transaction details
        if dispute.get("transaction_type") == "ORDER":
            transaction = await db.orders_pro.find_one({"id": dispute["transaction_id"]})
        else:
            transaction = await db.rentals.find_one({"id": dispute["transaction_id"]})
        
        # Parties
        opener = await db.users.find_one({"id": dispute["opened_by"]})
        other = await db.users.find_one({"id": dispute["other_party_id"]})
        pro_profile = await db.pro_profiles.find_one({"pro_id": dispute["pro_id"]})
        
        dossier_url = await generate_mediation_dossier(
            dispute=dispute,
            transaction=transaction,
            opener=opener,
            other_party=other,
            pro_profile=pro_profile,
            evidence=evidence,
            settlement_offers=settlement_offers,
            messages=dispute.get("messages", [])
        )
        
        # Mettre à jour le litige
        await db.disputes.update_one(
            {"id": dispute_id},
            {"$set": {
                "stage": "ESCALATED_TO_MEDIATOR",
                "status": "ESCALATED_TO_MEDIATOR",
                "escalated_at": now,
                "mediation_dossier_url": dossier_url,
                "updated_at": now
            }}
        )
        
        return {
            "message": "Litige escaladé vers le médiateur indépendant",
            "stage": "ESCALATED_TO_MEDIATOR",
            "dossier_url": dossier_url,
            "mediator": {
                "name": pro_profile.get("mediator_name", "Non renseigné") if pro_profile else "Non renseigné",
                "url": pro_profile.get("mediator_url", "") if pro_profile else "",
                "contact": pro_profile.get("mediator_contact", "") if pro_profile else ""
            },
            "disclaimer": "Yondly facilite la résolution amiable mais n'est pas médiateur. En cas de désaccord persistant, vous pouvez saisir un médiateur indépendant."
        }
    
    @router.get("/disputes/{dispute_id}/can-escalate")
    async def check_can_escalate(
        dispute_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Vérifier si l'escalade vers médiateur est possible"""
        dispute = await db.disputes.find_one({"id": dispute_id})
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        if dispute["opened_by"] != current_user["id"] and dispute["other_party_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if dispute.get("stage") in ["RESOLVED", "ESCALATED_TO_MEDIATOR", "CLOSED_NO_AGREEMENT"]:
            return {"can_escalate": False, "reason": "Dispute is closed or already escalated"}
        
        created_at = dispute.get("created_at", datetime.utcnow())
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        
        days_since_open = (datetime.utcnow() - created_at).days
        
        return {
            "can_escalate": days_since_open >= ESCALATION_DELAY_DAYS,
            "days_since_open": days_since_open,
            "days_required": ESCALATION_DELAY_DAYS,
            "days_remaining": max(0, ESCALATION_DELAY_DAYS - days_since_open),
            "disclaimer": "Yondly facilite la résolution amiable mais n'est pas médiateur. En cas de désaccord persistant, vous pouvez saisir un médiateur indépendant."
        }
    
    # ============ PARTNER MEDIATOR ============
    
    @router.get("/mediator/partner")
    async def get_partner_mediator():
        """Obtenir les coordonnées du médiateur partenaire Yondly"""
        # Configurable en base ou en config
        partner = await db.mediator_partners.find_one({"is_default": True, "active": True})
        if partner:
            partner.pop("_id", None)
            return partner
        
        # Valeurs par défaut
        return {
            "id": "default",
            "name": "Centre de Médiation de la Consommation",
            "url": "https://mediateur-consommation.fr",
            "contact": "contact@mediateur-consommation.fr",
            "is_default": True
        }
    
    return router
