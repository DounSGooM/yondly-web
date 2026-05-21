"""
Génération automatique d'articles de blog Yondly via Claude API.

Usage:
    python generate_article.py

Variables d'environnement requises:
    ANTHROPIC_API_KEY   - Clé API Anthropic
    BLOG_API_URL        - URL de base du backend blog (ex: https://yondly-backend-xxx.run.app/api)
    BLOG_ADMIN_KEY      - Clé admin blog (x-admin-key)

L'article est créé en brouillon (published=False).
Il apparaît dans /admin/blog pour relecture avant publication.
"""

import os
import sys
import json
import re
import requests
from datetime import datetime
import anthropic

# ─── Config ───────────────────────────────────────────────────────────────────

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
BLOG_API_URL      = os.environ.get("BLOG_API_URL", "https://yondly-backend-951855414282.europe-west1.run.app/api")
BLOG_ADMIN_KEY    = os.environ.get("BLOG_ADMIN_KEY", "SECRET_KEY_YONDLY_ADMIN_2025")

# ─── Sujets en rotation ────────────────────────────────────────────────────────
# Sélection cyclique selon le numéro de semaine ISO pour varier les thèmes.

TOPICS = [
    {
        "theme": "réduire le gaspillage alimentaire à la maison",
        "category": "Anti-gaspi",
        "angle": "conseils pratiques du quotidien, planification des repas, conservation des aliments",
    },
    {
        "theme": "acheter et vendre d'occasion entre voisins",
        "category": "Réemploi",
        "angle": "avantages économiques et écologiques, comment bien évaluer un objet, les bons réflexes",
    },
    {
        "theme": "circuits courts et producteurs locaux",
        "category": "Circuits courts",
        "angle": "pourquoi choisir le local, comment trouver les producteurs près de chez soi, impact territorial",
    },
    {
        "theme": "réparer plutôt que jeter — le guide du repair café",
        "category": "Réemploi",
        "angle": "objets les plus faciles à réparer, où trouver de l'aide, ressources DIY",
    },
    {
        "theme": "l'économie circulaire expliquée simplement",
        "category": "Écologie",
        "angle": "définition accessible, exemples concrets du quotidien, pourquoi ça change tout",
    },
    {
        "theme": "zéro déchet dans sa cuisine",
        "category": "Anti-gaspi",
        "angle": "recettes avec les restes, compostage, emballages réutilisables",
    },
    {
        "theme": "l'entraide de voisinage, nouveau moteur du territoire",
        "category": "Territoire",
        "angle": "exemples inspirants, comment se lancer, impact social et environnemental",
    },
    {
        "theme": "les AMAP et paniers de légumes : comment ça marche ?",
        "category": "Circuits courts",
        "angle": "fonctionnement d'une AMAP, comment rejoindre, avantages pour le consommateur et le paysan",
    },
    {
        "theme": "donner une seconde vie aux vêtements",
        "category": "Réemploi",
        "angle": "tri et dons, friperies locales, upcycling, impact de la fast fashion",
    },
    {
        "theme": "calculer son empreinte carbone alimentaire",
        "category": "Écologie",
        "angle": "les aliments les plus émetteurs, comparaison locale vs importé, petits gestes grand impact",
    },
    {
        "theme": "les épiceries solidaires et l'accès à l'alimentation pour tous",
        "category": "Solidarité",
        "angle": "fonctionnement, comment contribuer, impact social sur le territoire",
    },
    {
        "theme": "automne : fruits et légumes de saison à ne pas gâcher",
        "category": "Anti-gaspi",
        "angle": "calendrier saisonnier, recettes simples, conservation et bocaux",
    },
]

# Images Unsplash curatées par catégorie
IMAGES = {
    "Anti-gaspi":    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80",
    "Réemploi":      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
    "Circuits courts":"https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=80",
    "Écologie":      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&q=80",
    "Territoire":    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80",
    "Solidarité":    "https://images.unsplash.com/photo-1593113630400-ea4288922559?w=1200&q=80",
}
DEFAULT_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80"

