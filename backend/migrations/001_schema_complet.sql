-- ============================================================
-- YONDLY - Schéma PostgreSQL complet pour Supabase
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    display_name TEXT NOT NULL,
    phone TEXT,
    photo_url TEXT,
    ratings_avg FLOAT DEFAULT 0.0,
    ratings_count INT DEFAULT 0,
    wallet_balance_cents INT DEFAULT 0,
    points INT DEFAULT 0,
    level TEXT DEFAULT 'Graine' CHECK (level IN ('Graine','Pousse','Arbre','Forêt')),
    profile_theme_color TEXT,
    stripe_account_id TEXT,
    stripe_customer_id TEXT,
    is_partner BOOL DEFAULT FALSE,
    services TEXT[] DEFAULT '{}',
    street TEXT,
    city TEXT,
    postcode TEXT,
    citycode TEXT,
    context TEXT,
    lat FLOAT,
    lng FLOAT,
    co2_saved FLOAT DEFAULT 0.0,
    trust_level TEXT DEFAULT 'NEW' CHECK (trust_level IN ('NEW','BASIC_VERIFIED','TRUSTED','RESTRICTED','BANNED')),
    risk_score FLOAT DEFAULT 0.0,
    verified_email BOOL DEFAULT FALSE,
    verified_phone BOOL DEFAULT FALSE,
    two_factor_enabled BOOL DEFAULT FALSE,
    is_association BOOL DEFAULT FALSE,
    association_name TEXT,
    association_verified BOOL DEFAULT FALSE,
    beneficiary_id TEXT,
    free_boosts_available INT DEFAULT 0,
    last_boost_reset TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_level ON users(level);

-- ============================================================
-- AUTH TOKENS
-- ============================================================
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_email_verif_email ON email_verifications(email);

CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pwd_reset_email ON password_resets(email);

-- ============================================================
-- STORES
-- ============================================================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    address TEXT,
    lat FLOAT,
    lng FLOAT,
    category TEXT,
    logo_url TEXT,
    hours JSONB,
    description TEXT,
    website TEXT,
    services TEXT[] DEFAULT '{}',
    followers_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_stores_owner ON stores(owner_id);

CREATE TABLE store_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, store_id)
);

-- ============================================================
-- ITEMS
-- ============================================================
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('donation','sale','rent')),
    food_type TEXT CHECK (food_type IN ('non_perishable','fresh_produce')),
    title TEXT NOT NULL,
    description TEXT,
    photos TEXT[] DEFAULT '{}',
    category TEXT NOT NULL,
    condition TEXT CHECK (condition IN ('new','good','repair')),
    tags TEXT[] DEFAULT '{}',
    lat FLOAT,
    lng FLOAT,
    radius_km FLOAT DEFAULT 5.0,
    urgency_hours INT,
    price_cents INT,
    price_per_day_cents INT,
    deposit_cents INT,
    max_duration_days INT,
    allow_offers BOOL DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','reserved','completed','expired')),
    expires_at TIMESTAMPTZ,
    locked_offer_id UUID,
    locked_until TIMESTAMPTZ,
    co2_estimate JSONB,
    boosted_until TIMESTAMPTZ,
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_items_owner ON items(owner_id);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_store ON items(store_id);
CREATE INDEX idx_items_location ON items(lat, lng);

-- ============================================================
-- OFFERS
-- ============================================================
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_cents INT NOT NULL,
    days INT DEFAULT 1,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);
CREATE INDEX idx_offers_item ON offers(item_id);
CREATE INDEX idx_offers_buyer ON offers(buyer_id);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount_cents INT NOT NULL,
    platform_fee_cents INT NOT NULL,
    payout_cents INT NOT NULL,
    payment_status TEXT DEFAULT 'initiated' CHECK (payment_status IN ('initiated','escrowed','released','refunded')),
    payment_intent_id TEXT,
    handoff JSONB DEFAULT '{"mode":"local"}',
    dispute_status TEXT CHECK (dispute_status IN ('open','resolved','rejected')),
    sponsor_id UUID,
    sponsor_shown BOOL DEFAULT FALSE,
    handover_code_hash TEXT,
    handover_status TEXT DEFAULT 'pending' CHECK (handover_status IN ('pending','confirmed','disputed')),
    meeting_location TEXT,
    meeting_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_item ON orders(item_id);

-- ============================================================
-- RENTAL BOOKINGS
-- ============================================================
CREATE TABLE rental_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    renter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    duration_days INT NOT NULL,
    price_per_day_cents INT NOT NULL,
    total_price_cents INT NOT NULL,
    deposit_cents INT NOT NULL,
    platform_fee_cents INT NOT NULL,
    payout_cents INT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','active','returned','cancelled','dispute')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','deposit_paid','fully_paid','deposit_returned','deposit_kept')),
    payment_intent_id TEXT,
    deposit_intent_id TEXT,
    pickup_code TEXT,
    return_code TEXT,
    pickup_confirmed_at TIMESTAMPTZ,
    return_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_rentals_renter ON rental_bookings(renter_id);
