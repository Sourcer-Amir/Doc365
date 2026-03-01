from __future__ import annotations

from datetime import datetime

from sqlalchemy import String, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    sender_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    recipient_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chat_type: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    sender_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_ai: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
