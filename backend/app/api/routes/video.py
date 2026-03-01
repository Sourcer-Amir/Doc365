from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.services.agora import build_agora_session

router = APIRouter()


@router.get("/video/agora/config")
async def get_agora_config(
    channel: str | None = None,
    peer_id: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    return build_agora_session(
        user_id=str(current_user.get("user_id") or "0"),
        requested_channel=channel,
        peer_id=peer_id,
    )
