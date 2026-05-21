from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select as sa_select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.order import Order, OrderStatus
from app.models.review import Review
from app.models.user import User

router = APIRouter(tags=["reviews"])


class ReviewCreate(BaseModel):
    order_id: int
    rating: int
    comment: str | None = None


@router.post("/reviews", status_code=201)
async def create_review(
    body: ReviewCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not (1 <= body.rating <= 5):
        raise HTTPException(status_code=422, detail="La valoración debe estar entre 1 y 5")

    order = await session.get(Order, body.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if order.status != OrderStatus.PAID:
        raise HTTPException(status_code=409, detail="Solo se pueden valorar pedidos completados")
    if current_user.id not in (order.buyer_id, order.seller_id):
        raise HTTPException(status_code=403, detail="Sin acceso")

    is_buyer = current_user.id == order.buyer_id
    if is_buyer and order.buyer_reviewed:
        raise HTTPException(status_code=409, detail="Ya has valorado este pedido")
    if not is_buyer and order.seller_reviewed:
        raise HTTPException(status_code=409, detail="Ya has valorado este pedido")

    reviewed_id = order.seller_id if is_buyer else order.buyer_id
    review = Review(
        order_id=order.id,
        reviewer_id=current_user.id,
        reviewed_id=reviewed_id,
        rating=body.rating,
        comment=body.comment,
    )
    session.add(review)

    if is_buyer:
        order.buyer_reviewed = True
    else:
        order.seller_reviewed = True
    session.add(order)

    # Update reviewed user's avg_rating
    reviewed_user = await session.get(User, reviewed_id)
    if reviewed_user:
        existing_reviews = (
            await session.execute(
                sa_select(Review).where(Review.reviewed_id == reviewed_id)
            )
        ).scalars().all()
        all_ratings = [r.rating for r in existing_reviews] + [body.rating]
        reviewed_user.avg_rating = round(sum(all_ratings) / len(all_ratings), 2)
        reviewed_user.total_reviews = len(all_ratings)
        session.add(reviewed_user)

    await session.commit()
    await session.refresh(review)
    return {
        "id": review.id,
        "order_id": review.order_id,
        "reviewer_id": review.reviewer_id,
        "reviewed_id": review.reviewed_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at.isoformat(),
    }


@router.get("/users/{user_id}/reviews")
async def get_user_reviews(
    user_id: int,
    session: AsyncSession = Depends(get_session),
):
    reviews = (
        await session.execute(
            sa_select(Review)
            .where(Review.reviewed_id == user_id)
            .order_by(Review.created_at.desc())
        )
    ).scalars().all()

    result = []
    for r in reviews:
        reviewer = await session.get(User, r.reviewer_id)
        result.append({
            "id": r.id,
            "order_id": r.order_id,
            "reviewer_id": r.reviewer_id,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat(),
            "reviewer": {
                "id": reviewer.id,
                "username": reviewer.username,
                "full_name": reviewer.full_name,
                "avatar_url": reviewer.avatar_url,
            } if reviewer else None,
        })
    return result
