"""
Migration MongoDB → Supabase (PostgreSQL)
=========================================
Usage:
    1. Crée backend/migrations/.env.migration avec les variables ci-dessous
    2. pip install motor pymongo supabase python-dotenv
    3. python migrate_mongodb_to_supabase.py

Variables requises dans .env.migration:
    MONGO_URL=mongodb+srv://...
    MONGO_DB=yondly_db
    SUPABASE_URL=https://xxxx.supabase.co
    SUPABASE_SERVICE_KEY=eyJ...
"""

import asyncio
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from supabase import create_client, Client
import certifi

load_dotenv(os.path.join(os.path.dirname(__file__), ".env.migration"))

MONGO_URL = os.environ["MONGO_URL"]
MONGO_DB = os.environ.get("MONGO_DB", "yondly_db")
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
mongo_client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
mongo = mongo_client[MONGO_DB]

# Mapping des anciens IDs (string MongoDB) → nouveaux UUIDs Supabase
id_map: dict[str, dict[str, str]] = {
    "users": {}, "stores": {}, "items": {}, "offers": {},
    "orders": {}, "rental_bookings": {}, "ratings": {}, "messages": {},
    "transactions": {}, "withdrawals": {}, "disputes": {}, "deals": {},
    "beneficiaries": {}, "pro_sellers": {}, "offer_pro": {},
    "notifications": {}, "saved_searches": {}, "geo_zones": {},
}


def new_id() -> str:
    return str(uuid.uuid4())


def map_id(collection: str, old_id: str | None) -> str | None:
    if not old_id:
        return None
    return id_map[collection].get(str(old_id))


def to_ts(val) -> str | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.isoformat()
    if isinstance(val, str):
        return val
    return str(val)


def chunk(lst, size=500):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


def upsert(table: str, rows: list[dict]):
    if not rows:
        return
    for batch in chunk(rows):
        supabase.table(table).upsert(batch, on_conflict="id").execute()
    print(f"  ✓ {len(rows)} lignes → {table}")


# ─── USERS ────────────────────────────────────────────────────────────────────
async def migrate_users():
    print("\n→ users")
    docs = await mongo.users.find({}).to_list(None)
    rows = []
    for d in docs:
        old_id = str(d["_id"])
        new = new_id()
        id_map["users"][old_id] = new
        loc = d.get("location") or {}
        rows.append({
            "id": new,
            "email": d.get("email", ""),
            "password_hash": d.get("password_hash") or d.get("hashed_password"),
            "display_name": d.get("display_name", ""),
            "phone": d.get("phone"),
            "photo_url": d.get("photo_url"),
            "ratings_avg": d.get("ratings_avg", 0.0),
            "ratings_count": d.get("ratings_count", 0),
            "wallet_balance_cents": d.get("wallet_balance_cents", 0),
            "points": d.get("points", 0),
            "level": d.get("level", "Graine"),
            "profile_theme_color": d.get("profile_theme_color"),
            "stripe_account_id": d.get("stripe_account_id"),
            "stripe_customer_id": d.get("stripe_customer_id"),
            "is_partner": d.get("is_partner", False),
            "services": d.get("services", []),
            "street": d.get("street"),
            "city": d.get("city"),
            "postcode": d.get("postcode"),
            "citycode": d.get("citycode"),
            "context": d.get("context"),
            "lat": loc.get("lat") or d.get("lat"),
            "lng": loc.get("lng") or d.get("lng"),
            "co2_saved": d.get("co2_saved", 0.0),
            "trust_level": d.get("trust_level", "NEW"),
            "risk_score": d.get("risk_score", 0.0),
            "verified_email": d.get("verified_email", False),
            "verified_phone": d.get("verified_phone", False),
            "two_factor_enabled": d.get("two_factor_enabled", False),
            "is_association": d.get("is_association", False),
            "association_name": d.get("association_name"),
            "association_verified": d.get("association_verified", False),
            "free_boosts_available": d.get("free_boosts_available", 0),
            "last_boost_reset": to_ts(d.get("last_boost_reset")),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
        })
    upsert("users", rows)


