"""
Pruebas de seguridad — ReMarket

Bloque 1: Ataques al token JWT        (tokens malformados, firma manipulada, alg:none…)
Bloque 2: RBAC — panel de moderación  (CLIENT no puede tocar ningún endpoint de moderación)
Bloque 3: IDOR — escalada horizontal  (un usuario no puede operar sobre recursos ajenos)
Bloque 4: Muro de autenticación       (todos los endpoints protegidos rechazan peticiones sin token)
Bloque 5: Integridad de negocio       (compra propia, puja propia, doble valoración)
"""

import base64
import json
import uuid

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token, hash_password
from app.models.user import User, UserRole

# ─── helpers compartidos ──────────────────────────────────────────────────────


def _uid() -> str:
    return uuid.uuid4().hex[:8]


async def _register(client: AsyncClient) -> str:
    uid = _uid()
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"u_{uid}@example.com",
            "username": f"u_{uid}",
            "password": "pass123",
            "full_name": "Security Test",
        },
    )
    assert r.status_code == 201
    return r.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _create_moderator(session) -> str:
    uid = _uid()
    mod = User(
        email=f"mod_{uid}@example.com",
        username=f"mod_{uid}",
        hashed_password=hash_password("pass123"),
        full_name="Moderator",
        role=UserRole.MODERATOR,
    )
    session.add(mod)
    await session.commit()
    await session.refresh(mod)
    return create_access_token(mod.id)


async def _create_product(client: AsyncClient, token: str) -> dict:
    r = await client.post(
        "/api/v1/products",
        json={
            "title": f"Prod_{_uid()}",
            "description": "Descripción de prueba",
            "condition": "good",
            "sale_type": "fixed",
            "price": "30.00",
            "categories": ["otros"],
            "image_urls": [],
        },
        headers=_auth(token),
    )
    assert r.status_code == 201
    return r.json()


async def _get_user_id(client: AsyncClient, token: str) -> int:
    r = await client.get("/api/v1/users/me", headers=_auth(token))
    return r.json()["id"]


def _forge_none_alg_token(user_id: int) -> str:
    """JWT con alg=none: sin firma. Ataque clásico de bypass de verificación."""
    header = (
        base64.urlsafe_b64encode(json.dumps({"alg": "none", "typ": "JWT"}).encode())
        .rstrip(b"=")
        .decode()
    )
    payload = (
        base64.urlsafe_b64encode(json.dumps({"sub": str(user_id), "type": "access"}).encode())
        .rstrip(b"=")
        .decode()
    )
    return f"{header}.{payload}."


def _tamper_signature(valid_token: str) -> str:
    """Mantiene header y payload originales pero falsifica la firma."""
    parts = valid_token.split(".")
    return f"{parts[0]}.{parts[1]}.firma_completamente_falsa_xXx"


# ─── bloque 1: ataques al token JWT ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_jwt_token_malformado_rechazado(client: AsyncClient):
    """Cadena sin estructura JWT válida → 401."""
    r = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer basura.sin.estructura"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_jwt_firma_manipulada_rechazada(client: AsyncClient):
    """Token con header y payload reales pero firma falsificada → 401."""
    valid = await _register(client)
    tampered = _tamper_signature(valid)
    r = await client.get("/api/v1/users/me", headers=_auth(tampered))
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_jwt_algoritmo_none_rechazado(client: AsyncClient):
    """Ataque alg=none: JWT sin firma construido a mano → 401."""
    token = await _register(client)
    user_id = await _get_user_id(client, token)
    forged = _forge_none_alg_token(user_id)
    r = await client.get("/api/v1/users/me", headers=_auth(forged))
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_jwt_bearer_vacio_rechazado(client: AsyncClient):
    """Authorization: Bearer con valor vacío → 401."""
    r = await client.get("/api/v1/users/me", headers={"Authorization": "Bearer "})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_jwt_sin_prefijo_bearer_rechazado(client: AsyncClient):
    """Token válido enviado directamente sin el prefijo 'Bearer ' → 401."""
    valid = await _register(client)
    r = await client.get("/api/v1/users/me", headers={"Authorization": valid})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_jwt_cabecera_ausente_rechazada(client: AsyncClient):
    """Sin cabecera Authorization → 401."""
    r = await client.get("/api/v1/users/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_jwt_esquema_incorrecto_rechazado(client: AsyncClient):
    """Authorization: Basic (esquema HTTP incorrecto) → 401."""
    valid = await _register(client)
    r = await client.get("/api/v1/users/me", headers={"Authorization": f"Basic {valid}"})
    assert r.status_code == 401


# ─── bloque 2: RBAC — panel de moderación ────────────────────────────────────


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "method,path",
    [
        ("GET", "/api/v1/moderation/alerts"),
        ("GET", "/api/v1/moderation/products"),
        ("PATCH", "/api/v1/moderation/alerts/1"),
        ("DELETE", "/api/v1/moderation/products/1"),
    ],
)
async def test_moderacion_sin_token_devuelve_401(client: AsyncClient, method: str, path: str):
    """Todos los endpoints de moderación rechazan peticiones anónimas con 401."""
    r = await client.request(method, path)
    assert r.status_code == 401


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "method,path",
    [
        ("GET", "/api/v1/moderation/alerts"),
        ("GET", "/api/v1/moderation/products"),
        ("PATCH", "/api/v1/moderation/alerts/1"),
        ("DELETE", "/api/v1/moderation/products/1"),
    ],
)
async def test_moderacion_rol_cliente_devuelve_403(client: AsyncClient, method: str, path: str):
    """Un usuario con rol CLIENT no puede acceder a ningún endpoint de moderación."""
    token = await _register(client)
    r = await client.request(method, path, headers=_auth(token))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_moderador_accede_alertas_correctamente(client: AsyncClient, session):
    """Verificación positiva: un MODERATOR sí obtiene 200 en /moderation/alerts."""
    mod_token = await _create_moderator(session)
    r = await client.get("/api/v1/moderation/alerts", headers=_auth(mod_token))
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_moderador_accede_productos_correctamente(client: AsyncClient, session):
    """Verificación positiva: un MODERATOR sí obtiene 200 en /moderation/products."""
    mod_token = await _create_moderator(session)
    r = await client.get("/api/v1/moderation/products", headers=_auth(mod_token))
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ─── bloque 3: IDOR — escalada horizontal de privilegios ─────────────────────


