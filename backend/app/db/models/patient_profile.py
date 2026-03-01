from __future__ import annotations

from sqlalchemy import JSON, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    blood_type: Mapped[str | None] = mapped_column(String(8), nullable=True)
    languages: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    allergies: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    chronic_conditions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    current_medications: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    medical_history: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    emergency_contact: Mapped[dict | None] = mapped_column(JSON, nullable=True)
