#!/usr/bin/env python3
"""
Seed script for creating test data in Yondly app.
Creates:
- 1 Pro profile with a store and 5 anti-gaspi deals
- 3 regular user profiles (particuliers)
- 1 association profile
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient
import bcrypt
import uuid

# Load environment variables
load_dotenv()

# Connect to MongoDB
client = MongoClient(
    os.environ['MONGO_URL'],
    tls=True
)
db = client[os.environ['DB_NAME']]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def create_user(email, display_name, password="test1234", **kwargs):
    """Create a user in the database"""
    user_id = str(uuid.uuid4())
    user = {
        "_id": user_id,
        "id": user_id,  # Login expects 'id' field
        "email": email,
        "password_hash": hash_password(password),  # Login expects 'password_hash'
        "display_name": display_name,
        "phone": kwargs.get("phone"),
        "photo_url": kwargs.get("photo_url"),
        "ratings_avg": 0.0,
        "ratings_count": 0,
        "wallet_balance_cents": 0,
        "points": 0,
        "level": "Novice",
        "profile_theme_color": None,
        "stripe_account_id": None,
        "is_partner": kwargs.get("is_partner", False),
        "services": kwargs.get("services", []),
        "street": kwargs.get("street"),
        "city": kwargs.get("city", "Poitiers"),
        "postcode": kwargs.get("postcode", "86000"),
        "citycode": kwargs.get("citycode", "86194"),
        "context": kwargs.get("context", "Vienne"),
        "location": kwargs.get("location", {"lat": 46.5802, "lng": 0.3404}),
        "co2_saved": 0.0,
        "trust_level": "NEW",
        "risk_score": 0.0,
        "verified_email": True,
        "verified_phone": False,
        "two_factor_enabled": False,
        "is_association": kwargs.get("is_association", False),
        "association_name": kwargs.get("association_name"),
        "association_verified": kwargs.get("association_verified", False),
        "created_at": datetime.utcnow()
    }
    
    # Check if user already exists
    existing = db.users.find_one({"email": email})
    if existing:
        print(f"⚠️  User {email} already exists, skipping...")
        return existing["_id"]
    
    db.users.insert_one(user)
    print(f"✅ Created user: {display_name} ({email})")
    return user_id

def create_store(owner_id, name, address, **kwargs):
    """Create a store for a pro user"""
    store_id = str(uuid.uuid4())
    store = {
        "_id": store_id,
        "owner_id": owner_id,
        "name": name,
        "address": address,
        "location": kwargs.get("location", {"lat": 46.5802, "lng": 0.3404}),
        "category": kwargs.get("category", "Boulangerie"),
        "logo_url": kwargs.get("logo_url"),
        "hours": kwargs.get("hours", {
            "monday": "07:00 - 19:00",
            "tuesday": "07:00 - 19:00",
            "wednesday": "07:00 - 19:00",
            "thursday": "07:00 - 19:00",
            "friday": "07:00 - 19:00",
            "saturday": "07:00 - 13:00",
            "sunday": None
        }),
        "description": kwargs.get("description", "Commerce partenaire Yondly"),
        "website": kwargs.get("website"),
        "services": kwargs.get("services", ["anti_waste"]),
        "followers_count": 0,
        "created_at": datetime.utcnow()
    }
    
    # Check if store already exists
    existing = db.stores.find_one({"name": name, "owner_id": owner_id})
    if existing:
        print(f"⚠️  Store {name} already exists, skipping...")
        return existing["_id"]
    
    db.stores.insert_one(store)
    print(f"✅ Created store: {name}")
    return store_id

def create_deal(store_id, owner_id, title, **kwargs):
    """Create an anti-gaspi deal"""
    deal_id = str(uuid.uuid4())
    original_price = kwargs.get("original_price", 12.00)
    deal_price = kwargs.get("deal_price", 4.99)
    
    deal = {
        "_id": deal_id,
        "store_id": store_id,
        "owner_id": owner_id,
        "title": title,
        "description": kwargs.get("description", "Panier surprise anti-gaspi"),
        "original_price": original_price,
        "deal_price": deal_price,
        "discount_value": int(((original_price - deal_price) / original_price) * 100),
        "discount_type": "percentage",
        "category": kwargs.get("category", "Food"),
        "status": "active",
        "quantity": kwargs.get("quantity", 3),
        "remaining": kwargs.get("remaining", 3),
        "expires_at": datetime.utcnow() + timedelta(hours=kwargs.get("expires_hours", 6)),
        "pickup_start": kwargs.get("pickup_start", "17:00"),
        "pickup_end": kwargs.get("pickup_end", "19:00"),
        "allow_suspension": kwargs.get("allow_suspension", True),
        "suspended_quantity": kwargs.get("suspended_quantity", 0),
        "suspended_available": kwargs.get("suspended_available", 0),
        "photos": kwargs.get("photos", []),
        "created_at": datetime.utcnow()
    }
    
    db.deals.insert_one(deal)
    print(f"✅ Created deal: {title} - {deal_price}€ (was {original_price}€)")
    return deal_id

def main():
    print("\n🌱 Yondly Test Data Seeding\n" + "="*40)
    
    # ============ PRO PROFILE + STORE + DEALS ============
    print("\n📦 Creating Pro Profile with Store...")
    
    pro_user_id = create_user(
        email="boulangerie.martin@test.com",
        display_name="Boulangerie Martin",
        phone="0549123456",
        is_partner=True,
        services=["anti_waste", "sale"],
        city="Poitiers",
        location={"lat": 46.5833, "lng": 0.3333}
    )
    
    # Also mark as pro seller
    db.users.update_one(
        {"_id": pro_user_id},
        {"$set": {"is_pro": True, "pro_verified": True}}
    )
    
    store_id = create_store(
        owner_id=pro_user_id,
        name="Boulangerie Martin",
        address="12 Rue de la République, 86000 Poitiers",
        category="Boulangerie",
        description="Boulangerie artisanale depuis 1985. Nous proposons des paniers anti-gaspi chaque soir.",
        services=["anti_waste"],
        location={"lat": 46.5833, "lng": 0.3333}
    )
    
    # Create 5 anti-gaspi deals
    print("\n🥐 Creating 5 Anti-Gaspi Deals...")
    
    deals = [
        {
            "title": "Panier Surprise Sucré",
            "description": "Viennoiseries, croissants et pains au chocolat du jour",
            "original_price": 15.00,
            "deal_price": 4.99,
            "category": "Food",
            "quantity": 5,
            "remaining": 4,
            "allow_suspension": True,
            "suspended_quantity": 2,
            "suspended_available": 2,
        },
        {
            "title": "Panier Surprise Salé",
            "description": "Quiches, sandwiches et salades fraîches",
            "original_price": 12.00,
            "deal_price": 3.99,
            "category": "Food",
            "quantity": 3,
            "remaining": 2,
            "allow_suspension": True,
            "suspended_quantity": 1,
            "suspended_available": 1,
        },
        {
            "title": "Pain du Jour",
            "description": "Baguettes traditionnelles et pains spéciaux",
            "original_price": 8.00,
            "deal_price": 2.99,
            "category": "Food",
            "quantity": 10,
            "remaining": 7,
            "allow_suspension": True,
            "suspended_quantity": 3,
            "suspended_available": 3,
        },
        {
            "title": "Panier Gourmand",
            "description": "Assortiment de gâteaux, tartes et macarons",
            "original_price": 20.00,
            "deal_price": 6.99,
            "category": "Food",
            "quantity": 2,
            "remaining": 2,
            "allow_suspension": False,
        },
        {
            "title": "Petit-Déjeuner Complet",
            "description": "Croissant, pain, confiture et jus d'orange",
            "original_price": 10.00,
            "deal_price": 4.00,
            "category": "Food",
            "quantity": 4,
            "remaining": 3,
            "allow_suspension": True,
            "suspended_quantity": 1,
            "suspended_available": 1,
        },
    ]
    
    for deal_data in deals:
        create_deal(store_id, pro_user_id, **deal_data)
    
    # ============ REGULAR USERS (PARTICULIERS) ============
    print("\n👤 Creating 3 Regular User Profiles...")
    
    users = [
        {
            "email": "marie.dupont@test.com",
            "display_name": "Marie Dupont",
            "phone": "0612345678",
            "city": "Poitiers",
            "location": {"lat": 46.5750, "lng": 0.3380}
        },
        {
            "email": "thomas.bernard@test.com",
            "display_name": "Thomas Bernard",
            "phone": "0623456789",
            "city": "Poitiers",
            "location": {"lat": 46.5820, "lng": 0.3420}
        },
        {
            "email": "julie.martin@test.com",
            "display_name": "Julie Martin",
            "phone": "0634567890",
            "city": "Chasseneuil-du-Poitou",
            "postcode": "86360",
            "location": {"lat": 46.6580, "lng": 0.3670}
        },
    ]
    
    for user_data in users:
        create_user(**user_data)
    
    # ============ ASSOCIATION PROFILE ============
    print("\n🏛️  Creating Association Profile...")
    
    asso_user_id = create_user(
        email="secours.populaire.poitiers@test.com",
        display_name="Secours Populaire Poitiers",
        phone="0549881234",
        is_association=True,
        association_name="Secours Populaire - Fédération de la Vienne",
        association_verified=True,
        city="Poitiers",
        location={"lat": 46.5870, "lng": 0.3390}
    )
    
    # ============ SUMMARY ============
    print("\n" + "="*40)
    print("✅ Test Data Created Successfully!")
    print("="*40)
    print("\n📋 Login Credentials (all passwords: test1234):")
    print("   🏪 Pro: boulangerie.martin@test.com")
    print("   👤 User 1: marie.dupont@test.com")
    print("   👤 User 2: thomas.bernard@test.com")
    print("   👤 User 3: julie.martin@test.com")
    print("   🏛️  Association: secours.populaire.poitiers@test.com")
    print("\n🧺 Paniers Suspendus disponibles: 7 au total")
    print("   - Panier Surprise Sucré: 2 suspendus")
    print("   - Panier Surprise Salé: 1 suspendu")
    print("   - Pain du Jour: 3 suspendus")
    print("   - Petit-Déjeuner Complet: 1 suspendu")
    print()

if __name__ == "__main__":
    main()
