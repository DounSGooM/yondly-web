#!/usr/bin/env python3
"""
Script to create two test users for local testing
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://kribean_db_user:csCjFDK8i24KOfSG@cluster0.yllddco.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority")
DB_NAME = os.getenv("DB_NAME", "loop")

async def create_test_users():
    """Create two test users"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # User 1: Alice
    user1 = {
        "id": str(uuid.uuid4()),
        "email": "alice@test.com",
        "password_hash": pwd_context.hash("alice123"),
        "display_name": "Alice Martin",
        "phone": "+33612345678",
        "wallet_balance_cents": 0,
        "ratings_avg": 4.8,
        "ratings_count": 12,
        "created_at": "2024-01-15T10:00:00"
    }
    
    # User 2: Bob
    user2 = {
        "id": str(uuid.uuid4()),
        "email": "bob@test.com",
        "password_hash": pwd_context.hash("bob123"),
        "display_name": "Bob Dupont",
        "phone": "+33698765432",
        "wallet_balance_cents": 0,
        "ratings_avg": 4.5,
        "ratings_count": 8,
        "created_at": "2024-01-20T14:30:00"
    }
    
    # Delete existing test users if they exist
    await db.users.delete_many({"email": {"$in": ["alice@test.com", "bob@test.com"]}})
    
    # Insert new users
    await db.users.insert_many([user1, user2])
    
    print("✅ Test users created successfully!")
    print("\n📋 User credentials:")
    print("\n👤 User 1:")
    print(f"   Email: alice@test.com")
    print(f"   Password: alice123")
    print(f"   Name: Alice Martin")
    print(f"   ID: {user1['id']}")
    
    print("\n👤 User 2:")
    print(f"   Email: bob@test.com")
    print(f"   Password: bob123")
    print(f"   Name: Bob Dupont")
    print(f"   ID: {user2['id']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_test_users())
