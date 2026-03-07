import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os
import uuid
from datetime import datetime

# Add backend directory to path so we can import models and auth
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from auth_utils import hash_password
from database import db

async def test_pro_flow():
    print("🚀 Starting PRO Flow E2E Test...")
    
    email = f"pro_test_{uuid.uuid4().hex[:6]}@yondly.app"
    password = "Password123!"
    
    # 1. Create a User (PRO)
    print(f"1️⃣  Creating User: {email}")
    user_id = f"usr_{uuid.uuid4().hex}"
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(password),
        "display_name": "Pro Test Store",
        "first_name": "Test",
        "last_name": "Pro",
        "role": "PRO",
        "is_verified": True,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(user_doc)
    
    # 2. Submit Verification
    print("2️⃣  Submitting Verification Documents...")
    verif_id = f"verif_{uuid.uuid4().hex}"
    verif_doc = {
        "id": verif_id,
        "pro_id": user_id,
        "legal_name": "Test Store SAS",
        "trade_name": "The Test Store",
        "business_type": "company",
        "siret": "12345678901234",
        "vat_number": "FR12345678901",
        "address_line1": "123 Rue de Test",
        "postal_code": "75001",
        "city": "Paris",
        "country": "FR",
        "representative_first_name": "Test",
        "representative_last_name": "Pro",
        "contact_phone": "+33612345678",
        "contact_email": email,
        "kbis_url": "https://example.com/kbis.pdf",
        "id_document_url": "https://example.com/id.pdf",
        "status": "PENDING",
        "submitted_at": datetime.utcnow()
    }
    await db.trader_verifications.insert_one(verif_doc)
    
    # 3. Simulate Admin Approval
    print("3️⃣  Simulating Admin Approval...")
    await db.trader_verifications.update_one(
        {"id": verif_id},
        {
            "$set": {
                "status": "APPROVED",
                "verified_at": datetime.utcnow()
            }
        }
    )
    
    # 4. Simulate Stripe Connect
    print("4️⃣  Simulating Stripe Connect Onboarding...")
    await db.pro_profiles.insert_one({
        "id": f"pro_{uuid.uuid4().hex}",
        "user_id": user_id,
        "business_name": "The Test Store",
        "siret": "12345678901234",
        "stripe_account_id": f"acct_{uuid.uuid4().hex}",
        "payouts_enabled": True,
        "created_at": datetime.utcnow()
    })
    
    # 5. Create Anti-gaspi Offer
    print("5️⃣  Creating Anti-gaspi Offer...")
    offer_id_1 = f"offer_{uuid.uuid4().hex}"
    offer_doc_1 = {
        "id": offer_id_1,
        "pro_id": user_id,
        "kind": "ANTIGASPI_SALE",
        "title": "Panier Légumes Invendus",
        "description": "Panier de 3kg",
        "category": "food",
        "photos": ["https://example.com/photo.jpg"],
        "price_cents": 500,
        "quantity": 3,
        "location": {"type": "Point", "coordinates": [2.3522, 48.8566]},
        "location_label": "Paris",
        "postal_code": "75001",
        "city": "Paris",
        "status": "PUBLISHED",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await db.offers_pro.insert_one(offer_doc_1)
    
    await db.offers_antigaspi.insert_one({
        "offer_id": offer_id_1,
        "is_food": True,
        "pickup_slots": [{"start_at": datetime.utcnow().isoformat(), "end_at": datetime.utcnow().isoformat()}],
        "pickup_instructions": "Come to the back door."
    })
    
    # 6. Create Rental Offer (Testing the new 7-day limit logic)
    print("6️⃣  Creating Rental Offer...")
    offer_id_2 = f"offer_{uuid.uuid4().hex}"
    offer_doc_2 = {
        "id": offer_id_2,
        "pro_id": user_id,
        "kind": "RENTAL",
        "title": "Perceuse Bosch",
        "description": "Très bonne perceuse",
        "category": "equipment",
        "photos": ["https://example.com/photo2.jpg"],
        "price_cents": 1500, # 15/day
        "quantity": 1,
        "location": {"type": "Point", "coordinates": [2.3522, 48.8566]},
        "location_label": "Paris",
        "postal_code": "75001",
        "city": "Paris",
        "status": "PUBLISHED",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await db.offers_pro.insert_one(offer_doc_2)
    
    await db.offers_rental.insert_one({
        "offer_id": offer_id_2,
        "deposit_amount_cents": 10000,
        "min_duration_hours": 24,
        "max_duration_hours": 168, # 7 days max
        "late_fee_per_day_cents": 2000,
        "usage_rules": "Don't break the bit."
    })
    
    print("\n✅ All PRO steps completed successfully!")
    print(f"Test User Email: {email}")
    print(f"Test User Password: {password}")
    
    # Clean up
    print("🧹 Cleaning up test data...")
    await db.users.delete_one({"id": user_id})
    await db.trader_verifications.delete_one({"id": verif_id})
    await db.pro_profiles.delete_one({"user_id": user_id})
    await db.offers_pro.delete_many({"pro_id": user_id})
    await db.offers_antigaspi.delete_one({"offer_id": offer_id_1})
    await db.offers_rental.delete_one({"offer_id": offer_id_2})
    print("Cleanup complete.")

if __name__ == "__main__":
    asyncio.run(test_pro_flow())
