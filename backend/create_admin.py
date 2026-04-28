import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
import datetime

MONGO_URL = "mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority"
DB_NAME = "loop"

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def create_admin():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    email = "admin@yondly.com"
    password = "admin123"

    # Check if exists
    user = await db.users.find_one({"email": email})

    admin_data = {
        "email": email,
        "password_hash": hash_password(password),
        "full_name": "Admin Yondly",
        "display_name": "Admin",
        "created_at": datetime.datetime.utcnow().isoformat(),
        "is_admin": True,
        "trust_level": 100,
        "risk_score": 0,
        "verified": True
    }

    if user:
        print(f"User {email} found. Updating password...")
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "password_hash": admin_data["password_hash"],
                "is_admin": True # Ensure admin flag is set
            }}
        )
        print("Password updated successfully.")
    else:
        print(f"User {email} not found. Creating...")
        admin_data["id"] = str(uuid.uuid4())
        await db.users.insert_one(admin_data)
        print("Admin user created successfully.")

if __name__ == "__main__":
    asyncio.run(create_admin())
