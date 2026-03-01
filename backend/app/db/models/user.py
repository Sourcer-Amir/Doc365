from __future__ import annotations

from datetime import datetime

from sqlalchemy import String, DateTime, Boolean, Text, JSON
from sqlalchemy.dialects.mysql import MEDIUMTEXT
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    specialty: Mapped[str | None] = mapped_column(String(255), nullable=True)
    doctor_languages: Mapped[list | None] = mapped_column(JSON, nullable=True)
    expected_salary_range: Mapped[str | None] = mapped_column(String(120), nullable=True)
    offers_online: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    offers_in_person: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    clinic_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    telegram_chat_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    profile_photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    profile_photo_data: Mapped[str | None] = mapped_column(MEDIUMTEXT, nullable=True)
    profile_photo_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
