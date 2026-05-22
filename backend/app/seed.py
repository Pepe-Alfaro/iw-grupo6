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
    # ── Electrónica ──────────────────────────────────────────────────────────
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
        "title": "iPad Air 5ª generación 64GB WiFi",
        "description": (
            "Con funda Apple Smart Folio azul marino. Pantalla sin arañazos, "
            "batería al 91%. Incluye caja y cable USB-C original."
        ),
        "condition": ProductCondition.GOOD,
        "sale_type": "fixed",
        "price": Decimal("480.00"),
        "categories": ["electrónica", "tablets"],
        "images": ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80"],
        "seller_idx": 0,
    },
    {
        "title": "Samsung Galaxy Watch 5 Pro 45mm",
        "description": (
            "Color titanio gris. Correa original + correa de repuesto de silicona. "
            "Batería al 96%. Cargador incluido."
        ),
        "condition": ProductCondition.LIKE_NEW,
        "sale_type": "fixed",
        "price": Decimal("195.00"),
        "categories": ["electrónica", "wearables"],
        "images": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"],
        "seller_idx": 2,
    },
    {
        "title": "Sony WH-1000XM5 — Auriculares Noise Cancelling",
        "description": (
            "Estado impecable. Cancelación de ruido clase mundial. "
            "Incluye funda original, cable USB-C y adaptador de avión."
        ),
        "condition": ProductCondition.LIKE_NEW,
        "sale_type": "auction",
        "price": Decimal("180.00"),
        "categories": ["electrónica", "audio"],
        "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80"],
        "seller_idx": 1,
        "auction_hours": 96,
    },
    # ── Hogar ────────────────────────────────────────────────────────────────
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
    {
        "title": "Cafetera De'Longhi Magnifica Evo",
        "description": (
            "Cafetera superautomática con molinillo integrado. Apenas usada, "
            "ciclos de limpieza al día. Incluye manual y descalcificador original."
        ),
        "condition": ProductCondition.LIKE_NEW,
        "sale_type": "fixed",
        "price": Decimal("340.00"),
        "categories": ["hogar", "electrodomésticos"],
        "images": ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"],
        "seller_idx": 0,
    },
    {
        "title": "Lámpara de pie Arco — Acero negro",
        "description": (
            "Lámpara de pie estilo arco, estructura metálica negra mate, pantalla "
            "de tela cruda. Altura 195 cm. Bombilla LED E27 incluida."
        ),
        "condition": ProductCondition.GOOD,
        "sale_type": "fixed",
        "price": Decimal("55.00"),
        "categories": ["hogar", "iluminación"],
        "images": ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80"],
        "seller_idx": 2,
    },
    # ── Deportes ─────────────────────────────────────────────────────────────
    {
        "title": "Bicicleta de montaña Trek Marlin 5",
        "description": (
            "Usada dos temporadas. Frenos hidráulicos Tektro, cambios Shimano Altus 2x8. "
            "Talla M. Lista para rodar."
        ),
        "condition": ProductCondition.GOOD,
        "sale_type": "fixed",
        "price": Decimal("420.00"),
        "categories": ["deportes", "ciclismo"],
        "images": ["https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=600&q=80"],
        "seller_idx": 2,
    },
    {
        "title": "Raqueta de tenis Wilson Blade 98 v8",
        "description": (
            "Raqueta de competición, encordada con Luxilon ALU Power. "
            "Grip original en buen estado. Incluye funda Wilson."
        ),
        "condition": ProductCondition.GOOD,
        "sale_type": "fixed",
        "price": Decimal("110.00"),
        "categories": ["deportes", "tenis"],
        "images": ["https://images.unsplash.com/photo-1617083934555-ac9d85dbbc6c?w=600&q=80"],
        "seller_idx": 0,
    },
    {
        "title": "Tabla de surf Shortboard 6'2 — Firewire",
        "description": (
            "Tabla Firewire Dominator 6'2 x 19.5 x 2.5. Tres quillas FCS II incluidas. "
            "Leash de 6 pies. Algún pequeño ding reparado."
        ),
        "condition": ProductCondition.USED,
        "sale_type": "auction",
        "price": Decimal("280.00"),
        "categories": ["deportes", "surf"],
        "images": ["https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&q=80"],
        "seller_idx": 1,
        "auction_hours": 120,
    },
    # ── Ropa y moda ──────────────────────────────────────────────────────────
    {
        "title": "Zapatillas Nike Air Max 90 — Talla 42",
        "description": (
            "Nuevas, sin estrenar. Compradas online en talla incorrecta. "
            "Modelo classic white/black."
        ),
        "condition": ProductCondition.NEW,
        "sale_type": "fixed",
        "price": Decimal("85.00"),
        "categories": ["ropa", "calzado"],
        "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"],
        "seller_idx": 0,
    },
    {
        "title": "Chaqueta Barbour Bedale — Talla L",
        "description": (
            "Chaqueta encerada clásica color salvia. Talla L. "
            "Alguna marca de uso menor, aspecto muy bueno. Incluye bolsa de transporte."
        ),
        "condition": ProductCondition.GOOD,
        "sale_type": "fixed",
        "price": Decimal("120.00"),
        "categories": ["ropa", "abrigos"],
        "images": ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80"],
        "seller_idx": 2,
    },
    {
        "title": "Bolso Louis Vuitton Speedy 30 — Monogram",
        "description": (
            "Bolso auténtico con certificado de autenticidad. "
            "Lona monogram en muy buen estado, asas con pátina natural uniforme."
        ),
        "condition": ProductCondition.GOOD,
        "sale_type": "auction",
        "price": Decimal("650.00"),
        "categories": ["ropa", "bolsos"],
        "images": ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80"],
        "seller_idx": 1,
        "auction_hours": 144,
    },
    # ── Libros ───────────────────────────────────────────────────────────────
    {
        "title": "Colección Harry Potter — Edición de lujo (7 tomos)",
        "description": (
            "Los siete libros de la saga en edición de lujo con ilustraciones de Jim Kay. "
            "Estado casi nuevo, apenas hojeados."
        ),
        "condition": ProductCondition.LIKE_NEW,
        "sale_type": "fixed",
        "price": Decimal("95.00"),
        "categories": ["libros", "ficción"],
        "images": ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80"],
        "seller_idx": 0,
    },
    {
        "title": "Lote 20 libros de programación — Python, JS, SQL",
        "description": (
            "Libros técnicos: Clean Code, The Pragmatic Programmer, Python Crash Course, "
            "Eloquent JavaScript y más. Todos en buen estado."
        ),
        "condition": ProductCondition.GOOD,
        "sale_type": "auction",
        "price": Decimal("40.00"),
        "categories": ["libros", "tecnología"],
        "images": ["https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80"],
        "seller_idx": 2,
        "auction_hours": 72,
    },
    # ── Motor ────────────────────────────────────────────────────────────────
    {
        "title": "Casco moto Shoei NXR2 — Talla M",
        "description": (
            "Casco integral homologado, 2 temporadas de uso. "
            "Sin golpes ni impactos. Interior lavable. Pantalla extra ahumada incluida."
        ),
        "condition": ProductCondition.GOOD,
        "sale_type": "fixed",
        "price": Decimal("245.00"),
        "categories": ["motor", "motos"],
        "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"],
        "seller_idx": 1,
    },
    # ── Música ───────────────────────────────────────────────────────────────
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
        "title": "Guitarra eléctrica Fender Player Stratocaster",
        "description": (
            "Sunburst 3 colores, pastillas Alnico V. Muy buen estado, "
            "algún pequeño arañazo en la parte trasera. Incluye funda acolchada."
        ),
        "condition": ProductCondition.GOOD,
        "sale_type": "fixed",
        "price": Decimal("520.00"),
        "categories": ["música", "instrumentos"],
        "images": ["https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80"],
        "seller_idx": 2,
    },
    # ── Juguetes ─────────────────────────────────────────────────────────────
    {
        "title": "LEGO Technic Bugatti Chiron 42083",
        "description": (
            "Set completo, todas las piezas, instrucciones incluidas. "
            "Montado una vez con mucho cuidado. Caja en buen estado."
        ),
        "condition": ProductCondition.LIKE_NEW,
        "sale_type": "fixed",
        "price": Decimal("220.00"),
        "categories": ["juguetes", "lego"],
        "images": ["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&q=80"],
        "seller_idx": 0,
    },
    # ── Belleza ──────────────────────────────────────────────────────────────
    {
        "title": "Dyson Airwrap Complete — Cobre/Níquel",
        "description": (
            "Completo con todos los accesorios originales. Usado 3 meses, "
            "impecable. Incluye estuche de viaje y funda de almacenamiento."
        ),
        "condition": ProductCondition.LIKE_NEW,
        "sale_type": "auction",
        "price": Decimal("280.00"),
        "categories": ["belleza", "pelo"],
        "images": ["https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&q=80"],
        "seller_idx": 1,
        "auction_hours": 60,
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        # Usuarios: insertar solo los que no existan
        users: list[User] = []
        for u in USERS:
            existing = (
                await session.execute(sa_select(User).where(User.email == u["email"]))
            ).scalar_one_or_none()
            if existing:
                users.append(existing)
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
        print(f"Users ready: {len(users)}")

        # Productos: insertar solo los que no existan por título
        created = 0
        for p in PRODUCTS:
            exists = (
                await session.execute(sa_select(Product).where(Product.title == p["title"]))
            ).scalar_one_or_none()
            if exists:
                continue

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
            created += 1

        await session.commit()
        print(f"Products created: {created} (skipped {len(PRODUCTS) - created} already existing)")
        print("\nSeed complete. Login credentials:")
        for u in USERS:
            print(f"  {u['role'].value:10s} {u['email']:30s} / {u['password']}")


if __name__ == "__main__":
    asyncio.run(seed())
