from __future__ import annotations

from datetime import datetime, timezone
from typing import List
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Recommendation, PatientProfile
from app.services.ai import AIService
from app.services.users import list_doctors


async def generate_recommendations(session: AsyncSession, user_id: str) -> List[Recommendation]:
    profile_result = await session.execute(
        select(PatientProfile).where(PatientProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()

    doctors = await list_doctors(session)
    ai_service = AIService()
    response = await ai_service.generate_recommendations(
        user_id=user_id,
        profile=profile,
        doctors=doctors,
    )

    recommendations: List[Recommendation] = []
    parts = response.split("---")
    categories = ["Nutrición", "Ejercicio", "Bienestar", "Prevención", "Medicación"]

    for i, part in enumerate(parts[:5]):
        if not part.strip():
            continue
        rec_id = str(uuid4())
        lines = part.strip().split("\n", 1)
        title = lines[0].strip("#").strip() if lines else "Recomendación"
        content = lines[1].strip() if len(lines) > 1 else part.strip()

        rec = Recommendation(
            id=rec_id,
            user_id=user_id,
            title=title,
            content=content,
            category=categories[i % len(categories)],
            timestamp=datetime.now(timezone.utc),
        )
        session.add(rec)
        recommendations.append(rec)

    await session.commit()
    for rec in recommendations:
        await session.refresh(rec)
    return recommendations


async def list_recommendations(session: AsyncSession, user_id: str) -> List[Recommendation]:
    result = await session.execute(
        select(Recommendation)
        .where(Recommendation.user_id == user_id)
        .order_by(Recommendation.timestamp.desc())
        .limit(100)
    )
    return list(result.scalars().all())
