from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.db.session import get_db
from app.schemas.auth import TokenResponse
from app.schemas.users import UserRegister, UserLogin, UserOut
from app.services.users import create_user, authenticate_user

router = APIRouter()


@router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    user = await create_user(db, user_data)
    token = create_access_token(user.id, user.email, user.role)
    return TokenResponse(token=token, user=UserOut.model_validate(user), requires_email_verification=False)


@router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, credentials.email, credentials.password)
    token = create_access_token(user.id, user.email, user.role)
    return TokenResponse(token=token, user=UserOut.model_validate(user), requires_email_verification=False)
