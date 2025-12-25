import os
import uuid
from datetime import datetime
from pymongo import MongoClient
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path

# Load env
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# DB Connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'loop_db')
client = MongoClient(mongo_url)
db = client[db_name]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_user(email, name, password, level, points, color):
    user_id = str(uuid.uuid4())
    
    # Check if exists
    existing = db.users.find_one({"email": email})
    if existing:
        print(f"Update existing user {email}...")
        db.users.update_one(
            {"email": email},
            {"$set": {
                "level": level,
                "points": points,
                "profile_theme_color": color,
                "password_hash": hash_password(password), # Reset password to known one
                "display_name": name,
                "updated_at": datetime.utcnow()
            }}
        )
        return existing["id"]
    else:
        print(f"Create new user {email}...")
        user_dict = {
            "id": user_id,
            "email": email,
            "password_hash": hash_password(password),
            "display_name": name,
            "phone": "0600000000",
            "photo_url": f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background={color.replace('#', '')}&color=fff",
            "ratings_avg": 4.8 if level in ['Expert', 'Ambassadeur'] else 0.0,
            "ratings_count": 15 if level in ['Expert', 'Ambassadeur'] else 0,
            "points": points,
            "level": level,
            "profile_theme_color": color,
            "stripe_account_id": None,
            "created_at": datetime.utcnow()
        }
        db.users.insert_one(user_dict)
        return user_id

def seed_gamification_users():
    print("🌱 Seeding Gamification Users...")
    
    # 1. Novice
    novice_id = create_user("novice@yondly.com", "Nathalie Novice", "password", "Novice", 5, "#81c784")
    
    # 2. Habitué
    habitue_id = create_user("habitue@yondly.com", "Henri Habitué", "password", "Habitué", 30, "#4fc3f7")
    # Add Saved Search for Habitué
    db.saved_searches.delete_many({"user_id": habitue_id})
    db.saved_searches.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": habitue_id,
        "query": "Vêtements enfant",
        "category": "Enfants",
        "alert_enabled": True,
        "created_at": datetime.utcnow()
    })
    
    # 3. Expert
    expert_id = create_user("expert@yondly.com", "Elise Expert", "password", "Expert", 120, "#ffb74d")
    # Add Public List for Expert
    db.public_lists.delete_many({"user_id": expert_id})
    db.public_lists.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": expert_id,
        "name": "Kit Déménagement",
        "description": "Les essentiels pour bien s'installer",
        "item_ids": [], # Empty for now
        "created_at": datetime.utcnow()
    })
    
    # 4. Ambassadeur
    ambassadeur_id = create_user("ambassadeur@yondly.com", "Amir Ambassadeur", "password", "Ambassadeur", 600, "#9c27b0")
    
    print("\n✅ Users Created / Updated:")
    print("------------------------------------------------")
    print("Level: NOVICE")
    print("Email: novice@yondly.com")
    print("Pass : password")
    print("------------------------------------------------")
    print("Level: HABITUÉ")
    print("Email: habitue@yondly.com")
    print("Pass : password")
    print("------------------------------------------------")
    print("Level: EXPERT")
    print("Email: expert@yondly.com")
    print("Pass : password")
    print("------------------------------------------------")
    print("Level: AMBASSADEUR")
    print("Email: ambassadeur@yondly.com")
    print("Pass : password")
    print("------------------------------------------------")

if __name__ == "__main__":
    seed_gamification_users()
