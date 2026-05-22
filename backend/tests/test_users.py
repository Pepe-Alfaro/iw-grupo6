import uuid

import pytest
from httpx import AsyncClient


def _uid():
    return uuid.uuid4().hex[:8]


async def _register(client: AsyncClient, full_name: str = "Test User") -> str:
    uid = _uid()
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"u_{uid}@t.com",
            "username": f"u_{uid}",
            "password": "pass123",
            "full_name": full_name,
        },
    )
    assert r.status_code == 201
    return r.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ─── get me ───────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_me_ok(client: AsyncClient):
    token = await _register(client, full_name="Jorge Test")
    r = await client.get("/api/v1/users/me", headers=_auth(token))
    assert r.status_code == 200
    body = r.json()
    assert body["full_name"] == "Jorge Test"
    assert "email" in body
    assert "role" in body


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    r = await client.get("/api/v1/users/me")
    assert r.status_code == 401


# ─── get user public ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_user_public_ok(client: AsyncClient):
    token = await _register(client)
    me = await client.get("/api/v1/users/me", headers=_auth(token))
    user_id = me.json()["id"]

    r = await client.get(f"/api/v1/users/{user_id}")
    assert r.status_code == 200
    assert r.json()["id"] == user_id


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient):
    r = await client.get("/api/v1/users/999999")
    assert r.status_code == 404


# ─── update me ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_me_ok(client: AsyncClient):
    token = await _register(client)

    r = await client.patch(
        "/api/v1/users/me",
        json={"full_name": "Nombre Actualizado"},
        headers=_auth(token),
    )
    assert r.status_code == 200
    assert r.json()["full_name"] == "Nombre Actualizado"


@pytest.mark.asyncio
async def test_update_me_strips_whitespace(client: AsyncClient):
    token = await _register(client)

    r = await client.patch(
        "/api/v1/users/me",
        json={"full_name": "  Con Espacios  "},
        headers=_auth(token),
    )
    assert r.status_code == 200
    assert r.json()["full_name"] == "Con Espacios"


@pytest.mark.asyncio
async def test_update_me_unauthorized(client: AsyncClient):
    r = await client.patch("/api/v1/users/me", json={"full_name": "Test"})
    assert r.status_code == 401


# ─── transactions ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_transactions_empty(client: AsyncClient):
    token = await _register(client)
    r = await client.get("/api/v1/users/me/transactions", headers=_auth(token))
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_get_transactions_as_buyer(client: AsyncClient):
    seller = await _register(client)
    buyer = await _register(client)

    prod_r = await client.post(
        "/api/v1/products",
        json={
            "title": "Prod tx",
            "description": "D",
            "condition": "good",
            "sale_type": "fixed",
            "price": "20.00",
            "categories": ["t"],
            "image_urls": [],
        },
        headers=_auth(seller),
    )
    prod_id = prod_r.json()["id"]
    await client.post("/api/v1/orders", json={"product_id": prod_id}, headers=_auth(buyer))

    buyer_tx = await client.get("/api/v1/users/me/transactions", headers=_auth(buyer))
    assert buyer_tx.status_code == 200
    txs = buyer_tx.json()
    assert len(txs) >= 1
    assert txs[0]["role"] == "buyer"
    assert txs[0]["product"] is not None


@pytest.mark.asyncio
async def test_get_transactions_as_seller(client: AsyncClient):
    seller = await _register(client)
    buyer = await _register(client)

    prod_r = await client.post(
        "/api/v1/products",
        json={
            "title": "Prod sell tx",
            "description": "D",
            "condition": "good",
            "sale_type": "fixed",
            "price": "15.00",
            "categories": ["t"],
            "image_urls": [],
        },
        headers=_auth(seller),
    )
    prod_id = prod_r.json()["id"]
    await client.post("/api/v1/orders", json={"product_id": prod_id}, headers=_auth(buyer))

    seller_tx = await client.get("/api/v1/users/me/transactions", headers=_auth(seller))
    assert seller_tx.status_code == 200
    txs = seller_tx.json()
    assert any(t["role"] == "seller" for t in txs)
