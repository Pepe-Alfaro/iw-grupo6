from collections import defaultdict
from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, select as sa_select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.auction import Auction
from app.models.price_alert import PriceAlert
from app.models.product import (
    Product,
    ProductCategory,
    ProductCondition,
    ProductImage,
    ProductStatus,
    SaleType,
)
from app.models.user import User


def _user_public(u: User) -> dict:
    return {
        "id": u.id,
        "username": u.username,
        "full_name": u.full_name,
        "avatar_url": u.avatar_url,
        "avg_rating": u.avg_rating,
        "total_reviews": u.total_reviews,
    }


async def enrich(products: list[Product], session: AsyncSession) -> list[dict]:
    if not products:
        return []
    ids = [p.id for p in products]
    seller_ids = list({p.seller_id for p in products})

    imgs = (
        await session.execute(sa_select(ProductImage).where(ProductImage.product_id.in_(ids)))
    ).scalars().all()
    cats = (
        await session.execute(sa_select(ProductCategory).where(ProductCategory.product_id.in_(ids)))
    ).scalars().all()
    sellers = (
        await session.execute(sa_select(User).where(User.id.in_(seller_ids)))
    ).scalars().all()

    imgs_by_id: dict[int, list] = defaultdict(list)
    for img in imgs:
        imgs_by_id[img.product_id].append(
            {"id": img.id, "url": img.url, "is_main": img.is_main, "sort_order": img.sort_order}
        )
    cats_by_id: dict[int, list] = defaultdict(list)
    for cat in cats:
        cats_by_id[cat.product_id].append(cat.category)
    sellers_by_id = {u.id: u for u in sellers}

    return [
        {
            **p.model_dump(),
            "price": str(p.price),
            "images": imgs_by_id[p.id],
            "categories": cats_by_id[p.id],
            "seller": _user_public(sellers_by_id[p.seller_id]) if p.seller_id in sellers_by_id else None,
        }
        for p in products
    ]


async def _compute_median_deviation(
    price: Decimal,
    categories: list[str],
    session: AsyncSession,
) -> float | None:
    if not categories:
        return None
    subq = (
        sa_select(ProductCategory.product_id)
        .where(ProductCategory.category.in_([c.lower() for c in categories]))
        .scalar_subquery()
    )
    prices = (
        await session.execute(
            sa_select(Product.price).where(
                Product.id.in_(subq),
                Product.status == ProductStatus.ACTIVE,
            )
        )
    ).scalars().all()
    if not prices:
        return None
    sorted_prices = sorted(float(p) for p in prices)
    n = len(sorted_prices)
    median = (
        sorted_prices[n // 2]
        if n % 2
        else (sorted_prices[n // 2 - 1] + sorted_prices[n // 2]) / 2
    )
    if median == 0:
        return None
    return ((float(price) - median) / median) * 100


async def list_products(
    q: str | None,
    category: str | None,
    condition: str | None,
    sale_type: str | None,
    min_price: float | None,
    max_price: float | None,
    seller_id: int | None,
    page: int,
    size: int,
    session: AsyncSession,
) -> dict:
    conds = [Product.status == ProductStatus.ACTIVE]
    if q:
        conds.append(Product.title.ilike(f"%{q}%"))
    if condition:
        conds.append(Product.condition == condition)
    if sale_type:
        conds.append(Product.sale_type == sale_type)
    if min_price is not None:
        conds.append(Product.price >= Decimal(str(min_price)))
    if max_price is not None:
        conds.append(Product.price <= Decimal(str(max_price)))
    if seller_id:
        conds.append(Product.seller_id == seller_id)
    if category:
        subq = (
            sa_select(ProductCategory.product_id)
            .where(ProductCategory.category == category.lower())
            .scalar_subquery()
        )
        conds.append(Product.id.in_(subq))

    total = (
        await session.execute(sa_select(func.count(Product.id)).where(*conds))
    ).scalar_one()

    products = (
        await session.execute(
            sa_select(Product)
            .where(*conds)
            .order_by(Product.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
    ).scalars().all()

    items = await enrich(list(products), session)
    return {"items": items, "total": total, "page": page, "size": size, "pages": -(-total // size)}


async def get_product(product_id: int, session: AsyncSession) -> dict:
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    enriched = await enrich([product], session)
    return enriched[0]


async def create_product(
    title: str,
    description: str,
    condition: ProductCondition,
    sale_type: SaleType,
    price: Decimal,
    categories: list[str],
    image_urls: list[str],
    ends_at: datetime | None,
    seller_id: int,
    session: AsyncSession,
) -> dict:
    if sale_type == SaleType.AUCTION and not ends_at:
        raise HTTPException(status_code=422, detail="ends_at es obligatorio para subastas")

    deviation = await _compute_median_deviation(price, categories, session)
    needs_review = deviation is not None and deviation > settings.PRICE_ALERT_THRESHOLD_PCT
    status = ProductStatus.PENDING_REVIEW if needs_review else ProductStatus.ACTIVE

    now = datetime.utcnow()
    product = Product(
        title=title,
        description=description,
        condition=condition,
        sale_type=sale_type,
        price=price,
        status=status,
        seller_id=seller_id,
        created_at=now,
        updated_at=now,
    )
    session.add(product)
    await session.flush()

    for i, url in enumerate(image_urls):
        session.add(ProductImage(product_id=product.id, url=url, is_main=(i == 0), sort_order=i))
    for cat in categories:
        session.add(ProductCategory(product_id=product.id, category=cat.lower()))

    if sale_type == SaleType.AUCTION:
        session.add(Auction(product_id=product.id, ends_at=ends_at, current_bid=price))
    if needs_review and deviation is not None:
        session.add(PriceAlert(product_id=product.id, deviation_pct=deviation))

    await session.commit()
    await session.refresh(product)
    enriched = await enrich([product], session)
    return enriched[0]


async def update_product(
    product_id: int,
    title: str,
    description: str,
    condition: ProductCondition,
    price: Decimal,
    current_user_id: int,
    session: AsyncSession,
) -> dict:
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.seller_id != current_user_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    product.title = title
    product.description = description
    product.condition = condition
    product.price = price
    product.updated_at = datetime.utcnow()
    session.add(product)
    await session.commit()
    await session.refresh(product)
    enriched = await enrich([product], session)
    return enriched[0]


async def delete_product(product_id: int, current_user_id: int, session: AsyncSession) -> None:
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.seller_id != current_user_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    product.status = ProductStatus.REMOVED
    session.add(product)
    await session.commit()
