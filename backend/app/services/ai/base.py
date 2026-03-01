from __future__ import annotations

from abc import ABC, abstractmethod


class AIProvider(ABC):
    @abstractmethod
    async def chat(self, *, system_message: str, user_message: str, session_id: str, model: str) -> str:
        raise NotImplementedError
