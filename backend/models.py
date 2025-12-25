from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime

class Location(BaseModel):
    lat: float
    lng: float

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    phone: Optional[str] = None
    is_partner: bool = False
    services: List[str] = []
    # Address fields for local community
    street: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    citycode: Optional[str] = None
    context: Optional[str] = None  # Department, region
    location: Optional[Location] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    display_name: str
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    ratings_avg: Optional[float] = 0.0
    ratings_count: int = 0
    wallet_balance_cents: int = 0
    points: int = 0
    level: Literal['Novice', 'Habitué', 'Expert', 'Ambassadeur'] = 'Novice'
    profile_theme_color: Optional[str] = None
    stripe_account_id: Optional[str] = None
    is_partner: bool = False
    services: List[str] = []
    # Address fields for local community
    street: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    citycode: Optional[str] = None
    context: Optional[str] = None
    location: Optional[Location] = None
    co2_saved: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    profile_theme_color: Optional[str] = None

class ItemCreate(BaseModel):
    store_id: Optional[str] = None
    type: Literal['donation', 'sale', 'rent']
    food_type: Optional[Literal['non_perishable', 'fresh_produce']] = None
    title: str
    description: Optional[str] = None
    photos: List[str] = []  # base64 encoded
    category: str
    condition: Optional[Literal['new', 'good', 'repair']] = None
    tags: Optional[List[str]] = []
    location: Optional[Location] = None
    radius_km: Optional[float] = 5.0
    urgency_hours: Optional[int] = None  # For food donations
    price_cents: Optional[int] = None  # For sales
    price_per_day_cents: Optional[int] = None  # For rentals
    deposit_cents: Optional[int] = None  # For rentals
    max_duration_days: Optional[int] = None  # For rentals
    allow_offers: bool = False

class Item(BaseModel):
    id: str
    store_id: Optional[str] = None
    type: Literal['donation', 'sale', 'rent']
    food_type: Optional[Literal['non_perishable', 'fresh_produce']] = None
    title: str
    description: Optional[str] = None
    photos: List[str] = []
    category: str
    condition: Optional[Literal['new', 'good', 'repair']] = None
    tags: Optional[List[str]] = []
    location: Location
    radius_km: Optional[float] = 5.0
    urgency_hours: Optional[int] = None
    price_cents: Optional[int] = None
    price_per_day_cents: Optional[int] = None
    deposit_cents: Optional[int] = None
    max_duration_days: Optional[int] = None
    allow_offers: bool = False
    status: Literal['active', 'reserved', 'completed', 'expired'] = 'active'
    owner_id: str
    owner: Optional[User] = None
    store: Optional['Store'] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    locked_offer_id: Optional[str] = None
    locked_until: Optional[datetime] = None

class HandoffData(BaseModel):
    mode: Literal['local', 'relay', 'home'] = 'local'
    code: Optional[str] = None
    photo_url: Optional[str] = None

class OrderCreate(BaseModel):
    item_id: str

class Order(BaseModel):
    id: str
    item_id: str
    buyer_id: str
    seller_id: str
    amount_cents: int
    platform_fee_cents: int
    payout_cents: int
    payment_status: Literal['initiated', 'escrowed', 'released', 'refunded'] = 'initiated'
    payment_intent_id: Optional[str] = None
    handoff: HandoffData
    dispute_status: Optional[Literal['open', 'resolved', 'rejected']] = None
    sponsor_id: Optional[str] = None  # Sponsor qui finance ce don
    sponsor_shown: bool = False  # Flag pour savoir si le sponsor a été affiché
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============ RATING MODELS ============

class RatingCreate(BaseModel):
    order_id: str
    rating: int  # 1-5
    comment: Optional[str] = None

class Rating(BaseModel):
    id: str
    order_id: str
    reviewer_id: str  # buyer who rates
    reviewed_id: str  # seller being rated
    rating: int  # 1-5
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Message(BaseModel):
    id: str
    item_id: str
    from_id: str
    to_id: str
    text: str
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MessageCreate(BaseModel):
    item_id: str
    to_id: str
    text: str

class OfferCreate(BaseModel):
    item_id: str
    amount_cents: int
    message: Optional[str] = None

class Offer(BaseModel):
    id: str
    item_id: str
    buyer_id: str
    buyer: Optional[User] = None
    amount_cents: int
    message: Optional[str] = None
    status: Literal['pending', 'accepted', 'declined', 'expired'] = 'pending'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    accepted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

