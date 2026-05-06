-- ============================================================
-- MIGRATION 003 — Tables admin manquantes
-- ============================================================

-- Data Dictionary (catalogue des champs exportables)
CREATE TABLE IF NOT EXISTS data_dictionary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_name TEXT NOT NULL,
    data_type TEXT NOT NULL,
    description TEXT,
    example TEXT,
    source_collection TEXT NOT NULL,
    sensitivity_tag TEXT NOT NULL CHECK (sensitivity_tag IN ('INTERNAL','EXPORT_SAFE','NEVER_EXPORT')),
    usage_policy TEXT NOT NULL CHECK (usage_policy IN ('INTERNE','EXPORT_AGREGE','JAMAIS_EXPORTER')),
    export_transform TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (journal des actions admin)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Export Definitions (définitions d'export collectivités)
CREATE TABLE IF NOT EXISTS export_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    period_granularity TEXT NOT NULL CHECK (period_granularity IN ('day','week','month')),
    geo_level TEXT NOT NULL CHECK (geo_level IN ('QUARTIER','VILLE','EPCI')),
    metrics TEXT[] DEFAULT '{}',
    k_min_threshold INT DEFAULT 30,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export Runs (exports générés)
CREATE TABLE IF NOT EXISTS export_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    export_def_id UUID REFERENCES export_definitions(id) ON DELETE SET NULL,
    export_def_name TEXT,
    period_start TEXT,
    period_end TEXT,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing','completed','failed')),
    row_count INT DEFAULT 0,
    k_min_applied INT DEFAULT 30,
    data JSONB DEFAULT '[]',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Platform Transparency (textes DSA)
CREATE TABLE IF NOT EXISTS platform_transparency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ranking_text TEXT,
    dereferencing_rules_text TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
