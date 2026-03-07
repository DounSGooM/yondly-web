"""
Seed script: Creates fake users (clients + PROs) and fake listings
across ALL categories in Poitiers for testing purposes.
"""
import asyncio
import uuid
import random
from datetime import datetime, timedelta

import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import db
from auth_utils import hash_password

# Poitiers coordinates (centre-ville + nearby variations)
POITIERS_CENTER = [0.3404, 46.5802]  # [lng, lat]

def poitiers_location():
    """Return a slightly randomized location around Poitiers centre."""
    lng = POITIERS_CENTER[0] + random.uniform(-0.02, 0.02)
    lat = POITIERS_CENTER[1] + random.uniform(-0.015, 0.015)
    return {"type": "Point", "coordinates": [round(lng, 5), round(lat, 5)]}

CATEGORIES = [
    'Maison', 'Vêtements', 'Électronique', 'Multimédia', 'Véhicules',
    'Sport', 'Livres', 'Enfants', 'Jeux & Jouets', 'Jardin',
    'Bricolage', 'Beauté', 'Animaux', 'Musique', 'Mobilier', 'Autre'
]

# Fake users (8 particuliers + 4 pros)
FAKE_CLIENTS = [
    {"first": "Léa",     "last": "Martin",   "display": "Léa M.",       "email": "lea.martin@test.yondly.app"},
    {"first": "Hugo",    "last": "Bernard",   "display": "Hugo B.",      "email": "hugo.bernard@test.yondly.app"},
    {"first": "Camille", "last": "Dubois",    "display": "Camille D.",   "email": "camille.dubois@test.yondly.app"},
    {"first": "Lucas",   "last": "Moreau",    "display": "Lucas M.",     "email": "lucas.moreau@test.yondly.app"},
    {"first": "Emma",    "last": "Leroy",     "display": "Emma L.",      "email": "emma.leroy@test.yondly.app"},
    {"first": "Nathan",  "last": "Roux",      "display": "Nathan R.",    "email": "nathan.roux@test.yondly.app"},
    {"first": "Chloé",   "last": "Fournier",  "display": "Chloé F.",     "email": "chloe.fournier@test.yondly.app"},
    {"first": "Théo",    "last": "Girard",    "display": "Théo G.",      "email": "theo.girard@test.yondly.app"},
]

FAKE_PROS = [
    {"first": "Pierre",  "last": "Bonnet",  "display": "BricoPoitou",      "email": "bricopoitou@test.yondly.app",    "biz": "BricoPoitou SAS",     "siret": "12345678900001"},
    {"first": "Sophie",  "last": "Petit",   "display": "VéloCité Poitiers","email": "velocite@test.yondly.app",        "biz": "VéloCité SARL",       "siret": "12345678900002"},
    {"first": "Antoine", "last": "Durand",  "display": "TechRepair86",     "email": "techrepair86@test.yondly.app",    "biz": "TechRepair86 SAS",    "siret": "12345678900003"},
    {"first": "Marie",   "last": "Lambert",  "display": "BioBoutique",     "email": "bioboutique@test.yondly.app",     "biz": "BioBoutique EURL",    "siret": "12345678900004"},
]

