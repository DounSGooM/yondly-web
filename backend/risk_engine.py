from datetime import datetime, timedelta
from models import User, SafetyEvent
import logging

# Trust Level Thresholds
THRESHOLD_TRUSTED = 80
THRESHOLD_BASIC = 50
THRESHOLD_RESTRICTED = 20

async def calculate_risk_score(user: dict, db) -> float:
    """
    Calculate a risk score from 0 (Safe) to 100 (High Risk).
    Note: In DB, 'risk_score' is usually stored as Safe->Risk or Trust? 
    Let's conform to Plan: "risk_score (0-100)".
    Plan said: >=70 -> step-up. So High Score = High Risk.
    """
    score = 0
    
    # 1. Account Age (New accounts are riskier)
    created_at = user.get('created_at')
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    
    age_days = (datetime.utcnow() - created_at).days
    if age_days < 1:
        score += 30
    elif age_days < 7:
        score += 15
    elif age_days < 30:
        score += 5

    # 2. Verification Status
    if not user.get('verified_email'):
        score += 20
    if not user.get('verified_phone'):
        score += 20
    
    # 3. Safety Events (Previous blocks, no-shows)
    # Fetch recent safety events
    recent_events = await db.safety_events.find({
        "user_id": user['id'],
        "created_at": {"$gte": datetime.utcnow() - timedelta(days=30)}
    }).to_list(100)
    
    for event in recent_events:
        severity = event.get('severity', 'low')
        if severity == 'high':
            score += 50
        elif severity == 'medium':
            score += 20
        else:
            score += 5

    # 4. Velocity Check (Rapid listings/messages)
    # (Simplified: assumes caller might pass flags or we query DB)
    # For MVP, we rely on SafetyEvents triggering mostly.

    # Cap score at 100
    return min(float(score), 100.0)

async def update_user_trust_level(user_id: str, db):
    """
    Recalculate risk score and update trust level.
    """
    user = await db.users.find_one({"id": user_id})
    if not user:
        return
        
    risk_score = await calculate_risk_score(user, db)
    
    # Determine Trust Level based on Risk Score
    # Lower Risk = Higher Trust
    # Risk >= 70 -> RESTRICTED (or BANNED if very high)
    # Risk 50-69 -> NEW / BASIC (Limits)
    # Risk < 50 -> TRUSTED (if verified)
    
    current_level = user.get('trust_level', 'NEW')
    new_level = current_level
    
    if risk_score >= 80:
        new_level = 'BANNED'
    elif risk_score >= 60:
        new_level = 'RESTRICTED'
    elif risk_score >= 40:
        # High risk for a basic user
        if current_level == 'TRUSTED':
            new_level = 'BASIC_VERIFIED'
        else:
            new_level = 'NEW'
    else:
        # Low risk
        if user.get('verified_email') and user.get('verified_phone'):
            new_level = 'TRUSTED'
        elif user.get('verified_email'):
            new_level = 'BASIC_VERIFIED'
        else:
            new_level = 'NEW'
            
    # Apply update if changed
    if new_level != current_level or risk_score != user.get('risk_score'):
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"trust_level": new_level, "risk_score": risk_score}}
        )
        # Log if restriction applied
        if new_level in ['RESTRICTED', 'BANNED'] and current_level not in ['RESTRICTED', 'BANNED']:
             logging.warning(f"User {user_id} restricted due to risk score {risk_score}")

    return {"risk_score": risk_score, "trust_level": new_level}
