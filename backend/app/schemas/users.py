from __future__ import annotations

from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class DoctorLanguage(BaseModel):
    language: str
    level: Literal["principiante", "medio", "avanzado"]

    @field_validator("language")
    @classmethod
    def validate_language(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Language cannot be empty")
        return cleaned


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Literal["patient", "doctor"]
    specialty: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    doctor_languages: Optional[list[DoctorLanguage]] = None
    expected_salary_range: Optional[str] = None
    offers_online: Optional[bool] = True
    offers_in_person: Optional[bool] = False
    patient_languages: Optional[list[str]] = None

    @field_validator("patient_languages")
    @classmethod
    def validate_patient_languages(cls, value: Optional[list[str]]) -> Optional[list[str]]:
        if value is None:
            return value
        cleaned = [item.strip() for item in value if item and item.strip()]
        # Preserve insertion order and remove duplicates.
        return list(dict.fromkeys(cleaned))


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
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
    ai_consent: bool = False
    email_verified: bool = True
    created_at: datetime


class DoctorSearchOut(UserOut):
    is_verified: bool = False
    profile_views: int = 0
    total_patients: int = 0
    avg_response_minutes: Optional[int] = None
    avg_rating: Optional[float] = None
    rating_count: int = 0


class PublicDoctorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    specialty: Optional[str] = None
    doctor_languages: Optional[list[DoctorLanguage]] = None
    expected_salary_range: Optional[str] = None
    offers_online: bool = False
    offers_in_person: bool = False
    profile_photo_url: Optional[str] = None
    is_verified: bool = False
    profile_views: int = 0
    total_patients: int = 0
    avg_response_minutes: Optional[int] = None
    avg_rating: Optional[float] = None
    rating_count: int = 0


class DoctorDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: str
    specialty: Optional[str] = None
    doctor_languages: Optional[list[DoctorLanguage]] = None
    expected_salary_range: Optional[str] = None
    offers_online: bool = False
    offers_in_person: bool = False
    clinic_address: Optional[str] = None
    phone: Optional[str] = None
    profile_photo_url: Optional[str] = None
    bio: Optional[str] = None
    is_verified: bool = False
    avg_response_minutes: Optional[int] = None
    avg_rating: Optional[float] = None
    rating_count: int = 0


class DoctorRatingIn(BaseModel):
    rating: int


class DoctorRatingOut(BaseModel):
    avg_rating: Optional[float] = None
    rating_count: int = 0


class AIConsentUpdate(BaseModel):
    ai_consent: bool


class AIConsentOut(BaseModel):
    ai_consent: bool


class TelegramLinkUpdate(BaseModel):
    telegram_chat_id: Optional[str] = None


class TelegramConnectUrlOut(BaseModel):
    connect_url: str
    connected: bool


class TelegramStatusOut(BaseModel):
    connected: bool
