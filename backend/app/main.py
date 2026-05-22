from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auctions, auth, messages, moderation, orders, products, reviews, users, wishlist
from app.core.config import settings
from app.tasks.auction_adjudicator import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="ReMarket API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(products.router, prefix=PREFIX)
app.include_router(auctions.router, prefix=PREFIX)
app.include_router(orders.router, prefix=PREFIX)
app.include_router(messages.router, prefix=PREFIX)
app.include_router(wishlist.router, prefix=PREFIX)
app.include_router(reviews.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(moderation.router, prefix=PREFIX)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
