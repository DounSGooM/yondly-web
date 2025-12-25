#!/usr/bin/env python3
"""
Script to generate test items around a specific location for MongoDB.
Usage: python3 seed_test_items_mongo.py --lat 48.8566 --lng 2.3522 --count 50 --radius 5
"""

import argparse
import random
import math
from datetime import datetime, timedelta
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection - use same as server.py
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'loop_db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Sample data for realistic items
CATEGORIES = [
    'electronics', 'furniture', 'clothing', 'sports', 'books', 
    'children', 'hobbies', 'home', 'vehicles', 'tools', 'other'
]

ITEM_TEMPLATES = {
    'electronics': [
        ('iPhone 12', 'Excellent état, avec boîte', 300, 450),
        ('MacBook Air', 'Parfait pour étudiant', 500, 800),
        ('PlayStation 5', 'Comme neuf', 400, 500),
        ('Écouteurs Bluetooth', 'Bonne qualité sonore', 30, 60),
        ('Tablette Samsung', 'Écran 10 pouces', 150, 250),
    ],
    'furniture': [
        ('Canapé 3 places', 'Tissu gris, très confortable', 200, 400),
        ('Table basse', 'Bois massif', 50, 100),
        ('Lit double', 'Avec matelas', 150, 300),
        ('Bureau', 'Idéal télétravail', 80, 150),
        ('Étagère IKEA', 'Billy blanc', 20, 40),
    ],
    'clothing': [
        ('Manteau hiver', 'Taille M, chaud', 40, 80),
        ('Jeans Levis', 'Taille 32', 30, 50),
        ('Robe de soirée', 'Portée une fois', 50, 100),
        ('Baskets Nike', 'Pointure 42', 60, 90),
        ('Veste en cuir', 'Vintage', 80, 150),
    ],
    'sports': [
        ('Vélo VTT', 'Bon état, révision récente', 200, 350),
        ('Raquette tennis', 'Wilson Pro', 40, 70),
        ('Tapis de yoga', 'Neuf', 15, 25),
        ('Haltères 10kg', 'Paire', 30, 50),
        ('Planche de surf', '6 pieds', 150, 250),
    ],
    'books': [
        ('Collection Harry Potter', 'Tous les tomes', 40, 60),
        ('Livres cuisine', 'Lot de 5', 20, 30),
        ('BD Tintin', 'Collection complète', 100, 150),
        ('Romans policiers', 'Lot de 10', 15, 25),
        ('Encyclopédie', 'Larousse 2020', 50, 80),
    ],
}

# Food items for donations only - NON-PERISHABLE ONLY
FOOD_ITEMS = [
    ('Pâtes', 'Paquets de pâtes non ouverts', 'non_perishable', 72),
    ('Riz', 'Sacs de riz blanc/complet', 'non_perishable', 72),
    ('Conserves légumes', 'Haricots, maïs, petits pois', 'non_perishable', 120),
    ('Conserves poisson', 'Thon, sardines, maquereaux', 'non_perishable', 120),
    ('Céréales', 'Boîtes de céréales non ouvertes', 'non_perishable', 48),
    ('Légumineuses', 'Lentilles, pois chiches secs', 'non_perishable', 72),
    ('Biscuits', 'Paquets fermés', 'non_perishable', 48),
    ('Huile', 'Bouteilles d\'huile d\'olive/tournesol', 'non_perishable', 120),
    ('Farine', 'Paquets de farine', 'non_perishable', 72),
    ('Sucre', 'Paquets de sucre', 'non_perishable', 120),
    ('Café', 'Paquets de café', 'non_perishable', 72),
    ('Thé', 'Boîtes de thé', 'non_perishable', 72),
]

def generate_random_location(center_lat, center_lng, radius_km):
    """Generate random coordinates within radius_km of center point."""
    radius_deg = radius_km / 111.0
    angle = random.uniform(0, 2 * math.pi)
    distance = random.uniform(0, radius_deg)
    lat = center_lat + (distance * math.cos(angle))
    lng = center_lng + (distance * math.sin(angle))
    return round(lat, 6), round(lng, 6)

