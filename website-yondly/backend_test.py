#!/usr/bin/env python3
"""
Yondly Backend API Testing Suite
Tests all API endpoints for Waitlist, Partners, and Contact functionality
"""

import requests
import json
import csv
import io
from datetime import datetime
import sys
import os

# Get the backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    base_url = line.split('=', 1)[1].strip()
                    return f"{base_url}/api"
        return "http://localhost:8001/api"  # fallback
    except:
        return "http://localhost:8001/api"  # fallback

BASE_URL = get_backend_url()
print(f"Testing backend at: {BASE_URL}")

class YondlyAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        
    def test_waitlist_api(self):
        """Test all waitlist endpoints"""
        print("\n=== TESTING WAITLIST API ===")
        
        # Test 1: Valid waitlist entry
        try:
            valid_data = {
                "email": "marie.dupont@example.com",
                "city": "Lyon",
                "status": "particulier",
                "comment": "Très intéressée par la plateforme !",
                "rgpd_consent": True
            }
            
            response = self.session.post(f"{self.base_url}/waitlist", json=valid_data)
            if response.status_code == 201:
                data = response.json()
                if 'id' in data and data['email'] == valid_data['email']:
                    self.log_test("Waitlist - Valid entry creation", True, f"Created entry with ID: {data['id']}")
                else:
                    self.log_test("Waitlist - Valid entry creation", False, "Response missing required fields")
            else:
                self.log_test("Waitlist - Valid entry creation", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Waitlist - Valid entry creation", False, f"Exception: {str(e)}")
            
        # Test 2: Missing RGPD consent
        try:
            invalid_data = {
                "email": "test.no.consent@example.com",
                "city": "Paris",
                "rgpd_consent": False
            }
            
            response = self.session.post(f"{self.base_url}/waitlist", json=invalid_data)
            if response.status_code == 400:
                self.log_test("Waitlist - RGPD consent validation", True, "Correctly rejected entry without consent")
            else:
                self.log_test("Waitlist - RGPD consent validation", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_test("Waitlist - RGPD consent validation", False, f"Exception: {str(e)}")
            
        # Test 3: Missing required email
        try:
            invalid_data = {
                "city": "Marseille",
                "rgpd_consent": True
            }
            
            response = self.session.post(f"{self.base_url}/waitlist", json=invalid_data)
            if response.status_code == 422:  # FastAPI validation error
                self.log_test("Waitlist - Missing email validation", True, "Correctly rejected entry without email")
            else:
                self.log_test("Waitlist - Missing email validation", False, f"Expected 422, got {response.status_code}")
        except Exception as e:
            self.log_test("Waitlist - Missing email validation", False, f"Exception: {str(e)}")
            
        # Test 4: Duplicate email
        try:
            duplicate_data = {
                "email": "marie.dupont@example.com",  # Same as first test
                "city": "Toulouse",
                "rgpd_consent": True
            }
            
            response = self.session.post(f"{self.base_url}/waitlist", json=duplicate_data)
            if response.status_code == 400:
                self.log_test("Waitlist - Duplicate email rejection", True, "Correctly rejected duplicate email")
            else:
                self.log_test("Waitlist - Duplicate email rejection", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_test("Waitlist - Duplicate email rejection", False, f"Exception: {str(e)}")
            
        # Test 5: Get waitlist entries
        try:
            response = self.session.get(f"{self.base_url}/waitlist")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("Waitlist - Get entries", True, f"Retrieved {len(data)} entries")
                else:
                    self.log_test("Waitlist - Get entries", True, "Retrieved empty list")
            else:
                self.log_test("Waitlist - Get entries", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Waitlist - Get entries", False, f"Exception: {str(e)}")
            
        # Test 6: Get waitlist stats
        try:
            response = self.session.get(f"{self.base_url}/waitlist/stats")
            if response.status_code == 200:
                data = response.json()
                if 'total' in data and 'by_status' in data and 'top_cities' in data:
                    self.log_test("Waitlist - Get statistics", True, f"Total entries: {data['total']}")
                else:
                    self.log_test("Waitlist - Get statistics", False, "Response missing required fields")
            else:
                self.log_test("Waitlist - Get statistics", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Waitlist - Get statistics", False, f"Exception: {str(e)}")
            
        # Test 7: Export waitlist CSV
        try:
            response = self.session.get(f"{self.base_url}/waitlist/export")
            if response.status_code == 200:
                if 'text/csv' in response.headers.get('content-type', ''):
                    # Check if it's valid CSV
                    csv_content = response.text
                    csv_reader = csv.reader(io.StringIO(csv_content))
                    rows = list(csv_reader)
                    if len(rows) > 0 and 'Email' in rows[0]:
                        self.log_test("Waitlist - CSV export", True, f"Exported {len(rows)-1} entries")
                    else:
                        self.log_test("Waitlist - CSV export", False, "Invalid CSV format")
                else:
                    self.log_test("Waitlist - CSV export", False, "Response not CSV format")
            else:
                self.log_test("Waitlist - CSV export", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Waitlist - CSV export", False, f"Exception: {str(e)}")
            
    def test_partners_api(self):
        """Test all partners endpoints"""
        print("\n=== TESTING PARTNERS API ===")
        
        # Test 1: Valid pro partner entry
        try:
            pro_data = {
                "type": "pro",
                "name": "Boulangerie Artisanale",
                "business": "Boulangerie-Pâtisserie",
                "city": "Lyon",
                "email": "contact@boulangerie-artisanale.fr",
                "phone": "0472123456",
                "message": "Nous souhaitons rejoindre votre plateforme locale",
                "rgpd_consent": True
            }
            
            response = self.session.post(f"{self.base_url}/partners", json=pro_data)
            if response.status_code == 201:
                data = response.json()
                if 'id' in data and data['type'] == 'pro':
                    self.log_test("Partners - Valid pro entry", True, f"Created pro partner: {data['name']}")
                else:
                    self.log_test("Partners - Valid pro entry", False, "Response missing required fields")
            else:
                self.log_test("Partners - Valid pro entry", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Partners - Valid pro entry", False, f"Exception: {str(e)}")
            
        # Test 2: Valid association partner entry
        try:
            association_data = {
                "type": "association",
                "name": "Association des Jardins Partagés",
                "contact_name": "Sophie Martin",
                "city": "Villeurbanne",
                "email": "contact@jardins-partages.org",
                "website": "https://jardins-partages.org",
                "message": "Association pour le développement des jardins communautaires",
                "rgpd_consent": True
            }
            
            response = self.session.post(f"{self.base_url}/partners", json=association_data)
            if response.status_code == 201:
                data = response.json()
                if 'id' in data and data['type'] == 'association':
                    self.log_test("Partners - Valid association entry", True, f"Created association: {data['name']}")
                else:
                    self.log_test("Partners - Valid association entry", False, "Response missing required fields")
            else:
                self.log_test("Partners - Valid association entry", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Partners - Valid association entry", False, f"Exception: {str(e)}")
            
        # Test 3: Missing RGPD consent
        try:
            invalid_data = {
                "type": "pro",
                "name": "Test Business",
                "email": "test@business.com",
                "rgpd_consent": False
            }
            
            response = self.session.post(f"{self.base_url}/partners", json=invalid_data)
            if response.status_code == 400:
                self.log_test("Partners - RGPD consent validation", True, "Correctly rejected without consent")
            else:
                self.log_test("Partners - RGPD consent validation", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_test("Partners - RGPD consent validation", False, f"Exception: {str(e)}")
            
        # Test 4: Invalid partner type
        try:
            invalid_data = {
                "type": "invalid_type",
                "name": "Test Business",
                "email": "test2@business.com",
                "rgpd_consent": True
            }
            
            response = self.session.post(f"{self.base_url}/partners", json=invalid_data)
            if response.status_code == 422:  # FastAPI validation error
                self.log_test("Partners - Invalid type validation", True, "Correctly rejected invalid type")
            else:
                self.log_test("Partners - Invalid type validation", False, f"Expected 422, got {response.status_code}")
        except Exception as e:
            self.log_test("Partners - Invalid type validation", False, f"Exception: {str(e)}")
            
        # Test 5: Duplicate email for same type
        try:
            duplicate_data = {
                "type": "pro",
                "name": "Another Boulangerie",
                "email": "contact@boulangerie-artisanale.fr",  # Same as first test
                "rgpd_consent": True
            }
            
            response = self.session.post(f"{self.base_url}/partners", json=duplicate_data)
            if response.status_code == 400:
                self.log_test("Partners - Duplicate email rejection", True, "Correctly rejected duplicate email")
            else:
                self.log_test("Partners - Duplicate email rejection", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_test("Partners - Duplicate email rejection", False, f"Exception: {str(e)}")
            
        # Test 6: Get all partners
        try:
            response = self.session.get(f"{self.base_url}/partners")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Partners - Get all entries", True, f"Retrieved {len(data)} partners")
                else:
                    self.log_test("Partners - Get all entries", False, "Response not a list")
            else:
                self.log_test("Partners - Get all entries", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Partners - Get all entries", False, f"Exception: {str(e)}")
            
        # Test 7: Filter partners by type
        try:
            response = self.session.get(f"{self.base_url}/partners?type=pro")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    pro_count = len([p for p in data if p.get('type') == 'pro'])
                    self.log_test("Partners - Filter by type (pro)", True, f"Retrieved {pro_count} pro partners")
                else:
                    self.log_test("Partners - Filter by type (pro)", False, "Response not a list")
            else:
                self.log_test("Partners - Filter by type (pro)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Partners - Filter by type (pro)", False, f"Exception: {str(e)}")
            
        # Test 8: Export partners CSV
        try:
            response = self.session.get(f"{self.base_url}/partners/export")
            if response.status_code == 200:
                if 'text/csv' in response.headers.get('content-type', ''):
                    csv_content = response.text
                    csv_reader = csv.reader(io.StringIO(csv_content))
                    rows = list(csv_reader)
                    if len(rows) > 0 and 'Type' in rows[0]:
                        self.log_test("Partners - CSV export", True, f"Exported {len(rows)-1} partners")
                    else:
                        self.log_test("Partners - CSV export", False, "Invalid CSV format")
                else:
                    self.log_test("Partners - CSV export", False, "Response not CSV format")
            else:
                self.log_test("Partners - CSV export", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Partners - CSV export", False, f"Exception: {str(e)}")
            
    def test_contact_api(self):
        """Test all contact endpoints"""
        print("\n=== TESTING CONTACT API ===")
        
        # Test 1: Valid contact message
        try:
            contact_data = {
                "name": "Pierre Durand",
                "email": "pierre.durand@example.com",
                "subject": "Question sur la disponibilité",
                "message": "Bonjour, j'aimerais savoir quand Yondly sera disponible dans ma ville de Grenoble. Merci !",
                "rgpd_consent": True
            }
            
            response = self.session.post(f"{self.base_url}/contact", json=contact_data)
            if response.status_code == 201:
                data = response.json()
                if 'id' in data and data['name'] == contact_data['name']:
                    self.log_test("Contact - Valid message submission", True, f"Created contact: {data['name']}")
                else:
                    self.log_test("Contact - Valid message submission", False, "Response missing required fields")
            else:
                self.log_test("Contact - Valid message submission", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Contact - Valid message submission", False, f"Exception: {str(e)}")
            
        # Test 2: Missing RGPD consent
        try:
            invalid_data = {
                "name": "Test User",
                "email": "test@example.com",
                "message": "Test message",
                "rgpd_consent": False
            }
            
            response = self.session.post(f"{self.base_url}/contact", json=invalid_data)
            if response.status_code == 400:
                self.log_test("Contact - RGPD consent validation", True, "Correctly rejected without consent")
            else:
                self.log_test("Contact - RGPD consent validation", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_test("Contact - RGPD consent validation", False, f"Exception: {str(e)}")
            
        # Test 3: Missing required fields
        try:
            invalid_data = {
                "name": "Test User",
                # Missing email and message
                "rgpd_consent": True
            }
            
            response = self.session.post(f"{self.base_url}/contact", json=invalid_data)
            if response.status_code == 422:  # FastAPI validation error
                self.log_test("Contact - Missing required fields", True, "Correctly rejected incomplete data")
            else:
                self.log_test("Contact - Missing required fields", False, f"Expected 422, got {response.status_code}")
        except Exception as e:
            self.log_test("Contact - Missing required fields", False, f"Exception: {str(e)}")
            
        # Test 4: Get all contact messages
        try:
            response = self.session.get(f"{self.base_url}/contact")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Contact - Get all messages", True, f"Retrieved {len(data)} messages")
                else:
                    self.log_test("Contact - Get all messages", False, "Response not a list")
            else:
                self.log_test("Contact - Get all messages", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Contact - Get all messages", False, f"Exception: {str(e)}")
            
        # Test 5: Export contacts CSV
        try:
            response = self.session.get(f"{self.base_url}/contact/export")
            if response.status_code == 200:
                if 'text/csv' in response.headers.get('content-type', ''):
                    csv_content = response.text
                    csv_reader = csv.reader(io.StringIO(csv_content))
                    rows = list(csv_reader)
                    if len(rows) > 0 and 'Nom' in rows[0]:
                        self.log_test("Contact - CSV export", True, f"Exported {len(rows)-1} contacts")
                    else:
                        self.log_test("Contact - CSV export", False, "Invalid CSV format")
                else:
                    self.log_test("Contact - CSV export", False, "Response not CSV format")
            else:
                self.log_test("Contact - CSV export", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Contact - CSV export", False, f"Exception: {str(e)}")
            
    def test_root_endpoint(self):
        """Test the root API endpoint"""
        print("\n=== TESTING ROOT ENDPOINT ===")
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if 'message' in data:
                    self.log_test("Root endpoint", True, f"Message: {data['message']}")
                else:
                    self.log_test("Root endpoint", False, "Response missing message field")
            else:
                self.log_test("Root endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Root endpoint", False, f"Exception: {str(e)}")
            
    def run_all_tests(self):
        """Run all API tests"""
        print(f"Starting Yondly API Tests at {datetime.now()}")
        print(f"Base URL: {self.base_url}")
        
        self.test_root_endpoint()
        self.test_waitlist_api()
        self.test_partners_api()
        self.test_contact_api()
        
        # Summary
        print("\n" + "="*50)
        print("TEST SUMMARY")
        print("="*50)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\nFAILED TESTS:")
            for test in self.test_results:
                if not test['success']:
                    print(f"❌ {test['test']}: {test['details']}")
                    
        return failed_tests == 0

if __name__ == "__main__":
    tester = YondlyAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)