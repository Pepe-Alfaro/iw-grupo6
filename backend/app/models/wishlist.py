from datetime import datetime

from sqlmodel import Field, SQLModel


class WishlistItem(SQLModel, table=True):
    __tablename__ = "wishlistitem"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    product_id: int | None = Field(default=None, foreign_key="product.id")
    search_query: str | None = Field(default=None, max_length=200)
    notify: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
