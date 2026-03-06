
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os

# Connect to MongoDB
# Ensure we use the remote URI
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority")
client = AsyncIOMotorClient(MONGO_URL)
db = client.loop # DB name is "loop"

# Hashing setup
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def reset_password():
    email = "pro@loop.fr"
    new_password = "password123"
    
    hashed_pwd = hash_password(new_password)
    print(f"Resetting password for {email}...")

    # Update
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"password_hash": hashed_pwd}}
    )

    if result.matched_count > 0:
        print("Success! Password updated.")
    else:
        print("User not found!")

if __name__ == "__main__":
    asyncio.run(reset_password())
