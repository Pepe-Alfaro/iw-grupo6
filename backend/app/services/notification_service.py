from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.notification import Notification
from app.models.wishlist import WishlistItem


async def notify(user_id: int, title: str, body: str | None, session: AsyncSession) -> None:
    session.add(Notification(user_id=user_id, title=title, body=body))


async def notify_wishlist_users(
    product_id: int, title: str, body: str, session: AsyncSession
) -> None:
    result = await session.execute(
        select(WishlistItem).where(
            WishlistItem.product_id == product_id,
            WishlistItem.notify == True,  # noqa: E712
        )
    )
    for item in result.scalars().all():
        session.add(Notification(user_id=item.user_id, title=title, body=body))


async def list_notifications(user_id: int, session: AsyncSession) -> list[dict]:
    result = await session.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    notifs = result.scalars().all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "body": n.body,
            "read": n.read,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ]


async def mark_all_read(user_id: int, session: AsyncSession) -> int:
    result = await session.execute(
        select(Notification).where(
            Notification.user_id == user_id,
            Notification.read == False,  # noqa: E712
        )
    )
    notifs = result.scalars().all()
    for n in notifs:
        n.read = True
        session.add(n)
    await session.commit()
    return len(notifs)
