"""
MongoDB index definitions.
Called once at startup — Motor's create_index is idempotent.
"""
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
    # ── users ──────────────────────────────────────────────────────────────────
    await db.users.create_index([("id", ASCENDING)], unique=True)
    await db.users.create_index([("email", ASCENDING)], unique=True)

    # ── items ──────────────────────────────────────────────────────────────────
    await db.items.create_index([("id", ASCENDING)], unique=True)
    # my-items list: owner + status + recency
    await db.items.create_index([
        ("owner_id", ASCENDING),
        ("status", ASCENDING),
        ("created_at", DESCENDING),
    ])
    # public browse: status + type + category + price
    await db.items.create_index([
        ("status", ASCENDING),
        ("type", ASCENDING),
        ("category", ASCENDING),
        ("price_cents", ASCENDING),
    ])
    # sort by recency on browse
    await db.items.create_index([("status", ASCENDING), ("created_at", DESCENDING)])
    # full-text search on title + description
    await db.items.create_index([("title", TEXT), ("description", TEXT)])

    # ── orders ─────────────────────────────────────────────────────────────────
    await db.orders.create_index([("id", ASCENDING)], unique=True)
    await db.orders.create_index([("buyer_id", ASCENDING), ("created_at", DESCENDING)])
    await db.orders.create_index([("seller_id", ASCENDING), ("created_at", DESCENDING)])
    await db.orders.create_index([("status", ASCENDING), ("payment_status", ASCENDING)])
    # handoff code lookup (used at delivery)
    await db.orders.create_index([("handoff.code", ASCENDING)])
    # stripe webhook reconciliation
    await db.orders.create_index([("payment_intent_id", ASCENDING)])

    # ── offers ─────────────────────────────────────────────────────────────────
    await db.offers.create_index([("id", ASCENDING)], unique=True)
    await db.offers.create_index([("item_id", ASCENDING), ("created_at", DESCENDING)])
    await db.offers.create_index([("buyer_id", ASCENDING), ("status", ASCENDING)])
    # 24 h duplicate check
    await db.offers.create_index([("item_id", ASCENDING), ("buyer_id", ASCENDING), ("created_at", DESCENDING)])

    # ── rentals ────────────────────────────────────────────────────────────────
    await db.rentals.create_index([("id", ASCENDING)], unique=True)
    await db.rentals.create_index([("renter_id", ASCENDING), ("created_at", DESCENDING)])
    await db.rentals.create_index([("owner_id", ASCENDING), ("created_at", DESCENDING)])
    # availability check: item + status + dates
    await db.rentals.create_index([
        ("item_id", ASCENDING),
        ("status", ASCENDING),
        ("start_date", ASCENDING),
        ("end_date", ASCENDING),
    ])

    # ── disputes ───────────────────────────────────────────────────────────────
    await db.disputes.create_index([("id", ASCENDING)], unique=True)
    await db.disputes.create_index([("order_id", ASCENDING)])
    await db.disputes.create_index([("rental_id", ASCENDING)])
    await db.disputes.create_index([("respondent_id", ASCENDING), ("status", ASCENDING)])

    # ── messages ───────────────────────────────────────────────────────────────
    await db.messages.create_index([("id", ASCENDING)], unique=True)
    await db.messages.create_index([("item_id", ASCENDING), ("created_at", ASCENDING)])
    await db.messages.create_index([("from_id", ASCENDING), ("created_at", DESCENDING)])
    await db.messages.create_index([("to_id", ASCENDING), ("created_at", DESCENDING)])

    # ── notifications ──────────────────────────────────────────────────────────
    await db.notifications.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    await db.notifications.create_index([("user_id", ASCENDING), ("read", ASCENDING)])

    # ── ratings ────────────────────────────────────────────────────────────────
    await db.ratings.create_index([("reviewed_id", ASCENDING)])
    await db.ratings.create_index([("order_id", ASCENDING)], unique=True, sparse=True)

    # ── auth tokens (short-lived, auto-expire via TTL) ─────────────────────────
    await db.email_verifications.create_index([("email", ASCENDING), ("code", ASCENDING)])
    await db.email_verifications.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)
    await db.password_resets.create_index([("email", ASCENDING), ("code", ASCENDING)])
    await db.password_resets.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)

    # ── saved searches ─────────────────────────────────────────────────────────
    await db.saved_searches.create_index([("user_id", ASCENDING)])

    # ── zones ──────────────────────────────────────────────────────────────────
    await db.zones.create_index([("id", ASCENDING)], unique=True)
    await db.zones.create_index([("active", ASCENDING)])

    # ── pro sellers ────────────────────────────────────────────────────────────
    await db.pro_sellers.create_index([("id", ASCENDING)], unique=True)
    await db.pro_sellers.create_index([("user_id", ASCENDING)], unique=True)
    await db.pro_sellers.create_index([("siren", ASCENDING)], sparse=True)
    await db.pro_sellers.create_index([("status", ASCENDING)])

    # ── stores ─────────────────────────────────────────────────────────────────
    await db.stores.create_index([("id", ASCENDING)], unique=True)
    await db.stores.create_index([("owner_id", ASCENDING)])
    await db.stores.create_index([("slug", ASCENDING)], unique=True, sparse=True)

    # ── sponsors ───────────────────────────────────────────────────────────────
    await db.sponsors.create_index([("active", ASCENDING), ("display_count", ASCENDING)])
