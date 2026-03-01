from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import AccountVerificationCode, User


def _hash_code(code: str) -> str:
    payload = f"{code}:{settings.JWT_SECRET}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def generate_numeric_code(length: int = 6) -> str:
    upper = 10**length
    return str(secrets.randbelow(upper)).zfill(length)


async def issue_account_verification_code(session: AsyncSession, *, user_id: str) -> str:
    code = generate_numeric_code()
    now = _now_utc()
    expires_at = now + timedelta(minutes=settings.EMAIL_VERIFY_CODE_TTL_MINUTES)

    # Keep only one active code at a time.
    await session.execute(
        update(AccountVerificationCode)
        .where(
            AccountVerificationCode.user_id == user_id,
            AccountVerificationCode.used_at.is_(None),
        )
        .values(used_at=now)
    )

    record = AccountVerificationCode(
        id=str(uuid4()),
        user_id=user_id,
        code_hash=_hash_code(code),
        attempts=0,
        expires_at=expires_at,
        used_at=None,
        created_at=now,
    )
    session.add(record)
    await session.commit()
    return code


async def verify_account_code(
    session: AsyncSession,
    *,
    user: User,
    code: str,
) -> User:
    if user.email_verified:
        return user

    result = await session.execute(
        select(AccountVerificationCode)
        .where(
            AccountVerificationCode.user_id == user.id,
            AccountVerificationCode.used_at.is_(None),
        )
        .order_by(AccountVerificationCode.created_at.desc())
        .limit(1)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code. Request a new one.",
        )

    now = _now_utc()
    if record.expires_at < now:
        record.used_at = now
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code expired. Request a new one.",
        )

    if record.attempts >= settings.EMAIL_VERIFY_MAX_ATTEMPTS:
        record.used_at = now
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. Request a new code.",
        )

    if record.code_hash != _hash_code(code.strip()):
        record.attempts += 1
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code.",
        )

    user.email_verified = True
    record.used_at = now
    await session.commit()
    await session.refresh(user)
    return user
