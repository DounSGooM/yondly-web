"""
Analytics Routes for Yondly Observatoire
API endpoints for tracking events and aggregating statistics for collectivités.
RGPD-compliant: only aggregated data returned, no individual user data exposed.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import Optional, List
import os
import jwt
import uuid

from analytics_models import (
    TrackingEventCreate,
    TrackingEvent,
    TrackingEventResponse,
    TerritoryStats,
    StatsResponse,
    SENSITIVE_FIELDS,
    ALLOWED_EVENTS,
    hash_user_id,
)

# ============ SETUP ============

# Create analytics router with /api prefix
analytics_router = APIRouter(prefix="/api", tags=["analytics"])

# MongoDB connection (will be set by init_analytics)
db = None

# JWT config (will be set by init_analytics)
JWT_SECRET = None
JWT_ALGORITHM = "HS256"

# Security for optional auth
security = HTTPBearer(auto_error=False)


def init_analytics(database, jwt_secret: str, jwt_algorithm: str = "HS256"):
    """
    Initialize analytics module with shared Supabase database and JWT config.
    """
    global db, JWT_SECRET, JWT_ALGORITHM
    db = database
    JWT_SECRET = jwt_secret
    JWT_ALGORITHM = jwt_algorithm
    
    # Create indexes for efficient queries
    # Note: These are idempotent, safe to call multiple times
    import asyncio
    asyncio.create_task(_create_indexes())


async def _create_indexes():
    """No-op: indexes are managed at the SQL schema level in Supabase."""
    pass


# ============ HELPER FUNCTIONS ============

async def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    Extract user_id from JWT token if provided.
    Returns None if no valid token is provided.
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        return hash_user_id(user_id) if user_id else None
    except:
        return None


def check_sensitive_fields(data: dict) -> List[str]:
    """Check if any sensitive fields are present in the data."""
    found = []
    for key in data.keys():
        key_lower = key.lower()
        for sensitive in SENSITIVE_FIELDS:
            if sensitive in key_lower:
                found.append(key)
                break
    return found


# ============ INTERNAL HELPER (for use by other routes) ============

async def track_event_internal(
    user_id: str,
    event_name: str,
    territory_type: str,
    territory_code: str,
    mode: Optional[str] = None,
    category: Optional[str] = None,
    estimated_value: Optional[float] = None
) -> Optional[str]:
    """
    Internal function to track an event from other backend routes.
    Returns event_id on success, None on failure.
    
    Usage:
        from analytics_routes import track_event_internal
        await track_event_internal(
            user_id=hash_user_id(current_user["id"]),
            event_name="listing_created",
            territory_type="code_postal",
            territory_code="75018",
            mode="don",
            category="alimentaire"
        )
    """
    if db is None:
        return None
    
    if event_name not in ALLOWED_EVENTS:
        return None
    
    try:
        event_id = str(uuid.uuid4())
        event_doc = {
            "id": event_id,
            "user_id": hash_user_id(user_id) if user_id else "anonymous",
            "event_name": event_name,
            "territory_type": territory_type,
            "territory_code": territory_code,
            "mode": mode,
            "category": category,
            "estimated_value": estimated_value,
            "created_at": datetime.utcnow()
        }
        await db.tracking_events.insert_one(event_doc)
        return event_id
    except Exception as e:
        print(f"Analytics tracking error: {e}")
        return None


# ============ API ROUTES ============

@analytics_router.post("/events", response_model=TrackingEventResponse, status_code=201)
async def track_event(
    event_data: TrackingEventCreate,
    auth_user_id: Optional[str] = Depends(get_optional_user_id)
):
    """
    Track an analytics event.
    
    - event_name must be in the allowed events whitelist
    - Sensitive fields (email, phone, etc.) are rejected
    - user_id is pseudonymized before storage
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Analytics service not initialized")
    
    # Check for sensitive fields in the raw request
    event_dict = event_data.dict(exclude_unset=True)
    sensitive_found = check_sensitive_fields(event_dict)
    if sensitive_found:
        raise HTTPException(
            status_code=400,
            detail=f"Sensitive fields not allowed: {', '.join(sensitive_found)}"
        )
    
    # Determine user_id: prefer auth token, fallback to provided, else anonymous
    user_id = auth_user_id
    if not user_id and event_data.user_id:
        user_id = hash_user_id(event_data.user_id)
    if not user_id:
        user_id = "anonymous"
    
    # Create event document
    event_id = str(uuid.uuid4())
    event_doc = {
        "id": event_id,
        "user_id": user_id,
        "event_name": event_data.event_name,
        "territory_type": event_data.territory_type,
        "territory_code": event_data.territory_code,
        "mode": event_data.mode,
        "category": event_data.category,
        "estimated_value": event_data.estimated_value,
        "created_at": event_data.timestamp or datetime.utcnow()
    }
    
    try:
        await db.tracking_events.insert_one(event_doc)
        return TrackingEventResponse(success=True, event_id=event_id)
    except Exception as e:
        # Log error but don't crash the API
        print(f"Analytics tracking error: {e}")
        raise HTTPException(status_code=500, detail="Failed to track event")


