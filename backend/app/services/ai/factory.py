from __future__ import annotations
from app.core.config import settings
from app.services.ai.base import AIProvider

def get_ai_provider() -> AIProvider:
    provider = settings.AI_PROVIDER.lower()
    if provider == "litellm":
        from app.services.ai.litellm import LiteLLMProvider

        return LiteLLMProvider()
    if provider == "groq":
        from app.services.ai.groq import GroqAIProvider

        return GroqAIProvider()
    raise ValueError(f"Unsupported AI_PROVIDER: {settings.AI_PROVIDER}")