CREATE INDEX idx_rentals_owner ON rental_bookings(owner_id);
CREATE INDEX idx_rentals_item ON rental_bookings(item_id);

-- ============================================================
-- INSPECTION REPORTS
-- ============================================================
CREATE TABLE inspection_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES rental_bookings(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in','out')),
    photos TEXT[] DEFAULT '{}',
    checklist JSONB DEFAULT '{}',
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RATINGS & MESSAGES
-- ============================================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ratings_reviewed ON ratings(reviewed_id);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    from_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    image_url TEXT,
    read BOOL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation ON messages(item_id, from_id, to_id);
CREATE INDEX idx_messages_to ON messages(to_id, read);

-- ============================================================
-- TRANSACTIONS & WALLET
-- ============================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_cents INT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sale','rental','withdrawal','refund','deposit')),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending','completed','failed')),
    reference_id UUID,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_transactions_user ON transactions(user_id);

CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_cents INT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
    iban TEXT NOT NULL,
    bic TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE TABLE deposit_holds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES rental_bookings(id) ON DELETE CASCADE,
    stripe_intent_id TEXT NOT NULL,
    amount_cents INT NOT NULL,
    status TEXT DEFAULT 'AUTHORIZED' CHECK (status IN ('AUTHORIZED','CAPTURED','RELEASED','FAILED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DISPUTES
-- ============================================================
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rental_id UUID REFERENCES rental_bookings(id) ON DELETE SET NULL,
    complainant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    respondent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    transaction_type TEXT CHECK (transaction_type IN ('ORDER','RENTAL')),
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_photos TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'open' CHECK (status IN ('open','under_review','resolved_buyer','resolved_seller','closed','OPEN','INFO_REQUESTED','NEGOTIATION','AGREEMENT_PENDING','RESOLVED','ESCALATED_TO_MEDIATOR','CLOSED_NO_AGREEMENT')),
    resolution_notes TEXT,
    refund_amount_cents INT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    escalated_at TIMESTAMPTZ,
    mediation_dossier_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_disputes_complainant ON disputes(complainant_id);
CREATE INDEX idx_disputes_respondent ON disputes(respondent_id);

CREATE TABLE dispute_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    file_url TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('IMAGE','DOCUMENT','VIDEO','OTHER')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE settlement_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type TEXT NOT NULL,
    amount_cents INT,
    currency TEXT DEFAULT 'EUR',
    details_text TEXT NOT NULL,
    status TEXT DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED','ACCEPTED','REJECTED','EXPIRED')),
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    stripe_action_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('order_status','rental_status','payment','dispute','system','message','promo')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOL DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);

-- ============================================================
-- SAFETY & AUDIT
-- ============================================================
CREATE TABLE safety_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('CONTACT_BLOCKED','RAPID_LISTINGS','NO_SHOW','LOGIN_FAILED','SUSPICIOUS_IP','OTHER')),
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low','medium','high')),
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_safety_events_user ON safety_events(user_id);

CREATE TABLE legal_acceptance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    context TEXT NOT NULL CHECK (context IN ('CHECKOUT_ORDER','CHECKOUT_RENTAL','PRO_TOS','CONSUMER_TOS','RENTAL_CONTRACT')),
    version TEXT NOT NULL,
    ip TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    payload_json JSONB DEFAULT '{}',
    accepted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANTI-GASPI DEALS
-- ============================================================
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    original_price FLOAT NOT NULL,
    deal_price FLOAT NOT NULL,
    discount_value INT NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage','fixed')),
    category TEXT CHECK (category IN ('Food','Flowers','Other')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active','sold','expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    allow_suspension BOOL DEFAULT FALSE,
    suspended_quantity INT DEFAULT 0,
    suspended_available INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_deals_store ON deals(store_id);
CREATE INDEX idx_deals_status ON deals(status);

-- ============================================================
-- SAVED SEARCHES & PUBLIC LISTS
-- ============================================================
CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT,
    category TEXT,
    filters JSONB,
    alert_enabled BOOL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);

CREATE TABLE public_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    item_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GEO ZONES
-- ============================================================
CREATE TABLE geo_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    type TEXT CHECK (type IN ('agglomeration','communaute_communes','metropole','communaute_urbaine')),
    is_active BOOL DEFAULT TRUE,
    communes JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRO SELLERS (DSA)
-- ============================================================
CREATE TABLE pro_sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    trade_name TEXT,
    legal_form TEXT NOT NULL,
    siren TEXT UNIQUE NOT NULL,
    siret TEXT,
    rcs_number TEXT,
    tva_number TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    postcode TEXT NOT NULL,
    country TEXT DEFAULT 'FR',
    contact_first_name TEXT NOT NULL,
    contact_last_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    services TEXT[] DEFAULT '{}',
    stripe_account_id TEXT,
    payout_enabled BOOL DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected','suspended')),
    verification_notes TEXT,
    rejection_reason TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    kbis_document_url TEXT,
    identity_document_url TEXT,
    siren_validated BOOL DEFAULT FALSE,
    siren_validation_date TIMESTAMPTZ,
    siren_validation_data JSONB,
    total_sales INT DEFAULT 0,
    total_revenue_cents INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ,
    retention_until TIMESTAMPTZ
);

