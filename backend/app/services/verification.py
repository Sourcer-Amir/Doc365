from __future__ import annotations

from datetime import datetime, timezone
from typing import List
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import HTTPException, status

from app.db.models import DoctorVerificationDocument, User


async def create_verification_document(
    session: AsyncSession,
    *,
    doctor_id: str,
    filename: str,
    file_data: str,
    file_type: str,
) -> DoctorVerificationDocument:
    doc = DoctorVerificationDocument(
        id=str(uuid4()),
        doctor_id=doctor_id,
        filename=filename,
        file_data=file_data,
        file_type=file_type,
        status="pending_review",
        uploaded_at=datetime.now(timezone.utc),
    )
    session.add(doc)
    await session.commit()
    await session.refresh(doc)
    return doc


async def list_verification_documents(
    session: AsyncSession,
    doctor_id: str,
) -> List[DoctorVerificationDocument]:
    result = await session.execute(
        select(DoctorVerificationDocument)
        .where(DoctorVerificationDocument.doctor_id == doctor_id)
        .order_by(DoctorVerificationDocument.uploaded_at.desc())
        .limit(50)
    )
    return list(result.scalars().all())


async def list_verification_documents_for_admin(
    session: AsyncSession,
    *,
    status_filter: str | None = "pending_review",
) -> list[tuple[DoctorVerificationDocument, User]]:
    query = (
        select(DoctorVerificationDocument, User)
        .join(User, User.id == DoctorVerificationDocument.doctor_id)
        .where(User.role == "doctor")
        .order_by(DoctorVerificationDocument.uploaded_at.desc())
    )
    if status_filter:
        query = query.where(DoctorVerificationDocument.status == status_filter)

    result = await session.execute(query)
    return list(result.all())


async def review_doctor_verification(
    session: AsyncSession,
    *,
    doctor_id: str,
    approved: bool,
    reviewed_by: str,
    reason: str | None = None,
) -> User:
    user_result = await session.execute(
        select(User).where(User.id == doctor_id, User.role == "doctor")
    )
    doctor = user_result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    docs_result = await session.execute(
        select(DoctorVerificationDocument).where(DoctorVerificationDocument.doctor_id == doctor_id)
    )
    docs = list(docs_result.scalars().all())
    if not docs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor has no verification documents",
        )

    now = datetime.now(timezone.utc)
    new_status = "approved" if approved else "rejected"
    for doc in docs:
        doc.status = new_status
        doc.reviewed_by = reviewed_by
        doc.reviewed_at = now
        doc.rejection_reason = None if approved else (reason or "Rejected by admin")

    doctor.is_verified = approved
    await session.commit()
    await session.refresh(doctor)
    return doctor
