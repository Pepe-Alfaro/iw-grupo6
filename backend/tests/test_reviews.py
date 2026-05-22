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


async def _setup_paid_order(client: AsyncClient):
    """Creates seller, buyer, product and a paid order."""
    seller = await _register(client)
    buyer = await _register(client)

    prod_r = await client.post(
        "/api/v1/products",
        json={
            "title": "Prod review",
            "description": "Desc",
            "condition": "good",
            "sale_type": "fixed",
            "price": "30.00",
            "categories": ["cat"],
            "image_urls": [],
        },
        headers=_auth(seller),
    )
    prod_id = prod_r.json()["id"]
    order_r = await client.post(
        "/api/v1/orders", json={"product_id": prod_id}, headers=_auth(buyer)
    )
    return seller, buyer, order_r.json()["id"]


# ─── create review ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_buyer_review_ok(client: AsyncClient):
    _, buyer, order_id = await _setup_paid_order(client)

    r = await client.post(
        "/api/v1/reviews",
        json={"order_id": order_id, "rating": 5, "comment": "Genial vendedor"},
        headers=_auth(buyer),
    )
    assert r.status_code == 201
    body = r.json()
    assert body["rating"] == 5
    assert body["comment"] == "Genial vendedor"


@pytest.mark.asyncio
async def test_seller_review_ok(client: AsyncClient):
    seller, _, order_id = await _setup_paid_order(client)

    r = await client.post(
        "/api/v1/reviews",
        json={"order_id": order_id, "rating": 4},
        headers=_auth(seller),
    )
    assert r.status_code == 201
    assert r.json()["rating"] == 4


@pytest.mark.asyncio
async def test_review_updates_avg_rating(client: AsyncClient):
    seller, buyer, order_id = await _setup_paid_order(client)

    await client.post(
        "/api/v1/reviews",
        json={"order_id": order_id, "rating": 4},
        headers=_auth(buyer),
    )

    seller_me = await client.get("/api/v1/users/me", headers=_auth(seller))
    seller_id = seller_me.json()["id"]
    seller_profile = await client.get(f"/api/v1/users/{seller_id}")
    assert seller_profile.json()["avg_rating"] == 4.0
    assert seller_profile.json()["total_reviews"] == 1


@pytest.mark.asyncio
async def test_duplicate_review_buyer(client: AsyncClient):
    _, buyer, order_id = await _setup_paid_order(client)

    await client.post(
        "/api/v1/reviews", json={"order_id": order_id, "rating": 5}, headers=_auth(buyer)
    )
    r = await client.post(
        "/api/v1/reviews", json={"order_id": order_id, "rating": 3}, headers=_auth(buyer)
    )
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_duplicate_review_seller(client: AsyncClient):
    seller, _, order_id = await _setup_paid_order(client)

    await client.post(
        "/api/v1/reviews", json={"order_id": order_id, "rating": 3}, headers=_auth(seller)
    )
    r = await client.post(
        "/api/v1/reviews", json={"order_id": order_id, "rating": 5}, headers=_auth(seller)
    )
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_review_order_not_found(client: AsyncClient):
    token = await _register(client)
    r = await client.post(
        "/api/v1/reviews", json={"order_id": 999999, "rating": 5}, headers=_auth(token)
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_review_not_participant(client: AsyncClient):
    _, _, order_id = await _setup_paid_order(client)
    outsider = await _register(client)

    r = await client.post(
        "/api/v1/reviews",
        json={"order_id": order_id, "rating": 5},
        headers=_auth(outsider),
    )
    assert r.status_code == 403


# ─── get user reviews ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_user_reviews_ok(client: AsyncClient):
    seller, buyer, order_id = await _setup_paid_order(client)

    await client.post(
        "/api/v1/reviews",
        json={"order_id": order_id, "rating": 4, "comment": "Bueno"},
        headers=_auth(buyer),
    )

    seller_me = await client.get("/api/v1/users/me", headers=_auth(seller))
    seller_id = seller_me.json()["id"]

    r = await client.get(f"/api/v1/users/{seller_id}/reviews")
    assert r.status_code == 200
    reviews = r.json()
    assert any(rv["rating"] == 4 for rv in reviews)
    assert reviews[0]["reviewer"] is not None


@pytest.mark.asyncio
async def test_get_user_reviews_empty(client: AsyncClient):
    token = await _register(client)
    me = await client.get("/api/v1/users/me", headers=_auth(token))
    user_id = me.json()["id"]

    r = await client.get(f"/api/v1/users/{user_id}/reviews")
    assert r.status_code == 200
    assert r.json() == []
