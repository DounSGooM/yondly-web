import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import requests

# Connect to MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority")
client = AsyncIOMotorClient(MONGO_URL)
db = client.loop # DB name is "loop"

API_URL = "http://localhost:8000/api"

async def set_partner_true():
    email = "pro@loop.fr"
    password = "password123"
    
    # 1. Try to register user via Requests (Sync)
    print(f" registering {email}...")
    try:
        response = requests.post(f"{API_URL}/auth/register", json={
            "email": email,
            "password": password,
            "display_name": "Pro User",
            "phone": "0600000000"
        })
        
        if response.status_code == 200:
            print("User registered successfully.")
        elif response.status_code == 400:
            print("User already exists (API 400). Proceeding to update.")
        else:
            print(f"Registration failed: {response.status_code} {response.text}")
            # Proceed anyway
    except Exception as e:
        print(f"API Error: {e}")

    # 2. Update DB
    print(f"Updating user {email} to be a partner...")
    
    # Check if user exists
    user = await db.users.find_one({"email": email})
    if not user:
        print("User still not found in DB! Something is wrong.")
        return

    # Update is_partner
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"is_partner": True, "level": "Expert"}} # Giving expert level too for fun
    )

    if result.modified_count > 0:
        print("Success! User is now a partner.")
    else:
        print("User was already a partner or update failed.")

    # Verify
    updated_user = await db.users.find_one({"email": email})
    print(f"Verification: is_partner = {updated_user.get('is_partner')}")
    print(f"Use email: {email} / password: {password}")

if __name__ == "__main__":
    asyncio.run(set_partner_true())
