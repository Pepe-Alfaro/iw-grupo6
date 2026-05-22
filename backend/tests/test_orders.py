import uuid
from datetime import datetime, timedelta
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.order import Order, OrderStatus


def _uid():
    return uuid.uuid4().hex[:8]


async def _register(client: AsyncClient) -> str:
    uid = _uid()
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"u_{uid}@t.com",
            "username": f"u_{uid}",
            "password": "pass123",
            "full_name": "Test",
        },
    )
    assert r.status_code == 201
    return r.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _product(client: AsyncClient, token: str, sale_type: str = "fixed") -> dict:
    payload: dict = {
        "title": "Prod test",
        "description": "Desc",
        "condition": "good",
        "sale_type": sale_type,
        "price": "50.00",
        "categories": ["test"],
        "image_urls": [],
    }
    if sale_type == "auction":
        payload["ends_at"] = (datetime.utcnow() + timedelta(hours=24)).isoformat()
    r = await client.post("/api/v1/products", json=payload, headers=_auth(token))
    assert r.status_code == 201
    return r.json()


# ─── create order ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_order_ok(client: AsyncClient):
    seller = await _register(client)
    buyer = await _register(client)
    prod = await _product(client, seller)

    r = await client.post("/api/v1/orders", json={"product_id": prod["id"]}, headers=_auth(buyer))
    assert r.status_code == 201
    body = r.json()
    assert body["product_id"] == prod["id"]
    assert body["status"] == "paid"
    assert body["buyer_reviewed"] is False


@pytest.mark.asyncio
async def test_create_order_product_not_found(client: AsyncClient):
    token = await _register(client)
    r = await client.post("/api/v1/orders", json={"product_id": 999999}, headers=_auth(token))
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_create_order_own_product(client: AsyncClient):
    token = await _register(client)
    prod = await _product(client, token)
    r = await client.post("/api/v1/orders", json={"product_id": prod["id"]}, headers=_auth(token))
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_create_order_already_sold(client: AsyncClient):
    seller = await _register(client)
    b1 = await _register(client)
    b2 = await _register(client)
    prod = await _product(client, seller)

    await client.post("/api/v1/orders", json={"product_id": prod["id"]}, headers=_auth(b1))
    r = await client.post("/api/v1/orders", json={"product_id": prod["id"]}, headers=_auth(b2))
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_create_order_auction_type(client: AsyncClient):
    seller = await _register(client)
    buyer = await _register(client)
    prod = await _product(client, seller, sale_type="auction")
    r = await client.post("/api/v1/orders", json={"product_id": prod["id"]}, headers=_auth(buyer))
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_create_order_requires_auth(client: AsyncClient):
    seller = await _register(client)
    prod = await _product(client, seller)
    r = await client.post("/api/v1/orders", json={"product_id": prod["id"]})
    assert r.status_code == 403


# ─── get order ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_order_ok(client: AsyncClient):
    seller = await _register(client)
    buyer = await _register(client)
    prod = await _product(client, seller)
    order_r = await client.post(
        "/api/v1/orders", json={"product_id": prod["id"]}, headers=_auth(buyer)
    )
    order_id = order_r.json()["id"]

    r = await client.get(f"/api/v1/orders/{order_id}", headers=_auth(buyer))
    assert r.status_code == 200
    assert r.json()["id"] == order_id


@pytest.mark.asyncio
async def test_get_order_seller_can_see(client: AsyncClient):
    seller = await _register(client)
    buyer = await _register(client)
    prod = await _product(client, seller)
    order_r = await client.post(
        "/api/v1/orders", json={"product_id": prod["id"]}, headers=_auth(buyer)
    )
    order_id = order_r.json()["id"]

    r = await client.get(f"/api/v1/orders/{order_id}", headers=_auth(seller))
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_get_order_not_found(client: AsyncClient):
    token = await _register(client)
    r = await client.get("/api/v1/orders/999999", headers=_auth(token))
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_get_order_forbidden(client: AsyncClient):
    seller = await _register(client)
    buyer = await _register(client)
    other = await _register(client)
    prod = await _product(client, seller)
    order_r = await client.post(
        "/api/v1/orders", json={"product_id": prod["id"]}, headers=_auth(buyer)
    )
    order_id = order_r.json()["id"]

    r = await client.get(f"/api/v1/orders/{order_id}", headers=_auth(other))
    assert r.status_code == 403


# ─── pay order ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_pay_already_paid_order(client: AsyncClient):
    seller = await _register(client)
    buyer = await _register(client)
    prod = await _product(client, seller)
    order_r = await client.post(
        "/api/v1/orders", json={"product_id": prod["id"]}, headers=_auth(buyer)
    )
    order_id = order_r.json()["id"]

    r = await client.patch(f"/api/v1/orders/{order_id}/pay", headers=_auth(buyer))
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_pay_order_not_found(client: AsyncClient):
    token = await _register(client)
    r = await client.patch("/api/v1/orders/999999/pay", headers=_auth(token))
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_pay_order_wrong_buyer(client: AsyncClient):
    seller = await _register(client)
    buyer = await _register(client)
    other = await _register(client)
    prod = await _product(client, seller)
    order_r = await client.post(
        "/api/v1/orders", json={"product_id": prod["id"]}, headers=_auth(buyer)
    )
    order_id = order_r.json()["id"]

    r = await client.patch(f"/api/v1/orders/{order_id}/pay", headers=_auth(other))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_pay_pending_order(client: AsyncClient, session: AsyncSession):
    seller = await _register(client)
    buyer = await _register(client)
    prod = await _product(client, seller)

    seller_me = await client.get("/api/v1/users/me", headers=_auth(seller))
    buyer_me = await client.get("/api/v1/users/me", headers=_auth(buyer))

    order = Order(
        product_id=prod["id"],
        buyer_id=buyer_me.json()["id"],
        seller_id=seller_me.json()["id"],
        amount=Decimal("50.00"),
        status=OrderStatus.PENDING,
    )
    session.add(order)
    await session.flush()

    r = await client.patch(f"/api/v1/orders/{order.id}/pay", headers=_auth(buyer))
    assert r.status_code == 200
    assert r.json()["status"] == "paid"
