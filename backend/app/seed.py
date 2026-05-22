"""Seed script: creates sample users, products, orders, conversations and reviews."""

import asyncio
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import and_
from sqlmodel import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.auction import Auction
from app.models.message import Conversation, Message
from app.models.order import Order, OrderStatus
from app.models.product import (
    Product,
    ProductCategory,
    ProductCondition,
    ProductImage,
    ProductStatus,
)
from app.models.review import Review
from app.models.user import User, UserRole
from app.models.wishlist import WishlistItem

# idx 0=jorge, 1=ana, 2=carlos
ORDERS = [
    {
        "product_title": "Bicicleta de montaña Trek Marlin 5",
        "buyer_idx": 0,
        "status": OrderStatus.PAID,
        "days_ago": 15,
    },
    {
        "product_title": "Zapatillas Nike Air Max 90 — Talla 42",
        "buyer_idx": 2,
        "status": OrderStatus.PAID,
        "days_ago": 8,
    },
    {
        "product_title": "LEGO Technic Bugatti Chiron 42083",
        "buyer_idx": 1,
        "status": OrderStatus.PAID,
        "days_ago": 3,
    },
    {
        "product_title": "Lámpara de pie Arco — Acero negro",
        "buyer_idx": 0,
        "status": OrderStatus.PENDING,
        "days_ago": 1,
    },
]

REVIEWS = [
    {
        "order_product_title": "Bicicleta de montaña Trek Marlin 5",
        "reviewer_idx": 0,
        "rating": 5,
        "comment": "Todo perfecto, la bici llegó tal y como estaba descrita. Carlos muy majo y puntual.",
    },
    {
        "order_product_title": "Bicicleta de montaña Trek Marlin 5",
        "reviewer_idx": 2,
        "rating": 5,
        "comment": "Comprador serio, pagó al momento y sin problemas. Recomendado.",
    },
    {
        "order_product_title": "Zapatillas Nike Air Max 90 — Talla 42",
        "reviewer_idx": 2,
        "rating": 4,
        "comment": "Las zapatillas estaban nuevas como decía. Trato muy agradable.",
    },
    {
        "order_product_title": "Zapatillas Nike Air Max 90 — Talla 42",
        "reviewer_idx": 0,
        "rating": 5,
        "comment": "Carlos muy rápido y comunicativo. Sin ningún problema.",
    },
    {
        "order_product_title": "LEGO Technic Bugatti Chiron 42083",
        "reviewer_idx": 1,
        "rating": 5,
        "comment": "El set estaba impecable, exactamente como en las fotos. Jorge encantador.",
    },
]

CONVERSATIONS = [
    {
        "a_idx": 0,
        "b_idx": 1,
        "product_title": "iPhone 13 Pro 256GB — Sierra Blue",
        "messages": [
            (0, "Hola! Sigue disponible el iPhone? Me interesa mucho"),
            (1, "Sí, sigue disponible! Está en perfecto estado, batería al 94% como pone en el anuncio."),
            (0, "Genial. ¿Tiene algún arañazo o golpe que no salga en las fotos?"),
            (1, "Ninguno, lo he llevado siempre con funda. Viene con la caja original y todo."),
            (0, "Perfecto, me lo quedo. ¿Cuándo podríamos quedar?"),
            (1, "Este finde me viene bien, dime tú dónde y quedamos sin problema."),
        ],
        "days_ago": 5,
    },
    {
        "a_idx": 2,
        "b_idx": 0,
        "product_title": "Raqueta de tenis Wilson Blade 98 v8",
        "messages": [
            (2, "Buenas, ¿es negociable el precio de la raqueta?"),
            (0, "Hola! Ya está bastante ajustado pero si vienes a recogerla te la dejo en 100€."),
            (2, "Trato hecho. ¿Quedamos el sábado por la mañana?"),
            (0, "El sábado perfecto. Te mando ubicación por aquí."),
        ],
        "days_ago": 10,
    },
    {
        "a_idx": 1,
        "b_idx": 2,
        "product_title": "Guitarra eléctrica Fender Player Stratocaster",
        "messages": [
            (1, "Hola! Vi tu anuncio de la Fender, ¿qué amplificador usabas con ella?"),
            (2, "Hola! La usaba con un Fender Blues Junior. No está incluido pero si te interesa también lo tengo."),
            (1, "Qué bien! ¿Cuánto pedirías por el ampli?"),
            (2, "Por 150€ te lo dejo, está en buen estado. Los dos juntos por 650€ si quieres."),
            (1, "Me lo pienso y te digo. La guitarra seguro que sí."),
        ],
        "days_ago": 2,
    },
    {
        "a_idx": 0,
        "b_idx": 2,
        "product_title": "Samsung Galaxy Watch 5 Pro 45mm",
        "messages": [
            (0, "Hola, ¿el reloj es compatible con Android 14?"),
            (2, "Sí, totalmente compatible. Yo lo usaba con un Samsung S23 sin ningún problema."),
            (0, "¿Y la batería cuánto aguanta aproximadamente?"),
            (2, "Con uso normal unos 2 días, con GPS activo un día y medio. Está al 96% de salud."),
        ],
        "days_ago": 1,
    },
]

