"""
Territoire Routes
Statistiques agrégées anonymisées pour les collectivités / PAT
"""
from fastapi import APIRouter
from typing import Optional
from datetime import datetime, timedelta


def create_territoire_routes(db):
    """Factory — pas besoin d'authentification, données publiques anonymisées"""

    router = APIRouter(prefix="/api/territoire", tags=["territoire"])

    @router.get("/stats")
    async def get_territoire_stats(
        period: Optional[str] = "30j",   # "7j" | "30j" | "90j" | "total"
        ville: Optional[str] = None,
    ):
        """
        Stats agrégées anonymisées pour le dashboard PAT.
        Utilisées par les collectivités pour suivre l'impact Yondly sur leur territoire.
        """
        # Calcul de la borne temporelle
        now = datetime.utcnow()
        period_map = {"7j": 7, "30j": 30, "90j": 90}
        days = period_map.get(period, None)
        date_filter = {"$gte": now - timedelta(days=days)} if days else {}

        base_query = {}
        if ville:
            base_query["ville"] = {"$regex": ville, "$options": "i"}

        time_query = {**base_query}
        if date_filter:
            time_query["created_at"] = date_filter

        # ── Alimentation & anti-gaspi ──────────────────────────────────────
        paniers_sauves = await db.orders.count_documents({
            **time_query, "type": "anti_gaspi", "status": {"$in": ["completed", "picked_up"]}
        })

        # Estimation : 1 panier = ~2 kg en moyenne
        kg_nourriture = paniers_sauves * 2

        dons_alimentaires = await db.food_donations.count_documents({**time_query, "status": "completed"})

        producteurs_actifs = await db.producteurs.count_documents({
            **base_query, "pat_partenaire": True
        })

        # ── Réemploi ───────────────────────────────────────────────────────
        objets_reemployes = await db.orders.count_documents({
            **time_query, "type": {"$in": ["sale", "gift"]}, "status": "completed"
        })

        # Estimation : 1 objet = ~5 kg de déchets évités en moyenne
        kg_dechets = objets_reemployes * 5

        locations_realisees = await db.rental_contracts.count_documents({
            **time_query, "status": "completed"
        })

        # ── Impact CO2 ─────────────────────────────────────────────────────
        # Calcul simplifié : paniers(3.5kg) + dons(1kg) + objets(2kg) + locations(0.5kg)
        co2_kg = round(
            paniers_sauves * 3.5 +
            dons_alimentaires * 1.0 +
            objets_reemployes * 2.0 +
            locations_realisees * 0.5
        )

        # ── Solidarité ─────────────────────────────────────────────────────
        beneficiaires = await db.asso_distributions.count_documents({**time_query})
        associations = await db.users.count_documents({
            **base_query, "is_association": True, "association_verified": True
        })

        # ── Mobilisation citoyenne ─────────────────────────────────────────
        utilisateurs_actifs = await db.users.count_documents({
            **base_query,
            "last_active": date_filter if date_filter else {"$exists": True}
        })

        commerces_engages = await db.stores.count_documents({**base_query})

        # ── Évolution vs période précédente ───────────────────────────────
        evolution_co2_pct = 0
        evolution_dons_pct = 0

        if days:
            prev_start = now - timedelta(days=days * 2)
            prev_end = now - timedelta(days=days)
            prev_query = {**base_query, "created_at": {"$gte": prev_start, "$lt": prev_end}}

            prev_paniers = await db.orders.count_documents({
                **prev_query, "type": "anti_gaspi", "status": {"$in": ["completed", "picked_up"]}
            })
            prev_objets = await db.orders.count_documents({
                **prev_query, "type": {"$in": ["sale", "gift"]}, "status": "completed"
            })
            prev_dons = await db.food_donations.count_documents({**prev_query, "status": "completed"})
            prev_co2 = round(prev_paniers * 3.5 + prev_dons * 1.0 + prev_objets * 2.0)

            if prev_co2 > 0:
                evolution_co2_pct = round(((co2_kg - prev_co2) / prev_co2) * 100)
            if prev_dons > 0:
                evolution_dons_pct = round(((dons_alimentaires - prev_dons) / prev_dons) * 100)

        return {
            # Alimentation
            "paniers_sauves": paniers_sauves,
            "kg_nourriture_sauves": kg_nourriture,
            "dons_alimentaires": dons_alimentaires,
            "producteurs_actifs": producteurs_actifs,
            # Réemploi
            "objets_reemployes": objets_reemployes,
            "kg_dechets_evites": kg_dechets,
            "locations_realisees": locations_realisees,
            # Impact global
            "co2_economise_kg": co2_kg,
            "utilisateurs_actifs": utilisateurs_actifs,
            "commerces_engages": commerces_engages,
            # Solidarité
            "beneficiaires_aides": beneficiaires,
            "associations_partenaires": associations,
            # Évolution
            "evolution_co2_pct": evolution_co2_pct,
            "evolution_dons_pct": evolution_dons_pct,
            # Métadonnées
            "period": period,
            "ville": ville,
            "generated_at": now.isoformat(),
        }

    return router
