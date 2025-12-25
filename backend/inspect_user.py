
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Config
MONGO_URL = "mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority"
DB_NAME = "loop"

async def inspect_user():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    target_id = "693b188ead4f828175d16727" # The ID from logs
    
    print(f"Searching for user with id='{target_id}'...")
    user = await db.users.find_one({"id": target_id})
    if user:
        print("FOUND by id!")
        print(user)
    else:
        print("NOT FOUND by id.")
        
    # Try searching by _id (if it's a valid ObjectId)
    try:
        oid = ObjectId(target_id)
        print(f"Searching for user with _id={oid}...")
        user_oid = await db.users.find_one({"_id": oid})
        if user_oid:
            print("FOUND by _id!")
            print(user_oid)
            # Check if it has an 'id' field
            if "id" in user_oid:
                print(f"User has 'id' field: {user_oid['id']} (Type: {type(user_oid['id'])})")
            else:
                print("User MISSING 'id' field!")
        else:
            print("NOT FOUND by _id.")
    except Exception as e:
        print(f"Invalid ObjectId: {e}")

    # Check the first few pros to see pattern
    print("\nListing first 3 partners:")
    async for pro in db.users.find({"is_partner": True}).limit(3):
        print(f"ID: {pro.get('id')}, _id: {pro.get('_id')}")

if __name__ == "__main__":
    asyncio.run(inspect_user())
