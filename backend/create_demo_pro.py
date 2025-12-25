import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from passlib.context import CryptContext
from datetime import datetime
import uuid
from dotenv import load_dotenv
from pathlib import Path

# Load env vars
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database setup
# Database setup
# Using credentials from start_backend.sh
mongo_url = "mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority"
client = AsyncIOMotorClient(mongo_url)
db = client["loop"]

# Password Hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def create_pro_user():
    email = "pro@loop.fr"
    password = "password"
    
    print(f"Checking if user {email} exists...")
    existing_user = await db.users.find_one({"email": email})
    
    hashed_password = pwd_context.hash(password)
    
    if existing_user:
        print(f"User {email} already exists. Updating to partner status and new password scheme.")
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "is_partner": True,
                "password_hash": hashed_password  # Correct field name
            }}
        )
        print("Updated successfully.")
        return

    print(f"Creating new pro user {email}...")
    
    new_user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hashed_password, # Correct field name
        "display_name": "Boulangerie Démo",
        "phone": "0123456789",
        "photo_url": "https://img.freepik.com/photos-gratuite/boulangerie-pain-frais_144627-6698.jpg",
        "is_partner": True,
        "ratings_avg": 4.8,
        "ratings_count": 12,
        "points": 0,
        "level": "Novice",
        "wallet_balance_cents": 0,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(new_user)
    print(f"User {email} created successfully.")
    print(f"Password: {password}")

if __name__ == "__main__":
    asyncio.run(create_pro_user())