# ── Fake items per category ────────────────────────────────────────────
# Each entry: (title, description, type, price_cents, condition, [tags], [photo_urls])
FAKE_ITEMS = {
    "Maison": [
        ("Aspirateur Dyson V8", "Très bon état, batterie tient 30min", "sale", 12000, "good", ["aspirateur", "ménage"],
         ["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=400&fit=crop"]),
        ("Lot de 6 assiettes en porcelaine", "Jamais utilisées, encore dans le carton", "sale", 1500, "new", ["vaisselle"],
         ["https://images.unsplash.com/photo-1603199506016-5d54be9bae40?w=400&h=400&fit=crop"]),
        ("Lampe de bureau LED articulée", "Petit prix cause déménagement", "sale", 500, "good", ["lampe", "bureau"],
         ["https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=400&fit=crop"]),
    ],
    "Vêtements": [
        ("Veste en cuir homme taille L", "Marque Schott, excellent état", "sale", 8500, "good", ["cuir", "homme"],
         ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop"]),
        ("Lot de vêtements bébé 6-12 mois", "Très bon état, lot complet", "sale", 1500, "good", ["bébé", "lot"],
         ["https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&h=400&fit=crop"]),
        ("Robe d'été fleurie taille M", "Portée une seule fois", "sale", 2000, "new", ["femme", "été"],
         ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop"]),
    ],
    "Électronique": [
        ("iPhone 13 128Go", "Reconditionné, batterie 92%", "sale", 35000, "good", ["iphone", "apple"],
         ["https://images.unsplash.com/photo-1632633173522-47456de71b68?w=400&h=400&fit=crop"]),
        ("Écouteurs Sony WH-1000XM4", "Boîte complète", "sale", 18000, "good", ["casque", "sony"],
         ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop"]),
        ("Chargeur MacBook USB-C 67W", "Officiel Apple", "sale", 1500, "good", ["chargeur", "apple"],
         ["https://images.unsplash.com/photo-1585338107529-13afc25806f9?w=400&h=400&fit=crop"]),
    ],
    "Multimédia": [
        ("TV Samsung 55\" 4K", "Smart TV, 2 ans, parfait état", "sale", 30000, "good", ["tv", "samsung"],
         ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop"]),
        ("Console PS5 + 2 manettes", "Très peu utilisée", "sale", 40000, "good", ["ps5", "playstation"],
         ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop"]),
        ("Projecteur BenQ portable", "Location à la journée, idéal soirées", "rent", 2500, "good", ["projecteur", "cinéma"],
         ["https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=400&h=400&fit=crop"]),
    ],
    "Véhicules": [
        ("Vélo électrique Nakamura", "Batterie neuve, 80km autonomie", "sale", 65000, "good", ["vélo", "électrique"],
         ["https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=400&fit=crop"]),
        ("Trottinette Xiaomi Pro 2", "Parfait état, 500km au compteur", "sale", 25000, "good", ["trottinette"],
         ["https://images.unsplash.com/photo-1604868189265-219ba553b800?w=400&h=400&fit=crop"]),
        ("Porte-vélo attelage 3 vélos", "Location week-end", "rent", 1500, "good", ["porte-vélo"],
         ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop"]),
    ],
    "Sport": [
        ("Raquette de tennis Wilson Pro", "Cordage neuf", "sale", 4500, "good", ["tennis"],
         ["https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&h=400&fit=crop"]),
        ("Tapis de yoga + briques", "Très bon état", "sale", 1000, "good", ["yoga"],
         ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop"]),
        ("Kayak gonflable 2 places", "Location journée, avec pagaies", "rent", 3500, "new", ["kayak", "nautique"],
         ["https://images.unsplash.com/photo-1526095179574-86e545346ae6?w=400&h=400&fit=crop"]),
    ],
    "Livres": [
        ("Lot de 15 romans policiers", "Polar et thrillers", "sale", 1500, "good", ["romans", "lot"],
         ["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop"]),
        ("Harry Potter intégrale FR", "Les 7 tomes, édition Gallimard", "sale", 3500, "good", ["harry potter"],
         ["https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400&h=400&fit=crop"]),
        ("Manuel scolaire Terminale S 2025", "Maths + Physique", "sale", 2000, "good", ["scolaire"],
         ["https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=400&fit=crop"]),
    ],
    "Enfants": [
        ("Poussette Yoyo Babyzen", "Très bon état, pliage compact", "sale", 18000, "good", ["poussette", "bébé"],
         ["https://images.unsplash.com/photo-1586048018532-0b5940c58e4c?w=400&h=400&fit=crop"]),
        ("Lot jouets éveil 0-3 ans", "Jouets en bois, parfait état", "sale", 1200, "good", ["jouets", "bébé"],
         ["https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop"]),
        ("Siège auto groupe 2/3 Cybex", "Utilisé 1 an, impeccable", "sale", 8000, "good", ["siège auto"],
         ["https://images.unsplash.com/photo-1609220361138-fe73ef0e6115?w=400&h=400&fit=crop"]),
    ],
    "Jeux & Jouets": [
        ("LEGO Technic Porsche 911", "Neuf, encore scellé", "sale", 12000, "new", ["lego"],
         ["https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=400&h=400&fit=crop"]),
        ("Monopoly + Cluedo + Risk", "Lot de jeux de société", "sale", 2500, "good", ["jeux de société"],
         ["https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&h=400&fit=crop"]),
        ("Drone DJI Mini 3", "Location pour la journée", "rent", 4000, "good", ["drone", "dji"],
         ["https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=400&fit=crop"]),
    ],
    "Jardin": [
        ("Tondeuse thermique Honda", "Démarre au quart de tour", "sale", 15000, "good", ["tondeuse"],
         ["https://images.unsplash.com/photo-1590212151175-e58edd96185b?w=400&h=400&fit=crop"]),
        ("Lot outils de jardin", "Pelle, râteau, sécateur", "sale", 1000, "good", ["outils"],
         ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop"]),
        ("Taille-haie électrique Bosch", "Location week-end", "rent", 2000, "good", ["taille-haie"],
         ["https://images.unsplash.com/photo-1598902108854-d1446614e0f9?w=400&h=400&fit=crop"]),
        ("Tomates du potager farcies", "Grosse récolte de tomates cerises et cœur de bœuf ! À venir chercher.", "donation", 0, "good", ["légumes", "jardin", "tomates"],
         ["https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=400&fit=crop"]),
        ("Boutures de Monstera", "Plusieurs boutures racinées de ma Monstera Deliciosa.", "donation", 0, "good", ["plante", "bouture", "monstera"],
         ["https://images.unsplash.com/photo-1612363228113-ddec8ce35a82?w=400&h=400&fit=crop"]),
    ],
    "Bricolage": [
        ("Perceuse visseuse Makita 18V", "2 batteries + chargeur", "sale", 9000, "good", ["perceuse", "makita"],
         ["https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop"]),
        ("Échafaudage roulant 4m", "Location semaine pour travaux", "rent", 5000, "good", ["échafaudage"],
         ["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=400&fit=crop"]),
        ("Lot de vis/chevilles/boulons", "Grand lot, parfait pour dépanner", "sale", 500, "new", ["visserie"],
         ["https://images.unsplash.com/photo-1586864387789-628af9feed72?w=400&h=400&fit=crop"]),
    ],
    "Beauté": [
        ("Lisseur GHD Platinum+", "Comme neuf, utilisé 3 fois", "sale", 12000, "new", ["lisseur", "ghd"],
         ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop"]),
        ("Lot maquillage MAC + Urban Decay", "Jamais ouvert", "sale", 4500, "new", ["maquillage"],
         ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop"]),
        ("Miroir LED grossissant", "Neuf, encore dans sa boite", "sale", 1500, "good", ["miroir"],
         ["https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400&h=400&fit=crop"]),
    ],
    "Animaux": [
        ("Cage pour lapin XL", "Avec accessoires, très bon état", "sale", 4000, "good", ["lapin", "cage"],
         ["https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=400&fit=crop"]),
        ("Arbre à chat 1m80", "Grand modèle, parfait état", "sale", 2500, "good", ["chat"],
         ["https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400&h=400&fit=crop"]),
        ("Aquarium 100L complet", "Filtre, éclairage, décor inclus", "sale", 7000, "good", ["aquarium"],
         ["https://images.unsplash.com/photo-1520301255226-bf5f144451c1?w=400&h=400&fit=crop"]),
    ],
    "Musique": [
        ("Guitare acoustique Yamaha FG800", "Son incroyable", "sale", 15000, "good", ["guitare"],
         ["https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop"]),
        ("Clavier MIDI Arturia MiniLab", "Parfait pour débuter", "sale", 3000, "good", ["midi", "clavier"],
         ["https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=400&fit=crop"]),
        ("Enceinte JBL Partybox 110", "Location soirée/week-end", "rent", 3000, "good", ["enceinte", "jbl"],
         ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop"]),
    ],
    "Mobilier": [
        ("Canapé 3 places gris", "Tissu, très confortable", "sale", 20000, "good", ["canapé"],
         ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop"]),
        ("Bureau en bois massif 140cm", "Quelques rayures, solide", "sale", 8000, "good", ["bureau"],
         ["https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=400&fit=crop"]),
        ("Étagère IKEA Kallax 4x4", "Démontée, prête à emporter", "sale", 2500, "good", ["étagère", "ikea"],
         ["https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=400&fit=crop"]),
    ],
    "Autre": [
        ("Machine à coudre Singer", "Fonctionne parfaitement", "sale", 6000, "good", ["couture"],
         ["https://images.unsplash.com/photo-1605183293756-e0846e5ffa26?w=400&h=400&fit=crop"]),
        ("Valise cabine Samsonite", "Légère, roulettes 360°", "sale", 5000, "good", ["valise"],
         ["https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400&h=400&fit=crop"]),
        ("Jumelles Nikon 10x42", "Location randonnée/week-end", "rent", 1500, "good", ["jumelles"],
         ["https://images.unsplash.com/photo-1502982899975-893c9cf39028?w=400&h=400&fit=crop"]),
        ("Lot boîtes de conserves et pâtes", "Suite déménagement, donne conserves longue conservation et paquets de pâtes scellés.", "donation", 0, "good", ["nourriture", "non périssable", "conserves"],
         ["https://images.unsplash.com/photo-1599384594615-5853f58a3f81?w=400&h=400&fit=crop"]),
        ("Pommes du verger", "On a trop de pommes cette année, venez avec votre cabas !", "donation", 0, "good", ["fruits", "pommes", "verger"],
         ["https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&h=400&fit=crop"]),
    ],
}

PASSWORD = "Test1234!"

async def seed():
    print("🌱 Seeding Poitiers data...")
    
    # ── Clean previous seed data ──
    print("🧹 Cleaning previous seed data...")
    await db.users.delete_many({"email": {"$regex": "@test.yondly.app$"}})
    await db.items.delete_many({"_seed": True})
    await db.trader_verifications.delete_many({"_seed": True})
    await db.pro_profiles.delete_many({"_seed": True})
    await db.stores.delete_many({"_seed": True})
    await db.deals.delete_many({"_seed": True})
    
    user_ids = []
    pro_user_ids = []
    
    # ── Create Client Users ──
    print("👤 Creating 8 client users...")
    for c in FAKE_CLIENTS:
        uid = f"usr_{uuid.uuid4().hex}"
        user_ids.append(uid)
        await db.users.insert_one({
            "id": uid,
            "email": c["email"],
            "password_hash": hash_password(PASSWORD),
            "display_name": c["display"],
            "first_name": c["first"],
            "last_name": c["last"],
            "role": "USER",
            "is_verified": True,
            "email_verified": True,
            "bio": f"Habitant(e) de Poitiers, utilise Yondly au quotidien !",
            "city": "Poitiers",
            "postal_code": "86000",
            "location": poitiers_location(),
            "created_at": datetime.utcnow() - timedelta(days=random.randint(5, 60)),
            "updated_at": datetime.utcnow(),
            "_seed": True,
        })
        print(f"   ✅ {c['display']} ({c['email']})")
    
    # ── Create PRO Users ──
    print("🏪 Creating 4 PRO users...")
    for p in FAKE_PROS:
        uid = f"usr_{uuid.uuid4().hex}"
        pro_user_ids.append(uid)
        await db.users.insert_one({
            "id": uid,
            "email": p["email"],
            "password_hash": hash_password(PASSWORD),
            "display_name": p["display"],
            "first_name": p["first"],
            "last_name": p["last"],
            "role": "PRO",
            "is_verified": True,
            "email_verified": True,
            "bio": f"Commerçant local à Poitiers – {p['biz']}",
            "city": "Poitiers",
            "postal_code": "86000",
            "location": poitiers_location(),
            "created_at": datetime.utcnow() - timedelta(days=random.randint(10, 90)),
            "updated_at": datetime.utcnow(),
            "_seed": True,
        })
        
        # Add verification
        verif_id = f"verif_{uuid.uuid4().hex}"
        await db.trader_verifications.insert_one({
            "id": verif_id,
            "pro_id": uid,
            "legal_name": p["biz"],
            "trade_name": p["display"],
            "business_type": "company",
            "siret": p["siret"],
            "address_line1": f"{random.randint(1,99)} Rue de la Tranchée",
            "postal_code": "86000",
            "city": "Poitiers",
            "country": "FR",
            "representative_first_name": p["first"],
            "representative_last_name": p["last"],
            "contact_email": p["email"],
            "status": "APPROVED",
            "submitted_at": datetime.utcnow() - timedelta(days=30),
            "verified_at": datetime.utcnow() - timedelta(days=28),
            "_seed": True,
        })
        
        # Add pro profile
        await db.pro_profiles.insert_one({
            "id": f"pro_{uuid.uuid4().hex}",
            "user_id": uid,
            "business_name": p["biz"],
            "siret": p["siret"],
            "stripe_account_id": f"acct_fake_{uuid.uuid4().hex[:12]}",
            "payouts_enabled": True,
            "created_at": datetime.utcnow() - timedelta(days=28),
            "_seed": True,
        })
        
        # Add Store for Anti-gaspi 
        store_id = f"store_{uuid.uuid4().hex}"
        loc = poitiers_location()
        await db.stores.insert_one({
            "id": store_id,
            "owner_id": uid,
            "name": p["biz"],
            "description": f"Commerce local: {p['biz']}",
            "lat": loc["coordinates"][1],
            "lng": loc["coordinates"][0],
            "logo": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop" if "Bio" in p["biz"] else "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop",
            "created_at": datetime.utcnow() - timedelta(days=28),
            "category": "Alimentation",
            "_seed": True
        })
        
        # Add Anti-gaspi Deal for some stores (BioBoutique gets food deals)
        if "BioBoutique" in p["biz"]:
            await db.deals.insert_one({
                "id": f"deal_{uuid.uuid4().hex}",
                "store_id": store_id,
                "title": "Panier anti-gaspi Légumes Bio",
                "description": "Légumes de la veille, légèrement flétris mais parfaits pour la soupe !",
                "original_price": 12.0,
                "deal_price": 3.99,
                "discount_value": 66,
                "discount_type": "percentage",
                "category": "Food",
                "status": "active",
                "expires_at": datetime.utcnow() + timedelta(days=1),
                "created_at": datetime.utcnow() - timedelta(hours=2),
                "_seed": True
            })
            await db.deals.insert_one({
                "id": f"deal_{uuid.uuid4().hex}",
                "store_id": store_id,
                "title": "Produits frais (Yaourts DLC courte)",
                "description": "Lot de 6 yaourts artisanaux, DLC ce soir",
                "original_price": 6.50,
                "deal_price": 2.50,
                "discount_value": 61,
                "discount_type": "percentage",
                "category": "Food",
                "status": "active",
                "expires_at": datetime.utcnow() + timedelta(hours=8),
                "created_at": datetime.utcnow() - timedelta(hours=1),
                "_seed": True
            })
            print(f"   🍏 {p['display']} a publié 2 offres anti-gaspi")
        
        print(f"   ✅ {p['display']} ({p['email']}) – vérifié ✓")
    
    all_user_ids = user_ids + pro_user_ids
    
    # ── Create Items ──
    print(f"📦 Creating items across {len(CATEGORIES)} categories...")
    item_count = 0
    photo_idx = 0
    
    for cat, items in FAKE_ITEMS.items():
        for (title, desc, item_type, price, condition, tags, photos) in items:
            item_id = f"item_{uuid.uuid4().hex}"
            owner_id = random.choice(all_user_ids)
            
            # Only set expiration for specific types (like food donations)
            # Sales usually don't expire automatically
            expires_at = None
            if item_type == "donation" and "Food" in cat:
                expires_at = datetime.utcnow() + timedelta(days=2)
                
            item_doc = {
                "id": item_id,
                "type": item_type,
                "title": title,
                "description": desc,
                "photos": photos,
                "category": cat,
                "condition": condition,
                "tags": tags,
                "location": poitiers_location(),
                "radius_km": random.choice([3, 5, 10, 15]),
                "price_cents": price if item_type == "sale" else None,
                "price_per_day_cents": price if item_type == "rent" else None,
                "deposit_cents": price * 3 if item_type == "rent" else None,
                "max_duration_days": 7 if item_type == "rent" else None,
                "allow_offers": item_type == "sale" and price > 3000,
                "status": "active",
                "owner_id": owner_id,
                "created_at": datetime.utcnow() - timedelta(hours=random.randint(1, 720)),
                "expires_at": expires_at,
                "_seed": True,
            }
            
            await db.items.insert_one(item_doc)
            item_count += 1
        
        print(f"   📂 {cat}: {len(items)} annonces")
    
    print(f"\n🎉 Seed terminé !")
    print(f"   👤 {len(FAKE_CLIENTS)} clients créés")
    print(f"   🏪 {len(FAKE_PROS)} pros créés (vérifiés)")
    print(f"   📦 {item_count} annonces créées dans {len(CATEGORIES)} catégories")
    print(f"   📍 Tout est localisé à Poitiers (86000)")
    print(f"\n   🔑 Mot de passe universel : {PASSWORD}")
    print(f"   📧 Emails : *@test.yondly.app")

if __name__ == "__main__":
    asyncio.run(seed())
