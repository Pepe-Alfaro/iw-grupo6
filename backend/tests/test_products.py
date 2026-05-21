import uuid

import pytest
from httpx import AsyncClient


def _uid() -> str:
    return uuid.uuid4().hex[:8]


async def _register(client: AsyncClient) -> str:
    uid = _uid()
    resp = await client.post("/api/v1/auth/register", json={
        "email": f"user_{uid}@test.com",
        "username": f"user_{uid}",
        "password": "password123",
        "full_name": "Test User",
    })
    assert resp.status_code == 201
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _product_payload(**kwargs) -> dict:
    return {
        "title": "Bici de montaña",
        "description": "En buen estado, poco uso",
        "condition": "good",
        "sale_type": "fixed",
        "price": "120.00",
        "categories": ["deportes"],
        "image_urls": [],
        **kwargs,
    }


# ─── create ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_product_ok(client: AsyncClient):
    token = await _register(client)
    resp = await client.post("/api/v1/products", json=_product_payload(), headers=_auth(token))
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Bici de montaña"
    assert data["sale_type"] == "fixed"
    assert data["status"] == "active"


@pytest.mark.asyncio
async def test_create_product_requires_auth(client: AsyncClient):
    resp = await client.post("/api/v1/products", json=_product_payload())
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_auction_requires_ends_at(client: AsyncClient):
    token = await _register(client)
    resp = await client.post("/api/v1/products", json=_product_payload(sale_type="auction"), headers=_auth(token))
    assert resp.status_code == 422


# ─── read ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_products_returns_list(client: AsyncClient):
    token = await _register(client)
    await client.post("/api/v1/products", json=_product_payload(), headers=_auth(token))
    resp = await client.get("/api/v1/products")
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert "total" in body
    assert isinstance(body["items"], list)


@pytest.mark.asyncio
async def test_get_product_not_found(client: AsyncClient):
    resp = await client.get("/api/v1/products/999999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_product_ok(client: AsyncClient):
    token = await _register(client)
    created = await client.post("/api/v1/products", json=_product_payload(), headers=_auth(token))
    product_id = created.json()["id"]
    resp = await client.get(f"/api/v1/products/{product_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == product_id


# ─── update / delete ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_own_product(client: AsyncClient):
    token = await _register(client)
    created = await client.post("/api/v1/products", json=_product_payload(), headers=_auth(token))
    product_id = created.json()["id"]
    resp = await client.delete(f"/api/v1/products/{product_id}", headers=_auth(token))
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_other_user_product_forbidden(client: AsyncClient):
    seller_token = await _register(client)
    buyer_token = await _register(client)
    created = await client.post("/api/v1/products", json=_product_payload(), headers=_auth(seller_token))
    product_id = created.json()["id"]
    resp = await client.delete(f"/api/v1/products/{product_id}", headers=_auth(buyer_token))
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_search_by_query(client: AsyncClient):
    token = await _register(client)
    uid = _uid()
    await client.post("/api/v1/products", json=_product_payload(title=f"Artículo único {uid}"), headers=_auth(token))
    resp = await client.get(f"/api/v1/products?q={uid}")
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
