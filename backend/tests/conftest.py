"""
Test fixtures. Module-level DB patch runs before route modules are imported,
so every `from database import db` in a route file gets the mock.
"""
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

# ── 1. Patch DB before any route module is imported ───────────────────────────
import database  # noqa: E402 – must come before server import

_mock_client = AsyncMongoMockClient()
_mock_db = _mock_client["test_yondly"]
database.db = _mock_db
database.client = _mock_client

import auth_utils  # noqa: E402

auth_utils.db = _mock_db

# ── 2. Stub out external I/O before app import ────────────────────────────────
_stripe_intent = MagicMock(id="pi_test_123", client_secret="pi_test_123_secret_test")
_stripe_account = MagicMock(
    id="acct_test",
    charges_enabled=True,
    payouts_enabled=True,
    details_submitted=True,
)
_stripe_link = MagicMock(url="https://connect.stripe.com/onboard/test")

_PATCHES = [
    patch("push_service.send_push_notification", new=AsyncMock(return_value=None)),
    patch("stripe.PaymentIntent.create", return_value=_stripe_intent),
    patch("stripe.PaymentIntent.retrieve", return_value=MagicMock(customer="cus_test", payment_method="pm_test")),
    patch("stripe.Account.create", return_value=_stripe_account),
    patch("stripe.Account.retrieve", return_value=_stripe_account),
    patch("stripe.AccountLink.create", return_value=_stripe_link),
    # Zone coverage: always pass
    patch("zone_utils.check_zone_coverage", new=AsyncMock(return_value=True)),
]

for _p in _PATCHES:
    _p.start()

# ── 3. Import app (routes bind to patched db) ─────────────────────────────────
from server import app  # noqa: E402
from auth_utils import create_access_token, hash_password  # noqa: E402


# ── 4. Fixtures ───────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(autouse=True)
async def reset_db():
    """Wipe all collections between tests."""
    yield
    for name in await _mock_db.list_collection_names():
        await _mock_db[name].delete_many({})


@pytest_asyncio.fixture
async def user(request):
    """A regular verified user."""
    marker = request.node.get_closest_marker("user_data")
    overrides = marker.args[0] if marker else {}
    uid = str(uuid.uuid4())
    doc = {
        "id": uid,
        "email": f"user_{uid[:8]}@test.local",
        "password_hash": hash_password("Test1234!"),
        "display_name": "Test User",
        "level": "Graine",
        "wallet_balance_cents": 10000,
        "email_verified": True,
        "is_verified": True,
        "zone": "test_zone",
        "co2_saved": 0,
        "created_at": datetime.utcnow(),
        **overrides,
    }
    await _mock_db.users.insert_one(doc)
    return doc


@pytest_asyncio.fixture
async def other_user():
    """A second distinct user (seller / owner in tests)."""
    uid = str(uuid.uuid4())
    doc = {
        "id": uid,
        "email": f"other_{uid[:8]}@test.local",
        "password_hash": hash_password("Test1234!"),
        "display_name": "Other User",
        "level": "Graine",
        "wallet_balance_cents": 0,
        "email_verified": True,
        "is_verified": True,
        "zone": "test_zone",
        "co2_saved": 0,
        "created_at": datetime.utcnow(),
    }
    await _mock_db.users.insert_one(doc)
    return doc


@pytest.fixture
def token(user):
    return create_access_token({"sub": user["id"]})


@pytest.fixture
def other_token(other_user):
    return create_access_token({"sub": other_user["id"]})


@pytest_asyncio.fixture
async def client(token):
    """Authenticated HTTP client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def other_client(other_token):
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {other_token}"},
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def anon_client():
    """Unauthenticated HTTP client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def active_item(other_user):
    """An active sell item owned by other_user."""
    item = {
        "id": str(uuid.uuid4()),
        "owner_id": other_user["id"],
        "title": "Test Item",
        "description": "A test item",
        "price_cents": 1500,
        "category": "Électronique",
        "type": "sell",
        "status": "active",
        "photos": [],
        "city": "Paris",
        "postcode": "75001",
        "created_at": datetime.utcnow(),
    }
    await _mock_db.items.insert_one(item)
    return item


@pytest_asyncio.fixture
async def active_rent_item(other_user):
    """An active rent item owned by other_user."""
    item = {
        "id": str(uuid.uuid4()),
        "owner_id": other_user["id"],
        "title": "Rent Item",
        "description": "A rentable item",
        "price_per_day_cents": 500,
        "deposit_cents": 2000,
        "category": "Équipement",
        "type": "rent",
        "status": "active",
        "photos": [],
        "city": "Paris",
        "postcode": "75001",
        "created_at": datetime.utcnow(),
    }
    await _mock_db.items.insert_one(item)
    return item
