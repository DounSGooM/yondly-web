import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import bcrypt

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.getenv("DB_NAME", "loop")

async def test():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    users = await db.users.find().to_list(10)
    print("Found users:")
    for u in users:
        print("- " + str(u.get("email")))
        
    user = await db.users.find_one({"email": "thomas.bernard@test.com"})
    if user:
        pwd_hash = user.get("password_hash")
        print("
Checking thomas...")
        print("has_pwd_hash:", bool(pwd_hash))
        print("email_verified:", user.get("email_verified"))
        
        print("Hard resetting password to test1234...")
        password_bytes = "test1234".encode("utf-8")
        new_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")
        
        await db.users.update_one(
            {"email": "thomas.bernard@test.com"},
            {"$set": {"password_hash": new_hash, "email_verified": True}}
        )
        print("Done!")
    else:
        print("User thomas not found AT ALL in database!")

asyncio.run(test())

