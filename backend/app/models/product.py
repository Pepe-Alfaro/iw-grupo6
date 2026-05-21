from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class ProductStatus(str, Enum):
    ACTIVE = "active"
    SOLD = "sold"
    REMOVED = "removed"
    PENDING_REVIEW = "pending_review"


class SaleType(str, Enum):
    FIXED = "fixed"
    AUCTION = "auction"


class ProductCondition(str, Enum):
    NEW = "new"
    LIKE_NEW = "like_new"
    GOOD = "good"
    USED = "used"


class Product(SQLModel, table=True):
    __tablename__ = "product"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200, index=True)
    description: str = Field(max_length=2000)
    condition: ProductCondition
    sale_type: SaleType
    price: Decimal = Field(decimal_places=2, max_digits=10)
    status: ProductStatus = Field(default=ProductStatus.ACTIVE)
    seller_id: int = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProductImage(SQLModel, table=True):
    __tablename__ = "productimage"

    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    url: str
    is_main: bool = Field(default=False)
    sort_order: int = Field(default=0)


class ProductCategory(SQLModel, table=True):
    __tablename__ = "productcategory"

    product_id: int = Field(foreign_key="product.id", primary_key=True)
    category: str = Field(primary_key=True, max_length=50)
