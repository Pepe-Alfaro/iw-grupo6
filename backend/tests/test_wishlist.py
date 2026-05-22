import uuid

import pytest
from httpx import AsyncClient


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


async def _create_product(client: AsyncClient, token: str) -> int:
    r = await client.post(
        "/api/v1/products",
        json={
            "title": "WL Prod",
            "description": "Desc",
            "condition": "good",
            "sale_type": "fixed",
            "price": "10.00",
            "categories": ["c"],
            "image_urls": [],
        },
        headers=_auth(token),
    )
    assert r.status_code == 201
    return r.json()["id"]


# ─── add to wishlist ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_add_product_to_wishlist(client: AsyncClient):
    token = await _register(client)
    seller = await _register(client)
    prod_id = await _create_product(client, seller)

    r = await client.post("/api/v1/wishlist", json={"product_id": prod_id}, headers=_auth(token))
    assert r.status_code == 201
    assert "id" in r.json()


@pytest.mark.asyncio
async def test_add_search_query_to_wishlist(client: AsyncClient):
    token = await _register(client)

    r = await client.post(
        "/api/v1/wishlist", json={"search_query": "bicicleta"}, headers=_auth(token)
    )
    assert r.status_code == 201
    assert "id" in r.json()


@pytest.mark.asyncio
async def test_add_wishlist_no_product_or_query(client: AsyncClient):
    token = await _register(client)
    r = await client.post("/api/v1/wishlist", json={}, headers=_auth(token))
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_add_wishlist_product_not_found(client: AsyncClient):
    token = await _register(client)
    r = await client.post("/api/v1/wishlist", json={"product_id": 999999}, headers=_auth(token))
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_add_wishlist_duplicate_returns_existing(client: AsyncClient):
    token = await _register(client)
    seller = await _register(client)
    prod_id = await _create_product(client, seller)

    r1 = await client.post("/api/v1/wishlist", json={"product_id": prod_id}, headers=_auth(token))
    r2 = await client.post("/api/v1/wishlist", json={"product_id": prod_id}, headers=_auth(token))
    assert r2.status_code == 201
    assert r2.json().get("already_exists") is True
    assert r2.json()["id"] == r1.json()["id"]


# ─── get wishlist ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_wishlist_empty(client: AsyncClient):
    token = await _register(client)
    r = await client.get("/api/v1/wishlist", headers=_auth(token))
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_get_wishlist_with_product(client: AsyncClient):
    token = await _register(client)
    seller = await _register(client)
    prod_id = await _create_product(client, seller)

    await client.post("/api/v1/wishlist", json={"product_id": prod_id}, headers=_auth(token))

    r = await client.get("/api/v1/wishlist", headers=_auth(token))
    assert r.status_code == 200
    items = r.json()
    assert any(i["product_id"] == prod_id for i in items)
    assert items[0]["product"] is not None


@pytest.mark.asyncio
async def test_get_wishlist_with_search_query(client: AsyncClient):
    token = await _register(client)
    await client.post("/api/v1/wishlist", json={"search_query": "moto"}, headers=_auth(token))

    r = await client.get("/api/v1/wishlist", headers=_auth(token))
    assert r.status_code == 200
    assert any(i["search_query"] == "moto" for i in r.json())


# ─── remove from wishlist ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_remove_wishlist_ok(client: AsyncClient):
    token = await _register(client)
    add_r = await client.post(
        "/api/v1/wishlist", json={"search_query": "libro"}, headers=_auth(token)
    )
    item_id = add_r.json()["id"]

    r = await client.delete(f"/api/v1/wishlist/{item_id}", headers=_auth(token))
    assert r.status_code == 204


@pytest.mark.asyncio
async def test_remove_wishlist_not_found(client: AsyncClient):
    token = await _register(client)
    r = await client.delete("/api/v1/wishlist/999999", headers=_auth(token))
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_remove_wishlist_forbidden(client: AsyncClient):
    token_a = await _register(client)
    token_b = await _register(client)
    add_r = await client.post(
        "/api/v1/wishlist", json={"search_query": "coche"}, headers=_auth(token_a)
    )
    item_id = add_r.json()["id"]

    r = await client.delete(f"/api/v1/wishlist/{item_id}", headers=_auth(token_b))
    assert r.status_code == 403


# ─── toggle notify ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_toggle_notify_ok(client: AsyncClient):
    token = await _register(client)
    add_r = await client.post(
        "/api/v1/wishlist",
        json={"search_query": "zapatos", "notify": True},
        headers=_auth(token),
    )
    item_id = add_r.json()["id"]

    r = await client.patch(f"/api/v1/wishlist/{item_id}/notify", headers=_auth(token))
    assert r.status_code == 200
    assert r.json()["notify"] is False

    r2 = await client.patch(f"/api/v1/wishlist/{item_id}/notify", headers=_auth(token))
    assert r2.json()["notify"] is True


@pytest.mark.asyncio
async def test_toggle_notify_not_found(client: AsyncClient):
    token = await _register(client)
    r = await client.patch("/api/v1/wishlist/999999/notify", headers=_auth(token))
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_toggle_notify_forbidden(client: AsyncClient):
    token_a = await _register(client)
    token_b = await _register(client)
    add_r = await client.post(
        "/api/v1/wishlist", json={"search_query": "sofa"}, headers=_auth(token_a)
    )
    item_id = add_r.json()["id"]

    r = await client.patch(f"/api/v1/wishlist/{item_id}/notify", headers=_auth(token_b))
    assert r.status_code == 403
