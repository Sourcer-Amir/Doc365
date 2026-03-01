from __future__ import annotations

from pydantic import BaseModel

from app.schemas.users import UserOut


class TokenResponse(BaseModel):
    token: str
    user: UserOut
    requires_email_verification: bool = False
