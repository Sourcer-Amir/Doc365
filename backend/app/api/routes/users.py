from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4

from app.core.config import settings
from app.core.deps import get_current_user
from app.db.session import get_db
from app.db.models import ChatMessage, DoctorRating
from app.schemas.users import (
    UserOut,
    DoctorSearchOut,
    PublicDoctorOut,
    DoctorDetailOut,
    DoctorRatingIn,
    DoctorRatingOut,
    AIConsentUpdate,
    AIConsentOut,
    TelegramConnectUrlOut,
    TelegramLinkUpdate,
    TelegramStatusOut,
)
from app.services.users import (
    list_doctors,
    list_patients_for_doctor,
    delete_user_account,
    get_user_by_id,
    set_ai_consent,
    list_specialties,
    search_doctors,
    get_patient_counts,
    get_doctor_response_times,
    get_doctor_ratings,
    set_telegram_chat_id,
)
from app.services.telegram_link import create_telegram_link_token

router = APIRouter()

MAX_PUBLIC_QUERY_LEN = 80
MAX_RESPONSE_FILTER_MINUTES = 1440
MAX_TELEGRAM_CHAT_ID_LEN = 64


def _normalize_public_query(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    if len(cleaned) > MAX_PUBLIC_QUERY_LEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query too long",
        )
    return cleaned


def _normalize_response_filter(value: int | None) -> int | None:
    if value is None:
        return None
    if value <= 0 or value > MAX_RESPONSE_FILTER_MINUTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid response time filter")
    return value


def _photo_url_for_doctor(doctor) -> str | None:
    data = getattr(doctor, "profile_photo_data", None)
    content_type = getattr(doctor, "profile_photo_type", None)
    if data and content_type:
        return f"data:{content_type};base64,{data}"
    return getattr(doctor, "profile_photo_url", None)


def _normalize_telegram_chat_id(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    if len(cleaned) > MAX_TELEGRAM_CHAT_ID_LEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram chat id is too long",
        )
    return cleaned


@router.get("/public/specialties")
async def get_specialties_public(db: AsyncSession = Depends(get_db)):
    specialties = await list_specialties(db)
    return {"specialties": specialties}


