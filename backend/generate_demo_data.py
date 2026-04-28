"""
Demo Data Generator - Creates realistic demo data for B2G KPIs presentation
Coherent with existing data in the database.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone
import os
import random
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'yondly_db')

# Configuration aligned with Grand Poitiers
COMMUNES = {
    "Poitiers": {"weight": 40, "population": 88000, "quartiers": ["Centre-Ville", "Les Couronneries", "Saint-Éloi", "Chilvert", "Beaulieu", "Trois Cités", "La Gibauderie", "Bellejouanne"]},
    "Buxerolles": {"weight": 15, "population": 10000, "quartiers": ["Centre", "Les Castors", "Le Planty"]},
    "Saint-Benoît": {"weight": 10, "population": 7500, "quartiers": ["Centre", "Passelourdain", "La Cueille"]},
    "Chasseneuil-du-Poitou": {"weight": 8, "population": 5000, "quartiers": ["Centre", "Futuroscope", "Les Touches"]},
    "Migné-Auxances": {"weight": 7, "population": 6500, "quartiers": ["Centre", "La Grange", "Belle-Croix"]},
    "Vouneuil-sous-Biard": {"weight": 5, "population": 5500, "quartiers": ["Centre", "Les Musiciens"]},
    "Mignaloux-Beauvoir": {"weight": 5, "population": 4200, "quartiers": ["Centre", "La Chaume"]},
    "Fontaine-le-Comte": {"weight": 4, "population": 3800, "quartiers": ["Centre", "Bois de la Marche"]},
    "Montamisé": {"weight": 3, "population": 3500, "quartiers": ["Centre", "Les Musiciens"]},
    "Ligugé": {"weight": 3, "population": 3000, "quartiers": ["Centre", "Abbaye"]},
}

CATEGORIES = {
    "Mobilier": {"weight": 20, "price_range": (15, 200), "items": ["Canapé", "Table basse", "Buffet", "Lit 140", "Armoire", "Bureau", "Chaises (lot)"]},
    "Électronique": {"weight": 18, "price_range": (20, 300), "items": ["iPhone occasion", "Télévision", "Console PS4", "Ordinateur portable", "Tablette", "Enceinte Bluetooth"]},
    "Vêtements": {"weight": 15, "price_range": (3, 50), "items": ["Lot vêtements enfant", "Manteau hiver", "Chaussures", "Robe de soirée", "Jean Levis"]},
    "Jardin": {"weight": 12, "price_range": (10, 150), "items": ["Tondeuse", "Salon de jardin", "Barbecue", "Outils jardinage", "Pot de fleurs"]},
    "Sports": {"weight": 10, "price_range": (15, 200), "items": ["Vélo VTT", "Tapis yoga", "Haltères", "Trottinette", "Sac de sport"]},
    "Bricolage": {"weight": 10, "price_range": (10, 100), "items": ["Perceuse", "Scie circulaire", "Boîte à outils", "Escabeau"]},
    "Cuisine": {"weight": 8, "price_range": (5, 80), "items": ["Robot cuisine", "Service vaisselle", "Casseroles", "Machine café"]},
    "Loisirs": {"weight": 7, "price_range": (5, 100), "items": ["Livres (lot)", "Jeux de société", "Console vintage", "Vélo enfant"]},
}

STREETS = [
    "Rue de la République", "Avenue Victor Hugo", "Rue du Commerce", "Place du Marché",
    "Rue Jean Jaurès", "Boulevard Pasteur", "Rue Carnot", "Avenue de la Gare",
    "Rue Gambetta", "Rue du 8 Mai 1945", "Avenue Charles de Gaulle", "Rue Voltaire",
    "Rue Émile Zola", "Allée des Roses", "Rue du Parc", "Impasse des Lilas",
    "Place de la Mairie", "Rue des Écoles", "Rue de la Liberté", "Rue Pierre Curie"
]

PRENOMS = ["Marie", "Thomas", "Camille", "Lucas", "Emma", "Hugo", "Chloé", "Nathan", "Léa", "Antoine",
           "Julie", "Pierre", "Claire", "Nicolas", "Sophie", "Paul", "Laura", "Maxime", "Sarah", "Alexandre"]
NOMS = ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau",
        "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier"]


def weighted_choice(options: dict) -> str:
    """Choose an option based on weights."""
    total = sum(o.get("weight", 1) for o in options.values())
    r = random.uniform(0, total)
    cumulative = 0
    for name, data in options.items():
        cumulative += data.get("weight", 1)
        if r <= cumulative:
            return name
    return list(options.keys())[0]


def generate_user(index: int) -> dict:
    """Generate a realistic user."""
    prenom = random.choice(PRENOMS)
    nom = random.choice(NOMS)
    days_ago = random.randint(1, 180)  # Users created over 6 months

    return {
        "email": f"{prenom.lower()}.{nom.lower()}{index}@example.com",
        "display_name": f"{prenom} {nom[0]}.",
        "password_hash": "demo_password_hash",
        "is_pro": random.random() < 0.08,  # 8% pro users
        "email_verified": random.random() < 0.65,  # 65% verified
        "photo": f"https://randomuser.me/api/portraits/{'men' if random.random() > 0.5 else 'women'}/{random.randint(1, 99)}.jpg" if random.random() < 0.55 else None,
        "is_simulation": True,
        "is_demo": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 23))
    }


def generate_item(user_id, commune_name: str, commune_data: dict) -> dict:
    """Generate a realistic item listing."""
    category_name = weighted_choice(CATEGORIES)
    category = CATEGORIES[category_name]
    item_type = random.choices(["donation", "sale", "rent", "antigaspi"], weights=[25, 50, 15, 10])[0]

    title = random.choice(category["items"])
    if item_type == "antigaspi":
        title = random.choice(["Panier légumes", "Panier fruits", "Panier mixte", "Panier surprise", "Pain du jour"])

    quartier = random.choice(commune_data["quartiers"])
    street = random.choice(STREETS)

    days_ago = random.randint(0, 60)
    status = random.choices(["available", "sold", "reserved"], weights=[50, 40, 10])[0]

    item = {
        "title": title + (" en bon état" if random.random() < 0.3 else ""),
        "description": f"Article en très bon état, disponible à {commune_name}. Prix négociable.",
        "type": item_type,
        "category": "Anti-gaspi" if item_type == "antigaspi" else category_name,
        "status": status,
        "seller_id": user_id,
        "location": {
            "city": commune_name,
            "neighborhood": quartier,
            "street": street,
            "lat": 46.58 + random.uniform(-0.08, 0.08),
            "lng": 0.34 + random.uniform(-0.08, 0.08)
        },
        "is_simulation": True,
        "is_demo": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 23))
    }

    # Price based on type
    if item_type == "donation":
        item["price"] = 0
    elif item_type == "antigaspi":
        item["price"] = round(random.uniform(3.5, 7.99), 2)
    elif item_type == "rent":
        item["price"] = round(random.uniform(5, 30), 2)
        item["rental_period"] = random.choice(["day", "weekend", "week"])
    else:
        item["price"] = round(random.uniform(*category["price_range"]), 2)

    return item


def generate_order(item: dict, buyer_id, seller_id) -> dict:
    """Generate a completed order."""
    days_ago = random.randint(0, 30)

    return {
        "item_id": item["_id"],
        "buyer_id": buyer_id,
        "seller_id": seller_id,
        "status": random.choices(["completed", "pending", "cancelled"], weights=[75, 15, 10])[0],
        "total_amount": item.get("price", 0),
        "is_simulation": True,
        "is_demo": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=days_ago)
    }


def generate_message(sender_id, receiver_id, item_id) -> dict:
    """Generate a message/conversation."""
    messages_templates = [
        "Bonjour, est-ce toujours disponible ?",
        "Quel est le dernier prix ?",
        "Pouvez-vous livrer ?",
        "Je suis intéressé(e), on peut se voir ?",
        "Merci pour l'annonce !",
        "C'est noté, à bientôt !",
    ]

    return {
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "item_id": item_id,
        "content": random.choice(messages_templates),
        "is_simulation": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))
    }


def generate_review(reviewer_id, reviewed_id, order_id) -> dict:
    """Generate a review."""
    ratings = [5, 5, 5, 5, 4, 4, 4, 3]  # Weighted towards positive
    comments = [
        "Excellent vendeur, très réactif !",
        "Produit conforme, je recommande.",
        "Transaction rapide et efficace.",
        "Personne très agréable.",
        "Bon échange, merci !",
        "Super, rien à redire.",
    ]

    return {
        "reviewer_id": reviewer_id,
        "reviewed_id": reviewed_id,
        "order_id": order_id,
        "rating": random.choice(ratings),
        "comment": random.choice(comments),
        "is_simulation": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))
    }


async def generate_demo_data():
    """Main function to generate all demo data."""
    print(f"🔗 Connecting to MongoDB: {DB_NAME}")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Clear existing demo data
    print("\n🗑️  Clearing previous demo data...")
    await db.users.delete_many({"is_demo": True})
    await db.items.delete_many({"is_demo": True})
    await db.orders.delete_many({"is_demo": True})
    await db.messages.delete_many({"is_simulation": True})
    await db.reviews.delete_many({"is_simulation": True})
    print("  ✅ Previous demo data cleared")

    # Generate users
    print("\n👥 Generating users...")
    NUM_USERS = 200
    users = []
    for i in range(NUM_USERS):
        user = generate_user(i)
        result = await db.users.insert_one(user)
        users.append({"_id": result.inserted_id, **user})
    print(f"  ✅ Created {len(users)} demo users")

    # Generate items distributed by commune weight
    print("\n📦 Generating items...")
    NUM_ITEMS = 800
    items = []
    for _ in range(NUM_ITEMS):
        commune_name = weighted_choice(COMMUNES)
        commune_data = COMMUNES[commune_name]
        user = random.choice(users)
        item = generate_item(user["_id"], commune_name, commune_data)
        result = await db.items.insert_one(item)
        items.append({"_id": result.inserted_id, **item})

    # Count by commune
    commune_counts = {}
    for item in items:
        c = item["location"]["city"]
        commune_counts[c] = commune_counts.get(c, 0) + 1

    for c, count in sorted(commune_counts.items(), key=lambda x: -x[1]):
        print(f"  📍 {c}: {count} items")
    print(f"  ✅ Total: {len(items)} items")

    # Generate orders
    print("\n🛒 Generating orders...")
    sold_items = [i for i in items if i["status"] in ["sold", "completed"]]
    orders = []
    for item in sold_items[:min(200, len(sold_items))]:
        buyer = random.choice([u for u in users if u["_id"] != item["seller_id"]])
        order = generate_order(item, buyer["_id"], item["seller_id"])
        result = await db.orders.insert_one(order)
        orders.append({"_id": result.inserted_id, **order})
    print(f"  ✅ Created {len(orders)} orders")

    # Generate messages
    print("\n💬 Generating messages...")
    num_messages = 0
    for _ in range(300):
        item = random.choice(items)
        sender = random.choice(users)
        receiver = random.choice([u for u in users if u["_id"] != sender["_id"]])
        msg = generate_message(sender["_id"], receiver["_id"], item["_id"])
        await db.messages.insert_one(msg)
        num_messages += 1
    print(f"  ✅ Created {num_messages} messages")

    # Generate reviews
    print("\n⭐ Generating reviews...")
    completed_orders = [o for o in orders if o["status"] == "completed"]
    num_reviews = 0
    for order in completed_orders[:min(100, len(completed_orders))]:
        review = generate_review(order["buyer_id"], order["seller_id"], order["_id"])
        await db.reviews.insert_one(review)
        num_reviews += 1
    print(f"  ✅ Created {num_reviews} reviews")

    # Add favorites to users
    print("\n❤️  Adding favorites...")
    for user in users[:50]:
        fav_items = random.sample([i["_id"] for i in items], min(random.randint(2, 10), len(items)))
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"favorites": fav_items}})
    print("  ✅ Added favorites to 50 users")

    # Summary
    print("\n" + "="*60)
    print("📊 DEMO DATA SUMMARY")
    print("="*60)

    # Calculate KPI previews
    total_items = len(items)
    donations = sum(1 for i in items if i["type"] == "donation")
    sales = sum(1 for i in items if i["type"] == "sale")
    rentals = sum(1 for i in items if i["type"] == "rent")
    antigaspi = sum(1 for i in items if i["type"] == "antigaspi")

    completed = sum(1 for o in orders if o["status"] == "completed")
    co2_saved = completed * 3.75

    print(f"""
👥 UTILISATEURS
   Total: {len(users)}
   Pros: {sum(1 for u in users if u.get('is_pro'))}
   Vérifiés: {sum(1 for u in users if u.get('email_verified'))}

📦 ANNONCES
   Total: {total_items}
   Dons: {donations} ({round(donations/total_items*100)}%)
   Ventes: {sales} ({round(sales/total_items*100)}%)
   Locations: {rentals} ({round(rentals/total_items*100)}%)
   Anti-gaspi: {antigaspi} ({round(antigaspi/total_items*100)}%)

🛒 TRANSACTIONS
   Commandes: {len(orders)}
   Complétées: {completed}

🌱 IMPACT
   CO2 économisé: {co2_saved:.0f} kg
   Équivalent arbres: {co2_saved/21:.0f}

📍 VILLES ACTIVES: {len(commune_counts)}
""")

    print("✅ Demo data generation complete!")
    print("🔄 Refresh http://localhost:8000/admin/kpis.html to see the data")

    client.close()


if __name__ == "__main__":
    asyncio.run(generate_demo_data())
