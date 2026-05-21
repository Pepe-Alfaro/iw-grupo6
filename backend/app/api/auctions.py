from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from decimal import Decimal
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.auction import Auction, Bid
from datetime import datetime

router = APIRouter(prefix="/auctions", tags=["auctions"])


class BidRequest(BaseModel):
    amount: Decimal


@router.get("/{product_id}")
async def get_auction(product_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.exec(select(Auction).where(Auction.product_id == product_id))
    auction = result.first()
    if not auction:
        raise HTTPException(status_code=404, detail="Subasta no encontrada")
    return auction


@router.post("/{product_id}/bid", status_code=201)
async def place_bid(
    product_id: int,
    body: BidRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.exec(
        select(Auction).where(Auction.product_id == product_id).with_for_update()
    )
    auction = result.first()
    if not auction:
        raise HTTPException(status_code=404, detail="Subasta no encontrada")
    if auction.is_closed or datetime.utcnow() > auction.ends_at:
        raise HTTPException(status_code=400, detail="Subasta cerrada")
    if body.amount <= auction.current_bid:
        raise HTTPException(status_code=400, detail="La puja debe superar la puja actual")
    if auction.current_bidder_id == current_user.id:
        raise HTTPException(status_code=400, detail="Ya eres el pujador actual")

    auction.current_bid = body.amount
    auction.current_bidder_id = current_user.id
    bid = Bid(auction_id=auction.id, bidder_id=current_user.id, amount=body.amount)
    session.add(auction)
    session.add(bid)
    await session.commit()
    await session.refresh(bid)
    return bid