# ─── STORES ───────────────────────────────────────────────────────────────────
async def migrate_stores():
    print("\n→ stores")
    docs = await mongo.stores.find({}).to_list(None)
    rows = []
    for d in docs:
        old_id = str(d["_id"])
        new = new_id()
        id_map["stores"][old_id] = new
        loc = d.get("location") or {}
        rows.append({
            "id": new,
            "owner_id": map_id("users", d.get("owner_id")),
            "name": d.get("name", ""),
            "address": d.get("address"),
            "lat": loc.get("lat") or d.get("lat"),
            "lng": loc.get("lng") or d.get("lng"),
            "category": d.get("category"),
            "logo_url": d.get("logo_url") or d.get("logo"),
            "hours": d.get("hours"),
            "description": d.get("description"),
            "website": d.get("website"),
            "services": d.get("services", []),
            "followers_count": d.get("followers_count", 0),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
        })
    upsert("stores", rows)


# ─── ITEMS ────────────────────────────────────────────────────────────────────
async def migrate_items():
    print("\n→ items")
    docs = await mongo.items.find({}).to_list(None)
    rows = []
    for d in docs:
        old_id = str(d["_id"])
        new = new_id()
        id_map["items"][old_id] = new
        loc = d.get("location") or {}
        rows.append({
            "id": new,
            "store_id": map_id("stores", d.get("store_id")),
            "owner_id": map_id("users", d.get("owner_id")) or new_id(),
            "type": d.get("type", "donation"),
            "food_type": d.get("food_type"),
            "title": d.get("title", ""),
            "description": d.get("description"),
            "photos": d.get("photos", []),
            "category": d.get("category", "Autre"),
            "condition": d.get("condition"),
            "tags": d.get("tags", []),
            "lat": loc.get("lat") or d.get("lat"),
            "lng": loc.get("lng") or d.get("lng"),
            "radius_km": d.get("radius_km", 5.0),
            "urgency_hours": d.get("urgency_hours"),
            "price_cents": d.get("price_cents"),
            "price_per_day_cents": d.get("price_per_day_cents"),
            "deposit_cents": d.get("deposit_cents"),
            "max_duration_days": d.get("max_duration_days"),
            "allow_offers": d.get("allow_offers", False),
            "status": d.get("status", "active"),
            "expires_at": to_ts(d.get("expires_at")),
            "co2_estimate": d.get("co2_estimate"),
            "boosted_until": to_ts(d.get("boosted_until")),
            "views_count": d.get("views_count", 0),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
        })
    upsert("items", rows)


# ─── OFFERS ───────────────────────────────────────────────────────────────────
async def migrate_offers():
    print("\n→ offers")
    docs = await mongo.offers.find({}).to_list(None)
    rows = []
    for d in docs:
        old_id = str(d["_id"])
        new = new_id()
        id_map["offers"][old_id] = new
        item_id = map_id("items", d.get("item_id"))
        buyer_id = map_id("users", d.get("buyer_id"))
        if not item_id or not buyer_id:
            continue
        rows.append({
            "id": new,
            "item_id": item_id,
            "buyer_id": buyer_id,
            "amount_cents": d.get("amount_cents", 0),
            "days": d.get("days", 1),
            "message": d.get("message"),
            "status": d.get("status", "pending"),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
            "accepted_at": to_ts(d.get("accepted_at")),
            "expires_at": to_ts(d.get("expires_at")),
        })
    upsert("offers", rows)


# ─── ORDERS ───────────────────────────────────────────────────────────────────
async def migrate_orders():
    print("\n→ orders")
    docs = await mongo.orders.find({}).to_list(None)
    rows = []
    for d in docs:
        old_id = str(d["_id"])
        new = new_id()
        id_map["orders"][old_id] = new
        item_id = map_id("items", d.get("item_id"))
        buyer_id = map_id("users", d.get("buyer_id"))
        seller_id = map_id("users", d.get("seller_id"))
        if not item_id or not buyer_id or not seller_id:
            continue
        rows.append({
            "id": new,
            "item_id": item_id,
            "buyer_id": buyer_id,
            "seller_id": seller_id,
            "amount_cents": d.get("amount_cents", 0),
            "platform_fee_cents": d.get("platform_fee_cents", 0),
            "payout_cents": d.get("payout_cents", 0),
            "payment_status": d.get("payment_status", "initiated"),
            "payment_intent_id": d.get("payment_intent_id"),
            "handoff": d.get("handoff", {"mode": "local"}),
            "dispute_status": d.get("dispute_status"),
            "handover_code_hash": d.get("handover_code_hash"),
            "handover_status": d.get("handover_status", "pending"),
            "meeting_location": d.get("meeting_location"),
            "meeting_time": to_ts(d.get("meeting_time")),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
        })
    upsert("orders", rows)


