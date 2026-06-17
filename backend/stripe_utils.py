import os
import random
import string

# Paiement sécurisé disponible uniquement au-dessus de ce seuil.
# En dessous, l'article doit passer en don ou échange sans intégration Stripe.
MINIMUM_PAYABLE_CENTS = 300  # 3,00 €

def calculate_platform_fee(amount_cents: int, user_level: str = 'Graine') -> dict:
    """
    Calculate platform fee in EUR cents based on Gamification levels.
    
    Level Benefits:
    - Graine: 5.0% + 0.49€
    - Pousse: 4.5% + 0.45€
    - Arbre:  4.0% + 0.39€
    - Forêt:  3.5% + 0.35€
    
    All values in cents for storage.
    """
    amount_euros = amount_cents / 100
    
    # Rates based on level
    if user_level == 'Forêt':
        percent = 0.035
        fixed = 0.35
    elif user_level == 'Arbre':
        percent = 0.040
        fixed = 0.39
    elif user_level == 'Pousse':
        percent = 0.045
        fixed = 0.45
    else: # Default: Graine or unknown
        percent = 0.050
        fixed = 0.49
        
    fee_euros = round(percent * amount_euros, 2) + fixed
    
    # Apply minimum (to cover Stripe fees) and maximum (cap)
    fee_euros = max(fee_euros, 0.50) # Must cover at least basic Stripe processing
    fee_euros = min(fee_euros, 9.99)
    
    fee_cents = int(round(fee_euros * 100))
    payout_cents = amount_cents - fee_cents
    
    return {
        'amount_cents': amount_cents,
        'platform_fee_cents': fee_cents,
        'payout_cents': payout_cents,
        'fee_euros': fee_euros,
        'payout_euros': payout_cents / 100,
        'discount_applied': user_level if user_level != 'Graine' else None
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
