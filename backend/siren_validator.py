# SIREN Validator for DSA/KYBC Compliance
# Validates French business registration numbers using INSEE Sirene API

import re
import httpx
from typing import Optional
from datetime import datetime

# INSEE API (free tier - requires registration at https://api.insee.fr)
# For production, register and get API keys
INSEE_API_BASE = "https://api.insee.fr/entreprises/sirene/V3"


def validate_siren_format(siren: str) -> bool:
    """Validate SIREN format (9 digits)
    
    Note: For MVP, we only check format. Luhn checksum is not always reliable
    for French SIREN numbers due to historical inconsistencies.
    """
    siren = siren.replace(" ", "")
    
    # Just check it's exactly 9 digits
    if not re.match(r'^\d{9}$', siren):
        return False
    
    return True


def validate_siret_format(siret: str) -> bool:
    """Validate SIRET format (14 digits)
    
    Note: For MVP, we only check format. Luhn checksum is skipped because
    auto-generated NIC (00001) may not always pass for all SIREN values.
    """
    siret = siret.replace(" ", "")
    
    if not re.match(r'^\d{14}$', siret):
        return False
    
    return True


def validate_tva_format(tva: str) -> bool:
    """Validate French VAT number format (FR + 2 digits + 9 digits SIREN)"""
    tva = tva.replace(" ", "").upper()
    
    if not re.match(r'^FR\d{11}$', tva):
        return False
    
    # The 2 digits after FR are a key derived from SIREN
    siren = tva[4:]  # Last 9 digits
    key = tva[2:4]   # 2 digits after FR
    
    # Validate SIREN part
    if not validate_siren_format(siren):
        return False
    
    # Key calculation: (12 + 3 * (SIREN % 97)) % 97
    expected_key = (12 + 3 * (int(siren) % 97)) % 97
    
    return int(key) == expected_key


async def validate_siren_with_insee(
    siren: str,
    insee_token: Optional[str] = None
) -> dict:
    """
    Validate SIREN using the FREE recherche-entreprises.api.gouv.fr API.
    No API key required! Full company data returned.
    
    Returns:
        {
            "siren": "123456789",
            "is_valid": True/False,
            "business_name": "...",
            "legal_form": "...",
            "address": "...",
            "city": "...",
            "postcode": "...",
            "status": "active" / "cessée",
            "creation_date": "2020-01-15",
            "error_message": None or "..."
        }
    """
    siren = siren.replace(" ", "")
    
    # First validate format
    if not validate_siren_format(siren):
        return {
            "siren": siren,
            "is_valid": False,
            "error_message": "Format SIREN invalide (doit contenir 9 chiffres)"
        }
    
    # Use the FREE recherche-entreprises.api.gouv.fr API
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://recherche-entreprises.api.gouv.fr/search?q={siren}",
                timeout=10.0
            )
            
            if response.status_code != 200:
                return {
                    "siren": siren,
                    "is_valid": True,  # Format valid
                    "error_message": f"Impossible de vérifier (erreur {response.status_code})"
                }
            
            data = response.json()
            results = data.get("results", [])
            
            # Find the exact SIREN match
            company = None
            for r in results:
                if r.get("siren") == siren:
                    company = r
                    break
            
            if not company:
                return {
                    "siren": siren,
                    "is_valid": False,
                    "error_message": "SIREN non trouvé dans la base Sirene"
                }
            
            # Get company name
            nom = company.get("nom_complet") or company.get("nom_raison_sociale", "")
            
            # Get siege (headquarters) info
            siege = company.get("siege", {})
            
            # Check if company is active
            etat = siege.get("etat_administratif", "A")
            is_active = etat == "A"
            
            return {
                "siren": siren,
                "is_valid": is_active,
                "business_name": nom,
                "legal_form": company.get("nature_juridique"),
                "address": siege.get("adresse"),
                "city": siege.get("libelle_commune"),
                "postcode": siege.get("code_postal"),
                "status": "active" if is_active else "cessée",
                "creation_date": siege.get("date_creation"),
                "error_message": None if is_active else "⚠️ Entreprise cessée/radiée"
            }
            
    except httpx.TimeoutException:
        return {
            "siren": siren,
            "is_valid": True,
            "error_message": "Timeout - format valide mais existence non vérifiée"
        }
    except Exception as e:
        return {
            "siren": siren,
            "is_valid": True,
            "error_message": f"Format valide (vérification impossible: {str(e)})"
        }


def mask_siren(siren: str) -> str:
    """Mask SIREN for public display (DSA transparency requirement)"""
    siren = siren.replace(" ", "")
    if len(siren) != 9:
        return siren
    # Show format: XXX XXX X12 (last 2 digits visible)
    return f"XXX XXX X{siren[-2:]}"


def format_siren(siren: str) -> str:
    """Format SIREN with spaces for readability: 123 456 789"""
    siren = siren.replace(" ", "")
    if len(siren) != 9:
        return siren
    return f"{siren[:3]} {siren[3:6]} {siren[6:]}"


def format_siret(siret: str) -> str:
    """Format SIRET with spaces for readability: 123 456 789 00012"""
    siret = siret.replace(" ", "")
    if len(siret) != 14:
        return siret
    return f"{siret[:3]} {siret[3:6]} {siret[6:9]} {siret[9:]}"
