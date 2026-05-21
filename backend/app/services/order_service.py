from fastapi import HTTPException
from sqlalchemy import or_
from sqlmodel import select as sa_select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.order import Order, OrderStatus
from app.models.product import Product, ProductStatus, SaleType


def _fmt_order(order: Order) -> dict:
    return {
        "id": order.id,
        "product_id": order.product_id,
        "buyer_id": order.buyer_id,
        "seller_id": order.seller_id,
        "amount": str(order.amount),
        "status": order.status,
        "created_at": order.created_at.isoformat(),
        "buyer_reviewed": order.buyer_reviewed,
        "seller_reviewed": order.seller_reviewed,
    }


async def create_order(product_id: int, buyer_id: int, session: AsyncSession) -> dict:
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.status != ProductStatus.ACTIVE:
        raise HTTPException(status_code=409, detail="El producto no está disponible")
    if product.sale_type != SaleType.FIXED:
        raise HTTPException(status_code=400, detail="Este producto es una subasta")
    if product.seller_id == buyer_id:
        raise HTTPException(status_code=400, detail="No puedes comprar tu propio producto")

    order = Order(
        product_id=product.id,
        buyer_id=buyer_id,
        seller_id=product.seller_id,
        amount=product.price,
        status=OrderStatus.PAID,
    )
    product.status = ProductStatus.SOLD
    session.add(order)
    session.add(product)
    await session.commit()
    await session.refresh(order)
    return _fmt_order(order)


async def get_order(order_id: int, current_user_id: int, session: AsyncSession) -> dict:
    order = await session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if current_user_id not in (order.buyer_id, order.seller_id):
        raise HTTPException(status_code=403, detail="Sin acceso")
    return _fmt_order(order)


async def pay_order(order_id: int, buyer_id: int, session: AsyncSession) -> dict:
    order = await session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if order.buyer_id != buyer_id:
        raise HTTPException(status_code=403, detail="Sin acceso")
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=409, detail="El pedido ya fue procesado")
    order.status = OrderStatus.PAID
    session.add(order)
    await session.commit()
    return {"status": order.status}
