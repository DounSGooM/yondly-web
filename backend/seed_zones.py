"""
Seed script to initialize Grand Poitiers zone with all 40 communes
Run: python seed_zones.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'yondly_db')

# Grand Poitiers with 40 communes
GRAND_POITIERS = {
    "name": "Grand Poitiers",
    "displayName": "Communauté urbaine du Grand Poitiers",
    "type": "communaute_urbaine",
    "isActive": True,
    "communes": [
        # Communes actives (14 - centre de l'agglo)
        {"name": "Poitiers", "population": 88665, "isActive": True},
        {"name": "Buxerolles", "population": 10100, "isActive": True},
        {"name": "Saint-Benoît", "population": 7500, "isActive": True},
        {"name": "Migné-Auxances", "population": 6200, "isActive": True},
        {"name": "Chasseneuil-du-Poitou", "population": 5200, "isActive": True},
        {"name": "Vouneuil-sous-Biard", "population": 5300, "isActive": True},
        {"name": "Mignaloux-Beauvoir", "population": 4800, "isActive": True},
        {"name": "Fontaine-le-Comte", "population": 4100, "isActive": True},
        {"name": "Montamisé", "population": 3800, "isActive": True},
        {"name": "Ligugé", "population": 3100, "isActive": True},
        {"name": "Béruges", "population": 2300, "isActive": True},
        {"name": "Biard", "population": 1900, "isActive": True},
        {"name": "Sèvres-Anxaumont", "population": 2100, "isActive": True},
        {"name": "Croutelle", "population": 1100, "isActive": True},
        # Communes prêtes à activer (26)
        {"name": "Nouaillé-Maupertuis", "population": 2800, "isActive": False},
        {"name": "Dissay", "population": 3200, "isActive": False},
        {"name": "Jaunay-Marigny", "population": 6500, "isActive": False},
        {"name": "Beaumont-Saint-Cyr", "population": 3100, "isActive": False},
        {"name": "Saint-Georges-lès-Baillargeaux", "population": 4200, "isActive": False},
        {"name": "Bonneuil-Matours", "population": 2000, "isActive": False},
        {"name": "Colombiers", "population": 1200, "isActive": False},
        {"name": "Quinçay", "population": 2400, "isActive": False},
        {"name": "Lavoux", "population": 1100, "isActive": False},
        {"name": "Bignoux", "population": 1700, "isActive": False},
        {"name": "Jardres", "population": 1300, "isActive": False},
        {"name": "Saint-Julien-l'Ars", "population": 2600, "isActive": False},
        {"name": "Savigny-Lévescault", "population": 1500, "isActive": False},
        {"name": "Liniers", "population": 900, "isActive": False},
        {"name": "Pouillé", "population": 800, "isActive": False},
        {"name": "Vernon", "population": 700, "isActive": False},
        {"name": "La Chapelle-Moulière", "population": 900, "isActive": False},
        {"name": "Marçay", "population": 500, "isActive": False},
        {"name": "Chauvigny", "population": 7200, "isActive": False},
        {"name": "Montmorillon", "population": 6500, "isActive": False},
        {"name": "Civray", "population": 2700, "isActive": False},
        {"name": "Lusignan", "population": 2800, "isActive": False},
        {"name": "Vivonne", "population": 4100, "isActive": False},
        {"name": "Vouillé", "population": 3700, "isActive": False},
        {"name": "Iteuil", "population": 2200, "isActive": False},
        {"name": "Tercé", "population": 1400, "isActive": False},
    ],
    "created_at": datetime.utcnow(),
    "updated_at": datetime.utcnow()
}

async def seed_zones():
    print(f"Connecting to MongoDB: {DB_NAME}")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Check if Grand Poitiers already exists
    existing = await db.zones.find_one({"name": "Grand Poitiers"})
    if existing:
        print("Grand Poitiers zone already exists!")
        # Update it
        result = await db.zones.update_one(
            {"name": "Grand Poitiers"},
            {"$set": GRAND_POITIERS}
        )
        print(f"Updated Grand Poitiers: {result.modified_count} document(s)")
    else:
        # Insert
        result = await db.zones.insert_one(GRAND_POITIERS)
        print(f"Created Grand Poitiers zone: {result.inserted_id}")
    
    # List all zones
    zones = await db.zones.find({}).to_list(100)
    print(f"\nTotal zones in database: {len(zones)}")
    for z in zones:
        active = len([c for c in z.get("communes", []) if c.get("isActive")])
        total = len(z.get("communes", []))
        print(f"  - {z['name']}: {active}/{total} communes actives")
    
    client.close()
    print("\nDone!")

if __name__ == "__main__":
    asyncio.run(seed_zones())
