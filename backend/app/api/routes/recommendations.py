from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.schemas.recommendation import RecommendationOut
from app.services.recommendations import generate_recommendations, list_recommendations
from app.services.users import get_user_by_id

router = APIRouter()


@router.post("/recommendations/generate", response_model=list[RecommendationOut])
async def generate(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.get("role") != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can generate recommendations",
        )
    user = await get_user_by_id(db, current_user["user_id"])
    if not user or not user.ai_consent:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="AI consent required")

    recs = await generate_recommendations(db, current_user["user_id"])
    return [RecommendationOut.model_validate(rec) for rec in recs]


@router.get("/recommendations", response_model=list[RecommendationOut])
async def get_recommendations(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients have recommendations",
        )

    recs = await list_recommendations(db, current_user["user_id"])
    return [RecommendationOut.model_validate(rec) for rec in recs]
