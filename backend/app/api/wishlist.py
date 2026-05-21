from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import wishlist_service

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


class WishlistAdd(BaseModel):
    product_id: int | None = None
    search_query: str | None = None
    notify: bool = True


@router.get("")
async def get_wishlist(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await wishlist_service.get_wishlist(current_user.id, session)


@router.post("", status_code=201)
async def add_to_wishlist(
    body: WishlistAdd,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await wishlist_service.add_to_wishlist(
        current_user.id, body.product_id, body.search_query, body.notify, session
    )


@router.delete("/{item_id}", status_code=204)
async def remove_from_wishlist(
    item_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    await wishlist_service.remove_from_wishlist(item_id, current_user.id, session)


@router.patch("/{item_id}/notify")
async def toggle_notify(
    item_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await wishlist_service.toggle_notify(item_id, current_user.id, session)
