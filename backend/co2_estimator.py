"""
CO2 Estimator - Hybrid ADEME + AI System
=========================================
Estimates CO2 savings for items based on:
1. ADEME (Agence de l'Environnement et de la Maîtrise de l'Énergie) reference data
2. Gemini AI for precise estimation based on description and category
"""

import os
import json
import google.generativeai as genai
from typing import Optional, Dict, Any

# Configure Gemini
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# =============================================================================
# ADEME Reference Data (kg CO2 equivalent for new product manufacturing)
# Source: Base Carbone ADEME - https://base-empreinte.ademe.fr/
# =============================================================================

ADEME_CO2_BY_CATEGORY = {
    # Électronique & High-Tech
    "electronics": {
        "base_kg": 50,
        "subcategories": {
            "smartphone": 70,
            "laptop": 300,
            "tablet": 120,
            "tv": 350,
            "console": 100,
            "camera": 45,
            "headphones": 15,
            "smartwatch": 25,
            "speaker": 30,
            "router": 20,
            "printer": 80,
        }
    },

    # Électroménager
    "appliances": {
        "base_kg": 100,
        "subcategories": {
            "refrigerator": 200,
            "washing_machine": 250,
            "dishwasher": 200,
            "microwave": 60,
            "oven": 150,
            "coffee_machine": 35,
            "vacuum": 40,
            "iron": 20,
            "blender": 15,
            "toaster": 12,
        }
    },

    # Textile & Mode
    "clothing": {
        "base_kg": 12,
        "subcategories": {
            "tshirt": 7,
            "shirt": 10,
            "pants": 15,
            "jeans": 25,
            "jacket": 30,
            "coat": 45,
            "dress": 20,
            "sweater": 18,
            "shoes": 14,
            "sneakers": 18,
            "boots": 25,
            "bag": 20,
            "handbag": 35,
        }
    },

    # Meubles & Maison
    "furniture": {
        "base_kg": 50,
        "subcategories": {
            "chair": 25,
            "table": 60,
            "desk": 70,
            "sofa": 150,
            "bed": 200,
            "mattress": 100,
            "wardrobe": 180,
            "shelf": 40,
            "lamp": 15,
            "mirror": 20,
        }
    },

    # Sports & Loisirs
    "sports": {
        "base_kg": 20,
        "subcategories": {
            "bicycle": 100,
            "ski": 45,
            "snowboard": 40,
            "surfboard": 50,
            "tennis_racket": 8,
            "golf_clubs": 60,
            "camping_tent": 35,
            "sleeping_bag": 20,
            "fitness_equipment": 80,
        }
    },

    # Livres & Médias
    "books": {
        "base_kg": 1.5,
        "subcategories": {
            "book": 1.5,
            "magazine": 0.5,
            "vinyl": 0.8,
            "dvd": 0.3,
            "game_box": 2,
        }
    },

    # Jouets & Enfants
    "toys": {
        "base_kg": 8,
        "subcategories": {
            "toy": 8,
            "board_game": 5,
            "lego": 12,
            "doll": 6,
            "stroller": 50,
            "car_seat": 40,
        }
    },

    # Bricolage & Jardinage
    "diy": {
        "base_kg": 25,
        "subcategories": {
            "tool": 15,
            "power_tool": 40,
            "lawnmower": 120,
            "garden_furniture": 80,
        }
    },

    # Alimentation (anti-gaspi)
    "food": {
        "base_kg": 2.5,
        "subcategories": {
            "meat": 8,
            "fish": 5,
            "dairy": 2,
            "vegetables": 0.5,
            "fruits": 0.4,
            "bread": 0.8,
            "prepared_meal": 3,
            "basket": 4,  # Panier anti-gaspi moyen
        }
    },

    # Véhicules
    "vehicles": {
        "base_kg": 500,
        "subcategories": {
            "car": 6000,
            "motorcycle": 1500,
            "scooter": 400,
            "ebike": 150,
        }
    },

    # Décoration
    "decoration": {
        "base_kg": 15,
        "subcategories": {
            "painting": 10,
            "vase": 5,
            "carpet": 30,
            "curtains": 12,
        }
    },

    # Autres
    "other": {
        "base_kg": 10,
        "subcategories": {}
    }
}

# Mapping des catégories de l'app vers les catégories ADEME
APP_CATEGORY_MAPPING = {
    # Market categories
    "Électronique": "electronics",
    "High-Tech": "electronics",
    "Vêtements": "clothing",
    "Mode": "clothing",
    "Maison": "furniture",
    "Meubles": "furniture",
    "Sports": "sports",
    "Loisirs": "sports",
    "Livres": "books",
    "Médias": "books",
    "Jouets": "toys",
    "Enfants": "toys",
    "Bricolage": "diy",
    "Jardin": "diy",
    "Décoration": "decoration",
    "Véhicules": "vehicles",
    "Auto": "vehicles",
    "Moto": "vehicles",

    # Food categories (anti-gaspi)
    "Boulangerie": "food",
    "Restaurant": "food",
    "Épicerie": "food",
    "Supermarché": "food",
    "Traiteur": "food",
    "Pâtisserie": "food",
    "Primeur": "food",

    # Default
    "Autre": "other",
    "Other": "other",
}


