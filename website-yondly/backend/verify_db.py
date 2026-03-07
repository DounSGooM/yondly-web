import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

mongo_url = "mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority"

async def ping_db():
    try:
        print(f"Attempting to connect to (Async): {mongo_url.split('@')[1]}")
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print("✅ Async Connection Successful!")
    except Exception as e:
        print(f"❌ Async Connection Failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(ping_db())
