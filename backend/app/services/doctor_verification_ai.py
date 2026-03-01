from __future__ import annotations

import base64
import json
import re
from dataclasses import dataclass

from app.core.config import settings
from app.services.ai.base import AIProvider
from app.services.ai.factory import get_ai_provider

MAX_EXTRACTED_TEXT_CHARS = 12000
MAX_BASE64_SNIPPET_CHARS = 4000


@dataclass
class DoctorVerificationDecision:
    approved: bool
    reason: str
    confidence: float


def _extract_printable_text(raw_bytes: bytes) -> str:
    decoded = raw_bytes.decode("latin-1", errors="ignore")
    # Keep long printable chunks which usually include meaningful words.
    chunks = re.findall(r"[A-Za-z0-9][A-Za-z0-9\s,.;:/()#'\"-]{4,}", decoded)
    if not chunks:
        return ""
    text = "\n".join(chunks)
    return text[:MAX_EXTRACTED_TEXT_CHARS]


def _build_document_payload(*, filename: str, file_type: str, file_data_b64: str) -> str:
    raw_bytes = base64.b64decode(file_data_b64.encode("utf-8"), validate=False)
    extracted_text = _extract_printable_text(raw_bytes)
    b64_snippet = file_data_b64[:MAX_BASE64_SNIPPET_CHARS]
    return (
        f"filename: {filename}\n"
        f"mime_type: {file_type}\n"
        f"size_bytes: {len(raw_bytes)}\n"
        f"text_extracted:\n{extracted_text or '[EMPTY]'}\n\n"
        f"base64_snippet:\n{b64_snippet}"
    )


def _parse_json_object(response_text: str) -> dict:
    try:
        parsed = json.loads(response_text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", response_text, flags=re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass
    return {}


def _to_decision(parsed: dict) -> DoctorVerificationDecision:
    approved = bool(parsed.get("approved", False))
    reason = str(parsed.get("reason", "")).strip()
    if not reason:
        reason = "No se encontraron evidencias suficientes para verificar credenciales médicas."
    try:
        confidence = float(parsed.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0
    confidence = max(0.0, min(confidence, 1.0))

    if approved and confidence < 0.55:
        return DoctorVerificationDecision(
            approved=False,
            reason="La revisión automática no alcanzó confianza suficiente. Sube documentos más legibles.",
            confidence=confidence,
        )
    return DoctorVerificationDecision(approved=approved, reason=reason[:500], confidence=confidence)


class DoctorVerificationAIService:
    def __init__(self, provider: AIProvider | None = None):
        self.provider = provider or get_ai_provider()

    async def review_document(
        self,
        *,
        doctor_name: str,
        specialty: str | None,
        filename: str,
        file_type: str,
        file_data_b64: str,
    ) -> DoctorVerificationDecision:
        document_payload = _build_document_payload(
            filename=filename,
            file_type=file_type,
            file_data_b64=file_data_b64,
        )
        specialty_text = specialty or "No especificada"
        system_message = (
            "Eres un verificador documental para una plataforma médica.\n"
            "Debes decidir si un documento es evidencia suficiente para validar credenciales de un doctor.\n"
            "Si el documento es ilegible, ambiguo o no parece credencial médica oficial, rechaza.\n"
            "Responde SOLO JSON con este formato:\n"
            '{"approved": true|false, "confidence": 0.0, "reason": "texto breve"}'
        )
        user_message = (
            f"doctor_name: {doctor_name}\n"
            f"doctor_specialty: {specialty_text}\n"
            f"document:\n{document_payload}\n\n"
            "Recuerda: si no hay evidencia clara de autenticidad o credencial oficial, approved=false."
        )
        response = await self.provider.chat(
            system_message=system_message,
            user_message=user_message,
            session_id=f"doctor_verif_{doctor_name}",
            model=settings.AI_MODEL,
        )
        parsed = _parse_json_object(response or "")
        return _to_decision(parsed)
