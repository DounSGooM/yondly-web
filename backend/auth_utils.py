import os
import logging
import jwt
import bcrypt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import db  # SupabaseDB — MongoDB-compatible async API

logger = logging.getLogger(__name__)

# JWT Configuration
_DEV_JWT_FALLBACK = 'loop_jwt_secret_change_in_production'
JWT_SECRET = os.environ.get('JWT_SECRET', _DEV_JWT_FALLBACK)
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 720))

# En production, refuser de démarrer avec le secret par défaut (sinon les
# tokens seraient forgeables par n'importe qui connaissant le repo).
if JWT_SECRET == _DEV_JWT_FALLBACK:
    if os.environ.get('ENVIRONMENT', '').lower() in ('production', 'prod'):
        raise RuntimeError(
            "JWT_SECRET non défini en production. Configure la variable "
            "d'environnement JWT_SECRET avec une valeur secrète et aléatoire."
        )
    logger.warning(
        "JWT_SECRET utilise la valeur de développement par défaut — "
        "à NE PAS utiliser en production."
    )

security = HTTPBearer()

# Liste des emails administrateurs (configurable via la variable d'env ADMIN_EMAILS,
# séparée par des virgules). Sert au contrôle d'accès de toute l'API /api/admin.
ADMIN_EMAILS = {
    e.strip().lower()
    for e in os.environ.get(
        'ADMIN_EMAILS',
        'lagaville.gerald@outlook.fr,admin@yondly.com'
    ).split(',')
    if e.strip()
}


async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dépendance FastAPI : exige un utilisateur authentifié ET administrateur."""
    user = await get_current_user(credentials)
    if (user.get("email") or "").lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return user

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
