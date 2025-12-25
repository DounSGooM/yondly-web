#!/usr/bin/env python3
"""
Script to clear all test items created by the seeder.
Usage: python3 clear_test_items.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'loop_db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

async def clear_test_items():
    """Delete all items created by the test seeder."""
    try:
        # Find the test user
        user = await db.users.find_one({"email": "test_seed@example.com"})
        
        if not user:
            print("❌ Test user not found. Nothing to delete.")
            return

        print(f"Found test user: {user['username']} (ID: {user['id']})")
        
        # Delete items owned by test user
        result = await db.items.delete_many({"owner_id": user['id']})
        print(f"✅ Deleted {result.deleted_count} test items.")
        
        # Optional: Delete the test user too if you want a completely fresh start
        # await db.users.delete_one({"id": user['id']})
        # print("✅ Deleted test user.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    asyncio.run(clear_test_items())
