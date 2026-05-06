-- ============================================================
-- MIGRATION 003 — Tables admin (noms sans conflit)
-- ============================================================

DROP TABLE IF EXISTS admin_export_runs CASCADE;
DROP TABLE IF EXISTS admin_export_definitions CASCADE;
DROP TABLE IF EXISTS admin_audit_logs CASCADE;
DROP TABLE IF EXISTS admin_data_dictionary CASCADE;
DROP TABLE IF EXISTS admin_transparency CASCADE;

-- Data Dictionary
CREATE TABLE admin_data_dictionary (
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

-- Audit Logs
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_admin_audit_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_created ON admin_audit_logs(created_at DESC);

-- Export Definitions
CREATE TABLE admin_export_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    period_granularity TEXT NOT NULL,
    geo_level TEXT NOT NULL,
    metrics TEXT[] DEFAULT '{}',
    k_min_threshold INT DEFAULT 30,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export Runs
CREATE TABLE admin_export_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    export_def_id UUID REFERENCES admin_export_definitions(id) ON DELETE SET NULL,
    export_def_name TEXT,
    period_start TEXT,
    period_end TEXT,
    status TEXT DEFAULT 'processing',
    row_count INT DEFAULT 0,
    k_min_applied INT DEFAULT 30,
    data JSONB DEFAULT '[]',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Platform Transparency (DSA)
CREATE TABLE admin_transparency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ranking_text TEXT,
    dereferencing_rules_text TEXT,
    updated_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
