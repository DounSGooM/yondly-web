import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority")
DB_NAME = os.getenv("DB_NAME", "loop")

async def test():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    user = await db.users.find_one({"email": "thomas.bernard@test.com"})
    if user:
        print(f"User found: email_verified={user.get('email_verified')}")
        # Fix the issue if email is not verified
        if not user.get("email_verified"):
            print("Updating email_verified to True for test users...")
            await db.users.update_many(
                {"email": {"$regex": "@test.com$"}},
                {"$set": {"email_verified": True}}
            )
            print("Done updating test users!")
    else:
        print("User not found!")

asyncio.run(test())
