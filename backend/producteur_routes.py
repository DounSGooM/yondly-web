"""
Producteur Local Routes
Module PAT - Profils producteurs, produits de saison, impact local
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from datetime import datetime
import uuid

from pydantic import BaseModel


# ─── Modèles Pydantic ─────────────────────────────────────────────────────────

class ProduitCreate(BaseModel):
    nom: str
    disponible: bool = True
    saison: Optional[str] = None
    prix_unitaire: Optional[int] = None  # centimes
    unite: Optional[str] = None          # "kg", "botte", "pièce"


class ProducteurCreate(BaseModel):
    nom: str
    type_production: str               # "Maraîchage", "Élevage", etc.
    description: Optional[str] = None
    adresse: str
    ville: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    certifications: Optional[List[str]] = []   # ["bio", "hve", ...]
    rayon_km: Optional[int] = None
    pat_partenaire: Optional[bool] = False


# ─── Factory ──────────────────────────────────────────────────────────────────

def create_producteur_routes(db, get_current_user_func):
    """Factory function - même pattern que create_pro_routes"""

    router = APIRouter(prefix="/api/producteurs", tags=["producteurs"])

    # ── Liste des producteurs ────────────────────────────────────────────────

    @router.get("/")
    async def list_producteurs(
        ville: Optional[str] = None,
        certification: Optional[str] = None,
        pat_partenaire: Optional[bool] = None,
        limit: int = 20,
        offset: int = 0,
    ):
        """Liste publique des producteurs, filtrable"""
        query = {}
        if ville:
            query["ville"] = {"$regex": ville, "$options": "i"}
        if certification:
            query["certifications"] = certification
        if pat_partenaire is not None:
            query["pat_partenaire"] = pat_partenaire

        producteurs = await db.producteurs.find(query).skip(offset).limit(limit).to_list(limit)
        for p in producteurs:
            p.pop("_id", None)
        return producteurs

    # ── Détail d'un producteur ───────────────────────────────────────────────

    @router.get("/{producteur_id}")
    async def get_producteur(producteur_id: str):
        """Profil public d'un producteur avec ses produits"""
        producteur = await db.producteurs.find_one({"id": producteur_id})
        if not producteur:
            raise HTTPException(status_code=404, detail="Producteur introuvable")

        producteur.pop("_id", None)

        # Récupérer les produits associés
        produits = await db.producteur_produits.find(
            {"producteur_id": producteur_id}
        ).to_list(50)
        for p in produits:
            p.pop("_id", None)

        producteur["produits"] = produits

        # Calculer les stats de suivi
        followers_count = await db.producteur_follows.count_documents(
            {"producteur_id": producteur_id}
        )
        producteur["followers_count"] = followers_count

        return producteur

    # ── Créer / mettre à jour son profil producteur ──────────────────────────

    @router.post("/")
    async def create_producteur(
        data: ProducteurCreate,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Créer un profil producteur (utilisateur connecté)"""
        now = datetime.utcnow()

        existing = await db.producteurs.find_one({"user_id": current_user["id"]})
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Vous avez déjà un profil producteur. Utilisez PUT pour le modifier."
            )

        producteur = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            **data.dict(),
            "kg_vendus_local": 0,
            "co2_economise_kg": 0,
            "created_at": now,
            "updated_at": now,
        }
        await db.producteurs.insert_one(producteur)
        producteur.pop("_id", None)
        return producteur

    @router.put("/{producteur_id}")
    async def update_producteur(
        producteur_id: str,
        data: ProducteurCreate,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Mettre à jour son profil producteur"""
        producteur = await db.producteurs.find_one({"id": producteur_id})
        if not producteur:
            raise HTTPException(status_code=404, detail="Producteur introuvable")
        if producteur["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Non autorisé")

        await db.producteurs.update_one(
            {"id": producteur_id},
            {"$set": {**data.dict(), "updated_at": datetime.utcnow()}}
        )
        return {"message": "Profil mis à jour"}

    # ── Produits d'un producteur ─────────────────────────────────────────────

    @router.post("/{producteur_id}/produits")
    async def add_produit(
        producteur_id: str,
        data: ProduitCreate,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Ajouter un produit au profil producteur"""
        producteur = await db.producteurs.find_one({"id": producteur_id})
        if not producteur:
            raise HTTPException(status_code=404, detail="Producteur introuvable")
        if producteur["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Non autorisé")

        produit = {
            "id": str(uuid.uuid4()),
            "producteur_id": producteur_id,
            **data.dict(),
            "created_at": datetime.utcnow(),
        }
        await db.producteur_produits.insert_one(produit)
        produit.pop("_id", None)
        return produit

    @router.delete("/{producteur_id}/produits/{produit_id}")
    async def delete_produit(
        producteur_id: str,
        produit_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Supprimer un produit"""
        producteur = await db.producteurs.find_one({"id": producteur_id})
        if not producteur or producteur["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Non autorisé")

        await db.producteur_produits.delete_one({"id": produit_id, "producteur_id": producteur_id})
        return {"message": "Produit supprimé"}

    # ── Suivi (follow) ───────────────────────────────────────────────────────

    @router.get("/{producteur_id}/status")
    async def get_follow_status(
        producteur_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Vérifie si l'utilisateur suit ce producteur"""
        follow = await db.producteur_follows.find_one({
            "producteur_id": producteur_id,
            "user_id": current_user["id"]
        })
        return {"is_following": follow is not None}

    @router.post("/{producteur_id}/follow")
    async def follow_producteur(
        producteur_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Suivre un producteur"""
        existing = await db.producteur_follows.find_one({
            "producteur_id": producteur_id,
            "user_id": current_user["id"]
        })
        if existing:
            return {"message": "Déjà abonné"}

        await db.producteur_follows.insert_one({
            "id": str(uuid.uuid4()),
            "producteur_id": producteur_id,
            "user_id": current_user["id"],
            "created_at": datetime.utcnow(),
        })
        return {"message": "Abonné"}

    @router.delete("/{producteur_id}/follow")
    async def unfollow_producteur(
        producteur_id: str,
        current_user: dict = Depends(get_current_user_func)
    ):
        """Se désabonner d'un producteur"""
        await db.producteur_follows.delete_one({
            "producteur_id": producteur_id,
            "user_id": current_user["id"]
        })
        return {"message": "Désabonné"}

    # ── Impact PAT (agrégats pour les collectivités) ─────────────────────────

    @router.get("/impact/territoire")
    async def get_impact_territoire(ville: Optional[str] = None):
        """
        Stats agrégées pour le dashboard PAT des collectivités.
        Données anonymisées : kg vendus localement, CO2 économisé, nb producteurs actifs.
        """
        query = {}
        if ville:
            query["ville"] = {"$regex": ville, "$options": "i"}

        producteurs = await db.producteurs.find(query).to_list(1000)

        total_kg = sum(p.get("kg_vendus_local", 0) for p in producteurs)
        total_co2 = sum(p.get("co2_economise_kg", 0) for p in producteurs)
        nb_pat = sum(1 for p in producteurs if p.get("pat_partenaire"))
        nb_total = len(producteurs)

        certifications_count: dict = {}
        for p in producteurs:
            for cert in p.get("certifications", []):
                certifications_count[cert] = certifications_count.get(cert, 0) + 1

        return {
            "nb_producteurs": nb_total,
            "nb_pat_partenaires": nb_pat,
            "kg_vendus_local_total": total_kg,
            "co2_economise_kg_total": total_co2,
            "certifications": certifications_count,
        }

    return router
