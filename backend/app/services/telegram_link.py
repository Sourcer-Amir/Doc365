from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings


LINK_PURPOSE = "telegram_link"


def create_telegram_link_token(*, user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "purpose": LINK_PURPOSE,
        "user_id": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=settings.TELEGRAM_LINK_TOKEN_TTL_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_telegram_link_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None

    if payload.get("purpose") != LINK_PURPOSE:
        return None
    user_id = payload.get("user_id")
    if not isinstance(user_id, str) or not user_id:
        return None
    return user_id
