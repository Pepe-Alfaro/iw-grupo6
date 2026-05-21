from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select as sa_select

from app.core.database import AsyncSessionLocal
from app.models.auction import Auction
from app.models.order import Order, OrderStatus
from app.models.product import Product, ProductStatus

scheduler = AsyncIOScheduler()


async def adjudicate_expired_auctions() -> None:
    async with AsyncSessionLocal() as session:
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


def start_scheduler() -> None:
    scheduler.add_job(
        adjudicate_expired_auctions,
        "interval",
        minutes=1,
        id="auction_adjudicator",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
