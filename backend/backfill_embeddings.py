"""
Backfill des embeddings pour les annonces existantes.
Usage :
    cd backend && source ../.venv/bin/activate && python3 backfill_embeddings.py

Nécessite GEMINI_API_KEY dans .env. Idempotent : ne ré-indexe que les
annonces sans embedding. Respecte un petit délai pour ménager le quota.
"""

import asyncio
from database import SupabaseDB
from embeddings import index_item, GEMINI_API_KEY


async def main():
    if not GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY manquante — impossible de générer les embeddings.")
        return

    db = SupabaseDB()
    items = await db.items.find({"status": "active"}).to_list(5000)
    print(f"{len(items)} annonces actives trouvées.")

    done, skipped, failed = 0, 0, 0
    for it in items:
        if it.get("embedding"):
            skipped += 1
            continue
        ok = await index_item(
            db, it["id"],
            it.get("title", ""),
            it.get("description", "") or "",
            it.get("category", ""),
        )
        if ok:
            done += 1
            print(f"  ✓ {it.get('title', it['id'])[:50]}")
        else:
            failed += 1
            print(f"  ✗ échec : {it.get('title', it['id'])[:50]}")
        await asyncio.sleep(0.3)  # ménage le quota Gemini

    print(f"\nTerminé : {done} indexées, {skipped} déjà à jour, {failed} échecs.")


if __name__ == "__main__":
    asyncio.run(main())
