import asyncio
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

async def seed_sponsors():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.loop_marketplace
    
    # Clear existing sponsors
    await db.sponsors.delete_many({})
    
    sponsors = [
        {
            "id": str(uuid.uuid4()),
            "name": "EcoMarché Plus",
            "logo_url": "🌿",  # Using emoji as placeholder
            "message": "EcoMarché Plus est fier de soutenir la lutte contre le gaspillage alimentaire. Ensemble, construisons un avenir plus durable !",
            "website": "https://www.ecomarche-plus.fr",
            "display_count": 0,
            "active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "BioCoop Solidaire",
            "logo_url": "🥬",  # Using emoji as placeholder
            "message": "BioCoop Solidaire s'engage pour l'environnement et la solidarité. Merci de participer à cette belle initiative anti-gaspi !",
            "website": "https://www.biocoop-solidaire.fr",
            "display_count": 0,
            "active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "FreshFood Alliance",
            "logo_url": "🍎",  # Using emoji as placeholder
            "message": "FreshFood Alliance soutient les actions locales contre le gaspillage. Chaque don compte pour préserver notre planète !",
            "website": "https://www.freshfood-alliance.fr",
            "display_count": 0,
            "active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "GreenMarket Pro",
            "logo_url": "♻️",  # Using emoji as placeholder
            "message": "GreenMarket Pro finance cette action solidaire. Merci de contribuer à réduire le gaspillage alimentaire !",
            "website": "https://www.greenmarket-pro.fr",
            "display_count": 0,
            "active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    result = await db.sponsors.insert_many(sponsors)
    print(f"✅ {len(result.inserted_ids)} sponsors insérés avec succès")
    
    # Display sponsors
    for sponsor in sponsors:
        print(f"  - {sponsor['logo_url']} {sponsor['name']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_sponsors())