# ─── RENTAL BOOKINGS ──────────────────────────────────────────────────────────
async def migrate_rental_bookings():
    print("\n→ rental_bookings")
    docs = await mongo.rentals.find({}).to_list(None)
    rows = []
    for d in docs:
        old_id = str(d["_id"])
        new = new_id()
        id_map["rental_bookings"][old_id] = new
        item_id = map_id("items", d.get("item_id"))
        renter_id = map_id("users", d.get("renter_id"))
        owner_id = map_id("users", d.get("owner_id"))
        if not item_id or not renter_id or not owner_id:
            continue
        rows.append({
            "id": new,
            "item_id": item_id,
            "renter_id": renter_id,
            "owner_id": owner_id,
            "start_date": to_ts(d.get("start_date")),
            "end_date": to_ts(d.get("end_date")),
            "duration_days": d.get("duration_days", 1),
            "price_per_day_cents": d.get("price_per_day_cents", 0),
            "total_price_cents": d.get("total_price_cents", 0),
            "deposit_cents": d.get("deposit_cents", 0),
            "platform_fee_cents": d.get("platform_fee_cents", 0),
            "payout_cents": d.get("payout_cents", 0),
            "status": d.get("status", "pending"),
            "payment_status": d.get("payment_status", "pending"),
            "payment_intent_id": d.get("payment_intent_id"),
            "deposit_intent_id": d.get("deposit_intent_id"),
            "pickup_code": d.get("pickup_code"),
            "return_code": d.get("return_code"),
            "pickup_confirmed_at": to_ts(d.get("pickup_confirmed_at")),
            "return_confirmed_at": to_ts(d.get("return_confirmed_at")),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
        })
    upsert("rental_bookings", rows)


# ─── RATINGS ──────────────────────────────────────────────────────────────────
async def migrate_ratings():
    print("\n→ ratings")
    docs = await mongo.ratings.find({}).to_list(None)
    rows = []
    for d in docs:
        reviewer_id = map_id("users", d.get("reviewer_id"))
        reviewed_id = map_id("users", d.get("reviewed_id"))
        if not reviewer_id or not reviewed_id:
            continue
        rows.append({
            "id": new_id(),
            "order_id": map_id("orders", d.get("order_id")),
            "reviewer_id": reviewer_id,
            "reviewed_id": reviewed_id,
            "rating": d.get("rating", 5),
            "comment": d.get("comment"),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
        })
    upsert("ratings", rows)


# ─── MESSAGES ─────────────────────────────────────────────────────────────────
async def migrate_messages():
    print("\n→ messages")
    docs = await mongo.messages.find({}).to_list(None)
    rows = []
    for d in docs:
        from_id = map_id("users", d.get("from_id"))
        to_id = map_id("users", d.get("to_id"))
        if not from_id or not to_id:
            continue
        rows.append({
            "id": new_id(),
            "item_id": map_id("items", d.get("item_id")),
            "from_id": from_id,
            "to_id": to_id,
            "text": d.get("text", ""),
            "image_url": d.get("image_url"),
            "read": d.get("read", False),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
        })
    upsert("messages", rows)


# ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
async def migrate_transactions():
    print("\n→ transactions")
    docs = await mongo.transactions.find({}).to_list(None)
    rows = []
    for d in docs:
        user_id = map_id("users", d.get("user_id"))
        if not user_id:
            continue
        rows.append({
            "id": new_id(),
            "user_id": user_id,
            "amount_cents": d.get("amount_cents", 0),
            "type": d.get("type", "sale"),
            "status": d.get("status", "completed"),
            "description": d.get("description", ""),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
        })
    upsert("transactions", rows)


