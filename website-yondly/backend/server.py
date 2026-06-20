from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase database (même couche d'abstraction que le backend principal)
import sys
sys.path.insert(0, str(ROOT_DIR.parent.parent / 'backend'))
from database import db

from routes import router as yondly_router, set_db

# Injecter db dans les routes
set_db(db)

# Create the main app without a prefix
app = FastAPI(
    title="Yondly Website API",
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
    status_obj = StatusCheck(**input.dict())
    await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**s) for s in status_checks]


# Include the Yondly routes
api_router.include_router(yondly_router)
app.include_router(api_router)

# CORS
DEFAULT_ORIGINS = [
    "https://www.yondly.app",
    "https://yondly.app",
    "https://yondly.vercel.app",
    "http://localhost:3000",
]
cors_origins = [
    o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()
] or DEFAULT_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    logger.info("Yondly Website API démarrée — Supabase connecté")
