from fastapi import HTTPException
from sqlmodel import select as sa_select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.price_alert import PriceAlert
from app.models.product import Product, ProductCategory, ProductImage, ProductStatus
from app.models.report import ProductReport
from app.models.user import User
from app.services.notification_service import notify, notify_wishlist_users


async def list_alerts(session: AsyncSession) -> list:
    alerts = (
        (
            await session.execute(
                sa_select(PriceAlert)
                .where(PriceAlert.resolved == False)  # noqa: E712
                .order_by(PriceAlert.created_at.desc())
            )
        )
        .scalars()
        .all()
    )

    result = []
    for alert in alerts:
        product = await session.get(Product, alert.product_id)
        seller = await session.get(User, product.seller_id) if product else None
        main_img = (
            await session.execute(
                sa_select(ProductImage).where(ProductImage.product_id == alert.product_id).limit(1)
            )
        ).scalar_one_or_none()
        cats = (
            (
                await session.execute(
                    sa_select(ProductCategory).where(ProductCategory.product_id == alert.product_id)
                )
            )
            .scalars()
            .all()
        )

        result.append(
            {
                "id": alert.id,
                "product_id": alert.product_id,
                "deviation_pct": round(alert.deviation_pct, 1),
                "created_at": alert.created_at.isoformat(),
                "product": {
                    "id": product.id,
                    "title": product.title,
                    "price": str(product.price),
                    "status": product.status,
                    "main_image_url": main_img.url if main_img else None,
                    "categories": [c.category for c in cats],
                    "seller_username": seller.username if seller else None,
                }
                if product
                else None,
            }
        )
    return result


async def resolve_alert(alert_id: int, resolution: str, mod_id: int, session: AsyncSession) -> dict:
    if resolution not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="resolution debe ser 'approved' o 'rejected'")

    alert = await session.get(PriceAlert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    product = await session.get(Product, alert.product_id)
    if product and product.status == ProductStatus.PENDING_REVIEW:
        product.status = ProductStatus.ACTIVE if resolution == "approved" else ProductStatus.REMOVED
        session.add(product)

    alert.resolved = True
    alert.resolution = resolution
    alert.resolved_by = mod_id
    session.add(alert)
    await session.commit()

    if product:
        if resolution == "approved":
            await notify(
                product.seller_id,
                "Anuncio aprobado",
                f'Tu anuncio "{product.title}" ha sido revisado y publicado.',
                session,
            )
            await notify_wishlist_users(
                product.id,
                f"Disponible: {product.title}",
                f"Un artículo de tu wishlist ya está a la venta por {product.price} €",
                session,
            )
        else:
            await notify(
                product.seller_id,
                "Anuncio retirado",
                f'Tu anuncio "{product.title}" ha sido retirado por precio inusual.',
                session,
            )
        await session.commit()

    return {"id": alert.id, "resolution": alert.resolution}


async def list_all_products(session: AsyncSession) -> list:
    products = (
        (await session.execute(sa_select(Product).order_by(Product.created_at.desc()).limit(200)))
        .scalars()
        .all()
    )

    result = []
    for p in products:
        seller = await session.get(User, p.seller_id)
        result.append(
            {
                "id": p.id,
                "title": p.title,
                "price": str(p.price),
                "status": p.status,
                "sale_type": p.sale_type,
                "created_at": p.created_at.isoformat(),
                "seller_username": seller.username if seller else None,
            }
        )
    return result


async def list_reports(session: AsyncSession) -> list:
    reports = (
        (
            await session.execute(
                sa_select(ProductReport)
                .where(ProductReport.reviewed == False)  # noqa: E712
                .order_by(ProductReport.created_at.desc())
            )
        )
        .scalars()
        .all()
    )

    result = []
    for r in reports:
        product = await session.get(Product, r.product_id)
        reporter = await session.get(User, r.reporter_id)
        result.append(
            {
                "id": r.id,
                "reason": r.reason,
                "comment": r.comment,
                "created_at": r.created_at.isoformat(),
                "product_id": r.product_id,
                "product_title": product.title if product else None,
                "reporter_username": reporter.username if reporter else None,
            }
        )
    return result


async def mark_report_reviewed(report_id: int, session: AsyncSession) -> None:
    report = await session.get(ProductReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Denuncia no encontrada")
    report.reviewed = True
    session.add(report)
    await session.commit()


async def remove_product(product_id: int, session: AsyncSession) -> None:
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    product.status = ProductStatus.REMOVED
    session.add(product)
    await session.commit()
    await notify(
        product.seller_id,
        "Anuncio eliminado por moderación",
        f'Tu anuncio "{product.title}" ha sido eliminado por el equipo de moderación.',
        session,
    )
    await session.commit()