# ─── DISPUTES ─────────────────────────────────────────────────────────────────
async def migrate_disputes():
    print("\n→ disputes")
    docs = await mongo.disputes.find({}).to_list(None)
    rows = []
    for d in docs:
        old_id = str(d["_id"])
        new = new_id()
        id_map["disputes"][old_id] = new
        complainant_id = map_id("users", d.get("complainant_id"))
        respondent_id = map_id("users", d.get("respondent_id"))
        if not complainant_id or not respondent_id:
            continue
        rows.append({
            "id": new,
            "order_id": map_id("orders", d.get("order_id")),
            "rental_id": map_id("rental_bookings", d.get("rental_id")),
            "complainant_id": complainant_id,
            "respondent_id": respondent_id,
            "reason": d.get("reason", "other"),
            "description": d.get("description", ""),
            "evidence_photos": d.get("evidence_photos", []),
            "status": d.get("status", "open"),
            "resolution_notes": d.get("resolution_notes"),
            "refund_amount_cents": d.get("refund_amount_cents"),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
            "resolved_at": to_ts(d.get("resolved_at")),
        })
    upsert("disputes", rows)


# ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
async def migrate_notifications():
    print("\n→ notifications")
    docs = await mongo.notifications.find({}).to_list(None)
    rows = []
    for d in docs:
        user_id = map_id("users", d.get("user_id"))
        if not user_id:
            continue
        rows.append({
            "id": new_id(),
            "user_id": user_id,
            "type": d.get("type", "system"),
            "title": d.get("title", ""),
            "message": d.get("message", ""),
            "read": d.get("read", False),
            "data": d.get("data"),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
        })
    upsert("notifications", rows)


# ─── DEALS ────────────────────────────────────────────────────────────────────
async def migrate_deals():
    print("\n→ deals")
    docs = await mongo.deals.find({}).to_list(None)
    rows = []
    for d in docs:
        old_id = str(d["_id"])
        new = new_id()
        id_map["deals"][old_id] = new
        store_id = map_id("stores", d.get("store_id"))
        if not store_id:
            continue
        rows.append({
            "id": new,
            "store_id": store_id,
            "title": d.get("title", ""),
            "description": d.get("description", ""),
            "original_price": d.get("original_price", 0),
            "deal_price": d.get("deal_price", 0),
            "discount_value": d.get("discount_value", 0),
            "discount_type": d.get("discount_type", "percentage"),
            "category": d.get("category", "Other"),
            "status": d.get("status", "active"),
            "expires_at": to_ts(d.get("expires_at")) or datetime.utcnow().isoformat(),
            "allow_suspension": d.get("allow_suspension", False),
            "suspended_quantity": d.get("suspended_quantity", 0),
            "suspended_available": d.get("suspended_available", 0),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
        })
    upsert("deals", rows)


# ─── SAVED SEARCHES ───────────────────────────────────────────────────────────
async def migrate_saved_searches():
    print("\n→ saved_searches")
    docs = await mongo.saved_searches.find({}).to_list(None)
    rows = []
    for d in docs:
        user_id = map_id("users", d.get("user_id"))
        if not user_id:
            continue
        rows.append({
            "id": new_id(),
            "user_id": user_id,
            "query": d.get("query"),
            "category": d.get("category"),
            "filters": d.get("filters"),
            "alert_enabled": d.get("alert_enabled", True),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
        })
    upsert("saved_searches", rows)


# ─── GEO ZONES ────────────────────────────────────────────────────────────────
async def migrate_geo_zones():
    print("\n→ geo_zones")
    docs = await mongo.zones.find({}).to_list(None)
    rows = []
    for d in docs:
        old_id = str(d["_id"])
        new = new_id()
        id_map["geo_zones"][old_id] = new
        rows.append({
            "id": new,
            "name": d.get("name", ""),
            "display_name": d.get("displayName") or d.get("display_name", ""),
            "type": d.get("type", "agglomeration"),
            "is_active": d.get("isActive", True),
            "communes": d.get("communes", []),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
            "updated_at": to_ts(d.get("updated_at")) or datetime.utcnow().isoformat(),
        })
    upsert("geo_zones", rows)


