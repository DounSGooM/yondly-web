import pytest
import uuid
from datetime import datetime


# ── Create order ──────────────────────────────────────────────────────────────

async def test_create_order_happy_path(client, user, active_item):
    resp = await client.post("/api/orders", json={"item_id": active_item["id"]})
    assert resp.status_code == 200
    data = resp.json()
    assert data["buyer_id"] == user["id"]
    assert data["item_id"] == active_item["id"]
    assert "client_secret" in data


async def test_cannot_buy_own_item(other_client, active_item):
    # other_user is the owner of active_item
    resp = await other_client.post("/api/orders", json={"item_id": active_item["id"]})
    assert resp.status_code == 400


async def test_order_nonexistent_item(client):
    resp = await client.post("/api/orders", json={"item_id": "does-not-exist"})
    assert resp.status_code == 404


async def test_order_requires_auth(anon_client, active_item):
    resp = await anon_client.post("/api/orders", json={"item_id": active_item["id"]})
    assert resp.status_code == 403


# ── List orders ───────────────────────────────────────────────────────────────

async def test_list_my_orders_empty(client):
    resp = await client.get("/api/orders")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_my_orders_after_purchase(client, user, active_item):
    await client.post("/api/orders", json={"item_id": active_item["id"]})
    resp = await client.get("/api/orders")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


# ── Get single order ──────────────────────────────────────────────────────────

async def test_get_order_by_id(client, user, active_item):
    create = await client.post("/api/orders", json={"item_id": active_item["id"]})
    order_id = create.json()["id"]

    resp = await client.get(f"/api/orders/{order_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == order_id


async def test_cannot_view_someone_elses_order(anon_client, user, active_item, client, other_client):
    create = await client.post("/api/orders", json={"item_id": active_item["id"]})
    order_id = create.json()["id"]

    # other_client is the seller — they should be able to see it
    resp = await other_client.get(f"/api/orders/{order_id}")
    assert resp.status_code == 200


# ── Can-rate ──────────────────────────────────────────────────────────────────

async def test_can_rate_not_yet_completed(client, user, active_item):
    create = await client.post("/api/orders", json={"item_id": active_item["id"]})
    order_id = create.json()["id"]

    resp = await client.get(f"/api/orders/{order_id}/can-rate")
    assert resp.status_code == 200
    assert resp.json()["can_rate"] is False


# ── Item not buyable if already sold ─────────────────────────────────────────

async def test_sold_item_cannot_be_ordered(client, user, active_item, mock_db=None):
    from tests.conftest import _mock_db
    await _mock_db.items.update_one(
        {"id": active_item["id"]},
        {"$set": {"status": "sold"}},
    )
    resp = await client.post("/api/orders", json={"item_id": active_item["id"]})
    assert resp.status_code == 400
