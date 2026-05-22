from datetime import datetime

from sqlmodel import Field, SQLModel


class Review(SQLModel, table=True):
    __tablename__ = "review"

    id: int | None = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id", index=True)
    reviewer_id: int = Field(foreign_key="user.id")
    reviewed_id: int = Field(foreign_key="user.id", index=True)
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
