import pytest


# ── Create ────────────────────────────────────────────────────────────────────

async def test_create_sell_item(client):
    resp = await client.post("/api/items", json={
        "title": "Old Bike",
        "description": "Good condition",
        "price_cents": 5000,
        "category": "Sport",
        "type": "sale",
        "photos": [],
        "city": "Paris",
        "postcode": "75001",
        "citycode": "75056",
        "latitude": 48.8566,
        "longitude": 2.3522,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Old Bike"
    assert data["status"] == "active"
    assert "id" in data


async def test_create_item_requires_auth(anon_client):
    resp = await anon_client.post("/api/items", json={
        "title": "Bike",
        "description": "x",
        "price_cents": 100,
        "category": "Sport",
        "type": "sale",
        "photos": [],
        "city": "Paris",
        "postcode": "75001",
        "citycode": "75056",
    })
    assert resp.status_code == 403


# ── List ──────────────────────────────────────────────────────────────────────

async def test_list_items_public(anon_client, active_item):
    resp = await anon_client.get("/api/items")
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    ids = [i["id"] for i in items]
    assert active_item["id"] in ids


async def test_list_my_items(client, user, active_item):
    # Create an item belonging to the authenticated user
    create = await client.post("/api/items", json={
        "title": "My Item",
        "description": "Mine",
        "price_cents": 1000,
        "category": "Maison",
        "type": "sale",
        "photos": [],
        "city": "Lyon",
        "postcode": "69001",
        "citycode": "69123",
    })
    assert create.status_code == 200

    resp = await client.get("/api/items/my-items")
    assert resp.status_code == 200
    titles = [i["title"] for i in resp.json()]
    assert "My Item" in titles
    # active_item belongs to other_user — should not appear
    assert active_item["title"] not in titles


# ── Get single ────────────────────────────────────────────────────────────────

async def test_get_item_by_id(anon_client, active_item):
    resp = await anon_client.get(f"/api/items/{active_item['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == active_item["id"]


async def test_get_nonexistent_item(anon_client):
    resp = await anon_client.get("/api/items/does-not-exist")
    assert resp.status_code == 404


# ── Update ────────────────────────────────────────────────────────────────────

async def test_update_own_item(client, user):
    create = await client.post("/api/items", json={
        "title": "Original",
        "description": "Original desc",
        "price_cents": 2000,
        "category": "Maison",
        "type": "sale",
        "photos": [],
        "city": "Paris",
        "postcode": "75001",
        "citycode": "75056",
    })
    assert create.status_code == 200
    item_id = create.json()["id"]

    # PUT requires the full ItemCreate payload
    resp = await client.put(f"/api/items/{item_id}", json={
        "title": "Updated Title",
        "description": "Updated desc",
        "price_cents": 1800,
        "category": "Maison",
        "type": "sale",
        "photos": [],
    })
    assert resp.status_code == 200


async def test_cannot_update_other_users_item(client, active_item):
    resp = await client.put(f"/api/items/{active_item['id']}", json={
        "title": "Hijacked",
        "description": "x",
        "price_cents": 100,
        "category": "Divers",
        "type": "sale",
        "photos": [],
    })
    assert resp.status_code == 403


# ── Delete ────────────────────────────────────────────────────────────────────

async def test_delete_own_item(client):
    create = await client.post("/api/items", json={
        "title": "To Delete",
        "description": "Bye",
        "price_cents": 100,
        "category": "Divers",
        "type": "sale",
        "photos": [],
        "city": "Paris",
        "postcode": "75001",
        "citycode": "75056",
    })
    item_id = create.json()["id"]
    resp = await client.delete(f"/api/items/{item_id}")
    assert resp.status_code == 200


async def test_cannot_delete_other_users_item(client, active_item):
    resp = await client.delete(f"/api/items/{active_item['id']}")
    assert resp.status_code == 403


# ── Status change ─────────────────────────────────────────────────────────────

async def test_toggle_item_status(client):
    create = await client.post("/api/items", json={
        "title": "Status Test",
        "description": "Toggle",
        "price_cents": 500,
        "category": "Divers",
        "type": "sale",
        "photos": [],
        "city": "Paris",
        "postcode": "75001",
        "citycode": "75056",
    })
    item_id = create.json()["id"]
    # status is a query param; valid values: active, reserved, completed, expired
    resp = await client.put(f"/api/items/{item_id}/status?status=completed")
    assert resp.status_code == 200
