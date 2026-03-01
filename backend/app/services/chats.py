from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select, case, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ChatMessage, PatientProfile, User
from app.services.ai import AIService
from app.services.users import list_doctors


async def create_doctor_message(
    session: AsyncSession,
    *,
    sender_id: str,
    recipient_id: str,
    content: str,
    sender_name: str,
) -> ChatMessage:
    message = ChatMessage(
        id=str(uuid4()),
        sender_id=sender_id,
        recipient_id=recipient_id,
        content=content,
        chat_type="doctor",
        timestamp=datetime.now(timezone.utc),
        sender_name=sender_name,
        is_ai=False,
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)
    return message


async def create_ai_messages(
    session: AsyncSession,
    *,
    user_id: str,
    user_content: str,
) -> Tuple[ChatMessage, ChatMessage]:
    profile_result = await session.execute(
        select(PatientProfile).where(PatientProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()

    doctors = await list_doctors(session)
    ai_service = AIService()
    ai_response = await ai_service.chat_with_patient(
        user_id=user_id,
        user_message=user_content,
        profile=profile,
        doctors=doctors,
    )

    now = datetime.now(timezone.utc)
    user_msg = ChatMessage(
        id=str(uuid4()),
        sender_id=user_id,
        recipient_id=None,
        content=user_content,
        chat_type="ai",
        timestamp=now,
        sender_name="Usuario",
        is_ai=False,
    )
    ai_msg = ChatMessage(
        id=str(uuid4()),
        sender_id="ai",
        recipient_id=user_id,
        content=ai_response,
        chat_type="ai",
        timestamp=now,
        sender_name="Asistente AI",
        is_ai=True,
    )

    session.add_all([user_msg, ai_msg])
    await session.commit()
    await session.refresh(user_msg)
    await session.refresh(ai_msg)
    return user_msg, ai_msg


async def get_chat_messages(
    session: AsyncSession,
    *,
    chat_type: str,
    user_id: str,
    other_user_id: Optional[str] = None,
) -> List[ChatMessage]:
    if chat_type == "doctor":
        if not other_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="other_user_id required for doctor chats",
            )
        query = (
            select(ChatMessage)
            .where(
                ChatMessage.chat_type == "doctor",
                (
                    (ChatMessage.sender_id == user_id) & (ChatMessage.recipient_id == other_user_id)
                )
                | (
                    (ChatMessage.sender_id == other_user_id)
                    & (ChatMessage.recipient_id == user_id)
                ),
            )
            .order_by(ChatMessage.timestamp.asc())
            .limit(1000)
        )
    elif chat_type == "ai":
        query = (
            select(ChatMessage)
            .where(
                ChatMessage.chat_type == "ai",
                (ChatMessage.sender_id == user_id) | (ChatMessage.recipient_id == user_id),
            )
            .order_by(ChatMessage.timestamp.asc())
            .limit(1000)
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid chat type")

    result = await session.execute(query)
    return list(result.scalars().all())


async def list_doctor_chat_threads(
    session: AsyncSession,
    *,
    user_id: str,
    user_role: str,
) -> List[User]:
    if user_role not in {"patient", "doctor"}:
        return []

    other_id_expr = case(
        (ChatMessage.sender_id == user_id, ChatMessage.recipient_id),
        else_=ChatMessage.sender_id,
    )

    result = await session.execute(
        select(
            other_id_expr.label("other_id"),
            func.max(ChatMessage.timestamp).label("last_ts"),
        )
        .where(
            ChatMessage.chat_type == "doctor",
            (ChatMessage.sender_id == user_id) | (ChatMessage.recipient_id == user_id),
        )
        .group_by(other_id_expr)
        .order_by(func.max(ChatMessage.timestamp).desc())
    )

    rows = [(row[0], row[1]) for row in result.all() if row[0]]
    if not rows:
        return []

    user_ids = [row[0] for row in rows]
    users_result = await session.execute(select(User).where(User.id.in_(user_ids)))
    user_map = {user.id: user for user in users_result.scalars().all()}

    ordered_users: List[User] = []
    for other_id, _ in rows:
        user = user_map.get(other_id)
        if not user:
            continue
        if user_role == "patient" and user.role != "doctor":
            continue
        if user_role == "doctor" and user.role != "patient":
            continue
        ordered_users.append(user)

    return ordered_users
