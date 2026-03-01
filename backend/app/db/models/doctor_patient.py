from __future__ import annotations

from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class DoctorPatient(Base):
    __tablename__ = "doctor_patients"
    __table_args__ = (UniqueConstraint("doctor_id", "patient_id", name="uq_doctor_patient"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    doctor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
