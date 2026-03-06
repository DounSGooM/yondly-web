import requests

API_URL = "http://localhost:8000/api"

def verify_login():
    email = "pro@loop.fr"
    password = "password"
    
    try:
        print(f"Attempting login for {email}...")
        response = requests.post(f"{API_URL}/auth/login", json={"email": email, "password": password})
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            print("Login SUCCESS!")
            print(f"User ID: {user.get('id')}")
            print(f"Is Partner: {user.get('is_partner')}")
            print(f"Access Token: {data.get('access_token')[:20]}...")
        else:
            print(f"Login FAILED: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_login()
