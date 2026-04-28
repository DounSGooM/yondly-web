import pytest
import uuid
from datetime import datetime, timedelta


# ── Create offer ──────────────────────────────────────────────────────────────

async def test_create_offer(client, user, active_item):
    resp = await client.post("/api/offers", json={
        "item_id": active_item["id"],
        "amount_cents": 1200,
        "message": "Would you accept?",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["buyer_id"] == user["id"]
    assert data["status"] == "pending"
    assert data["amount_cents"] == 1200


async def test_cannot_offer_on_own_item(other_client, active_item):
    resp = await other_client.post("/api/offers", json={
        "item_id": active_item["id"],
        "amount_cents": 1000,
    })
    assert resp.status_code == 400


async def test_offer_requires_auth(anon_client, active_item):
    resp = await anon_client.post("/api/offers", json={
        "item_id": active_item["id"],
        "amount_cents": 1000,
    })
    assert resp.status_code == 403


async def test_duplicate_offer_within_24h(client, active_item):
    await client.post("/api/offers", json={"item_id": active_item["id"], "amount_cents": 1000})
    # Second offer on same item within 24h should be rejected
    resp = await client.post("/api/offers", json={"item_id": active_item["id"], "amount_cents": 900})
    assert resp.status_code == 429


# ── List offers ───────────────────────────────────────────────────────────────

async def test_get_offers_for_item(anon_client, client, active_item):
    await client.post("/api/offers", json={"item_id": active_item["id"], "amount_cents": 1000})
    resp = await anon_client.get(f"/api/offers/item/{active_item['id']}")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


# ── Accept / Decline ──────────────────────────────────────────────────────────

async def test_owner_can_decline_offer(other_client, client, active_item):
    create = await client.post("/api/offers", json={
        "item_id": active_item["id"],
        "amount_cents": 1000,
    })
    offer_id = create.json()["id"]

    resp = await other_client.put(f"/api/offers/{offer_id}/decline")
    assert resp.status_code == 200
    assert resp.json()["status"] == "declined"


async def test_owner_can_accept_offer(other_client, client, active_item):
    create = await client.post("/api/offers", json={
        "item_id": active_item["id"],
        "amount_cents": 1000,
    })
    offer_id = create.json()["id"]

    resp = await other_client.put(f"/api/offers/{offer_id}/accept")
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"


async def test_buyer_cannot_decline_offer(client, active_item):
    create = await client.post("/api/offers", json={
        "item_id": active_item["id"],
        "amount_cents": 1000,
    })
    offer_id = create.json()["id"]

    # Buyer tries to decline their own offer — only owner can
    resp = await client.put(f"/api/offers/{offer_id}/decline")
    assert resp.status_code == 403


# ── Counter offer ─────────────────────────────────────────────────────────────

async def test_owner_can_counter(other_client, client, active_item):
    create = await client.post("/api/offers", json={
        "item_id": active_item["id"],
        "amount_cents": 800,
    })
    offer_id = create.json()["id"]

    resp = await other_client.put(f"/api/offers/{offer_id}/counter", json={
        "counter_amount_cents": 1100,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "countered"
    assert data["counter_offer_amount_cents"] == 1100
