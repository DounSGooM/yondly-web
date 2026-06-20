"""
Seed script — ajoute des articles de test avec paiement en espèces.
Usage: python seed_cash_items.py <API_URL> <TOKEN>
Ex:    python seed_cash_items.py https://ton-app.up.railway.app eyJ...
"""
import sys
import asyncio
import os
from pathlib import Path

ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))

from dotenv import load_dotenv
load_dotenv(ROOT_DIR / ".env")

from database import db
import uuid
from datetime import datetime

ITEMS = [
    {
        "type": "sale",
        "title": "Vélo de ville homme — 3 vitesses",
        "description": "Vélo en bon état, peu utilisé. Guidon réglable, antivol inclus.",
        "category": "Véhicules",
        "condition": "good",
        "price_cents": 8500,
        "accepts_cash": True,
        "allow_offers": True,
        "photos": [],
    },
    {
        "type": "sale",
        "title": "Table basse bois massif",
        "description": "Table basse années 70, bois de chêne. Quelques micro-rayures sans importance.",
        "category": "Mobilier",
        "condition": "good",
        "price_cents": 4500,
        "accepts_cash": True,
        "allow_offers": False,
        "photos": [],
    },
    {
        "type": "sale",
        "title": "Lot livres policiers (×10)",
        "description": "10 romans policiers en très bon état : Camilleri, Mankell, Connelly.",
        "category": "Livres",
        "condition": "good",
        "price_cents": 1200,
        "accepts_cash": True,
        "allow_offers": True,
        "photos": [],
    },
    {
        "type": "sale",
        "title": "Veste en cuir noir T.M",
        "description": "Veste cuir véritable, portée 3 fois. Taille M. Fermetures zips nickel.",
        "category": "Vêtements",
        "condition": "new",
        "price_cents": 3500,
        "accepts_cash": True,
        "allow_offers": True,
        "photos": [],
    },
    {
        "type": "sale",
        "title": "Perceuse Bosch avec accessoires",
        "description": "Perceuse sans fil 18V + 2 batteries + coffret de forets. Fonctionne parfaitement.",
        "category": "Bricolage",
        "condition": "good",
        "price_cents": 6000,
        "accepts_cash": True,
        "allow_offers": False,
        "photos": [],
    },
]


async def main():
    # Récupérer le premier user actif
    user = await db.users.find_one({"is_active": True})
    if not user:
        user = await db.users.find_one({})
    if not user:
        print("❌ Aucun utilisateur trouvé en base. Crée un compte d'abord.")
        return

    owner_id = user["id"]
    location = user.get("location") or {"lat": 46.5802, "lng": 0.3404, "city": "Poitiers", "address": "Centre-ville"}
    print(f"👤 Vendeur : {user.get('display_name', user.get('email'))} ({owner_id})")

    created = 0
    for item_data in ITEMS:
        item_id = str(uuid.uuid4())
        doc = {
            "id": item_id,
            "owner_id": owner_id,
            "status": "active",
            "location": location,
            "radius_km": 5.0,
            "tags": [],
            "created_at": datetime.utcnow().isoformat(),
            **item_data,
        }
        try:
            await db.items.insert_one(doc)
            print(f"  ✅ {item_data['title']} ({item_data['price_cents']/100:.2f}€ — cash: {item_data['accepts_cash']})")
            created += 1
        except Exception as e:
            print(f"  ❌ {item_data['title']} : {e}")

    print(f"\n✨ {created}/{len(ITEMS)} articles créés avec paiement en espèces.")


if __name__ == "__main__":
    asyncio.run(main())
