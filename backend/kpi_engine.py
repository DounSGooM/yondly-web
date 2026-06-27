"""
KPI Engine — KPIs complets pour la monétisation B2G (collectivités).

Réécrit pour la couche Supabase : on charge les données avec find()/count_documents()
puis on agrège en Python (le wrapper ne supporte pas les pipelines Mongo complexes
ni `async for ... aggregate`). Colonnes alignées sur le schéma réel.
"""
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
import logging

# Statuts réels
ITEM_DONE = ("completed",)
ORDER_DONE = ("released",)

ADEME_CO2_BY_CATEGORY = {
    "Électronique": 50, "Multimédia": 50, "High-Tech": 50,
    "Vêtements": 12, "Mode": 12, "Maison": 50, "Mobilier": 50, "Meubles": 50,
    "Sport": 20, "Sports": 20, "Loisirs": 20, "Livres": 1.5,
    "Jeux & Jouets": 8, "Jouets": 8, "Enfants": 8,
    "Bricolage": 25, "Jardin": 25, "Beauté": 3, "Animaux": 5,
    "Musique": 5, "Véhicules": 500, "default": 10,
}


def _parse_dt(v) -> Optional[datetime]:
    if isinstance(v, datetime):
        return v.replace(tzinfo=None)
    if isinstance(v, str):
        try:
            return datetime.fromisoformat(v.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            return None
    return None


class KPIEngine:
    def __init__(self, db):
        self.db = db
        self._loaded = False

    async def _ensure_loaded(self, city: Optional[str] = None):
        if self._loaded:
            return
        self._users = await self.db.users.find({}).to_list(50000)
        self._items = await self.db.items.find({}).to_list(50000)
        self._orders = await self.db.orders.find({}).to_list(50000)
        try:
            self._deals = await self.db.deals.find({}).to_list(50000)
        except Exception:
            self._deals = []
        self._user_city = {u["id"]: (u.get("city") or None) for u in self._users}

        # Filtre ville (via le propriétaire pour les annonces)
        if city:
            cl = city.lower()
            self._users = [u for u in self._users if (u.get("city") or "").lower() == cl]
            self._items = [it for it in self._items
                           if (self._user_city.get(it.get("owner_id")) or "").lower() == cl]
            item_ids = {it["id"] for it in self._items}
            self._orders = [o for o in self._orders if o.get("item_id") in item_ids]
        self._items_by_id = {it["id"]: it for it in self._items}
        self._loaded = True

    async def get_all_kpis(self, city=None, zone=None, start_date=None, end_date=None) -> Dict:
        await self._ensure_loaded(city)
        return {
            "generated_at": datetime.utcnow().isoformat(),
            "filters": {"city": city, "zone": zone,
                        "start_date": start_date.isoformat() if start_date else None,
                        "end_date": end_date.isoformat() if end_date else None},
            "user_kpis": await self.get_user_kpis({}),
            "item_kpis": await self.get_item_kpis({}),
            "transaction_kpis": await self.get_transaction_kpis({}),
            "environmental_kpis": await self.get_environmental_kpis({}),
            "economic_kpis": await self.get_economic_kpis({}),
            "geographic_kpis": await self.get_geographic_kpis({}),
            "social_kpis": await self.get_social_kpis({}),
            "temporal_kpis": await self.get_temporal_kpis({}),
            "category_kpis": await self.get_category_kpis({}),
        }

    # ==================== USERS ====================
    async def get_user_kpis(self, filters: Dict) -> Dict:
        try:
            await self._ensure_loaded()
            now = datetime.utcnow()
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago, month_ago, year_ago = today - timedelta(days=7), today - timedelta(days=30), today - timedelta(days=365)
            users = self._users
            total = len(users)

            def newer(since):
                return sum(1 for u in users if (_parse_dt(u.get("created_at")) or now) >= since)

            new_week, new_month = newer(week_ago), newer(month_ago)
            pro = sum(1 for u in users if u.get("is_partner"))
            verified = sum(1 for u in users if u.get("verified_email"))
            with_photo = sum(1 for u in users if u.get("photo_url"))
            sellers = {it.get("owner_id") for it in self._items if it.get("owner_id")}

            # Vendeurs distincts par ville
            city_sellers: Dict[str, set] = {}
            for it in self._items:
                c = self._user_city.get(it.get("owner_id"))
                if c:
                    city_sellers.setdefault(c, set()).add(it.get("owner_id"))
            users_by_city = sorted(
                [{"city": c, "users": len(s)} for c, s in city_sellers.items()],
                key=lambda x: -x["users"])[:20]

            return {
                "total_users": total,
                "new_users_today": newer(today),
                "new_users_this_week": new_week,
                "new_users_this_month": new_month,
                "new_users_this_year": newer(year_ago),
                "growth_rate_weekly": round((new_week / max(total - new_week, 1)) * 100, 2),
                "growth_rate_monthly": round((new_month / max(total - new_month, 1)) * 100, 2),
                "pro_users": pro,
                "pro_ratio": round((pro / max(total, 1)) * 100, 2),
                "verified_users": verified,
                "verification_rate": round((verified / max(total, 1)) * 100, 2),
                "users_with_photo": with_photo,
                "profile_completion_rate": round((with_photo / max(total, 1)) * 100, 2),
                "active_sellers": len(sellers),
                "seller_activation_rate": round((len(sellers) / max(total, 1)) * 100, 2),
                "users_by_city": users_by_city,
            }
        except Exception as e:
            logging.error(f"User KPIs error: {e}")
            return {"error": str(e)}

    # ==================== ITEMS ====================
    async def get_item_kpis(self, filters: Dict) -> Dict:
        try:
            await self._ensure_loaded()
            now = datetime.utcnow()
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago, month_ago = today - timedelta(days=7), today - timedelta(days=30)
            items = self._items
            total = len(items)

            def cnt(pred):
                return sum(1 for it in items if pred(it))

            available = cnt(lambda i: i.get("status") == "active")
            sold = cnt(lambda i: i.get("status") == "completed")
            reserved = cnt(lambda i: i.get("status") == "reserved")
            donations = cnt(lambda i: i.get("type") == "donation")
            sales = cnt(lambda i: i.get("type") == "sale")
            rentals = cnt(lambda i: i.get("type") == "rent")
            antigaspi = len(self._deals)  # paniers anti-gaspi = table deals

            def newer(since):
                return sum(1 for i in items if (_parse_dt(i.get("created_at")) or now) >= since)

            prices = [(i.get("price_cents") or 0) / 100 for i in items if (i.get("price_cents") or 0) > 0]
            price_stats = {
                "avg": round(sum(prices) / len(prices), 2) if prices else 0,
                "min": round(min(prices), 2) if prices else 0,
                "max": round(max(prices), 2) if prices else 0,
            }

            cat_counts: Dict[str, int] = {}
            for i in items:
                cat_counts[i.get("category", "Autre")] = cat_counts.get(i.get("category", "Autre"), 0) + 1
            items_by_category = sorted([{"category": k, "count": v} for k, v in cat_counts.items()],
                                       key=lambda x: -x["count"])

            new_month = newer(month_ago)
            return {
                "total_items": total,
                "items_available": available, "items_sold": sold, "items_reserved": reserved,
                "total_donations": donations, "total_sales": sales, "total_rentals": rentals,
                "total_antigaspi_baskets": antigaspi,
                "donations_ratio": round((donations / max(total, 1)) * 100, 2),
                "sales_ratio": round((sales / max(total, 1)) * 100, 2),
                "rentals_ratio": round((rentals / max(total, 1)) * 100, 2),
                "antigaspi_ratio": round((antigaspi / max(total + antigaspi, 1)) * 100, 2),
                "new_items_today": newer(today), "new_items_this_week": newer(week_ago),
                "new_items_this_month": new_month, "avg_items_per_day": round(new_month / 30, 2),
                "price_average": price_stats["avg"], "price_min": price_stats["min"], "price_max": price_stats["max"],
                "conversion_rate": round((sold / max(total, 1)) * 100, 2),
                "items_by_category": items_by_category[:15],
            }
        except Exception as e:
            logging.error(f"Item KPIs error: {e}")
            return {"error": str(e)}

    # ==================== TRANSACTIONS ====================
    async def get_transaction_kpis(self, filters: Dict) -> Dict:
        try:
            await self._ensure_loaded()
            now = datetime.utcnow()
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago, month_ago = today - timedelta(days=7), today - timedelta(days=30)
            orders = self._orders
            total = len(orders)

            def cnt(pred):
                return sum(1 for o in orders if pred(o))

            completed = cnt(lambda o: o.get("payment_status") in ORDER_DONE)
            pending = cnt(lambda o: o.get("payment_status") in ("initiated", "escrowed"))
            cancelled = cnt(lambda o: o.get("payment_status") == "refunded")

            def newer(since):
                return sum(1 for o in orders if (_parse_dt(o.get("created_at")) or now) >= since)

            done_orders = [o for o in orders if o.get("payment_status") in ORDER_DONE]
            revenue_total = sum((o.get("amount_cents") or 0) for o in done_orders) / 100
            revenue_avg = revenue_total / len(done_orders) if done_orders else 0
            orders_month = newer(month_ago)

            return {
                "total_orders": total,
                "orders_completed": completed, "orders_pending": pending, "orders_cancelled": cancelled,
                "orders_today": newer(today), "orders_this_week": newer(week_ago), "orders_this_month": orders_month,
                "avg_orders_per_day": round(orders_month / 30, 2),
                "total_revenue": round(revenue_total, 2), "avg_order_value": round(revenue_avg, 2),
                "completion_rate": round((completed / max(total, 1)) * 100, 2),
                "cancellation_rate": round((cancelled / max(total, 1)) * 100, 2),
            }
        except Exception as e:
            logging.error(f"Transaction KPIs error: {e}")
            return {"error": str(e)}

    # ==================== ENVIRONMENTAL ====================
    async def get_environmental_kpis(self, filters: Dict) -> Dict:
        try:
            await self._ensure_loaded()
            done = [i for i in self._items if i.get("status") in ITEM_DONE]
            items_reused = len(done)
            donations_completed = sum(1 for i in done if i.get("type") == "donation")
            antigaspi_sold = sum(1 for d in self._deals if d.get("status") == "sold")

            precise_co2, with_ai, fallback_co2 = 0.0, 0, 0.0
            co2_by_type: Dict[str, Dict] = {}
            weight = 0.0
            fb_type = {"donation": 5.0, "sale": 10.0, "rent": 8.0, "exchange": 6.0, "service": 1.0}
            for i in done:
                est = i.get("co2_estimate") or {}
                co2 = float(est.get("co2_saved_kg") or 0) if isinstance(est, dict) else 0
                t = i.get("type") or "other"
                if co2 > 0:
                    precise_co2 += co2
                    with_ai += 1
                else:
                    fallback_co2 += ADEME_CO2_BY_CATEGORY.get(i.get("category"), ADEME_CO2_BY_CATEGORY["default"])
                bucket = co2_by_type.setdefault(t, {"count": 0, "co2_kg": 0.0})
                bucket["count"] += 1
                bucket["co2_kg"] += co2 if co2 > 0 else fb_type.get(t, 10.0)
                w = (est.get("breakdown") or {}).get("estimated_weight_kg") if isinstance(est, dict) else None
                weight += float(w) if w else 2.0
            for t in co2_by_type:
                co2_by_type[t]["co2_kg"] = round(co2_by_type[t]["co2_kg"], 2)

            total_co2 = precise_co2 + fallback_co2
            return {
                "total_items_reused": items_reused,
                "donations_completed": donations_completed,
                "antigaspi_baskets_sold": antigaspi_sold,
                "total_co2_saved_kg": round(total_co2, 2),
                "co2_from_ai_estimates_kg": round(precise_co2, 2),
                "co2_from_ademe_fallback_kg": round(fallback_co2, 2),
                "items_with_ai_estimate": with_ai,
                "ai_coverage_percent": round((with_ai / max(items_reused, 1)) * 100, 1),
                "co2_by_type": co2_by_type,
                "equivalents": {
                    "trees_year": round(total_co2 / 21, 1),
                    "car_km_avoided": round(total_co2 / 0.12, 0),
                    "flights_paris_london": round(total_co2 / 255, 2),
                    "smartphones_saved": round(total_co2 / 70, 1),
                    "streaming_hours": round(total_co2 / 0.036, 0),
                },
                "trees_equivalent": round(total_co2 / 21, 1),
                "car_km_avoided": round(total_co2 / 0.12, 0),
                "flights_avoided": round(total_co2 / 255, 2),
                "estimated_waste_avoided_kg": round(weight, 2),
                "circular_economy_contribution": round(total_co2 * 5, 2),
                "estimation_method": "ADEME + Gemini AI Hybrid",
                "data_source": "Base Carbone ADEME + Analyse IA contextuelle",
            }
        except Exception as e:
            logging.error(f"Environmental KPIs error: {e}")
            return {"error": str(e)}

    # ==================== ECONOMIC ====================
    async def get_economic_kpis(self, filters: Dict) -> Dict:
        try:
            await self._ensure_loaded()
            total_listed = sum((i.get("price_cents") or 0) for i in self._items) / 100
            done_orders = [o for o in self._orders if o.get("payment_status") in ORDER_DONE]
            total_transacted = sum((o.get("amount_cents") or 0) for o in done_orders) / 100
            buyer_savings = total_transacted * 0.6
            donations_value = total_listed * 0.2

            by_type: Dict[str, Dict] = {}
            for o in done_orders:
                it = self._items_by_id.get(o.get("item_id"))
                t = (it or {}).get("type", "autre")
                b = by_type.setdefault(t, {"sum": 0.0, "count": 0})
                b["sum"] += (o.get("amount_cents") or 0) / 100
                b["count"] += 1
            transaction_by_type = [
                {"type": t, "avg_value": round(b["sum"] / b["count"], 2) if b["count"] else 0, "count": b["count"]}
                for t, b in by_type.items()
            ]
            priced = sum(1 for i in self._items if (i.get("price_cents") or 0) > 0)
            return {
                "total_listed_value": round(total_listed, 2),
                "total_transacted_value": round(total_transacted, 2),
                "estimated_buyer_savings": round(buyer_savings, 2),
                "donations_value_estimate": round(donations_value, 2),
                "local_economic_circulation": round(total_transacted + donations_value, 2),
                "transaction_by_type": transaction_by_type,
                "avg_listing_price": round(total_listed / max(priced, 1), 2),
            }
        except Exception as e:
            logging.error(f"Economic KPIs error: {e}")
            return {"error": str(e)}

    # ==================== GEOGRAPHIC ====================
    async def get_geographic_kpis(self, filters: Dict) -> Dict:
        try:
            await self._ensure_loaded()
            by_city: Dict[str, Dict] = {}
            for i in self._items:
                c = self._user_city.get(i.get("owner_id"))
                if not c:
                    continue
                d = by_city.setdefault(c, {"city": c, "total_items": 0, "donations": 0,
                                           "sales": 0, "rentals": 0, "antigaspi": 0, "total_value": 0.0})
                d["total_items"] += 1
                t = i.get("type")
                if t == "donation": d["donations"] += 1
                elif t == "sale": d["sales"] += 1
                elif t == "rent": d["rentals"] += 1
                d["total_value"] += (i.get("price_cents") or 0) / 100
            cities_data = sorted(by_city.values(), key=lambda x: -x["total_items"])[:30]
            for c in cities_data:
                c["total_value"] = round(c["total_value"], 2)
            return {
                "unique_cities": len(by_city),
                "cities_data": cities_data,
                "top_city": cities_data[0] if cities_data else None,
                "neighborhoods_top_city": [],
                "geographic_coverage_score": min(len(by_city) * 10, 100),
            }
        except Exception as e:
            logging.error(f"Geographic KPIs error: {e}")
            return {"error": str(e)}

    # ==================== SOCIAL ====================
    async def get_social_kpis(self, filters: Dict) -> Dict:
        try:
            await self._ensure_loaded()
            total_messages = await self.db.messages.count_documents({})
            try:
                ratings = await self.db.ratings.find({}).to_list(50000)
            except Exception:
                ratings = []
            total_reviews = len(ratings)
            avg_rating = round(sum(r.get("rating", 0) for r in ratings) / total_reviews, 2) if total_reviews else 0

            seller_counts: Dict[str, int] = {}
            for i in self._items:
                oid = i.get("owner_id")
                if oid:
                    seller_counts[oid] = seller_counts.get(oid, 0) + 1
            engaged = sum(1 for c in seller_counts.values() if c >= 3)
            return {
                "total_messages_sent": total_messages,
                "total_conversations": 0,
                "total_favorites": 0,
                "total_reviews": total_reviews,
                "average_rating": avg_rating,
                "engaged_sellers": engaged,
                "messages_per_user": round(total_messages / max(len(self._users), 1), 2),
            }
        except Exception as e:
            logging.error(f"Social KPIs error: {e}")
            return {"error": str(e)}

    # ==================== TEMPORAL ====================
    async def get_temporal_kpis(self, filters: Dict) -> Dict:
        try:
            await self._ensure_loaded()
            since = datetime.utcnow() - timedelta(days=30)
            daily: Dict[str, int] = {}
            hours: Dict[int, int] = {}
            for i in self._items:
                dt = _parse_dt(i.get("created_at"))
                if not dt or dt < since:
                    continue
                key = dt.strftime("%Y-%m-%d")
                daily[key] = daily.get(key, 0) + 1
                hours[dt.hour] = hours.get(dt.hour, 0) + 1
            daily_items = [{"date": k, "items": v} for k, v in sorted(daily.items())]
            peak_hours = sorted([{"hour": h, "count": c} for h, c in hours.items()],
                                key=lambda x: -x["count"])[:5]
            return {
                "daily_items_last_30_days": daily_items,
                "weekly_items": [],
                "peak_activity_hours": peak_hours,
                "best_day": max(daily_items, key=lambda x: x["items"]) if daily_items else None,
                "avg_daily_items": round(sum(d["items"] for d in daily_items) / max(len(daily_items), 1), 2),
            }
        except Exception as e:
            logging.error(f"Temporal KPIs error: {e}")
            return {"error": str(e)}

    # ==================== CATEGORY ====================
    async def get_category_kpis(self, filters: Dict) -> Dict:
        try:
            await self._ensure_loaded()
            cats: Dict[str, Dict] = {}
            for i in self._items:
                cat = i.get("category")
                if not cat:
                    continue
                d = cats.setdefault(cat, {"category": cat, "total": 0, "donations": 0, "sales": 0,
                                          "_price_sum": 0.0, "_price_n": 0})
                d["total"] += 1
                if i.get("type") == "donation": d["donations"] += 1
                elif i.get("type") == "sale": d["sales"] += 1
                p = (i.get("price_cents") or 0) / 100
                if p > 0:
                    d["_price_sum"] += p
                    d["_price_n"] += 1
            categories = []
            for d in cats.values():
                avg_price = round(d["_price_sum"] / d["_price_n"], 2) if d["_price_n"] else 0
                categories.append({
                    "category": d["category"], "total": d["total"],
                    "donations": d["donations"], "sales": d["sales"], "avg_price": avg_price,
                    "donation_rate": round((d["donations"] / max(d["total"], 1)) * 100, 2),
                })
            categories.sort(key=lambda x: -x["total"])
            return {
                "categories": categories,
                "total_categories": len(categories),
                "top_category": categories[0] if categories else None,
                "most_donated_category": max(categories, key=lambda x: x["donations"]) if categories else None,
            }
        except Exception as e:
            logging.error(f"Category KPIs error: {e}")
            return {"error": str(e)}


async def get_comprehensive_kpis(db, city=None, zone=None, start_date=None, end_date=None):
    engine = KPIEngine(db)
    return await engine.get_all_kpis(city, zone, start_date, end_date)
