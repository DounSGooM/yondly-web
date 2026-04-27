import logging
import httpx
from database import db

logger = logging.getLogger(__name__)


async def check_zone_coverage(postcode=None, citycode=None, location=None) -> bool:
    """
    Check if a location is within an active zone.
    Priority: CityCode (INSEE) > Lat/Lng (Reverse Geo) > Postcode.
    Returns False (block) if no active zones are defined.
    """
    try:
        zones = await db.zones.find({"isActive": True}).to_list(100)

        allowed_insee = set()
        allowed_postcodes = set()

        for z in zones:
            for c in z.get("communes", []):
                if c.get("isActive", True):
                    if c.get("code"):
                        allowed_insee.add(c["code"])
                    for cp in c.get("postalCodes", []):
                        allowed_postcodes.add(cp)

        if not zones:
            return False

        if citycode and citycode in allowed_insee:
            return True

        if location:
            lat = location.get("lat") if isinstance(location, dict) else location.lat
            lng = location.get("lng") if isinstance(location, dict) else location.lng
            if lat and lng:
                try:
                    async with httpx.AsyncClient(timeout=3.0) as client:
                        res = await client.get(
                            "https://geo.api.gouv.fr/communes",
                            params={"lat": lat, "lon": lng, "fields": "code"},
                        )
                        if res.status_code == 200:
                            data = res.json()
                            if data and data[0].get("code") in allowed_insee:
                                return True
                except Exception as e:
                    logger.error(f"Geo validation API error: {e}")

        if postcode and postcode in allowed_postcodes:
            return True

        return False
    except Exception as e:
        logger.error(f"Zone check error: {e}")
        return False