# Keyword mapping for automatic subcategory detection
KEYWORD_TO_SUBCATEGORY = {
    # Electronics
    "iphone": ("electronics", "smartphone", 70),
    "samsung": ("electronics", "smartphone", 70),
    "pixel": ("electronics", "smartphone", 70),
    "téléphone": ("electronics", "smartphone", 70),
    "smartphone": ("electronics", "smartphone", 70),
    "portable": ("electronics", "smartphone", 70),
    "macbook": ("electronics", "laptop", 300),
    "laptop": ("electronics", "laptop", 300),
    "ordinateur portable": ("electronics", "laptop", 300),
    "pc portable": ("electronics", "laptop", 300),
    "ordinateur": ("electronics", "laptop", 250),
    "pc": ("electronics", "laptop", 250),
    "imac": ("electronics", "laptop", 400),
    "ipad": ("electronics", "tablet", 120),
    "tablette": ("electronics", "tablet", 100),
    "télé": ("electronics", "tv", 350),
    "téléviseur": ("electronics", "tv", 350),
    "tv": ("electronics", "tv", 350),
    "écran": ("electronics", "tv", 200),
    "moniteur": ("electronics", "tv", 180),
    "playstation": ("electronics", "console", 100),
    "ps5": ("electronics", "console", 100),
    "ps4": ("electronics", "console", 80),
    "xbox": ("electronics", "console", 100),
    "nintendo": ("electronics", "console", 60),
    "switch": ("electronics", "console", 50),
    "casque": ("electronics", "headphones", 15),
    "airpods": ("electronics", "headphones", 20),
    "écouteurs": ("electronics", "headphones", 12),
    "enceinte": ("electronics", "speaker", 30),
    "speaker": ("electronics", "speaker", 30),
    "montre connectée": ("electronics", "smartwatch", 25),
    "apple watch": ("electronics", "smartwatch", 30),
    "appareil photo": ("electronics", "camera", 45),
    "caméra": ("electronics", "camera", 40),
    "gopro": ("electronics", "camera", 35),
    "imprimante": ("electronics", "printer", 80),
    "télécommande": ("electronics", "other", 3),
    "chargeur": ("electronics", "other", 2),
    "câble": ("electronics", "other", 1),
    "souris": ("electronics", "other", 5),
    "clavier": ("electronics", "other", 8),

    # Appliances
    "frigo": ("appliances", "refrigerator", 200),
    "réfrigérateur": ("appliances", "refrigerator", 200),
    "lave-linge": ("appliances", "washing_machine", 250),
    "machine à laver": ("appliances", "washing_machine", 250),
    "lave-vaisselle": ("appliances", "dishwasher", 200),
    "micro-ondes": ("appliances", "microwave", 60),
    "four": ("appliances", "oven", 150),
    "cafetière": ("appliances", "coffee_machine", 35),
    "nespresso": ("appliances", "coffee_machine", 40),
    "aspirateur": ("appliances", "vacuum", 40),
    "dyson": ("appliances", "vacuum", 50),
    "fer à repasser": ("appliances", "iron", 20),
    "blender": ("appliances", "blender", 15),
    "mixeur": ("appliances", "blender", 15),
    "grille-pain": ("appliances", "toaster", 12),

    # Clothing
    "t-shirt": ("clothing", "tshirt", 7),
    "tee-shirt": ("clothing", "tshirt", 7),
    "chemise": ("clothing", "shirt", 10),
    "pantalon": ("clothing", "pants", 15),
    "jean": ("clothing", "jeans", 25),
    "veste": ("clothing", "jacket", 30),
    "blouson": ("clothing", "jacket", 35),
    "manteau": ("clothing", "coat", 45),
    "robe": ("clothing", "dress", 20),
    "pull": ("clothing", "sweater", 18),
    "chaussures": ("clothing", "shoes", 14),
    "baskets": ("clothing", "sneakers", 18),
    "nike": ("clothing", "sneakers", 20),
    "adidas": ("clothing", "sneakers", 20),
    "bottes": ("clothing", "boots", 25),
    "sac": ("clothing", "bag", 20),
    "sac à main": ("clothing", "handbag", 35),

    # Furniture
    "chaise": ("furniture", "chair", 25),
    "table": ("furniture", "table", 60),
    "bureau": ("furniture", "desk", 70),
    "canapé": ("furniture", "sofa", 150),
    "lit": ("furniture", "bed", 200),
    "matelas": ("furniture", "mattress", 100),
    "armoire": ("furniture", "wardrobe", 180),
    "étagère": ("furniture", "shelf", 40),
    "lampe": ("furniture", "lamp", 15),
    "miroir": ("furniture", "mirror", 20),

    # Sports
    "vélo": ("sports", "bicycle", 100),
    "bicyclette": ("sports", "bicycle", 100),
    "ski": ("sports", "ski", 45),
    "snowboard": ("sports", "snowboard", 40),
    "planche de surf": ("sports", "surfboard", 50),
    "raquette": ("sports", "tennis_racket", 8),
    "tente": ("sports", "camping_tent", 35),
    "sac de couchage": ("sports", "sleeping_bag", 20),

    # Books
    "livre": ("books", "book", 1.5),
    "roman": ("books", "book", 1.5),
    "bd": ("books", "book", 2),
    "manga": ("books", "book", 1),
    "magazine": ("books", "magazine", 0.5),
    "vinyle": ("books", "vinyl", 0.8),
    "dvd": ("books", "dvd", 0.3),
    "jeu vidéo": ("books", "game_box", 2),

    # Toys
    "jouet": ("toys", "toy", 8),
    "lego": ("toys", "lego", 12),
    "poupée": ("toys", "doll", 6),
    "poussette": ("toys", "stroller", 50),
    "siège auto": ("toys", "car_seat", 40),
    "jeu de société": ("toys", "board_game", 5),
}


