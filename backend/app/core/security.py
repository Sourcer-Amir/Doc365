from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import jwt
from passlib.context import CryptContext
import re

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


PASSWORD_POLICY_MESSAGE = (
    "La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo especial."
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def password_meets_policy(password: str) -> bool:
    if len(password) < 8:
        return False
    if re.search(r"[A-Z]", password) is None:
        return False
    if re.search(r"\d", password) is None:
        return False
    if re.search(r"[^A-Za-z0-9]", password) is None:
        return False
    return True


def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    payload: Dict[str, Any] = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
