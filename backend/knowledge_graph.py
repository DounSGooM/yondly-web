"""
Graphe de Connaissance Territorial (couche sur Supabase)
════════════════════════════════════════════════════════
Dérive un graphe (nœuds : catégories, zones, partenaires ; arêtes : offre,
demande, transactions) à partir des données relationnelles existantes
(items, orders, users, stores) et en extrait des INSIGHTS actionnables :

- demande non satisfaite (demande ≫ offre) → stimuler l'offre
- risque de recyclage (offre sans repreneur local) → orienter vers ressourcerie
- zones sous-couvertes (activité mais pas de partenaire) → implanter un relais
- recommandations d'orientation par catégorie
- tendances (demande en hausse/baisse vs période précédente)

Pas de base graphe dédiée : le graphe est calculé à la volée. Ces signaux
alimentent l'algorithme d'orientation et le Circular Score.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List


async def build_knowledge_graph(db, days: Optional[int] = 90, ville: Optional[str] = None) -> Dict[str, Any]:
    now = datetime.utcnow()
    since = now - timedelta(days=days) if days else None

    # ── Chargement des données ───────────────────────────────────────────
    users = await db.users.find({}).to_list(20000)
    user_city = {u["id"]: (u.get("city") or "—") for u in users}

    all_items = await db.items.find({}).to_list(20000)
    items_by_id = {it["id"]: it for it in all_items}

    def _in_period(doc):
        if not since:
            return True
        ca = doc.get("created_at")
        if isinstance(ca, str):
            try:
                ca = datetime.fromisoformat(ca.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                return True
        return ca >= since if ca else True

    active_items = [
        it for it in all_items
        if it.get("status") in ("active", "reserved", "completed") and _in_period(it)
    ]
    if ville:
        vl = ville.lower()
        active_items = [it for it in active_items if vl in user_city.get(it.get("owner_id"), "").lower()]

    orders = await db.orders.find({}).to_list(20000)
    orders_period = [o for o in orders if _in_period(o)]
    prev_orders = []
    if since:
        prev_start = now - timedelta(days=days * 2)
        prev_orders = [
            o for o in orders
            if o.get("created_at") and _order_between(o, prev_start, since)
        ]

    stores = await db.stores.find({}).to_list(20000)

    # ── Construction des nœuds & arêtes ──────────────────────────────────
    supply_by_cat: Dict[str, int] = {}
    supply_by_zone: Dict[str, int] = {}
    zone_cat_supply: Dict[tuple, int] = {}

    for it in active_items:
        cat = it.get("category", "Autre")
        commune = user_city.get(it.get("owner_id"), "—")
        supply_by_cat[cat] = supply_by_cat.get(cat, 0) + 1
        if commune != "—":
            supply_by_zone[commune] = supply_by_zone.get(commune, 0) + 1
            zone_cat_supply[(commune, cat)] = zone_cat_supply.get((commune, cat), 0) + 1

    def _demand_map(order_list):
        d: Dict[str, int] = {}
        for o in order_list:
            it = items_by_id.get(o.get("item_id"))
            if it:
                cat = it.get("category", "Autre")
                d[cat] = d.get(cat, 0) + 1
        return d

    demand_by_cat = _demand_map(orders_period)
    prev_demand_by_cat = _demand_map(prev_orders)

    # Partenaires (repreneurs potentiels) par commune
    partners_by_zone: Dict[str, int] = {}
    for st in stores:
        c = st.get("city") or "—"
        if c != "—":
            partners_by_zone[c] = partners_by_zone.get(c, 0) + 1

    all_cats = set(supply_by_cat) | set(demand_by_cat)

    # ── INSIGHTS ─────────────────────────────────────────────────────────
    # 1. Demande non satisfaite : demande nettement supérieure à l'offre.
    unmet_demand = []
    for cat in all_cats:
        s = supply_by_cat.get(cat, 0)
        d = demand_by_cat.get(cat, 0)
        gap = d - s
        if d >= 2 and gap > 0:
            severity = "haute" if (s == 0 or d >= 2 * max(1, s)) else "moyenne"
            unmet_demand.append({"category": cat, "supply": s, "demand": d, "gap": gap, "severity": severity})
    unmet_demand.sort(key=lambda x: -x["gap"])

    # 2. Risque de recyclage : offre présente mais quasi aucune demande.
    surplus_risk = []
    for cat in all_cats:
        s = supply_by_cat.get(cat, 0)
        d = demand_by_cat.get(cat, 0)
        if s >= 3 and d == 0:
            surplus_risk.append({"category": cat, "supply": s, "demand": d})
    surplus_risk.sort(key=lambda x: -x["supply"])

    # 3. Zones sous-couvertes : activité d'offre mais aucun partenaire/repreneur.
    underserved_zones = []
    for commune, s in supply_by_zone.items():
        p = partners_by_zone.get(commune, 0)
        if s >= 3 and p == 0:
            underserved_zones.append({"commune": commune, "supply": s, "partners": p})
    underserved_zones.sort(key=lambda x: -x["supply"])

    # 4. Tendances : évolution de la demande vs période précédente.
    trending = []
    for cat in all_cats:
        d = demand_by_cat.get(cat, 0)
        pd = prev_demand_by_cat.get(cat, 0)
        if d == 0 and pd == 0:
            continue
        if pd == 0:
            pct = 100 if d > 0 else 0
        else:
            pct = round(100 * (d - pd) / pd)
        trending.append({"category": cat, "demand": d, "prev": pd, "trend_pct": pct})
    trending.sort(key=lambda x: -x["trend_pct"])

    # 5. Recommandations d'orientation par catégorie.
    recommendations = []
    for x in unmet_demand[:3]:
        recommendations.append({
            "category": x["category"],
            "action": "Stimuler l'offre",
            "reason": f"{x['demand']} demandes pour {x['supply']} annonce(s) — besoin local non couvert.",
        })
    for x in surplus_risk[:3]:
        recommendations.append({
            "category": x["category"],
            "action": "Orienter vers ressourcerie / don",
            "reason": f"{x['supply']} objets en stock sans demande — risque de finir au rebut.",
        })
    for z in underserved_zones[:2]:
        recommendations.append({
            "category": z["commune"],
            "action": "Implanter un relais / partenaire",
            "reason": f"{z['supply']} objets déposés à {z['commune']} sans repreneur local.",
        })

    # ── Nœuds (pour visualisation éventuelle) ────────────────────────────
    category_nodes = [
        {"name": c, "supply": supply_by_cat.get(c, 0), "demand": demand_by_cat.get(c, 0)}
        for c in sorted(all_cats, key=lambda c: -(supply_by_cat.get(c, 0) + demand_by_cat.get(c, 0)))
    ]
    zone_nodes = [
        {"commune": z, "supply": supply_by_zone.get(z, 0), "partners": partners_by_zone.get(z, 0)}
        for z in sorted(supply_by_zone, key=lambda z: -supply_by_zone[z])
    ]

    return {
        "summary": {
            "categories": len(all_cats),
            "zones": len(supply_by_zone),
            "partners": sum(partners_by_zone.values()),
            "active_items": len(active_items),
            "transactions": len(orders_period),
        },
        "insights": {
            "unmet_demand": unmet_demand[:8],
            "surplus_risk": surplus_risk[:8],
            "underserved_zones": underserved_zones[:8],
            "trending": trending[:8],
            "recommendations": recommendations,
        },
        "nodes": {"categories": category_nodes[:12], "zones": zone_nodes[:12]},
        "period_days": days,
        "ville": ville,
        "generated_at": now.isoformat(),
    }


def _order_between(o, start, end) -> bool:
    ca = o.get("created_at")
    if isinstance(ca, str):
        try:
            ca = datetime.fromisoformat(ca.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            return False
    if not ca:
        return False
    return start <= ca < end