def detect_product_from_title(title: str, description: str = "") -> tuple:
    """
    Detect product type from title and description using keyword matching.
    
    Returns:
        Tuple of (category, subcategory, co2_kg) or None if not detected
    """
    text = f"{title} {description}".lower()

    # Check each keyword
    for keyword, (category, subcategory, co2_kg) in KEYWORD_TO_SUBCATEGORY.items():
        if keyword in text:
            return (category, subcategory, co2_kg)

    return None


def get_base_co2_estimate(category: str, subcategory: Optional[str] = None, title: str = "", description: str = "") -> float:
    """
    Get base CO2 estimate from ADEME data.
    
    Args:
        category: Item category (app category name)
        subcategory: Optional subcategory for more precision
        title: Item title for smart detection
        description: Item description for smart detection
        
    Returns:
        CO2 estimate in kg
    """
    # Try smart detection from title first
    if title:
        detected = detect_product_from_title(title, description)
        if detected:
            return detected[2]  # Return the CO2 value

    # Map app category to ADEME category
    ademe_category = APP_CATEGORY_MAPPING.get(category, "other")

    category_data = ADEME_CO2_BY_CATEGORY.get(ademe_category, ADEME_CO2_BY_CATEGORY["other"])

    # Try to find subcategory
    if subcategory:
        subcategory_lower = subcategory.lower().replace(" ", "_")
        if subcategory_lower in category_data["subcategories"]:
            return category_data["subcategories"][subcategory_lower]

    return category_data["base_kg"]



