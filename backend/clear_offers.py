#!/usr/bin/env python3
"""
Clear all offers from the database
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority")
DB_NAME = os.getenv("DB_NAME", "loop")

async def clear_offers():
    """Delete all offers from database"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Count existing offers
    count = await db.offers.count_documents({})
    
    if count == 0:
        print("✅ Aucune offre à supprimer")
    else:
        # Delete all offers
        result = await db.offers.delete_many({})
        print(f"✅ {result.deleted_count} offre(s) supprimée(s)")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_offers())
