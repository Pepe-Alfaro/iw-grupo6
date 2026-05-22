from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class ProductReport(SQLModel, table=True):
    __tablename__ = "product_report"

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id")
    reporter_id: int = Field(foreign_key="user.id")
    reason: str
    comment: Optional[str] = None
    reviewed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
