"""
Script to seed test stores and deals
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Test stores data
test_stores = [
    {
        "id": "store_001",
        "name": "Bio'Logique Poitiers",
        "logo": None,
        "address": "12 Rue de la Tranchée, 86000 Poitiers",
        "location": {"lat": 46.5802, "lng": 0.3404},
        "phone": "05 49 88 33 22",
        "website": "https://biologique-poitiers.fr",
        "description": "Épicerie bio locale avec produits anti-gaspi en fin de journée",
        "category": "Épicerie",
        "badge_type": "plus",
        "hours": {
            "monday": "09:00-19:00",
            "tuesday": "09:00-19:00",
            "wednesday": "09:00-19:00",
            "thursday": "09:00-19:00",
            "friday": "09:00-20:00",
            "saturday": "10:00-18:00",
            "sunday": "Fermé"
        },
        "followers_count": 42,
        "created_at": datetime.utcnow()
    },
    {
        "id": "store_002",
        "name": "Carrefour City Centre",
        "logo": None,
        "address": "25 Place du Maréchal Leclerc, 86000 Poitiers",
        "location": {"lat": 46.5836, "lng": 0.3435},
        "phone": "05 49 41 22 33",
        "website": None,
        "description": "Supermarché avec rayon anti-gaspi -50% chaque soir",
        "category": "Supermarché/GMS",
        "badge_type": "basic",
        "hours": {
            "monday": "08:00-21:00",
            "tuesday": "08:00-21:00",
            "wednesday": "08:00-21:00",
            "thursday": "08:00-21:00",
            "friday": "08:00-21:00",
            "saturday": "08:00-21:00",
            "sunday": "09:00-20:00"
        },
        "followers_count": 128,
        "created_at": datetime.utcnow()
    },
    {
        "id": "store_003",
        "name": "Boulangerie du Grand Cerf",
        "logo": None,
        "address": "8 Rue du Marché Notre-Dame, 86000 Poitiers",
        "location": {"lat": 46.5813, "lng": 0.3486},
        "phone": "05 49 60 21 34",
        "website": None,
        "description": "Pain et viennoiseries de la veille à prix réduit tous les matins",
        "category": "Boulangerie",
        "badge_type": "premium",
        "hours": {
            "monday": "07:00-20:00",
            "tuesday": "07:00-20:00",
            "wednesday": "07:00-20:00",
            "thursday": "07:00-20:00",
            "friday": "07:00-20:00",
            "saturday": "07:00-20:00",
            "sunday": "Fermé"
        },
        "followers_count": 87,
        "created_at": datetime.utcnow()
    },
    {
        "id": "store_004",
        "name": "Emmaüs Poitiers",
        "logo": None,
        "address": "134 Route de Gençay, 86000 Poitiers",
        "location": {"lat": 46.5691, "lng": 0.3215},
        "phone": "05 49 88 42 15",
        "website": "https://emmaus-poitiers.fr",
        "description": "Espace de vente de seconde main et ateliers de réparation",
        "category": "Recyclerie",
        "badge_type": "premium",
        "hours": {
            "monday": "Fermé",
            "tuesday": "14:00-18:00",
            "wednesday": "14:00-18:00",
            "thursday": "14:00-18:00",
            "friday": "14:00-18:00",
            "saturday": "10:00-18:00",
            "sunday": "Fermé"
        },
        "followers_count": 215,
        "created_at": datetime.utcnow()
    },
    {
        "id": "store_005",
        "name": "Repair Café Poitiers",
        "logo": None,
        "address": "3 Rue Boncenne, 86000 Poitiers",
        "location": {"lat": 46.5825, "lng": 0.3520},
        "phone": "06 23 45 67 89",
        "website": None,
        "description": "Atelier de réparation collaboratif - électronique, textile, meubles",
        "category": "Repair Café",
        "badge_type": "plus",
        "hours": {
            "monday": "Fermé",
            "tuesday": "Fermé",
            "wednesday": "14:00-18:00",
            "thursday": "Fermé",
            "friday": "Fermé",
            "saturday": "10:00-18:00",
            "sunday": "Fermé"
        },
        "followers_count": 56,
        "created_at": datetime.utcnow()
    }
]

# Test deals data
def generate_test_deals():
    now = datetime.utcnow()
    
    deals = [
        # Bio Épicerie
        {
            "id": "deal_001",
            "store_id": "store_001",
            "title": "Légumes bio de saison",
            "description": "Fin de stock - Légumes bio frais à prix réduit",
            "discount_type": "percentage",
            "original_price": 1000,  # 10€
            "deal_price": 500,  # 5€
            "discount_value": 50,  # -50%
            "expires_at": now + timedelta(hours=6),
            "quantity": 20,
            "category": "Fruits & Légumes",
            "status": "active",
            "created_at": now
        },
        {
            "id": "deal_002",
            "store_id": "store_001",
            "title": "Yaourts bio DLC courte",
            "description": "Date limite de consommation dans 2 jours",
            "discount_type": "percentage",
            "original_price": 350,
            "deal_price": 175,
            "discount_value": 50,
            "expires_at": now + timedelta(hours=12),
            "quantity": 15,
            "category": "Produits laitiers",
            "status": "active",
            "created_at": now
        },
        # Carrefour
        {
            "id": "deal_003",
            "store_id": "store_002",
            "title": "Rayon anti-gaspi du soir",
            "description": "Tous les produits frais à -50% après 19h",
            "discount_type": "percentage",
            "original_price": None,
            "deal_price": None,
            "discount_value": 50,
            "expires_at": now + timedelta(hours=3),
            "quantity": None,
            "category": "Tous produits",
            "status": "active",
            "created_at": now
        },
        # Boulangerie
        {
            "id": "deal_004",
            "store_id": "store_003",
            "title": "Pain de la veille -30%",
            "description": "Pain et viennoiseries de la veille",
            "discount_type": "percentage",
            "original_price": 150,
            "deal_price": 105,
            "discount_value": 30,
            "expires_at": now + timedelta(hours=8),
            "quantity": 30,
            "category": "Boulangerie",
            "status": "active",
            "created_at": now
        },
        {
            "id": "deal_005",
            "store_id": "store_003",
            "title": "Croissants du jour -2€",
            "description": "Lot de 6 croissants",
            "discount_type": "fixed",
            "original_price": 700,
            "deal_price": 500,
            "discount_value": 200,  # -2€
            "expires_at": now + timedelta(hours=4),
            "quantity": 10,
            "category": "Viennoiserie",
            "status": "active",
            "created_at": now
        },
        # La Recyclerie
        {
            "id": "deal_006",
            "store_id": "store_004",
            "title": "Atelier compost gratuit",
            "description": "Venez apprendre à faire votre compost",
            "discount_type": "fixed",
            "original_price": 1500,
            "deal_price": 0,
            "discount_value": 1500,
            "expires_at": now + timedelta(days=5),
            "quantity": 20,
            "category": "Atelier",
            "status": "active",
            "created_at": now
        },
        # Repair Café
        {
            "id": "deal_007",
            "store_id": "store_005",
            "title": "Réparation gratuite ce samedi",
            "description": "Venez réparer vos objets gratuitement avec nos bénévoles",
            "discount_type": "fixed",
            "original_price": 2000,
            "deal_price": 0,
            "discount_value": 2000,
            "expires_at": now + timedelta(days=3),
            "quantity": 15,
            "category": "Réparation",
            "status": "active",
            "created_at": now
        }
    ]
    
    return deals

async def seed_data():
    print("🌱 Seeding stores and deals data...")
    
    # Clear existing test data
    await db.stores.delete_many({"id": {"$in": [s["id"] for s in test_stores]}})
    deals = generate_test_deals()
    await db.deals.delete_many({"id": {"$in": [d["id"] for d in deals]}})
    
    # Insert stores
    result = await db.stores.insert_many(test_stores)
    print(f"✅ Inserted {len(result.inserted_ids)} stores")
    
    # Insert deals
    result = await db.deals.insert_many(deals)
    print(f"✅ Inserted {len(result.inserted_ids)} deals")
    
    print("✅ Seeding complete!")

async def main():
    await seed_data()
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
