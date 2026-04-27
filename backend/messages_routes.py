from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import uuid

from models import MessageCreate
from database import db
from auth_utils import get_current_user
from chat_security import check_message_content
from risk_engine import update_user_trust_level

router = APIRouter(tags=["messages"])


@router.post("/messages")
async def create_message(msg_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    is_suspicious, cleaned_text, reason = check_message_content(msg_data.text)

    if is_suspicious:
        await db.safety_events.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "event_type": "CONTACT_BLOCKED",
            "severity": "medium",
            "metadata": {"original_text": msg_data.text, "reason": reason},
            "created_at": datetime.utcnow(),
        })
        await update_user_trust_level(current_user["id"], db)

    msg_dict = {
        "id": str(uuid.uuid4()),
        "item_id": msg_data.item_id,
        "from_id": current_user["id"],
        "to_id": msg_data.to_id,
        "text": cleaned_text,
        "created_at": datetime.utcnow(),
    }

    await db.messages.insert_one(msg_dict)
    msg_dict.pop("_id", None)
    return msg_dict


@router.get("/messages/user")
async def get_user_messages(current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [{"from_id": current_user["id"]}, {"to_id": current_user["id"]}],
        "deleted_by": {"$ne": current_user["id"]},
    }).sort("created_at", -1).to_list(1000)

    for msg in messages:
        msg.pop("_id", None)
    return messages


@router.get("/messages/item/{item_id}")
async def get_item_messages(item_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "item_id": item_id,
        "$or": [{"from_id": current_user["id"]}, {"to_id": current_user["id"]}],
    }).sort("created_at", 1).to_list(1000)

    for msg in messages:
        msg.pop("_id", None)
    return messages


@router.put("/messages/mark-read/{item_id}")
async def mark_messages_as_read(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.messages.update_many(
        {
            "item_id": item_id,
            "to_id": current_user["id"],
            "read_by": {"$ne": current_user["id"]},
        },
        {"$addToSet": {"read_by": current_user["id"]}},
    )
    return {"message": f"{result.modified_count} messages marked as read"}


@router.delete("/messages/conversation/{item_id}")
async def delete_conversation(
    item_id: str,
    delete_for_all: bool = False,
    current_user: dict = Depends(get_current_user),
):
    if delete_for_all:
        item = await db.items.find_one({"id": item_id})
        if not item or item["owner_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only item owner can delete conversation for all parties")
        result = await db.messages.delete_many({"item_id": item_id})
        return {"message": f"Conversation deleted for all parties ({result.deleted_count} messages)"}

    result = await db.messages.update_many(
        {
            "item_id": item_id,
            "$or": [{"from_id": current_user["id"]}, {"to_id": current_user["id"]}],
            "deleted_by": {"$ne": current_user["id"]},
        },
        {"$addToSet": {"deleted_by": current_user["id"]}},
    )
    return {"message": f"Conversation hidden for you ({result.modified_count} messages)"}
