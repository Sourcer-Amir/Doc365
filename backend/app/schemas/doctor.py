from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, model_validator

from app.schemas.document import DocumentListOut
from app.schemas.profile import PatientProfileOut
from app.schemas.users import DoctorLanguage, UserOut


class DoctorAnalyticsOut(BaseModel):
    profile_views: int
    total_patients: int
    total_chats: int
    monthly_views: dict[str, int]
    recent_patients: list[UserOut]
    avg_rating: float | None = None
    rating_count: int = 0


class DoctorPatientHistoryOut(BaseModel):
    patient: UserOut
    profile: PatientProfileOut | None
    documents: list[DocumentListOut]


class DoctorProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: str
    specialty: Optional[str] = None
    doctor_languages: Optional[list[DoctorLanguage]] = None
    expected_salary_range: Optional[str] = None
    offers_online: bool = False
    offers_in_person: bool = False
    telegram_chat_id: Optional[str] = None
    clinic_address: Optional[str] = None
    phone: Optional[str] = None
    profile_photo_url: Optional[str] = None
    bio: Optional[str] = None
    is_verified: bool = False


class DoctorProfileUpdate(BaseModel):
    doctor_languages: Optional[list[DoctorLanguage]] = None
    expected_salary_range: Optional[str] = None
    offers_online: Optional[bool] = None
    offers_in_person: Optional[bool] = None
    telegram_chat_id: Optional[str] = None
    clinic_address: Optional[str] = None
    phone: Optional[str] = None
    profile_photo_url: Optional[str] = None
    bio: Optional[str] = None

    @model_validator(mode="after")
    def validate_modalities(self) -> "DoctorProfileUpdate":
        if self.offers_online is False and self.offers_in_person is False:
            raise ValueError("At least one consultation mode is required")
        return self