@analytics_router.get("/stats/territories", response_model=StatsResponse)
async def get_territory_stats(
    start_date: datetime = Query(..., description="Start date (ISO format)"),
    end_date: datetime = Query(..., description="End date (ISO format)"),
    territory_type: Optional[str] = Query(None, description="Filter by territory type"),
    territory_code: Optional[str] = Query(None, description="Filter by territory code")
):
    """
    Get aggregated statistics by territory for collectivités.
    
    Returns ONLY aggregated data - no individual user information is exposed.
    Data is grouped by territory and month.
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Analytics service not initialized")
    
    # Build match stage
    match_stage = {
        "created_at": {"$gte": start_date, "$lte": end_date}
    }
    if territory_type:
        match_stage["territory_type"] = territory_type
    if territory_code:
        match_stage["territory_code"] = territory_code
    
    # Aggregation pipeline
    pipeline = [
        {"$match": match_stage},
        {
            "$group": {
                "_id": {
                    "territory_code": "$territory_code",
                    "territory_type": "$territory_type",
                    "period": {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}}
                },
                "total_transactions": {"$sum": 1},
                "donations_count": {
                    "$sum": {"$cond": [{"$eq": ["$mode", "don"]}, 1, 0]}
                },
                "second_hand_sales_count": {
                    "$sum": {"$cond": [{"$eq": ["$mode", "vente"]}, 1, 0]}
                },
                "rentals_count": {
                    "$sum": {"$cond": [{"$eq": ["$mode", "location"]}, 1, 0]}
                },
                "estimated_value_total": {
                    "$sum": {"$ifNull": ["$estimated_value", 0]}
                },
                "categories": {"$push": "$category"}
            }
        },
        {"$sort": {"_id.territory_code": 1, "_id.period": -1}}
    ]
    
    try:
        results = []
        async for doc in db.tracking_events.aggregate(pipeline):
            # Calculate top category
            categories = [c for c in doc.get("categories", []) if c]
            top_category = None
            if categories:
                from collections import Counter
                category_counts = Counter(categories)
                top_category = category_counts.most_common(1)[0][0] if category_counts else None
            
            stats = TerritoryStats(
                territory_code=doc["_id"]["territory_code"],
                territory_type=doc["_id"]["territory_type"],
                period=doc["_id"]["period"],
                total_transactions=doc["total_transactions"],
                donations_count=doc["donations_count"],
                second_hand_sales_count=doc["second_hand_sales_count"],
                rentals_count=doc["rentals_count"],
                top_category=top_category,
                estimated_value_total=round(doc["estimated_value_total"], 2)
            )
            results.append(stats)
        
        return StatsResponse(
            success=True,
            data=results,
            period={"start_date": start_date.isoformat(), "end_date": end_date.isoformat()}
        )
    
    except Exception as e:
        print(f"Analytics aggregation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to aggregate statistics")
