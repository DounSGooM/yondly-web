import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load env if not already loaded
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=30000,
    tlsCAFile=certifi.where()
)
db_name = os.environ.get('DB_NAME', 'yondly_db')
db = client[db_name]
