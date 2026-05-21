from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select as sa_select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


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


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return _public(current_user)


@router.patch("/me")
async def update_me(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/me/transactions")
async def get_my_transactions(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    orders = (
        await session.execute(
            sa_select(Order)
            .where(
                (Order.buyer_id == current_user.id) | (Order.seller_id == current_user.id),
                Order.status != OrderStatus.CANCELLED,
            )
            .order_by(Order.created_at.desc())
        )
    ).scalars().all()

    result = []
    for o in orders:
        product = await session.get(Product, o.product_id)
        result.append({
            **o.model_dump(),
            "amount": str(o.amount),
            "role": "buyer" if o.buyer_id == current_user.id else "seller",
            "product": {
                "id": product.id,
                "title": product.title,
            } if product else None,
        })
    return result


@router.get("/{user_id}")
async def get_user(user_id: int, session: AsyncSession = Depends(get_session)):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return _public(user)
