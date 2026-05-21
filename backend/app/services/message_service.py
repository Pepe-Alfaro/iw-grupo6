from fastapi import HTTPException
from sqlalchemy import or_
from sqlmodel import select as sa_select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.message import Conversation, Message
from app.models.product import Product
from app.models.user import User


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


async def list_conversations(current_user_id: int, session: AsyncSession) -> list:
    convs = (
        await session.execute(
            sa_select(Conversation)
            .where(
                or_(
                    Conversation.participant_a_id == current_user_id,
                    Conversation.participant_b_id == current_user_id,
                )
            )
            .order_by(Conversation.created_at.desc())
        )
    ).scalars().all()

    result = []
    for conv in convs:
        other_id = (
            conv.participant_b_id if conv.participant_a_id == current_user_id else conv.participant_a_id
        )
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

        unread = (
            await session.execute(
                sa_select(Message).where(
                    Message.conversation_id == conv.id,
                    Message.sender_id != current_user_id,
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
            "unread_count": len(unread),
            "product_title": product.title if product else None,
        })

    return result


async def get_or_create_conversation(
    current_user_id: int,
    other_user_id: int,
    product_id: int | None,
    session: AsyncSession,
) -> dict:
    if other_user_id == current_user_id:
        raise HTTPException(status_code=400, detail="No puedes iniciar conversación contigo mismo")

    other = await session.get(User, other_user_id)
    if not other:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    a, b = sorted([current_user_id, other_user_id])
    existing = (
        await session.execute(
            sa_select(Conversation).where(
                Conversation.participant_a_id == a,
                Conversation.participant_b_id == b,
                Conversation.product_id == product_id,
            )
        )
    ).scalar_one_or_none()

    if existing:
        return {"id": existing.id}

    conv = Conversation(participant_a_id=a, participant_b_id=b, product_id=product_id)
    session.add(conv)
    await session.commit()
    await session.refresh(conv)
    return {"id": conv.id}


async def list_messages(conversation_id: int, current_user_id: int, session: AsyncSession) -> list:
    conv = await session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    if current_user_id not in (conv.participant_a_id, conv.participant_b_id):
        raise HTTPException(status_code=403, detail="Sin acceso")

    msgs = (
        await session.execute(
            sa_select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.sent_at.asc())
        )
    ).scalars().all()

    return [_fmt_message(m) for m in msgs]


async def send_message(
    conversation_id: int,
    content: str,
    sender_id: int,
    session: AsyncSession,
) -> dict:
    conv = await session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    if sender_id not in (conv.participant_a_id, conv.participant_b_id):
        raise HTTPException(status_code=403, detail="Sin acceso")

    content = content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")

    msg = Message(conversation_id=conversation_id, sender_id=sender_id, content=content)
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return _fmt_message(msg)


async def mark_read(conversation_id: int, current_user_id: int, session: AsyncSession) -> dict:
    conv = await session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    if current_user_id not in (conv.participant_a_id, conv.participant_b_id):
        raise HTTPException(status_code=403, detail="Sin acceso")

    msgs = (
        await session.execute(
            sa_select(Message).where(
                Message.conversation_id == conversation_id,
                Message.sender_id != current_user_id,
                Message.read == False,  # noqa: E712
            )
        )
    ).scalars().all()

    for m in msgs:
        m.read = True
        session.add(m)

    await session.commit()
    return {"updated": len(msgs)}
