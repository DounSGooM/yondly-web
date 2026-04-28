"""
Cloudinary Service for Image Uploads
Handles image upload, transformation, and deletion
"""

import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import Optional
import os
import base64
import uuid

# Configure Cloudinary from environment variables
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "diujw5anb"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "248353173982663"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "aAgWkCIz23ac0Oe5TyUhQs_5SNw"),
    secure=True
)


def upload_image(
    image_data: str,
    folder: str = "yondly",
    public_id: Optional[str] = None,
    transformation: Optional[dict] = None
) -> dict:
    """
    Upload an image to Cloudinary
    
    Args:
        image_data: Base64 encoded image or URL
        folder: Cloudinary folder (yondly/items, yondly/profiles, etc.)
        public_id: Optional custom public ID
        transformation: Optional transformations (resize, crop, etc.)
    
    Returns:
        dict with url, public_id, width, height
    """
    try:
        # Handle base64 data
        if image_data.startswith("data:"):
            # Already has data URI prefix
            upload_data = image_data
        elif "://" in image_data:
            # It's a URL
            upload_data = image_data
        else:
            # Raw base64, add prefix
            upload_data = f"data:image/jpeg;base64,{image_data}"

        # Generate public_id if not provided
        if not public_id:
            public_id = f"{folder}/{uuid.uuid4().hex[:12]}"

        # Default transformation for optimization
        default_transformation = {
            "quality": "auto:good",
            "fetch_format": "auto"
        }

        if transformation:
            default_transformation.update(transformation)

        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            upload_data,
            public_id=public_id,
            folder=folder,
            overwrite=True,
            resource_type="image",
            transformation=default_transformation
        )

        return {
            "success": True,
            "url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "width": result.get("width"),
            "height": result.get("height"),
            "format": result.get("format"),
            "bytes": result.get("bytes")
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "url": None
        }


def upload_item_image(image_data: str, item_id: str) -> dict:
    """Upload an item/offer image with optimized settings"""
    return upload_image(
        image_data,
        folder="yondly/items",
        public_id=f"item_{item_id}",
        transformation={
            "width": 800,
            "height": 800,
            "crop": "limit",
            "quality": "auto:good"
        }
    )


def upload_profile_image(image_data: str, user_id: str) -> dict:
    """Upload a user profile photo"""
    return upload_image(
        image_data,
        folder="yondly/profiles",
        public_id=f"profile_{user_id}",
        transformation={
            "width": 400,
            "height": 400,
            "crop": "fill",
            "gravity": "face",
            "quality": "auto:good"
        }
    )


def upload_basket_image(image_data: str, basket_id: str) -> dict:
    """Upload an anti-gaspi basket image"""
    return upload_image(
        image_data,
        folder="yondly/baskets",
        public_id=f"basket_{basket_id}",
        transformation={
            "width": 600,
            "height": 600,
            "crop": "fill",
            "quality": "auto:good"
        }
    )


def upload_document(image_data: str, doc_type: str, user_id: str) -> dict:
    """
    Upload a PRIVATE document (KBIS, ID, etc.) with restricted access.
    Uses authenticated delivery - URLs require signature to access.
    """
    try:
        # Handle base64 data
        if image_data.startswith("data:"):
            upload_data = image_data
        elif "://" in image_data:
            upload_data = image_data
        else:
            upload_data = f"data:image/jpeg;base64,{image_data}"

        public_id = f"{doc_type}_{user_id}_{uuid.uuid4().hex[:6]}"

        # Upload as AUTHENTICATED (private) - requires signed URL to access
        result = cloudinary.uploader.upload(
            upload_data,
            public_id=public_id,
            folder="yondly/documents",
            overwrite=True,
            resource_type="image",
            type="authenticated",  # PRIVATE - requires signed URL
            access_mode="authenticated",
            transformation={"quality": "auto:best"}
        )

        # Generate a signed URL that expires in 24 hours (for admin viewing)
        signed_url = cloudinary.utils.cloudinary_url(
            result.get("public_id"),
            sign_url=True,
            type="authenticated",
            secure=True
        )[0]

        return {
            "success": True,
            "url": signed_url,  # Signed URL (expires)
            "public_id": result.get("public_id"),
            "is_private": True,
            "note": "Document stocké de manière sécurisée (accès restreint)"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "url": None
        }


def get_signed_document_url(public_id: str, expires_in_hours: int = 24) -> str:
    """
    Get a temporary signed URL for a private document.
    Use this when admin needs to view a document.
    """
    import time
    expiration_timestamp = int(time.time()) + (expires_in_hours * 3600)

    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        sign_url=True,
        type="authenticated",
        secure=True,
        expires_at=expiration_timestamp
    )
    return url


def upload_chat_image(image_data: str, chat_id: str) -> dict:
    """Upload a chat message image"""
    return upload_image(
        image_data,
        folder="yondly/chat",
        public_id=f"chat_{chat_id}_{uuid.uuid4().hex[:8]}",
        transformation={
            "width": 1200,
            "height": 1200,
            "crop": "limit",
            "quality": "auto:good"
        }
    )


def delete_image(public_id: str) -> bool:
    """Delete an image from Cloudinary"""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception:
        return False


def get_optimized_url(public_id: str, width: int = 400, height: int = 400) -> str:
    """Get an optimized URL for an existing image"""
    return cloudinary.CloudinaryImage(public_id).build_url(
        width=width,
        height=height,
        crop="fill",
        quality="auto",
        fetch_format="auto"
    )


# Test function
async def test_cloudinary_connection() -> dict:
    """Test if Cloudinary is properly configured"""
    try:
        result = cloudinary.api.ping()
        return {"status": "ok", "message": "Cloudinary connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
