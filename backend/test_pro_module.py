#!/usr/bin/env python3
"""
Test script for PRO Module endpoints
Run: python backend/test_pro_module.py
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api"

# Test user credentials (must exist in DB)
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"

def get_token():
    """Get auth token"""
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if resp.status_code == 200:
        return resp.json().get("access_token")
    print(f"❌ Login failed: {resp.text}")
    return None

def headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def test_section(name):
    print(f"\n{'='*50}")
    print(f"  {name}")
    print(f"{'='*50}\n")

def test_endpoint(method, url, token, data=None, expected_status=200):
    """Test an endpoint"""
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers(token))
        elif method == "POST":
            resp = requests.post(url, headers=headers(token), json=data)
        elif method == "PUT":
            resp = requests.put(url, headers=headers(token), json=data)
        else:
            resp = requests.request(method, url, headers=headers(token), json=data)
        
        status = "✅" if resp.status_code == expected_status else "❌"
        print(f"{status} {method} {url.replace(BASE_URL, '')} → {resp.status_code}")
        
        if resp.status_code != expected_status:
            print(f"   Response: {resp.text[:200]}")
        
        return resp.json() if resp.status_code < 400 else None
    except Exception as e:
        print(f"❌ {method} {url} → Error: {e}")
        return None

def main():
    print("\n🧪 Testing PRO Module Endpoints\n")
    
    # ============ TRANSPARENCY (PUBLIC) ============
    test_section("Phase 1: Transparency (Public)")
    
    resp = requests.get(f"{BASE_URL}/pro/transparency")
    status = "✅" if resp.status_code == 200 else "❌"
    print(f"{status} GET /pro/transparency → {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"   • ranking_text length: {len(data.get('ranking_text', ''))}")
        print(f"   • dereferencing_rules length: {len(data.get('dereferencing_rules_text', ''))}")
    
    # ============ AUTH ============
    test_section("Authentication")
    
    token = get_token()
    if not token:
        # Create test user if doesn't exist
        print("ℹ️  Creating test user...")
        resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "display_name": "Test PRO User"
        })
        if resp.status_code in [200, 201]:
            token = get_token()
        
        if not token:
            print("❌ Cannot authenticate. Aborting tests.")
            return
    
    print(f"✅ Authenticated with token: {token[:20]}...")
    
    # ============ PRO PROFILE ============
    test_section("Phase 2: PRO Profile")
    
    # Get profile (may not exist yet)
    test_endpoint("GET", f"{BASE_URL}/pro/profile", token)
    
    # Create/Update profile
    profile_data = {
        "legal_name": "Test PRO SARL",
        "trade_name": "Test PRO",
        "siret": "12345678901234",
        "vat_number": "FR12345678901",
        "address_line1": "123 rue du Test",
        "postal_code": "75001",
        "city": "Paris",
        "country": "FR",
        "contact_email": "pro@test.com",
        "contact_phone": "+33123456789",
        "mediator_name": "Médiateur Test",
        "mediator_url": "https://mediateur.example.com",
        "mediator_contact": "contact@mediateur.example.com"
    }
    result = test_endpoint("POST", f"{BASE_URL}/pro/profile", token, profile_data)
    
    # ============ VERIFICATION ============
    test_section("Phase 2: Verification")
    
    test_endpoint("GET", f"{BASE_URL}/pro/verification", token)
    
    # ============ STRIPE ============
    test_section("Phase 2: Stripe Connect")
    
    test_endpoint("GET", f"{BASE_URL}/pro/stripe/status", token)
    stripe_result = test_endpoint("POST", f"{BASE_URL}/pro/stripe/onboarding", token)
    if stripe_result:
        print(f"   • Onboarding URL: {stripe_result.get('onboarding_url', 'N/A')[:50]}...")
    
    # ============ CREATE OFFER ============
    test_section("Phase 3: Create Offer")
    
    # Create anti-gaspi offer
    offer_data = {
        "kind": "ANTIGASPI_SALE",
        "title": "Panier Anti-gaspi Test",
        "description": "Test basket with goods",
        "category": "food",
        "photos": ["https://example.com/photo1.jpg"],
        "price_cents": 500,
        "quantity": 5,
        "location_label": "Paris Centre",
        "postal_code": "75001",
        "city": "Paris"
    }
    offer_result = test_endpoint("POST", f"{BASE_URL}/pro/offers", token, offer_data)
    offer_id = offer_result.get("id") if offer_result else None
    
    if offer_id:
        print(f"   • Offer ID: {offer_id}")
        
        # Add anti-gaspi specifics
        antigaspi_data = {
            "is_food": True,
            "allergens_text": "Gluten, lait",
            "date_type": "DLC",
            "date_value": (datetime.now() + timedelta(days=3)).isoformat(),
            "pickup_slots": [{
                "start_at": (datetime.now() + timedelta(hours=2)).isoformat(),
                "end_at": (datetime.now() + timedelta(hours=4)).isoformat()
            }],
            "pickup_instructions": "Présentez-vous à l'accueil"
        }
        test_endpoint("POST", f"{BASE_URL}/pro/offers/{offer_id}/antigaspi", token, antigaspi_data)
        
        # List offers
        offers = test_endpoint("GET", f"{BASE_URL}/pro/offers", token)
        if offers:
            print(f"   • Total offers: {len(offers)}")
    
    # ============ LEGAL TEXTS ============
    test_section("Phase 4: Legal Texts")
    
    # Note: This will fail without a published offer with antigaspi data
    # test_endpoint("GET", f"{BASE_URL}/pro/checkout/order/{offer_id}/legal-texts", token, expected_status=404)
    
    # ============ ORDERS ============
    test_section("Phase 6: Orders (will need a published offer)")
    
    # List orders
    test_endpoint("GET", f"{BASE_URL}/pro/my-orders", token)
    test_endpoint("GET", f"{BASE_URL}/pro/pro-orders", token)
    
    # ============ RENTALS ============
    test_section("Phase 6: Rentals")
    
    test_endpoint("GET", f"{BASE_URL}/pro/my-rentals", token)
    test_endpoint("GET", f"{BASE_URL}/pro/pro-rentals", token)
    
    # ============ DISPUTES ============
    test_section("Phase 7: Disputes")
    
    test_endpoint("GET", f"{BASE_URL}/pro/my-disputes", token)
    
    # ============ ADMIN ENDPOINTS ============
    test_section("Phase 8: Admin Endpoints")
    
    test_endpoint("GET", f"{BASE_URL}/admin/pro/verifications", token)
    test_endpoint("GET", f"{BASE_URL}/admin/pro/offers", token)
    test_endpoint("GET", f"{BASE_URL}/admin/pro/stats", token)
    test_endpoint("GET", f"{BASE_URL}/admin/transparency", token)
    
    # ============ DAC7 ============
    test_section("Phase 9: DAC7")
    
    test_endpoint("GET", f"{BASE_URL}/admin/dac7/jobs", token)
    
    # ============ SUMMARY ============
    print("\n" + "="*50)
    print("  TEST SUMMARY")
    print("="*50)
    print("\n✅ Si la plupart des endpoints retournent 200, le module PRO fonctionne !")
    print("ℹ️  Certains endpoints nécessitent des données préexistantes (offres publiées, etc.)")
    print("\n📋 Prochaines étapes pour un test complet :")
    print("   1. Approuver la vérification PRO via Admin")
    print("   2. Simuler l'activation Stripe payouts")
    print("   3. Publier une offre")
    print("   4. Créer une commande/location")
    print("   5. Tester le flux complet")

if __name__ == "__main__":
    main()
