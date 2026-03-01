from __future__ import annotations

from typing import List
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select, delete, distinct, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    hash_password,
    verify_password,
    password_meets_policy,
    PASSWORD_POLICY_MESSAGE,
)
from app.db.models import (
    User,
    PatientProfile,
    ChatMessage,
    Recommendation,
    Document,
    DoctorRating,
    AccountVerificationCode,
)
from app.schemas.doctor import DoctorProfileUpdate
from app.schemas.users import UserRegister


def _clean_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _normalize_patient_languages(values: list[str] | None) -> list[str]:
    if not values:
        return []
    cleaned = [value.strip() for value in values if value and value.strip()]
    return list(dict.fromkeys(cleaned))


def _normalize_doctor_languages(values: list[dict] | None) -> list[dict]:
    if not values:
        return []

    normalized: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for item in values:
        language = str(item.get("language", "")).strip()
        level = str(item.get("level", "")).strip().lower()
        if not language:
            continue
        if level not in {"principiante", "medio", "avanzado"}:
            continue
        key = (language.lower(), level)
        if key in seen:
            continue
        seen.add(key)
        normalized.append({"language": language, "level": level})
    return normalized


def _validate_consultation_modes(*, online: bool, in_person: bool) -> None:
    if not online and not in_person:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor must select online and/or in-person consultation",
        )


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: str) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def authenticate_user(session: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(session, email)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return user


async def create_user(session: AsyncSession, user_data: UserRegister) -> User:
    if user_data.role not in {"patient", "doctor"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    if not password_meets_policy(user_data.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=PASSWORD_POLICY_MESSAGE)

    existing = await get_user_by_email(session, user_data.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    doctor_languages = _normalize_doctor_languages(
        [entry.model_dump() for entry in (user_data.doctor_languages or [])]
    )
    expected_salary_range = _clean_optional_text(user_data.expected_salary_range)
    offers_online = bool(user_data.offers_online) if user_data.offers_online is not None else True
    offers_in_person = bool(user_data.offers_in_person) if user_data.offers_in_person is not None else False
    patient_languages = _normalize_patient_languages(user_data.patient_languages)

    if user_data.role == "doctor":
        _validate_consultation_modes(online=offers_online, in_person=offers_in_person)

    user_id = str(uuid4())
    user = User(
        id=user_id,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        specialty=_clean_optional_text(user_data.specialty) if user_data.role == "doctor" else None,
        doctor_languages=doctor_languages if user_data.role == "doctor" else [],
        expected_salary_range=expected_salary_range if user_data.role == "doctor" else None,
        offers_online=offers_online if user_data.role == "doctor" else False,
        offers_in_person=offers_in_person if user_data.role == "doctor" else False,
        telegram_chat_id=user_data.telegram_chat_id,
        ai_consent=False,
        is_verified=False,
        email_verified=True,
    )

    session.add(user)
    # Ensure the user row is flushed before inserting the dependent profile row.
    # This avoids FK violations on some MySQL configurations.
    await session.flush()

    if user_data.role == "patient":
        profile = PatientProfile(
            user_id=user_id,
            blood_type=None,
            languages=patient_languages,
            allergies=[],
            chronic_conditions=[],
            current_medications=[],
            medical_history=[],
            emergency_contact=None,
        )
        session.add(profile)

    await session.commit()
    await session.refresh(user)
    return user


async def list_doctors(session: AsyncSession) -> List[User]:
    result = await session.execute(select(User).where(User.role == "doctor").limit(100))
    return list(result.scalars().all())


async def list_specialties(session: AsyncSession) -> List[str]:
    result = await session.execute(
        select(distinct(User.specialty)).where(User.role == "doctor", User.specialty.is_not(None))
    )
    specialties = [row[0] for row in result.all() if row[0]]
    specialties.sort()
    return specialties


async def search_doctors(
    session: AsyncSession,
    *,
    specialty: str | None = None,
    search: str | None = None,
) -> List[User]:
    query = select(User).where(User.role == "doctor")

    if specialty and specialty != "all":
        query = query.where(User.specialty == specialty)

    if search:
        pattern = f"%{search}%"
        query = query.where((User.full_name.ilike(pattern)) | (User.specialty.ilike(pattern)))

    query = query.order_by(User.full_name.asc()).limit(100)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_patient_counts(session: AsyncSession, doctor_ids: List[str]) -> dict[str, int]:
    if not doctor_ids:
        return {}

    result = await session.execute(
        select(ChatMessage.recipient_id, func.count(distinct(ChatMessage.sender_id)))
        .where(ChatMessage.chat_type == "doctor", ChatMessage.recipient_id.in_(doctor_ids))
        .group_by(ChatMessage.recipient_id)
    )
    return {row[0]: int(row[1]) for row in result.all()}


async def list_patients_for_doctor(session: AsyncSession, doctor_id: str) -> List[User]:
    sender_ids_result = await session.execute(
        select(distinct(ChatMessage.sender_id)).where(
            ChatMessage.recipient_id == doctor_id,
            ChatMessage.chat_type == "doctor",
        ).limit(1000)
    )
    sender_ids = [row[0] for row in sender_ids_result.all()]
    if not sender_ids:
        return []

    users_result = await session.execute(select(User).where(User.id.in_(sender_ids)))
    return list(users_result.scalars().all())


async def get_doctor_response_times(
    session: AsyncSession,
    doctor_ids: List[str],
    *,
    window_days: int = 30,
) -> dict[str, int | None]:
    if not doctor_ids:
        return {}

    cutoff = datetime.now(timezone.utc) - timedelta(days=window_days)
    result = await session.execute(
        select(ChatMessage.sender_id, ChatMessage.recipient_id, ChatMessage.timestamp)
        .where(
            ChatMessage.chat_type == "doctor",
            ChatMessage.timestamp >= cutoff,
            (ChatMessage.sender_id.in_(doctor_ids)) | (ChatMessage.recipient_id.in_(doctor_ids)),
        )
        .order_by(ChatMessage.timestamp.asc())
    )

    totals: dict[str, float] = {doc_id: 0.0 for doc_id in doctor_ids}
    counts: dict[str, int] = {doc_id: 0 for doc_id in doctor_ids}
    last_patient_msg: dict[tuple[str, str], datetime | None] = {}

    for sender_id, recipient_id, timestamp in result.all():
        if sender_id in doctor_ids:
            doctor_id = sender_id
            other_id = recipient_id
            if other_id is None:
                continue
            key = (doctor_id, other_id)
            last_ts = last_patient_msg.get(key)
            if last_ts:
                diff = (timestamp - last_ts).total_seconds()
                if diff >= 0:
                    totals[doctor_id] += diff
                    counts[doctor_id] += 1
                last_patient_msg[key] = None
        elif recipient_id in doctor_ids:
            doctor_id = recipient_id
            other_id = sender_id
            if other_id is None:
                continue
            key = (doctor_id, other_id)
            last_patient_msg[key] = timestamp

    averages: dict[str, int | None] = {}
    for doc_id in doctor_ids:
        if counts[doc_id] == 0:
            averages[doc_id] = None
        else:
            averages[doc_id] = max(1, int(round((totals[doc_id] / counts[doc_id]) / 60)))
    return averages


async def get_doctor_ratings(
    session: AsyncSession,
    doctor_ids: List[str],
) -> dict[str, dict[str, float | int]]:
    if not doctor_ids:
        return {}

    result = await session.execute(
        select(
            DoctorRating.doctor_id,
            func.avg(DoctorRating.rating),
            func.count(DoctorRating.id),
        )
        .where(DoctorRating.doctor_id.in_(doctor_ids))
        .group_by(DoctorRating.doctor_id)
    )

    ratings: dict[str, dict[str, float | int]] = {}
    for doctor_id, avg_rating, count in result.all():
        ratings[doctor_id] = {
            "avg_rating": float(avg_rating) if avg_rating is not None else None,
            "rating_count": int(count or 0),
        }
    return ratings


async def update_doctor_profile(
    session: AsyncSession,
    *,
    user_id: str,
    updates: DoctorProfileUpdate,
) -> User:
    user = await get_user_by_id(session, user_id)
    if not user or user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    data = updates.model_dump(exclude_unset=True)
    if "doctor_languages" in data:
        data["doctor_languages"] = _normalize_doctor_languages(data["doctor_languages"])
    if "expected_salary_range" in data:
        data["expected_salary_range"] = _clean_optional_text(data["expected_salary_range"])

    new_offers_online = bool(data.get("offers_online", user.offers_online))
    new_offers_in_person = bool(data.get("offers_in_person", user.offers_in_person))
    _validate_consultation_modes(online=new_offers_online, in_person=new_offers_in_person)

    for key, value in data.items():
        if isinstance(value, str) and not value.strip():
            value = None
        setattr(user, key, value)

    await session.commit()
    await session.refresh(user)
    return user


async def delete_user_account(session: AsyncSession, user_id: str) -> None:
    await session.execute(
        delete(ChatMessage).where(
            (ChatMessage.sender_id == user_id) | (ChatMessage.recipient_id == user_id)
        )
    )
    await session.execute(
        delete(DoctorRating).where(
            (DoctorRating.patient_id == user_id) | (DoctorRating.doctor_id == user_id)
        )
    )
    await session.execute(delete(AccountVerificationCode).where(AccountVerificationCode.user_id == user_id))
    await session.execute(delete(Recommendation).where(Recommendation.user_id == user_id))
    await session.execute(delete(Document).where(Document.user_id == user_id))
    await session.execute(delete(PatientProfile).where(PatientProfile.user_id == user_id))
    await session.execute(delete(User).where(User.id == user_id))

    await session.commit()


async def set_ai_consent(session: AsyncSession, user_id: str, consent: bool) -> User | None:
    user = await get_user_by_id(session, user_id)
    if not user:
        return None
    user.ai_consent = consent
    await session.commit()
    await session.refresh(user)
    return user


async def set_telegram_chat_id(session: AsyncSession, user_id: str, chat_id: str | None) -> User | None:
    user = await get_user_by_id(session, user_id)
    if not user:
        return None
    user.telegram_chat_id = chat_id
    await session.commit()
    await session.refresh(user)
    return user
