from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime

from routes import router as yondly_router, set_db

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import certifi

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where(), tls=True, tlsAllowInvalidCertificates=True)
db = client[os.environ['DB_NAME']]

# Set db for routes
set_db(db)

# Create the main app without a prefix
app = FastAPI(
    title="Yondly API",
    description="API pour le site vitrine Yondly - Waitlist, Partenaires et Contact",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models for legacy endpoints
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str


# Legacy routes
@api_router.get("/")
async def root():
    return {"message": "Bienvenue sur l'API Yondly !"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


# Include the Yondly routes
api_router.include_router(yondly_router)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db_client():
    """Create indexes on startup"""
    # Waitlist indexes
    await db.waitlist.create_index("email", unique=True)
    await db.waitlist.create_index("created_at")
    await db.waitlist.create_index("city")
    await db.waitlist.create_index("status")
    
    # Partners indexes
    await db.partners.create_index([("email", 1), ("type", 1)], unique=True)
    await db.partners.create_index("created_at")
    await db.partners.create_index("type")
    
    # Contacts indexes
    await db.contacts.create_index("created_at")
    
    logger.info("Database indexes created successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
