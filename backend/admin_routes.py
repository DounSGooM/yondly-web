# Admin Routes for Enhanced Dashboard
# Add this file to backend/ and import in server.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

# Import from main server
# from server import db, get_current_user, verify_password, hash_password, create_access_token

admin_routes = APIRouter(prefix="/api/admin", tags=["admin"])

# ============ MODELS ============

class AdminRole:
    SUPERADMIN = "SUPERADMIN"
    DATA_ADMIN = "DATA_ADMIN"
    ANALYST = "ANALYST"
    MODERATOR = "MODERATOR"
    PARTNER_MANAGER = "PARTNER_MANAGER"

class AdminUserCreate(BaseModel):
    email: str
    password: str
    display_name: str
    role: str = AdminRole.ANALYST

class DataDictionaryEntry(BaseModel):
    field_name: str
    data_type: str
    description: str
    example: Optional[str] = None
    source_collection: str
    sensitivity_tag: str  # INTERNAL, EXPORT_SAFE, NEVER_EXPORT
    usage_policy: str  # INTERNE, EXPORT_AGREGE, JAMAIS_EXPORTER
    export_transform: Optional[str] = None  # arrondi, quantization, etc.

class ExportDefinition(BaseModel):
    name: str
    period_granularity: str  # day, week
    geo_level: str  # QUARTIER, VILLE, EPCI
    metrics: List[str]
    k_min_threshold: int = 30

class EventFilter(BaseModel):
    event_type: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    admin_area_id: Optional[str] = None

# ============ SEED DATA ============

INITIAL_DATA_DICTIONARY = [
    {
        "field_name": "user_id",
        "data_type": "string",
        "description": "Identifiant unique de l'utilisateur (UUID)",
        "example": "a1b2c3d4-...",
        "source_collection": "users",
        "sensitivity_tag": "NEVER_EXPORT",
        "usage_policy": "JAMAIS_EXPORTER",
        "export_transform": None
    },
    {
        "field_name": "email",
        "data_type": "string",
        "description": "Adresse email de l'utilisateur",
        "example": "user@example.com",
        "source_collection": "users",
        "sensitivity_tag": "NEVER_EXPORT",
        "usage_policy": "JAMAIS_EXPORTER",
        "export_transform": None
    },
    {
        "field_name": "display_name",
        "data_type": "string",
        "description": "Nom affiché de l'utilisateur",
        "example": "Jean D.",
        "source_collection": "users",
        "sensitivity_tag": "INTERNAL",
        "usage_policy": "INTERNE",
        "export_transform": None
    },
    {
        "field_name": "postcode",
        "data_type": "string",
        "description": "Code postal de l'utilisateur",
        "example": "86000",
        "source_collection": "users",
        "sensitivity_tag": "EXPORT_SAFE",
        "usage_policy": "EXPORT_AGREGE",
        "export_transform": "aggregate_by_zone"
    },
    {
        "field_name": "city",
        "data_type": "string",
        "description": "Ville de l'utilisateur",
        "example": "Poitiers",
        "source_collection": "users",
        "sensitivity_tag": "EXPORT_SAFE",
        "usage_policy": "EXPORT_AGREGE",
        "export_transform": "aggregate_by_zone"
    },
    {
        "field_name": "price_cents",
        "data_type": "integer",
        "description": "Prix en centimes",
        "example": "1500",
        "source_collection": "items",
        "sensitivity_tag": "EXPORT_SAFE",
        "usage_policy": "EXPORT_AGREGE",
        "export_transform": "price_class"
    },
    {
        "field_name": "category",
        "data_type": "string",
        "description": "Catégorie de l'article",
        "example": "Électronique",
        "source_collection": "items",
        "sensitivity_tag": "EXPORT_SAFE",
        "usage_policy": "EXPORT_AGREGE",
        "export_transform": None
    },
    {
        "field_name": "type",
        "data_type": "string",
        "description": "Type de transaction (sale, donation, rental, antigaspi)",
        "example": "sale",
        "source_collection": "items",
        "sensitivity_tag": "EXPORT_SAFE",
        "usage_policy": "EXPORT_AGREGE",
        "export_transform": None
    },
    {
        "field_name": "co2_saved",
        "data_type": "float",
        "description": "CO2 économisé en kg",
        "example": "2.5",
        "source_collection": "transactions",
        "sensitivity_tag": "EXPORT_SAFE",
        "usage_policy": "EXPORT_AGREGE",
        "export_transform": None
    },
    {
        "field_name": "created_at",
        "data_type": "datetime",
        "description": "Date de création",
        "example": "2024-01-15T10:30:00Z",
        "source_collection": "items",
        "sensitivity_tag": "EXPORT_SAFE",
        "usage_policy": "EXPORT_AGREGE",
        "export_transform": "round_to_day"
    },
    {
        "field_name": "location",
        "data_type": "object",
        "description": "Coordonnées GPS précises (lat/lng)",
        "example": '{"lat": 46.58, "lng": 0.34}',
        "source_collection": "users",
        "sensitivity_tag": "NEVER_EXPORT",
        "usage_policy": "JAMAIS_EXPORTER",
        "export_transform": None
    },
    {
        "field_name": "phone",
        "data_type": "string",
        "description": "Numéro de téléphone",
        "example": "+33612345678",
        "source_collection": "users",
        "sensitivity_tag": "NEVER_EXPORT",
        "usage_policy": "JAMAIS_EXPORTER",
        "export_transform": None
    }
]

