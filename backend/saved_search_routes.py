import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import Response

from models import SavedSearch, SavedSearchCreate, PublicList, PublicListCreate
from database import db
from auth_utils import get_current_user
from notifications_routes import create_notification

router = APIRouter(tags=["saved_searches"])


# ── Saved Searches ────────────────────────────────────────────────────────────

@router.post("/saved-searches", response_model=SavedSearch)
async def create_saved_search(search_data: SavedSearchCreate, current_user: dict = Depends(get_current_user)):
    search_dict = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "query": search_data.query,
        "category": search_data.category,
        "filters": search_data.filters,
        "alert_enabled": search_data.alert_enabled,
        "created_at": datetime.utcnow(),
    }
    await db.saved_searches.insert_one(search_dict)
    search_dict.pop("_id", None)
    return SavedSearch(**search_dict)


@router.get("/saved-searches", response_model=List[SavedSearch])
async def get_saved_searches(current_user: dict = Depends(get_current_user)):
    searches = await db.saved_searches.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    for s in searches:
        s.pop("_id", None)
    return searches


@router.delete("/saved-searches/{search_id}")
async def delete_saved_search(search_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.saved_searches.delete_one({"id": search_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Saved search not found")
    return {"message": "Saved search deleted"}


# ── Public Lists ──────────────────────────────────────────────────────────────

@router.post("/public-lists", response_model=PublicList)
async def create_public_list(list_data: PublicListCreate, current_user: dict = Depends(get_current_user)):
    allowed_levels = ["Arbre", "Forêt"]
    if current_user.get("level", "Graine") not in allowed_levels:
        raise HTTPException(status_code=403, detail="Fonctionnalité réservée aux Arbres et Forêts 🌳")

    if current_user.get("level") == "Arbre":
        count = await db.public_lists.count_documents({"user_id": current_user["id"]})
        if count >= 3:
            raise HTTPException(status_code=403, detail="Les Arbres sont limités à 3 listes. Devenez Forêt pour l'illimité !")

    list_dict = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "name": list_data.name,
        "description": list_data.description,
        "item_ids": list_data.item_ids,
        "created_at": datetime.utcnow(),
    }
    await db.public_lists.insert_one(list_dict)
    list_dict.pop("_id", None)
    return PublicList(**list_dict)


@router.get("/public-lists", response_model=List[PublicList])
async def get_public_lists(user_id: Optional[str] = None):
    query = {}
    if user_id:
        query["user_id"] = user_id
    lists = await db.public_lists.find(query).sort("created_at", -1).to_list(100)
    for lst in lists:
        lst.pop("_id", None)
    return lists


@router.get("/public-lists/{list_id}")
async def get_public_list(list_id: str):
    public_list = await db.public_lists.find_one({"id": list_id})
    if not public_list:
        raise HTTPException(status_code=404, detail="List not found")
    public_list.pop("_id", None)

    if public_list.get("item_ids"):
        items = await db.items.find({"id": {"$in": public_list["item_ids"]}}).to_list(len(public_list["item_ids"]))
        for item in items:
            item.pop("_id", None)
        public_list["items"] = items

    return public_list


@router.post("/public-lists/{list_id}/items")
async def add_item_to_public_list(list_id: str, item_data: dict, current_user: dict = Depends(get_current_user)):
    public_list = await db.public_lists.find_one({"id": list_id})
    if not public_list:
        raise HTTPException(status_code=404, detail="List not found")
    if public_list["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    item_id = item_data.get("item_id")
    if not item_id:
        raise HTTPException(status_code=400, detail="Item ID required")

    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item_id in public_list.get("item_ids", []):
        return {"message": "Item already in list"}

    await db.public_lists.update_one({"id": list_id}, {"$push": {"item_ids": item_id}})

    if item["owner_id"] != current_user["id"]:
        await create_notification(
            user_id=item["owner_id"],
            notif_type="list_add",
            title="🌟 Star",
            message=f"Votre article '{item['title']}' a été ajouté à la liste '{public_list['name']}' !",
            data={"list_id": list_id},
        )

    return {"message": "Item added to list"}


@router.delete("/public-lists/{list_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item_from_public_list(
    list_id: str,
    item_id: str,
    current_user: dict = Depends(get_current_user),
):
    public_list = await db.public_lists.find_one({"id": list_id})
    if not public_list:
        raise HTTPException(status_code=404, detail="List not found")
    if public_list["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this list")

    await db.public_lists.update_one(
        {"id": list_id},
        {"$pull": {"item_ids": item_id}, "$set": {"updated_at": datetime.utcnow()}},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/public-lists/{list_id}")
async def delete_public_list(list_id: str, current_user: dict = Depends(get_current_user)):
    public_list = await db.public_lists.find_one({"id": list_id})
    if not public_list:
        raise HTTPException(status_code=404, detail="List not found")
    if public_list["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.public_lists.delete_one({"id": list_id})
    return {"message": "List deleted"}
