from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class VerificationDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    status: str
    rejection_reason: str | None = None
    reviewed_at: datetime | None = None
    uploaded_at: datetime


class VerificationStatusOut(BaseModel):
    is_verified: bool
    verification_status: str
    documents: list[VerificationDocumentOut]