@pytest.mark.asyncio
async def test_idor_editar_producto_ajeno_403(client: AsyncClient):
    """Usuario B no puede editar el anuncio de usuario A mediante PUT."""
    seller = await _register(client)
    attacker = await _register(client)
    product = await _create_product(client, seller)

    r = await client.put(
        f"/api/v1/products/{product['id']}",
        json={**product, "title": "Título manipulado", "price": "1.00"},
        headers=_auth(attacker),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_idor_eliminar_producto_ajeno_403(client: AsyncClient):
    """Usuario B no puede eliminar el anuncio de usuario A."""
    seller = await _register(client)
    attacker = await _register(client)
    product = await _create_product(client, seller)

    r = await client.delete(
        f"/api/v1/products/{product['id']}",
        headers=_auth(attacker),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_idor_leer_mensajes_conversacion_ajena_403(client: AsyncClient):
    """Un tercero no puede leer los mensajes de una conversación en la que no participa."""
    a = await _register(client)
    b = await _register(client)
    spy = await _register(client)

    b_id = await _get_user_id(client, b)
    conv_r = await client.post(
        "/api/v1/conversations",
        json={"other_user_id": b_id},
        headers=_auth(a),
    )
    conv_id = conv_r.json()["id"]

    r = await client.get(
        f"/api/v1/conversations/{conv_id}/messages",
        headers=_auth(spy),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_idor_enviar_mensaje_conversacion_ajena_403(client: AsyncClient):
    """Un tercero no puede enviar mensajes en una conversación en la que no participa."""
    a = await _register(client)
    b = await _register(client)
    spy = await _register(client)

    b_id = await _get_user_id(client, b)
    conv_r = await client.post(
        "/api/v1/conversations",
        json={"other_user_id": b_id},
        headers=_auth(a),
    )
    conv_id = conv_r.json()["id"]

    r = await client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "Mensaje intruso"},
        headers=_auth(spy),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_idor_marcar_mensajes_leidos_conversacion_ajena_403(client: AsyncClient):
    """Un tercero no puede marcar como leídos los mensajes de una conversación ajena."""
    a = await _register(client)
    b = await _register(client)
    spy = await _register(client)

    b_id = await _get_user_id(client, b)
    conv_r = await client.post(
        "/api/v1/conversations",
        json={"other_user_id": b_id},
        headers=_auth(a),
    )
    conv_id = conv_r.json()["id"]

    r = await client.patch(
        f"/api/v1/conversations/{conv_id}/messages/read",
        headers=_auth(spy),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_idor_ver_orden_ajena_403(client: AsyncClient):
    """Un tercero no puede consultar el detalle de una orden que no le pertenece."""
    seller = await _register(client)
    buyer = await _register(client)
    spy = await _register(client)
    product = await _create_product(client, seller)

    order_r = await client.post(
        "/api/v1/orders",
        json={"product_id": product["id"]},
        headers=_auth(buyer),
    )
    order_id = order_r.json()["id"]

    r = await client.get(f"/api/v1/orders/{order_id}", headers=_auth(spy))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_idor_pagar_orden_ajena_403(client: AsyncClient):
    """Un tercero no puede confirmar el pago de una orden que no inició."""
    seller = await _register(client)
    buyer = await _register(client)
    spy = await _register(client)
    product = await _create_product(client, seller)

    order_r = await client.post(
        "/api/v1/orders",
        json={"product_id": product["id"]},
        headers=_auth(buyer),
    )
    order_id = order_r.json()["id"]

    r = await client.patch(f"/api/v1/orders/{order_id}/pay", headers=_auth(spy))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_idor_eliminar_wishlist_ajena_403(client: AsyncClient):
    """Usuario B no puede eliminar un ítem de la wishlist de usuario A."""
    owner = await _register(client)
    attacker = await _register(client)

    add_r = await client.post(
        "/api/v1/wishlist",
        json={"search_query": "dato_privado"},
        headers=_auth(owner),
    )
    item_id = add_r.json()["id"]

    r = await client.delete(f"/api/v1/wishlist/{item_id}", headers=_auth(attacker))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_idor_toggle_notify_wishlist_ajena_403(client: AsyncClient):
    """Usuario B no puede cambiar las preferencias de notificación de la wishlist de usuario A."""
    owner = await _register(client)
    attacker = await _register(client)

    add_r = await client.post(
        "/api/v1/wishlist",
        json={"search_query": "dato_privado", "notify": True},
        headers=_auth(owner),
    )
    item_id = add_r.json()["id"]

    r = await client.patch(f"/api/v1/wishlist/{item_id}/notify", headers=_auth(attacker))
    assert r.status_code == 403


# ─── bloque 4: muro de autenticación ─────────────────────────────────────────


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "method,path,body",
    [
        (
            "POST",
            "/api/v1/products",
            {
                "title": "x",
                "description": "x",
                "condition": "good",
                "sale_type": "fixed",
                "price": "10.00",
                "categories": ["c"],
                "image_urls": [],
            },
        ),
        ("GET", "/api/v1/wishlist", None),
        ("POST", "/api/v1/wishlist", {"search_query": "x"}),
        ("GET", "/api/v1/conversations", None),
        ("POST", "/api/v1/conversations", {"other_user_id": 1}),
        ("POST", "/api/v1/orders", {"product_id": 1}),
        ("GET", "/api/v1/users/me", None),
        ("PATCH", "/api/v1/users/me", {"full_name": "x"}),
        ("DELETE", "/api/v1/users/me", None),
        ("GET", "/api/v1/users/me/transactions", None),
        ("POST", "/api/v1/auctions/1/bid", {"amount": "10.00"}),
    ],
)
async def test_endpoint_protegido_rechaza_peticion_anonima(
    client: AsyncClient, method: str, path: str, body: dict | None
):
    """Todos los endpoints que requieren sesión devuelven 401 cuando no hay token."""
    r = await client.request(method, path, json=body)
    assert r.status_code == 401


# ─── bloque 5: integridad de negocio ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_vendedor_no_puede_comprar_su_propio_anuncio(client: AsyncClient):
    """Un vendedor no puede iniciar una orden sobre su propio producto."""
    token = await _register(client)
    product = await _create_product(client, token)

    r = await client.post(
        "/api/v1/orders",
        json={"product_id": product["id"]},
        headers=_auth(token),
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_no_se_puede_comprar_producto_ya_vendido(client: AsyncClient):
    """No se puede abrir una segunda orden sobre un producto que ya tiene estado SOLD."""
    seller = await _register(client)
    buyer_a = await _register(client)
    buyer_b = await _register(client)
    product = await _create_product(client, seller)

    await client.post(
        "/api/v1/orders",
        json={"product_id": product["id"]},
        headers=_auth(buyer_a),
    )
    r = await client.post(
        "/api/v1/orders",
        json={"product_id": product["id"]},
        headers=_auth(buyer_b),
    )
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_doble_valoracion_misma_orden_rechazada(client: AsyncClient):
    """El mismo usuario no puede dejar dos valoraciones para la misma transacción."""
    seller = await _register(client)
    buyer = await _register(client)
    product = await _create_product(client, seller)

    order_r = await client.post(
        "/api/v1/orders",
        json={"product_id": product["id"]},
        headers=_auth(buyer),
    )
    order_id = order_r.json()["id"]

    payload = {"order_id": order_id, "rating": 5, "comment": "Excelente trato"}
    r1 = await client.post("/api/v1/reviews", json=payload, headers=_auth(buyer))
    assert r1.status_code == 201

    r2 = await client.post("/api/v1/reviews", json=payload, headers=_auth(buyer))
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_valoracion_con_rating_fuera_de_rango_rechazada(client: AsyncClient):
    """Un rating mayor de 5 o menor de 1 debe ser rechazado por validación (422)."""
    seller = await _register(client)
    buyer = await _register(client)
    product = await _create_product(client, seller)

    order_r = await client.post(
        "/api/v1/orders",
        json={"product_id": product["id"]},
        headers=_auth(buyer),
    )
    order_id = order_r.json()["id"]

    r = await client.post(
        "/api/v1/reviews",
        json={"order_id": order_id, "rating": 10},
        headers=_auth(buyer),
    )
    assert r.status_code == 422
