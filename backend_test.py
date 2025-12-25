#!/usr/bin/env python3

import requests
import json
import os
from datetime import datetime, timedelta

# Get backend URL from frontend .env
BACKEND_URL = "http://localhost:8000/api"

class OfferTestSuite:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.buyer_token = None
        self.seller_token = None
        self.buyer_id = None
        self.seller_id = None
        self.item_id = None
        self.offer_id = None
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def register_user(self, email, password, display_name):
        """Register a new user and return token"""
        data = {
            "email": email,
            "password": password,
            "display_name": display_name,
            "phone": "+33123456789"
        }
        
        response = self.session.post(f"{self.base_url}/auth/register", json=data)
        if response.status_code == 200:
            result = response.json()
            return result["access_token"], result["user"]["id"]
        elif response.status_code == 400 and "already registered" in response.text:
            # User exists, try to login
            login_data = {"email": email, "password": password}
            login_response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if login_response.status_code == 200:
                result = login_response.json()
                return result["access_token"], result["user"]["id"]
            else:
                self.log(f"Login failed: {login_response.status_code} - {login_response.text}")
                return None, None
        else:
            self.log(f"Registration failed: {response.status_code} - {response.text}")
            return None, None
    
    def create_test_item(self, token, allow_offers=True, price_cents=2000):
        """Create a test item for sale that allows offers"""
        headers = {"Authorization": f"Bearer {token}"}
        
        item_data = {
            "type": "sale",
            "title": "Test Smartphone",
            "description": "A great phone for testing offers",
            "category": "Electronics",
            "condition": "good",
            "location": {"lat": 48.8566, "lng": 2.3522},  # Paris
            "radius_km": 5.0,
            "price_cents": price_cents,
            "allow_offers": allow_offers,
            "tags": ["smartphone", "electronics"]
        }
        
        response = self.session.post(f"{self.base_url}/items", json=item_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            return result["id"]
        else:
            self.log(f"Item creation failed: {response.status_code} - {response.text}")
            return None
    
    def setup_test_data(self):
        """Setup test users and item"""
        self.log("Setting up test data...")
        
        # Register buyer
        self.buyer_token, self.buyer_id = self.register_user(
            "buyer@test.com", "password123", "Test Buyer"
        )
        if not self.buyer_token:
            return False
            
        # Register seller
        self.seller_token, self.seller_id = self.register_user(
            "seller@test.com", "password123", "Test Seller"
        )
        if not self.seller_token:
            return False
            
        # Create test item
        self.item_id = self.create_test_item(self.seller_token)
        if not self.item_id:
            return False
            
        self.log(f"✅ Test data setup complete - Item: {self.item_id}")
        return True
    
    def test_create_offer(self):
        """Test 1: POST /api/offers - Create offer (should create message)"""
        self.log("\n=== Test 1: Create Offer ===")
        
        headers = {"Authorization": f"Bearer {self.buyer_token}"}
        offer_data = {
            "item_id": self.item_id,
            "amount_cents": 1000  # 10€ offer on 20€ item
        }
        
        # Create offer
        response = self.session.post(f"{self.base_url}/offers", json=offer_data, headers=headers)
        
        if response.status_code != 200:
            self.log(f"❌ Offer creation failed: {response.status_code} - {response.text}")
            return False
            
        offer = response.json()
        self.offer_id = offer["id"]
        
        # Verify offer data
        expected_fields = ["id", "item_id", "buyer_id", "amount_cents", "status", "created_at"]
        for field in expected_fields:
            if field not in offer:
                self.log(f"❌ Missing field in offer: {field}")
                return False
                
        if offer["amount_cents"] != 1000:
            self.log(f"❌ Wrong offer amount: {offer['amount_cents']}")
            return False
            
        if offer["status"] != "pending":
            self.log(f"❌ Wrong offer status: {offer['status']}")
            return False
            
        # Verify message was created
        headers_seller = {"Authorization": f"Bearer {self.seller_token}"}
        response = self.session.get(f"{self.base_url}/messages/item/{self.item_id}", headers=headers_seller)
        
        if response.status_code != 200:
            self.log(f"❌ Failed to get messages: {response.status_code}")
            return False
            
        messages = response.json()
        if not messages:
            self.log("❌ No messages found after offer creation")
            return False
            
        # Check if message has offer_id
        offer_message = None
        for msg in messages:
            if msg.get("offer_id") == self.offer_id:
                offer_message = msg
                break
                
        if not offer_message:
            self.log("❌ No message found with offer_id")
            return False
            
        if "10.00€" not in offer_message["text"]:
            self.log(f"❌ Message doesn't contain offer amount: {offer_message['text']}")
            return False
            
        self.log(f"✅ Offer created successfully with message: {offer_message['text']}")
        return True
    
    def test_get_offer(self):
        """Test 2: GET /api/offers/{offer_id} - Get specific offer"""
        self.log("\n=== Test 2: Get Specific Offer ===")
        
        # Test buyer can access
        headers_buyer = {"Authorization": f"Bearer {self.buyer_token}"}
        response = self.session.get(f"{self.base_url}/offers/{self.offer_id}", headers=headers_buyer)
        
        if response.status_code != 200:
            self.log(f"❌ Buyer cannot access offer: {response.status_code}")
            return False
            
        # Test seller can access
        headers_seller = {"Authorization": f"Bearer {self.seller_token}"}
        response = self.session.get(f"{self.base_url}/offers/{self.offer_id}", headers=headers_seller)
        
        if response.status_code != 200:
            self.log(f"❌ Seller cannot access offer: {response.status_code}")
            return False
            
        offer = response.json()
        if offer["id"] != self.offer_id:
            self.log(f"❌ Wrong offer returned: {offer['id']}")
            return False
            
        # Test unauthorized user gets 403
        unauthorized_token, _ = self.register_user("unauthorized@test.com", "password123", "Unauthorized")
        if unauthorized_token:
            headers_unauth = {"Authorization": f"Bearer {unauthorized_token}"}
            response = self.session.get(f"{self.base_url}/offers/{self.offer_id}", headers=headers_unauth)
            
            if response.status_code != 403:
                self.log(f"❌ Unauthorized user should get 403, got: {response.status_code}")
                return False
                
        self.log("✅ Offer access control working correctly")
        return True
    
    def test_accept_offer(self):
        """Test 3: PUT /api/offers/{offer_id}/accept - Accept offer"""
        self.log("\n=== Test 3: Accept Offer ===")
        
        # Create a new offer for this test
        headers_buyer = {"Authorization": f"Bearer {self.buyer_token}"}
        offer_data = {"item_id": self.item_id, "amount_cents": 1500}
        
        response = self.session.post(f"{self.base_url}/offers", json=offer_data, headers=headers_buyer)
        if response.status_code != 200:
            self.log(f"❌ Failed to create test offer: {response.status_code}")
            return False
            
        test_offer_id = response.json()["id"]
        
        # Accept the offer
        headers_seller = {"Authorization": f"Bearer {self.seller_token}"}
        response = self.session.put(f"{self.base_url}/offers/{test_offer_id}/accept", headers=headers_seller)
        
        if response.status_code != 200:
            self.log(f"❌ Failed to accept offer: {response.status_code} - {response.text}")
            return False
            
        result = response.json()
        
        # Verify response contains expected fields
        if "expires_at" not in result:
            self.log("❌ Missing expires_at in accept response")
            return False
            
        if "offer_amount" not in result:
            self.log("❌ Missing offer_amount in accept response")
            return False
            
        # Verify offer status changed
        response = self.session.get(f"{self.base_url}/offers/{test_offer_id}", headers=headers_seller)
        if response.status_code != 200:
            self.log(f"❌ Failed to get updated offer: {response.status_code}")
            return False
            
        offer = response.json()
        if offer["status"] != "accepted":
            self.log(f"❌ Offer status not updated: {offer['status']}")
            return False
            
        self.log("✅ Offer accepted successfully with 4h expiration")
        return True
    
    def test_decline_offer(self):
        """Test 4: PUT /api/offers/{offer_id}/decline - Decline offer"""
        self.log("\n=== Test 4: Decline Offer ===")
        
        # Create a new offer for this test
        headers_buyer = {"Authorization": f"Bearer {self.buyer_token}"}
        offer_data = {"item_id": self.item_id, "amount_cents": 800}
        
        response = self.session.post(f"{self.base_url}/offers", json=offer_data, headers=headers_buyer)
        if response.status_code != 200:
            self.log(f"❌ Failed to create test offer: {response.status_code}")
            return False
            
        test_offer_id = response.json()["id"]
        
        # Decline the offer
        headers_seller = {"Authorization": f"Bearer {self.seller_token}"}
        response = self.session.put(f"{self.base_url}/offers/{test_offer_id}/decline", headers=headers_seller)
        
        if response.status_code != 200:
            self.log(f"❌ Failed to decline offer: {response.status_code} - {response.text}")
            return False
            
        # Verify offer status changed
        response = self.session.get(f"{self.base_url}/offers/{test_offer_id}", headers=headers_seller)
        if response.status_code != 200:
            self.log(f"❌ Failed to get updated offer: {response.status_code}")
            return False
            
        offer = response.json()
        if offer["status"] != "declined":
            self.log(f"❌ Offer status not updated: {offer['status']}")
            return False
            
        self.log("✅ Offer declined successfully")
        return True
    
    def test_counter_offer(self):
        """Test 5: PUT /api/offers/{offer_id}/counter - Counter-offer"""
        self.log("\n=== Test 5: Counter Offer ===")
        
        # Create a new item for this test to avoid rate limiting
        counter_item_id = self.create_test_item(self.seller_token, allow_offers=True, price_cents=2000)
        if not counter_item_id:
            self.log("❌ Failed to create test item for counter-offer")
            return False
        
        # Create a new offer for this test (10€ on 20€ item)
        headers_buyer = {"Authorization": f"Bearer {self.buyer_token}"}
        offer_data = {"item_id": counter_item_id, "amount_cents": 1000}
        
        response = self.session.post(f"{self.base_url}/offers", json=offer_data, headers=headers_buyer)
        if response.status_code != 200:
            self.log(f"❌ Failed to create test offer: {response.status_code}")
            return False
            
        test_offer_id = response.json()["id"]
        
        # Make counter-offer (15€)
        headers_seller = {"Authorization": f"Bearer {self.seller_token}"}
        counter_data = {"counter_amount_cents": 1500}
        
        response = self.session.put(
            f"{self.base_url}/offers/{test_offer_id}/counter",
            params=counter_data,
            headers=headers_seller
        )
        
        if response.status_code != 200:
            self.log(f"❌ Failed to make counter-offer: {response.status_code} - {response.text}")
            return False
            
        result = response.json()
        if result["counter_amount_cents"] != 1500:
            self.log(f"❌ Wrong counter amount: {result['counter_amount_cents']}")
            return False
            
        # Verify offer status changed to 'countered'
        response = self.session.get(f"{self.base_url}/offers/{test_offer_id}", headers=headers_seller)
        if response.status_code != 200:
            self.log(f"❌ Failed to get updated offer: {response.status_code}")
            return False
            
        offer = response.json()
        if offer["status"] != "countered":
            self.log(f"❌ Offer status not updated: {offer['status']}")
            return False
            
        if offer.get("counter_offer_amount_cents") != 1500:
            self.log(f"❌ Counter amount not saved: {offer.get('counter_offer_amount_cents')}")
            return False
            
        # Verify new message was created for buyer
        headers_buyer = {"Authorization": f"Bearer {self.buyer_token}"}
        response = self.session.get(f"{self.base_url}/messages/item/{counter_item_id}", headers=headers_buyer)
        
        if response.status_code != 200:
            self.log(f"❌ Failed to get messages: {response.status_code}")
            return False
            
        messages = response.json()
        counter_message = None
        for msg in messages:
            if msg.get("offer_id") == test_offer_id and "Contre-offre" in msg["text"]:
                counter_message = msg
                break
                
        if not counter_message:
            self.log("❌ No counter-offer message found")
            return False
            
        if "15.00€" not in counter_message["text"]:
            self.log(f"❌ Counter message doesn't contain amount: {counter_message['text']}")
            return False
            
        self.log(f"✅ Counter-offer successful with message: {counter_message['text']}")
        return True
    
    def test_edge_cases(self):
        """Test 6: Edge cases"""
        self.log("\n=== Test 6: Edge Cases ===")
        
        # Create a new item for this test to avoid rate limiting
        edge_item_id = self.create_test_item(self.seller_token, allow_offers=True, price_cents=2000)
        if not edge_item_id:
            self.log("❌ Failed to create test item for edge cases")
            return False
        
        # Create test offer
        headers_buyer = {"Authorization": f"Bearer {self.buyer_token}"}
        offer_data = {"item_id": edge_item_id, "amount_cents": 1000}
        
        response = self.session.post(f"{self.base_url}/offers", json=offer_data, headers=headers_buyer)
        if response.status_code != 200:
            self.log(f"❌ Failed to create test offer: {response.status_code}")
            return False
            
        test_offer_id = response.json()["id"]
        headers_seller = {"Authorization": f"Bearer {self.seller_token}"}
        
        # Test invalid counter-offer amounts
        # Too low (below original offer)
        response = self.session.put(
            f"{self.base_url}/offers/{test_offer_id}/counter",
            params={"counter_amount_cents": 500},
            headers=headers_seller
        )
        
        if response.status_code != 400:
            self.log(f"❌ Should reject low counter-offer, got: {response.status_code}")
            return False
            
        # Too high (above item price)
        response = self.session.put(
            f"{self.base_url}/offers/{test_offer_id}/counter",
            params={"counter_amount_cents": 2500},
            headers=headers_seller
        )
        
        if response.status_code != 400:
            self.log(f"❌ Should reject high counter-offer, got: {response.status_code}")
            return False
            
        # Test non-owner trying to accept/decline
        unauthorized_token, _ = self.register_user("hacker@test.com", "password123", "Hacker")
        if unauthorized_token:
            headers_unauth = {"Authorization": f"Bearer {unauthorized_token}"}
            
            # Try to accept
            response = self.session.put(f"{self.base_url}/offers/{test_offer_id}/accept", headers=headers_unauth)
            if response.status_code != 403:
                self.log(f"❌ Non-owner should not be able to accept, got: {response.status_code}")
                return False
                
            # Try to decline
            response = self.session.put(f"{self.base_url}/offers/{test_offer_id}/decline", headers=headers_unauth)
            if response.status_code != 403:
                self.log(f"❌ Non-owner should not be able to decline, got: {response.status_code}")
                return False
        
        self.log("✅ All edge cases handled correctly")
        return True
    
    def run_all_tests(self):
        """Run all offer management tests"""
        self.log("🚀 Starting Offer Management System Tests")
        
        if not self.setup_test_data():
            self.log("❌ Failed to setup test data")
            return False
            
        tests = [
            self.test_create_offer,
            self.test_get_offer,
            self.test_accept_offer,
            self.test_decline_offer,
            self.test_counter_offer,
            self.test_edge_cases
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    self.log(f"❌ Test failed: {test.__name__}")
            except Exception as e:
                self.log(f"❌ Test error in {test.__name__}: {str(e)}")
        
        self.log(f"\n📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All offer management tests PASSED!")
            return True
        else:
            self.log("💥 Some tests FAILED!")
            return False

if __name__ == "__main__":
    test_suite = OfferTestSuite()
    success = test_suite.run_all_tests()
    exit(0 if success else 1)