"""
KPI Engine - Comprehensive Key Performance Indicators for B2G Monetization
Provides all metrics needed for collectivities, communes, and associations.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from bson import ObjectId
import logging


class KPIEngine:
    """Calculate all KPIs for the platform."""

    def __init__(self, db):
        self.db = db

    async def get_all_kpis(self, city: Optional[str] = None, zone: Optional[str] = None,
                           start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict:
        """Get all KPIs with optional filters."""
        filters = self._build_filters(city, zone, start_date, end_date)

        return {
            "generated_at": datetime.utcnow().isoformat(),
            "filters": {
                "city": city,
                "zone": zone,
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None,
            },
            "user_kpis": await self.get_user_kpis(filters),
            "item_kpis": await self.get_item_kpis(filters),
            "transaction_kpis": await self.get_transaction_kpis(filters),
            "environmental_kpis": await self.get_environmental_kpis(filters),
            "economic_kpis": await self.get_economic_kpis(filters),
            "geographic_kpis": await self.get_geographic_kpis(filters),
            "social_kpis": await self.get_social_kpis(filters),
            "temporal_kpis": await self.get_temporal_kpis(filters),
            "category_kpis": await self.get_category_kpis(filters),
        }

    def _build_filters(self, city, zone, start_date, end_date) -> Dict:
        """Build MongoDB filter queries."""
        filters = {}
        if city:
            filters["city"] = city
        if start_date:
            filters["start_date"] = start_date
        if end_date:
            filters["end_date"] = end_date
        return filters

    # ==================== USER KPIs ====================
    async def get_user_kpis(self, filters: Dict) -> Dict:
        """All user-related KPIs."""
        try:
            now = datetime.utcnow()
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago = today - timedelta(days=7)
            month_ago = today - timedelta(days=30)
            year_ago = today - timedelta(days=365)

            # Total users
            total_users = await self.db.users.count_documents({})

            # New users by period
            new_today = await self.db.users.count_documents({"created_at": {"$gte": today}})
            new_week = await self.db.users.count_documents({"created_at": {"$gte": week_ago}})
            new_month = await self.db.users.count_documents({"created_at": {"$gte": month_ago}})
            new_year = await self.db.users.count_documents({"created_at": {"$gte": year_ago}})

            # Pro accounts
            pro_users = await self.db.users.count_documents({"is_pro": True})

            # Verified users
            verified_users = await self.db.users.count_documents({"email_verified": True})

            # Users with profile photo
            users_with_photo = await self.db.users.count_documents({"photo": {"$exists": True, "$ne": None}})

            # Active users (have posted at least 1 item)
            active_sellers = await self.db.items.distinct("seller_id")

            # Users by city (if location tracked)
            users_by_city = []
            pipeline = [
                {"$lookup": {"from": "items", "localField": "_id", "foreignField": "seller_id", "as": "items"}},
                {"$unwind": {"path": "$items", "preserveNullAndEmptyArrays": False}},
                {"$group": {"_id": "$items.location.city", "count": {"$sum": 1}}},
                {"$match": {"_id": {"$ne": None}}},
                {"$sort": {"count": -1}},
                {"$limit": 20}
            ]
            async for doc in self.db.users.aggregate(pipeline):
                users_by_city.append({"city": doc["_id"], "users": doc["count"]})

            return {
                "total_users": total_users,
                "new_users_today": new_today,
                "new_users_this_week": new_week,
                "new_users_this_month": new_month,
                "new_users_this_year": new_year,
                "growth_rate_weekly": round((new_week / max(total_users - new_week, 1)) * 100, 2),
                "growth_rate_monthly": round((new_month / max(total_users - new_month, 1)) * 100, 2),
                "pro_users": pro_users,
                "pro_ratio": round((pro_users / max(total_users, 1)) * 100, 2),
                "verified_users": verified_users,
                "verification_rate": round((verified_users / max(total_users, 1)) * 100, 2),
                "users_with_photo": users_with_photo,
                "profile_completion_rate": round((users_with_photo / max(total_users, 1)) * 100, 2),
                "active_sellers": len(active_sellers),
                "seller_activation_rate": round((len(active_sellers) / max(total_users, 1)) * 100, 2),
                "users_by_city": users_by_city,
            }
        except Exception as e:
            logging.error(f"User KPIs error: {e}")
            return {"error": str(e)}

    # ==================== ITEM KPIs ====================
    async def get_item_kpis(self, filters: Dict) -> Dict:
        """All item/listing related KPIs."""
        try:
            now = datetime.utcnow()
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago = today - timedelta(days=7)
            month_ago = today - timedelta(days=30)

            # Total items
            total_items = await self.db.items.count_documents({})

            # Items by status
            available = await self.db.items.count_documents({"status": "available"})
            sold = await self.db.items.count_documents({"status": "sold"})
            reserved = await self.db.items.count_documents({"status": "reserved"})

            # Items by type
            donations = await self.db.items.count_documents({"type": "donation"})
            sales = await self.db.items.count_documents({"type": "sale"})
            rentals = await self.db.items.count_documents({"type": "rent"})
            antigaspi = await self.db.items.count_documents({"type": "antigaspi"})

            # New items by period
            new_today = await self.db.items.count_documents({"created_at": {"$gte": today}})
            new_week = await self.db.items.count_documents({"created_at": {"$gte": week_ago}})
            new_month = await self.db.items.count_documents({"created_at": {"$gte": month_ago}})

            # Average price
            price_pipeline = [
                {"$match": {"price": {"$exists": True, "$gt": 0}}},
                {"$group": {"_id": None, "avg": {"$avg": "$price"}, "min": {"$min": "$price"}, "max": {"$max": "$price"}}}
            ]
            price_stats = {"avg": 0, "min": 0, "max": 0}
            async for doc in self.db.items.aggregate(price_pipeline):
                price_stats = {"avg": round(doc["avg"], 2), "min": doc["min"], "max": doc["max"]}

            # Items by category
            category_pipeline = [
                {"$group": {"_id": "$category", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            items_by_category = []
            async for doc in self.db.items.aggregate(category_pipeline):
                if doc["_id"]:
                    items_by_category.append({"category": doc["_id"], "count": doc["count"]})

            # Conversion rate (items sold / items posted)
            conversion_rate = round((sold / max(total_items, 1)) * 100, 2)

            return {
                "total_items": total_items,
                "items_available": available,
                "items_sold": sold,
                "items_reserved": reserved,
                "total_donations": donations,
                "total_sales": sales,
                "total_rentals": rentals,
                "total_antigaspi_baskets": antigaspi,
                "donations_ratio": round((donations / max(total_items, 1)) * 100, 2),
                "sales_ratio": round((sales / max(total_items, 1)) * 100, 2),
                "rentals_ratio": round((rentals / max(total_items, 1)) * 100, 2),
                "antigaspi_ratio": round((antigaspi / max(total_items, 1)) * 100, 2),
                "new_items_today": new_today,
                "new_items_this_week": new_week,
                "new_items_this_month": new_month,
                "avg_items_per_day": round(new_month / 30, 2),
                "price_average": price_stats["avg"],
                "price_min": price_stats["min"],
                "price_max": price_stats["max"],
                "conversion_rate": conversion_rate,
                "items_by_category": items_by_category[:15],
            }
        except Exception as e:
            logging.error(f"Item KPIs error: {e}")
            return {"error": str(e)}

    # ==================== TRANSACTION KPIs ====================
    async def get_transaction_kpis(self, filters: Dict) -> Dict:
        """All transaction/order related KPIs."""
        try:
            now = datetime.utcnow()
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago = today - timedelta(days=7)
            month_ago = today - timedelta(days=30)

            # Total orders
            total_orders = await self.db.orders.count_documents({})
            completed = await self.db.orders.count_documents({"status": "completed"})
            pending = await self.db.orders.count_documents({"status": "pending"})
            cancelled = await self.db.orders.count_documents({"status": "cancelled"})

            # Orders by period
            orders_today = await self.db.orders.count_documents({"created_at": {"$gte": today}})
            orders_week = await self.db.orders.count_documents({"created_at": {"$gte": week_ago}})
            orders_month = await self.db.orders.count_documents({"created_at": {"$gte": month_ago}})

            # Revenue
            revenue_pipeline = [
                {"$match": {"status": "completed"}},
                {"$group": {"_id": None, "total": {"$sum": "$total_amount"}, "avg": {"$avg": "$total_amount"}}}
            ]
            revenue = {"total": 0, "avg": 0}
            async for doc in self.db.orders.aggregate(revenue_pipeline):
                revenue = {"total": round(doc["total"] or 0, 2), "avg": round(doc["avg"] or 0, 2)}

            # Cancellation rate
            cancellation_rate = round((cancelled / max(total_orders, 1)) * 100, 2)
            completion_rate = round((completed / max(total_orders, 1)) * 100, 2)

            return {
                "total_orders": total_orders,
                "orders_completed": completed,
                "orders_pending": pending,
                "orders_cancelled": cancelled,
                "orders_today": orders_today,
                "orders_this_week": orders_week,
                "orders_this_month": orders_month,
                "avg_orders_per_day": round(orders_month / 30, 2),
                "total_revenue": revenue["total"],
                "avg_order_value": revenue["avg"],
                "completion_rate": completion_rate,
                "cancellation_rate": cancellation_rate,
            }
        except Exception as e:
            logging.error(f"Transaction KPIs error: {e}")
            return {"error": str(e)}

    # ==================== ENVIRONMENTAL KPIs ====================
    async def get_environmental_kpis(self, filters: Dict) -> Dict:
        """Environmental impact KPIs - Enhanced with AI estimations."""
        try:
            # Items reused (sold + donated)
            items_reused = await self.db.items.count_documents({"status": {"$in": ["sold", "completed"]}})
            donations_completed = await self.db.items.count_documents({"type": "donation", "status": {"$in": ["sold", "completed"]}})
            antigaspi_sold = await self.db.items.count_documents({"type": "antigaspi", "status": {"$in": ["sold", "completed"]}})

            # Try to get precise CO2 from stored AI estimates
            co2_pipeline = [
                {"$match": {"status": {"$in": ["sold", "completed"]}, "co2_estimate.co2_saved_kg": {"$exists": True}}},
                {"$group": {"_id": None, "total_co2": {"$sum": "$co2_estimate.co2_saved_kg"}}}
            ]

            precise_co2 = 0
            items_with_ai_estimate = 0
            async for doc in self.db.items.aggregate(co2_pipeline):
                precise_co2 = doc.get("total_co2", 0)

            items_with_ai_estimate = await self.db.items.count_documents({
                "status": {"$in": ["sold", "completed"]},
                "co2_estimate.co2_saved_kg": {"$exists": True}
            })

            # Fallback: ADEME base estimates for items without AI estimation
            # Category-based CO2 values (kg) - from ADEME Base Carbone
            ADEME_CO2_BY_CATEGORY = {
                "Électronique": 50, "High-Tech": 50,
                "Vêtements": 12, "Mode": 12,
                "Maison": 50, "Meubles": 50,
                "Sports": 20, "Loisirs": 20,
                "Livres": 1.5, "Jouets": 8,
                "Bricolage": 25, "Jardin": 25,
                "Boulangerie": 2.5, "Restaurant": 2.5, "Épicerie": 2.5,
                "default": 10
            }

            # Calculate CO2 for items without AI estimate
            remaining_items_pipeline = [
                {"$match": {"status": {"$in": ["sold", "completed"]}, "co2_estimate": {"$exists": False}}},
                {"$group": {"_id": "$category", "count": {"$sum": 1}}}
            ]

            fallback_co2 = 0
            async for doc in self.db.items.aggregate(remaining_items_pipeline):
                category = doc["_id"] or "default"
                co2_per_item = ADEME_CO2_BY_CATEGORY.get(category, ADEME_CO2_BY_CATEGORY["default"])
                fallback_co2 += doc["count"] * co2_per_item

            # Total CO2 saved (AI estimates + fallback)
            total_co2_saved = precise_co2 + fallback_co2

            # Breakdown by type
            co2_by_type_pipeline = [
                {"$match": {"status": {"$in": ["sold", "completed"]}}},
                {"$group": {
                    "_id": "$type",
                    "count": {"$sum": 1},
                    "ai_co2": {"$sum": {"$ifNull": ["$co2_estimate.co2_saved_kg", 0]}}
                }}
            ]

            co2_by_type = {}
            async for doc in self.db.items.aggregate(co2_by_type_pipeline):
                item_type = doc["_id"] or "other"
                # Add fallback for items without AI estimate
                fallback_type = {
                    "donation": 5.0, "sale": 10.0, "rent": 8.0, "antigaspi": 2.5
                }.get(item_type, 10.0)
                co2_by_type[item_type] = {
                    "count": doc["count"],
                    "co2_kg": round(doc["ai_co2"] or doc["count"] * fallback_type, 2)
                }

            # Equivalent calculations
            trees_equivalent = round(total_co2_saved / 21, 1)  # 1 tree absorbs ~21kg CO2/year
            car_km_equivalent = round(total_co2_saved / 0.12, 0)  # ~120g CO2/km
            flights_equivalent = round(total_co2_saved / 255, 2)  # Paris-London ~255kg
            smartphones_equivalent = round(total_co2_saved / 70, 1)  # 1 smartphone ~70kg
            streaming_hours = round(total_co2_saved / 0.036, 0)  # 1h streaming ~36g

            # Weight estimate
            weight_pipeline = [
                {"$match": {"status": {"$in": ["sold", "completed"]}, "co2_estimate.breakdown.estimated_weight_kg": {"$exists": True}}},
                {"$group": {"_id": None, "total_weight": {"$sum": "$co2_estimate.breakdown.estimated_weight_kg"}}}
            ]
            estimated_weight = items_reused * 2  # Default 2kg per item
            async for doc in self.db.items.aggregate(weight_pipeline):
                estimated_weight = doc.get("total_weight", estimated_weight)

            return {
                "total_items_reused": items_reused,
                "donations_completed": donations_completed,
                "antigaspi_baskets_sold": antigaspi_sold,

                # CO2 metrics
                "total_co2_saved_kg": round(total_co2_saved, 2),
                "co2_from_ai_estimates_kg": round(precise_co2, 2),
                "co2_from_ademe_fallback_kg": round(fallback_co2, 2),
                "items_with_ai_estimate": items_with_ai_estimate,
                "ai_coverage_percent": round((items_with_ai_estimate / max(items_reused, 1)) * 100, 1),

                # Breakdown by type
                "co2_by_type": co2_by_type,

                # Equivalents
                "equivalents": {
                    "trees_year": trees_equivalent,
                    "car_km_avoided": car_km_equivalent,
                    "flights_paris_london": flights_equivalent,
                    "smartphones_saved": smartphones_equivalent,
                    "streaming_hours": streaming_hours,
                },

                # Legacy fields (backward compatibility)
                "trees_equivalent": trees_equivalent,
                "car_km_avoided": car_km_equivalent,
                "flights_avoided": flights_equivalent,

                "estimated_waste_avoided_kg": round(estimated_weight, 2),
                "circular_economy_contribution": round(total_co2_saved * 5, 2),

                # Data source info
                "estimation_method": "ADEME + Gemini AI Hybrid",
                "data_source": "Base Carbone ADEME + Analyse IA contextuelle"
            }
        except Exception as e:
            logging.error(f"Environmental KPIs error: {e}")
            return {"error": str(e)}

    # ==================== ECONOMIC KPIs ====================
    async def get_economic_kpis(self, filters: Dict) -> Dict:
        """Economic impact KPIs for the local economy."""
        try:
            # Total value of items listed
            value_pipeline = [
                {"$match": {"price": {"$exists": True, "$gt": 0}}},
                {"$group": {"_id": None, "total": {"$sum": "$price"}}}
            ]
            total_listed_value = 0
            async for doc in self.db.items.aggregate(value_pipeline):
                total_listed_value = round(doc["total"], 2)

            # Value of completed transactions
            transaction_pipeline = [
                {"$match": {"status": "completed"}},
                {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
            ]
            total_transacted = 0
            async for doc in self.db.orders.aggregate(transaction_pipeline):
                total_transacted = round(doc["total"] or 0, 2)

            # Estimated savings for buyers (buying second-hand vs new)
            # Assume 60% savings on average vs new price
            buyer_savings = round(total_transacted * 0.6, 2)

            # Value of donations (market value of donated items)
            donations_value = total_listed_value * 0.2  # Estimate 20% of listings are donations

            # Local economic circulation
            local_economic_value = total_transacted + donations_value

            # Average transaction by type
            avg_sale = 0
            avg_rental = 0
            type_pipeline = [
                {"$match": {"status": "completed"}},
                {"$lookup": {"from": "items", "localField": "item_id", "foreignField": "_id", "as": "item"}},
                {"$unwind": "$item"},
                {"$group": {"_id": "$item.type", "avg": {"$avg": "$total_amount"}, "count": {"$sum": 1}}}
            ]
            transaction_by_type = []
            async for doc in self.db.orders.aggregate(type_pipeline):
                transaction_by_type.append({
                    "type": doc["_id"],
                    "avg_value": round(doc["avg"] or 0, 2),
                    "count": doc["count"]
                })

            return {
                "total_listed_value": total_listed_value,
                "total_transacted_value": total_transacted,
                "estimated_buyer_savings": buyer_savings,
                "donations_value_estimate": round(donations_value, 2),
                "local_economic_circulation": round(local_economic_value, 2),
                "transaction_by_type": transaction_by_type,
                "avg_listing_price": round(total_listed_value / max(await self.db.items.count_documents({"price": {"$gt": 0}}), 1), 2),
            }
        except Exception as e:
            logging.error(f"Economic KPIs error: {e}")
            return {"error": str(e)}

    # ==================== GEOGRAPHIC KPIs ====================
    async def get_geographic_kpis(self, filters: Dict) -> Dict:
        """Geographic distribution KPIs."""
        try:
            # Items by city
            city_pipeline = [
                {"$match": {"location.city": {"$exists": True, "$ne": None}}},
                {"$group": {
                    "_id": "$location.city",
                    "items": {"$sum": 1},
                    "donations": {"$sum": {"$cond": [{"$eq": ["$type", "donation"]}, 1, 0]}},
                    "sales": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, 1, 0]}},
                    "rentals": {"$sum": {"$cond": [{"$eq": ["$type", "rent"]}, 1, 0]}},
                    "antigaspi": {"$sum": {"$cond": [{"$eq": ["$type", "antigaspi"]}, 1, 0]}},
                    "total_value": {"$sum": {"$ifNull": ["$price", 0]}},
                }},
                {"$sort": {"items": -1}},
                {"$limit": 30}
            ]

            cities_data = []
            async for doc in self.db.items.aggregate(city_pipeline):
                cities_data.append({
                    "city": doc["_id"],
                    "total_items": doc["items"],
                    "donations": doc["donations"],
                    "sales": doc["sales"],
                    "rentals": doc["rentals"],
                    "antigaspi": doc["antigaspi"],
                    "total_value": round(doc["total_value"], 2),
                })

            # By neighborhood (for top city)
            neighborhoods_data = []
            if cities_data:
                top_city = cities_data[0]["city"]
                neighborhood_pipeline = [
                    {"$match": {"location.city": top_city}},
                    {"$group": {
                        "_id": "$location.neighborhood",
                        "items": {"$sum": 1},
                    }},
                    {"$sort": {"items": -1}},
                    {"$limit": 15}
                ]
                async for doc in self.db.items.aggregate(neighborhood_pipeline):
                    neighborhoods_data.append({
                        "neighborhood": doc["_id"] or "Non défini",
                        "items": doc["items"],
                    })

            # Geographic coverage
            unique_cities = len(cities_data)

            return {
                "unique_cities": unique_cities,
                "cities_data": cities_data,
                "top_city": cities_data[0] if cities_data else None,
                "neighborhoods_top_city": neighborhoods_data,
                "geographic_coverage_score": min(unique_cities * 10, 100),  # 0-100 scale
            }
        except Exception as e:
            logging.error(f"Geographic KPIs error: {e}")
            return {"error": str(e)}

    # ==================== SOCIAL/ENGAGEMENT KPIs ====================
    async def get_social_kpis(self, filters: Dict) -> Dict:
        """Social and engagement KPIs."""
        try:
            # Messages/conversations
            total_messages = await self.db.messages.count_documents({}) if "messages" in await self.db.list_collection_names() else 0
            total_conversations = await self.db.conversations.count_documents({}) if "conversations" in await self.db.list_collection_names() else 0

            # Favorites
            total_favorites = 0
            favorites_pipeline = [{"$project": {"favorites_count": {"$size": {"$ifNull": ["$favorites", []]}}}}]
            async for doc in self.db.users.aggregate(favorites_pipeline):
                total_favorites += doc.get("favorites_count", 0)

            # Reviews/ratings
            total_reviews = await self.db.reviews.count_documents({}) if "reviews" in await self.db.list_collection_names() else 0

            # Average rating
            avg_rating = 0
            if total_reviews > 0:
                rating_pipeline = [{"$group": {"_id": None, "avg": {"$avg": "$rating"}}}]
                async for doc in self.db.reviews.aggregate(rating_pipeline):
                    avg_rating = round(doc["avg"], 2)

            # Users with multiple items (engaged sellers)
            multi_item_sellers_pipeline = [
                {"$group": {"_id": "$seller_id", "count": {"$sum": 1}}},
                {"$match": {"count": {"$gte": 3}}}
            ]
            engaged_sellers = 0
            async for _ in self.db.items.aggregate(multi_item_sellers_pipeline):
                engaged_sellers += 1

            return {
                "total_messages_sent": total_messages,
                "total_conversations": total_conversations,
                "total_favorites": total_favorites,
                "total_reviews": total_reviews,
                "average_rating": avg_rating,
                "engaged_sellers": engaged_sellers,  # 3+ items posted
                "messages_per_user": round(total_messages / max(await self.db.users.count_documents({}), 1), 2),
            }
        except Exception as e:
            logging.error(f"Social KPIs error: {e}")
            return {"error": str(e)}

    # ==================== TEMPORAL KPIs ====================
    async def get_temporal_kpis(self, filters: Dict) -> Dict:
        """Time-based trends KPIs."""
        try:
            # Daily activity over last 30 days
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)

            daily_pipeline = [
                {"$match": {"created_at": {"$gte": thirty_days_ago}}},
                {"$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "items": {"$sum": 1}
                }},
                {"$sort": {"_id": 1}}
            ]

            daily_items = []
            async for doc in self.db.items.aggregate(daily_pipeline):
                daily_items.append({"date": doc["_id"], "items": doc["items"]})

            # Weekly activity
            weekly_items = []
            week_pipeline = [
                {"$match": {"created_at": {"$gte": thirty_days_ago}}},
                {"$group": {
                    "_id": {"$isoWeek": "$created_at"},
                    "items": {"$sum": 1}
                }},
                {"$sort": {"_id": 1}}
            ]
            async for doc in self.db.items.aggregate(week_pipeline):
                weekly_items.append({"week": doc["_id"], "items": doc["items"]})

            # Peak activity hours (simplified)
            hour_pipeline = [
                {"$project": {"hour": {"$hour": "$created_at"}}},
                {"$group": {"_id": "$hour", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 5}
            ]
            peak_hours = []
            async for doc in self.db.items.aggregate(hour_pipeline):
                peak_hours.append({"hour": doc["_id"], "count": doc["count"]})

            return {
                "daily_items_last_30_days": daily_items,
                "weekly_items": weekly_items,
                "peak_activity_hours": peak_hours,
                "best_day": max(daily_items, key=lambda x: x["items"]) if daily_items else None,
                "avg_daily_items": round(sum(d["items"] for d in daily_items) / max(len(daily_items), 1), 2),
            }
        except Exception as e:
            logging.error(f"Temporal KPIs error: {e}")
            return {"error": str(e)}

    # ==================== CATEGORY KPIs ====================
    async def get_category_kpis(self, filters: Dict) -> Dict:
        """Category breakdown KPIs."""
        try:
            # Items by category with details
            category_pipeline = [
                {"$group": {
                    "_id": "$category",
                    "count": {"$sum": 1},
                    "donations": {"$sum": {"$cond": [{"$eq": ["$type", "donation"]}, 1, 0]}},
                    "sales": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, 1, 0]}},
                    "avg_price": {"$avg": {"$cond": [{"$gt": ["$price", 0]}, "$price", None]}},
                }},
                {"$sort": {"count": -1}}
            ]

            categories = []
            async for doc in self.db.items.aggregate(category_pipeline):
                if doc["_id"]:
                    categories.append({
                        "category": doc["_id"],
                        "total": doc["count"],
                        "donations": doc["donations"],
                        "sales": doc["sales"],
                        "avg_price": round(doc["avg_price"] or 0, 2),
                        "donation_rate": round((doc["donations"] / max(doc["count"], 1)) * 100, 2),
                    })

            return {
                "categories": categories,
                "total_categories": len(categories),
                "top_category": categories[0] if categories else None,
                "most_donated_category": max(categories, key=lambda x: x["donations"]) if categories else None,
            }
        except Exception as e:
            logging.error(f"Category KPIs error: {e}")
            return {"error": str(e)}


# Helper function for API
async def get_comprehensive_kpis(db, city=None, zone=None, start_date=None, end_date=None):
    """Main entry point for KPI data."""
    engine = KPIEngine(db)
    return await engine.get_all_kpis(city, zone, start_date, end_date)
