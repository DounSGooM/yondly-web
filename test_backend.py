#!/usr/bin/env python3
"""
Script de test des endpoints critiques du backend Yondly.
Usage: python test_backend.py [BASE_URL]
"""
import sys
import json
import time
import uuid
import requests

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "https://yondly-web-production.up.railway.app/api"

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

passed = failed = 0

def ok(msg): global passed; passed += 1; print(f"{GREEN}✓{RESET} {msg}")
def fail(msg, detail=""): global failed; failed += 1; print(f"{RED}✗{RESET} {msg}" + (f"\n  → {detail}" if detail else ""))
def info(msg): print(f"\n{YELLOW}▶ {msg}{RESET}")

# ── 1. HEALTH ────────────────────────────────────────────────────────────────
info("Health check")
r = requests.get(BASE_URL.replace("/api", "/health"))
if r.status_code == 200 and r.json().get("status") == "ok":
    ok("GET /health → 200")
else:
    fail("GET /health", f"{r.status_code} {r.text[:100]}")

# ── 2. REGISTER ───────────────────────────────────────────────────────────────
info("Authentification")
test_email = f"test_{uuid.uuid4().hex[:8]}@yondly-test.com"
r = requests.post(f"{BASE_URL}/auth/register", json={
    "email": test_email,
    "password": "TestPass123!",
    "display_name": "Test User",
    "city": "Paris",
    "postcode": "75001"
})
if r.status_code in (200, 201):
    token = r.json().get("access_token")
    ok(f"POST /auth/register → {r.status_code}")
else:
    fail("POST /auth/register", f"{r.status_code} {r.text[:200]}")
    token = None

# ── 3. LOGIN ──────────────────────────────────────────────────────────────────
if token:
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": test_email, "password": "TestPass123!"})
    if r.status_code == 200 and r.json().get("access_token"):
        token = r.json()["access_token"]
        ok("POST /auth/login → 200")
    else:
        fail("POST /auth/login", f"{r.status_code} {r.text[:200]}")

auth = {"Authorization": f"Bearer {token}"} if token else {}

# ── 4. PROFILE ────────────────────────────────────────────────────────────────
info("Profil utilisateur")
r = requests.get(f"{BASE_URL}/auth/me", headers=auth)
if r.status_code == 200 and r.json().get("email") == test_email:
    ok("GET /auth/me → 200")
else:
    fail("GET /auth/me", f"{r.status_code} {r.text[:200]}")

# ── 5. ITEMS (liste publique) ─────────────────────────────────────────────────
info("Items")
r = requests.get(f"{BASE_URL}/items?limit=5")
if r.status_code == 200 and isinstance(r.json(), list):
    ok(f"GET /items → 200 ({len(r.json())} items)")
else:
    fail("GET /items", f"{r.status_code} {r.text[:200]}")

# ── 6. CRÉER UN ITEM ──────────────────────────────────────────────────────────
item_id = None
if token:
    r = requests.post(f"{BASE_URL}/items", headers=auth, json={
        "title": "Test Item Supabase",
        "description": "Item de test pour valider la migration",
        "category": "vetements",
        "type": "sale",
        "price": 10.0,
        "city": "Paris",
        "postcode": "75001",
        "photos": []
    })
    if r.status_code in (200, 201):
        item_id = r.json().get("id")
        ok(f"POST /items → {r.status_code} (id={item_id})")
    else:
        fail("POST /items", f"{r.status_code} {r.text[:300]}")

# ── 7. GET ITEM PAR ID ────────────────────────────────────────────────────────
if item_id:
    r = requests.get(f"{BASE_URL}/items/{item_id}")
    if r.status_code == 200 and r.json().get("id") == item_id:
        ok(f"GET /items/{{id}} → 200")
    else:
        fail("GET /items/{id}", f"{r.status_code} {r.text[:200]}")

# ── 8. MY ITEMS ───────────────────────────────────────────────────────────────
if token:
    r = requests.get(f"{BASE_URL}/items/my-items", headers=auth)
    if r.status_code == 200:
        ok(f"GET /items/my-items → 200 ({len(r.json())} items)")
    else:
        fail("GET /items/my-items", f"{r.status_code} {r.text[:200]}")

# ── 9. ZONES (publiques) ──────────────────────────────────────────────────────
info("Zones & listes publiques")
r = requests.get(f"{BASE_URL}/zones")
if r.status_code == 200:
    ok(f"GET /zones → 200 ({len(r.json())} zones)")
else:
    fail("GET /zones", f"{r.status_code} {r.text[:200]}")

# ── 10. WAITLIST ──────────────────────────────────────────────────────────────
info("Waitlist / Newsletter")
r = requests.post(f"{BASE_URL}/waitlist", json={
    "email": f"wait_{uuid.uuid4().hex[:6]}@test.com",
    "name": "Test Wait",
    "city": "Paris",
    "postcode": "75001"
})
if r.status_code in (200, 201):
    ok(f"POST /waitlist → {r.status_code}")
else:
    fail("POST /waitlist", f"{r.status_code} {r.text[:200]}")

# ── 11. CLEANUP: DELETE ITEM ──────────────────────────────────────────────────
if item_id and token:
    info("Cleanup")
    r = requests.delete(f"{BASE_URL}/items/{item_id}", headers=auth)
    if r.status_code in (200, 204):
        ok(f"DELETE /items/{{id}} → {r.status_code}")
    else:
        fail("DELETE /items/{id}", f"{r.status_code} {r.text[:200]}")

# ── RÉSUMÉ ────────────────────────────────────────────────────────────────────
print(f"\n{'─'*50}")
print(f"Résultats : {GREEN}{passed} OK{RESET}  {RED}{failed} FAIL{RESET}")
print(f"{'─'*50}")
