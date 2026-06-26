"""
Qualité Anti-Gaspi Garantie
───────────────────────────
Logique métier pour garantir la qualité des paniers anti-gaspi :
- transparence obligatoire du contenu (pas de "panier mystère" sur produits sensibles)
- notation 3 axes (qualité / quantité / conformité)
- surveillance automatique puis suspension des commerçants qui abusent
- badge de fiabilité affiché sur la fiche commerçant

Le principe : on sauve un produit encore bon. On ne fait pas payer au client
la gestion des déchets du commerçant.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

# ─── Catégories alimentaires ─────────────────────────────────────────────────
FOOD_CATEGORIES = [
    'boulangerie', 'fruits_legumes', 'epicerie',
    'traiteur_froid', 'traiteur_chaud', 'viande_poisson',
    'plats_prepares', 'fleurs', 'autre',
]

FOOD_CATEGORY_LABELS = {
    'boulangerie': 'Boulangerie / Viennoiserie',
    'fruits_legumes': 'Fruits & Légumes',
    'epicerie': 'Épicerie / Produits secs',
    'traiteur_froid': 'Traiteur froid',
    'traiteur_chaud': 'Traiteur chaud',
    'viande_poisson': 'Viande / Poisson',
    'plats_prepares': 'Plats préparés',
    'fleurs': 'Fleurs',
    'autre': 'Autre',
}

# Produits sensibles : risque sanitaire élevé.
# → description détaillée OBLIGATOIRE, panier mystère INTERDIT, fenêtre de retrait courte.
SENSITIVE_FOOD_CATEGORIES = {'traiteur_chaud', 'viande_poisson', 'plats_prepares'}

# Fenêtre de retrait maximale (heures) pour les produits sensibles.
SENSITIVE_MAX_PICKUP_WINDOW_HOURS = 4
# Durée maximale entre la préparation et la fin du retrait pour un produit sensible.
SENSITIVE_MAX_AGE_HOURS = 6

# ─── Seuils de surveillance ──────────────────────────────────────────────────
# Nombre minimum d'avis avant d'afficher un taux de conformité.
MIN_REVIEWS_FOR_RATE = 5
# Un panier est considéré "conforme" si sa note de conformité est >= ce seuil.
CONFORMITY_OK_THRESHOLD = 3

# Mise sous surveillance (WATCH)
WATCH_REPORTS_THRESHOLD = 3          # signalements cumulés
WATCH_CONFORMITY_RATE = 70.0         # % conformité en dessous duquel on surveille
WATCH_MIN_REVIEWS = 5

# Suspension (SUSPENDED)
SUSPEND_REPORTS_THRESHOLD = 6
SUSPEND_CONFORMITY_RATE = 50.0
SUSPEND_MIN_REVIEWS = 10


def is_sensitive(food_category: Optional[str]) -> bool:
    """Le produit nécessite-t-il une transparence renforcée ?"""
    return food_category in SENSITIVE_FOOD_CATEGORIES


def validate_deal_transparency(payload: Dict[str, Any]) -> Optional[str]:
    """
    Vérifie qu'un panier respecte les règles de transparence anti-gaspi.
    Retourne un message d'erreur (str) si invalide, sinon None.

    `payload` attend : food_category, contents_description, is_mystery,
    pickup_start, pickup_end, prepared_at (datetime ou None).
    """
    food_category = payload.get('food_category')

    # Le contenu doit toujours être décrit (au moins sommairement).
    contents = (payload.get('contents_description') or '').strip()
    if food_category and len(contents) < 3 and not payload.get('description'):
        return "Merci d'indiquer ce que contient le panier (type de produits)."

    if is_sensitive(food_category):
        # 1. Pas de panier mystère sur produits sensibles.
        if payload.get('is_mystery'):
            return (
                "Les paniers mystère ne sont pas autorisés pour les produits sensibles "
                "(traiteur chaud, viande/poisson, plats préparés). Décris précisément le contenu."
            )
        # 2. Description détaillée obligatoire.
        if len(contents) < 10:
            return (
                "Pour un produit sensible, décris précisément le contenu du panier "
                "(au moins le type de plat et les ingrédients principaux)."
            )
        # 3. Fenêtre de retrait obligatoire et courte.
        ps, pe = payload.get('pickup_start'), payload.get('pickup_end')
        if not ps or not pe:
            return "Indique une fenêtre de retrait (début et fin) pour un produit sensible."
        window_h = (pe - ps).total_seconds() / 3600
        if window_h <= 0:
            return "La fin de la fenêtre de retrait doit être après le début."
        if window_h > SENSITIVE_MAX_PICKUP_WINDOW_HOURS:
            return (
                f"La fenêtre de retrait doit faire au maximum "
                f"{SENSITIVE_MAX_PICKUP_WINDOW_HOURS}h pour un produit sensible."
            )
        # 4. Âge maximal depuis la préparation.
        prepared = payload.get('prepared_at')
        if prepared and (pe - prepared).total_seconds() / 3600 > SENSITIVE_MAX_AGE_HOURS:
            return (
                f"Un produit sensible ne peut pas être retiré plus de "
                f"{SENSITIVE_MAX_AGE_HOURS}h après sa préparation."
            )
    return None


def compute_quality_status(
    reviews_count: int,
    conformity_rate: Optional[float],
    reports_count: int,
) -> str:
    """Détermine le statut qualité d'un commerçant à partir de ses métriques."""
    # Suspension
    if reports_count >= SUSPEND_REPORTS_THRESHOLD:
        return 'SUSPENDED'
    if (conformity_rate is not None
            and reviews_count >= SUSPEND_MIN_REVIEWS
            and conformity_rate < SUSPEND_CONFORMITY_RATE):
        return 'SUSPENDED'
    # Surveillance
    if reports_count >= WATCH_REPORTS_THRESHOLD:
        return 'WATCH'
    if (conformity_rate is not None
            and reviews_count >= WATCH_MIN_REVIEWS
            and conformity_rate < WATCH_CONFORMITY_RATE):
        return 'WATCH'
    return 'OK'


