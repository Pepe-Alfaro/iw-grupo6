from fastapi import HTTPException
from sqlalchemy import or_
from sqlmodel import select as sa_select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User


def _public(u: User) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "username": u.username,
        "full_name": u.full_name,
        "avatar_url": u.avatar_url,
        "role": u.role,
        "avg_rating": u.avg_rating,
        "total_reviews": u.total_reviews,
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat(),
    }


async def get_user(user_id: int, session: AsyncSession) -> dict:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return _public(user)


async def update_me(user_id: int, full_name: str, session: AsyncSession) -> dict:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.full_name = full_name.strip()
    session.add(user)
    await session.commit()
    return _public(user)


async def change_password(
    user_id: int, current_password: str, new_password: str, session: AsyncSession
) -> None:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    user.hashed_password = hash_password(new_password)
    session.add(user)
    await session.commit()


async def get_my_transactions(current_user_id: int, session: AsyncSession) -> list:
    orders = (
        (
            await session.execute(
                sa_select(Order)
                .where(
                    or_(Order.buyer_id == current_user_id, Order.seller_id == current_user_id),
                    Order.status != OrderStatus.CANCELLED,
                )
                .order_by(Order.created_at.desc())
            )
        )
        .scalars()
        .all()
    )

    result = []
    for o in orders:
        product = await session.get(Product, o.product_id)
        result.append(
            {
                **o.model_dump(),
                "amount": str(o.amount),
                "role": "buyer" if o.buyer_id == current_user_id else "seller",
                "product": {"id": product.id, "title": product.title} if product else None,
            }
        )
    return result
