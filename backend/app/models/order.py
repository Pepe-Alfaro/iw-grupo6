from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlmodel import Field, SQLModel


class OrderStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"


class Order(SQLModel, table=True):
    __tablename__ = "order"

    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id")
    buyer_id: int = Field(foreign_key="user.id", index=True)
    seller_id: int = Field(foreign_key="user.id", index=True)
    amount: Decimal = Field(decimal_places=2, max_digits=10)
    status: OrderStatus = Field(default=OrderStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    buyer_reviewed: bool = Field(default=False)
    seller_reviewed: bool = Field(default=False)
