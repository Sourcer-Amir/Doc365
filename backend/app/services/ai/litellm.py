from __future__ import annotations

from litellm import acompletion

from app.core.config import settings
from app.services.ai.base import AIProvider


class LiteLLMProvider(AIProvider):
    async def chat(self, *, system_message: str, user_message: str, session_id: str, model: str) -> str:
        if not settings.AI_API_KEY:
            raise ValueError("AI_API_KEY is required for litellm provider")

        response = await acompletion(
            model=model,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
            api_key=settings.AI_API_KEY,
        )

        return response.choices[0].message.content
