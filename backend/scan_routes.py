"""
Yondly Scan + Circular Score
════════════════════════════
L'utilisateur photographie un objet → Gemini Vision génère une fiche complète
(catégorie, état, prix de revente, réparabilité, orientation, CO₂ évité) et on
calcule un Circular Score 0-100 à partir de règles métier + demande locale réelle.

La fiche pré-remplit ensuite le formulaire de création d'annonce.
"""

import os
import io
import json
import base64
from math import radians, cos, sin, asin, sqrt
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

import google.generativeai as genai

from co2_estimator import get_base_co2_estimate, calculate_environmental_equivalents

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
# Modèle configurable via env (ex: gemini-2.0-flash, gemini-1.5-flash, gemini-2.5-flash)
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-2.0-flash')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Catégories alignées avec le formulaire d'annonce (frontend/app/post/market.tsx)
APP_CATEGORIES = [
    'Maison', 'Vêtements', 'Électronique', 'Multimédia', 'Véhicules',
    'Sport', 'Livres', 'Enfants', 'Jeux & Jouets', 'Jardin',
    'Bricolage', 'Beauté', 'Animaux', 'Musique', 'Mobilier', 'Autre',
]

# Orientation recommandée
ORIENTATIONS = ['revente', 'don', 'ressourcerie', 'reparation', 'recyclage']

# ─── Barèmes du Circular Score (V1 : règles métier) ──────────────────────────
ETAT_SCORE = {            # /30 — état apparent
    'neuf': 30, 'tres_bon': 26, 'bon': 20, 'use': 12, 'abime': 6, 'hors_service': 2,
}
REPARABILITE_SCORE = {    # /20 — facilité de réparation
    'facile': 20, 'moyenne': 14, 'difficile': 7, 'non_reparable': 3,
}
ORIENTATION_SCORE = {     # /20 — facilité de réemploi
    'revente': 20, 'don': 18, 'reparation': 12, 'ressourcerie': 8, 'recyclage': 3,
}


def _haversine_km(lat1, lng1, lat2, lng2) -> float:
    r = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return r * 2 * asin(sqrt(a))


def _normalize_etat(raw: str) -> str:
    s = (raw or '').lower()
    if 'neuf' in s:
        return 'neuf'
    if 'très bon' in s or 'tres bon' in s or 'excellent' in s:
        return 'tres_bon'
    if 'hors' in s or 'panne' in s or 'cassé' in s or 'casse' in s or 'mort' in s:
        return 'hors_service'
    if 'abîm' in s or 'abim' in s or 'mauvais' in s or 'endommag' in s:
        return 'abime'
    if 'usé' in s or 'use' in s or 'moyen' in s:
        return 'use'
    return 'bon'


def _condition_for_form(etat_norm: str) -> str:
    """Mappe l'état détaillé vers les 3 conditions du formulaire (new/good/repair)."""
    if etat_norm in ('neuf', 'tres_bon'):
        return 'new'
    if etat_norm in ('abime', 'hors_service'):
        return 'repair'
    return 'good'


def compute_circular_score(
    etat_norm: str,
    reparabilite: str,
    orientation: str,
    co2_kg: float,
    local_demand: int,
    nearby_partners: int,
) -> Dict[str, Any]:
    """Calcule le Circular Score 0-100 + statut lisible (règles métier V1)."""
    etat_pts = ETAT_SCORE.get(etat_norm, 12)
    repar_pts = REPARABILITE_SCORE.get(reparabilite, 7)
    orient_pts = ORIENTATION_SCORE.get(orientation, 8)

    # Demande locale (/15) : objets similaires recherchés / actifs à proximité.
    if local_demand >= 6:
        demand_pts = 15
    elif local_demand >= 3:
        demand_pts = 12
    elif local_demand >= 1:
        demand_pts = 8
    else:
        demand_pts = 3
    # Bonus repreneur/partenaire local (jusqu'à +3, plafonné dans la demande).
    demand_pts = min(15, demand_pts + min(3, nearby_partners))

    # Impact CO₂ évité (/5).
    if co2_kg >= 100:
        co2_pts = 5
    elif co2_kg >= 50:
        co2_pts = 4
    elif co2_kg >= 20:
        co2_pts = 3
    elif co2_kg >= 5:
        co2_pts = 2
    else:
        co2_pts = 1

    # Durée de vie restante (/10) : proxy sur l'état.
    life_pts = round(ETAT_SCORE.get(etat_norm, 12) / 3)

    score = etat_pts + repar_pts + orient_pts + demand_pts + co2_pts + life_pts
    score = max(0, min(100, int(round(score))))

    if score >= 80:
        status, color = 'Réemploi direct', '#059669'
    elif score >= 60:
        status, color = 'Réemploi / réparation légère', '#2D7D46'
    elif score >= 40:
        status, color = 'Réparation', '#D97706'
    elif score >= 20:
        status, color = 'Pièces / recyclage', '#EA580C'
    else:
        status, color = 'Filière valorisation', '#DC2626'

    return {
        'score': score,
        'status': status,
        'color': color,
        'breakdown': {
            'etat': etat_pts,
            'reparabilite': repar_pts,
            'reemploi': orient_pts,
            'demande_locale': demand_pts,
            'impact_co2': co2_pts,
            'duree_vie': life_pts,
        },
    }


