import logging
import os
from dotenv import load_dotenv
from pathlib import Path
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)


async def send_push_notification(user_id: str, title: str, body: str, data: dict = None):
    """Send push notifications via Expo to all tokens registered for the user."""
    try:
        from database import db

        user = await db.users.find_one({"id": user_id})
        if not user:
            logger.warning(f"Push: User {user_id} not found")
            return False

        push_tokens = user.get("push_tokens", [])
        if not push_tokens:
            logger.info(f"Push: No tokens for user {user_id}")
            return False

        async with httpx.AsyncClient() as http_client:
            for token in push_tokens:
                try:
                    payload = {
                        "to": token,
                        "title": title,
                        "body": body,
                        "data": data,
                        "sound": "default"
                    }
                    response = await http_client.post(
                        "https://exp.host/--/api/v2/push/send",
                        json=payload,
                        headers={
                            "Accept": "application/json",
                            "Accept-encoding": "gzip, deflate",
                            "Content-Type": "application/json"
                        }
                    )

                    if response.status_code == 200:
                        res_data = response.json()
                        error_details = (
                            res_data.get("data", {})
                            .get("details", {})
                            .get("error")
                        )
                        if error_details == "DeviceNotRegistered":
                            logger.error(f"Device not registered for token {token}. Removing.")
                            await db.users.update_one(
                                {"id": user_id},
                                {"$pull": {"push_tokens": token}}
                            )
                except Exception as exc:
                    logger.error(f"Push token {token} failed: {exc}")

        logger.info(f"PUSH SENT -> User {user_id}: {title} (Tokens: {len(push_tokens)})")
        return True

    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        return False
