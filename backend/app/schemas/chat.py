from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ChatMessageCreate(BaseModel):
    content: str
    recipient_id: Optional[str] = None
    chat_type: str


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sender_id: str
    recipient_id: Optional[str] = None
    content: str
    chat_type: str
    timestamp: datetime
    sender_name: str