def generate_id():
    """Generate a unique ID."""
    import uuid
    return str(uuid.uuid4())

async def create_test_user():
    """Create or get a test user for seeding."""
    test_email = "test_seed@example.com"
    
    user = await db.users.find_one({"email": test_email})
    
    if not user:
        user = {
            "id": generate_id(),
            "email": test_email,
            "username": "TestSeeder",
            "password_hash": "$2b$12$dummy",
            "phone": "+33612345678",
            "photo_url": "https://via.placeholder.com/150",
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(user)
        print(f"Created user: {user['username']} (ID: {user['id']})")
    else:
        print(f"Using existing user: {user['username']} (ID: {user['id']})")
    
    return user

async def generate_items(center_lat, center_lng, count, radius_km):
    """Generate test items around a location."""
    try:
        user = await create_test_user()
        items_created = 0
        
        for i in range(count):
            # Decide item type first
            item_type = random.choice(['sale', 'sale', 'rent', 'donation'])
            
            # For donations, use food items only
            if item_type == 'donation':
                food_item = random.choice(FOOD_ITEMS)
                title, description, food_type, urgency_hours = food_item
                category = 'food'  # Set category to food for donations
            else:
                # For sale/rent, use regular categories
                category = random.choice(CATEGORIES)
                
                if category in ITEM_TEMPLATES:
                    template = random.choice(ITEM_TEMPLATES[category])
                    title, description, min_price, max_price = template
                    price_cents = random.randint(min_price * 100, max_price * 100)
                else:
                    title = f"Item {category} #{i+1}"
                    description = f"Description pour {title}"
                    price_cents = random.randint(1000, 50000)
            
            lat, lng = generate_random_location(center_lat, center_lng, radius_km)
            
            item_data = {
                'id': generate_id(),
                'type': item_type,
                'title': title,
                'description': description,
                'photos': [f'https://via.placeholder.com/400x300?text={category}'],
                'category': category,
                'location': {'lat': lat, 'lng': lng},
                'radius_km': random.randint(1, 10),
                'allow_offers': random.choice([True, False]),
                'status': 'active',
                'owner_id': user['id'],
                'created_at': datetime.utcnow(),
            }
            
            if item_type == 'sale':
                item_data['price_cents'] = price_cents
                item_data['condition'] = random.choice(['new', 'like_new', 'good', 'fair'])
            elif item_type == 'rent':
                item_data['price_per_day_cents'] = random.randint(500, 5000)
                item_data['deposit_cents'] = random.randint(5000, 20000)
                item_data['max_duration_days'] = random.randint(7, 30)
                item_data['condition'] = random.choice(['new', 'like_new', 'good'])
            elif item_type == 'donation':
                item_data['food_type'] = food_type
                item_data['urgency_hours'] = urgency_hours
                expires_at = datetime.utcnow() + timedelta(hours=urgency_hours)
                item_data['expires_at'] = expires_at
            
            await db.items.insert_one(item_data)
            items_created += 1
            
            if (i + 1) % 10 == 0:
                print(f"Created {i + 1}/{count} items...")
        
        print(f"\n✅ Successfully created {items_created} test items!")
        print(f"📍 Center: ({center_lat}, {center_lng})")
        print(f"📏 Radius: {radius_km} km")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

async def main():
    parser = argparse.ArgumentParser(description='Generate test items around a location')
    parser.add_argument('--lat', type=float, required=True, help='Center latitude')
    parser.add_argument('--lng', type=float, required=True, help='Center longitude')
    parser.add_argument('--count', type=int, default=50, help='Number of items to generate')
    parser.add_argument('--radius', type=float, default=5.0, help='Radius in kilometers')
    
    args = parser.parse_args()
    
    print(f"🌍 Generating {args.count} test items...")
    print(f"📍 Center: ({args.lat}, {args.lng})")
    print(f"📏 Radius: {args.radius} km\n")
    
    await generate_items(args.lat, args.lng, args.count, args.radius)
    
    # Close connection
    client.close()

if __name__ == '__main__':
    asyncio.run(main())
