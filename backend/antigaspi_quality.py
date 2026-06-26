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

# Produits sensibles : risque sanitaire plus élevé.
# On NE bloque PAS à la création (friction minimale) — l'app affiche seulement un
# rappel de bonnes pratiques. Le contrôle se fait a posteriori via les signalements.
SENSITIVE_FOOD_CATEGORIES = {'traiteur_chaud', 'viande_poisson', 'plats_prepares'}

# Tailles de panier (1 tap à la création).
QUANTITY_SIZES = ['small', 'medium', 'large']
QUANTITY_SIZE_LABELS = {'small': 'Petit', 'medium': 'Moyen', 'large': 'Grand'}

# Longueur minimale d'une description pour être considérée "détaillée".
DETAILED_DESCRIPTION_MIN_LEN = 10

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
    """Produit à risque sanitaire plus élevé (rappel de bonnes pratiques côté app)."""
    return food_category in SENSITIVE_FOOD_CATEGORIES


def is_transparent_deal(payload: Dict[str, Any]) -> bool:
    """
    Un panier est "transparent" quand son contenu est décrit précisément et que
    ce n'est pas un panier surprise. Donne droit au badge + remontée dans les résultats.
    """
    contents = (payload.get('contents_description') or '').strip()
    return len(contents) >= DETAILED_DESCRIPTION_MIN_LEN and not payload.get('is_mystery')


def validate_deal_transparency(
    payload: Dict[str, Any],
    store: Optional[Dict[str, Any]] = None,
) -> Optional[str]:
    """
    Friction minimale à la création : on exige seulement le strict nécessaire pour
    qu'un client puisse décider (catégorie, taille, fenêtre de retrait).
    Le contrôle qualité se fait a posteriori via les signalements.

    Seule exception : un commerce déjà signalé (requires_detailed_description) doit
    décrire précisément chaque panier — friction réservée aux abuseurs.

    Retourne un message d'erreur (str) si invalide, sinon None.
    """
    # 1. Catégorie (1 tap).
    if not payload.get('food_category'):
        return "Choisis une catégorie de produit."

    # 2. Taille du panier (1 tap).
    if payload.get('quantity_size') not in QUANTITY_SIZES:
        return "Indique la taille du panier (petit, moyen ou grand)."

    # 3. Fenêtre de retrait.
    ps, pe = payload.get('pickup_start'), payload.get('pickup_end')
    if not ps or not pe:
        return "Indique la fenêtre de retrait (heure de début et de fin)."
    if (pe - ps).total_seconds() <= 0:
        return "La fin de la fenêtre de retrait doit être après le début."

    # 4. Contrôle a posteriori : description détaillée exigée seulement après infraction.
    if store and store.get('requires_detailed_description'):
        contents = (payload.get('contents_description') or '').strip()
        if len(contents) < DETAILED_DESCRIPTION_MIN_LEN:
            return (
                "Suite à des signalements, ton commerce doit décrire précisément le "
                "contenu de chaque panier pour pouvoir le publier."
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

    # Contrôle a posteriori : dès la 1re infraction (passage en WATCH/SUSPENDED),
    # le commerce devra décrire précisément ses paniers pour continuer à publier.
    if status in ("WATCH", "SUSPENDED"):
        update["requires_detailed_description"] = True

    await db.stores.update_one({"id": store_id}, {"$set": update})
    return update