CREATE TABLE trader_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pro_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PENDING','APPROVED','REJECTED','SUSPENDED')),
    docs_urls TEXT[] DEFAULT '{}',
    verified_at TIMESTAMPTZ,
    notes_admin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pro_payout_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pro_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_connected_account_id TEXT NOT NULL,
    onboarding_status TEXT DEFAULT 'NOT_STARTED' CHECK (onboarding_status IN ('NOT_STARTED','IN_PROGRESS','COMPLETE')),
    payouts_enabled BOOL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pro_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pro_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    legal_name TEXT NOT NULL,
    trade_name TEXT NOT NULL,
    siret TEXT NOT NULL,
    vat TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT DEFAULT 'FR',
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    website TEXT,
    mediator_name TEXT NOT NULL,
    mediator_url TEXT NOT NULL,
    mediator_contact TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRO OFFERS (anti-gaspi / location)
-- ============================================================
CREATE TABLE offer_pro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pro_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('ANTIGASPI_SALE','RENTAL')),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    price_cents INT NOT NULL,
    currency TEXT DEFAULT 'EUR',
    quantity INT DEFAULT 1,
    location_label TEXT NOT NULL,
    address_line1 TEXT,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','PAUSED','REMOVED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_offer_pro_pro ON offer_pro(pro_id);
CREATE INDEX idx_offer_pro_status ON offer_pro(status);

CREATE TABLE offer_antigaspi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL UNIQUE REFERENCES offer_pro(id) ON DELETE CASCADE,
    is_food BOOL DEFAULT TRUE,
    allergens_text TEXT,
    date_type TEXT DEFAULT 'NONE' CHECK (date_type IN ('DLC','DDM','NONE')),
    date_value TIMESTAMPTZ,
    pickup_slots JSONB DEFAULT '[]',
    pickup_instructions TEXT NOT NULL
);

CREATE TABLE offer_rental (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL UNIQUE REFERENCES offer_pro(id) ON DELETE CASCADE,
    deposit_amount_cents INT NOT NULL,
    min_duration_hours INT DEFAULT 24,
    max_duration_hours INT DEFAULT 168,
    late_fee_per_day_cents INT DEFAULT 0,
    usage_rules TEXT NOT NULL,
    safety_checklist_required BOOL DEFAULT TRUE,
    requires_insurance_proof BOOL DEFAULT FALSE
);

CREATE TABLE order_pro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES offer_pro(id) ON DELETE RESTRICT,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    pro_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    quantity INT DEFAULT 1,
    pickup_slot_start_at TIMESTAMPTZ NOT NULL,
    pickup_slot_end_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'PAID' CHECK (status IN ('PAID','READY','PICKED_UP','NO_SHOW','CANCELLED','REFUNDED')),
    qr_code_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rental_pro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES offer_pro(id) ON DELETE RESTRICT,
    renter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    pro_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'PAID' CHECK (status IN ('PAID','ACTIVE','RETURN_PENDING','COMPLETED','DISPUTED','CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rental_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES rental_pro(id) ON DELETE CASCADE,
    pdf_url TEXT NOT NULL,
    pdf_hash TEXT NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL,
    acceptance_log_id UUID REFERENCES legal_acceptance_logs(id) ON DELETE SET NULL
);

-- ============================================================
-- BENEFICIARIES (associations / CCAS)
-- ============================================================
CREATE TABLE beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    association_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    internal_ref TEXT NOT NULL,
    initials TEXT NOT NULL,
    family_size INT DEFAULT 1,
    notes TEXT,
    is_active BOOL DEFAULT TRUE,
    total_baskets INT DEFAULT 0,
    last_distribution TIMESTAMPTZ,
    linked_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    allow_self_service BOOL DEFAULT FALSE,
    self_service_quota INT DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_beneficiaries_asso ON beneficiaries(association_id);

CREATE TABLE distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    association_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE SET NULL,
    beneficiary_initials TEXT,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    store_name TEXT,
    quantity INT DEFAULT 1,
    notes TEXT,
    distributed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SPONSORS
-- ============================================================
CREATE TABLE sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    message TEXT NOT NULL,
    website TEXT,
    display_count INT DEFAULT 0,
    active BOOL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MARKETING & MISC
-- ============================================================
CREATE TABLE newsletter (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'landing_page',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    city TEXT,
    status TEXT DEFAULT 'particulier' CHECK (status IN ('particulier','pro','association')),
    comment TEXT,
    rgpd_consent BOOL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    rgpd_consent BOOL DEFAULT FALSE,
    read BOOL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    business TEXT NOT NULL,
    city TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    rgpd_consent BOOL DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','contacted','approved','rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dac7_export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INT NOT NULL,
    status TEXT DEFAULT 'CREATED' CHECK (status IN ('CREATED','GENERATING','READY','FAILED')),
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