class PartnerRequest(BaseModel):
    email: str
    business_name: str
    business_type: Literal['food', 'textile',  'furniture', 'electronics', 'books', 'sports', 'children', 'other']
    description: Optional[str] = None
    estimated_volume: Optional[str] = None


# ============ DSA/KYBC PRO SELLER MODELS ============

class ProSellerStatus(str):
    """Status of Pro seller verification (DSA compliance)"""
    PENDING = "pending"          # Awaiting verification
    VERIFIED = "verified"        # Verified and approved
    REJECTED = "rejected"        # Verification rejected
    SUSPENDED = "suspended"      # Account suspended

class LegalForm(str):
    """French legal forms for businesses"""
    AUTO_ENTREPRENEUR = "auto_entrepreneur"
    EI = "ei"                    # Entreprise Individuelle
    EIRL = "eirl"
    EURL = "eurl"
    SARL = "sarl"
    SAS = "sas"
    SASU = "sasu"
    SA = "sa"
    SNC = "snc"
    ASSOCIATION = "association"
    OTHER = "other"

class ProSellerCreate(BaseModel):
    """Registration data for Pro seller (DSA Art. 30)"""
    # Business identity
    business_name: str                    # Raison sociale
    trade_name: Optional[str] = None      # Nom commercial (si différent)
    legal_form: Literal[
        'auto_entrepreneur', 'ei', 'eirl', 'eurl', 
        'sarl', 'sas', 'sasu', 'sa', 'snc', 'association', 'other'
    ]
    siren: str                            # 9 digits
    siret: Optional[str] = None           # 14 digits (SIREN + NIC)
    rcs_number: Optional[str] = None      # RCS or RM number
    tva_number: Optional[str] = None      # VAT number (FR + 11 digits)
    
    # Registered address (siège social)
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    postcode: str
    country: str = "FR"
    
    # Legal representative contact
    contact_first_name: str
    contact_last_name: str
    contact_email: str
    contact_phone: str
    
    # Required documents for verification (DSA compliance)
    kbis_document_url: str                # Kbis or equivalent - REQUIRED
    identity_document_url: str            # ID card or passport - REQUIRED
    
    # Services offered
    services: List[str] = []  # 'sale', 'rent', 'anti_waste'

class ProSeller(BaseModel):
    """Professional seller entity (DSA Art. 30 compliant)"""
    id: str
    user_id: str                          # Link to User
    
    # Business identity (DSA mandatory fields)
    business_name: str                    # Raison sociale
    trade_name: Optional[str] = None      # Nom commercial
    legal_form: str                       # Form juridique
    siren: str                            # 9 digits - UNIQUE
    siret: Optional[str] = None           # 14 digits
    rcs_number: Optional[str] = None      # RCS ou RM
    tva_number: Optional[str] = None      # TVA intracommunautaire
    
    # Registered address
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    postcode: str
    country: str = "FR"
    
    # Legal representative
    contact_first_name: str
    contact_last_name: str
    contact_email: str
    contact_phone: str
    
    # Services & Stripe
    services: List[str] = []
    stripe_account_id: Optional[str] = None
    payout_enabled: bool = False
    
    # Verification status (DSA compliance)
    status: Literal['pending', 'verified', 'rejected', 'suspended'] = 'pending'
    verification_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None     # Admin user ID
    
    # Documents (optional but recommended)
    kbis_document_url: Optional[str] = None
    identity_document_url: Optional[str] = None
    
    # SIREN validation result
    siren_validated: bool = False
    siren_validation_date: Optional[datetime] = None
    siren_validation_data: Optional[Dict[str, Any]] = None  # INSEE API response
    
    # Audit trail & retention (DSA Art. 30.4 - 6 months after relationship ends)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deactivated_at: Optional[datetime] = None
    retention_until: Optional[datetime] = None  # created_at + 6 months after deactivation
    
    # Stats
    total_sales: int = 0
    total_revenue_cents: int = 0

class ProSellerUpdate(BaseModel):
    """Update Pro seller profile"""
    trade_name: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    services: Optional[List[str]] = None

class ProSellerVerification(BaseModel):
    """Admin verification action for Pro seller"""
    action: Literal['verify', 'reject', 'suspend', 'reactivate']
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class SirenValidationResult(BaseModel):
    """Result from SIREN validation API"""
    siren: str
    is_valid: bool
    business_name: Optional[str] = None
    legal_form: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    status: Optional[str] = None          # 'active', 'radiée', etc.
    creation_date: Optional[str] = None
    error_message: Optional[str] = None