async def estimate_co2_with_ai(
    title: str,
    description: str,
    category: str,
    price_cents: Optional[int] = None,
    condition: Optional[str] = None,
    image_urls: Optional[list[str]] = None
) -> Dict[str, Any]:
    """
    Use Gemini AI to estimate CO2 savings with high precision, including image analysis.
    
    Args:
        title: Item title
        description: Item description
        category: Item category
        price_cents: Item price in cents (helps estimate size/quality)
        condition: Item condition (new, like_new, good, fair)
        image_urls: List of image URLs to analyze
        
    Returns:
        Dict with co2_kg estimate and breakdown
    """

    # Get base estimate from ADEME (with smart detection from title)
    base_estimate = get_base_co2_estimate(category, title=title, description=description)

    # If no Gemini API key, return base estimate
    if not GEMINI_API_KEY:
        return {
            "co2_saved_kg": base_estimate,
            "method": "ademe_base",
            "confidence": 0.6,
            "breakdown": {
                "category_base": base_estimate,
                "ai_adjustment": 0,
            },
            "source": "Base Carbone ADEME",
            "explanation": f"Estimation basée sur la catégorie '{category}'"
        }

    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')

        price_info = f"{price_cents/100:.2f}€" if price_cents else "non spécifié"

        # Prepare content parts (text + optional image)
        prompt_text = f"""Tu es un expert en impact environnemental et économie circulaire.
        
Estime précisément les kg de CO2 économisés en réutilisant cet article au lieu d'en acheter un neuf.

**Article à analyser:**
- Titre: {title}
- Description: {description}
- Catégorie: {category}
- Prix: {price_info}
- État: {condition or 'non spécifié'}

**Base de référence ADEME pour cette catégorie:** {base_estimate} kg CO2

**Instructions:**
1. Identifie précisément le type de produit (et le matériau si visible sur la photo).
2. Estime le poids et les matériaux principaux.
3. Calcule l'empreinte carbone de fabrication (extraction, transport, production).
4. Ajuste selon l'état (un article neuf = 100%, usé = 70-80%).
5. Si une photo est fournie, utilise-la pour affiner l'estimation (taille, matériaux, état réel).

**Réponds UNIQUEMENT en JSON valide:**
{{
    "co2_saved_kg": <nombre>,
    "product_type": "<type précis identifié>",
    "estimated_weight_kg": <poids estimé>,
    "main_materials": ["matériau1", "matériau2"],
    "confidence": <0.0-1.0>,
    "explanation": "<explication courte en français>"
}}"""

        content = [prompt_text]

        # Try to download and add the first image if available
        if image_urls and len(image_urls) > 0:
            import httpx
            import PIL.Image
            import io

            try:
                # Use the first image
                img_url = image_urls[0]
                async with httpx.AsyncClient() as client:
                    resp = await client.get(img_url, timeout=10.0)
                    if resp.status_code == 200:
                        image_data = resp.content
                        image = PIL.Image.open(io.BytesIO(image_data))
                        content.append(image)
                        print(f"Added image to Gemini analysis: {img_url}")
            except Exception as e:
                print(f"Failed to process image for CO2 estimation: {e}")
                # Continue without image
                pass

        response = await model.generate_content_async(content)
        response_text = response.text.strip()

        # Extract JSON from response
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        ai_result = json.loads(response_text)

        return {
            "co2_saved_kg": round(ai_result.get("co2_saved_kg", base_estimate), 2),
            "method": "ademe_ai_hybrid_multimodal",
            "confidence": ai_result.get("confidence", 0.8),
            "breakdown": {
                "category_base": base_estimate,
                "ai_estimate": ai_result.get("co2_saved_kg", base_estimate),
                "product_type": ai_result.get("product_type", "inconnu"),
                "estimated_weight_kg": ai_result.get("estimated_weight_kg"),
                "main_materials": ai_result.get("main_materials", []),
            },
            "source": "ADEME + Analyse IA Gemini (Multimodale)",
            "explanation": ai_result.get("explanation", "Estimation par IA")
        }

    except Exception as e:
        print(f"AI CO2 estimation error: {e}")
        # Fallback to base estimate
        return {
            "co2_saved_kg": base_estimate,
            "method": "ademe_base_fallback",
            "confidence": 0.6,
            "breakdown": {
                "category_base": base_estimate,
                "ai_adjustment": 0,
            },
            "source": "Base Carbone ADEME",
            "explanation": f"Estimation basée sur la catégorie (erreur IA: {str(e)[:50]})"
        }


def calculate_environmental_equivalents(co2_kg: float) -> Dict[str, Any]:
    """
    Calculate understandable equivalents for CO2 savings.
    
    Args:
        co2_kg: CO2 saved in kg
        
    Returns:
        Dict with various equivalents
    """
    return {
        "co2_kg": round(co2_kg, 2),
        "equivalents": {
            # 1 arbre absorbe ~21 kg CO2/an
            "trees_year": round(co2_kg / 21, 2),
            # Voiture moyenne: ~120g CO2/km
            "car_km_avoided": round(co2_kg / 0.12, 0),
            # Vol Paris-Londres: ~255 kg CO2
            "paris_london_flights": round(co2_kg / 255, 3),
            # Smartphone moyen: ~70 kg CO2
            "smartphones_saved": round(co2_kg / 70, 2),
            # Repas avec viande: ~3 kg CO2
            "meat_meals": round(co2_kg / 3, 1),
            # Streaming 1h: ~36g CO2
            "streaming_hours": round(co2_kg / 0.036, 0),
        }
    }


# Quick test
if __name__ == "__main__":
    import asyncio

    async def test():
        # Test base estimation
        print("=== Test Base ADEME ===")
        base = get_base_co2_estimate("Électronique", "smartphone")
        print(f"Smartphone: {base} kg CO2")

        base = get_base_co2_estimate("Vêtements", "jeans")
        print(f"Jeans: {base} kg CO2")

        # Test AI estimation
        print("\n=== Test AI ===")
        result = await estimate_co2_with_ai(
            title="iPhone 14 Pro 256GB",
            description="iPhone 14 Pro en excellent état, batterie 92%",
            category="Électronique",
            price_cents=75000,
            condition="like_new"
        )
        print(json.dumps(result, indent=2, ensure_ascii=False))

        # Test equivalents
        print("\n=== Équivalents ===")
        equiv = calculate_environmental_equivalents(result["co2_saved_kg"])
        print(json.dumps(equiv, indent=2, ensure_ascii=False))

    asyncio.run(test())
