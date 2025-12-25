"""
Analytics Models for Yondly Observatoire
Pydantic models for tracking events and territory statistics.
RGPD-compliant: no personal data, only pseudonymized IDs.
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal
from datetime import datetime
import hashlib

# ============ CONSTANTS ============

# Whitelist of allowed event names
ALLOWED_EVENTS = [
    "user_signup",
    "listing_created",
    "listing_viewed",
    "listing_completed",
    "transaction_completed",
    "donation_completed",
    "rental_started",
    "rental_completed",
    "offer_made",
    "offer_accepted",
    "message_sent",
    "search_performed",
    "store_followed",
]

# Sensitive fields that must NOT be present in requests
SENSITIVE_FIELDS = [
    "email",
    "phone",
    "full_name",
    "first_name",
    "last_name",
    "address",
    "ip",
    "ip_address",
    "password",
    "credit_card",
    "iban",
    "bic",
]


# ============ HELPER FUNCTIONS ============

def hash_user_id(user_id: str) -> str:
    """
    Create a pseudonymized hash of the user ID.
    Uses SHA-256 with a salt for privacy.
    """
    salt = "yondly_analytics_v1"
    return hashlib.sha256(f"{salt}:{user_id}".encode()).hexdigest()[:16]


# ============ INPUT MODELS ============

class TrackingEventCreate(BaseModel):
    """Input model for tracking an event via POST /api/events"""
    event_name: str
    territory_type: Literal["code_postal", "commune", "quartier", "departement", "region"]
    territory_code: str
    mode: Optional[Literal["don", "vente", "location"]] = None
    category: Optional[str] = None
    estimated_value: Optional[float] = None
    timestamp: Optional[datetime] = None
    user_id: Optional[str] = None  # Optional: will be derived from auth if not provided
    
    @validator("event_name")
    def validate_event_name(cls, v):
        if v not in ALLOWED_EVENTS:
            raise ValueError(f"event_name must be one of: {', '.join(ALLOWED_EVENTS)}")
        return v
    
    @validator("territory_code")
    def validate_territory_code(cls, v):
        if not v or len(v) < 2:
            raise ValueError("territory_code must be at least 2 characters")
        return v
    
    class Config:
        extra = "forbid"  # Reject any extra fields


class StatsQuery(BaseModel):
    """Query parameters for GET /api/stats/territories"""
    start_date: datetime
    end_date: datetime
    territory_type: Optional[str] = None
    territory_code: Optional[str] = None


# ============ DATABASE MODELS ============

class TrackingEvent(BaseModel):
    """Stored event in MongoDB"""
    id: Optional[str] = None
    user_id: str  # Pseudonymized (hashed)
    event_name: str
    territory_type: str
    territory_code: str
    mode: Optional[str] = None
    category: Optional[str] = None
    estimated_value: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============ RESPONSE MODELS ============

class TrackingEventResponse(BaseModel):
    """Response for POST /api/events"""
    success: bool = True
    event_id: Optional[str] = None


class TerritoryStats(BaseModel):
    """Single territory statistics for a period"""
    territory_code: str
    territory_type: str
    period: str  # Format: "YYYY-MM"
    total_transactions: int = 0
    donations_count: int = 0
    second_hand_sales_count: int = 0
    rentals_count: int = 0
    top_category: Optional[str] = None
    estimated_value_total: float = 0.0


class StatsResponse(BaseModel):
    """Response for GET /api/stats/territories"""
    success: bool = True
    data: List[TerritoryStats] = []
    period: dict = {}  # {start_date, end_date}
