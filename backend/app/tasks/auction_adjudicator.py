from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.database import AsyncSessionLocal
from app.services import auction_service

scheduler = AsyncIOScheduler()


async def adjudicate_expired_auctions() -> None:
    async with AsyncSessionLocal() as session:
        await auction_service.adjudicate_expired(session)


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
