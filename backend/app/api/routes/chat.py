from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.schemas.chat import ChatMessageCreate, ChatMessageOut
from app.schemas.users import UserOut
from app.services.chats import (
    create_doctor_message,
    create_ai_messages,
    get_chat_messages,
    list_doctor_chat_threads,
)
from app.services.users import get_user_by_id

router = APIRouter()


@router.post("/chat")
async def send_message(
    message_data: ChatMessageCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if message_data.chat_type == "doctor":
        if not message_data.recipient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Recipient ID required for doctor chats",
            )

        sender_user = await get_user_by_id(db, current_user["user_id"])
        if (
            sender_user
            and sender_user.role == "doctor"
            and not bool(getattr(sender_user, "is_verified", False))
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Doctor must complete verification before starting consultations",
            )

        msg = await create_doctor_message(
            db,
            sender_id=current_user["user_id"],
            recipient_id=message_data.recipient_id,
            content=message_data.content,
            sender_name=current_user.get("email", "Unknown"),
        )
        return ChatMessageOut.model_validate(msg)

    if message_data.chat_type == "ai":
        user = await get_user_by_id(db, current_user["user_id"])
        if not user or user.role != "patient":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="AI only for patients")
        if not user.ai_consent:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="AI consent required")
        user_msg, ai_msg = await create_ai_messages(
            db,
            user_id=current_user["user_id"],
            user_content=message_data.content,
        )
        return {
            "user_message": ChatMessageOut.model_validate(user_msg),
            "ai_response": ChatMessageOut.model_validate(ai_msg),
        }

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid chat type")


@router.get("/chat/{chat_type}", response_model=list[ChatMessageOut])
async def get_messages(
    chat_type: str,
    other_user_id: str | None = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if chat_type == "ai":
        user = await get_user_by_id(db, current_user["user_id"])
        if not user or user.role != "patient":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="AI only for patients")
        if not user.ai_consent:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="AI consent required")
    messages = await get_chat_messages(
        db,
        chat_type=chat_type,
        user_id=current_user["user_id"],
        other_user_id=other_user_id,
    )
    return [ChatMessageOut.model_validate(msg) for msg in messages]


@router.get("/chat/doctor/threads", response_model=list[UserOut])
async def get_doctor_chat_threads(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    threads = await list_doctor_chat_threads(
        db,
        user_id=current_user["user_id"],
        user_role=current_user.get("role", ""),
    )
    return [UserOut.model_validate(user) for user in threads]
