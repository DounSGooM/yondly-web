-- Migration 004 : Paiement en espèces + partenaires locaux
-- Ajoute les colonnes manquantes et les articles de test.

-- ============================================================
-- ITEMS : colonne accepts_cash
-- ============================================================
ALTER TABLE items
ADD COLUMN IF NOT EXISTS accepts_cash BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- ORDERS : colonne payment_method
-- ============================================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'stripe'
    CHECK (payment_method IN ('stripe', 'cash'));

-- ============================================================
-- ARTICLES DE TEST avec paiement en espèces
-- (associés au premier utilisateur actif trouvé)
-- ============================================================
DO $$
DECLARE
    v_owner_id TEXT;
    v_location JSONB;
BEGIN
    SELECT id, COALESCE(location, '{"lat": 46.5802, "lng": 0.3404, "city": "Poitiers", "address": "Centre-ville"}'::jsonb)
    INTO v_owner_id, v_location
    FROM users
    WHERE is_active = true
    LIMIT 1;

    IF v_owner_id IS NULL THEN
        SELECT id, '{"lat": 46.5802, "lng": 0.3404, "city": "Poitiers", "address": "Centre-ville"}'::jsonb
        INTO v_owner_id, v_location
        FROM users LIMIT 1;
    END IF;

    IF v_owner_id IS NULL THEN
        RAISE NOTICE 'Aucun utilisateur trouvé — articles de test non insérés.';
        RETURN;
    END IF;

    INSERT INTO items (id, owner_id, type, title, description, category, condition,
                       price_cents, accepts_cash, allow_offers, photos, status,
                       location, radius_km, tags, created_at)
    VALUES
        (gen_random_uuid()::text, v_owner_id, 'sale',
         'Vélo de ville homme — 3 vitesses',
         'Vélo en bon état, peu utilisé. Guidon réglable, antivol inclus.',
         'Véhicules', 'good', 8500, true, true, '[]', 'active',
         v_location, 5.0, '[]', NOW()),

        (gen_random_uuid()::text, v_owner_id, 'sale',
         'Table basse bois massif',
         'Table basse années 70, bois de chêne. Quelques micro-rayures sans importance.',
         'Mobilier', 'good', 4500, true, false, '[]', 'active',
         v_location, 5.0, '[]', NOW()),

        (gen_random_uuid()::text, v_owner_id, 'sale',
         'Lot livres policiers (×10)',
         '10 romans policiers en très bon état : Camilleri, Mankell, Connelly.',
         'Livres', 'good', 1200, true, true, '[]', 'active',
         v_location, 5.0, '[]', NOW()),

        (gen_random_uuid()::text, v_owner_id, 'sale',
         'Veste en cuir noir T.M',
         'Veste cuir véritable, portée 3 fois. Taille M. Fermetures zips nickel.',
         'Vêtements', 'new', 3500, true, true, '[]', 'active',
         v_location, 5.0, '[]', NOW()),

        (gen_random_uuid()::text, v_owner_id, 'sale',
         'Perceuse Bosch avec accessoires',
         'Perceuse sans fil 18V + 2 batteries + coffret de forets. Fonctionne parfaitement.',
         'Bricolage', 'good', 6000, true, false, '[]', 'active',
         v_location, 5.0, '[]', NOW());

    RAISE NOTICE 'Articles de test insérés pour owner_id = %', v_owner_id;
END;
$$;
