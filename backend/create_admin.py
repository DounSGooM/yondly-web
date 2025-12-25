
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime

# Config
MONGO_URL = "mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority"
DB_NAME = "loop"

# Use pbkdf2_sha256 to avoid bcrypt version issues
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def create_admin():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    email = "admin@yondly.com"
    password = "admin123"
    
    existing = await db.users.find_one({"email": email})
    if existing:
        print(f"Admin user {email} already exists. Updating password...")
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "password_hash": pwd_context.hash(password),
                "is_partner": True, # Admin acts as partner to see pro stuff? Or just user.
                "display_name": "Admin"
            }}
        )
    else:
        print(f"Creating admin user {email}...")
        await db.users.insert_one({
            "id": "admin_user_id",
            "email": email,
            "password_hash": pwd_context.hash(password),
            "display_name": "Admin",
            "is_partner": True,
            "created_at": datetime.utcnow()
        })
        
    print("Done.")

if __name__ == "__main__":
    asyncio.run(create_admin())
