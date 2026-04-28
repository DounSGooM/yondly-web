"""
Location Analytics Module
Aggregates user activity and transaction data by geographic location.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging


async def get_analytics_by_city(db, zone_id: Optional[str] = None) -> List[Dict]:
    """
    Get aggregated analytics for all cities/communes.
    Returns user count, transactions, CO2 saved, etc. per city.
    """
    try:
        # Aggregate items by city
        items_pipeline = [
            {"$match": {"status": {"$in": ["available", "sold", "completed"]}}},
            {"$group": {
                "_id": "$location.city",
                "items_count": {"$sum": 1},
                "donations": {"$sum": {"$cond": [{"$eq": ["$type", "donation"]}, 1, 0]}},
                "sales": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, 1, 0]}},
                "rentals": {"$sum": {"$cond": [{"$eq": ["$type", "rent"]}, 1, 0]}},
                "baskets": {"$sum": {"$cond": [{"$eq": ["$type", "antigaspi"]}, 1, 0]}},
                "total_value": {"$sum": {"$ifNull": ["$price", 0]}},
            }},
            {"$match": {"_id": {"$ne": None}}}
        ]

        items_by_city = {}
        async for doc in db.items.aggregate(items_pipeline):
            city = doc["_id"]
            if city:
                items_by_city[city] = doc

        # Aggregate users by city (from their items/transactions)
        users_pipeline = [
            {"$match": {"location.city": {"$exists": True, "$ne": None}}},
            {"$group": {
                "_id": "$location.city",
                "unique_sellers": {"$addToSet": "$seller_id"}
            }}
        ]

        users_by_city = {}
        async for doc in db.items.aggregate(users_pipeline):
            city = doc["_id"]
            if city:
                users_by_city[city] = len(doc.get("unique_sellers", []))

        # Aggregate orders/transactions by city
        orders_pipeline = [
            {"$match": {"status": "completed"}},
            {"$lookup": {
                "from": "items",
                "localField": "item_id",
                "foreignField": "_id",
                "as": "item"
            }},
            {"$unwind": {"path": "$item", "preserveNullAndEmptyArrays": True}},
            {"$group": {
                "_id": "$item.location.city",
                "transactions_count": {"$sum": 1},
                "total_revenue": {"$sum": {"$ifNull": ["$total_amount", 0]}},
                "co2_saved": {"$sum": 3.75}  # Estimate per transaction
            }},
            {"$match": {"_id": {"$ne": None}}}
        ]

        orders_by_city = {}
        async for doc in db.orders.aggregate(orders_pipeline):
            city = doc["_id"]
            if city:
                orders_by_city[city] = doc

        # Combine all data
        all_cities = set(items_by_city.keys()) | set(users_by_city.keys()) | set(orders_by_city.keys())

        results = []
        for city in sorted(all_cities):
            items = items_by_city.get(city, {})
            orders = orders_by_city.get(city, {})

            results.append({
                "city": city,
                "users_count": users_by_city.get(city, 0),
                "items_count": items.get("items_count", 0),
                "donations": items.get("donations", 0),
                "sales": items.get("sales", 0),
                "rentals": items.get("rentals", 0),
                "baskets": items.get("baskets", 0),
                "transactions_count": orders.get("transactions_count", 0),
                "co2_saved_kg": round(orders.get("co2_saved", 0), 2),
                "total_revenue": round(orders.get("total_revenue", 0), 2),
            })

        return results

    except Exception as e:
        logging.error(f"Analytics by city error: {e}")
        return []


async def get_analytics_by_neighborhood(db, city: str) -> List[Dict]:
    """
    Get analytics broken down by neighborhood within a city.
    """
    try:
        # This requires items to have a neighborhood field
        # For now, we'll try to extract from address or use a placeholder
        pipeline = [
            {"$match": {"location.city": city}},
            {"$group": {
                "_id": {"$ifNull": ["$location.neighborhood", "Centre"]},
                "items_count": {"$sum": 1},
                "donations": {"$sum": {"$cond": [{"$eq": ["$type", "donation"]}, 1, 0]}},
                "sales": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, 1, 0]}},
                "unique_sellers": {"$addToSet": "$seller_id"}
            }}
        ]

        results = []
        async for doc in db.items.aggregate(pipeline):
            results.append({
                "neighborhood": doc["_id"] or "Non défini",
                "items_count": doc.get("items_count", 0),
                "donations": doc.get("donations", 0),
                "sales": doc.get("sales", 0),
                "users_count": len(doc.get("unique_sellers", []))
            })

        return sorted(results, key=lambda x: x["items_count"], reverse=True)

    except Exception as e:
        logging.error(f"Analytics by neighborhood error: {e}")
        return []


async def get_analytics_by_street(db, city: str, neighborhood: Optional[str] = None) -> List[Dict]:
    """
    Get analytics broken down by street.
    """
    try:
        match_query = {"location.city": city}
        if neighborhood:
            match_query["location.neighborhood"] = neighborhood

        pipeline = [
            {"$match": match_query},
            {"$group": {
                "_id": {"$ifNull": ["$location.street", "$address"]},
                "items_count": {"$sum": 1},
                "unique_sellers": {"$addToSet": "$seller_id"}
            }},
            {"$sort": {"items_count": -1}},
            {"$limit": 50}
        ]

        results = []
        async for doc in db.items.aggregate(pipeline):
            street = doc["_id"]
            if street:
                results.append({
                    "street": street,
                    "items_count": doc.get("items_count", 0),
                    "users_count": len(doc.get("unique_sellers", []))
                })

        return results

    except Exception as e:
        logging.error(f"Analytics by street error: {e}")
        return []


async def get_zone_summary(db, zone_name: str) -> Dict:
    """
    Get a summary of all metrics for a specific zone (EPCI).
    """
    try:
        # Get the zone
        zone = await db.zones.find_one({"name": zone_name})
        if not zone:
            return {"error": "Zone not found"}

        active_communes = [c["name"] for c in zone.get("communes", []) if c.get("isActive")]

        # Aggregate across all active communes
        pipeline = [
            {"$match": {"location.city": {"$in": active_communes}}},
            {"$group": {
                "_id": None,
                "total_items": {"$sum": 1},
                "total_donations": {"$sum": {"$cond": [{"$eq": ["$type", "donation"]}, 1, 0]}},
                "total_sales": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, 1, 0]}},
                "unique_sellers": {"$addToSet": "$seller_id"},
                "total_value": {"$sum": {"$ifNull": ["$price", 0]}}
            }}
        ]

        result = None
        async for doc in db.items.aggregate(pipeline):
            result = doc

        if not result:
            result = {"total_items": 0, "total_donations": 0, "total_sales": 0, "unique_sellers": [], "total_value": 0}

        # Get order stats
        orders_count = await db.orders.count_documents({"status": "completed"})

        return {
            "zone_name": zone_name,
            "display_name": zone.get("displayName", zone_name),
            "type": zone.get("type", "agglomeration"),
            "communes_total": len(zone.get("communes", [])),
            "communes_active": len(active_communes),
            "total_items": result.get("total_items", 0),
            "total_donations": result.get("total_donations", 0),
            "total_sales": result.get("total_sales", 0),
            "total_users": len(result.get("unique_sellers", [])),
            "total_transactions": orders_count,
            "co2_saved_kg": round(orders_count * 3.75, 2),
            "total_value": round(result.get("total_value", 0), 2)
        }

    except Exception as e:
        logging.error(f"Zone summary error: {e}")
        return {"error": str(e)}


async def get_time_series_analytics(db, city: Optional[str] = None, days: int = 30) -> List[Dict]:
    """
    Get daily analytics over time for trend visualization.
    """
    try:
        start_date = datetime.utcnow() - timedelta(days=days)

        match_query = {"created_at": {"$gte": start_date}}
        if city:
            match_query["location.city"] = city

        pipeline = [
            {"$match": match_query},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "items_count": {"$sum": 1},
                "donations": {"$sum": {"$cond": [{"$eq": ["$type", "donation"]}, 1, 0]}},
                "sales": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, 1, 0]}},
                "rentals": {"$sum": {"$cond": [{"$eq": ["$type", "rent"]}, 1, 0]}},
                "baskets": {"$sum": {"$cond": [{"$eq": ["$type", "antigaspi"]}, 1, 0]}},
            }},
            {"$sort": {"_id": 1}}
        ]

        results = []
        async for doc in db.items.aggregate(pipeline):
            results.append({
                "date": doc["_id"],
                "items_count": doc.get("items_count", 0),
                "donations": doc.get("donations", 0),
                "sales": doc.get("sales", 0),
                "rentals": doc.get("rentals", 0),
                "baskets": doc.get("baskets", 0),
            })

        return results

    except Exception as e:
        logging.error(f"Time series analytics error: {e}")
        return []
