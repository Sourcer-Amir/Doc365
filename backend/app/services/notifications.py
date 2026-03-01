from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage
from functools import partial

import anyio
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)


def _build_email_message(*, to_email: str, subject: str, body: str) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message.set_content(body)
    return message


def _send_email_sync(*, to_email: str, subject: str, body: str) -> bool:
    if not _smtp_configured():
        logger.warning("SMTP is not configured. Email skipped.")
        return False

    message = _build_email_message(to_email=to_email, subject=subject, body=body)
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
        return True
    except Exception as exc:
        logger.exception("Error sending email to %s: %s", to_email, exc)
        return False


async def send_email(*, to_email: str, subject: str, body: str) -> bool:
    send_fn = partial(_send_email_sync, to_email=to_email, subject=subject, body=body)
    return await anyio.to_thread.run_sync(send_fn)


async def send_telegram_message(*, chat_id: str, text: str) -> bool:
    if not settings.TELEGRAM_BOT_TOKEN or not chat_id:
        return False

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
        return True
    except Exception as exc:
        logger.exception("Error sending telegram message to %s: %s", chat_id, exc)
        return False


async def notify_admin_telegram(text: str) -> bool:
    if not settings.TELEGRAM_ADMIN_CHAT_ID:
        return False
    return await send_telegram_message(chat_id=settings.TELEGRAM_ADMIN_CHAT_ID, text=text)
