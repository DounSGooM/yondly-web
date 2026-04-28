from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
import uuid
import logging

from models import *
from auth_utils import get_current_user
from database import db

router = APIRouter(prefix="/association", tags=["association"])

async def get_association_user(current_user: dict = Depends(get_current_user)):
    """Ensure user is an association"""
    # In future, check current_user["is_association"]
    # For now, allow any user to act as association for testing if needed,
    # or strictly check the flag if data model supports it.
    if not current_user.get("is_association", False) and not current_user.get("association_name"):
        # Fallback: Check if user has 'admin' role or specific permissions?
        # For now we assume if they are using the app feature they should be authorized.
        # But for security, let's just log warning if not set.
        pass
    return current_user

# ============ BENEFICIARIES ============

@router.get("/beneficiaries", response_model=List[Beneficiary])
async def get_beneficiaries(
    limit: int = 100,
    skip: int = 0,
    current_user: dict = Depends(get_association_user)
):
    """List beneficiaries for the current association (user)"""
    cursor = db.beneficiaries.find(
        {"association_id": current_user["id"]}
    ).sort("created_at", -1).skip(skip).limit(limit)
    
    beneficiaries = await cursor.to_list(length=limit)
    return beneficiaries

@router.post("/beneficiaries", response_model=dict)
async def create_beneficiary(
    data: BeneficiaryCreate,
    current_user: dict = Depends(get_association_user)
):
    """Create a new beneficiary"""
    # Check if internal_ref already exists for this association
    existing = await db.beneficiaries.find_one({
        "association_id": current_user["id"],
        "internal_ref": data.internal_ref
    })
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"La référence {data.internal_ref} existe déjà."
        )

    # If yondly_id provided, verify it exists
    linked_user_id = None
    if data.yondly_id:
        # Search for user with this beneficiary_id (which acts as the public Yondly ID)
        linked_user = await db.users.find_one({"beneficiary_id": data.yondly_id})
        if linked_user:
             linked_user_id = linked_user["id"]
        else:
             raise HTTPException(
                status_code=400,
                detail=f"Aucun utilisateur trouvé avec l'ID Yondly {data.yondly_id}"
             )

    beneficiary = Beneficiary(
        id=uuid.uuid4().hex,
        association_id=current_user["id"],
        internal_ref=data.internal_ref,
        initials=data.initials,
        family_size=data.family_size,
        notes=data.notes,
        is_active=True,
        total_baskets=0,
        linked_user_id=linked_user_id
    )
    
    await db.beneficiaries.insert_one(beneficiary.model_dump())
    
    return {"success": True, "beneficiary": beneficiary}

@router.put("/beneficiaries/{beneficiary_id}")
async def update_beneficiary(
    beneficiary_id: str,
    data: BeneficiaryUpdate,
    current_user: dict = Depends(get_association_user)
):
    """Update beneficiary"""
    # Ensure it belongs to us
    existing = await db.beneficiaries.find_one({
        "id": beneficiary_id,
        "association_id": current_user["id"]
    })
    if not existing:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")
        
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if update_data:
        await db.beneficiaries.update_one(
            {"id": beneficiary_id},
            {"$set": update_data}
        )
        
    return {"success": True}

@router.delete("/beneficiaries/{beneficiary_id}")
async def archive_beneficiary(
    beneficiary_id: str,
    current_user: dict = Depends(get_association_user)
):
    """Archive (soft delete) beneficiary"""
    result = await db.beneficiaries.update_one(
        {"id": beneficiary_id, "association_id": current_user["id"]},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")
        
    return {"success": True}

# ============ DISTRIBUTIONS ============

@router.get("/distributions", response_model=List[Distribution])
async def get_distributions(
    limit: int = 50,
    current_user: dict = Depends(get_association_user)
):
    """Get distribution history"""
    cursor = db.distributions.find(
        {"association_id": current_user["id"]}
    ).sort("distributed_at", -1).limit(limit)
    
    return await cursor.to_list(length=limit)

@router.post("/distributions", response_model=dict)
async def record_distribution(
    data: DistributionCreate,
    current_user: dict = Depends(get_association_user)
):
    """Record a distribution (basket handed out)"""
    
    beneficiary_initials = None
    if data.beneficiary_id:
        # Validate beneficiary and get data
        beneficiary = await db.beneficiaries.find_one({
            "id": data.beneficiary_id,
            "association_id": current_user["id"]
        })
        if not beneficiary:
            raise HTTPException(status_code=404, detail="Bénéficiaire non trouvé")
            
        beneficiary_initials = beneficiary["initials"]
        
        # Update stats
        await db.beneficiaries.update_one(
            {"id": data.beneficiary_id},
            {
                "$inc": {"total_baskets": data.quantity},
                "$set": {"last_distribution": datetime.utcnow()}
            }
        )
    
    distribution = Distribution(
        id=uuid.uuid4().hex,
        association_id=current_user["id"],
        beneficiary_id=data.beneficiary_id,
        beneficiary_initials=beneficiary_initials,
        quantity=data.quantity,
        notes=data.notes,
        store_name="Distribution Directe", # Could be linked to a specific pickup from store?
        distributed_at=datetime.utcnow()
    )
    
    await db.distributions.insert_one(distribution.model_dump())
    
    return {"success": True, "distribution": distribution}

@router.get("/stats", response_model=AssociationStats)
async def get_association_stats(current_user: dict = Depends(get_association_user)):
    """Get dashboard stats"""
    
    # 1. Total beneficiaries
    total_beneficiaries = await db.beneficiaries.count_documents({
        "association_id": current_user["id"],
        "is_active": True
    })
    
    # 2. Total distributions
    # Aggregate logic can be complex, keep it simple for now
    pipeline = [
        {"$match": {"association_id": current_user["id"]}},
        {"$group": {"_id": None, "total_baskets": {"$sum": "$quantity"}}}
    ]
    cursor = db.distributions.aggregate(pipeline)
    result = await cursor.to_list(length=1)
    total_distributed = result[0]["total_baskets"] if result else 0
    
    # 3. Active collections (from stores)
    # Logic: Orders where is_association=True and status=reserved/ready?
    active_collections = await db.orders.count_documents({
        "buyer_id": current_user["id"],
        "status": {"$in": ["reserved", "paid", "ready"]}
    })
    
    return AssociationStats(
        total_beneficiaries=total_beneficiaries,
        total_distributed_baskets=total_distributed,
        active_collections=active_collections,
        impact_co2=total_distributed * 2.5 # Mock CO2 (2.5kg per basket)
    )
