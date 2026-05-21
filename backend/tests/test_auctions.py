import uuid
from datetime import datetime, timedelta

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


async def _create_auction(client: AsyncClient, token: str, ends_at: datetime) -> dict:
    resp = await client.post("/api/v1/products", json={
        "title": "Guitarra eléctrica",
        "description": "Fender Stratocaster 2019",
        "condition": "good",
        "sale_type": "auction",
        "price": "200.00",
        "categories": ["musica"],
        "image_urls": [],
        "ends_at": ends_at.isoformat(),
    }, headers=_auth(token))
    assert resp.status_code == 201
    return resp.json()


# ─── get auction ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_auction_not_found(client: AsyncClient):
    resp = await client.get("/api/v1/auctions/999999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_auction_ok(client: AsyncClient):
    seller = await _register(client)
    ends_at = datetime.utcnow() + timedelta(hours=24)
    product = await _create_auction(client, seller, ends_at)
    resp = await client.get(f"/api/v1/auctions/{product['id']}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["product_id"] == product["id"]
    assert data["is_closed"] is False


# ─── place bid ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_bid_ok(client: AsyncClient):
    seller = await _register(client)
    bidder = await _register(client)
    ends_at = datetime.utcnow() + timedelta(hours=24)
    product = await _create_auction(client, seller, ends_at)

    resp = await client.post(
        f"/api/v1/auctions/{product['id']}/bid",
        json={"amount": "250.00"},
        headers=_auth(bidder),
    )
    assert resp.status_code == 201
    assert float(resp.json()["amount"]) == 250.0


@pytest.mark.asyncio
async def test_bid_requires_auth(client: AsyncClient):
    seller = await _register(client)
    ends_at = datetime.utcnow() + timedelta(hours=24)
    product = await _create_auction(client, seller, ends_at)
    resp = await client.post(f"/api/v1/auctions/{product['id']}/bid", json={"amount": "250.00"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_bid_closed_auction(client: AsyncClient):
    seller = await _register(client)
    bidder = await _register(client)
    # ends_at en el pasado → subasta expirada
    ends_at = datetime.utcnow() - timedelta(hours=1)
    product = await _create_auction(client, seller, ends_at)

    resp = await client.post(
        f"/api/v1/auctions/{product['id']}/bid",
        json={"amount": "250.00"},
        headers=_auth(bidder),
    )
    assert resp.status_code == 400
    assert "cerrada" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_bid_below_current_bid(client: AsyncClient):
    seller = await _register(client)
    bidder_a = await _register(client)
    bidder_b = await _register(client)
    ends_at = datetime.utcnow() + timedelta(hours=24)
    product = await _create_auction(client, seller, ends_at)

    # Primera puja: 300
    await client.post(
        f"/api/v1/auctions/{product['id']}/bid",
        json={"amount": "300.00"},
        headers=_auth(bidder_a),
    )

    # Segunda puja: 250 (menor que 300) → 400
    resp = await client.post(
        f"/api/v1/auctions/{product['id']}/bid",
        json={"amount": "250.00"},
        headers=_auth(bidder_b),
    )
    assert resp.status_code == 400
    assert "superar" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_bid_equal_to_current_bid(client: AsyncClient):
    seller = await _register(client)
    bidder_a = await _register(client)
    bidder_b = await _register(client)
    ends_at = datetime.utcnow() + timedelta(hours=24)
    product = await _create_auction(client, seller, ends_at)

    await client.post(
        f"/api/v1/auctions/{product['id']}/bid",
        json={"amount": "300.00"},
        headers=_auth(bidder_a),
    )

    resp = await client.post(
        f"/api/v1/auctions/{product['id']}/bid",
        json={"amount": "300.00"},
        headers=_auth(bidder_b),
    )
    assert resp.status_code == 400
