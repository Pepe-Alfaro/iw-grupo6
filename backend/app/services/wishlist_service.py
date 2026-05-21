from fastapi import HTTPException
from sqlmodel import select as sa_select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.product import Product, ProductImage
from app.models.wishlist import WishlistItem


def _fmt_product(p: Product, img_url: str | None) -> dict:
    return {
        "id": p.id,
        "title": p.title,
        "price": str(p.price),
        "condition": p.condition,
        "sale_type": p.sale_type,
        "status": p.status,
        "main_image_url": img_url,
    }


async def get_wishlist(current_user_id: int, session: AsyncSession) -> list:
    items = (
        await session.execute(
            sa_select(WishlistItem)
            .where(WishlistItem.user_id == current_user_id)
            .order_by(WishlistItem.created_at.desc())
        )
    ).scalars().all()

    result = []
    for item in items:
        product_data = None
        if item.product_id:
            product = await session.get(Product, item.product_id)
            if product:
                main_img = (
                    await session.execute(
                        sa_select(ProductImage)
                        .where(
                            ProductImage.product_id == item.product_id,
                            ProductImage.is_main == True,  # noqa: E712
                        )
                        .limit(1)
                    )
                ).scalar_one_or_none()
                if not main_img:
                    main_img = (
                        await session.execute(
                            sa_select(ProductImage)
                            .where(ProductImage.product_id == item.product_id)
                            .limit(1)
                        )
                    ).scalar_one_or_none()
                product_data = _fmt_product(product, main_img.url if main_img else None)

        result.append({
            "id": item.id,
            "user_id": item.user_id,
            "product_id": item.product_id,
            "search_query": item.search_query,
            "notify": item.notify,
            "created_at": item.created_at.isoformat(),
            "product": product_data,
        })

    return result


async def add_to_wishlist(
    current_user_id: int,
    product_id: int | None,
    search_query: str | None,
    notify: bool,
    session: AsyncSession,
) -> dict:
    if not product_id and not search_query:
        raise HTTPException(status_code=400, detail="Se requiere product_id o search_query")

    if product_id:
        product = await session.get(Product, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        existing = (
            await session.execute(
                sa_select(WishlistItem).where(
                    WishlistItem.user_id == current_user_id,
                    WishlistItem.product_id == product_id,
                )
            )
        ).scalar_one_or_none()
        if existing:
            return {"id": existing.id, "already_exists": True}

    item = WishlistItem(
        user_id=current_user_id,
        product_id=product_id,
        search_query=search_query,
        notify=notify,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return {"id": item.id}


async def remove_from_wishlist(item_id: int, current_user_id: int, session: AsyncSession) -> None:
    item = await session.get(WishlistItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    if item.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Sin acceso")
    await session.delete(item)
    await session.commit()


async def toggle_notify(item_id: int, current_user_id: int, session: AsyncSession) -> dict:
    item = await session.get(WishlistItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    if item.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Sin acceso")
    item.notify = not item.notify
    session.add(item)
    await session.commit()
    return {"notify": item.notify}
