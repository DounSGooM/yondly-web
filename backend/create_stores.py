#!/usr/bin/env python3
"""Create stores and deals for testing transactions"""
from pymongo import MongoClient
from datetime import datetime, timedelta
import uuid
import bcrypt
import os
from pathlib import Path

# Load env
env_path = Path(__file__).parent / '.env'
for line in env_path.read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, val = line.split('=', 1)
        os.environ[key.strip()] = val.strip()

client = MongoClient(os.environ['MONGO_URL'], tls=True)
db = client[os.environ['DB_NAME']]

print("🏪 Creating Stores in Poitiers...\n")

stores_data = [
    {
        'name': 'Épicerie Bio Verte',
        'email': 'epicerie.bio@test.com',
        'address': '8 Rue Carnot, 86000 Poitiers',
        'category': 'Épicerie',
        'location': {'lat': 46.5815, 'lng': 0.3390},
        'description': 'Épicerie bio locale - fruits, légumes et produits du terroir',
        'deals': [
            {'title': 'Panier Légumes Bio', 'desc': '3kg de légumes de saison', 'orig': 15.00, 'deal': 5.99},
            {'title': 'Panier Fruits Bio', 'desc': '2kg de fruits frais', 'orig': 12.00, 'deal': 4.99},
        ]
    },
    {
        'name': 'Pâtisserie Douceurs',
        'email': 'patisserie.douceurs@test.com',
        'address': '15 Rue des Grandes Écoles, 86000 Poitiers',
        'category': 'Pâtisserie',
        'location': {'lat': 46.5785, 'lng': 0.3410},
        'description': 'Pâtisserie artisanale - gâteaux, tartes et viennoiseries',
        'deals': [
            {'title': 'Box Pâtisseries', 'desc': 'Éclairs, religieuses et tartelettes', 'orig': 18.00, 'deal': 6.99},
            {'title': 'Viennoiseries du Jour', 'desc': 'Croissants et pains au chocolat', 'orig': 10.00, 'deal': 3.99},
        ]
    },
    {
        'name': 'Traiteur du Marché',
        'email': 'traiteur.marche@test.com',
        'address': '3 Place du Marché, 86000 Poitiers',
        'category': 'Traiteur',
        'location': {'lat': 46.5798, 'lng': 0.3425},
        'description': 'Traiteur - plats cuisinés maison et salades fraîches',
        'deals': [
            {'title': 'Panier Repas', 'desc': 'Plat + entrée + dessert', 'orig': 16.00, 'deal': 5.99},
            {'title': 'Salades Composées', 'desc': '2 grandes salades variées', 'orig': 12.00, 'deal': 4.49},
        ]
    },
    {
        'name': 'Fromagerie La Cave',
        'email': 'fromagerie.cave@test.com',
        'address': '22 Rue de la Cathédrale, 86000 Poitiers',
        'category': 'Fromagerie',
        'location': {'lat': 46.5810, 'lng': 0.3445},
        'description': 'Fromages artisanaux et produits laitiers',
        'deals': [
            {'title': 'Plateau Fromages', 'desc': 'Assortiment de 4-5 fromages', 'orig': 20.00, 'deal': 8.99},
        ]
    }
]

password_hash = bcrypt.hashpw('test1234'.encode(), bcrypt.gensalt()).decode()

for store_data in stores_data:
    # Check if store already exists
    existing = db.stores.find_one({'name': store_data['name']})
    if existing:
        print(f"⚠️  {store_data['name']} already exists")
        continue
    
    # Create user for store
    user_id = str(uuid.uuid4())
    user = {
        '_id': user_id,
        'id': user_id,
        'email': store_data['email'],
        'password_hash': password_hash,
        'display_name': store_data['name'],
        'is_partner': True,
        'is_pro': True,
        'pro_verified': True,
        'services': ['anti_waste', 'sale'],
        'city': 'Poitiers',
        'postcode': '86000',
        'location': store_data['location'],
        'created_at': datetime.utcnow()
    }
    db.users.insert_one(user)
    
    # Create store
    store_id = str(uuid.uuid4())
    store = {
        '_id': store_id,
        'id': store_id,
        'owner_id': user_id,
        'name': store_data['name'],
        'address': store_data['address'],
        'location': store_data['location'],
        'category': store_data['category'],
        'description': store_data['description'],
        'services': ['anti_waste'],
        'hours': {
            'monday': '08:00 - 19:00',
            'tuesday': '08:00 - 19:00',
            'wednesday': '08:00 - 19:00',
            'thursday': '08:00 - 19:00',
            'friday': '08:00 - 19:00',
            'saturday': '08:00 - 13:00',
            'sunday': None
        },
        'followers_count': 0,
        'created_at': datetime.utcnow()
    }
    db.stores.insert_one(store)
    print(f"✅ {store_data['name']} ({store_data['category']})")
    
    # Create deals for this store
    for deal in store_data['deals']:
        deal_id = str(uuid.uuid4())
        deal_doc = {
            '_id': deal_id,
            'id': deal_id,
            'store_id': store_id,
            'owner_id': user_id,
            'title': deal['title'],
            'description': deal['desc'],
            'original_price': deal['orig'],
            'deal_price': deal['deal'],
            'discount_value': int(((deal['orig'] - deal['deal']) / deal['orig']) * 100),
            'discount_type': 'percentage',
            'category': 'Food',
            'status': 'active',
            'quantity': 5,
            'remaining': 4,
            'expires_at': datetime.utcnow() + timedelta(hours=8),
            'pickup_start': '17:00',
            'pickup_end': '19:30',
            'allow_suspension': True,
            'suspended_quantity': 1,
            'suspended_available': 1,
            'photos': [],
            'created_at': datetime.utcnow()
        }
        db.deals.insert_one(deal_doc)
        print(f"   └─ {deal['title']} - {deal['deal']}€")

# Summary
stores_count = db.stores.count_documents({})
deals_count = db.deals.count_documents({'status': 'active'})
print(f"\n{'='*50}")
print(f"📊 Total magasins: {stores_count}")
print(f"🧺 Total paniers anti-gaspi: {deals_count}")
print(f"\n📋 Comptes Pro (mot de passe: test1234):")
for s in stores_data:
    print(f"   {s['email']}")
