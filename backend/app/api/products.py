from datetime import datetime
from decimal import Decimal
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.core.upload import save_upload
from app.models.product import Product, ProductCondition, SaleType
from app.models.user import User, UserRole
from app.services import product_service
from app.services.notification_service import notify

router = APIRouter(prefix="/products", tags=["products"])


class ProductCreate(BaseModel):
    title: str
    description: str
    condition: ProductCondition
    sale_type: SaleType
    price: Decimal
    categories: list[str] = []
    image_urls: list[str] = []
    ends_at: datetime | None = None


@router.get("")
async def list_products(
    q: str | None = None,
    category: str | None = None,
    condition: str | None = None,
    sale_type: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    seller_id: int | None = None,
    sort_by: str | None = None,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    return await product_service.list_products(
        q,
        category,
        condition,
        sale_type,
        min_price,
        max_price,
        seller_id,
        page,
        size,
        session,
        sort_by,
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
        body.title,
        body.description,
        body.condition,
        body.sale_type,
        body.price,
        body.categories,
        body.image_urls,
        body.ends_at,
        current_user.id,
        session,
    )


@router.put("/{product_id}")
async def update_product(
    product_id: int,
    body: ProductCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await product_service.update_product(
        product_id,
        body.title,
        body.description,
        body.condition,
        body.price,
        current_user.id,
        session,
    )


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    await product_service.delete_product(product_id, current_user.id, session)


class ReportRequest(BaseModel):
    reason: str
    comment: str | None = None


@router.post("/{product_id}/report", status_code=204)
async def report_product(
    product_id: int,
    body: ReportRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes reportar tu propio anuncio")
    mods = (
        await session.execute(
            select(User).where(User.role == UserRole.MODERATOR, User.is_active == True)  # noqa: E712
        )
    ).scalars().all()
    notif_title = f"Reporte: {product.title[:60]}"
    notif_body = f"Motivo: {body.reason}" + (f"\n{body.comment}" if body.comment else "")
    for mod in mods:
        await notify(mod.id, notif_title, notif_body, session)
    await session.commit()


@router.post("/upload-image", status_code=201)
async def upload_image(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
):
    upload_dir = Path(settings.UPLOAD_DIR) / "images"
    filename = await save_upload(file, upload_dir)
    return {"url": f"/uploads/images/{filename}"}
