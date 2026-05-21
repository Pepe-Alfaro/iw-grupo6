from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class PriceAlert(SQLModel, table=True):
    __tablename__ = "pricealert"

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    deviation_pct: float
    resolved: bool = Field(default=False)
    resolution: Optional[str] = Field(default=None, max_length=20)
    resolved_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
