"""
Food Validator Module - AI-based validation for food donation images.
Uses Google Cloud Vision API to detect and validate food items.
"""

import os
from typing import Dict, List
import logging
from google.cloud import vision
from google.cloud.vision_v1 import types
import asyncio
from functools import lru_cache

logger = logging.getLogger(__name__)

# Categories of allowed non-perishable foods
ALLOWED_CATEGORIES = {
    'pasta', 'rice', 'canned goods', 'cereal', 'legumes', 'beans',
    'flour', 'sugar', 'oil', 'vinegar', 'dried fruits', 'nuts',
    'crackers', 'cookies', 'chips', 'packaged snacks', 'tea', 'coffee',
    'canned vegetables', 'canned fruits', 'canned fish', 'canned meat',
    'pasta sauce', 'tomato sauce', 'condiments', 'spices', 'salt',
    'biscuits', 'chocolate bars', 'candy', 'jam', 'honey', 'peanut butter',
    'popcorn', 'corn', 'snack', 'snacks', 'dried', 'packaged',
    'breakfast cereal', 'granola', 'muesli', 'oats', 'corn flakes'
}

# Keywords that indicate forbidden items
FORBIDDEN_KEYWORDS = {
    'homemade', 'fresh', 'cooked', 'prepared', 'leftovers', 'meal',
    'dish', 'plate', 'casserole', 'lasagna', 'gratin', 'stew',
    'soup', 'salad', 'meat', 'fish', 'dairy', 'cheese', 'milk',
    'yogurt', 'cream', 'butter', 'eggs', 'bread', 'cake', 'pastry',
    'fruit', 'vegetable', 'produce', 'refrigerated', 'frozen',
    'opened', 'open', 'unsealed', 'half-eaten', 'partially consumed'
}

# Keywords that indicate packaged/sealed items (good sign)
PACKAGED_KEYWORDS = {
    'package', 'box', 'can', 'jar', 'bottle', 'sealed', 'wrapped',
    'container', 'bag', 'packet', 'carton', 'tin', 'unopened',
    'closed', 'packaging', 'label', 'barcode'
}


class FoodValidator:
    """Validates food donation images using Google Cloud Vision API."""
    
    def __init__(self):
        """Initialize the Vision API client."""
        try:
            # Check for API Key first (simpler setup)
            api_key = os.environ.get('GOOGLE_CLOUD_VISION_API_KEY')
            
            if api_key:
                # Use API Key authentication
                from google.cloud.vision_v1 import ImageAnnotatorClient
                from google.api_core.client_options import ClientOptions
                
                client_options = ClientOptions(api_key=api_key)
                self.client = ImageAnnotatorClient(client_options=client_options)
                logger.info("Google Cloud Vision client initialized with API Key")
            else:
                # Fallback to service account (GOOGLE_APPLICATION_CREDENTIALS)
                self.client = vision.ImageAnnotatorClient()
                logger.info("Google Cloud Vision client initialized with Service Account")
                
        except Exception as e:
            logger.warning(f"Failed to initialize Vision client: {e}")
            logger.warning("Food validation will be disabled (all items will be accepted)")
            self.client = None
    
    async def validate_food_image(self, image_url: str) -> Dict:
        """
        Validate a food image URL.
        
        Args:
            image_url: URL of the image to validate
            
        Returns:
            dict with keys:
                - is_valid: bool
                - reason: str (if invalid)
                - confidence: float (0-1)
                - detected_items: list of detected labels
        """
        if not self.client:
            # Fallback: if Vision API not available, allow all
            logger.warning("Vision API not available, skipping validation")
            return {
                "is_valid": True,
                "reason": "",
                "confidence": 0.0,
                "detected_items": []
            }
        
        try:
            # Analyze image
            image = types.Image()
            image.source.image_uri = image_url
            
            # Run label detection and object localization
            response = await asyncio.to_thread(
                self.client.label_detection,
                image=image
            )
            
            labels = [label.description.lower() for label in response.label_annotations]
            
            # Also get web detection for more context
            web_response = await asyncio.to_thread(
                self.client.web_detection,
                image=image
            )
            
            web_labels = []
            if web_response.web_detection.web_entities:
                web_labels = [
                    entity.description.lower() 
                    for entity in web_response.web_detection.web_entities 
                    if entity.description
                ]
            
            all_labels = list(set(labels + web_labels))
            
            # Validate based on detected labels
            validation_result = self._validate_labels(all_labels)
            validation_result["detected_items"] = all_labels[:10]  # Limit to 10 items
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error validating image {image_url}: {e}")
            # On error, reject to be safe
            return {
                "is_valid": False,
                "reason": "Impossible d'analyser l'image. Veuillez réessayer avec une photo plus claire.",
                "confidence": 0.0,
                "detected_items": []
            }
    
    def _validate_labels(self, labels: List[str]) -> Dict:
        """
        Validate detected labels against allowed/forbidden categories.
        
        Args:
            labels: List of detected labels from Vision API
            
        Returns:
            dict with is_valid, reason, and confidence
        """
        labels_set = set(labels)
        
        # Check for forbidden keywords (strict check)
        forbidden_found = labels_set.intersection(FORBIDDEN_KEYWORDS)
        if forbidden_found:
            # Exception: if "packaged" or "sealed" is also detected, it might be OK
            packaged_found = labels_set.intersection(PACKAGED_KEYWORDS)
            if not packaged_found:
                return {
                    "is_valid": False,
                    "reason": f"Produits interdits détectés : {', '.join(list(forbidden_found)[:3])}. "
                             f"Seuls les produits secs et non périssables sont acceptés.",
                    "confidence": 0.8
                }
        
        # Check for packaged items (good sign)
        packaged_found = labels_set.intersection(PACKAGED_KEYWORDS)
        has_packaging = len(packaged_found) > 0
        
        # Check for allowed categories
        allowed_found = labels_set.intersection(ALLOWED_CATEGORIES)
        
        if has_packaging:
            # If clearly packaged, be more permissive
            return {
                "is_valid": True,
                "reason": "",
                "confidence": 0.85
            }
        elif allowed_found:
            # Allowed food detected
            return {
                "is_valid": True,
                "reason": "",
                "confidence": 0.75
            }
        else:
            # No clear indicators - reject to be safe
            return {
                "is_valid": False,
                "reason": "Impossible de vérifier que ce produit est non périssable. "
                         "Veuillez poster une photo claire d'un produit sec emballé (pâtes, riz, conserves, etc.).",
                "confidence": 0.5
            }


# Singleton instance
_validator = None

def get_validator() -> FoodValidator:
    """Get or create the FoodValidator singleton."""
    global _validator
    if _validator is None:
        _validator = FoodValidator()
    return _validator


async def validate_food_image(image_url: str) -> Dict:
    """
    Convenience function to validate a food image.
    
    Args:
        image_url: URL of the image to validate
        
    Returns:
        Validation result dict
    """
    validator = get_validator()
    return await validator.validate_food_image(image_url)
