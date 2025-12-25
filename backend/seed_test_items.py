#!/usr/bin/env python3
"""
Script to generate test items around a specific location.
Usage: python seed_test_items.py --lat 48.8566 --lng 2.3522 --count 50 --radius 5
"""

import argparse
import random
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path to import from backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, Item, User
from sqlalchemy import select
import math

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

# French street names for realistic addresses
STREET_NAMES = [
    'Rue de la République', 'Avenue Jean Jaurès', 'Boulevard Victor Hugo',
    'Rue du Commerce', 'Place de la Mairie', 'Rue des Écoles',
    'Avenue de la Liberté', 'Rue Pasteur', 'Boulevard Gambetta',
    'Rue Voltaire', 'Avenue Foch', 'Rue de la Paix',
]

def generate_random_location(center_lat, center_lng, radius_km):
    """Generate random coordinates within radius_km of center point."""
    # Convert radius from km to degrees (approximate)
    radius_deg = radius_km / 111.0  # 1 degree ≈ 111 km
    
    # Random angle and distance
    angle = random.uniform(0, 2 * math.pi)
    distance = random.uniform(0, radius_deg)
    
    # Calculate new coordinates
    lat = center_lat + (distance * math.cos(angle))
    lng = center_lng + (distance * math.sin(angle))
    
    return round(lat, 6), round(lng, 6)

def create_test_user(db):
    """Create or get a test user for seeding."""
    test_email = "test_seed@example.com"
    
    # Check if user exists
    stmt = select(User).where(User.email == test_email)
    user = db.execute(stmt).scalar_one_or_none()
    
    if not user:
        user = User(
            email=test_email,
            username="TestSeeder",
            hashed_password="$2b$12$dummy",  # Dummy hash
            phone="+33612345678",
            photo_url="https://via.placeholder.com/150"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user

def generate_items(center_lat, center_lng, count, radius_km):
    """Generate test items around a location."""
    db = SessionLocal()
    
    try:
        # Get or create test user
        user = create_test_user(db)
        print(f"Using user: {user.username} (ID: {user.id})")
        
        items_created = 0
        
        for i in range(count):
            # Random category
            category = random.choice(CATEGORIES)
            
            # Get template if available, otherwise generic
            if category in ITEM_TEMPLATES:
                template = random.choice(ITEM_TEMPLATES[category])
                title, description, min_price, max_price = template
                price_cents = random.randint(min_price * 100, max_price * 100)
            else:
                title = f"Item {category} #{i+1}"
                description = f"Description pour {title}"
                price_cents = random.randint(1000, 50000)
            
            # Random type
            item_type = random.choice(['sale', 'sale', 'rent', 'donation'])  # More sales
            
            # Generate location
            lat, lng = generate_random_location(center_lat, center_lng, radius_km)
            
            # Create item
            item_data = {
                'type': item_type,
                'title': title,
                'description': description,
                'photos': [f'https://via.placeholder.com/400x300?text={category}'],
                'category': category,
                'location': {'lat': lat, 'lng': lng},
                'radius_km': random.randint(1, 10),
                'allow_offers': random.choice([True, False]),
                'status': 'available',
                'owner_id': user.id,
            }
            
            # Add type-specific fields
            if item_type == 'sale':
                item_data['price_cents'] = price_cents
                item_data['condition'] = random.choice(['new', 'like_new', 'good', 'fair'])
            elif item_type == 'rent':
                item_data['price_per_day_cents'] = random.randint(500, 5000)
                item_data['deposit_cents'] = random.randint(5000, 20000)
                item_data['max_duration_days'] = random.randint(7, 30)
                item_data['condition'] = random.choice(['new', 'like_new', 'good'])
            elif item_type == 'donation':
                item_data['food_type'] = random.choice(['perishable', 'non_perishable'])
                item_data['urgency_hours'] = random.randint(6, 72)
                expires_at = datetime.utcnow() + timedelta(hours=item_data['urgency_hours'])
                item_data['expires_at'] = expires_at
            
            item = Item(**item_data)
            db.add(item)
            items_created += 1
            
            if (i + 1) % 10 == 0:
                print(f"Created {i + 1}/{count} items...")
        
        db.commit()
        print(f"\n✅ Successfully created {items_created} test items!")
        print(f"📍 Center: ({center_lat}, {center_lng})")
        print(f"📏 Radius: {radius_km} km")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description='Generate test items around a location')
    parser.add_argument('--lat', type=float, required=True, help='Center latitude')
    parser.add_argument('--lng', type=float, required=True, help='Center longitude')
    parser.add_argument('--count', type=int, default=50, help='Number of items to generate')
    parser.add_argument('--radius', type=float, default=5.0, help='Radius in kilometers')
    
    args = parser.parse_args()
    
    print(f"🌍 Generating {args.count} test items...")
    print(f"📍 Center: ({args.lat}, {args.lng})")
    print(f"📏 Radius: {args.radius} km\n")
    
    generate_items(args.lat, args.lng, args.count, args.radius)

if __name__ == '__main__':
    main()
