import os
from pymongo import MongoClient
import certifi

# User provided URL + params I added
MONGO_URL = os.environ["MONGO_URL"]

print(f"Testing connection to: {MONGO_URL.split('@')[1]}")

try:
    client = MongoClient(MONGO_URL, tlsCAFile=certifi.where())
    # Force a connection
    client.admin.command('ping')
    print("✅ Connection successful!")
except Exception as e:
    print(f"❌ Connection failed: {e}")
