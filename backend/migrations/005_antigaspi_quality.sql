-- ============================================================
-- YONDLY — Qualité Anti-Gaspi Garantie
-- Transparence du contenu + notation 3 axes + surveillance
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

-- ─── 1. Enrichissement des paniers (deals) ──────────────────
-- Transparence : le commerçant doit décrire précisément le contenu.
ALTER TABLE deals ADD COLUMN IF NOT EXISTS food_category TEXT
    CHECK (food_category IN (
        'boulangerie', 'fruits_legumes', 'epicerie',
        'traiteur_froid', 'traiteur_chaud', 'viande_poisson',
        'plats_prepares', 'fleurs', 'autre'
    ));
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contents_description TEXT;  -- Détail du contenu (optionnel, valorisé)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS quantity_info TEXT;          -- Quantité approximative (texte libre, optionnel)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS quantity_size TEXT
    CHECK (quantity_size IN ('small', 'medium', 'large'));             -- Taille du panier (1 tap)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_transparent BOOL DEFAULT FALSE; -- Contenu détaillé renseigné
ALTER TABLE deals ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMPTZ;     -- Heure de préparation
ALTER TABLE deals ADD COLUMN IF NOT EXISTS pickup_start TIMESTAMPTZ;    -- Début fenêtre de retrait
ALTER TABLE deals ADD COLUMN IF NOT EXISTS pickup_end TIMESTAMPTZ;      -- Fin fenêtre de retrait
ALTER TABLE deals ADD COLUMN IF NOT EXISTS kept_warm BOOL DEFAULT FALSE;-- Produit maintenu au chaud
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_mystery BOOL DEFAULT FALSE;-- Panier surprise (interdit sur produits sensibles)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS remaining INT DEFAULT 1;     -- Stock restant (déjà utilisé par le code)

-- ─── 2. Fiabilité du commerçant (stores) ────────────────────
ALTER TABLE stores ADD COLUMN IF NOT EXISTS quality_status TEXT DEFAULT 'OK'
    CHECK (quality_status IN ('OK', 'WATCH', 'SUSPENDED'));
ALTER TABLE stores ADD COLUMN IF NOT EXISTS conformity_rate FLOAT;        -- % de paniers conformes (null tant que < seuil avis)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS avg_quality FLOAT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS avg_quantity FLOAT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS avg_conformity FLOAT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS basket_reviews_count INT DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS reports_count INT DEFAULT 0;       -- Total signalements
ALTER TABLE stores ADD COLUMN IF NOT EXISTS reports_open_count INT DEFAULT 0;  -- Signalements non traités
ALTER TABLE stores ADD COLUMN IF NOT EXISTS quality_status_since TIMESTAMPTZ;  -- Date du dernier changement de statut
-- Contrôle a posteriori : passe à TRUE dès la 1re infraction. Le commerce doit
-- alors décrire précisément chaque panier pour pouvoir publier (condition de réactivation).
ALTER TABLE stores ADD COLUMN IF NOT EXISTS requires_detailed_description BOOL DEFAULT FALSE;

-- ─── 3. Avis sur panier (notation 3 axes) ───────────────────
CREATE TABLE IF NOT EXISTS basket_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE REFERENCES orders(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quality INT NOT NULL CHECK (quality BETWEEN 1 AND 5),       -- Qualité du produit
    quantity INT NOT NULL CHECK (quantity BETWEEN 1 AND 5),     -- Quantité reçue vs annoncée
    conformity INT NOT NULL CHECK (conformity BETWEEN 1 AND 5), -- Conformité à la description
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_basket_reviews_store ON basket_reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_basket_reviews_deal ON basket_reviews(deal_id);

-- ─── 4. Signalements de panier non conforme ─────────────────
CREATE TABLE IF NOT EXISTS basket_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN (
        'not_consumable',        -- Manifestement non consommable
        'expired',               -- Périmé
        'cold_or_spoiled',       -- Froid / avarié
        'far_from_description',  -- Très éloigné de la description
        'too_old',               -- Trop vieux
        'quantity_short',        -- Quantité très inférieure
        'other'
    )),
    description TEXT,
    photos TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'refunded', 'rejected')),
    credit_cents INT DEFAULT 0,    -- Crédit Yondly accordé en compensation
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_basket_reports_store ON basket_reports(store_id);
CREATE INDEX IF NOT EXISTS idx_basket_reports_status ON basket_reports(status);
