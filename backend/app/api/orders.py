from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])


class OrderCreate(BaseModel):
    product_id: int


@router.post("", status_code=201)
async def create_order(
    body: OrderCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await order_service.create_order(body.product_id, current_user.id, session)


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await order_service.get_order(order_id, current_user.id, session)


@router.patch("/{order_id}/pay")
async def pay_order(
    order_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await order_service.pay_order(order_id, current_user.id, session)
