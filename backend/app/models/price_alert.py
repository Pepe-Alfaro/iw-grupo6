from datetime import datetime

from sqlmodel import Field, SQLModel


class PriceAlert(SQLModel, table=True):
    __tablename__ = "pricealert"

    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    deviation_pct: float
    resolved: bool = Field(default=False)
    resolution: str | None = Field(default=None, max_length=20)
    resolved_by: int | None = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
