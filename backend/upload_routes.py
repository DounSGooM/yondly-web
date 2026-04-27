import base64
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, File, UploadFile

router = APIRouter(tags=["upload"])

_ROOT_DIR = Path(__file__).parent


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "items",
):
    try:
        from cloudinary_service import upload_image

        content = await file.read()
        content_type = file.content_type or "image/jpeg"
        data_uri = f"data:{content_type};base64,{base64.b64encode(content).decode('utf-8')}"

        result = upload_image(image_data=data_uri, folder=f"yondly/{folder}")

        if result.get("success"):
            return {
                "url": result["url"],
                "public_id": result.get("public_id"),
                "width": result.get("width"),
                "height": result.get("height"),
            }

        # Fallback to local storage
        file_ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
        filename = f"{uuid.uuid4()}.{file_ext}"
        uploads_dir = _ROOT_DIR / "uploads"
        uploads_dir.mkdir(exist_ok=True)
        with open(uploads_dir / filename, "wb") as buf:
            buf.write(content)

        return {"url": f"/uploads/{filename}", "fallback": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")
