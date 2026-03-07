"""
Script to backfill existing users with beneficiary_id
Run once to add beneficiary IDs to existing users
"""
import asyncio
import random
import string
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "yondly")


def generate_beneficiary_id():
    """Generate a unique beneficiary ID in format YND-XXXXXX"""
    chars = string.ascii_uppercase + string.digits
    code = ''.join(random.choices(chars, k=6))
    return f"YND-{code}"


async def backfill_beneficiary_ids():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Find all users without beneficiary_id
    users_without_id = await db.users.find({
        "beneficiary_id": {"$exists": False}
    }).to_list(None)
    
    print(f"Found {len(users_without_id)} users without beneficiary_id")
    
    updated = 0
    for user in users_without_id:
        new_id = generate_beneficiary_id()
        
        # Make sure it's unique
        while await db.users.find_one({"beneficiary_id": new_id}):
            new_id = generate_beneficiary_id()
        
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"beneficiary_id": new_id}}
        )
        print(f"  Updated {user.get('display_name', user['email'])}: {new_id}")
        updated += 1
    
    print(f"\n✅ Backfilled {updated} users with beneficiary IDs")
    client.close()


if __name__ == "__main__":
    asyncio.run(backfill_beneficiary_ids())