# ─── Prompt ────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Tu es rédacteur pour Yondly, une application locale d'économie circulaire basée à Grand Poitiers (France).
Yondly connecte les habitants pour partager des surplus alimentaires, vendre des objets d'occasion, échanger des services et soutenir les circuits courts.

Ton style : chaleureux, ancré dans le quotidien, concret, jamais corporate. Tu t'adresses à des habitants ordinaires qui veulent agir localement.
Tu ne prêches pas — tu donnes des conseils utiles et inspirants.
"""

def build_prompt(topic: dict) -> str:
    today = datetime.now().strftime("%d %B %Y")
    return f"""Rédige un article de blog complet sur le thème : "{topic['theme']}".
Angle éditorial : {topic['angle']}

Contraintes :
- Longueur : 600 à 900 mots
- Ton : chaleureux, pratique, ancré dans la vie de quartier
- Structure avec des sous-titres (## en markdown)
- 3 à 5 sections minimum
- Termine par un appel à l'action discret lié à Yondly
- Date de l'article : {today}

Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, avec exactement ces champs :
{{
  "title": "Titre accrocheur de l'article (60 caractères max)",
  "slug": "titre-en-kebab-case-sans-accents",
  "excerpt": "Résumé de 2 phrases maximum pour la liste d'articles",
  "content": "Contenu complet en HTML (utilise <h2>, <p>, <ul>, <strong>, etc.)",
  "read_time": "X min",
  "keywords": "mot-clé1, mot-clé2, mot-clé3"
}}
"""

# ─── Génération ────────────────────────────────────────────────────────────────

def pick_topic() -> dict:
    week = datetime.now().isocalendar()[1]
    return TOPICS[week % len(TOPICS)]


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[àáâãäå]", "a", text)
    text = re.sub(r"[èéêë]", "e", text)
    text = re.sub(r"[ìíîï]", "i", text)
    text = re.sub(r"[òóôõö]", "o", text)
    text = re.sub(r"[ùúûü]", "u", text)
    text = re.sub(r"[ç]", "c", text)
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s-]+", "-", text).strip("-")
    return text


def generate_article(topic: dict) -> dict:
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    print(f"→ Génération d'un article sur : {topic['theme']}")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": build_prompt(topic)}],
    )

    raw = message.content[0].text.strip()

    # Extraire le JSON même si Claude ajoute du texte autour
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError(f"Réponse Claude non parseable : {raw[:300]}")

    article = json.loads(match.group())

    # Normaliser le slug
    article["slug"] = slugify(article.get("slug", article.get("title", "article")))

    # Compléter les champs fixes
    article["category"] = topic["category"]
    article["author"]   = "Équipe Yondly"
    article["image"]    = IMAGES.get(topic["category"], DEFAULT_IMAGE)
    article["date"]     = datetime.now().strftime("%d %b %Y")
    article["published"] = False  # Brouillon — relecture avant publication

    return article


def post_draft(article: dict) -> dict:
    url = f"{BLOG_API_URL}/blog"
    response = requests.post(
        url,
        json=article,
        headers={"x-admin-key": BLOG_ADMIN_KEY, "Content-Type": "application/json"},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


# ─── Entrypoint ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not ANTHROPIC_API_KEY:
        print("❌ ANTHROPIC_API_KEY manquant")
        sys.exit(1)

    topic   = pick_topic()
    article = generate_article(topic)

    print(f"✓ Article généré : \"{article['title']}\"")
    print(f"  Slug : {article['slug']}")
    print(f"  Catégorie : {article['category']}")

    result = post_draft(article)
    print(f"✓ Brouillon publié en base (id={result.get('id', '?')})")
    print(f"  → Relire sur /admin/blog avant publication")
