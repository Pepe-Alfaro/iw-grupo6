import uuid

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token, hash_password
from app.models.user import User, UserRole


def _uid() -> str:
    return uuid.uuid4().hex[:8]


async def _register(client: AsyncClient) -> str:
    uid = _uid()
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"user_{uid}@test.com",
            "username": f"user_{uid}",
            "password": "password123",
            "full_name": "Test User",
        },
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _create_moderator(session) -> str:
    uid = _uid()
    mod = User(
        email=f"mod_{uid}@test.com",
        username=f"mod_{uid}",
        hashed_password=hash_password("password123"),
        full_name="Test Moderator",
        role=UserRole.MODERATOR,
    )
    session.add(mod)
    await session.commit()
    await session.refresh(mod)
    return create_access_token(mod.id)


async def _create_product(client: AsyncClient, token: str) -> dict:
    resp = await client.post(
        "/api/v1/products",
        json={
            "title": "Producto de prueba",
            "description": "Descripción de prueba",
            "condition": "good",
            "sale_type": "fixed",
            "price": "50.00",
            "categories": ["otros"],
            "image_urls": [],
        },
        headers=_auth(token),
    )
    assert resp.status_code == 201
    return resp.json()


# ─── acceso sin permisos ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_moderation_no_auth(client: AsyncClient):
    resp = await client.get("/api/v1/moderation/alerts")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_moderation_client_role_forbidden(client: AsyncClient):
    token = await _register(client)
    resp = await client.get("/api/v1/moderation/alerts", headers=_auth(token))
    assert resp.status_code == 403


# ─── endpoints de moderación ─────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_moderator_list_alerts(client: AsyncClient, session):
    mod_token = await _create_moderator(session)
    resp = await client.get("/api/v1/moderation/alerts", headers=_auth(mod_token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_moderator_list_products(client: AsyncClient, session):
    mod_token = await _create_moderator(session)
    resp = await client.get("/api/v1/moderation/products", headers=_auth(mod_token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_moderator_remove_product(client: AsyncClient, session):
    seller_token = await _register(client)
    product = await _create_product(client, seller_token)
    mod_token = await _create_moderator(session)

    resp = await client.delete(
        f"/api/v1/moderation/products/{product['id']}",
        headers=_auth(mod_token),
    )
    assert resp.status_code == 204

    # El producto ya no aparece en el listado público (filtrado por status=active)
    listing = await client.get("/api/v1/products?q=prueba")
    active_ids = [p["id"] for p in listing.json()["items"]]
    assert product["id"] not in active_ids


@pytest.mark.asyncio
async def test_resolve_alert_invalid_resolution(client: AsyncClient, session):
    mod_token = await _create_moderator(session)
    seller_token = await _register(client)
    await _create_product(client, seller_token)

    # No hay alertas reales aquí, pero probamos la validación del campo
    resp = await client.patch(
        "/api/v1/moderation/alerts/999999",
        json={"resolution": "invalid"},
        headers=_auth(mod_token),
    )
    assert resp.status_code == 400


# ─── doble valoración ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_double_review_returns_409(client: AsyncClient):
    seller_token = await _register(client)
    buyer_token = await _register(client)

    # Vendedor crea producto
    product = await _create_product(client, seller_token)

    # Comprador crea la orden
    order_resp = await client.post(
        "/api/v1/orders",
        json={"product_id": product["id"]},
        headers=_auth(buyer_token),
    )
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]

    review_payload = {"order_id": order_id, "rating": 5, "comment": "Excelente"}

    # Primera valoración → ok
    resp1 = await client.post("/api/v1/reviews", json=review_payload, headers=_auth(buyer_token))
    assert resp1.status_code == 201

    # Segunda valoración → 409
    resp2 = await client.post("/api/v1/reviews", json=review_payload, headers=_auth(buyer_token))
    assert resp2.status_code == 409


@pytest.mark.asyncio
async def test_review_invalid_rating(client: AsyncClient):
    seller_token = await _register(client)
    buyer_token = await _register(client)
    product = await _create_product(client, seller_token)

    order_resp = await client.post(
        "/api/v1/orders",
        json={"product_id": product["id"]},
        headers=_auth(buyer_token),
    )
    order_id = order_resp.json()["id"]

    resp = await client.post(
        "/api/v1/reviews",
        json={"order_id": order_id, "rating": 6},
        headers=_auth(buyer_token),
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_review_requires_completed_order(client: AsyncClient):
    # Sin orden → 404
    token = await _register(client)
    resp = await client.post(
        "/api/v1/reviews",
        json={"order_id": 999999, "rating": 5},
        headers=_auth(token),
    )
    assert resp.status_code == 404
