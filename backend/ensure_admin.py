import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', os.environ["MONGO_URL"])
DB_NAME = os.getenv('DB_NAME', 'loop')

print(f"Connecting to {MONGO_URL}...")

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def ensure_admin():
    try:
        client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        email = "admin@yondly.com"
        password = "admin123"
        hashed = pwd_context.hash(password)
        
        user = await db.users.find_one({"email": email})
        if user:
            print(f"User {email} exists. Updating password.")
            await db.users.update_one(
                {"email": email},
                {"$set": {"password_hash": hashed, "is_partner": True}}
            )
        else:
            print(f"User {email} not found. Creating.")
            await db.users.insert_one({
                "id": "admin_debug_001",
                "email": email,
                "password_hash": hashed,
                "display_name": "Admin Yondly DESKTOP",
                "is_partner": True,
                "created_at": datetime.utcnow()
            })
        print("Admin user ready.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(ensure_admin())
