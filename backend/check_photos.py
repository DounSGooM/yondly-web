import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.getenv("DB_NAME", "loop")

async def test():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    count_no_photos = await db.items.count_documents({"status": "active", "photos": {"$size": 0}})
    count_missing_photos = await db.items.count_documents({"status": "active", "photos": {"$exists": False}})
    
    print("Items with empty photos array: " + str(count_no_photos))
    print("Items completely missing photos field: " + str(count_missing_photos))
    
    items = await db.items.find({"status": "active", "photos.0": {"$exists": True}}).to_list(10)
    print("\nSample URLs from items with photos:")
    for item in items:
        print("Title: " + str(item.get("title")) + " | Photos: " + str(item.get("photos")))

asyncio.run(test())
