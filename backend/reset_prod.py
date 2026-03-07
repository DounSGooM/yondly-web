import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

MONGO_URL = "mongodb+srv://kribean_db_user:gPP88ixBF9pDzPEX@yondlycluster.hejjdou.mongodb.net/?appName=YondlyCluster&retryWrites=true&w=majority"
DB_NAME = "yondly_db"

async def fix_prod_db():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    users = await db.users.find({"email": {"$regex": "@test.com"}}).to_list(10)
    print("Found test users in Prod DB:")
    for u in users:
        print(f"- {u.get('email')}")
        
    password_bytes = "test1234".encode("utf-8")
    new_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")
    
    res = await db.users.update_many(
        {"email": {"$regex": "@test.com$"}},
        {"$set": {"password_hash": new_hash, "email_verified": True}}
    )
    print(f"Updated {res.modified_count} users to password test1234 + verified!")

asyncio.run(fix_prod_db())
