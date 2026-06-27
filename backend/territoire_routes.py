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
            "last_sign_in_at": date_filter if date_filter else {"$exists": True},
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

    # ════════════════════════════════════════════════════════════════════
    # IMPACT ENGINE — métriques territoriales calculées sur données réelles
    # ════════════════════════════════════════════════════════════════════

    # Poids moyen par catégorie (kg) — fallback quand l'annonce n'a pas de poids estimé.
    _CATEGORY_WEIGHT_KG = {
        "Électronique": 2, "Multimédia": 2, "Maison": 8, "Mobilier": 25,
        "Vêtements": 0.5, "Sport": 4, "Livres": 1, "Enfants": 3,
        "Jeux & Jouets": 1.5, "Jardin": 6, "Bricolage": 5, "Beauté": 0.3,
        "Animaux": 2, "Musique": 3, "Véhicules": 15, "Autre": 3,
    }
    _TYPE_LABELS = {
        "sale": "Revente", "donation": "Don", "rent": "Location",
        "exchange": "Échange", "service": "Service",
    }
    _DEFAULT_REUSE_VALUE_CENTS = 2000  # valeur de réemploi par défaut (objet sans prix)

    @router.get("/impact")
    async def get_territoire_impact(
        period: Optional[str] = "30j",
        ville: Optional[str] = None,
    ):
        """
        Impact Engine : agrégation temps réel de l'impact des échanges sur le
        territoire, à partir des données réelles (items + orders).
        """
        now = datetime.utcnow()
        period_map = {"7j": 7, "30j": 30, "90j": 90}
        days = period_map.get(period, None)

        # Carte user_id → ville (les annonces n'ont pas de ville, on passe par le propriétaire)
        users = await db.users.find({}).to_list(20000)
        user_city = {u["id"]: (u.get("city") or "—") for u in users}

        item_query: dict = {"status": {"$in": ["active", "reserved", "completed"]}}
        if days:
            item_query["created_at"] = {"$gte": now - timedelta(days=days)}
        items = await db.items.find(item_query).to_list(20000)

        # Filtre ville (via propriétaire) si demandé
        if ville:
            vl = ville.lower()
            items = [it for it in items if vl in (user_city.get(it.get("owner_id"), "")).lower()]

        co2_total = 0.0
        kg_total = 0.0
        valeur_reemploi_cents = 0
        type_counts: dict = {}
        category_deposees: dict = {}
        zones: dict = {}

        for it in items:
            cat = it.get("category", "Autre")
            typ = it.get("type", "sale")

            # CO₂ réel (co2_estimate stocké) sinon 0
            co2_est = it.get("co2_estimate") or {}
            if isinstance(co2_est, dict):
                co2_total += float(co2_est.get("co2_saved_kg") or 0)
                w = (co2_est.get("breakdown") or {}).get("estimated_weight_kg")
            else:
                w = None
            kg_total += float(w) if w else _CATEGORY_WEIGHT_KG.get(cat, 3)

            # Valeur de réemploi
            price = it.get("price_cents")
            valeur_reemploi_cents += price if price else _DEFAULT_REUSE_VALUE_CENTS

            type_counts[typ] = type_counts.get(typ, 0) + 1
            category_deposees[cat] = category_deposees.get(cat, 0) + 1
            commune = user_city.get(it.get("owner_id"), "—")
            if commune and commune != "—":
                zones[commune] = zones.get(commune, 0) + 1

        total_items = len(items)

        # Répartition par type d'orientation (revente / don / location / échange / service)
        repartition_type = [
            {
                "type": t,
                "label": _TYPE_LABELS.get(t, t),
                "count": c,
                "pct": round(100 * c / total_items) if total_items else 0,
            }
            for t, c in sorted(type_counts.items(), key=lambda x: -x[1])
        ]

        # Catégories demandées : via les commandes (jointure order.item_id → item.category)
        order_query: dict = {}
        if days:
            order_query["created_at"] = {"$gte": now - timedelta(days=days)}
        orders = await db.orders.find(order_query).to_list(20000)
        items_by_id = {it["id"]: it for it in items}
        # Charge aussi les items hors période pour résoudre les commandes anciennes
        if orders:
            missing_ids = {o.get("item_id") for o in orders} - set(items_by_id)
            if missing_ids:
                extra = await db.items.find({"id": {"$in": list(missing_ids)}}).to_list(20000)
                for it in extra:
                    items_by_id[it["id"]] = it

        category_demandees: dict = {}
        foyers = set()
        for o in orders:
            it = items_by_id.get(o.get("item_id"))
            if it:
                cat = it.get("category", "Autre")
                category_demandees[cat] = category_demandees.get(cat, 0) + 1
            if o.get("buyer_id"):
                foyers.add(o["buyer_id"])

        def _top(d, n=8):
            return [{"category": k, "count": v} for k, v in sorted(d.items(), key=lambda x: -x[1])[:n]]

        zones_actives = [
            {"commune": k, "count": v}
            for k, v in sorted(zones.items(), key=lambda x: -x[1])[:10]
        ]

        return {
            "co2_evite_kg": round(co2_total, 1),
            "co2_evite_tonnes": round(co2_total / 1000, 2),
            "kg_reemployes": round(kg_total),
            "valeur_reemploi_euros": round(valeur_reemploi_cents / 100),
            "foyers_aides": len(foyers),
            "total_annonces": total_items,
            "repartition_type": repartition_type,
            "zones_actives": zones_actives,
            "categories_deposees": _top(category_deposees),
            "categories_demandees": _top(category_demandees),
            "period": period,
            "ville": ville,
            "generated_at": now.isoformat(),
        }

    return router
