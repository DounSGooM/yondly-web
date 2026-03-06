import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.server import db

async def list_recent_users():
    print("Connecting to DB...")
    users = await db.users.find().sort("created_at", -1).limit(5).to_list(5)
    print(f"Found {len(users)} users.")
    for u in users:
        print(f"- {u.get('display_name')} ({u.get('email')}) - Created: {u.get('created_at')}")

if __name__ == "__main__":
    asyncio.run(list_recent_users())