WISHLIST = [
    {"user_idx": 0, "product_title": "MacBook Air M2 — Midnight 8/256"},
    {"user_idx": 0, "product_title": "Cámara Sony A7III + objetivo 28-70"},
    {"user_idx": 1, "product_title": "LEGO Technic Bugatti Chiron 42083"},
    {"user_idx": 1, "product_title": "Dyson Airwrap Complete — Cobre/Níquel"},
    {"user_idx": 2, "product_title": "iPhone 13 Pro 256GB — Sierra Blue"},
    {"user_idx": 2, "product_title": "Sony WH-1000XM5 — Auriculares Noise Cancelling"},
]

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
                await session.exec(select(User).where(User.email == u["email"]))
            ).one_or_none()
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
                await session.exec(select(Product).where(Product.title == p["title"]))
            ).one_or_none()
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
                        ends_at=datetime.now(UTC).replace(tzinfo=None) + timedelta(hours=hours),
                        is_closed=False,
                    )
                )
            created += 1

        await session.commit()
        print(f"Products created: {created} (skipped {len(PRODUCTS) - created} already existing)")

        # Reload all products by title for later references
        all_products: dict[str, Product] = {}
        for p in PRODUCTS:
            row = (
                await session.exec(select(Product).where(Product.title == p["title"]))
            ).one_or_none()
            if row:
                all_products[p["title"]] = row

        # ── Orders ───────────────────────────────────────────────────────────
        orders_created = 0
        seeded_orders: dict[str, Order] = {}
        for o in ORDERS:
            product = all_products.get(o["product_title"])
            if not product:
                continue
            buyer = users[o["buyer_idx"]]
            exists = (
                await session.exec(
                    select(Order).where(
                        and_(Order.product_id == product.id, Order.buyer_id == buyer.id)
                    )
                )
            ).one_or_none()
            if exists:
                seeded_orders[o["product_title"]] = exists
                continue

            created_at = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=o["days_ago"])
            order = Order(
                product_id=product.id,
                buyer_id=buyer.id,
                seller_id=product.seller_id,
                amount=product.price,
                status=o["status"],
                created_at=created_at,
            )
            session.add(order)
            if o["status"] == OrderStatus.PAID:
                product.status = ProductStatus.SOLD
                session.add(product)
            await session.flush()
            seeded_orders[o["product_title"]] = order
            orders_created += 1

        await session.commit()
        for order in seeded_orders.values():
            await session.refresh(order)
        print(f"Orders created: {orders_created}")

        # ── Reviews ──────────────────────────────────────────────────────────
        reviews_created = 0
        for r in REVIEWS:
            order = seeded_orders.get(r["order_product_title"])
            if not order or order.status != OrderStatus.PAID:
                continue
            reviewer = users[r["reviewer_idx"]]
            reviewed_id = (
                order.seller_id if reviewer.id == order.buyer_id else order.buyer_id
            )
            exists = (
                await session.exec(
                    select(Review).where(
                        and_(Review.order_id == order.id, Review.reviewer_id == reviewer.id)
                    )
                )
            ).one_or_none()
            if exists:
                continue

            session.add(Review(
                order_id=order.id,
                reviewer_id=reviewer.id,
                reviewed_id=reviewed_id,
                rating=r["rating"],
                comment=r["comment"],
                created_at=datetime.now(UTC).replace(tzinfo=None) - timedelta(days=1),
            ))
            if reviewer.id == order.buyer_id:
                order.buyer_reviewed = True
            else:
                order.seller_reviewed = True
            session.add(order)

            reviewed_user = await session.get(User, reviewed_id)
            if reviewed_user:
                total = reviewed_user.total_reviews + 1
                reviewed_user.avg_rating = (
                    reviewed_user.avg_rating * reviewed_user.total_reviews + r["rating"]
                ) / total
                reviewed_user.total_reviews = total
                session.add(reviewed_user)
            reviews_created += 1

        await session.commit()
        print(f"Reviews created: {reviews_created}")

        # ── Conversations & messages ──────────────────────────────────────────
        convs_created = 0
        for c in CONVERSATIONS:
            user_a = users[c["a_idx"]]
            user_b = users[c["b_idx"]]
            product = all_products.get(c["product_title"])
            product_id = product.id if product else None

            exists = (
                await session.exec(
                    select(Conversation).where(
                        and_(
                            Conversation.participant_a_id == user_a.id,
                            Conversation.participant_b_id == user_b.id,
                        )
                    )
                )
            ).one_or_none()
            if exists:
                continue

            base_time = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=c["days_ago"])
            conv = Conversation(
                participant_a_id=user_a.id,
                participant_b_id=user_b.id,
                product_id=product_id,
                created_at=base_time,
            )
            session.add(conv)
            await session.flush()

            for i, (sender_idx, content) in enumerate(c["messages"]):
                sender = users[sender_idx]
                session.add(Message(
                    conversation_id=conv.id,
                    sender_id=sender.id,
                    content=content,
                    sent_at=base_time + timedelta(minutes=i * 12),
                    read=True,
                ))
            convs_created += 1

        await session.commit()
        print(f"Conversations created: {convs_created}")

        # ── Wishlist ─────────────────────────────────────────────────────────
        wishlist_created = 0
        for w in WISHLIST:
            user = users[w["user_idx"]]
            product = all_products.get(w["product_title"])
            if not product:
                continue
            exists = (
                await session.exec(
                    select(WishlistItem).where(
                        and_(
                            WishlistItem.user_id == user.id,
                            WishlistItem.product_id == product.id,
                        )
                    )
                )
            ).one_or_none()
            if exists:
                continue
            session.add(WishlistItem(
                user_id=user.id,
                product_id=product.id,
                notify=True,
                created_at=datetime.now(UTC).replace(tzinfo=None) - timedelta(days=2),
            ))
            wishlist_created += 1

        await session.commit()
        print(f"Wishlist items created: {wishlist_created}")

        print("\nSeed complete. Login credentials:")
        for u in USERS:
            print(f"  {u['role'].value:10s} {u['email']:30s} / {u['password']}")


if __name__ == "__main__":
    asyncio.run(seed())