# Stores
class StoreHours(BaseModel):
    monday: Optional[str] = None
    tuesday: Optional[str] = None
    wednesday: Optional[str] = None
    thursday: Optional[str] = None
    friday: Optional[str] = None
    saturday: Optional[str] = None
    sunday: Optional[str] = None

class StoreCreate(BaseModel):
    name: str
    address: str
    location: Location
    category: str
    logo_url: Optional[str] = None
    hours: Optional[StoreHours] = None
    description: Optional[str] = None
    website: Optional[str] = None
    services: List[str] = []  # 'sale', 'rent', 'anti_waste'

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    hours: Optional[StoreHours] = None
    logo_url: Optional[str] = None
    services: Optional[List[str]] = None

class Store(BaseModel):
    id: str
    name: str
    address: str
    location: Location
    category: str
    logo_url: Optional[str] = None
    hours: Optional[StoreHours] = None
    description: Optional[str] = None
    website: Optional[str] = None
    services: List[str] = []
    followers_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PartnerApplication(BaseModel):
    id: str
    email: str
    business_name: str
    business_type: str
    contact_name: str
    contact_email: str
    contact_phone: str
    hours: Optional[StoreHours] = None
    description: Optional[str] = None
    website: Optional[str] = None
    estimated_volume: Optional[str] = None
    services: List[str] = []
    status: Literal['pending', 'approved', 'rejected'] = 'pending'
    created_at: datetime = Field(default_factory=datetime.utcnow)

class StoreFollower(BaseModel):
    id: str
    user_id: str
    store_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Sponsor(BaseModel):
    id: str
    name: str
    logo_url: str  # URL ou base64 du logo
    message: str  # Message de sponsoring
    website: Optional[str] = None
    display_count: int = 0  # Nombre de fois affiché pour rotation équitable
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CounterOfferUpdate(BaseModel):
    amount_cents: int
    message: Optional[str] = None

# Rental Booking Models
class BookingCreate(BaseModel):
    item_id: str
    start_date: str  # ISO format date string YYYY-MM-DD
    end_date: str    # ISO format date string YYYY-MM-DD
    message: Optional[str] = None

class Booking(BaseModel):
    id: str
    item_id: str
    renter_id: str
    owner_id: str
    start_date: str  # ISO format date string
    end_date: str    # ISO format date string
    status: Literal['pending', 'accepted', 'declined', 'cancelled', 'completed'] = 'pending'
    total_price_cents: int
    deposit_cents: int
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    item: Optional[Item] = None
    renter: Optional[User] = None

# Wallet Models
class Transaction(BaseModel):
    id: str
    user_id: str
    amount_cents: int  # Positive for credit, negative for debit
    type: Literal['sale', 'rental', 'withdrawal', 'refund', 'deposit']
    status: Literal['pending', 'completed', 'failed'] = 'completed'
    reference_id: Optional[str] = None  # Order ID, Booking ID, or Withdrawal ID
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WithdrawalRequest(BaseModel):
    amount_cents: int
    iban: str
    bic: str
    account_holder_name: str

class Withdrawal(BaseModel):
    id: str
    user_id: str
    amount_cents: int
    status: Literal['pending', 'processing', 'completed', 'failed'] = 'pending'
    iban: str
    bic: str
    account_holder_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None