# ─── NEWSLETTER / WAITLIST / CONTACTS / PARTNERS ──────────────────────────────
async def migrate_misc():
    print("\n→ newsletter")
    docs = await mongo.newsletter.find({}).to_list(None)
    rows = [{"id": new_id(), "email": d.get("email",""), "source": d.get("source","landing_page"),
             "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat()} for d in docs if d.get("email")]
    upsert("newsletter", rows)

    print("\n→ waitlist")
    docs = await mongo.waitlist.find({}).to_list(None)
    rows = [{"id": new_id(), "email": d.get("email",""), "city": d.get("city"),
             "status": d.get("status","particulier"), "comment": d.get("comment"),
             "rgpd_consent": d.get("rgpd_consent", False),
             "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat()} for d in docs if d.get("email")]
    upsert("waitlist", rows)

    print("\n→ contacts")
    docs = await mongo.contacts.find({}).to_list(None)
    rows = [{"id": new_id(), "name": d.get("name",""), "email": d.get("email",""),
             "subject": d.get("subject"), "message": d.get("message",""),
             "rgpd_consent": d.get("rgpd_consent", False), "read": d.get("read", False),
             "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat()} for d in docs]
    upsert("contacts", rows)

    print("\n→ partners")
    docs = await mongo.partners.find({}).to_list(None)
    rows = [{"id": new_id(), "name": d.get("name",""), "business": d.get("business",""),
             "city": d.get("city"), "email": d.get("email",""), "phone": d.get("phone"),
             "message": d.get("message"), "rgpd_consent": d.get("rgpd_consent", False),
             "status": d.get("status","pending"),
             "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat()} for d in docs]
    upsert("partners", rows)

    print("\n→ sponsors")
    docs = await mongo.sponsors.find({}).to_list(None)
    rows = [{"id": new_id(), "name": d.get("name",""), "logo_url": d.get("logo_url",""),
             "message": d.get("message",""), "website": d.get("website"),
             "display_count": d.get("display_count",0), "active": d.get("active", True),
             "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat()} for d in docs]
    upsert("sponsors", rows)


# ─── BENEFICIARIES ────────────────────────────────────────────────────────────
async def migrate_beneficiaries():
    print("\n→ beneficiaries")
    docs = await mongo.beneficiaries.find({}).to_list(None)
    rows = []
    for d in docs:
        old_id = str(d["_id"])
        new = new_id()
        id_map["beneficiaries"][old_id] = new
        asso_id = map_id("users", d.get("association_id"))
        if not asso_id:
            continue
        rows.append({
            "id": new,
            "association_id": asso_id,
            "internal_ref": d.get("internal_ref", ""),
            "initials": d.get("initials", ""),
            "family_size": d.get("family_size", 1),
            "notes": d.get("notes"),
            "is_active": d.get("is_active", True),
            "total_baskets": d.get("total_baskets", 0),
            "last_distribution": to_ts(d.get("last_distribution")),
            "linked_user_id": map_id("users", d.get("linked_user_id")),
            "allow_self_service": d.get("allow_self_service", False),
            "self_service_quota": d.get("self_service_quota", 3),
            "created_at": to_ts(d.get("created_at")) or datetime.utcnow().isoformat(),
        })
    upsert("beneficiaries", rows)

    print("\n→ distributions")
    docs = await mongo.distributions.find({}).to_list(None)
    rows = []
    for d in docs:
        asso_id = map_id("users", d.get("association_id"))
        if not asso_id:
            continue
        rows.append({
            "id": new_id(),
            "association_id": asso_id,
            "beneficiary_id": map_id("beneficiaries", d.get("beneficiary_id")),
            "beneficiary_initials": d.get("beneficiary_initials"),
            "deal_id": map_id("deals", d.get("deal_id")),
            "store_name": d.get("store_name"),
            "quantity": d.get("quantity", 1),
            "notes": d.get("notes"),
            "distributed_at": to_ts(d.get("distributed_at")) or datetime.utcnow().isoformat(),
        })
    upsert("distributions", rows)


# ─── MAIN ─────────────────────────────────────────────────────────────────────
async def main():
    print("=== Migration MongoDB → Supabase ===")
    print(f"Source : {MONGO_DB} @ MongoDB Atlas")
    print(f"Cible  : {SUPABASE_URL}\n")

    # Ordre important : respecter les FK
    await migrate_users()
    await migrate_stores()
    await migrate_items()
    await migrate_offers()
    await migrate_orders()
    await migrate_rental_bookings()
    await migrate_ratings()
    await migrate_messages()
    await migrate_transactions()
    await migrate_disputes()
    await migrate_notifications()
    await migrate_deals()
    await migrate_saved_searches()
    await migrate_geo_zones()
    await migrate_misc()
    await migrate_beneficiaries()

    print("\n=== Migration terminée ✓ ===")
    mongo_client.close()


if __name__ == "__main__":
    asyncio.run(main())
