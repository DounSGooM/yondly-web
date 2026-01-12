import json
import urllib.request
import urllib.error
import uuid
import time

API_BASE = "https://yondly-backend-951855414282.europe-west1.run.app/api"

def request(method, endpoint, data=None, token=None):
    url = f"{API_BASE}{endpoint}"
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "VerificationScript/1.0"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if data:
        json_data = json.dumps(data).encode('utf-8')
    else:
        json_data = None

    req = urllib.request.Request(url, data=json_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 204:
                return None
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        print(e.read().decode('utf-8'))
        raise

def verify():
    # 1. Register a new user
    email = f"test_{uuid.uuid4()}@example.com"
    password = "password123"
    print(f"1. Registering user: {email}")
    
    reg_data = {
        "email": email,
        "password": password,
        "display_name": "Test User",
        "postcode": "86000",
        "city": "Poitiers"
    }
    
    try:
        reg_res = request("POST", "/auth/register", reg_data)
        token = reg_res["access_token"]
        print("   -> Registration successful")
    except Exception as e:
        print("   -> Registration failed")
        return

    # 2. Create an item
    print("2. Creating item with CO2 estimation...")
    item_data = {
        "title": "Jean Levi's 501 Vintage",
        "description": "Jean en très bon état, taille 32/34. Bleu délavé.",
        "category": "Vêtements",
        "type": "sale",
        "price_cents": 2500,
        "condition": "good",
        "photos": [
            "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&w=500&q=60"
        ],
        "location": {
            "lat": 46.5802, 
            "lng": 0.3404
        }
    }
    
    try:
        item_res = request("POST", "/items", item_data, token)
        print("   -> Item created")
        
        # 3. Verify CO2 estimate in creation response
        if "co2_estimate" in item_res and item_res["co2_estimate"]:
            co2 = item_res["co2_estimate"].get("co2_saved_kg")
            print(f"   -> SUCCESS: co2_estimate found in response: {co2} kg")
        else:
            print("   -> FAILURE: co2_estimate NOT found in create response")
            print(json.dumps(item_res, indent=2))
            
    except Exception as e:
        print(f"   -> Creation failed: {e}")
        return

    # 4. Verify CO2 estimate in item list
    print("3. Verifying item in list...")
    try:
        # Give DB a moment if eventual consistency is a thing (though Mongo usually fast)
        time.sleep(1)
        
        # We can filter by owner to find it easily, but standard feed should have it at top
        list_res = request("GET", "/items", token=token)
        
        # Check if list_res is a list or dict with items
        items = list_res if isinstance(list_res, list) else list_res.get("items", [])
        
        found = False
        for item in items:
            if item["id"] == item_res["id"]:
                found = True
                if "co2_estimate" in item and item["co2_estimate"]:
                    co2 = item["co2_estimate"].get("co2_saved_kg")
                    print(f"   -> SUCCESS: co2_estimate found in list view: {co2} kg")
                else:
                    print("   -> FAILURE: co2_estimate NOT found in list view")
                    print(json.dumps(item, indent=2))
                break
        
        if not found:
            print("   -> WARNING: Created item not found in recent items list")

    except Exception as e:
        print(f"   -> List fetch failed: {e}")

if __name__ == "__main__":
    verify()