class SavedSearchCreate(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    filters: Optional[dict] = None  # JSON object for other filters
    alert_enabled: bool = True

class SavedSearch(BaseModel):
    id: str
    user_id: str
    query: Optional[str] = None
    category: Optional[str] = None
    filters: Optional[dict] = None
    alert_enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PublicListCreate(BaseModel):
    name: str
    description: Optional[str] = None
    item_ids: List[str] = []

class PublicList(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    item_ids: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Store Models
class Store(BaseModel):
    id: str
    owner_id: str
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    lat: float
    lng: float
    logo: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Deal Models (Anti-Gaspi)
class Deal(BaseModel):
    id: str
    store_id: str
    title: str
    description: str
    original_price: float
    deal_price: float
    discount_value: int
    discount_type: Literal['percentage', 'fixed']
    category: Literal['Food', 'Flowers', 'Other']
    status: Literal['active', 'sold', 'expired'] = 'active'
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    store: Optional[Store] = None  # For response population


# ============ GEO-RESTRICTION MODELS ============

class Commune(BaseModel):
    """A commune within a zone (city/town)"""
    name: str
    population: int = 0
    isActive: bool = False

class GeoZoneCreate(BaseModel):
    """Create a new geo-zone (EPCI: Communauté de Communes or Agglomération)"""
    name: str  # Official EPCI name, e.g., "Grand Poitiers"
    displayName: str  # Display name for users
    type: Literal['agglomeration', 'communaute_communes', 'metropole', 'communaute_urbaine'] = 'agglomeration'
    isActive: bool = True
    communes: List[Commune] = []

class GeoZone(BaseModel):
    """A geo-zone representing an EPCI territory"""
    id: str
    name: str
    displayName: str
    type: Literal['agglomeration', 'communaute_communes', 'metropole', 'communaute_urbaine'] = 'agglomeration'
    isActive: bool = True
    communes: List[Commune] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class GeoZoneUpdate(BaseModel):
    """Update a geo-zone"""
    name: Optional[str] = None
    displayName: Optional[str] = None
    type: Optional[Literal['agglomeration', 'communaute_communes', 'metropole', 'communaute_urbaine']] = None
    isActive: Optional[bool] = None
    communes: Optional[List[Commune]] = None

class CommuneToggle(BaseModel):
    """Toggle a commune's active status"""
    isActive: bool


# ============ RENTAL BOOKING MODELS ============

class RentalBookingCreate(BaseModel):
    """Create a new rental booking"""
    item_id: str
    start_date: datetime
    end_date: datetime

class RentalBooking(BaseModel):
    """A rental booking for an item"""
    id: str
    item_id: str
    renter_id: str  # Person renting the item
    owner_id: str   # Owner of the item
    start_date: datetime
    end_date: datetime
    duration_days: int
    price_per_day_cents: int
    total_price_cents: int
    deposit_cents: int
    platform_fee_cents: int
    payout_cents: int
    status: Literal['pending', 'confirmed', 'active', 'returned', 'cancelled', 'dispute'] = 'pending'
    payment_status: Literal['pending', 'deposit_paid', 'fully_paid', 'deposit_returned', 'deposit_kept'] = 'pending'
    payment_intent_id: Optional[str] = None
    deposit_intent_id: Optional[str] = None
    pickup_code: Optional[str] = None
    return_code: Optional[str] = None
    pickup_confirmed_at: Optional[datetime] = None
    return_confirmed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RentalReturn(BaseModel):
    """Rental return confirmation"""
    rental_id: str
    return_code: str
    condition_ok: bool = True
    notes: Optional[str] = None
    photos: List[str] = []


# ============ DISPUTE MODELS ============

class DisputeCreate(BaseModel):
    """Create a new dispute"""
    order_id: Optional[str] = None  # For order disputes
    rental_id: Optional[str] = None  # For rental disputes
    reason: Literal['item_not_received', 'item_damaged', 'item_not_as_described', 'seller_unresponsive', 'other']
    description: str
    evidence_photos: List[str] = []

class Dispute(BaseModel):
    """A dispute between buyer and seller"""
    id: str
    order_id: Optional[str] = None
    rental_id: Optional[str] = None
    complainant_id: str  # Who filed the dispute
    respondent_id: str   # Who the dispute is against
    reason: Literal['item_not_received', 'item_damaged', 'item_not_as_described', 'seller_unresponsive', 'other']
    description: str
    evidence_photos: List[str] = []
    status: Literal['open', 'under_review', 'resolved_buyer', 'resolved_seller', 'closed'] = 'open'
    resolution_notes: Optional[str] = None
    refund_amount_cents: Optional[int] = None
    resolved_by: Optional[str] = None  # Admin who resolved
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None

class DisputeResolution(BaseModel):
    """Admin resolution of a dispute"""
    resolution: Literal['refund_full', 'refund_partial', 'no_refund', 'closed']
    notes: str
    refund_percentage: Optional[int] = None  # For partial refunds (0-100)


class Notification(BaseModel):
    """User notification"""
    id: str
    user_id: str
    type: Literal['order_status', 'rental_status', 'payment', 'dispute', 'system', 'message', 'promo']
    title: str
    message: str
    read: bool = False
    data: Optional[Dict[str, Any]] = None  # e.g. {"order_id": "123"}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class NewsletterSubscriber(BaseModel):
    id: str
    email: EmailStr
    source: str = "landing_page"
    created_at: datetime = Field(default_factory=datetime.utcnow)
