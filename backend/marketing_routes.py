import os
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Header

import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException as BrevoApiException

from models import WaitlistEntry, ContactMessage, PartnerApplication
from database import db
from auth_utils import get_current_user
from email_service import (
    send_waitlist_admin_notification,
    send_waitlist_confirmation,
    send_contact_notification,
    send_auto_reply,
)

router = APIRouter(tags=["marketing"])

BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "no-reply@yondly.com")
BREVO_SENDER_NAME = os.environ.get("SENDER_NAME", "L'équipe Yondly")
ADMIN_KEY = os.environ.get("ADMIN_KEY", "SECRET_KEY_YONDLY_ADMIN_2025")


# ── Brevo helpers ─────────────────────────────────────────────────────────────

def _brevo_transac_api():
    if not BREVO_API_KEY:
        return None
    cfg = sib_api_v3_sdk.Configuration()
    cfg.api_key["api-key"] = BREVO_API_KEY
    return sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(cfg))


def _brevo_contacts_api():
    if not BREVO_API_KEY:
        return None
    cfg = sib_api_v3_sdk.Configuration()
    cfg.api_key["api-key"] = BREVO_API_KEY
    return sib_api_v3_sdk.ContactsApi(sib_api_v3_sdk.ApiClient(cfg))


async def send_brevo_email(to_email: str, to_name: str, subject: str, html_content: str):
    api = _brevo_transac_api()
    if not api:
        print(f"⚠️ Brevo not configured, skipping email to {to_email}")
        return False
    try:
        api.send_transac_email(sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email, "name": to_name}],
            sender={"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
            subject=subject,
            html_content=html_content,
        ))
        return True
    except BrevoApiException as e:
        print(f"❌ Brevo email error: {e}")
        return False


async def add_brevo_contact(email: str, attributes: dict = None):
    api = _brevo_contacts_api()
    if not api:
        return False
    try:
        api.create_contact(sib_api_v3_sdk.CreateContact(
            email=email,
            attributes=attributes or {},
            list_ids=[2],
            update_enabled=True,
        ))
        return True
    except BrevoApiException as e:
        print(f"❌ Brevo contact error: {e}")
        return False


# ── Newsletter ────────────────────────────────────────────────────────────────

@router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: dict):
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    if await db.newsletter.find_one({"email": email}):
        return {"message": "Already subscribed"}

    await db.newsletter.insert_one({
        "id": str(uuid.uuid4()),
        "email": email,
        "source": "landing_page",
        "created_at": datetime.utcnow(),
    })
    return {"message": "Successfully subscribed"}


@router.get("/admin/newsletter")
async def get_newsletter_subscribers(current_user: dict = Depends(get_current_user)):
    subscribers = await db.newsletter.find().sort("created_at", -1).to_list(1000)
    for s in subscribers:
        s.pop("_id", None)
    return subscribers


# ── Waitlist ──────────────────────────────────────────────────────────────────

@router.post("/waitlist")
async def join_waitlist(entry: WaitlistEntry, background_tasks: BackgroundTasks):
    if await db.waitlist.find_one({"email": entry.email}):
        return {"message": "Already on the list"}

    entry_dict = entry.dict()
    entry_dict["id"] = str(uuid.uuid4())
    entry_dict["created_at"] = datetime.utcnow()
    await db.waitlist.insert_one(entry_dict)

    background_tasks.add_task(send_waitlist_admin_notification, entry_dict)
    background_tasks.add_task(send_waitlist_confirmation, entry_dict)
    background_tasks.add_task(
        add_brevo_contact,
        entry.email,
        {"VILLE": entry_dict.get("city", ""), "TYPE": entry_dict.get("status", "particulier")},
    )

    return {"message": "Joined successfully"}


@router.get("/admin/waitlist")
async def get_waitlist(current_user: dict = Depends(get_current_user)):
    entries = await db.waitlist.find().sort("created_at", -1).to_list(1000)
    for e in entries:
        e.pop("_id", None)
    return entries


# ── Blog ──────────────────────────────────────────────────────────────────────

@router.get("/blog")
async def get_blog_posts():
    posts = await db.blog.find().sort("created_at", -1).to_list(1000)
    for p in posts:
        p.pop("_id", None)
    return posts


@router.get("/blog/{slug}")
async def get_blog_post(slug: str):
    post = await db.blog.find_one({"slug": slug})
    if not post:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    post.pop("_id", None)
    return post


@router.post("/blog")
async def create_blog_post(data: dict, x_admin_key: str = Header(None)):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    if await db.blog.find_one({"slug": data.get("slug")}):
        raise HTTPException(status_code=400, detail="Ce slug existe déjà")
    data["id"] = str(uuid.uuid4())
    data["created_at"] = datetime.utcnow()
    await db.blog.insert_one(data)
    data.pop("_id", None)
    return data


@router.put("/blog/{post_id}")
async def update_blog_post(post_id: str, data: dict, x_admin_key: str = Header(None)):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée")
    result = await db.blog.find_one_and_update(
        {"id": post_id}, {"$set": update_data}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    result.pop("_id", None)
    return result


@router.delete("/blog/{post_id}", status_code=204)
async def delete_blog_post(post_id: str, x_admin_key: str = Header(None)):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    result = await db.blog.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    return None


# ── Contact & Partners ────────────────────────────────────────────────────────

@router.post("/contact")
async def contact_us(msg: ContactMessage, background_tasks: BackgroundTasks):
    msg_dict = msg.dict()
    msg_dict["id"] = str(uuid.uuid4())
    await db.contacts.insert_one(msg_dict)
    background_tasks.add_task(send_contact_notification, msg_dict)
    background_tasks.add_task(send_auto_reply, msg_dict)
    return {"message": "Message sent"}


@router.post("/partners")
async def partner_request(app: PartnerApplication):
    app_dict = app.dict()
    app_dict["id"] = str(uuid.uuid4())
    await db.partners.insert_one(app_dict)
    return {"message": "Application received"}


@router.get("/admin/contacts")
async def get_contacts(current_user: dict = Depends(get_current_user)):
    msgs = await db.contacts.find().sort("created_at", -1).to_list(1000)
    for m in msgs:
        m.pop("_id", None)
    return msgs


@router.get("/admin/partners")
async def get_partners(current_user: dict = Depends(get_current_user)):
    apps = await db.partners.find().sort("created_at", -1).to_list(1000)
    for a in apps:
        a.pop("_id", None)
    return apps
