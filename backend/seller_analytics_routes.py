import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends

from database import db
from auth_utils import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(tags=["analytics"])


@router.get("/analytics/seller")
async def get_seller_analytics(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)

    sales_res = await db.orders.aggregate([
        {"$match": {"seller_id": user_id, "payment_status": "released"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_cents"}}},
    ]).to_list(1)
    total_sales_cents = sales_res[0]["total"] if sales_res else 0

    rentals_res = await db.rentals.aggregate([
        {"$match": {"owner_id": user_id, "status": "returned", "payment_status": "released"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_price_cents"}}},
    ]).to_list(1)
    total_rentals_cents = rentals_res[0]["total"] if rentals_res else 0

    monthly_sales_res = await db.orders.aggregate([
        {"$match": {"seller_id": user_id, "payment_status": "released", "created_at": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_cents"}}},
    ]).to_list(1)
    monthly_sales = monthly_sales_res[0]["total"] if monthly_sales_res else 0

    monthly_rentals_res = await db.rentals.aggregate([
        {"$match": {"owner_id": user_id, "status": "returned", "payment_status": "released", "created_at": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_price_cents"}}},
    ]).to_list(1)
    monthly_rentals = monthly_rentals_res[0]["total"] if monthly_rentals_res else 0

    active_items = await db.items.count_documents({"owner_id": user_id, "status": "active"})
    total_orders = await db.orders.count_documents({"seller_id": user_id, "payment_status": "released"})
    total_rentals = await db.rentals.count_documents({"owner_id": user_id, "status": "returned"})

    recent_sales = await db.orders.find(
        {"seller_id": user_id, "payment_status": "released"}
    ).sort("created_at", -1).limit(5).to_list(5)
    for sale in recent_sales:
        sale.pop("_id", None)
        sale["type"] = "sale"

    total_revenue_cents = total_sales_cents + total_rentals_cents
    payouts = [{
        "id": "po_mock_1",
        "amount_cents": total_revenue_cents,
        "status": "paid",
        "date": now.isoformat(),
    }] if total_revenue_cents > 0 else []

    return {
        "total_revenue_cents": total_revenue_cents,
        "monthly_revenue_cents": monthly_sales + monthly_rentals,
        "active_items": active_items,
        "total_sales_count": total_orders + total_rentals,
        "recent_sales": recent_sales,
        "payouts": payouts,
    }


# ── Admin KPIs ────────────────────────────────────────────────────────────────

@router.get("/admin/kpis")
async def get_all_kpis(city: Optional[str] = None, zone: Optional[str] = None):
    try:
        from kpi_engine import get_comprehensive_kpis
        return await get_comprehensive_kpis(db, city=city, zone=zone)
    except Exception as e:
        logger.error(f"KPIs error: {e}")
        return {"error": str(e)}


@router.get("/admin/kpis/{category}")
async def get_kpi_category(category: str, city: Optional[str] = None):
    try:
        from kpi_engine import KPIEngine
        engine = KPIEngine(db)
        filters = {"city": city} if city else {}

        category_methods = {
            "users": engine.get_user_kpis,
            "items": engine.get_item_kpis,
            "transactions": engine.get_transaction_kpis,
            "environmental": engine.get_environmental_kpis,
            "economic": engine.get_economic_kpis,
            "geographic": engine.get_geographic_kpis,
            "social": engine.get_social_kpis,
            "temporal": engine.get_temporal_kpis,
            "categories": engine.get_category_kpis,
        }

        if category not in category_methods:
            return {"error": f"Unknown category. Available: {list(category_methods.keys())}"}

        return await category_methods[category](filters)
    except Exception as e:
        logger.error(f"KPI category error: {e}")
        return {"error": str(e)}


# ── Admin pro management ──────────────────────────────────────────────────────

@router.get("/admin/pros")
async def get_admin_pros(current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != "admin@yondly.com":
        raise HTTPException(status_code=403, detail="Not authorized")

    pros = await db.users.find({"is_partner": True}).to_list(length=100)
    results = []
    for pro in pros:
        orders_count = await db.orders.count_documents({"seller_id": pro["id"]})
        revenue_res = await db.orders.aggregate([
            {"$match": {"seller_id": pro["id"]}},
            {"$group": {"_id": None, "total": {"$sum": "$amount_cents"}}},
        ]).to_list(length=1)
        revenue = revenue_res[0]["total"] / 100 if revenue_res else 0
        results.append({
            "id": pro["id"],
            "store_name": pro.get("display_name"),
            "email": pro.get("email"),
            "baskets_sold": orders_count,
            "revenue": revenue,
            "created_at": pro.get("created_at"),
        })

    return results


@router.get("/admin/pros/{pro_id}")
async def get_admin_pro_detail(pro_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != "admin@yondly.com":
        raise HTTPException(status_code=403, detail="Not authorized")

    pro = await db.users.find_one({"id": pro_id})
    if not pro:
        try:
            from bson import ObjectId
            pro = await db.users.find_one({"_id": ObjectId(pro_id)})
        except Exception:
            pass

    if not pro:
        raise HTTPException(status_code=404, detail="Pro not found")

    if "id" not in pro:
        pro["id"] = str(pro["_id"])

    search_id = pro.get("id") or str(pro["_id"])

    orders = await db.orders.find({"seller_id": search_id}).sort("created_at", -1).limit(10).to_list(10)
    items_count = await db.items.count_documents({"owner_id": search_id, "status": "active"})

    revenue_res = await db.orders.aggregate([
        {"$match": {"seller_id": search_id}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_cents"}, "count": {"$sum": 1}}},
    ]).to_list(1)
    revenue = revenue_res[0]["total"] / 100 if revenue_res else 0
    total_orders = revenue_res[0]["count"] if revenue_res else 0
    aov = revenue / total_orders if total_orders > 0 else 0

    retention_res = await db.orders.aggregate([
        {"$match": {"seller_id": search_id}},
        {"$group": {"_id": "$buyer_id", "order_count": {"$sum": 1}}},
        {"$group": {
            "_id": None,
            "total_buyers": {"$sum": 1},
            "repeat_buyers": {"$sum": {"$cond": [{"$gt": ["$order_count", 1]}, 1, 0]}},
        }},
    ]).to_list(1)
    if retention_res:
        total_buyers = retention_res[0]["total_buyers"]
        repeat_buyers = retention_res[0]["repeat_buyers"]
        retention_rate = (repeat_buyers / total_buyers * 100) if total_buyers > 0 else 0
    else:
        retention_rate = 0

    speed_res = await db.orders.aggregate([
        {"$match": {"seller_id": search_id}},
        {"$lookup": {"from": "items", "localField": "item_id", "foreignField": "_id", "as": "item"}},
        {"$unwind": "$item"},
        {"$project": {"duration": {"$subtract": ["$created_at", "$item.created_at"]}}},
        {"$group": {"_id": None, "avg_duration": {"$avg": "$duration"}}},
    ]).to_list(1)
    avg_days_to_sell = (speed_res[0]["avg_duration"] / (1000 * 60 * 60 * 24)) if speed_res else 0

    return {
        "id": pro["id"],
        "store_name": pro.get("display_name"),
        "email": pro.get("email"),
        "photo_url": pro.get("photo_url"),
        "services": pro.get("services", []),
        "created_at": pro.get("created_at"),
        "stats": {
            "total_orders": total_orders,
            "active_items": items_count,
            "total_revenue": revenue,
            "average_order_value": aov,
            "conversion_rate": (total_orders / (items_count + total_orders) * 100) if (items_count + total_orders) > 0 else 0,
            "retention_rate": retention_rate,
            "avg_days_to_sell": avg_days_to_sell,
            "co2_impact": total_orders * 3.75,
        },
        "recent_activity": [
            {
                "id": o.get("id"),
                "amount": o["amount_cents"] / 100,
                "date": o["created_at"],
                "item_title": o["items"][0]["title"] if o.get("items") and len(o["items"]) > 0 else "Commande",
            }
            for o in orders
        ],
    }
