import pytest


# ── Registration ──────────────────────────────────────────────────────────────

async def test_register_creates_user(anon_client):
    resp = await anon_client.post("/api/auth/register", json={
        "email": "new@test.local",
        "password": "Secure123!",
        "display_name": "New User",
        "postcode": "75001",
        "citycode": "75056",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data or "message" in data  # verify-email flow returns message


async def test_register_duplicate_email(anon_client, user):
    resp = await anon_client.post("/api/auth/register", json={
        "email": user["email"],
        "password": "Secure123!",
        "display_name": "Dup",
        "postcode": "75001",
        "citycode": "75056",
    })
    assert resp.status_code == 400


# ── Login ─────────────────────────────────────────────────────────────────────

async def test_login_valid_credentials(anon_client, user):
    resp = await anon_client.post("/api/auth/login", json={
        "email": user["email"],
        "password": "Test1234!",
    })
    assert resp.status_code == 200
    assert "token" in resp.json()


async def test_login_wrong_password(anon_client, user):
    resp = await anon_client.post("/api/auth/login", json={
        "email": user["email"],
        "password": "WrongPass999!",
    })
    assert resp.status_code == 401


async def test_login_unknown_email(anon_client):
    resp = await anon_client.post("/api/auth/login", json={
        "email": "nobody@test.local",
        "password": "Test1234!",
    })
    assert resp.status_code == 401


# ── /me ───────────────────────────────────────────────────────────────────────

async def test_get_me_authenticated(client, user):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == user["email"]
    assert "password_hash" not in data


async def test_get_me_unauthenticated(anon_client):
    resp = await anon_client.get("/api/auth/me")
    assert resp.status_code == 403


# ── Profile update ────────────────────────────────────────────────────────────

async def test_update_profile(client):
    resp = await client.put("/api/auth/profile", json={"display_name": "Updated Name"})
    assert resp.status_code == 200


# ── /users/{user_id} public ───────────────────────────────────────────────────

async def test_get_public_user(anon_client, user):
    resp = await anon_client.get(f"/api/users/{user['id']}")
    assert resp.status_code == 200
    data = resp.json()
    assert "password_hash" not in data


async def test_get_unknown_user_returns_404(anon_client):
    resp = await anon_client.get("/api/users/nonexistent-id")
    assert resp.status_code == 404
