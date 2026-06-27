"""
Embeddings & recherche sémantique (Gemini text-embedding-004 + pgvector)
════════════════════════════════════════════════════════════════════════
Génère des embeddings vectoriels pour les annonces et interroge pgvector
(fonction SQL match_items) par similarité cosinus.
"""

import os
import asyncio
from typing import Optional, List

import google.generativeai as genai

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
EMBED_MODEL = os.environ.get('GEMINI_EMBED_MODEL', 'models/embedding-001')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def _embed_sync(text: str, task_type: str) -> List[float]:
    result = genai.embed_content(model=EMBED_MODEL, content=text, task_type=task_type)
    return result['embedding']


async def generate_embedding(text: str, task_type: str = 'retrieval_document') -> Optional[List[float]]:
    """Génère l'embedding d'un texte. None si indisponible (clé absente / erreur)."""
    if not GEMINI_API_KEY or not (text or '').strip():
        return None
    try:
        return await asyncio.to_thread(_embed_sync, text.strip(), task_type)
    except Exception as e:
        print(f"[embeddings] generation error: {e}")
        return None


async def embed_debug(text: str):
    """Diagnostic : retourne (embedding | None, message_erreur | None)."""
    if not GEMINI_API_KEY:
        return None, "GEMINI_API_KEY absente"
    if not (text or '').strip():
        return None, "texte vide"
    try:
        emb = await asyncio.to_thread(_embed_sync, text.strip(), 'retrieval_document')
        return emb, None
    except Exception as e:
        return None, f"{type(e).__name__}: {str(e)[:250]}"


def to_vector_string(embedding: List[float]) -> str:
    """Format texte pgvector : '[0.1,0.2,...]' (cast automatique en vector)."""
    return '[' + ','.join(f'{x:.6f}' for x in embedding) + ']'


async def semantic_item_ids(query: str, match_count: int = 50) -> Optional[List[str]]:
    """
    Retourne les IDs d'annonces les plus proches sémantiquement de la requête,
    triés par pertinence. None si la recherche sémantique est indisponible.
    """
    emb = await generate_embedding(query, task_type='retrieval_query')
    if not emb:
        return None
    from database import supabase
    if supabase is None:
        return None
    vec = to_vector_string(emb)

    def _call():
        return supabase.rpc('match_items', {'query_embedding': vec, 'match_count': match_count}).execute()

    try:
        resp = await asyncio.to_thread(_call)
        return [row['id'] for row in (resp.data or [])]
    except Exception as e:
        print(f"[embeddings] rpc match_items error: {e}")
        return None


async def index_item(db, item_id: str, title: str = "", description: str = "", category: str = "") -> bool:
    """Génère et stocke l'embedding d'une annonce (titre + catégorie + description)."""
    text = ' '.join(p for p in [title, category, description] if p)
    emb = await generate_embedding(text, task_type='retrieval_document')
    if not emb:
        return False
    try:
        await db.items.update_one({"id": item_id}, {"$set": {"embedding": to_vector_string(emb)}})
        return True
    except Exception as e:
        print(f"[embeddings] store error: {e}")
        return False
