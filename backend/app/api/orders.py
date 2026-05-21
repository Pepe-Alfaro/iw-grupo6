from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select as sa_select

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.order import Order, OrderStatus
from app.models.product import Product, ProductStatus
from app.models.user import User

router = APIRouter(prefix="/orders", tags=["orders"])


class OrderCreate(BaseModel):
    product_id: int


@router.post("", status_code=201)
async def create_order(
    body: OrderCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    product = await session.get(Product, body.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.status != ProductStatus.ACTIVE:
        raise HTTPException(status_code=409, detail="El producto no está disponible")
    if product.sale_type != "fixed":
        raise HTTPException(status_code=400, detail="Este producto es una subasta")
    if product.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes comprar tu propio producto")

    order = Order(
        product_id=product.id,
        buyer_id=current_user.id,
        seller_id=product.seller_id,
        amount=product.price,
        status=OrderStatus.PAID,
    )
    product.status = ProductStatus.SOLD
    session.add(order)
    session.add(product)
    await session.commit()
    await session.refresh(order)

    return {
        "id": order.id,
        "product_id": order.product_id,
        "buyer_id": order.buyer_id,
        "seller_id": order.seller_id,
        "amount": str(order.amount),
        "status": order.status,
        "created_at": order.created_at.isoformat(),
    }


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    order = await session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if current_user.id not in (order.buyer_id, order.seller_id):
        raise HTTPException(status_code=403, detail="Sin acceso")
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


@router.patch("/{order_id}/pay")
async def pay_order(
    order_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    order = await session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if order.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sin acceso")
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=409, detail="El pedido ya fue procesado")
    order.status = OrderStatus.PAID
    session.add(order)
    await session.commit()
    return {"status": order.status}
