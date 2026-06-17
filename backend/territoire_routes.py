"""
Territoire Routes
Statistiques agrégées anonymisées pour les collectivités
"""
from fastapi import APIRouter
from typing import Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


async def _count(collection, query: dict) -> int:
    """count_documents avec fallback à 0 si la collection n'existe pas encore."""
    try:
        return await collection.count_documents(query)
    except Exception as e:
        logger.debug("territoire/stats: collection indisponible (%s)", e)
        return 0


def create_territoire_routes(db):
    """Factory — pas besoin d'authentification, données publiques anonymisées"""

    router = APIRouter(prefix="/api/territoire", tags=["territoire"])

    @router.get("/stats")
    async def get_territoire_stats(
        period: Optional[str] = "30j",   # "7j" | "30j" | "90j" | "total"
        ville: Optional[str] = None,
    ):
        """
        Stats agrégées anonymisées pour le dashboard territoire.
        Retourne des zéros si une collection n'existe pas encore —
        le frontend utilise alors ses données de démo.
        """
        now = datetime.utcnow()
        period_map = {"7j": 7, "30j": 30, "90j": 90}
        days = period_map.get(period, None)
        date_filter = {"$gte": now - timedelta(days=days)} if days else {}

        base_query: dict = {}
        if ville:
            base_query["ville"] = {"$regex": ville, "$options": "i"}

        time_query = {**base_query}
        if date_filter:
            time_query["created_at"] = date_filter

        # ── Alimentation & anti-gaspi ──────────────────────────────────────
        paniers_sauves = await _count(db.orders, {
            **time_query, "type": "anti_gaspi", "status": {"$in": ["completed", "picked_up"]}
        })
        kg_nourriture = paniers_sauves * 2

        dons_alimentaires = await _count(db.food_donations, {**time_query, "status": "completed"})

        producteurs_actifs = await _count(db.producteurs, {**base_query, "pat_partenaire": True})

        # ── Réemploi ───────────────────────────────────────────────────────
        objets_reemployes = await _count(db.orders, {
            **time_query, "type": {"$in": ["sale", "gift"]}, "status": "completed"
        })
        kg_dechets = objets_reemployes * 5

        locations_realisees = await _count(db.rental_contracts, {**time_query, "status": "completed"})

        # ── Impact CO2 ─────────────────────────────────────────────────────
        co2_kg = round(
            paniers_sauves * 3.5 +
            dons_alimentaires * 1.0 +
            objets_reemployes * 2.0 +
            locations_realisees * 0.5
        )

        # ── Solidarité ─────────────────────────────────────────────────────
        beneficiaires = await _count(db.asso_distributions, {**time_query})
        associations = await _count(db.users, {
            **base_query, "is_association": True, "association_verified": True
        })

        # ── Mobilisation citoyenne ─────────────────────────────────────────
        utilisateurs_actifs = await _count(db.users, {
            **base_query,
            "last_active": date_filter if date_filter else {"$exists": True},
        })
        commerces_engages = await _count(db.stores, {**base_query})

        # ── Évolution vs période précédente ───────────────────────────────
        evolution_co2_pct = 0
        evolution_dons_pct = 0

        if days:
            prev_start = now - timedelta(days=days * 2)
            prev_end = now - timedelta(days=days)
            prev_query = {**base_query, "created_at": {"$gte": prev_start, "$lt": prev_end}}

            prev_paniers = await _count(db.orders, {
                **prev_query, "type": "anti_gaspi", "status": {"$in": ["completed", "picked_up"]}
            })
            prev_objets = await _count(db.orders, {
                **prev_query, "type": {"$in": ["sale", "gift"]}, "status": "completed"
            })
            prev_dons = await _count(db.food_donations, {**prev_query, "status": "completed"})
            prev_co2 = round(prev_paniers * 3.5 + prev_dons * 1.0 + prev_objets * 2.0)

            if prev_co2 > 0:
                evolution_co2_pct = round(((co2_kg - prev_co2) / prev_co2) * 100)
            if prev_dons > 0:
                evolution_dons_pct = round(((dons_alimentaires - prev_dons) / prev_dons) * 100)

        return {
            "paniers_sauves": paniers_sauves,
            "kg_nourriture_sauves": kg_nourriture,
            "dons_alimentaires": dons_alimentaires,
            "producteurs_actifs": producteurs_actifs,
            "objets_reemployes": objets_reemployes,
            "kg_dechets_evites": kg_dechets,
            "locations_realisees": locations_realisees,
            "co2_economise_kg": co2_kg,
            "utilisateurs_actifs": utilisateurs_actifs,
            "commerces_engages": commerces_engages,
            "beneficiaires_aides": beneficiaires,
            "associations_partenaires": associations,
            "evolution_co2_pct": evolution_co2_pct,
            "evolution_dons_pct": evolution_dons_pct,
            "period": period,
            "ville": ville,
            "generated_at": now.isoformat(),
        }

    return router
