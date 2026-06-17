#!/usr/bin/env python3
"""Create anti-gaspi deals in Poitiers"""
from pymongo import MongoClient
from datetime import datetime, timedelta
import uuid
import bcrypt
import os

# Load env manually
from pathlib import Path
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if '=' in line and not line.startswith('#'):
            key, val = line.split('=', 1)
            os.environ[key.strip()] = val.strip()

client = MongoClient(os.environ['MONGO_URL'], tls=True)
db = client[os.environ['DB_NAME']]

print("🧺 Creating Anti-Gaspi Deals in Poitiers...\n")

# Get boulangerie owner
boulangerie_user = db.users.find_one({'email': 'boulangerie.martin@test.com'})
if not boulangerie_user:
    print("❌ Boulangerie Martin user not found!")
    exit(1)

owner_id = boulangerie_user['_id']

# Get or create store
store = db.stores.find_one({'owner_id': owner_id})
if store:
    store_id = store['_id']
    print(f"✅ Using existing store: {store.get('name')}")
else:
    store_id = str(uuid.uuid4())
    db.stores.insert_one({
        '_id': store_id,
        'owner_id': owner_id,
        'name': 'Boulangerie Martin',
        'address': '12 Rue de la République, 86000 Poitiers',
        'location': {'lat': 46.5833, 'lng': 0.3333},
        'category': 'Boulangerie',
        'services': ['anti_waste'],
        'created_at': datetime.utcnow()
    })
    print("✅ Created store: Boulangerie Martin")

# Delete old deals to refresh
db.deals.delete_many({'owner_id': owner_id})
print("🗑️  Cleared old deals\n")

# Create new deals
deals = [
    {'title': 'Panier Surprise Sucré', 'desc': 'Croissants, pains au chocolat et viennoiseries du jour', 'orig': 15.00, 'deal': 4.99, 'qty': 5, 'susp': 2},
    {'title': 'Panier Surprise Salé', 'desc': 'Quiches, sandwiches et salades fraîches', 'orig': 12.00, 'deal': 3.99, 'qty': 4, 'susp': 1},
    {'title': 'Pain du Jour', 'desc': 'Baguettes, pains spéciaux et campagne', 'orig': 8.00, 'deal': 2.99, 'qty': 10, 'susp': 3},
    {'title': 'Box Pâtisseries', 'desc': 'Éclairs, tartes et macarons du jour', 'orig': 20.00, 'deal': 7.99, 'qty': 3, 'susp': 1},
    {'title': 'Petit-Déjeuner Complet', 'desc': 'Croissant, pain, confiture et jus', 'orig': 10.00, 'deal': 4.00, 'qty': 6, 'susp': 2},
    {'title': 'Panier Fruits & Légumes', 'desc': '3-4kg de produits frais locaux', 'orig': 18.00, 'deal': 6.99, 'qty': 8, 'susp': 3},
    {'title': 'Panier Bio', 'desc': 'Produits bio locaux variés', 'orig': 22.00, 'deal': 8.99, 'qty': 4, 'susp': 2},
    {'title': 'Panier Famille', 'desc': 'Grand panier pour 4 personnes', 'orig': 28.00, 'deal': 10.99, 'qty': 3, 'susp': 1},
]

total_suspended = 0
for deal in deals:
    deal_doc = {
        '_id': str(uuid.uuid4()),
        'store_id': store_id,
        'owner_id': owner_id,
        'title': deal['title'],
        'description': deal['desc'],
        'original_price': deal['orig'],
        'deal_price': deal['deal'],
        'discount_value': int(((deal['orig'] - deal['deal']) / deal['orig']) * 100),
        'discount_type': 'percentage',
        'category': 'Food',
        'status': 'active',
        'quantity': deal['qty'],
        'remaining': deal['qty'] - 1,
        'expires_at': datetime.utcnow() + timedelta(hours=8),
        'pickup_start': '17:00',
        'pickup_end': '19:30',
        'allow_suspension': deal['susp'] > 0,
        'suspended_quantity': deal['susp'],
        'suspended_available': deal['susp'],
        'photos': [],
        'created_at': datetime.utcnow()
    }
    db.deals.insert_one(deal_doc)
    savings = deal_doc['discount_value']
    total_suspended += deal['susp']
    print(f"✅ {deal['title']:25} {deal['deal']:>5.2f}€ (était {deal['orig']:.2f}€, -{savings}%) | 🎁 {deal['susp']} suspendus")

# Summary
total = db.deals.count_documents({'status': 'active'})
print(f"\n{'='*60}")
print(f"📊 Total paniers anti-gaspi actifs: {total}")
print(f"🎁 Total paniers suspendus disponibles: {total_suspended}")
print(f"📍 Localisation: Poitiers (86000)")
print(f"🕐 Collecte: 17h00 - 19h30")
