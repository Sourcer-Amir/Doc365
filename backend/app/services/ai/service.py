from __future__ import annotations

from datetime import datetime, timezone

from app.core.config import settings
from app.db.models import PatientProfile
from app.services.ai.base import AIProvider
from app.services.ai.context import build_patient_context, build_profile_summary, build_doctor_context
from app.services.ai.factory import get_ai_provider
from app.services.ai.prompts import (
    chat_system_message,
    recommendations_system_message,
    recommendations_user_prompt,
)


class AIService:
    def __init__(self, provider: AIProvider | None = None):
        self.provider = provider or get_ai_provider()

    async def chat_with_patient(
        self,
        *,
        user_id: str,
        user_message: str,
        profile: PatientProfile | None,
        doctors: list | None = None,
    ) -> str:
        context = build_patient_context(profile)
        doctor_context = build_doctor_context(doctors or [])
        if doctor_context:
            context = f"{context}\n{doctor_context}\n"
        system_message = chat_system_message(context)
        session_id = f"ai_chat_{user_id}"
        return await self.provider.chat(
            system_message=system_message,
            user_message=user_message,
            session_id=session_id,
            model=settings.AI_MODEL,
        )

    async def generate_recommendations(
        self,
        *,
        user_id: str,
        profile: PatientProfile | None,
        doctors: list | None = None,
    ) -> str:
        context_lines = build_profile_summary(profile)
        doctor_lines = [
            line
            for line in build_doctor_context(doctors or []).splitlines()
            if line and not line.lower().startswith("doctores disponibles")
        ]
        user_prompt = recommendations_user_prompt(context_lines, doctor_lines)
        session_id = f"rec_{user_id}_{datetime.now(timezone.utc).timestamp()}"
        return await self.provider.chat(
            system_message=recommendations_system_message(),
            user_message=user_prompt,
            session_id=session_id,
            model=settings.AI_MODEL,
        )
