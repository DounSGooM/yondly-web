"""
Location utilities for reverse geocoding and proximity scoring.
Uses Nominatim (OpenStreetMap) for free reverse geocoding.
"""

import requests
from typing import Dict, Optional, Tuple
import math
from functools import lru_cache

# Nominatim API endpoint (free, no API key required)
NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"

# User agent required by Nominatim
HEADERS = {
    'User-Agent': 'LoopApp/1.0'
}

@lru_cache(maxsize=1000)
def reverse_geocode(lat: float, lng: float) -> Optional[Dict]:
    """
    Reverse geocode coordinates to address components.
    Cached to avoid repeated API calls for same location.
    
    Returns dict with: street, neighborhood, city, county, state, country
    """
    try:
        params = {
            'lat': lat,
            'lon': lng,
            'format': 'json',
            'addressdetails': 1,
            'zoom': 18,  # Street level
        }

        response = requests.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=5)

        if response.status_code == 200:
            data = response.json()
            address = data.get('address', {})

            # Extract relevant components
            return {
                'street': address.get('road') or address.get('pedestrian') or address.get('path'),
                'house_number': address.get('house_number'),
                'neighborhood': address.get('neighbourhood') or address.get('suburb') or address.get('quarter'),
                'city': address.get('city') or address.get('town') or address.get('village'),
                'county': address.get('county'),
                'state': address.get('state'),
                'postcode': address.get('postcode'),
                'country': address.get('country'),
                'display_name': data.get('display_name'),
            }
    except Exception as e:
        print(f"Reverse geocoding error: {e}")

    return None

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate distance between two points using Haversine formula.
    Returns distance in kilometers.
    """
    R = 6371  # Earth's radius in km

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)

    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lng / 2) ** 2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c

    return round(distance, 2)

def calculate_proximity_score(
    user_address: Dict,
    item_address: Dict,
    distance_km: float
) -> Tuple[int, str]:
    """
    Calculate proximity score based on address matching.
    
    Returns:
        - score (int): Higher is closer (0-100)
        - level (str): 'same_street', 'same_neighborhood', 'same_city', 'same_region', 'far'
    """
    if not user_address or not item_address:
        # Fallback to distance-based scoring
        if distance_km < 1:
            return 60, 'nearby'
        elif distance_km < 5:
            return 40, 'close'
        elif distance_km < 20:
            return 20, 'far'
        else:
            return 10, 'very_far'

    # Same street (highest priority)
    if (user_address.get('street') and
        user_address.get('street') == item_address.get('street') and
        user_address.get('city') == item_address.get('city')):
        return 100, 'same_street'

    # Same neighborhood
    if (user_address.get('neighborhood') and
        user_address.get('neighborhood') == item_address.get('neighborhood')):
        return 75, 'same_neighborhood'

    # Same city
    if (user_address.get('city') and
        user_address.get('city') == item_address.get('city')):
        return 50, 'same_city'

    # Same county/region
    if (user_address.get('county') and
        user_address.get('county') == item_address.get('county')):
        return 25, 'same_region'

    # Fallback to distance
    if distance_km < 1:
        return 60, 'nearby'
    elif distance_km < 5:
        return 40, 'close'
    elif distance_km < 20:
        return 20, 'far'
    else:
        return 10, 'very_far'

def format_address_short(address: Dict) -> str:
    """Format address for display (short version)."""
    if not address:
        return "Adresse inconnue"

    parts = []

    if address.get('street'):
        if address.get('house_number'):
            parts.append(f"{address['house_number']} {address['street']}")
        else:
            parts.append(address['street'])

    if address.get('city'):
        parts.append(address['city'])

    return ', '.join(parts) if parts else address.get('display_name', 'Adresse inconnue')

def format_proximity_label(level: str, distance_km: float) -> str:
    """Format proximity level for display."""
    labels = {
        'same_street': '📍 Même rue',
        'same_neighborhood': '🏘️ Même quartier',
        'same_city': '🏙️ Même ville',
        'same_region': '🗺️ Même région',
        'nearby': f'📏 {distance_km} km',
        'close': f'📏 {distance_km} km',
        'far': f'📏 {distance_km} km',
        'very_far': f'📏 {distance_km} km',
    }

    return labels.get(level, f'{distance_km} km')
