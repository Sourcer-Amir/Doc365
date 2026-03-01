from __future__ import annotations

import base64
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.verification import VerificationDocumentOut, VerificationStatusOut
from app.services.doctor_verification_ai import DoctorVerificationAIService
from app.services.notifications import send_email, send_telegram_message
from app.services.users import get_user_by_id
from app.services.verification import create_verification_document, list_verification_documents
from app.core.deps import get_current_user

router = APIRouter()

MAX_VERIFICATION_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "doc", "docx"}
AI_REVIEWER_ID = "ai_system"


def _extension(filename: str | None) -> str:
    if not filename or "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()


def _compute_status(*, is_verified: bool, docs: list) -> str:
    if is_verified:
        return "approved"
    if not docs:
        return "pending"
    if any(doc.status == "pending_review" for doc in docs):
        return "pending_review"
    if docs[0].status == "rejected":
        return "rejected"
    return "pending"


async def _notify_review_result(
    *,
    doctor,
    approved: bool,
    reason: str | None,
) -> None:
    if approved:
        subject = "Doctor365 - Verificación profesional aprobada"
        body = (
            f"Hola {doctor.full_name},\n\n"
            "La revisión automática de tus credenciales fue aprobada."
        )
        telegram_text = "Doctor365: tus credenciales médicas fueron aprobadas."
    else:
        subject = "Doctor365 - Verificación profesional rechazada"
        body = (
            f"Hola {doctor.full_name},\n\n"
            "La revisión automática de tus credenciales fue rechazada.\n"
            f"Motivo: {reason or 'No especificado'}\n"
            "Sube un documento más claro o una credencial oficial válida."
        )
        telegram_text = (
            "Doctor365: tus credenciales médicas fueron rechazadas. "
            f"Motivo: {reason or 'No especificado'}"
        )

    await send_email(to_email=doctor.email, subject=subject, body=body)
    if doctor.telegram_chat_id:
        await send_telegram_message(chat_id=doctor.telegram_chat_id, text=telegram_text)


@router.get("/doctor/verification/status", response_model=VerificationStatusOut)
async def get_verification_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doctor = await get_user_by_id(db, current_user["user_id"])
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can view status")

    docs = await list_verification_documents(db, doctor.id)
    return VerificationStatusOut(
        is_verified=bool(doctor.is_verified),
        verification_status=_compute_status(is_verified=bool(doctor.is_verified), docs=docs),
        documents=[VerificationDocumentOut.model_validate(doc) for doc in docs],
    )


@router.post("/doctor/verification/upload", response_model=VerificationDocumentOut)
async def upload_verification_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doctor = await get_user_by_id(db, current_user["user_id"])
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can upload")

    file_ext = _extension(file.filename)
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Use PDF, JPG, PNG, DOC or DOCX.",
        )

    file_content = await file.read()
    if not file_content:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Empty file")
    if len(file_content) > MAX_VERIFICATION_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large")

    file_data_b64 = base64.b64encode(file_content).decode("utf-8")
    doc = await create_verification_document(
        db,
        doctor_id=doctor.id,
        filename=file.filename or f"document.{file_ext}",
        file_data=file_data_b64,
        file_type=file.content_type or "application/octet-stream",
    )

    try:
        ai_service = DoctorVerificationAIService()
        decision = await ai_service.review_document(
            doctor_name=doctor.full_name,
            specialty=doctor.specialty,
            filename=doc.filename,
            file_type=doc.file_type,
            file_data_b64=doc.file_data,
        )
    except Exception:
        doc.status = "pending_review"
        doc.rejection_reason = "No se pudo completar la revisión automática. Intenta nuevamente."
        doc.reviewed_by = AI_REVIEWER_ID
        doc.reviewed_at = datetime.now(timezone.utc)
        doctor.is_verified = False
        await db.commit()
        await db.refresh(doc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo completar la revisión automática en este momento.",
        )

    approved = bool(decision.approved)
    doc.status = "approved" if approved else "rejected"
    doc.rejection_reason = None if approved else decision.reason
    doc.reviewed_by = AI_REVIEWER_ID
    doc.reviewed_at = datetime.now(timezone.utc)
    doctor.is_verified = approved

    await db.commit()
    await db.refresh(doc)
    await db.refresh(doctor)

    await _notify_review_result(doctor=doctor, approved=approved, reason=doc.rejection_reason)
    return VerificationDocumentOut.model_validate(doc)
