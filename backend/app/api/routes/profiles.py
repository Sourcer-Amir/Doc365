from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.schemas.profile import PatientProfileOut, PatientProfileUpdate
from app.services.profiles import get_or_create_profile, update_profile

router = APIRouter()


@router.get("/profile", response_model=PatientProfileOut)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients have profiles",
        )

    profile = await get_or_create_profile(db, current_user["user_id"])
    return PatientProfileOut.model_validate(profile)


@router.put("/profile", response_model=PatientProfileOut)
async def put_profile(
    profile_data: PatientProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can update profiles",
        )

    profile = await update_profile(db, current_user["user_id"], profile_data)
    return PatientProfileOut.model_validate(profile)
