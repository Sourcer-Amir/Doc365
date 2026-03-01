from __future__ import annotations

from openai import AsyncOpenAI

from app.core.config import settings
from app.services.ai.base import AIProvider


class GroqAIProvider(AIProvider):
    def __init__(self) -> None:
        if not settings.AI_API_KEY:
            raise ValueError("AI_API_KEY is required for groq provider")
        self.client = AsyncOpenAI(
            api_key=settings.AI_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )

    async def chat(self, *, system_message: str, user_message: str, session_id: str, model: str) -> str:
        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
        )
        message = response.choices[0].message.content
        return message or ""
