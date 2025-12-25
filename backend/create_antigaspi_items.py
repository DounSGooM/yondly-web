
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import uuid
from dotenv import load_dotenv

# Load env variables
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
# IMPORTANT: Use the correct DB name
DB_NAME = os.getenv("DB_NAME", "loop")

if not MONGO_URL:
    print("❌ Error: MONGO_URL is not set.")
    exit(1)

print(f"🔌 Connecting to MongoDB: {MONGO_URL}")
print(f"🗄️  Database: {DB_NAME}")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

async def seed_data():
    print("🌱 Seeding Anti-Gaspi Data...")
    
    # 1. Clear existing Data (Optional, but good for testing)
    # await db.stores.delete_many({})
    # await db.deals.delete_many({})

    # 2. Create Stores
    stores = [
        {
            "id": str(uuid.uuid4()),
            "owner_id": "test_owner_1",
            "name": "Boulangerie Patine",
            "description": "Boulangerie artisanale au levain naturel.",
            "address": "12 Rue de la Roquette, 75011 Paris",
            "lat": 48.8557,
            "lng": 2.3735,
            "logo": "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=200&auto=format&fit=crop",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "owner_id": "test_owner_2",
            "name": "Primeur du Coin",
            "description": "Fruits et légumes de saison, direct producteur.",
            "address": "45 Avenue de la République, 75011 Paris",
            "lat": 48.8659,
            "lng": 2.3787,
            "logo": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=200&auto=format&fit=crop",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "owner_id": "test_owner_3",
            "name": "Fleuriste 'La Rose'",
            "description": "Fleurs fraîches et compositions florales.",
            "address": "10 Boulevard Voltaire, 75011 Paris",
            "lat": 48.8671,
            "lng": 2.3685,
            "logo": "https://images.unsplash.com/photo-1563241527-3af820579e00?q=80&w=200&auto=format&fit=crop",
            "created_at": datetime.utcnow()
        }
    ]
    
    for store in stores:
        # Check if store already exists by name to avoid duplicates on re-run
        existing = await db.stores.find_one({"name": store["name"]})
        if not existing:
            await db.stores.insert_one(store)
            print(f"✅ Created Store: {store['name']}")
        else:
            stores[stores.index(store)] = existing # Use existing ID
            print(f"ℹ️  Store already exists: {store['name']}")
            
    # 3. Create Deals for each store
    deals = [
        # Boulangerie Patine
        {
            "id": str(uuid.uuid4()),
            "store_id": stores[0]["id"],
            "title": "Panier Surprise Boulangerie",
            "description": "Assortiment de pains spéciaux et viennoiseries de la veille (croissants, pains au chocolat).",
            "original_price": 12.00,
            "deal_price": 3.99,
            "discount_value": 66,
            "discount_type": "percentage",
            "category": "Food",
            "status": "active",
            "expires_at": datetime.utcnow() + timedelta(hours=4),
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "store_id": stores[0]["id"],
            "title": "Lot de Baguettes Tradition",
            "description": "3 baguettes tradition invendues du matin.",
            "original_price": 3.60,
            "deal_price": 1.50,
            "discount_value": 58,
            "discount_type": "percentage",
            "category": "Food",
            "status": "active",
            "expires_at": datetime.utcnow() + timedelta(hours=2),
            "created_at": datetime.utcnow()
        },
        # Primeur du Coin
        {
            "id": str(uuid.uuid4()),
            "store_id": stores[1]["id"],
            "title": "Panier Légumes Moches",
            "description": "2kg de légumes variés (carottes, courgettes, pommes de terre) légèrement abîmés mais délicieux.",
            "original_price": 8.50,
            "deal_price": 2.99,
            "discount_value": 65,
            "discount_type": "percentage",
            "category": "Food",
            "status": "active",
            "expires_at": datetime.utcnow() + timedelta(hours=24),
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "store_id": stores[1]["id"],
            "title": "Bananes Mûres",
            "description": "Lot de 6 bananes bien mûres, idéales pour banana bread !",
            "original_price": 2.50,
            "deal_price": 0.99,
            "discount_value": 60,
            "discount_type": "percentage",
            "category": "Food",
            "status": "active",
            "expires_at": datetime.utcnow() + timedelta(hours=48),
            "created_at": datetime.utcnow()
        },
         # Fleuriste
        {
            "id": str(uuid.uuid4()),
            "store_id": stores[2]["id"],
            "title": "Bouquet du Jour",
            "description": "Bouquet de fleurs coupées (roses, lys) à sauver.",
            "original_price": 25.00,
            "deal_price": 9.90,
            "discount_value": 60,
            "discount_type": "percentage",
            "category": "Flowers",
            "status": "active",
            "expires_at": datetime.utcnow() + timedelta(hours=5),
            "created_at": datetime.utcnow()
        },
    ]

    count = 0
    for deal in deals:
        # Insert without duplicate check for simplicity as IDs are random, 
        # but in production we'd be careful. Here we want to add items.
        await db.deals.insert_one(deal)
        count += 1
        
    print(f"✅ Created {count} Deals")
    print("Done!")

if __name__ == "__main__":
    asyncio.run(seed_data())
