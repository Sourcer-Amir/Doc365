from __future__ import annotations

from datetime import datetime, timezone
from typing import List
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Document


async def create_document(
    session: AsyncSession,
    *,
    user_id: str,
    filename: str,
    file_data: str,
    file_type: str,
) -> Document:
    doc = Document(
        id=str(uuid4()),
        user_id=user_id,
        filename=filename,
        file_data=file_data,
        file_type=file_type,
        uploaded_at=datetime.now(timezone.utc),
    )
    session.add(doc)
    await session.commit()
    await session.refresh(doc)
    return doc


async def list_documents(session: AsyncSession, user_id: str) -> List[Document]:
    result = await session.execute(
        select(Document).where(Document.user_id == user_id).limit(100)
    )
    return list(result.scalars().all())


async def get_document(session: AsyncSession, user_id: str, doc_id: str) -> Document | None:
    result = await session.execute(
        select(Document).where(Document.user_id == user_id, Document.id == doc_id)
    )
    return result.scalar_one_or_none()
