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


async def _get_id(client: AsyncClient, token: str) -> int:
    r = await client.get("/api/v1/users/me", headers=_auth(token))
    return r.json()["id"]


async def _conv(client: AsyncClient, token_a: str, token_b: str) -> int:
    b_id = await _get_id(client, token_b)
    r = await client.post(
        "/api/v1/conversations",
        json={"other_user_id": b_id},
        headers=_auth(token_a),
    )
    assert r.status_code == 201
    return r.json()["id"]


# ─── create conversation ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_conversation_ok(client: AsyncClient):
    a = await _register(client)
    b = await _register(client)
    conv_id = await _conv(client, a, b)
    assert isinstance(conv_id, int)


@pytest.mark.asyncio
async def test_create_conversation_idempotent(client: AsyncClient):
    a = await _register(client)
    b = await _register(client)
    id1 = await _conv(client, a, b)
    id2 = await _conv(client, a, b)
    assert id1 == id2


@pytest.mark.asyncio
async def test_create_conversation_symmetric(client: AsyncClient):
    """B creating conv with A returns same id as A creating conv with B."""
    a = await _register(client)
    b = await _register(client)
    id1 = await _conv(client, a, b)
    id2 = await _conv(client, b, a)
    assert id1 == id2


@pytest.mark.asyncio
async def test_create_conversation_with_self(client: AsyncClient):
    token = await _register(client)
    my_id = await _get_id(client, token)
    r = await client.post(
        "/api/v1/conversations",
        json={"other_user_id": my_id},
        headers=_auth(token),
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_create_conversation_user_not_found(client: AsyncClient):
    token = await _register(client)
    r = await client.post(
        "/api/v1/conversations",
        json={"other_user_id": 999999},
        headers=_auth(token),
    )
    assert r.status_code == 404


# ─── send / list messages ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_send_message_ok(client: AsyncClient):
    a = await _register(client)
    b = await _register(client)
    conv_id = await _conv(client, a, b)

    r = await client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "Hola!"},
        headers=_auth(a),
    )
    assert r.status_code == 201
    assert r.json()["content"] == "Hola!"
    assert r.json()["read"] is False


@pytest.mark.asyncio
async def test_send_message_non_participant(client: AsyncClient):
    a = await _register(client)
    b = await _register(client)
    c = await _register(client)
    conv_id = await _conv(client, a, b)

    r = await client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "intruso"},
        headers=_auth(c),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_send_message_empty_content(client: AsyncClient):
    a = await _register(client)
    b = await _register(client)
    conv_id = await _conv(client, a, b)

    r = await client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "   "},
        headers=_auth(a),
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_list_messages_ok(client: AsyncClient):
    a = await _register(client)
    b = await _register(client)
    conv_id = await _conv(client, a, b)

    await client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "Mensaje 1"},
        headers=_auth(a),
    )
    await client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "Mensaje 2"},
        headers=_auth(b),
    )

    r = await client.get(f"/api/v1/conversations/{conv_id}/messages", headers=_auth(a))
    assert r.status_code == 200
    msgs = r.json()
    assert len(msgs) == 2
    assert msgs[0]["content"] == "Mensaje 1"


@pytest.mark.asyncio
async def test_list_messages_forbidden(client: AsyncClient):
    a = await _register(client)
    b = await _register(client)
    c = await _register(client)
    conv_id = await _conv(client, a, b)

    r = await client.get(f"/api/v1/conversations/{conv_id}/messages", headers=_auth(c))
    assert r.status_code == 403


# ─── list conversations ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_conversations_ok(client: AsyncClient):
    a = await _register(client)
    b = await _register(client)
    await _conv(client, a, b)

    r = await client.get("/api/v1/conversations", headers=_auth(a))
    assert r.status_code == 200
    convs = r.json()
    assert isinstance(convs, list)
    assert len(convs) >= 1
    assert "other_user" in convs[0]


@pytest.mark.asyncio
async def test_list_conversations_empty(client: AsyncClient):
    token = await _register(client)
    r = await client.get("/api/v1/conversations", headers=_auth(token))
    assert r.status_code == 200
    assert r.json() == []


# ─── mark read ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_mark_read_ok(client: AsyncClient):
    a = await _register(client)
    b = await _register(client)
    conv_id = await _conv(client, a, b)

    await client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "Hi"},
        headers=_auth(b),
    )

    r = await client.patch(f"/api/v1/conversations/{conv_id}/messages/read", headers=_auth(a))
    assert r.status_code == 200
    assert r.json()["updated"] >= 1


@pytest.mark.asyncio
async def test_mark_read_no_unread(client: AsyncClient):
    a = await _register(client)
    b = await _register(client)
    conv_id = await _conv(client, a, b)

    r = await client.patch(f"/api/v1/conversations/{conv_id}/messages/read", headers=_auth(a))
    assert r.status_code == 200
    assert r.json()["updated"] == 0
