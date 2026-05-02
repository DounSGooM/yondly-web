-- ============================================================
-- YONDLY - Migration 002 : tables manquantes + corrections schéma
-- À exécuter dans Supabase → SQL Editor après 001_schema_complet.sql
-- ============================================================

-- ============================================================
-- MESSAGES : ajout read_by et deleted_by pour suivi multi-utilisateur
-- ============================================================
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS read_by  TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS deleted_by TEXT[] DEFAULT '{}';

-- ============================================================
-- BLOG
-- ============================================================
CREATE TABLE IF NOT EXISTS blog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,
    author TEXT,
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    published BOOL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog(slug);
CREATE INDEX IF NOT EXISTS idx_blog_created ON blog(created_at DESC);

-- ============================================================
-- WAITLIST
-- (déjà dans 001 – on s'assure juste que la colonne created_at est là)
-- ============================================================
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    city TEXT,
    postcode TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTACTS (formulaire de contact)
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PARTNERS (demandes de partenariat)
-- ============================================================
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PARTNER_REQUESTS (alias / table séparée si nécessaire)
-- ============================================================
CREATE TABLE IF NOT EXISTS partner_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_name TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NEWSLETTER
-- (déjà dans 001 – on s'assure que la table existe)
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    subscribed BOOL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT_LOGS (admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================
-- DATA_DICTIONARY (admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS data_dictionary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    column_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXPORT_DEFINITIONS (admin DAC7 / exports)
-- ============================================================
CREATE TABLE IF NOT EXISTS export_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    query TEXT,
    format TEXT DEFAULT 'csv',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXPORT_RUNS
-- ============================================================
CREATE TABLE IF NOT EXISTS export_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    definition_id UUID REFERENCES export_definitions(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- ORDERS_PRO (alias order_pro si nommage différent)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders_pro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount_cents INT DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OFFERS_PRO / OFFERS_PRO_ARCHIVE
-- ============================================================
CREATE TABLE IF NOT EXISTS offers_pro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID,
    buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount_cents INT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offers_pro_archive (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_id UUID,
    data JSONB,
    archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PLATFORM_TRANSPARENCY (admin stats publiques)
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_transparency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    published BOOL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PUBLIC_LISTS
-- (déjà dans 001 – on s'assure que la table existe)
-- ============================================================
CREATE TABLE IF NOT EXISTS public_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    item_ids UUID[] DEFAULT '{}',
    is_public BOOL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SAFETY_EVENTS
-- (déjà dans 001 – on s'assure que la table existe)
-- ============================================================
CREATE TABLE IF NOT EXISTS safety_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    severity TEXT DEFAULT 'low',
    resolved BOOL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SPONSORS
-- (déjà dans 001 – on s'assure)
-- ============================================================
CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    website TEXT,
    active BOOL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRO_PROFILES (admin pro)
-- (déjà dans 001 via pro_sellers – on crée pro_profiles séparément)
-- ============================================================
CREATE TABLE IF NOT EXISTS pro_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT,
    siren TEXT,
    verified BOOL DEFAULT FALSE,
    plan TEXT DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEX supplémentaires utiles
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_messages_read_by  ON messages USING gin(read_by);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_by ON messages USING gin(deleted_by);
