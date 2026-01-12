from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional
import csv
import io
from datetime import datetime

from models import (
    WaitlistCreate, WaitlistEntry,
    PartnerCreate, PartnerEntry,
    ContactCreate, ContactEntry
)

# Router will be configured with db in server.py
router = APIRouter()

# Database reference (set by server.py)
db = None

def set_db(database):
    global db
    db = database


# ============ WAITLIST ROUTES ============

@router.post("/waitlist", response_model=WaitlistEntry, status_code=201)
async def create_waitlist_entry(data: WaitlistCreate):
    """Register a new user to the beta waitlist"""
    if not data.rgpd_consent:
        raise HTTPException(status_code=400, detail="Le consentement RGPD est obligatoire")
    
    # Check if email already exists
    existing = await db.waitlist.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà inscrit à la waitlist")
    
    entry = WaitlistEntry(**data.model_dump())
    await db.waitlist.insert_one(entry.model_dump())
    return entry


@router.get("/waitlist", response_model=List[WaitlistEntry])
async def get_waitlist_entries(
    status: Optional[str] = Query(None, description="Filter by status"),
    city: Optional[str] = Query(None, description="Filter by city")
):
    """Get all waitlist entries (admin)"""
    query = {}
    if status:
        query["status"] = status
    if city:
        query["city"] = city
    
    entries = await db.waitlist.find(query).sort("created_at", -1).to_list(10000)
    return [WaitlistEntry(**entry) for entry in entries]


@router.get("/waitlist/export")
async def export_waitlist_csv():
    """Export waitlist as CSV"""
    entries = await db.waitlist.find().sort("created_at", -1).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["ID", "Email", "Ville", "Statut", "Commentaire", "Consentement RGPD", "Date inscription"])
    
    # Data
    for entry in entries:
        created_at = entry.get("created_at", "")
        if isinstance(created_at, datetime):
            created_at = created_at.strftime("%Y-%m-%d %H:%M:%S")
        writer.writerow([
            entry.get("id", ""),
            entry.get("email", ""),
            entry.get("city", ""),
            entry.get("status", ""),
            entry.get("comment", ""),
            "Oui" if entry.get("rgpd_consent") else "Non",
            created_at
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=yondly_waitlist_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


@router.get("/waitlist/stats")
async def get_waitlist_stats():
    """Get waitlist statistics"""
    total = await db.waitlist.count_documents({})
    by_status = {}
    for status in ["particulier", "pro", "association"]:
        by_status[status] = await db.waitlist.count_documents({"status": status})
    
    by_city = await db.waitlist.aggregate([
        {"$group": {"_id": "$city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]).to_list(10)
    
    return {
        "total": total,
        "by_status": by_status,
        "top_cities": [{"city": item["_id"] or "Non renseignée", "count": item["count"]} for item in by_city]
    }


# ============ PARTNERS ROUTES ============

@router.post("/partners", response_model=PartnerEntry, status_code=201)
async def create_partner_entry(data: PartnerCreate):
    """Register a new partner request (Pro or Association)"""
    if not data.rgpd_consent:
        raise HTTPException(status_code=400, detail="Le consentement RGPD est obligatoire")
    
    # Check if email already exists for this type
    existing = await db.partners.find_one({"email": data.email, "type": data.type})
    if existing:
        raise HTTPException(status_code=400, detail="Une demande avec cet email existe déjà")
    
    entry = PartnerEntry(**data.model_dump())
    await db.partners.insert_one(entry.model_dump())
    return entry


@router.get("/partners", response_model=List[PartnerEntry])
async def get_partner_entries(
    type: Optional[str] = Query(None, description="Filter by type (pro/association)"),
    city: Optional[str] = Query(None, description="Filter by city")
):
    """Get all partner requests (admin)"""
    query = {}
    if type:
        query["type"] = type
    if city:
        query["city"] = city
    
    entries = await db.partners.find(query).sort("created_at", -1).to_list(10000)
    return [PartnerEntry(**entry) for entry in entries]


@router.get("/partners/export")
async def export_partners_csv(
    type: Optional[str] = Query(None, description="Filter by type (pro/association)")
):
    """Export partners as CSV"""
    query = {}
    if type:
        query["type"] = type
    
    entries = await db.partners.find(query).sort("created_at", -1).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["ID", "Type", "Nom", "Contact", "Activité", "Ville", "Email", "Téléphone", "Site web", "Message", "Consentement RGPD", "Date demande"])
    
    # Data
    for entry in entries:
        created_at = entry.get("created_at", "")
        if isinstance(created_at, datetime):
            created_at = created_at.strftime("%Y-%m-%d %H:%M:%S")
        writer.writerow([
            entry.get("id", ""),
            entry.get("type", ""),
            entry.get("name", ""),
            entry.get("contact_name", ""),
            entry.get("business", ""),
            entry.get("city", ""),
            entry.get("email", ""),
            entry.get("phone", ""),
            entry.get("website", ""),
            entry.get("message", ""),
            "Oui" if entry.get("rgpd_consent") else "Non",
            created_at
        ])
    
    output.seek(0)
    type_suffix = f"_{type}" if type else ""
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=yondly_partners{type_suffix}_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


# ============ CONTACT ROUTES ============

@router.post("/contact", response_model=ContactEntry, status_code=201)
async def create_contact_entry(data: ContactCreate):
    """Submit a contact message"""
    if not data.rgpd_consent:
        raise HTTPException(status_code=400, detail="Le consentement RGPD est obligatoire")
    
    entry = ContactEntry(**data.model_dump())
    await db.contacts.insert_one(entry.model_dump())
    return entry


@router.get("/contact", response_model=List[ContactEntry])
async def get_contact_entries():
    """Get all contact messages (admin)"""
    entries = await db.contacts.find().sort("created_at", -1).to_list(10000)
    return [ContactEntry(**entry) for entry in entries]


@router.get("/contact/export")
async def export_contacts_csv():
    """Export contacts as CSV"""
    entries = await db.contacts.find().sort("created_at", -1).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["ID", "Nom", "Email", "Sujet", "Message", "Consentement RGPD", "Date message"])
    
    # Data
    for entry in entries:
        created_at = entry.get("created_at", "")
        if isinstance(created_at, datetime):
            created_at = created_at.strftime("%Y-%m-%d %H:%M:%S")
        writer.writerow([
            entry.get("id", ""),
            entry.get("name", ""),
            entry.get("email", ""),
            entry.get("subject", ""),
            entry.get("message", ""),
            "Oui" if entry.get("rgpd_consent") else "Non",
            created_at
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=yondly_contacts_{datetime.now().strftime('%Y%m%d')}.csv"}
    )
