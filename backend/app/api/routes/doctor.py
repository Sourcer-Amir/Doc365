from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import base64
from io import BytesIO

from PIL import Image, UnidentifiedImageError

from app.core.deps import get_current_user
from app.db.models import ChatMessage, DoctorPatient
from app.db.session import get_db
from app.schemas.doctor import DoctorAnalyticsOut, DoctorPatientHistoryOut, DoctorProfileOut, DoctorProfileUpdate
from app.schemas.document import DocumentListOut, DocumentOut
from app.schemas.profile import PatientProfileOut
from app.schemas.users import UserOut
from app.services.doctor_patients import (
    add_doctor_patient,
    remove_doctor_patient,
    list_doctor_patients,
    list_recent_doctor_patients,
)
from app.services.documents import list_documents, get_document
from app.services.profiles import get_or_create_profile
from app.services.users import get_user_by_id, update_doctor_profile, get_doctor_ratings

router = APIRouter()


@router.get("/doctor/analytics", response_model=DoctorAnalyticsOut)
async def get_doctor_analytics(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors")

    total_patients_result = await db.execute(
        select(func.count(DoctorPatient.id)).where(DoctorPatient.doctor_id == current_user["user_id"])
    )
    total_patients = int(total_patients_result.scalar() or 0)

    total_chats_result = await db.execute(
        select(func.count(ChatMessage.id)).where(
            ChatMessage.chat_type == "doctor",
            (ChatMessage.sender_id == current_user["user_id"])
            | (ChatMessage.recipient_id == current_user["user_id"]),
        )
    )
    total_chats = int(total_chats_result.scalar() or 0)

    ratings = await get_doctor_ratings(db, [current_user["user_id"]])
    rating_info = ratings.get(current_user["user_id"], {})

    recent_patients = await list_recent_doctor_patients(db, doctor_id=current_user["user_id"], limit=5)

    return DoctorAnalyticsOut(
        profile_views=0,
        total_patients=total_patients,
        total_chats=total_chats,
        monthly_views={},
        recent_patients=[UserOut.model_validate(p) for p in recent_patients],
        avg_rating=rating_info.get("avg_rating"),
        rating_count=rating_info.get("rating_count", 0),
    )


@router.get("/doctor/profile", response_model=DoctorProfileOut)
async def get_doctor_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors")

    doctor = await get_user_by_id(db, current_user["user_id"])
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    data_url = None
    if doctor.profile_photo_data and doctor.profile_photo_type:
        data_url = f"data:{doctor.profile_photo_type};base64,{doctor.profile_photo_data}"
    return DoctorProfileOut.model_validate(doctor).model_copy(
        update={"profile_photo_url": data_url or doctor.profile_photo_url}
    )


@router.put("/doctor/profile", response_model=DoctorProfileOut)
async def update_profile(
    payload: DoctorProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors")

    doctor = await update_doctor_profile(db, user_id=current_user["user_id"], updates=payload)
    data_url = None
    if doctor.profile_photo_data and doctor.profile_photo_type:
        data_url = f"data:{doctor.profile_photo_type};base64,{doctor.profile_photo_data}"
    return DoctorProfileOut.model_validate(doctor).model_copy(
        update={"profile_photo_url": data_url or doctor.profile_photo_url}
    )


@router.post("/doctor/profile/photo", response_model=DoctorProfileOut)
async def upload_doctor_profile_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    max_upload_bytes = 8 * 1024 * 1024
    if len(content) > max_upload_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large")

    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image type")

    processed_content = content
    processed_type = file.content_type or "image/jpeg"
    compress_threshold = 700 * 1024

    if len(content) > compress_threshold:
        try:
            image = Image.open(BytesIO(content))
            image = image.convert("RGB")
            max_dim = 1200
            width, height = image.size
            scale = min(max_dim / width, max_dim / height, 1.0)
            if scale < 1.0:
                image = image.resize((int(width * scale), int(height * scale)), Image.LANCZOS)

            output = BytesIO()
            image.save(output, format="JPEG", quality=82, optimize=True, progressive=True)
            processed_content = output.getvalue()
            processed_type = "image/jpeg"
        except UnidentifiedImageError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image")

    doctor = await get_user_by_id(db, current_user["user_id"])
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    doctor.profile_photo_data = base64.b64encode(processed_content).decode("utf-8")
    doctor.profile_photo_type = processed_type

    await db.commit()
    await db.refresh(doctor)

    data_url = f"data:{doctor.profile_photo_type};base64,{doctor.profile_photo_data}"
    return DoctorProfileOut.model_validate(doctor).model_copy(
        update={"profile_photo_url": data_url}
    )


@router.get("/doctor/patients", response_model=list[UserOut])
async def get_doctor_patients(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors")
    patients = await list_doctor_patients(db, doctor_id=current_user["user_id"])
    return [UserOut.model_validate(p) for p in patients]


@router.post("/doctor/patients/{patient_id}")
async def add_patient(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors")

    patient = await get_user_by_id(db, patient_id)
    if not patient or patient.role != "patient":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    # Ensure there is a chat history between doctor and patient
    chat_result = await db.execute(
        select(ChatMessage.id).where(
            ChatMessage.chat_type == "doctor",
            (
                (ChatMessage.sender_id == patient_id)
                & (ChatMessage.recipient_id == current_user["user_id"])
            )
            | (
                (ChatMessage.sender_id == current_user["user_id"])
                & (ChatMessage.recipient_id == patient_id)
            ),
        )
    )
    if chat_result.first() is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No chat history with this patient",
        )

    await add_doctor_patient(db, doctor_id=current_user["user_id"], patient_id=patient_id)
    return {"status": "ok"}


@router.delete("/doctor/patients/{patient_id}")
async def remove_patient(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors")

    await remove_doctor_patient(db, doctor_id=current_user["user_id"], patient_id=patient_id)
    return {"status": "ok"}


async def _ensure_doctor_patient(
    db: AsyncSession,
    *,
    doctor_id: str,
    patient_id: str,
) -> None:
    result = await db.execute(
        select(DoctorPatient.id).where(
            DoctorPatient.doctor_id == doctor_id,
            DoctorPatient.patient_id == patient_id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient not assigned")


@router.get("/doctor/patients/{patient_id}/history", response_model=DoctorPatientHistoryOut)
async def get_patient_history(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors")

    patient = await get_user_by_id(db, patient_id)
    if not patient or patient.role != "patient":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    await _ensure_doctor_patient(db, doctor_id=current_user["user_id"], patient_id=patient_id)

    profile = await get_or_create_profile(db, patient_id)
    documents = await list_documents(db, patient_id)

    return DoctorPatientHistoryOut(
        patient=UserOut.model_validate(patient),
        profile=PatientProfileOut.model_validate(profile) if profile else None,
        documents=[DocumentListOut.model_validate(doc) for doc in documents],
    )


@router.get("/doctor/patients/{patient_id}/documents/{doc_id}", response_model=DocumentOut)
async def get_patient_document(
    patient_id: str,
    doc_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors")

    patient = await get_user_by_id(db, patient_id)
    if not patient or patient.role != "patient":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    await _ensure_doctor_patient(db, doctor_id=current_user["user_id"], patient_id=patient_id)

    doc = await get_document(db, patient_id, doc_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    return DocumentOut.model_validate(doc)
