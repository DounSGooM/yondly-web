import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.getenv("DB_NAME", "loop")

async def test():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Check how many are available
    count_avail = await db.items.count_documents({"status": "available"})
    print(f"Number of available items to convert: {count_avail}")
    
    # Update them all to active
    result = await db.items.update_many(
        {"status": "available"},
        {"$set": {"status": "active"}}
    )
    print(f"Successfully converted {result.modified_count} items to 'active'.")
    
    # What about other statuses for our items?
    count_completed = await db.items.count_documents({"status": "completed"})
    count_sold = await db.items.count_documents({"status": "sold"})
    print(f"Items completed: {count_completed}")
    print(f"Items sold: {count_sold}")

asyncio.run(test())
