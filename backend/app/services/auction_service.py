from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.auction import Auction, Bid
from app.models.order import Order, OrderStatus
from app.models.product import Product, ProductStatus


async def get_auction(product_id: int, session: AsyncSession) -> Auction:
    result = await session.execute(select(Auction).where(Auction.product_id == product_id))
    auction = result.scalars().first()
    if not auction:
        raise HTTPException(status_code=404, detail="Subasta no encontrada")
    return auction


async def place_bid(product_id: int, amount: Decimal, bidder_id: int, session: AsyncSession) -> Bid:
    result = await session.execute(
        select(Auction).where(Auction.product_id == product_id).with_for_update()
    )
    auction = result.scalars().first()
    if not auction:
        raise HTTPException(status_code=404, detail="Subasta no encontrada")
    if auction.is_closed or datetime.utcnow() > auction.ends_at:
        raise HTTPException(status_code=400, detail="Subasta cerrada")
    if amount <= auction.current_bid:
        raise HTTPException(status_code=400, detail="La puja debe superar la puja actual")
    if auction.current_bidder_id == bidder_id:
        raise HTTPException(status_code=400, detail="Ya eres el pujador actual")

    auction.current_bid = amount
    auction.current_bidder_id = bidder_id
    bid = Bid(auction_id=auction.id, bidder_id=bidder_id, amount=amount)
    session.add(auction)
    session.add(bid)
    await session.commit()
    await session.refresh(bid)
    return bid


async def adjudicate_expired(session: AsyncSession) -> None:
    from sqlalchemy import select as sa_select

    auctions = (
        await session.execute(
            sa_select(Auction).where(
                Auction.ends_at <= datetime.utcnow(),
                Auction.is_closed == False,  # noqa: E712
            )
        )
    ).scalars().all()

    for auction in auctions:
        auction.is_closed = True
        product = await session.get(Product, auction.product_id)
        if not product:
            continue

        if auction.current_bidder_id:
            product.status = ProductStatus.SOLD
            session.add(
                Order(
                    product_id=auction.product_id,
                    buyer_id=auction.current_bidder_id,
                    seller_id=product.seller_id,
                    amount=auction.current_bid,
                    status=OrderStatus.PENDING,
                )
            )
        else:
            product.status = ProductStatus.ACTIVE

        session.add(auction)
        session.add(product)

    await session.commit()