AVAILABLE_METRICS = [
    {"id": "don_listings_created", "name": "Dons créés", "description": "Nombre d'annonces de dons créées"},
    {"id": "don_pickups_completed", "name": "Dons récupérés", "description": "Nombre de dons effectivement récupérés"},
    {"id": "don_no_show_rate", "name": "Taux no-show dons", "description": "% de dons réservés non récupérés"},
    {"id": "secondhand_items_sold", "name": "Ventes seconde main", "description": "Nombre d'articles vendus"},
    {"id": "rental_completed", "name": "Locations terminées", "description": "Nombre de locations complétées"},
    {"id": "pro_baskets_sold", "name": "Paniers pro vendus", "description": "Nombre de paniers anti-gaspi vendus"},
    {"id": "pro_baskets_unsold", "name": "Paniers invendus", "description": "Nombre de paniers non vendus"},
    {"id": "food_kg_saved_est", "name": "Nourriture sauvée (kg)", "description": "Estimation des kg de nourriture sauvés"},
    {"id": "co2e_kg_saved_est", "name": "CO2 évité (kg)", "description": "Estimation des kg de CO2 évité"},
    {"id": "active_users", "name": "Utilisateurs actifs", "description": "Nombre d'utilisateurs ayant eu une action"},
    {"id": "new_users", "name": "Nouveaux inscrits", "description": "Nombre de nouvelles inscriptions"},
]

# ============ HELPER FUNCTIONS ============

def check_admin_role(user: dict, required_roles: List[str]):
    """Check if admin user has required role"""
    user_role = user.get("admin_role", "")
    if user_role == AdminRole.SUPERADMIN:
        return True
    if user_role not in required_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return True

async def log_admin_action(db, admin_id: str, action: str, target_type: str, target_id: str = None, metadata: dict = None):
    """Log an admin action for audit"""
    log_entry = {
        "id": str(uuid.uuid4()),
        "admin_id": admin_id,
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "metadata": metadata or {},
        "created_at": datetime.utcnow()
    }
    await db.audit_logs.insert_one(log_entry)
    return log_entry

# ============ ROUTE FACTORIES ============

