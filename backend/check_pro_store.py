
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority")
client = AsyncIOMotorClient(MONGO_URL)
db = client.loop

async def check_pro_store():
    # 1. Get User ID
    user = await db.users.find_one({"email": "pro@loop.fr"})
    if not user:
        print("User pro@loop.fr not found!")
        return

    print(f"User ID: {user['id']}")

    # 2. Find Store owned by this user
    store = await db.stores.find_one({"owner_id": user['id']})
    
    if store:
        print(f"Found Store: {store['name']} (ID: {store['id']})")
    else:
        print("No store found for this user.")
        # Auto-create one for convenience
        new_store = {
            "id": "store_test_paris_1",
            "owner_id": user['id'],
            "name": "Boulangerie Test",
            "description": "La meilleure boulangerie de Paris",
            "address": "123 Rue de Rivoli, 75001 Paris",
            "lat": 48.8566,
            "lng": 2.3522,
            "category": "Food",
            "logo_url": "https://example.com/logo.png",
            "created_at": "2024-01-01T00:00:00Z"
        }
        await db.stores.insert_one(new_store)
        print("Created test store!")

if __name__ == "__main__":
    asyncio.run(check_pro_store())
