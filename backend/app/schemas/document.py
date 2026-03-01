from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    filename: str
    file_data: str
    file_type: str
    uploaded_at: datetime


class DocumentListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    filename: str
    file_type: str
    uploaded_at: datetime


class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    uploaded_at: datetime
