-- ============================================================
-- YONDLY — Recherche Sémantique (pgvector)
-- Embeddings vectoriels sur les annonces + similarité cosinus.
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

-- 1. Extension pgvector (nativement supportée par Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Colonne embedding sur les annonces (768 dim = Gemini text-embedding-004)
ALTER TABLE items ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Index de similarité cosinus (HNSW : rapide, bon rappel)
CREATE INDEX IF NOT EXISTS idx_items_embedding
    ON items USING hnsw (embedding vector_cosine_ops);

-- 4. Fonction de recherche : retourne les annonces actives les plus proches
--    de l'embedding de la requête, triées par similarité décroissante.
CREATE OR REPLACE FUNCTION match_items(
    query_embedding vector(768),
    match_count int DEFAULT 50
)
RETURNS TABLE (id uuid, similarity float)
LANGUAGE sql STABLE
AS $$
    SELECT i.id, 1 - (i.embedding <=> query_embedding) AS similarity
    FROM items i
    WHERE i.status = 'active' AND i.embedding IS NOT NULL
    ORDER BY i.embedding <=> query_embedding
    LIMIT match_count;
$$;
