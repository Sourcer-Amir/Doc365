from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import PatientProfile
from app.schemas.profile import PatientProfileUpdate


def _normalize_languages(values: list[str] | None) -> list[str]:
    if not values:
        return []
    cleaned = [value.strip() for value in values if value and value.strip()]
    return list(dict.fromkeys(cleaned))


async def get_or_create_profile(session: AsyncSession, user_id: str) -> PatientProfile:
    result = await session.execute(
        select(PatientProfile).where(PatientProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if profile:
        if profile.languages is None:
            profile.languages = []
            await session.commit()
            await session.refresh(profile)
        return profile

    profile = PatientProfile(
        user_id=user_id,
        blood_type=None,
        languages=[],
        allergies=[],
        chronic_conditions=[],
        current_medications=[],
        medical_history=[],
        emergency_contact=None,
    )
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


async def update_profile(
    session: AsyncSession,
    user_id: str,
    update: PatientProfileUpdate,
) -> PatientProfile:
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data to update")

    result = await session.execute(
        select(PatientProfile).where(PatientProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        profile = PatientProfile(
            user_id=user_id,
            languages=[],
            allergies=[],
            chronic_conditions=[],
            current_medications=[],
            medical_history=[],
        )
        session.add(profile)

    for key, value in data.items():
        if key == "languages":
            value = _normalize_languages(value)
        setattr(profile, key, value)

    if profile.languages is None:
        profile.languages = []

    await session.commit()
    await session.refresh(profile)
    return profile
