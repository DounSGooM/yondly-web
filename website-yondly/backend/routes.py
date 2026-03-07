from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
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
from email_service import send_contact_confirmation, send_waitlist_confirmation

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

from email_service import send_contact_confirmation, send_waitlist_confirmation, send_email, ADMIN_EMAIL  # Add imports

# ... (inside create_partner_entry)
@router.post("/partners", response_model=PartnerEntry, status_code=201)
async def create_partner_entry(data: PartnerCreate, background_tasks: BackgroundTasks):
    """Register a new partner request (Pro or Association)"""
    if not data.rgpd_consent:
        raise HTTPException(status_code=400, detail="Le consentement RGPD est obligatoire")
    
    # Check if email already exists for this type
    existing = await db.partners.find_one({"email": data.email, "type": data.type})
    if existing:
        raise HTTPException(status_code=400, detail="Une demande avec cet email existe déjà")
    
    entry = PartnerEntry(**data.model_dump())
    await db.partners.insert_one(entry.model_dump())

    # Send notification to Admin
    admin_subject = f"[Yondly Partner] Nouvelle demande partenaire ({data.type})"
    admin_content = f"""
    <html>
    <body>
        <h3>Nouvelle demande partenaire</h3>
        <p><strong>Type:</strong> {data.type}</p>
        <p><strong>Nom:</strong> {data.name}</p>
        <p><strong>Ville:</strong> {data.city}</p>
        <p><strong>Email:</strong> {data.email}</p>
        <p><strong>Message:</strong></p>
        <pre>{data.message}</pre>
    </body>
    </html>
    """
    background_tasks.add_task(send_email, ADMIN_EMAIL, "Admin Yondly", admin_subject, admin_content)

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


# ============ BLOG ROUTES ============

from models import BlogPost, BlogPostCreate, BlogPostUpdate
from fastapi import Header

import os
ADMIN_KEY = os.environ.get("ADMIN_KEY", "SECRET_KEY_YONDLY_ADMIN_2025")

@router.get("/blog", response_model=List[BlogPost])
async def get_blog_posts():
    """Get all blog posts (public)"""
    posts = await db.blog.find().sort("created_at", -1).to_list(1000)
    return [BlogPost(**post) for post in posts]

@router.get("/blog/{slug}", response_model=BlogPost)
async def get_blog_post(slug: str):
    """Get a single blog post by slug (public)"""
    post = await db.blog.find_one({"slug": slug})
    if not post:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    return BlogPost(**post)

@router.post("/blog", response_model=BlogPost, status_code=201)
async def create_blog_post(
    data: BlogPostCreate, 
    x_admin_key: Optional[str] = Header(None)
):
    """Create a new blog post (admin only)"""
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Check slug uniqueness
    existing = await db.blog.find_one({"slug": data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Ce slug existe déjà")
        
    post = BlogPost(**data.model_dump())
    await db.blog.insert_one(post.model_dump())
    return post

@router.put("/blog/{id}", response_model=BlogPost)
async def update_blog_post(
    id: str, 
    data: BlogPostUpdate,
    x_admin_key: Optional[str] = Header(None)
):
    """Update a blog post (admin only)"""
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
        
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if "slug" in update_data:
        existing = await db.blog.find_one({"slug": update_data["slug"], "id": {"$ne": id}})
        if existing:
            raise HTTPException(status_code=400, detail="Ce slug existe déjà")

    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")
        
    result = await db.blog.find_one_and_update(
        {"id": id},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Article non trouvé")
        
    return BlogPost(**result)

@router.delete("/blog/{id}", status_code=204)
async def delete_blog_post(
    id: str,
    x_admin_key: Optional[str] = Header(None)
):
    """Delete a blog post (admin only)"""
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
        
    result = await db.blog.delete_one({"id": id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    return None
