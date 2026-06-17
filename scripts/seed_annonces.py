"""
Script de seed — crée des annonces fictives dans chaque catégorie.

Usage :
    python3 scripts/seed_annonces.py

Variables d'env (optionnelles) :
    API_URL   → défaut : https://yondly-web-production.up.railway.app/api
    EMAIL     → email du compte test (défaut : marie.testeur@yondly-demo.fr)
    PASSWORD  → mot de passe          (défaut : Yondly2026!)
"""

import os
import requests

API = os.getenv("API_URL", "https://yondly-web-production.up.railway.app/api")
EMAIL = os.getenv("EMAIL", "marie.testeur@yondly-demo.fr")
PASSWORD = os.getenv("PASSWORD", "Yondly2026!")

# ─── Login ────────────────────────────────────────────────────────────────────

resp = requests.post(f"{API}/auth/login", json={"email": EMAIL, "password": PASSWORD})
if resp.status_code != 200:
    print(f"❌ Login échoué ({resp.status_code}) : {resp.text}")
    exit(1)

token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"✓ Connecté en tant que {EMAIL}\n")

# ─── Annonces ─────────────────────────────────────────────────────────────────

LOCATION = {"lat": 46.5802, "lng": 0.3404}  # Poitiers centre

ITEMS = [
    # ── Ventes ──────────────────────────────────────────────────────────────
    {
        "type": "sale",
        "title": "Vélo de ville — état impeccable",
        "description": "Vélo adulte 7 vitesses, cadre aluminium, freins à disque. Utilisé 2 saisons, révisé récemment. Idéal pour les trajets quotidiens.",
        "category": "Véhicules",
        "condition": "good",
        "price_cents": 8900,
        "allow_offers": True,
        "photos": [],
        "location": LOCATION,
    },
    {
        "type": "sale",
        "title": "iPhone 12 — 64 Go Noir",
        "description": "iPhone 12 en très bon état, batterie à 89%. Vendu avec chargeur et câble. Débloqué tous opérateurs.",
        "category": "Électronique",
        "condition": "good",
        "price_cents": 22000,
        "allow_offers": True,
        "photos": [],
        "location": LOCATION,
    },
    {
        "type": "sale",
        "title": "Canapé 3 places tissu gris",
        "description": "Canapé confortable 3 places, tissu gris chiné, pieds bois. Dimensions : 210 x 85 cm. À venir chercher sur place.",
        "category": "Mobilier",
        "condition": "good",
        "price_cents": 15000,
        "allow_offers": False,
        "photos": [],
        "location": LOCATION,
    },

    # ── Dons ─────────────────────────────────────────────────────────────────
    {
        "type": "donation",
        "title": "Livres de cuisine — lot de 8",
        "description": "Lot de 8 livres de cuisine (cuisine française, végétarienne, pâtisserie). Très bon état, non annotés. À récupérer rapidement.",
        "category": "Livres",
        "condition": "good",
        "photos": [],
        "location": LOCATION,
        "urgency_days": 7,
    },
    {
        "type": "donation",
        "title": "Vêtements enfant 3-5 ans",
        "description": "Sac de vêtements mixte 3-5 ans : pulls, pantalons, t-shirts. Bon état général, lavés et prêts à donner.",
        "category": "Vêtements",
        "condition": "good",
        "photos": [],
        "location": LOCATION,
        "urgency_days": 14,
    },
    {
        "type": "donation",
        "title": "Matériel de jardinage",
        "description": "Pelles, râteaux, sécateur, arrosoir. Je n'ai plus de jardin. Tout fonctionne, à prendre ensemble ou séparément.",
        "category": "Jardin",
        "condition": "good",
        "photos": [],
        "location": LOCATION,
        "urgency_days": 30,
    },

    # ── Échanges ─────────────────────────────────────────────────────────────
    {
        "type": "exchange",
        "title": "Machine à café Nespresso",
        "description": "Machine Nespresso Essenza Mini, couleur rouge, fonctionne parfaitement. Je cherche à l'échanger contre une machine à café à grain ou filtre.",
        "category": "Maison",
        "condition": "good",
        "photos": [],
        "location": LOCATION,
        "wanted_item": "Machine à café à grain ou filtre",
    },
    {
        "type": "exchange",
        "title": "Trottinette électrique Xiaomi",
        "description": "Trottinette Xiaomi M365, autonomie 25 km, bon état. Ouverte à l'échange contre vélo électrique ou autre moyen de transport.",
        "category": "Véhicules",
        "condition": "good",
        "photos": [],
        "location": LOCATION,
        "wanted_item": "Vélo électrique ou trottinette à assistance",
    },

    # ── Services ─────────────────────────────────────────────────────────────
    {
        "type": "service",
        "title": "Cours de guitare — débutants bienvenus",
        "description": "Je propose des cours de guitare acoustique pour débutants et intermédiaires. Pédagogie bienveillante, à votre rythme. Déplacement possible dans Poitiers.",
        "category": "Cours particuliers",
        "photos": [],
        "location": LOCATION,
        "service_duration": "1h par séance",
        "service_availability": "Week-ends et soirées en semaine",
    },
    {
        "type": "service",
        "title": "Aide déménagement — camionnette incluse",
        "description": "Je propose mon aide pour les déménagements avec ma camionnette 12m³. Disponible les week-ends. Tarif à convenir selon distance.",
        "category": "Aide déménagement",
        "photos": [],
        "location": LOCATION,
        "service_duration": "Demi-journée ou journée complète",
        "service_availability": "Samedi et dimanche",
    },
    {
        "type": "service",
        "title": "Garde de chien — promenades quotidiennes",
        "description": "Je garde votre chien pendant vos vacances ou absences (max 2 chiens). Grand jardin, promenades matin et soir. Références disponibles.",
        "category": "Garde d'animaux",
        "photos": [],
        "location": LOCATION,
        "service_duration": "À la journée ou semaine",
        "service_availability": "Toute l'année, disponibilité à confirmer",
    },
]

# ─── Création ─────────────────────────────────────────────────────────────────

success, errors = 0, 0
for item in ITEMS:
    r = requests.post(f"{API}/items", json=item, headers=headers)
    if r.status_code in (200, 201):
        print(f"  ✓ [{item['type'].upper()}] {item['title']}")
        success += 1
    else:
        print(f"  ✗ [{item['type'].upper()}] {item['title']} → {r.status_code} {r.text[:80]}")
        errors += 1

print(f"\n{'='*50}")
print(f"✓ {success} annonces créées   ✗ {errors} erreurs")
