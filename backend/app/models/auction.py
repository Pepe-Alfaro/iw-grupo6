from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import Field, SQLModel


class Auction(SQLModel, table=True):
    __tablename__ = "auction"

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", unique=True, index=True)
    current_bid: Decimal = Field(default=Decimal("0"), decimal_places=2, max_digits=10)
    current_bidder_id: Optional[int] = Field(default=None, foreign_key="user.id")
    ends_at: datetime
    is_closed: bool = Field(default=False)


class Bid(SQLModel, table=True):
    __tablename__ = "bid"

    id: Optional[int] = Field(default=None, primary_key=True)
    auction_id: int = Field(foreign_key="auction.id", index=True)
    bidder_id: int = Field(foreign_key="user.id")
    amount: Decimal = Field(decimal_places=2, max_digits=10)
    placed_at: datetime = Field(default_factory=datetime.utcnow)
