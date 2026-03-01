from __future__ import annotations

from datetime import datetime

from sqlalchemy import String, Integer, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class DoctorRating(Base):
    __tablename__ = "doctor_ratings"
    __table_args__ = (UniqueConstraint("doctor_id", "patient_id", name="uq_doctor_patient_rating"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    doctor_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
