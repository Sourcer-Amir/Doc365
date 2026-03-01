from __future__ import annotations

import re
import time
from typing import Any

from app.core.config import settings


def _normalize_piece(value: str | None) -> str:
    normalized = re.sub(r"[^a-z0-9]", "", str(value or "").lower())
    return normalized[:20]


def build_default_channel(*, user_id: str | None, peer_id: str | None = None) -> str:
    parts = sorted(filter(None, [_normalize_piece(user_id), _normalize_piece(peer_id)]))
    base = "-".join(parts) if parts else "general"
    return f"doctor365-{base}"[:64]


def sanitize_channel_name(raw_channel: str | None, *, user_id: str | None, peer_id: str | None = None) -> str:
    if not raw_channel:
        return build_default_channel(user_id=user_id, peer_id=peer_id)

    cleaned = re.sub(r"[^a-zA-Z0-9_-]+", "-", raw_channel.strip()).strip("-_")
    if not cleaned:
        return build_default_channel(user_id=user_id, peer_id=peer_id)
    return cleaned[:64]


def _invoke_token_builder(builder: Any, *args: Any, expires_at: int) -> str:
    try:
        return builder(*args, expires_at)
    except TypeError:
        return builder(*args, expires_at, expires_at)


def _build_generated_token(*, channel: str, uid: str) -> tuple[str | None, int | None, str]:
    if not settings.AGORA_APP_CERTIFICATE:
        return None, None, "not-required"

    try:
        from agora_token_builder import RtcTokenBuilder  # type: ignore
    except ImportError:
        return None, None, "missing-builder"

    expires_at = int(time.time()) + max(settings.AGORA_TOKEN_EXPIRY_SECONDS, 60)
    publisher_role = getattr(RtcTokenBuilder, "Role_Publisher", 1)

    if uid.isdigit():
        builder = getattr(RtcTokenBuilder, "buildTokenWithUid", None)
        if builder is None:
            return None, None, "missing-builder"
        token = _invoke_token_builder(
            builder,
            settings.AGORA_APP_ID,
            settings.AGORA_APP_CERTIFICATE,
            channel,
            int(uid),
            publisher_role,
            expires_at=expires_at,
        )
        return token, expires_at, "generated"

    builder = getattr(RtcTokenBuilder, "buildTokenWithUserAccount", None)
    if builder is None:
        return None, None, "missing-builder"

    token = _invoke_token_builder(
        builder,
        settings.AGORA_APP_ID,
        settings.AGORA_APP_CERTIFICATE,
        channel,
        uid,
        publisher_role,
        expires_at=expires_at,
    )
    return token, expires_at, "generated"


def build_agora_session(*, user_id: str | None, requested_channel: str | None, peer_id: str | None = None) -> dict[str, Any]:
    uid = str(user_id or "0")
    channel = sanitize_channel_name(requested_channel, user_id=user_id, peer_id=peer_id)

    if not settings.AGORA_APP_ID:
        return {
            "provider": "agora",
            "configured": False,
            "app_id": None,
            "channel": channel,
            "uid": uid,
            "token": None,
            "token_required": False,
            "expires_at": None,
            "source": "missing-app-id",
            "message": "Configura AGORA_APP_ID en tu backend local.",
        }

    generated_token, expires_at, source = _build_generated_token(channel=channel, uid=uid)

    token = generated_token
    if not token and settings.AGORA_TEMP_TOKEN:
        token = settings.AGORA_TEMP_TOKEN
        source = "static"

    token_required = bool(settings.AGORA_APP_CERTIFICATE or settings.AGORA_TEMP_TOKEN)
    configured = True
    message = "Credenciales de Agora listas."

    if source == "missing-builder" and not token:
        message = "Instala agora-token-builder o define AGORA_TEMP_TOKEN en el backend."
    elif not token and not token_required:
        message = "Usando App ID de Agora sin token temporal."

    return {
        "provider": "agora",
        "configured": configured,
        "app_id": settings.AGORA_APP_ID,
        "channel": channel,
        "uid": uid,
        "token": token,
        "token_required": token_required,
        "expires_at": expires_at,
        "source": source,
        "message": message,
    }
