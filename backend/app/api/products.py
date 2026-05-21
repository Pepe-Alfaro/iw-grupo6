from datetime import datetime
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.product import ProductCondition, SaleType
from app.models.user import User
from app.services import product_service

router = APIRouter(prefix="/products", tags=["products"])


class ProductCreate(BaseModel):
    title: str
    description: str
    condition: ProductCondition
    sale_type: SaleType
    price: Decimal
    categories: list[str] = []
    image_urls: list[str] = []
    ends_at: Optional[datetime] = None


@router.get("")
async def list_products(
    q: str | None = None,
    category: str | None = None,
    condition: str | None = None,
    sale_type: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    seller_id: int | None = None,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    return await product_service.list_products(
        q, category, condition, sale_type, min_price, max_price, seller_id, page, size, session
    )


@router.get("/{product_id}")
async def get_product(product_id: int, session: AsyncSession = Depends(get_session)):
    return await product_service.get_product(product_id, session)


@router.post("", status_code=201)
async def create_product(
    body: ProductCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await product_service.create_product(
        body.title, body.description, body.condition, body.sale_type,
        body.price, body.categories, body.image_urls, body.ends_at,
        current_user.id, session,
    )


@router.put("/{product_id}")
async def update_product(
    product_id: int,
    body: ProductCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await product_service.update_product(
        product_id, body.title, body.description, body.condition,
        body.price, current_user.id, session,
    )


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    await product_service.delete_product(product_id, current_user.id, session)