def build_quality_badge(store: Dict[str, Any]) -> Dict[str, Any]:
    """
    Construit le badge de fiabilité affiché aux utilisateurs à partir des
    champs dénormalisés du store.
    """
    count = store.get('basket_reviews_count', 0) or 0
    rate = store.get('conformity_rate')
    status = store.get('quality_status', 'OK')

    if status == 'SUSPENDED':
        return {
            'tier': 'suspended',
            'label': 'Commerçant suspendu',
            'color': '#DC2626',
            'icon': 'alert-circle',
            'conformity_rate': rate,
            'reviews_count': count,
        }

    if count < MIN_REVIEWS_FOR_RATE or rate is None:
        return {
            'tier': 'new',
            'label': 'Nouveau commerçant',
            'color': '#6B7280',
            'icon': 'sparkles',
            'conformity_rate': None,
            'reviews_count': count,
        }

    pct = round(rate)
    if status == 'WATCH' or rate < WATCH_CONFORMITY_RATE:
        tier, color, icon = 'watch', '#D97706', 'eye'
    elif rate >= 90:
        tier, color, icon = 'reliable', '#059669', 'shield-checkmark'
    else:
        tier, color, icon = 'good', '#2D7D46', 'checkmark-circle'

    return {
        'tier': tier,
        'label': f'{pct}% de paniers conformes',
        'color': color,
        'icon': icon,
        'conformity_rate': rate,
        'reviews_count': count,
    }


async def recompute_store_quality(db, store_id: str) -> Dict[str, Any]:
    """
    Recalcule les métriques qualité d'un commerçant à partir de ses avis et
    signalements, met à jour le store, et retourne les métriques.
    À appeler après chaque nouvel avis ou signalement.
    """
    reviews: List[Dict[str, Any]] = await db.basket_reviews.find(
        {"store_id": store_id}
    ).to_list(None)

    count = len(reviews)
    avg_quality = avg_quantity = avg_conformity = None
    conformity_rate = None

    if count:
        avg_quality = round(sum(r["quality"] for r in reviews) / count, 2)
        avg_quantity = round(sum(r["quantity"] for r in reviews) / count, 2)
        avg_conformity = round(sum(r["conformity"] for r in reviews) / count, 2)
        conforming = sum(1 for r in reviews if r["conformity"] >= CONFORMITY_OK_THRESHOLD)
        conformity_rate = round(100.0 * conforming / count, 1)

    reports_total = await db.basket_reports.count_documents({"store_id": store_id})
    reports_open = await db.basket_reports.count_documents(
        {"store_id": store_id, "status": "open"}
    )

    status = compute_quality_status(count, conformity_rate, reports_total)

    update = {
        "basket_reviews_count": count,
        "avg_quality": avg_quality,
        "avg_quantity": avg_quantity,
        "avg_conformity": avg_conformity,
        "conformity_rate": conformity_rate,
        "reports_count": reports_total,
        "reports_open_count": reports_open,
        "quality_status": status,
    }

    # Trace la date de changement de statut.
    current = await db.stores.find_one({"id": store_id})
    if current and current.get("quality_status") != status:
        update["quality_status_since"] = datetime.utcnow()

    await db.stores.update_one({"id": store_id}, {"$set": update})
    return update
