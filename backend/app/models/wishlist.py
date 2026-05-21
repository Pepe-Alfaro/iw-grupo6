from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class WishlistItem(SQLModel, table=True):
    __tablename__ = "wishlistitem"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    product_id: Optional[int] = Field(default=None, foreign_key="product.id")
    search_query: Optional[str] = Field(default=None, max_length=200)
    notify: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
