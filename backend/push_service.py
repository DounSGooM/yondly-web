import logging

logger = logging.getLogger(__name__)

async def send_push_notification(user_id: str, title: str, body: str, data: dict = None):
    """
    Mock service to send push notifications via Expo.
    In a real app, this would use expo-server-sdk-python to send notifications 
    to tokens stored in the user profile.
    """
    try:
        # In a real implementation:
        # 1. Get user's push tokens from DB
        # user = await db.users.find_one({"id": user_id})
        # tokens = user.get("push_tokens", [])
        
        # 2. Send via Expo SDK
        # for token in tokens:
        #     PushClient().publish(PushMessage(to=token, title=title, body=body, data=data))
        
        logger.info(f"PUSH NOTIFICATION [Mock] -> User {user_id}: {title} - {body} | Data: {data}")
        return True
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        return False
