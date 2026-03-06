from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal
from datetime import datetime
import uuid


def generate_id() -> str:
    return str(uuid.uuid4())


def get_current_time() -> datetime:
    return datetime.utcnow()


# ============ WAITLIST MODELS ============

class WaitlistCreate(BaseModel):
    email: EmailStr
    city: Optional[str] = None
    status: Literal["particulier", "pro", "association"] = "particulier"
    comment: Optional[str] = None
    rgpd_consent: bool

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "city": "Lyon",
                "status": "particulier",
                "comment": "Hâte de tester !",
                "rgpd_consent": True
            }
        }


class WaitlistEntry(BaseModel):
    id: str = Field(default_factory=generate_id)
    email: EmailStr
    city: Optional[str] = None
    status: str = "particulier"
    comment: Optional[str] = None
    rgpd_consent: bool = True
    created_at: datetime = Field(default_factory=get_current_time)


# ============ PARTNER MODELS ============

class PartnerCreate(BaseModel):
    type: Literal["pro", "association"]
    name: str  # Business name for pro, Association name for association
    contact_name: Optional[str] = None  # Required for associations
    business: Optional[str] = None  # Activity type for pros
    city: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    website: Optional[str] = None  # For associations
    message: Optional[str] = None
    rgpd_consent: bool

    class Config:
        json_schema_extra = {
            "example": {
                "type": "pro",
                "name": "Boulangerie Martin",
                "business": "Boulangerie",
                "city": "Lyon",
                "email": "contact@boulangerie-martin.fr",
                "phone": "0612345678",
                "message": "Intéressé par la vente locale",
                "rgpd_consent": True
            }
        }


class PartnerEntry(BaseModel):
    id: str = Field(default_factory=generate_id)
    type: str
    name: str
    contact_name: Optional[str] = None
    business: Optional[str] = None
    city: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    website: Optional[str] = None
    message: Optional[str] = None
    rgpd_consent: bool = True
    created_at: datetime = Field(default_factory=get_current_time)


# ============ CONTACT MODELS ============

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    subject: Optional[str] = None
    message: str
    rgpd_consent: bool

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Jean Dupont",
                "email": "jean@example.com",
                "subject": "Question sur la bêta",
                "message": "Bonjour, quand sera disponible la bêta dans ma ville ?",
                "rgpd_consent": True
            }
        }


class ContactEntry(BaseModel):
    id: str = Field(default_factory=generate_id)
    name: str
    email: EmailStr
    subject: Optional[str] = None
    message: str
    rgpd_consent: bool = True
    created_at: datetime = Field(default_factory=get_current_time)
