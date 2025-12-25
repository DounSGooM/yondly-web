"""
Seed script to create simulation data for 10 communes
Run: python seed_simulation_data.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'yondly_db')

# 10 communes with simulation data
COMMUNES_DATA = [
    {"name": "Poitiers", "users": 89, "items": 156, "donations": 45, "sales": 78, "rentals": 33},
    {"name": "Buxerolles", "users": 34, "items": 67, "donations": 18, "sales": 35, "rentals": 14},
    {"name": "Saint-Benoît", "users": 28, "items": 52, "donations": 15, "sales": 28, "rentals": 9},
    {"name": "Chasseneuil-du-Poitou", "users": 22, "items": 41, "donations": 12, "sales": 21, "rentals": 8},
    {"name": "Migné-Auxances", "users": 19, "items": 35, "donations": 10, "sales": 18, "rentals": 7},
    {"name": "Vouneuil-sous-Biard", "users": 15, "items": 28, "donations": 8, "sales": 15, "rentals": 5},
    {"name": "Mignaloux-Beauvoir", "users": 12, "items": 22, "donations": 6, "sales": 12, "rentals": 4},
    {"name": "Fontaine-le-Comte", "users": 10, "items": 18, "donations": 5, "sales": 10, "rentals": 3},
    {"name": "Montamisé", "users": 8, "items": 14, "donations": 4, "sales": 8, "rentals": 2},
    {"name": "Ligugé", "users": 6, "items": 11, "donations": 3, "sales": 6, "rentals": 2},
]

# Quartiers par commune
QUARTIERS = {
    "Poitiers": ["Centre-Ville", "Les Couronneries", "Saint-Éloi", "Chilvert", "Beaulieu", "Trois Cités", "La Gibauderie", "Bellejouanne"],
    "Buxerolles": ["Centre", "Les Castors", "Le Planty"],
    "Saint-Benoît": ["Centre", "Passelourdain", "La Cueille"],
    "Chasseneuil-du-Poitou": ["Centre", "Futuroscope", "Les Touches"],
    "Migné-Auxances": ["Centre", "La Grange", "Belle-Croix"],
}

# Sample item titles
ITEM_TITLES = {
    "donation": [
        "Canapé en bon état", "Livres enfants", "Vêtements bébé", "Jouets divers",
        "Vaisselle complète", "Lampes de chevet", "Table basse", "Chaises de jardin"
    ],
    "sale": [
        "iPhone 12 occasion", "Vélo VTT", "Console PS4", "Meuble TV",
        "Machine à café", "Aspirateur Dyson", "Télévision 55\"", "Trottinette électrique"
    ],
    "rent": [
        "Perceuse Bosch", "Tondeuse thermique", "Karcher K5", "Remorque voiture",
        "Appareil raclette 8p", "Projecteur vidéo", "Tente 4 places", "Débroussailleuse"
    ]
}

CATEGORIES = ["Électronique", "Mobilier", "Vêtements", "Jardin", "Sports", "Cuisine", "Bricolage", "Loisirs"]

async def seed_simulation():
    print(f"Connecting to MongoDB: {DB_NAME}")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Create fake users first
    print("\n📝 Creating simulation users...")
    user_ids = []
    for i in range(50):
        user = {
            "email": f"user{i}@simulation.yondly.com",
            "display_name": f"Utilisateur Simulation {i+1}",
            "password_hash": "simulation",
            "is_simulation": True,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 90))
        }
        result = await db.users.insert_one(user)
        user_ids.append(result.inserted_id)
    print(f"  ✅ Created {len(user_ids)} simulation users")
    
    # Create items for each commune
    print("\n📦 Creating simulation items...")
    total_items = 0
    
    for commune_data in COMMUNES_DATA:
        commune = commune_data["name"]
        quartiers = QUARTIERS.get(commune, ["Centre"])
        
        # Donations
        for _ in range(commune_data["donations"]):
            item = create_item("donation", commune, quartiers, user_ids)
            await db.items.insert_one(item)
            total_items += 1
        
        # Sales
        for _ in range(commune_data["sales"]):
            item = create_item("sale", commune, quartiers, user_ids)
            await db.items.insert_one(item)
            total_items += 1
        
        # Rentals
        for _ in range(commune_data["rentals"]):
            item = create_item("rent", commune, quartiers, user_ids)
            await db.items.insert_one(item)
            total_items += 1
        
        print(f"  ✅ {commune}: {commune_data['items']} items")
    
    # Create some completed orders for CO2 stats
    print("\n🛒 Creating simulation orders...")
    items = await db.items.find({"is_simulation": True}).to_list(100)
    orders_created = 0
    
    for item in items[:50]:  # Create 50 orders
        order = {
            "item_id": item["_id"],
            "buyer_id": random.choice(user_ids),
            "seller_id": item.get("seller_id"),
            "status": "completed",
            "total_amount": item.get("price", 0),
            "is_simulation": True,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30))
        }
        await db.orders.insert_one(order)
        orders_created += 1
    
    print(f"  ✅ Created {orders_created} completed orders")
    
    # Summary
    print("\n" + "="*50)
    print("📊 SIMULATION DATA SUMMARY")
    print("="*50)
    print(f"Users created: {len(user_ids)}")
    print(f"Items created: {total_items}")
    print(f"Orders created: {orders_created}")
    print(f"CO2 estimated: {orders_created * 3.75} kg")
    print("\n✅ Done! Refresh the Collectivités dashboard to see the data.")
    
    client.close()

def create_item(item_type, commune, quartiers, user_ids):
    titles = ITEM_TITLES.get(item_type, ["Item"])
    quartier = random.choice(quartiers)
    
    item = {
        "type": item_type,
        "title": random.choice(titles),
        "description": f"Article disponible à {commune}",
        "category": random.choice(CATEGORIES),
        "status": random.choice(["available", "sold", "completed"]),
        "seller_id": random.choice(user_ids),
        "location": {
            "city": commune,
            "neighborhood": quartier,
            "street": f"Rue de {'la Paix' if random.random() > 0.5 else 'la République'}",
            "lat": 46.58 + random.uniform(-0.05, 0.05),
            "lng": 0.34 + random.uniform(-0.05, 0.05)
        },
        "is_simulation": True,
        "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 60))
    }
    
    if item_type == "sale":
        item["price"] = random.choice([5, 10, 15, 20, 25, 30, 50, 75, 100, 150])
    elif item_type == "rent":
        item["price"] = random.choice([5, 10, 15, 20, 25])
        item["rental_period"] = random.choice(["day", "weekend", "week"])
    
    return item

if __name__ == "__main__":
    asyncio.run(seed_simulation())
