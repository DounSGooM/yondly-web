"""
MongoDB index definitions.
Called once at startup — Motor's create_index is idempotent.
All indexes created concurrently via asyncio.gather for fast startup.
"""
import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, TEXT

logger = logging.getLogger(__name__)


async def create_indexes(db: AsyncIOMotorDatabase) -> None:
    try:
        await _create_indexes(db)
        logger.info("MongoDB indexes ensured")
    except Exception as exc:
        logger.warning("Failed to create MongoDB indexes: %s", exc)


async def _create_indexes(db: AsyncIOMotorDatabase) -> None:
    await asyncio.gather(
        # ── users ──────────────────────────────────────────────────────────────
        db.users.create_index([("id", ASCENDING)], unique=True),
        db.users.create_index([("email", ASCENDING)], unique=True),

        # ── items ──────────────────────────────────────────────────────────────
        db.items.create_index([("id", ASCENDING)], unique=True),
        # my-items list: owner + status + recency
        db.items.create_index([
            ("owner_id", ASCENDING),
            ("status", ASCENDING),
            ("created_at", DESCENDING),
        ]),
        # public browse: status + type + category + price
        db.items.create_index([
            ("status", ASCENDING),
            ("type", ASCENDING),
            ("category", ASCENDING),
            ("price_cents", ASCENDING),
        ]),
        # browse sorted by recency without type/category filter
        db.items.create_index([("status", ASCENDING), ("created_at", DESCENDING)]),
        # full-text search on title + description
        db.items.create_index([("title", TEXT), ("description", TEXT)]),

        # ── orders ─────────────────────────────────────────────────────────────
        db.orders.create_index([("id", ASCENDING)], unique=True),
        db.orders.create_index([("buyer_id", ASCENDING), ("created_at", DESCENDING)]),
        db.orders.create_index([("seller_id", ASCENDING), ("created_at", DESCENDING)]),
        db.orders.create_index([("status", ASCENDING), ("payment_status", ASCENDING)]),
        db.orders.create_index([("handoff.code", ASCENDING)]),
        db.orders.create_index([("payment_intent_id", ASCENDING)]),

        # ── offers ─────────────────────────────────────────────────────────────
        db.offers.create_index([("id", ASCENDING)], unique=True),
        db.offers.create_index([("item_id", ASCENDING), ("created_at", DESCENDING)]),
        db.offers.create_index([("buyer_id", ASCENDING), ("status", ASCENDING)]),
        # 24 h duplicate check
        db.offers.create_index([
            ("item_id", ASCENDING),
            ("buyer_id", ASCENDING),
            ("created_at", DESCENDING),
        ]),

        # ── rentals ────────────────────────────────────────────────────────────
        db.rentals.create_index([("id", ASCENDING)], unique=True),
        db.rentals.create_index([("renter_id", ASCENDING), ("created_at", DESCENDING)]),
        db.rentals.create_index([("owner_id", ASCENDING), ("created_at", DESCENDING)]),
        # availability check: item + status + dates
        db.rentals.create_index([
            ("item_id", ASCENDING),
            ("status", ASCENDING),
            ("start_date", ASCENDING),
            ("end_date", ASCENDING),
        ]),

        # ── disputes ───────────────────────────────────────────────────────────
        db.disputes.create_index([("id", ASCENDING)], unique=True),
        db.disputes.create_index([("order_id", ASCENDING)]),
        db.disputes.create_index([("rental_id", ASCENDING)]),
        db.disputes.create_index([("respondent_id", ASCENDING), ("status", ASCENDING)]),

        # ── messages ───────────────────────────────────────────────────────────
        db.messages.create_index([("id", ASCENDING)], unique=True),
        db.messages.create_index([("item_id", ASCENDING), ("created_at", ASCENDING)]),
        db.messages.create_index([("from_id", ASCENDING), ("created_at", DESCENDING)]),
        db.messages.create_index([("to_id", ASCENDING), ("created_at", DESCENDING)]),

        # ── notifications ──────────────────────────────────────────────────────
        db.notifications.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)]),
        db.notifications.create_index([("user_id", ASCENDING), ("read", ASCENDING)]),

        # ── ratings ────────────────────────────────────────────────────────────
        db.ratings.create_index([("reviewed_id", ASCENDING)]),
        db.ratings.create_index([("order_id", ASCENDING)], unique=True, sparse=True),

        # ── auth tokens (TTL: MongoDB auto-deletes expired documents) ───────────
        db.email_verifications.create_index([("email", ASCENDING), ("code", ASCENDING)]),
        db.email_verifications.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0),
        db.password_resets.create_index([("email", ASCENDING), ("code", ASCENDING)]),
        db.password_resets.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0),

        # ── saved searches ─────────────────────────────────────────────────────
        db.saved_searches.create_index([("user_id", ASCENDING)]),

        # ── zones ──────────────────────────────────────────────────────────────
        db.zones.create_index([("id", ASCENDING)], unique=True),
        db.zones.create_index([("active", ASCENDING)]),

        # ── pro sellers ────────────────────────────────────────────────────────
        db.pro_sellers.create_index([("id", ASCENDING)], unique=True),
        db.pro_sellers.create_index([("user_id", ASCENDING)], unique=True),
        db.pro_sellers.create_index([("siren", ASCENDING)], sparse=True),
        db.pro_sellers.create_index([("status", ASCENDING)]),

        # ── stores ─────────────────────────────────────────────────────────────
        db.stores.create_index([("id", ASCENDING)], unique=True),
        db.stores.create_index([("owner_id", ASCENDING)]),
        db.stores.create_index([("slug", ASCENDING)], unique=True, sparse=True),

        # ── sponsors ───────────────────────────────────────────────────────────
        db.sponsors.create_index([("active", ASCENDING), ("display_count", ASCENDING)]),

        # ── tracking events (analytics) ────────────────────────────────────────
        db.tracking_events.create_index([("territory_code", ASCENDING), ("territory_type", ASCENDING)]),
        db.tracking_events.create_index([("territory_code", ASCENDING), ("created_at", DESCENDING)]),
        db.tracking_events.create_index([("event_name", ASCENDING)]),
        db.tracking_events.create_index([("created_at", DESCENDING)]),
    )
