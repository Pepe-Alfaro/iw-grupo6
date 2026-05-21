from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select as sa_select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.message import Conversation, Message
from app.models.product import Product
from app.models.user import User

router = APIRouter(prefix="/conversations", tags=["messages"])


class ConversationCreate(BaseModel):
    other_user_id: int
    product_id: int | None = None


class MessageCreate(BaseModel):
    content: str


def _fmt_user(u: User) -> dict:
    return {"id": u.id, "username": u.username, "full_name": u.full_name, "avatar_url": u.avatar_url}


def _fmt_message(m: Message) -> dict:
    return {
        "id": m.id,
        "conversation_id": m.conversation_id,
        "sender_id": m.sender_id,
        "content": m.content,
        "sent_at": m.sent_at.isoformat(),
        "read": m.read,
    }


@router.get("")
async def list_conversations(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    convs = (
        await session.execute(
            sa_select(Conversation)
            .where(
                or_(
                    Conversation.participant_a_id == current_user.id,
                    Conversation.participant_b_id == current_user.id,
                )
            )
            .order_by(Conversation.created_at.desc())
        )
    ).scalars().all()

    result = []
    for conv in convs:
        other_id = conv.participant_b_id if conv.participant_a_id == current_user.id else conv.participant_a_id
        other_user = await session.get(User, other_id)
        if not other_user:
            continue

        last_msg = (
            await session.execute(
                sa_select(Message)
                .where(Message.conversation_id == conv.id)
                .order_by(Message.sent_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()

        unread_count = (
            await session.execute(
                sa_select(Message)
                .where(
                    Message.conversation_id == conv.id,
                    Message.sender_id != current_user.id,
                    Message.read == False,  # noqa: E712
                )
            )
        ).scalars().all()

        product = await session.get(Product, conv.product_id) if conv.product_id else None

        result.append({
            "id": conv.id,
            "participant_a_id": conv.participant_a_id,
            "participant_b_id": conv.participant_b_id,
            "product_id": conv.product_id,
            "created_at": conv.created_at.isoformat(),
            "other_user": _fmt_user(other_user),
            "last_message": _fmt_message(last_msg) if last_msg else None,
            "unread_count": len(unread_count),
            "product_title": product.title if product else None,
        })

    return result


@router.post("", status_code=201)
async def create_or_get_conversation(
    body: ConversationCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if body.other_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes iniciar conversación contigo mismo")

    other = await session.get(User, body.other_user_id)
    if not other:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Check if a conversation between the two about the same product already exists
    a, b = sorted([current_user.id, body.other_user_id])
    existing = (
        await session.execute(
            sa_select(Conversation).where(
                Conversation.participant_a_id == a,
                Conversation.participant_b_id == b,
                Conversation.product_id == body.product_id,
            )
        )
    ).scalar_one_or_none()

    if existing:
        return {"id": existing.id}

    conv = Conversation(
        participant_a_id=a,
        participant_b_id=b,
        product_id=body.product_id,
    )
    session.add(conv)
    await session.commit()
    await session.refresh(conv)
    return {"id": conv.id}


@router.get("/{conversation_id}/messages")
async def list_messages(
    conversation_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    conv = await session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    if current_user.id not in (conv.participant_a_id, conv.participant_b_id):
        raise HTTPException(status_code=403, detail="Sin acceso")

    msgs = (
        await session.execute(
            sa_select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.sent_at.asc())
        )
    ).scalars().all()

    return [_fmt_message(m) for m in msgs]


@router.post("/{conversation_id}/messages", status_code=201)
async def send_message(
    conversation_id: int,
    body: MessageCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    conv = await session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    if current_user.id not in (conv.participant_a_id, conv.participant_b_id):
        raise HTTPException(status_code=403, detail="Sin acceso")

    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")

    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=content,
    )
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return _fmt_message(msg)


@router.patch("/{conversation_id}/messages/read")
async def mark_read(
    conversation_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    conv = await session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    if current_user.id not in (conv.participant_a_id, conv.participant_b_id):
        raise HTTPException(status_code=403, detail="Sin acceso")

    msgs = (
        await session.execute(
            sa_select(Message).where(
                Message.conversation_id == conversation_id,
                Message.sender_id != current_user.id,
                Message.read == False,  # noqa: E712
            )
        )
    ).scalars().all()

    for m in msgs:
        m.read = True
        session.add(m)

    await session.commit()
    return {"updated": len(msgs)}
