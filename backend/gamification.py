from database import db


async def check_and_update_level(user_id: str, db) -> dict:
    """
    Check if user qualifies for a new level based on CO2 saved.
    - Graine:  0 - 100 kg
    - Pousse:  100 - 500 kg
    - Arbre:   500 - 2500 kg
    - Forêt:   > 2500 kg
    """
    user = await db.users.find_one({"id": user_id})
    if not user:
        return None

    if user.get("is_level_manual", False):
        lvl = user.get("level", "Graine")
        return {"old_level": lvl, "new_level": lvl, "level_up": False}

    co2 = user.get("co2_saved", 0)

    new_level = "Graine"
    if co2 >= 2500:
        new_level = "Forêt"
    elif co2 >= 500:
        new_level = "Arbre"
    elif co2 >= 100:
        new_level = "Pousse"

    old_level = user.get("level", "Graine")
    level_order = {"Graine": 0, "Pousse": 1, "Arbre": 2, "Forêt": 3}

    if level_order.get(new_level, 0) > level_order.get(old_level, 0):
        await db.users.update_one({"id": user_id}, {"$set": {"level": new_level}})
        return {"old_level": old_level, "new_level": new_level, "level_up": True}

    return {"old_level": old_level, "new_level": old_level, "level_up": False}


async def award_points(user_id: str, amount: int):
    """Legacy points system — activity tracking, kept for backward compatibility."""
    user = await db.users.find_one({"id": user_id})
    if not user:
        return None

    new_points = user.get("points", 0) + amount
    await db.users.update_one({"id": user_id}, {"$set": {"points": new_points}})
    return {"points_added": amount, "new_total": new_points}
