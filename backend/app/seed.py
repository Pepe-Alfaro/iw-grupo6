"""Seed script: creates sample users, products and auctions for local dev."""

import asyncio
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select as sa_select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.auction import Auction
from app.models.product import (
    Product,
    ProductCategory,
    ProductCondition,
    ProductImage,
    ProductStatus,
)
from app.models.user import User, UserRole

USERS = [
    {
        "email": "jorge@remarket.com",
        "username": "jorge_m",
        "password": "Test1234!",
        "full_name": "Jorge Muñiz",
        "role": UserRole.CLIENT,
    },
    {
        "email": "ana@remarket.com",
        "username": "ana_lopez",
        "password": "Test1234!",
        "full_name": "Ana López",
        "role": UserRole.CLIENT,
    },
    {
        "email": "carlos@remarket.com",
        "username": "carlos_v",
        "password": "Test1234!",
        "full_name": "Carlos Vega",
        "role": UserRole.CLIENT,
    },
    {
        "email": "mod@remarket.com",
        "username": "moderador",
        "password": "Mod1234!",
        "full_name": "Moderador Admin",
        "role": UserRole.MODERATOR,
    },
]

PRODUCTS = [
    {
        "title": "iPhone 13 Pro 256GB — Sierra Blue",
        "description": (
            "En perfecto estado. Batería al 94%. Se vende con caja original, "
            "cargador y funda de silicona Apple. Sin golpes ni arañazos."
        ),
        "condition": ProductCondition.LIKE_NEW,
        "sale_type": "fixed",
        "price": Decimal("649.00"),
        "categories": ["electrónica", "móviles"],
        "images": ["https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&q=80"],
        "seller_idx": 1,
    },
    {
        "title": "Bicicleta de montaña Trek Marlin 5",
        "description": (
            "Usada dos temporadas. Frenos hidráulicos Tektro, cambios Shimano Altus 2x8. "
            "Talla M. Lista para rodar."
        ),
        "condition": ProductCondition.GOOD,
        "sale_type": "fixed",
        "price": Decimal("420.00"),
        "categories": ["deporte", "ciclismo"],
        "images": ["https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=600&q=80"],
        "seller_idx": 2,
    },
    {
        "title": "MacBook Air M2 — Midnight 8/256",
        "description": (
            "Comprado en enero 2024, factura incluida. Carga de ciclos inferior a 40. "
            "Incluye adaptador USB-C a MagSafe."
        ),
        "condition": ProductCondition.LIKE_NEW,
        "sale_type": "auction",
        "price": Decimal("750.00"),
        "categories": ["electrónica", "portátiles"],
        "images": ["https://images.unsplash.com/photo-1611186871525-9d8d6d84c4e2?w=600&q=80"],
        "seller_idx": 1,
        "auction_hours": 72,
    },
    {
        "title": "Sofá rinconera 3+2 — Gris antracita",
        "description": (
            "Sofá esquinero de tela. Muy buen estado. Medidas 280x200 cm. "
            "Desmontable para transporte. Recogida en Córdoba capital."
        ),
        "condition": ProductCondition.GOOD,
        "sale_type": "fixed",
        "price": Decimal("290.00"),
        "categories": ["hogar", "muebles"],
        "images": ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80"],
        "seller_idx": 2,
    },
    {
        "title": "Cámara Sony A7III + objetivo 28-70",
        "description": (
            "Cuerpo con menos de 15.000 disparos. "
            "Incluye objetivo kit 28-70mm f/3.5-5.6 OSS, dos baterías y bolsa Lowepro."
        ),
        "condition": ProductCondition.GOOD,
        "sale_type": "auction",
        "price": Decimal("1100.00"),
        "categories": ["electrónica", "fotografía"],
        "images": ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80"],
        "seller_idx": 2,
        "auction_hours": 168,
    },
    {
        "title": "Zapatillas Nike Air Max 90 — Talla 42",
        "description": (
            "Nuevas, sin estrenar. Compradas online en talla incorrecta. "
            "Modelo classic white/black."
        ),
        "condition": ProductCondition.NEW,
        "sale_type": "fixed",
        "price": Decimal("85.00"),
        "categories": ["moda", "calzado"],
        "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"],
        "seller_idx": 0,
    },
    {
        "title": "Colección vinilo Jazz — 40 LPs",
        "description": (
            "Colección de 40 discos de vinilo, mayoritariamente jazz "
            "(Miles Davis, Coltrane, Evans). Todos en buen estado de reproducción."
        ),
        "condition": ProductCondition.USED,
        "sale_type": "auction",
        "price": Decimal("60.00"),
        "categories": ["música", "vinilos"],
        "images": ["https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&q=80"],
        "seller_idx": 0,
        "auction_hours": 48,
    },
    {
        "title": "Mesa de escritorio IKEA Lagkapten 160x60",
        "description": (
            "Color blanco, muy buen estado. Patas ajustables en altura. "
            "Incluye soporte de monitor. Desmontada para facilitar transporte."
        ),
        "condition": ProductCondition.GOOD,
        "sale_type": "fixed",
        "price": Decimal("75.00"),
        "categories": ["hogar", "escritorio"],
        "images": ["https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80"],
        "seller_idx": 1,
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        existing_product = (await session.execute(sa_select(Product).limit(1))).scalar_one_or_none()
        if existing_product:
            print("Database already seeded, skipping.")
            return

        users: list[User] = []
        for u in USERS:
            existing_user = (
                await session.execute(sa_select(User).where(User.email == u["email"]))
            ).scalar_one_or_none()
            if existing_user:
                users.append(existing_user)
            else:
                user = User(
                    email=u["email"],
                    username=u["username"],
                    hashed_password=hash_password(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                )
                session.add(user)
                await session.flush()
                users.append(user)

        await session.commit()
        for u in users:
            await session.refresh(u)

        sum(1 for u in users if u.id)
        print(f"Users ready: {len(users)}")

        for p in PRODUCTS:
            seller = users[p["seller_idx"]]
            product = Product(
                title=p["title"],
                description=p["description"],
                condition=p["condition"],
                sale_type=p["sale_type"],
                price=p["price"],
                status=ProductStatus.ACTIVE,
                seller_id=seller.id,
            )
            session.add(product)
            await session.flush()

            for i, url in enumerate(p["images"]):
                session.add(ProductImage(product_id=product.id, url=url, is_main=(i == 0)))

            for cat in p["categories"]:
                session.add(ProductCategory(product_id=product.id, category=cat))

            if p["sale_type"] == "auction":
                hours = p.get("auction_hours", 72)
                session.add(
                    Auction(
                        product_id=product.id,
                        current_bid=Decimal("0"),
                        ends_at=datetime.utcnow() + timedelta(hours=hours),
                        is_closed=False,
                    )
                )

        await session.commit()
        print(f"Created {len(PRODUCTS)} products.")
        print("\nSeed complete. Login credentials:")
        for u in USERS:
            print(f"  {u['role'].value:10s} {u['email']:30s} / {u['password']}")


if __name__ == "__main__":
    asyncio.run(seed())
