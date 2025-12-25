from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from bson import ObjectId
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'loop_jwt_secret_change_in_production')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 720))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class Location(BaseModel):
    lat: float
    lng: float

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    display_name: str
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    ratings_avg: Optional[float] = 0.0
    ratings_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None

class ItemCreate(BaseModel):
    type: Literal['donation', 'sale']
    food_type: Optional[Literal['non_perishable', 'fresh_produce']] = None
    title: str
    description: Optional[str] = None
    photos: List[str] = []  # base64 encoded
    category: str
    condition: Optional[Literal['new', 'good', 'repair']] = None
    tags: Optional[List[str]] = []
    location: Location
    radius_km: Optional[float] = 5.0
    urgency_hours: Optional[int] = None  # For food donations
    price_cents: Optional[int] = None  # For sales
    allow_offers: bool = False

class Item(BaseModel):
    id: str
    type: Literal['donation', 'sale']
    food_type: Optional[Literal['non_perishable', 'fresh_produce']] = None
    title: str
    description: Optional[str] = None
    photos: List[str] = []
    category: str
    condition: Optional[Literal['new', 'good', 'repair']] = None
    tags: Optional[List[str]] = []
    location: Location
    radius_km: Optional[float] = 5.0
    urgency_hours: Optional[int] = None
    price_cents: Optional[int] = None
    allow_offers: bool = False
    status: Literal['active', 'reserved', 'completed', 'expired'] = 'active'
    owner_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_dict = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "display_name": user_data.display_name,
        "phone": user_data.phone,
        "photo_url": None,
        "ratings_avg": 0.0,
        "ratings_count": 0,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    # Return user without password
    user_dict.pop("password_hash")
    user_dict.pop("_id", None)
    
    return {
        "user": user_dict,
        "access_token": access_token,
        "token_type": "bearer"
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Create token
    access_token = create_access_token(data={"sub": user["id"]})
    
    # Return user without password
    user.pop("password_hash")
    user.pop("_id", None)
    
    return {
        "user": user,
        "access_token": access_token,
        "token_type": "bearer"
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user.pop("password_hash", None)
    current_user.pop("_id", None)
    return current_user

@api_router.put("/auth/profile")
async def update_profile(update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if update_dict:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": update_dict}
        )
    
    updated_user = await db.users.find_one({"id": current_user["id"]})
    updated_user.pop("password_hash", None)
    updated_user.pop("_id", None)
    return updated_user

# ============ ITEM ROUTES ============

@api_router.post("/items", response_model=Item)
async def create_item(item_data: ItemCreate, current_user: dict = Depends(get_current_user)):
    # Validate food donations
    if item_data.type == 'donation':
        if not item_data.food_type:
            raise HTTPException(status_code=400, detail="food_type is required for donations")
        if item_data.price_cents:
            raise HTTPException(status_code=400, detail="Donations cannot have a price")
        if not item_data.urgency_hours:
            raise HTTPException(status_code=400, detail="urgency_hours is required for donations")
    
    # Validate sales
    if item_data.type == 'sale':
        if not item_data.price_cents or item_data.price_cents <= 0:
            raise HTTPException(status_code=400, detail="price_cents is required for sales")
    
    item_id = str(uuid.uuid4())
    
    # Calculate expiry for food donations
    expires_at = None
    if item_data.type == 'donation' and item_data.urgency_hours:
        expires_at = datetime.utcnow() + timedelta(hours=item_data.urgency_hours)
    
    item_dict = item_data.dict()
    item_dict.update({
        "id": item_id,
        "owner_id": current_user["id"],
        "status": "active",
        "created_at": datetime.utcnow(),
        "expires_at": expires_at
    })
    
    await db.items.insert_one(item_dict)
    
    item_dict.pop("_id", None)
    return Item(**item_dict)

@api_router.get("/items", response_model=List[Item])
async def get_items(
    type: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = 'active',
    limit: int = 50
):
    query = {}
    if type:
        query["type"] = type
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    
    # Check for expired items and update them
    now = datetime.utcnow()
    await db.items.update_many(
        {
            "expires_at": {"$lte": now},
            "status": "active"
        },
        {"$set": {"status": "expired"}}
    )
    
    items = await db.items.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    
    for item in items:
        item.pop("_id", None)
    
    return [Item(**item) for item in items]

@api_router.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: str):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.pop("_id", None)
    return Item(**item)

@api_router.get("/items/user/{user_id}", response_model=List[Item])
async def get_user_items(user_id: str):
    items = await db.items.find({"owner_id": user_id}).sort("created_at", -1).to_list(100)
    
    for item in items:
        item.pop("_id", None)
    
    return [Item(**item) for item in items]

@api_router.put("/items/{item_id}/status")
async def update_item_status(
    item_id: str,
    status: Literal['active', 'reserved', 'completed', 'expired'],
    current_user: dict = Depends(get_current_user)
):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this item")
    
    await db.items.update_one(
        {"id": item_id},
        {"$set": {"status": status}}
    )
    
    return {"message": "Status updated successfully"}

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str, current_user: dict = Depends(get_current_user)):
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")
    
    await db.items.delete_one({"id": item_id})
    return {"message": "Item deleted successfully"}

# ============ USER ROUTES ============

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.pop("password_hash", None)
    user.pop("_id", None)
    return user

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
