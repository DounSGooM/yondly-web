import os
import random
import string

def calculate_platform_fee(amount_cents: int, user_level: str = 'Novice') -> dict:
    """
    Calculate platform fee in EUR cents.
    Rule: max(round(0.05 * amount_euros) + 0.49, 0.99) with cap at 9.99
    
    Level Benefits:
    - Expert: 10% discount on fees
    - Ambassadeur: 20% discount on fees
    
    All values in cents for storage.
    """
    amount_euros = amount_cents / 100
    
    # Calculate base fee: 5% + 0.49€
    base_fee_euros = round(0.05 * amount_euros, 2) + 0.49
    
    # Apply minimum and maximum
    fee_euros = max(base_fee_euros, 0.99)
    fee_euros = min(fee_euros, 9.99)
    
    # Apply Level Discount
    discount_multiplier = 1.0
    if user_level == 'Expert':
        discount_multiplier = 0.90 # 10% off
    elif user_level == 'Ambassadeur':
        discount_multiplier = 0.80 # 20% off
        
    fee_euros = round(fee_euros * discount_multiplier, 2)
    
    fee_cents = int(fee_euros * 100)
    payout_cents = amount_cents - fee_cents
    
    return {
        'amount_cents': amount_cents,
        'platform_fee_cents': fee_cents,
        'payout_cents': payout_cents,
        'fee_euros': fee_euros,
        'payout_euros': payout_cents / 100,
        'discount_applied': user_level if discount_multiplier < 1.0 else None
    }

import hashlib

def generate_handoff_code(length: int = 6) -> str:
    """Generate a random alphanumeric handoff code."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def hash_handoff_code(code: str) -> str:
    """Hash the handoff code for storage."""
    return hashlib.sha256(code.encode('utf-8')).hexdigest()

def get_stripe_config():
    """Get Stripe configuration from environment."""
    return {
        'public_key': os.environ.get('STRIPE_PUBLIC_KEY', 'pk_test_xxx'),
        'secret_key': os.environ.get('STRIPE_SECRET_KEY', 'sk_test_xxx'),
        'webhook_secret': os.environ.get('STRIPE_WEBHOOK_SECRET', 'whsec_xxx'),
        'connect_client_id': os.environ.get('STRIPE_CONNECT_CLIENT_ID', 'ca_xxx')
    }
