from __future__ import annotations

from datetime import datetime, timezone
from typing import List
from uuid import uuid4

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import DoctorPatient, User


async def add_doctor_patient(
    session: AsyncSession,
    *,
    doctor_id: str,
    patient_id: str,
) -> DoctorPatient:
    existing_result = await session.execute(
        select(DoctorPatient).where(
            DoctorPatient.doctor_id == doctor_id,
            DoctorPatient.patient_id == patient_id,
        )
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        return existing

    row = DoctorPatient(
        id=str(uuid4()),
        doctor_id=doctor_id,
        patient_id=patient_id,
        created_at=datetime.now(timezone.utc),
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


async def remove_doctor_patient(
    session: AsyncSession,
    *,
    doctor_id: str,
    patient_id: str,
) -> None:
    await session.execute(
        delete(DoctorPatient).where(
            DoctorPatient.doctor_id == doctor_id,
            DoctorPatient.patient_id == patient_id,
        )
    )
    await session.commit()


async def list_doctor_patients(
    session: AsyncSession,
    *,
    doctor_id: str,
    limit: int = 100,
) -> List[User]:
    result = await session.execute(
        select(User)
        .join(DoctorPatient, DoctorPatient.patient_id == User.id)
        .where(DoctorPatient.doctor_id == doctor_id)
        .order_by(DoctorPatient.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def list_recent_doctor_patients(
    session: AsyncSession,
    *,
    doctor_id: str,
    limit: int = 5,
) -> List[User]:
    return await list_doctor_patients(session, doctor_id=doctor_id, limit=limit)
