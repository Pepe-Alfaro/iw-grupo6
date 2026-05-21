from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import auction_service

router = APIRouter(prefix="/auctions", tags=["auctions"])


class BidRequest(BaseModel):
    amount: Decimal


@router.get("/{product_id}")
async def get_auction(product_id: int, session: AsyncSession = Depends(get_session)):
    return await auction_service.get_auction(product_id, session)


@router.post("/{product_id}/bid", status_code=201)
async def place_bid(
    product_id: int,
    body: BidRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await auction_service.place_bid(product_id, body.amount, current_user.id, session)