@router.get("/public/doctors/search", response_model=list[PublicDoctorOut])
async def search_doctors_public(
    specialty: str | None = None,
    search: str | None = None,
    max_response_minutes: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    specialty = _normalize_public_query(specialty)
    search = _normalize_public_query(search)
    max_response_minutes = _normalize_response_filter(max_response_minutes)
    doctors = await search_doctors(db, specialty=specialty, search=search)
    doctor_ids = [doc.id for doc in doctors]
    patient_counts = await get_patient_counts(db, doctor_ids)
    response_times = await get_doctor_response_times(db, doctor_ids)
    ratings = await get_doctor_ratings(db, doctor_ids)

    filtered_doctors = []
    for doc in doctors:
        if max_response_minutes is not None:
            value = response_times.get(doc.id)
            if value is None or value > max_response_minutes:
                continue
        filtered_doctors.append(doc)

    results: list[PublicDoctorOut] = []
    for doc in filtered_doctors:
        base = PublicDoctorOut.model_validate(doc)
        rating_info = ratings.get(doc.id, {})
        results.append(
            base.model_copy(
                update={
                    "is_verified": bool(getattr(doc, "is_verified", False)),
                    "profile_views": 0,
                    "total_patients": patient_counts.get(doc.id, 0),
                    "avg_response_minutes": response_times.get(doc.id),
                    "avg_rating": rating_info.get("avg_rating"),
                    "rating_count": rating_info.get("rating_count", 0),
                    "profile_photo_url": _photo_url_for_doctor(doc),
                }
            )
        )
    return results


@router.get("/doctors", response_model=list[UserOut])
async def get_doctors(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doctors = await list_doctors(db)
    return [UserOut.model_validate(user) for user in doctors]


@router.get("/specialties")
async def get_specialties(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    specialties = await list_specialties(db)
    return {"specialties": specialties}


@router.get("/doctors/search", response_model=list[DoctorSearchOut])
async def search_doctors_route(
    specialty: str | None = None,
    search: str | None = None,
    max_response_minutes: int | None = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    specialty = _normalize_public_query(specialty)
    search = _normalize_public_query(search)
    max_response_minutes = _normalize_response_filter(max_response_minutes)
    doctors = await search_doctors(db, specialty=specialty, search=search)
    doctor_ids = [doc.id for doc in doctors]
    patient_counts = await get_patient_counts(db, doctor_ids)
    response_times = await get_doctor_response_times(db, doctor_ids)
    ratings = await get_doctor_ratings(db, doctor_ids)

    filtered_doctors = []
    for doc in doctors:
        if max_response_minutes is not None:
            value = response_times.get(doc.id)
            if value is None or value > max_response_minutes:
                continue
        filtered_doctors.append(doc)

    results: list[DoctorSearchOut] = []
    for doc in filtered_doctors:
        base = DoctorSearchOut.model_validate(doc)
        rating_info = ratings.get(doc.id, {})
        results.append(
            base.model_copy(
                update={
                    "is_verified": bool(getattr(doc, "is_verified", False)),
                    "profile_views": 0,
                    "total_patients": patient_counts.get(doc.id, 0),
                    "avg_response_minutes": response_times.get(doc.id),
                    "avg_rating": rating_info.get("avg_rating"),
                    "rating_count": rating_info.get("rating_count", 0),
                }
            )
        )
    return results


@router.get("/doctors/{doctor_id}", response_model=DoctorDetailOut)
async def get_doctor_detail(
    doctor_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doctor = await get_user_by_id(db, doctor_id)
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    response_times = await get_doctor_response_times(db, [doctor_id])
    ratings = await get_doctor_ratings(db, [doctor_id])
    rating_info = ratings.get(doctor_id, {})

    detail = DoctorDetailOut.model_validate(doctor)
    return detail.model_copy(
        update={
            "is_verified": bool(getattr(doctor, "is_verified", False)),
            "avg_response_minutes": response_times.get(doctor_id),
            "avg_rating": rating_info.get("avg_rating"),
            "rating_count": rating_info.get("rating_count", 0),
            "profile_photo_url": _photo_url_for_doctor(doctor),
        }
    )


@router.post("/doctors/{doctor_id}/rating", response_model=DoctorRatingOut)
async def rate_doctor(
    doctor_id: str,
    payload: DoctorRatingIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only patients can rate doctors")
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rating must be between 1 and 5")

    doctor = await get_user_by_id(db, doctor_id)
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    chat_result = await db.execute(
        select(ChatMessage.id).where(
            ChatMessage.chat_type == "doctor",
            (
                (ChatMessage.sender_id == current_user["user_id"])
                & (ChatMessage.recipient_id == doctor_id)
            )
            | (
                (ChatMessage.sender_id == doctor_id)
                & (ChatMessage.recipient_id == current_user["user_id"])
            ),
        )
    )
    if chat_result.first() is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No chat history with this doctor")

    existing_result = await db.execute(
        select(DoctorRating).where(
            DoctorRating.doctor_id == doctor_id,
            DoctorRating.patient_id == current_user["user_id"],
        )
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        existing.rating = payload.rating
    else:
        rating = DoctorRating(
            id=str(uuid4()),
            doctor_id=doctor_id,
            patient_id=current_user["user_id"],
            rating=payload.rating,
        )
        db.add(rating)

    await db.commit()

    ratings = await get_doctor_ratings(db, [doctor_id])
    rating_info = ratings.get(doctor_id, {})
    return DoctorRatingOut(
        avg_rating=rating_info.get("avg_rating"),
        rating_count=rating_info.get("rating_count", 0),
    )


@router.post("/doctor/{doctor_id}/view")
async def track_doctor_view(
    doctor_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Placeholder for analytics tracking. No-op for now.
    return {"status": "ok"}


@router.get("/patients", response_model=list[UserOut])
async def get_patients(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can view patients",
        )

    patients = await list_patients_for_doctor(db, current_user["user_id"])
    return [UserOut.model_validate(user) for user in patients]


@router.delete("/user/delete")
async def delete_user(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await delete_user_account(db, current_user["user_id"])
    return {"message": "Cuenta y todos los datos eliminados exitosamente"}


@router.get("/ai/consent", response_model=AIConsentOut)
async def get_ai_consent(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_by_id(db, current_user["user_id"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return AIConsentOut(ai_consent=bool(user.ai_consent))


@router.put("/ai/consent", response_model=AIConsentOut)
async def update_ai_consent(
    payload: AIConsentUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await set_ai_consent(db, current_user["user_id"], payload.ai_consent)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return AIConsentOut(ai_consent=bool(user.ai_consent))


@router.put("/user/telegram", response_model=UserOut)
async def update_telegram_link(
    payload: TelegramLinkUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chat_id = _normalize_telegram_chat_id(payload.telegram_chat_id)
    user = await set_telegram_chat_id(db, current_user["user_id"], chat_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserOut.model_validate(user)


@router.get("/user/telegram/status", response_model=TelegramStatusOut)
async def get_telegram_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_by_id(db, current_user["user_id"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return TelegramStatusOut(connected=bool(user.telegram_chat_id))


@router.get("/user/telegram/connect-url", response_model=TelegramConnectUrlOut)
async def get_telegram_connect_url(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_BOT_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram integration is not configured",
        )

    user = await get_user_by_id(db, current_user["user_id"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    link_token = create_telegram_link_token(user_id=user.id)
    bot_username = settings.TELEGRAM_BOT_USERNAME.lstrip("@")
    connect_url = f"https://t.me/{bot_username}?start={link_token}"
    return TelegramConnectUrlOut(connect_url=connect_url, connected=bool(user.telegram_chat_id))


@router.delete("/user/telegram", response_model=TelegramStatusOut)
async def disconnect_telegram(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await set_telegram_chat_id(db, current_user["user_id"], None)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return TelegramStatusOut(connected=False)
