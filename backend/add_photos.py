import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import random

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.getenv("DB_NAME", "loop")

IMAGES = {
    "bricolage": "https://images.unsplash.com/photo-1540324155974-7523202daa3f?auto=format&fit=crop&q=80&w=800",
    "outil": "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&q=80&w=800",
    "perceuse": "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=800",
    "jardin": "https://images.unsplash.com/photo-1416879598466-419b6ca7ce2e?auto=format&fit=crop&q=80&w=800",
    "tondeuse": "https://images.unsplash.com/photo-1589051039495-eb7b6a9f4bbc?auto=format&fit=crop&q=80&w=800",
    "karcher": "https://images.unsplash.com/photo-1585933646706-7b640101e4db?auto=format&fit=crop&q=80&w=800",
    "high-tech": "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80&w=800",
    "tv": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=800",
    "console": "https://images.unsplash.com/photo-1486401899868-0e435ed85128?auto=format&fit=crop&q=80&w=800",
    "projecteur": "https://images.unsplash.com/photo-1626292376249-f5382bc81db1?auto=format&fit=crop&q=80&w=800",
    "maison": "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&q=80&w=800",
    "meuble": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800",
    "raclette": "https://images.unsplash.com/photo-1579372134591-638708cddf76?auto=format&fit=crop&q=80&w=800",
    "enfant": "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=800",
    "jouet": "https://images.unsplash.com/photo-1596461404969-9ce205b34809?auto=format&fit=crop&q=80&w=800",
    "poussette": "https://images.unsplash.com/photo-1522771930-78848d92d3e8?auto=format&fit=crop&q=80&w=800",
    "sport": "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800",
    "vélo": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    "raquette": "https://images.unsplash.com/photo-1622279457486-640c4cbca04b?auto=format&fit=crop&q=80&w=800",
    "tente": "https://images.unsplash.com/photo-1504280390226-e25b14811a2f?auto=format&fit=crop&q=80&w=800",
    "auto": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=800",
    "remorque": "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&q=80&w=800",
    "coffre": "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&q=80&w=800",
    "valise": "https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&q=80&w=800"
}

FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800", # Headphones/Generic tech
    "https://images.unsplash.com/photo-1584824486509-114594d52103?auto=format&fit=crop&q=80&w=800", # Generic home
    "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=800"  # Generic lifestyle
]

async def update_photos():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Only update the ones missing photos
    items = await db.items.find({"status": "active", "photos": {"$exists": False}}).to_list(1000)
    
    updated_count = 0
    for item in items:
        title = item.get("title", "").lower()
        selected_url = random.choice(FALLBACK_IMAGES)
        
        # Simple keyword matching to find a better image
        for kw, url in IMAGES.items():
            if kw in title:
                selected_url = url
                break
                
        await db.items.update_one(
            {"_id": item["_id"]},
            {"$set": {"photos": [selected_url]}}
        )
        updated_count += 1
        
    print(f"Added realistic placeholder photos to {updated_count} items!")

asyncio.run(update_photos())
