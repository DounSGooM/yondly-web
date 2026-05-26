export interface Location {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  email: string;
  is_partner?: boolean;
  stripe_account_id?: string;
  services?: string[];
  display_name: string;
  phone?: string;
  photo_url?: string;
  ratings_avg?: number;
  ratings_count: number;
  points: number;
  level: 'Graine' | 'Pousse' | 'Arbre' | 'Forêt';
  profile_theme_color?: string;
  co2_saved?: number;

  // Beneficiary ID for association linking
  beneficiary_id?: string;

  // Trust & Safety
  trust_level?: 'NEW' | 'BASIC_VERIFIED' | 'TRUSTED' | 'RESTRICTED' | 'BANNED';
  risk_score?: number;
  verified_email?: boolean;
  verified_phone?: boolean;
  two_factor_enabled?: boolean;

  // Association / CCAS
  is_association?: boolean;
  association_name?: string;
  association_verified?: boolean;

  created_at: string;
}

// DSA/KYBC Pro Seller Types
export type ProSellerStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export type LegalForm =
  | 'auto_entrepreneur'
  | 'ei'
  | 'eirl'
  | 'eurl'
  | 'sarl'
  | 'sas'
  | 'sasu'
  | 'sa'
  | 'snc'
  | 'association'
  | 'other';

export interface ProSeller {
  id: string;
  user_id: string;

  // Business identity
  business_name: string;
  trade_name?: string;
  legal_form: LegalForm;
  siren: string;
  siret?: string;
  rcs_number?: string;
  tva_number?: string;

  // Address
  address_line1: string;
  address_line2?: string;
  city: string;
  postcode: string;
  country: string;

  // Contact
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone: string;

  // Services & Status
  services: string[];
  status: ProSellerStatus;
  verified_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ProSellerPublic {
  business_name: string;
  trade_name?: string;
  legal_form: string;
  siren_masked: string;
  city: string;
  country: string;
  verified: boolean;
  verified_at?: string;
}

export interface SirenValidationResult {
  siren: string;
  is_valid: boolean;
  business_name?: string;
  legal_form?: string;
  address?: string;
  city?: string;
  postcode?: string;
  status?: string;
  creation_date?: string;
  error_message?: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  query?: string;
  category?: string;
  filters?: any; // JSON object
  alert_enabled: boolean;
  created_at: string;
}

export interface PublicList {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  item_ids: string[];
  items?: Item[];
  created_at: string;
}

export type ItemType = 'donation' | 'sale' | 'rent' | 'exchange' | 'service';
export type FoodType = 'non_perishable' | 'fresh_produce';
export type ItemCondition = 'new' | 'good' | 'repair';
export type ItemStatus = 'active' | 'reserved' | 'completed' | 'expired';

export interface Item {
  id: string;
  store_id?: string;
  type: ItemType;
  food_type?: FoodType;
  title: string;
  description?: string;
  photos: string[];
  category: string;
  condition?: ItemCondition;
  tags?: string[];
  location: Location;
  radius_km?: number;
  urgency_hours?: number;
  price_cents?: number;
  price_per_day_cents?: number;
  deposit_cents?: number;
  max_duration_days?: number;
  allow_offers: boolean;
  status: ItemStatus;
  owner_id: string;
  created_at: string;
  expires_at?: string;
  locked_offer_id?: string;
  locked_until?: string;
  owner?: User;
  store?: Store;
  distance_km?: number;
  co2_estimate?: {
    co2_saved_kg: number;
    [key: string]: any;
  };

  // Gamification
  views_count?: number;
  boosted_until?: string;

  // Suspended Baskets (Mapped from Deal)
  allow_suspension?: boolean;
  suspended_available?: number;
}

export interface Message {
  id: string;
  item_id: string;
  from_id: string;
  to_id: string;
  text: string;
  offer_id?: string;
  read_by: string[];
  deleted_by: string[];
  created_at: string;
}

export interface Offer {
  id: string;
  item_id: string;
  buyer_id: string;
  amount_cents: number;
  counter_offer_amount_cents?: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'countered';
  accepted_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface StoreHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export type BadgeType = 'basic' | 'plus' | 'premium';

export interface Store {
  id: string;
  name: string;
  logo?: string;
  address: string;
  location?: Location;
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
  description?: string;
  category: string;
  badge_type: BadgeType;
  hours?: StoreHours;
  followers_count: number;
  created_at: string;
  distance_km?: number;
  deals?: Deal[];
  is_following?: boolean;
}

export type DiscountType = 'percentage' | 'fixed';

export interface Deal {
  id: string;
  store_id: string;
  store?: Store;
  title: string;
  description?: string;
  discount_type: DiscountType;
  original_price?: number;
  deal_price?: number;
  discount_value?: number;
  expires_at: string;
  quantity?: number;

  // Suspended Baskets
  allow_suspension?: boolean;
  suspended_quantity?: number;
  suspended_available?: number;

  category: string;
  status: 'active' | 'expired';
  created_at: string;
}

// ============================================
// Association / CCAS Types
// ============================================

export interface Beneficiary {
  id: string;
  association_id: string;
  internal_ref: string;
  initials: string;
  family_size: number;
  notes?: string;
  is_active: boolean;
  total_baskets: number;
  last_distribution?: string;
  linked_user_id?: string;
  allow_self_service: boolean;
  self_service_quota: number;
  created_at: string;
}

export interface BeneficiaryCreate {
  internal_ref: string;
  initials: string;
  family_size?: number;
  notes?: string;
  yondly_id?: string;
  allow_self_service: boolean;
  self_service_quota: number;
}

export interface BeneficiaryUpdate {
  internal_ref?: string;
  initials?: string;
  family_size?: number;
  notes?: string;
  is_active?: boolean;
  allow_self_service?: boolean;
  self_service_quota?: number;
}

export interface Distribution {
  id: string;
  association_id: string;
  beneficiary_id?: string;
  beneficiary_initials?: string;
  deal_id?: string;
  store_name?: string;
  quantity: number;
  notes?: string;
  distributed_at: string;
}

export interface DistributionCreate {
  beneficiary_id?: string;
  quantity: number;
  notes?: string;
}

export interface AssociationStats {
  total_baskets_claimed: number;
  total_baskets_distributed: number;
  active_beneficiaries: number;
  this_month_baskets: number;
  this_month_distributions: number;
  impact_families: number;
}

