from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


class PatientProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    blood_type: Optional[str] = None
    languages: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    chronic_conditions: List[str] = Field(default_factory=list)
    current_medications: List[dict] = Field(default_factory=list)
    medical_history: List[dict] = Field(default_factory=list)
    emergency_contact: Optional[dict] = None


class PatientProfileUpdate(BaseModel):
    blood_type: Optional[str] = None
    languages: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None
    current_medications: Optional[List[dict]] = None
    medical_history: Optional[List[dict]] = None
    emergency_contact: Optional[dict] = None
