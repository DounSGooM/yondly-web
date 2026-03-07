import os
import sys

# Add the current directory to sys.path so we can import pdf_generator
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pdf_generator import generate_rental_contract

pro_data = {
    'legal_name': 'TechRent SARL',
    'trade_name': 'LocaTech',
    'siret': '12345678900012',
    'address_line1': '123 Rue de la République',
    'postal_code': '75001',
    'city': 'Paris',
    'contact_email': 'contact@locatech.fr',
    'contact_phone': '01 23 45 67 89',
    'mediator_name': '',
    'mediator_url': '',
    'mediator_contact': ''
}

renter_data = {
    'display_name': 'Jean Dupont',
    'email': 'jean.dupont@example.com',
    'phone': '06 12 34 56 78'
}

offer_data = {
    'title': 'Caméra Sony A7III + Objectif 24-70mm f/2.8',
    'description': 'Kit complet pour tournage vidéo et photographie. Inclus 2 batteries, un chargeur et une carte SD 128Go.',
    'category': 'Multimédia',
    'price_cents': 4500  # 45.00€
}

rental_data = {
    'start_at': '2026-03-01T10:00:00Z',
    'end_at': '2026-03-03T18:00:00Z',
    'accepted_at': '2026-02-23T18:50:00Z',
    'ip': '192.168.1.50',
    'acceptance_log_id': 'log_abc123456'
}

rental_specific = {
    'min_duration_hours': 24,
    'max_duration_hours': 168,
    'late_fee_per_day_cents': 5000,  # 50.00€
    'deposit_amount_cents': 150000,  # 1500.00€
    'usage_rules': 'Ne pas utiliser sous la pluie. Nettoyer les objectifs avant retour.'
}

# Save to the user's Desktop
desktop_dir = os.path.expanduser("~/Desktop")
filepath, pdf_hash = generate_rental_contract(
    rental_id="rent_sample123456",
    pro_data=pro_data,
    renter_data=renter_data,
    offer_data=offer_data,
    rental_data=rental_data,
    rental_specific=rental_specific,
    output_dir=desktop_dir
)

print(filepath)
