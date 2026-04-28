import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database and auth
from database import db
from auth_utils import JWT_SECRET, JWT_ALGORITHM

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI()

# Static files
admin_path = ROOT_DIR / "admin"
if admin_path.exists():
    app.mount("/admin", StaticFiles(directory=str(admin_path), html=True), name="admin")

uploads_path = ROOT_DIR / "uploads"
uploads_path.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "https://yondly.app",
        "https://www.yondly.app",
        "https://loop-frontend-951855414282.europe-west1.run.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    try:
        from analytics_routes import init_analytics
        init_analytics(db, JWT_SECRET, JWT_ALGORITHM)
    except Exception as e:
        logger.warning(f"Failed to initialize analytics: {e}")

    from db_indexes import create_indexes
    await create_indexes(db)


# ── Legal pages ───────────────────────────────────────────────────────────────

@app.get("/privacy", response_class=HTMLResponse)
async def privacy_policy():
    privacy_file = ROOT_DIR / "privacy-policy.html"
    if privacy_file.exists():
        return HTMLResponse(content=privacy_file.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Privacy Policy</h1><p>Coming soon.</p>")


@app.get("/terms", response_class=HTMLResponse)
async def terms_of_service():
    return HTMLResponse(content="""
    <html><head><title>CGU - Yondly</title></head>
    <body style="font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px;">
    <h1>Conditions Générales d'Utilisation - Yondly</h1>
    <p>En utilisant Yondly, vous acceptez ces conditions.</p>
    <h2>1. Objet</h2>
    <p>Yondly est une plateforme de mise en relation pour l'achat, la vente, la location et le don d'objets entre particuliers.</p>
    <h2>2. Responsabilités</h2>
    <p>Les transactions sont effectuées directement entre utilisateurs. Yondly n'est pas partie aux transactions.</p>
    <h2>3. Contenu</h2>
    <p>Les utilisateurs sont responsables du contenu qu'ils publient.</p>
    <h2>4. Contact</h2>
    <p>contact@yondly.app</p>
    </body></html>
    """)


# ── Route modules ─────────────────────────────────────────────────────────────

from auth_routes import router as auth_router
from items_routes import router as items_router
from orders_routes import router as orders_router
from offers_routes import router as offers_router
from messages_routes import router as messages_router
from notifications_routes import router as notifications_router
from bookings_routes import router as bookings_router
from rentals_routes import router as rentals_router
from wallet_routes import router as wallet_router
from stores_routes import router as stores_router
from deals_routes import router as deals_router
from zones_routes import router as zones_router
from marketing_routes import router as marketing_router
from pro_seller_routes import router as pro_seller_router
from saved_search_routes import router as saved_search_router
from sponsors_routes import router as sponsors_router
from disputes_routes import router as disputes_router
from seller_analytics_routes import router as seller_analytics_router
from payments_routes import router as payments_router
from upload_routes import router as upload_router

_PREFIX = "/api"

app.include_router(auth_router, prefix=_PREFIX)
app.include_router(items_router, prefix=_PREFIX)
app.include_router(orders_router, prefix=_PREFIX)
app.include_router(offers_router, prefix=_PREFIX)
app.include_router(messages_router, prefix=_PREFIX)
app.include_router(notifications_router, prefix=_PREFIX)
app.include_router(bookings_router, prefix=_PREFIX)
app.include_router(rentals_router, prefix=_PREFIX)
app.include_router(wallet_router, prefix=_PREFIX)
app.include_router(stores_router, prefix=_PREFIX)
app.include_router(deals_router, prefix=_PREFIX)
app.include_router(zones_router, prefix=_PREFIX)
app.include_router(marketing_router, prefix=_PREFIX)
app.include_router(pro_seller_router, prefix=_PREFIX)
app.include_router(saved_search_router, prefix=_PREFIX)
app.include_router(sponsors_router, prefix=_PREFIX)
app.include_router(disputes_router, prefix=_PREFIX)
app.include_router(seller_analytics_router, prefix=_PREFIX)
app.include_router(payments_router, prefix=_PREFIX)
app.include_router(upload_router, prefix=_PREFIX)

# ── Third-party route modules ─────────────────────────────────────────────────

try:
    from analytics_routes import router as analytics_router
    app.include_router(analytics_router, prefix=_PREFIX)
except Exception as e:
    logger.warning(f"Could not load analytics_routes: {e}")

try:
    from admin_routes import create_admin_routes
    from auth_utils import get_current_user
    admin_enhanced_router = create_admin_routes(db, get_current_user)
    app.include_router(admin_enhanced_router)
except Exception as e:
    logger.warning(f"Could not load admin_routes: {e}")

try:
    from pro_routes import create_pro_routes
    from auth_utils import get_current_user
    pro_router = create_pro_routes(db, get_current_user)
    app.include_router(pro_router)
except Exception as e:
    logger.warning(f"Could not load pro_routes: {e}")

try:
    from association_routes import router as association_router
    app.include_router(association_router, prefix=_PREFIX)
except Exception as e:
    logger.warning(f"Could not load association_routes: {e}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
