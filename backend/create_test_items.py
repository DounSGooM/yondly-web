#!/usr/bin/env python3
"""
Create test market items for Alice and Bob
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority")
DB_NAME = os.getenv("DB_NAME", "loop")

async def create_test_items():
    """Create test items for Alice and Bob"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get Alice and Bob's IDs
    alice = await db.users.find_one({"email": "alice@test.com"})
    bob = await db.users.find_one({"email": "bob@test.com"})
    
    if not alice or not bob:
        print("❌ Alice or Bob not found. Run create_test_users.py first!")
        return
    
    # Items for Alice (seller)
    alice_items = [
        {
            "id": str(uuid.uuid4()),
            "type": "sale",
            "title": "iPhone 12 Pro",
            "description": "Excellent état, avec boîte et accessoires",
            "photos": ["https://via.placeholder.com/400x300?text=iPhone"],
            "category": "electronics",
            "location": {"lat": 46.580224, "lng": 0.340375},  # Poitiers
            "radius_km": 10,
            "price_cents": 45000,  # 450€
            "condition": "good",
            "allow_offers": True,
            "status": "active",
            "owner_id": alice["id"],
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "type": "rent",
            "title": "Perceuse électrique Bosch",
            "description": "Perceuse professionnelle, parfait pour bricolage",
            "photos": ["https://via.placeholder.com/400x300?text=Perceuse"],
            "category": "home",
            "location": {"lat": 46.580224, "lng": 0.340375},
            "radius_km": 15,
            "price_per_day_cents": 800,  # 8€/jour
            "deposit_cents": 5000,  # 50€ caution
            "condition": "like_new",
            "allow_offers": False,
            "status": "active",
            "owner_id": alice["id"],
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "type": "sale",
            "title": "Vélo VTT",
            "description": "VTT 21 vitesses, très bon état",
            "photos": ["https://via.placeholder.com/400x300?text=VTT"],
            "category": "sports",
            "location": {"lat": 46.580224, "lng": 0.340375},
            "radius_km": 20,
            "price_cents": 15000,  # 150€
            "condition": "good",
            "allow_offers": True,
            "status": "active",
            "owner_id": alice["id"],
            "created_at": datetime.utcnow()
        }
    ]
    
    # Items for Bob (seller)
    bob_items = [
        {
            "id": str(uuid.uuid4()),
            "type": "sale",
            "title": "Canapé 3 places",
            "description": "Canapé confortable en tissu gris",
            "photos": ["https://via.placeholder.com/400x300?text=Canape"],
            "category": "furniture",
            "location": {"lat": 46.580224, "lng": 0.340375},
            "radius_km": 10,
            "price_cents": 20000,  # 200€
            "condition": "good",
            "allow_offers": True,
            "status": "active",
            "owner_id": bob["id"],
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "type": "rent",
            "title": "Tente 4 places",
            "description": "Tente de camping familiale, imperméable",
            "photos": ["https://via.placeholder.com/400x300?text=Tente"],
            "category": "sports",
            "location": {"lat": 46.580224, "lng": 0.340375},
            "radius_km": 25,
            "price_per_day_cents": 1500,  # 15€/jour
            "deposit_cents": 10000,  # 100€ caution
            "condition": "like_new",
            "allow_offers": False,
            "status": "active",
            "owner_id": bob["id"],
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "type": "sale",
            "title": "Console PS5",
            "description": "PlayStation 5 avec 2 manettes",
            "photos": ["https://via.placeholder.com/400x300?text=PS5"],
            "category": "electronics",
            "location": {"lat": 46.580224, "lng": 0.340375},
            "radius_km": 15,
            "price_cents": 40000,  # 400€
            "condition": "like_new",
            "allow_offers": True,
            "status": "active",
            "owner_id": bob["id"],
            "created_at": datetime.utcnow()
        }
    ]
    
    # Insert items
    all_items = alice_items + bob_items
    await db.items.insert_many(all_items)
    
    print("✅ Test items created successfully!")
    print(f"\n📦 Created {len(alice_items)} items for Alice")
    print(f"📦 Created {len(bob_items)} items for Bob")
    print(f"\n🎯 Total: {len(all_items)} market items ready for testing")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_test_items())