def create_admin_routes(db, get_current_user_func):
    """Factory function to create admin routes with database dependency"""
    
    router = APIRouter(prefix="/api/admin", tags=["admin-enhanced"])
    
    # ============ DATA DICTIONARY ============
    
    @router.get("/data-dictionary")
    async def get_data_dictionary(current_user: dict = Depends(get_current_user_func)):
        """Get all data dictionary entries"""
        entries = await db.data_dictionary.find().to_list(1000)
        for e in entries:
            e.pop("_id", None)
        return entries
    
    @router.post("/data-dictionary")
    async def create_data_dictionary_entry(entry: DataDictionaryEntry, current_user: dict = Depends(get_current_user_func)):
        """Create a new data dictionary entry"""
        entry_dict = entry.dict()
        entry_dict["id"] = str(uuid.uuid4())
        entry_dict["created_at"] = datetime.utcnow()
        entry_dict["updated_at"] = datetime.utcnow()
        
        await db.data_dictionary.insert_one(entry_dict)
        await log_admin_action(db, current_user["id"], "CREATE", "data_dictionary", entry_dict["id"])
        
        entry_dict.pop("_id", None)
        return entry_dict
    
    @router.put("/data-dictionary/{entry_id}")
    async def update_data_dictionary_entry(entry_id: str, entry: DataDictionaryEntry, current_user: dict = Depends(get_current_user_func)):
        """Update a data dictionary entry"""
        update_data = entry.dict()
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.data_dictionary.update_one(
            {"id": entry_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        await log_admin_action(db, current_user["id"], "UPDATE", "data_dictionary", entry_id)
        return {"message": "Updated successfully"}
    
    @router.delete("/data-dictionary/{entry_id}")
    async def delete_data_dictionary_entry(entry_id: str, current_user: dict = Depends(get_current_user_func)):
        """Delete a data dictionary entry"""
        result = await db.data_dictionary.delete_one({"id": entry_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        await log_admin_action(db, current_user["id"], "DELETE", "data_dictionary", entry_id)
        return {"message": "Deleted successfully"}
    
    @router.post("/data-dictionary/seed")
    async def seed_data_dictionary(current_user: dict = Depends(get_current_user_func)):
        """Seed initial data dictionary entries"""
        count = await db.data_dictionary.count_documents({})
        if count > 0:
            return {"message": "Data dictionary already seeded", "count": count}
        
        for entry in INITIAL_DATA_DICTIONARY:
            entry["id"] = str(uuid.uuid4())
            entry["created_at"] = datetime.utcnow()
            entry["updated_at"] = datetime.utcnow()
            await db.data_dictionary.insert_one(entry)
        
        await log_admin_action(db, current_user["id"], "SEED", "data_dictionary")
        return {"message": "Seeded successfully", "count": len(INITIAL_DATA_DICTIONARY)}
    
    # ============ EVENT EXPLORER ============
    
    @router.get("/events")
    async def get_events(
        event_type: str = None,
        date_from: str = None,
        date_to: str = None,
        admin_area_id: str = None,
        limit: int = 100,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Get events without PII for analysis"""
        query = {}
        
        if event_type:
            query["event_type"] = event_type
        if admin_area_id:
            query["admin_area_id"] = admin_area_id
        if date_from or date_to:
            query["timestamp"] = {}
            if date_from:
                query["timestamp"]["$gte"] = datetime.fromisoformat(date_from)
            if date_to:
                query["timestamp"]["$lte"] = datetime.fromisoformat(date_to)
        
        # Aggregate events from various sources (orders, items, rentals)
        events = []
        
        # Get recent orders as events
        orders = await db.orders.find().sort("created_at", -1).limit(limit).to_list(limit)
        for o in orders:
            events.append({
                "id": o.get("id", ""),
                "event_type": "order_created",
                "timestamp": o.get("created_at"),
                "admin_area_id": o.get("seller_city", "Unknown"),
                "metadata": {
                    "item_type": o.get("item_type", "sale"),
                    "status": o.get("payment_status", "pending"),
                    "amount_class": get_price_class(o.get("amount_cents", 0))
                }
            })
        
        # Get recent items as events
        items = await db.items.find().sort("created_at", -1).limit(limit).to_list(limit)
        for i in items:
            events.append({
                "id": i.get("id", ""),
                "event_type": "listing_created",
                "timestamp": i.get("created_at"),
                "admin_area_id": i.get("location", {}).get("city", "Unknown") if isinstance(i.get("location"), dict) else "Unknown",
                "metadata": {
                    "category": i.get("category", "Other"),
                    "type": i.get("type", "sale"),
                    "price_class": get_price_class(i.get("price_cents", 0))
                }
            })
        
        # Sort by timestamp
        events.sort(key=lambda x: x.get("timestamp") or datetime.min, reverse=True)
        
        return events[:limit]
    
    @router.get("/events/funnel")
    async def get_events_funnel(
        date_from: str = None,
        date_to: str = None,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Get funnel data: LISTING_CREATED → RESERVED → COMPLETED"""
        # Count items
        listings_count = await db.items.count_documents({})
        
        # Count orders (reserved)
        orders_count = await db.orders.count_documents({})
        
        # Count completed orders
        completed_count = await db.orders.count_documents({"payment_status": "completed"})
        
        return {
            "funnel": [
                {"step": "Annonces créées", "count": listings_count},
                {"step": "Réservées", "count": orders_count},
                {"step": "Complétées", "count": completed_count}
            ],
            "conversion_rates": {
                "listings_to_reserved": round((orders_count / max(listings_count, 1)) * 100, 1),
                "reserved_to_completed": round((completed_count / max(orders_count, 1)) * 100, 1),
                "overall": round((completed_count / max(listings_count, 1)) * 100, 1)
            }
        }
    
    @router.get("/events/types")
    async def get_event_types(current_user: dict = Depends(get_current_user_func)):
        """Get available event types"""
        return [
            {"id": "listing_created", "name": "Annonce créée"},
            {"id": "listing_reserved", "name": "Annonce réservée"},
            {"id": "order_created", "name": "Commande créée"},
            {"id": "order_completed", "name": "Commande terminée"},
            {"id": "donation_pickup", "name": "Don récupéré"},
            {"id": "rental_started", "name": "Location commencée"},
            {"id": "rental_returned", "name": "Location terminée"},
            {"id": "basket_sold", "name": "Panier vendu"},
            {"id": "user_signup", "name": "Inscription utilisateur"}
        ]
    
    # ============ EXPORT DEFINITIONS ============
    
    @router.get("/export-definitions")
    async def get_export_definitions(current_user: dict = Depends(get_current_user_func)):
        """Get all saved export definitions"""
        defs = await db.export_definitions.find().sort("created_at", -1).to_list(100)
        for d in defs:
            d.pop("_id", None)
        return defs
    
    @router.post("/export-definitions")
    async def create_export_definition(definition: ExportDefinition, current_user: dict = Depends(get_current_user_func)):
        """Create a new export definition"""
        def_dict = definition.dict()
        def_dict["id"] = str(uuid.uuid4())
        def_dict["created_at"] = datetime.utcnow()
        def_dict["created_by"] = current_user["id"]
        def_dict["version"] = 1
        
        await db.export_definitions.insert_one(def_dict)
        await log_admin_action(db, current_user["id"], "CREATE", "export_definition", def_dict["id"])
        
        def_dict.pop("_id", None)
        return def_dict
    
    @router.get("/export-definitions/metrics")
    async def get_available_metrics(current_user: dict = Depends(get_current_user_func)):
        """Get available metrics for export"""
        return AVAILABLE_METRICS
    
    # ============ EXPORT RUNS ============
    
    @router.get("/exports")
    async def get_export_runs(current_user: dict = Depends(get_current_user_func)):
        """Get all export runs"""
        runs = await db.export_runs.find().sort("created_at", -1).to_list(100)
        for r in runs:
            r.pop("_id", None)
        return runs
    
    @router.post("/exports/generate")
    async def generate_export(
        export_def_id: str,
        period_start: str,
        period_end: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Generate an export from a definition"""
        # Get the definition
        definition = await db.export_definitions.find_one({"id": export_def_id})
        if not definition:
            raise HTTPException(status_code=404, detail="Export definition not found")
        
        # Create export run
        run = {
            "id": str(uuid.uuid4()),
            "export_def_id": export_def_id,
            "export_def_name": definition.get("name", "Export"),
            "period_start": period_start,
            "period_end": period_end,
            "status": "processing",
            "created_at": datetime.utcnow(),
            "created_by": current_user["id"],
            "file_refs": [],
            "row_count": 0,
            "k_min_applied": definition.get("k_min_threshold", 30)
        }
        
        await db.export_runs.insert_one(run)
        
        # Generate aggregated data
        k_min = definition.get("k_min_threshold", 30)
        geo_level = definition.get("geo_level", "VILLE")
        
        # Aggregate data by zone
        aggregated_data = await aggregate_data_for_export(
            db, 
            period_start, 
            period_end, 
            geo_level, 
            definition.get("metrics", []),
            k_min
        )
        
        # Update run with results
        await db.export_runs.update_one(
            {"id": run["id"]},
            {"$set": {
                "status": "completed",
                "row_count": len(aggregated_data),
                "data": aggregated_data,
                "completed_at": datetime.utcnow()
            }}
        )
        
        await log_admin_action(db, current_user["id"], "GENERATE_EXPORT", "export_run", run["id"])
        
        run["status"] = "completed"
        run["row_count"] = len(aggregated_data)
        run.pop("_id", None)
        return run
    
    @router.get("/exports/{run_id}/preview")
    async def preview_export(run_id: str, current_user: dict = Depends(get_current_user_func)):
        """Preview export data"""
        run = await db.export_runs.find_one({"id": run_id})
        if not run:
            raise HTTPException(status_code=404, detail="Export run not found")
        
        return {
            "preview": run.get("data", [])[:10],
            "total_rows": len(run.get("data", [])),
            "columns": list(run.get("data", [{}])[0].keys()) if run.get("data") else []
        }
    
    @router.get("/exports/{run_id}/download")
    async def download_export(run_id: str, format: str = "json", current_user: dict = Depends(get_current_user_func)):
        """Download export data"""
        run = await db.export_runs.find_one({"id": run_id})
        if not run:
            raise HTTPException(status_code=404, detail="Export run not found")
        
        data = run.get("data", [])
        
        if format == "csv":
            import csv
            import io
            output = io.StringIO()
            if data:
                writer = csv.DictWriter(output, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
            csv_content = output.getvalue()
            return {"format": "csv", "content": csv_content, "filename": f"export_{run_id}.csv"}
        else:
            return {"format": "json", "content": data, "filename": f"export_{run_id}.json"}
    
    # ============ AUDIT LOGS ============
    
    @router.get("/audit-logs")
    async def get_audit_logs(
        admin_id: str = None,
        action: str = None,
        limit: int = 100,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Get audit logs"""
        query = {}
        if admin_id:
            query["admin_id"] = admin_id
        if action:
            query["action"] = action
        
        logs = await db.audit_logs.find(query).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Enrich with admin names
        for log in logs:
            log.pop("_id", None)
            admin = await db.users.find_one({"id": log.get("admin_id")})
            log["admin_name"] = admin.get("display_name", "Unknown") if admin else "Unknown"
        
        return logs
    
    return router


# ============ HELPER FUNCTIONS ============

def get_price_class(price_cents: int) -> str:
    """Convert exact price to price class for privacy"""
    if price_cents == 0:
        return "gratuit"
    elif price_cents < 500:
        return "0-5€"
    elif price_cents < 1500:
        return "5-15€"
    elif price_cents < 3000:
        return "15-30€"
    elif price_cents < 5000:
        return "30-50€"
    elif price_cents < 10000:
        return "50-100€"
    else:
        return "100€+"


async def aggregate_data_for_export(db, period_start: str, period_end: str, geo_level: str, metrics: list, k_min: int):
    """Aggregate data for export with privacy protection"""
    
    # Get all transactions in period
    start_date = datetime.fromisoformat(period_start) if period_start else datetime.min
    end_date = datetime.fromisoformat(period_end) if period_end else datetime.utcnow()
    
    # Aggregate by zone (simplified - in production would use proper geo matching)
    zones = {}
    
    # Count orders by city
    orders = await db.orders.find({
        "created_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(10000)
    
    for order in orders:
        zone = order.get("seller_city", "Unknown")
        if zone not in zones:
            zones[zone] = {
                "admin_area": zone,
                "period_start": period_start,
                "period_end": period_end,
                "total_transactions": 0,
                "sales_count": 0,
                "donations_count": 0,
                "rentals_count": 0,
                "baskets_count": 0,
                "co2_saved_kg": 0
            }
        
        zones[zone]["total_transactions"] += 1
        item_type = order.get("item_type", "sale")
        if item_type == "sale":
            zones[zone]["sales_count"] += 1
        elif item_type == "donation":
            zones[zone]["donations_count"] += 1
        elif item_type == "rental":
            zones[zone]["rentals_count"] += 1
        elif item_type == "antigaspi":
            zones[zone]["baskets_count"] += 1
    
    # Apply k_min threshold
    result = []
    for zone, data in zones.items():
        if data["total_transactions"] >= k_min:
            result.append(data)
        else:
            # Mask data below threshold
            masked = {
                "admin_area": zone,
                "period_start": period_start,
                "period_end": period_end,
                "total_transactions": f"<{k_min}",
                "sales_count": "masqué",
                "donations_count": "masqué",
                "rentals_count": "masqué",
                "baskets_count": "masqué",
                "co2_saved_kg": "masqué",
                "_note": f"Données masquées (seuil k_min={k_min} non atteint)"
            }
            result.append(masked)
    
    return result
