from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import review_service

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
    return await review_service.create_review(
        body.order_id, body.rating, body.comment, current_user.id, session
    )


@router.get("/users/{user_id}/reviews")
async def get_user_reviews(user_id: int, session: AsyncSession = Depends(get_session)):
    return await review_service.get_user_reviews(user_id, session)