async def _analyze_with_gemini(image: "PIL.Image.Image", hint: str = "") -> Dict[str, Any]:
    """Appelle Gemini Vision et renvoie l'analyse structurée de l'objet."""
    model = genai.GenerativeModel(GEMINI_MODEL)
    cats = ", ".join(APP_CATEGORIES)

    prompt = f"""Tu es un expert en économie circulaire et réemploi d'objets d'occasion en France.
Analyse l'objet sur la photo{f" (indice utilisateur : {hint})" if hint else ""}.

Réponds UNIQUEMENT en JSON valide, sans texte autour :
{{
  "titre": "<titre court et vendeur pour une annonce, max 60 caractères>",
  "categorie": "<une seule valeur parmi: {cats}>",
  "product_type": "<type précis d'objet>",
  "etat": "<un de: neuf, très bon, bon, usé, abîmé, hors service>",
  "description": "<2-3 phrases décrivant l'objet, ses caractéristiques visibles et son état>",
  "prix_min": <prix de revente d'occasion minimum en euros, entier>,
  "prix_max": <prix de revente d'occasion maximum en euros, entier>,
  "reparabilite": "<un de: facile, moyenne, difficile, non_reparable>",
  "orientation": "<un de: revente, don, ressourcerie, reparation, recyclage>",
  "materiaux": ["<matériau principal>"],
  "poids_estime_kg": <poids estimé en kg>,
  "confidence": <0.0 à 1.0>
}}

Règles :
- prix_min/prix_max : marché de l'occasion français réaliste. Si l'objet est hors service, prix proches de 0.
- orientation : "revente" si bon état et valeur ; "don" si faible valeur mais utilisable ; "reparation" si réparable ; "ressourcerie" si à valoriser localement ; "recyclage" si fin de vie.
- categorie : exactement une valeur de la liste fournie."""

    response = await model.generate_content_async([prompt, image])
    text = response.text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    return json.loads(text)


def create_scan_routes(db, get_current_user_func):
    """Factory : routes Yondly Scan."""
    router = APIRouter(prefix="/api/scan", tags=["scan"])

    class ScanRequest(BaseModel):
        image_base64: str
        hint: Optional[str] = None
        lat: Optional[float] = None
        lng: Optional[float] = None

    @router.post("")
    async def scan_object(data: ScanRequest, current_user: dict = Depends(get_current_user_func)):
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=503, detail="Service d'analyse IA non configuré")

        # Décodage de l'image (supporte le préfixe data URI).
        raw_b64 = data.image_base64
        if "," in raw_b64 and raw_b64.strip().startswith("data:"):
            raw_b64 = raw_b64.split(",", 1)[1]
        try:
            import PIL.Image
            img_bytes = base64.b64decode(raw_b64)
            image = PIL.Image.open(io.BytesIO(img_bytes))
        except Exception:
            raise HTTPException(status_code=400, detail="Image invalide")

        # Analyse IA.
        try:
            ai = await _analyze_with_gemini(image, data.hint or "")
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Analyse IA indisponible: {str(e)[:80]}")

        categorie = ai.get("categorie") if ai.get("categorie") in APP_CATEGORIES else "Autre"
        etat_norm = _normalize_etat(ai.get("etat", "bon"))
        reparabilite = ai.get("reparabilite", "moyenne")
        if reparabilite not in REPARABILITE_SCORE:
            reparabilite = "moyenne"
        orientation = ai.get("orientation", "revente")
        if orientation not in ORIENTATIONS:
            orientation = "revente"

        # CO₂ évité : estimation ADEME par catégorie/type (cohérent avec le reste de l'app).
        co2_kg = round(get_base_co2_estimate(
            categorie, title=ai.get("product_type", ""), description=ai.get("description", "")
        ), 1)

        # Demande locale réelle : objets actifs de même catégorie (à proximité si géoloc).
        local_demand = 0
        nearby_partners = 0
        try:
            same_cat = await db.items.find(
                {"category": categorie, "status": "active"}
            ).to_list(500)
            if data.lat is not None and data.lng is not None:
                for it in same_cat:
                    if it.get("lat") and it.get("lng"):
                        if _haversine_km(data.lat, data.lng, it["lat"], it["lng"]) <= 20:
                            local_demand += 1
            else:
                local_demand = len(same_cat)

            partners = await db.stores.find({}).to_list(500)
            if data.lat is not None and data.lng is not None:
                for st in partners:
                    if st.get("lat") and st.get("lng"):
                        if _haversine_km(data.lat, data.lng, st["lat"], st["lng"]) <= 20:
                            nearby_partners += 1
            else:
                nearby_partners = min(5, len(partners))
        except Exception:
            pass

        circular = compute_circular_score(
            etat_norm, reparabilite, orientation, co2_kg, local_demand, nearby_partners
        )

        return {
            "titre": ai.get("titre", ai.get("product_type", "Objet")),
            "categorie": categorie,
            "product_type": ai.get("product_type"),
            "etat": ai.get("etat", "bon"),
            "etat_norm": etat_norm,
            "condition_form": _condition_for_form(etat_norm),
            "description": ai.get("description", ""),
            "prix_min": ai.get("prix_min", 0),
            "prix_max": ai.get("prix_max", 0),
            "reparabilite": reparabilite,
            "orientation": orientation,
            "materiaux": ai.get("materiaux", []),
            "poids_estime_kg": ai.get("poids_estime_kg"),
            "co2_evite_kg": co2_kg,
            "co2_equivalents": calculate_environmental_equivalents(co2_kg)["equivalents"],
            "circular_score": circular["score"],
            "circular_status": circular["status"],
            "circular_color": circular["color"],
            "circular_breakdown": circular["breakdown"],
            "local_demand": local_demand,
            "confidence": ai.get("confidence", 0.7),
        }

    return router
