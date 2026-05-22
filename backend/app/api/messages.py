from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import message_service

router = APIRouter(prefix="/conversations", tags=["messages"])


class ConversationCreate(BaseModel):
    other_user_id: int
    product_id: int | None = None


class MessageCreate(BaseModel):
    content: str


@router.get("")
async def list_conversations(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await message_service.list_conversations(current_user.id, session)


@router.post("", status_code=201)
async def create_or_get_conversation(
    body: ConversationCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await message_service.get_or_create_conversation(
        current_user.id, body.other_user_id, body.product_id, session
    )


@router.get("/{conversation_id}/messages")
async def list_messages(
    conversation_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await message_service.list_messages(conversation_id, current_user.id, session)


@router.post("/{conversation_id}/messages", status_code=201)
async def send_message(
    conversation_id: int,
    body: MessageCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await message_service.send_message(
        conversation_id, body.content, current_user.id, session
    )


@router.patch("/{conversation_id}/messages/read")
async def mark_read(
    conversation_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await message_service.mark_read(conversation_id, current_user.id, session)
