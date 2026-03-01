from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.services.notifications import send_telegram_message
from app.services.telegram_link import decode_telegram_link_token
from app.services.users import set_telegram_chat_id

router = APIRouter()


def _extract_start_token(text: str) -> str | None:
    value = text.strip()
    if not value.startswith("/start"):
        return None
    parts = value.split(maxsplit=1)
    if len(parts) < 2:
        return ""
    return parts[1].strip()


@router.post("/telegram/webhook", include_in_schema=False)
async def telegram_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    if settings.TELEGRAM_WEBHOOK_SECRET:
        received_secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
        if received_secret != settings.TELEGRAM_WEBHOOK_SECRET:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid telegram webhook secret",
            )

    update = await request.json()
    message = update.get("message") or update.get("edited_message")
    if not isinstance(message, dict):
        return {"ok": True}

    chat = message.get("chat")
    text = message.get("text")
    if not isinstance(chat, dict) or not isinstance(text, str):
        return {"ok": True}

    chat_id = chat.get("id")
    if chat_id is None:
        return {"ok": True}
    chat_id_str = str(chat_id)

    start_token = _extract_start_token(text)
    if start_token is None:
        return {"ok": True}

    if not start_token:
        await send_telegram_message(
            chat_id=chat_id_str,
            text=(
                "Abre el boton de Telegram desde tu perfil de Doctor365 para conectar "
                "las notificaciones automaticamente."
            ),
        )
        return {"ok": True}

    user_id = decode_telegram_link_token(start_token)
    if not user_id:
        await send_telegram_message(
            chat_id=chat_id_str,
            text="El enlace de conexion es invalido o ya vencio. Vuelve a generarlo desde Doctor365.",
        )
        return {"ok": True}

    user = await set_telegram_chat_id(db, user_id, chat_id_str)
    if not user:
        await send_telegram_message(
            chat_id=chat_id_str,
            text="No se pudo completar la conexion. Inicia sesion y vuelve a intentarlo.",
        )
        return {"ok": True}

    await send_telegram_message(
        chat_id=chat_id_str,
        text="Notificaciones de Doctor365 activadas correctamente para tu cuenta.",
    )
    return {"ok": True}
