import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority")
DB_NAME = os.getenv("DB_NAME", "loop")

async def test():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    count = await db.items.count_documents({"type": "rent"})
    print("Number of rent items: " + str(count))
    
    items = await db.items.find({"type": "rent"}).to_list(10)
    for i in items:
        status = i.get("status", "unknown")
        print("Rent Item: " + str(i.get("title")) + " | Status: " + str(status))

asyncio.run(test())

