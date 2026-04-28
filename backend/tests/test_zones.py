import pytest
import uuid
from datetime import datetime


# ── Public endpoints ──────────────────────────────────────────────────────────

async def test_get_all_zones_empty(anon_client):
    resp = await anon_client.get("/api/zones")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_get_active_zones_empty(anon_client):
    resp = await anon_client.get("/api/zones/active")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_get_zones_with_data(anon_client):
    from tests.conftest import _mock_db

    await _mock_db.zones.insert_one({
        "name": "test_zone",
        "displayName": "Test Zone",
        "type": "agglomeration",
        "isActive": True,
        "communes": [{"name": "Paris", "code": "75056", "isActive": True}],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    resp = await anon_client.get("/api/zones")
    assert resp.status_code == 200
    zones = resp.json()
    assert len(zones) == 1
    assert zones[0]["name"] == "test_zone"


async def test_get_active_zones_filters_inactive_communes(anon_client):
    from tests.conftest import _mock_db

    await _mock_db.zones.insert_one({
        "name": "zone2",
        "displayName": "Zone 2",
        "type": "agglomeration",
        "isActive": True,
        "communes": [
            {"name": "Paris", "code": "75056", "isActive": True},
            {"name": "Nowhere", "code": "99999", "isActive": False},
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    resp = await anon_client.get("/api/zones/active")
    assert resp.status_code == 200
    zones = resp.json()
    assert len(zones) == 1
    assert len(zones[0]["communes"]) == 1
    assert zones[0]["communes"][0]["name"] == "Paris"


# ── Admin zone creation ───────────────────────────────────────────────────────

async def test_create_zone_admin(client):
    resp = await client.post("/api/admin/zones", json={
        "name": "new_zone",
        "displayName": "New Zone",
        "type": "agglomeration",
        "isActive": True,
        "communes": [{"name": "Lyon", "code": "69123", "isActive": True, "population": 500000, "postalCodes": ["69001"]}],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "new_zone"
    assert "id" in data


async def test_delete_zone(client):
    create = await client.post("/api/admin/zones", json={
        "name": "to_delete",
        "displayName": "To Delete",
        "type": "agglomeration",
        "isActive": False,
        "communes": [],
    })
    zone_id = create.json()["id"]

    resp = await client.delete(f"/api/admin/zones/{zone_id}")
    assert resp.status_code == 200

    # Confirm it's gone
    zones = (await client.get("/api/zones")).json()
    assert all(z["id"] != zone_id for z in zones)


async def test_toggle_zone(client):
    create = await client.post("/api/admin/zones", json={
        "name": "toggle_zone",
        "displayName": "Toggle Zone",
        "type": "agglomeration",
        "isActive": True,
        "communes": [],
    })
    zone_id = create.json()["id"]

    resp = await client.put(f"/api/admin/zones/{zone_id}/toggle", json={"isActive": False})
    assert resp.status_code == 200
    assert resp.json()["isActive"] is False


# ── Notifications ─────────────────────────────────────────────────────────────

async def test_get_notifications_empty(client):
    resp = await client.get("/api/notifications/user")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_unread_count_zero(client):
    resp = await client.get("/api/notifications/unread-count")
    assert resp.status_code == 200
    assert resp.json()["count"] == 0
