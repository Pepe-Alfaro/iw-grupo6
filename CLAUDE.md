# CLAUDE.md — ReMarket C2C Marketplace

> Fichero de contexto para Claude Code. Léelo entero antes de tocar cualquier fichero.

---

## 0. REGLAS DE GIT — CRÍTICO, NO NEGOCIABLE

**Todos los commits deben aparecer firmados únicamente por el usuario `i32mumaj`.**

Antes de hacer cualquier commit, verificar que la configuración local es correcta:

```bash
git config user.name "i32mumaj"
git config user.email "i32mumaj@uco.es"   # ajustar si el email es diferente
```

**Está terminantemente prohibido:**
- Añadir `Co-authored-by: Claude` o cualquier variante en el cuerpo del commit.
- Añadir `Co-authored-by: Anthropic` o cualquier mención a herramientas de IA.
- Incluir la palabra "Claude", "AI-generated", "AI-assisted" o similares en ningún
  mensaje de commit, descripción de PR, ni comentario de código.
- Usar `git commit --trailer` con datos de autoría automática.

**Formato de commit:**

Una sola frase corta en español, en imperativo, sin prefijos tipo `feat:` / `fix:` / `chore:` — esos huelen a IA y están prohibidos.

Ejemplos correctos:
```
Implementado endpoint de registro con hash bcrypt
Arreglada condición de carrera en validación de pujas
Añadida página de wishlist con toggle de notificaciones
```

---

## 1. Descripción del proyecto

**ReMarket** es una plataforma web de compra-venta C2C (Customer to Customer)
desarrollada como proyecto universitario para la asignatura de Ingeniería Web,
Grado en Ingeniería Informática — Universidad de Córdoba.

Permite a usuarios registrados publicar, buscar y adquirir productos de segunda mano
mediante precio fijo o subasta con adjudicación automática. Incluye sistema de
moderación, mensajería interna, wishlist con alertas y valoraciones entre usuarios.

Repositorio: https://github.com/Pepe-Alfaro/iw-grupo6

---

## 2. Stack tecnológico

### Backend
| Capa | Tecnología | Versión mínima |
|------|-----------|----------------|
| Lenguaje | Python | 3.12 |
| Framework API | FastAPI | 0.111 |
| ORM / modelos | SQLModel | 0.0.19 |
| Base de datos | PostgreSQL | 16 |
| Migraciones | Alembic | 1.13 |
| Autenticación | JWT via `python-jose` + bcrypt | — |
| Servidor ASGI | Uvicorn | 0.29 |
| Validación | Pydantic v2 (incluido en FastAPI) | — |
| Gestor de paquetes | `uv` (no pip, no poetry) | latest |
| Testing | pytest + httpx (async) | — |
| Linting | ruff | — |

### Frontend
| Capa | Tecnología | Versión mínima |
|------|-----------|----------------|
| Lenguaje | TypeScript | 5.x |
| Framework UI | React | 18 |
| Bundler | Vite | 5 |
| Estilos | Tailwind CSS | 3.4 |
| Routing | React Router v6 | — |
| Estado global | Zustand | — |
| Cliente HTTP | Axios con interceptores JWT | — |
| Iconos | Lucide React | — |
| Testing | Vitest + Testing Library | — |
| Linting | ESLint + Prettier | — |

### Infraestructura / Dev
| Herramienta | Uso |
|-------------|-----|
| Docker + Docker Compose | Entorno completo local en un comando |
| `.env` files | Secrets, nunca hardcodeados |
| GitHub Actions | CI: lint + tests en cada PR |

---

## 3. Arquitectura del sistema

### Visión general

```
┌─────────────────────────────────────────────────────┐
│                   Cliente (Browser)                  │
│              React + Vite + TypeScript               │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/REST (JSON) + JWT
┌──────────────────────▼──────────────────────────────┐
│               FastAPI (ASGI — Uvicorn)               │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  Routers │  │ Services │  │  Background Tasks  │ │
│  │ (rutas)  │→ │(lógica)  │→ │ (adjudicar subasta)│ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
│                     │                                │
│              ┌──────▼──────┐                         │
│              │  SQLModel   │  (modelos + queries)    │
│              └──────┬──────┘                         │
└─────────────────────┼───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                  PostgreSQL 16                        │
└─────────────────────────────────────────────────────┘
```

### Patrón de capas (backend)

```
app/
├── api/           # Routers FastAPI — solo HTTP I/O, sin lógica de negocio
├── services/      # Lógica de negocio pura — donde vive todo el dominio
├── models/        # SQLModel — tablas de BD y schemas Pydantic en un solo lugar
├── core/          # Config, seguridad JWT, dependencias inyectadas
├── tasks/         # Background tasks (adjudicación de subastas)
└── main.py        # Punto de entrada, registro de routers
```

**Regla de dependencias:** `api → services → models`. Los routers nunca acceden
directamente a la base de datos. Los services nunca importan cosas de `api/`.

---

## 4. Estructura de directorios

```
iw-grupo6/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          # /auth/register, /auth/login
│   │   │   ├── products.py      # /products CRUD
│   │   │   ├── auctions.py      # /auctions, /auctions/{id}/bid
│   │   │   ├── orders.py        # /orders (compra precio fijo)
│   │   │   ├── messages.py      # /conversations, /messages
│   │   │   ├── wishlist.py      # /wishlist
│   │   │   ├── reviews.py       # /reviews
│   │   │   ├── users.py         # /users/{id} perfil público
│   │   │   └── moderation.py    # /moderation/* (solo rol MODERATOR)
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── product_service.py
│   │   │   ├── auction_service.py
│   │   │   ├── order_service.py
│   │   │   ├── message_service.py
│   │   │   ├── wishlist_service.py
│   │   │   ├── review_service.py
│   │   │   └── moderation_service.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── auction.py
│   │   │   ├── order.py
│   │   │   ├── message.py
│   │   │   ├── wishlist.py
│   │   │   ├── review.py
│   │   │   └── price_alert.py
│   │   ├── core/
│   │   │   ├── config.py        # Settings desde .env via pydantic-settings
│   │   │   ├── security.py      # Hash bcrypt, crear/verificar JWT
│   │   │   ├── database.py      # Engine SQLModel, get_session dependency
│   │   │   └── dependencies.py  # get_current_user, require_moderator
│   │   ├── tasks/
│   │   │   └── auction_adjudicator.py  # APScheduler: cierre automático
│   │   └── main.py
│   ├── alembic/
│   │   └── versions/
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_products.py
│   │   ├── test_auctions.py
│   │   └── test_moderation.py
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # Funciones axios por dominio (authApi, productsApi…)
│   │   ├── components/          # Componentes reutilizables (ProductCard, Navbar…)
│   │   │   ├── ui/              # Primitivos: Button, Input, Badge, Modal…
│   │   │   └── layout/          # Navbar, BottomNav, Sidebar
│   │   ├── pages/               # Una carpeta por ruta principal
│   │   │   ├── Home/
│   │   │   ├── Search/
│   │   │   ├── ProductDetail/
│   │   │   ├── PublishProduct/
│   │   │   ├── Profile/
│   │   │   ├── Messages/
│   │   │   ├── Wishlist/
│   │   │   ├── Auth/            # Login + Register
│   │   │   └── Moderation/      # Solo accesible con rol MODERATOR
│   │   ├── store/               # Zustand stores (authStore, cartStore…)
│   │   ├── hooks/               # Custom hooks (useProducts, useAuction…)
│   │   ├── types/               # Tipos TypeScript espejo de los schemas del backend
│   │   ├── utils/               # Formatters, helpers
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
└── CLAUDE.md                    # Este fichero
```

---

## 5. Modelos de base de datos

Entidades principales derivadas de los requisitos funcionales:

### User
```python
class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    avatar_url: str | None = None
    role: UserRole = Field(default=UserRole.CLIENT)  # CLIENT | MODERATOR
    avg_rating: float = Field(default=0.0)
    total_reviews: int = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### Product
```python
class ProductStatus(str, Enum):
    ACTIVE = "active"
    SOLD = "sold"
    REMOVED = "removed"
    PENDING_REVIEW = "pending_review"  # esperando moderación por alerta de precio

class SaleType(str, Enum):
    FIXED = "fixed"
    AUCTION = "auction"

class ProductCondition(str, Enum):
    NEW = "new"
    LIKE_NEW = "like_new"
    GOOD = "good"
    USED = "used"

class Product(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    description: str
    condition: ProductCondition
    sale_type: SaleType
    price: Decimal                   # precio fijo O precio base de subasta
    status: ProductStatus = Field(default=ProductStatus.ACTIVE)
    seller_id: int = Field(foreign_key="user.id")
    created_at: datetime
    updated_at: datetime
    # categories: relación M2M via ProductCategory
    # images: relación 1:N via ProductImage
```

### Auction
```python
class Auction(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", unique=True)
    current_bid: Decimal = Field(default=Decimal("0"))
    current_bidder_id: int | None = Field(default=None, foreign_key="user.id")
    ends_at: datetime
    is_closed: bool = Field(default=False)
    # bids: relación 1:N via Bid
```

### Bid
```python
class Bid(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    auction_id: int = Field(foreign_key="auction.id")
    bidder_id: int = Field(foreign_key="user.id")
    amount: Decimal
    placed_at: datetime = Field(default_factory=datetime.utcnow)
```

### Order
```python
class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"

class Order(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id")
    buyer_id: int = Field(foreign_key="user.id")
    seller_id: int = Field(foreign_key="user.id")
    amount: Decimal
    status: OrderStatus = Field(default=OrderStatus.PENDING)
    created_at: datetime
    # buyer_reviewed / seller_reviewed: bool fields para controlar duplicados de review
    buyer_reviewed: bool = Field(default=False)
    seller_reviewed: bool = Field(default=False)
```

### Message / Conversation
```python
class Conversation(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    participant_a_id: int = Field(foreign_key="user.id")
    participant_b_id: int = Field(foreign_key="user.id")
    product_id: int | None = Field(default=None, foreign_key="product.id")
    created_at: datetime

class Message(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id")
    sender_id: int = Field(foreign_key="user.id")
    content: str                    # almacenar cifrado (AES-256)
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    read: bool = Field(default=False)
```

### WishlistItem
```python
class WishlistItem(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    product_id: int | None = Field(default=None, foreign_key="product.id")
    search_query: str | None = None  # para alertas de búsqueda sin resultado
    notify: bool = Field(default=True)
    created_at: datetime
```

### Review
```python
class Review(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id")
    reviewer_id: int = Field(foreign_key="user.id")
    reviewed_id: int = Field(foreign_key="user.id")
    rating: int = Field(ge=1, le=5)
    comment: str | None = None
    created_at: datetime
```

### PriceAlert (moderación)
```python
class PriceAlert(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id")
    deviation_pct: float            # % de desviación sobre el precio de referencia
    resolved: bool = Field(default=False)
    resolution: str | None = None   # "approved" | "rejected"
    resolved_by: int | None = Field(default=None, foreign_key="user.id")
    created_at: datetime
```

---

## 6. API — Endpoints principales

Prefijo global: `/api/v1`

### Auth
```
POST   /auth/register         → Crea cuenta con rol CLIENT
POST   /auth/login            → Devuelve access_token JWT (Bearer)
POST   /auth/refresh          → Renueva token
```

### Products
```
GET    /products              → Listado con filtros: q, category, condition,
                                sale_type, min_price, max_price, seller_id
                                Paginación: page, size
GET    /products/{id}         → Detalle completo
POST   /products              → Crear anuncio (auth requerida)
PUT    /products/{id}         → Editar (solo el vendedor)
DELETE /products/{id}         → Eliminar propio anuncio
```

### Auctions
```
GET    /auctions/{product_id}         → Estado actual de subasta
POST   /auctions/{product_id}/bid     → Pujar (valida tiempo y cantidad)
```

### Orders
```
POST   /orders                → Iniciar compra a precio fijo
GET    /orders/{id}           → Detalle de orden
PATCH  /orders/{id}/pay       → Simular confirmación de pago (stub pasarela)
```

### Messages
```
GET    /conversations                          → Listar conversaciones del usuario
POST   /conversations                          → Crear o recuperar conversación
GET    /conversations/{id}/messages            → Mensajes de una conversación
POST   /conversations/{id}/messages            → Enviar mensaje
PATCH  /conversations/{id}/messages/read       → Marcar como leídos
```

### Wishlist
```
GET    /wishlist              → Items guardados del usuario
POST   /wishlist              → Añadir producto o búsqueda
DELETE /wishlist/{id}         → Eliminar item
PATCH  /wishlist/{id}/notify  → Toggle notificaciones
```

### Reviews
```
POST   /reviews               → Crear valoración (valida orden completada + no duplicado)
GET    /users/{id}/reviews    → Valoraciones recibidas por un usuario
```

### Users
```
GET    /users/{id}            → Perfil público
GET    /users/me              → Perfil propio
PATCH  /users/me              → Editar perfil propio
GET    /users/me/transactions → Historial de compras y ventas
```

### Moderation (requiere rol MODERATOR)
```
GET    /moderation/alerts              → Alertas de precio pendientes
PATCH  /moderation/alerts/{id}         → Aprobar o rechazar (body: resolution)
GET    /moderation/products            → Todos los anuncios activos
DELETE /moderation/products/{id}       → Eliminar cualquier anuncio + notificar vendedor
```

---

## 7. Requisitos funcionales — mapa a implementación

| RF | Descripción resumida | Dónde implementar |
|----|---------------------|-------------------|
| RF01 | Registro e inicio de sesión seguro | `api/auth.py` + `services/auth_service.py` |
| RF02 | Moderador puede eliminar anuncios | `api/moderation.py` + `require_moderator` dep |
| RF03 | Venta por precio fijo y subasta | Modelos `Product` + `Auction` + `Bid` |
| RF04 | Alerta al moderador si precio excede umbral | `services/product_service.py` → crea `PriceAlert` |
| RF05 | Subir anuncios con toda la info | `POST /products` con imágenes multipart |
| RF06 | Notificar usuario cuando producto vuelve a stock | `tasks/` o trigger en `PATCH /products` |
| RF07 | Comprar productos de otros usuarios | `POST /orders` + stub pasarela |
| RF08 | Fotos, estado, categorías múltiples en anuncio | Modelos `ProductImage`, `ProductCategory` |
| RF09 | Wishlist dinámica con alertas | `models/wishlist.py` + notificaciones async |
| RF10 | Mensajería directa entre usuarios | `api/messages.py` + cifrado AES en service |
| RF11 | Asociar categorías múltiples a productos | Tabla `ProductCategory` (M2M) |
| RF12 | Búsqueda con filtros por nombre/categoría/vendedor | `GET /products` con query params |
| RF13 | Historial de compras y ventas | `GET /users/me/transactions` |
| RF14 | Adjudicación automática al finalizar subasta | `tasks/auction_adjudicator.py` (APScheduler) |
| RF15 | Pasarela de pago | `PATCH /orders/{id}/pay` (stub — no implementar real) |
| RF16 | Valoraciones tras transacción | `POST /reviews` con validaciones de duplicado |

---

## 8. Requisitos no funcionales — implementación

| RNF | Implementación concreta |
|-----|------------------------|
| RNF01 — Credenciales cifradas | `bcrypt` con cost factor 12. Nunca log de passwords. |
| RNF02 — Búsqueda < 0.5s | Índices en `title` (GIN full-text), `category_id`, `seller_id`, `status` |
| RNF03 — Escalabilidad horizontal | Sin estado en servidor (JWT stateless). BD centralizada. |
| RNF04 — Privacidad de chats | Contenido de mensajes cifrado AES-256 antes de persistir |
| RNF05 — RGPD | Endpoint `DELETE /users/me` que anonimiza datos. No logs de contenido. |
| RNF06 — Sanitizar imágenes | Validar MIME real (python-magic), rechazar ejecutables, renombrar UUID |
| RNF07 — Concurrencia en pujas | `SELECT FOR UPDATE` en la fila de `Auction` al validar una puja |
| RNF08 — Integridad temporal subastas | Validar `ends_at > now()` en BD dentro de la transacción de puja |
| RNF09 — Alta disponibilidad | Docker Compose + health checks. En prod: Gunicorn workers. |
| RNF10 — Dos roles | Enum `UserRole.CLIENT` y `UserRole.MODERATOR`. Dependencia `require_moderator`. |

---

## 9. Lógica de negocio crítica

### Alerta de precio (RF04)
El umbral de desviación se configura en `.env` como `PRICE_ALERT_THRESHOLD_PCT=30`.
Cuando se crea un producto, `product_service` calcula la mediana de precios de
productos activos en la misma categoría. Si el precio supera `mediana * (1 + threshold)`,
el producto se publica con `status=PENDING_REVIEW` y se crea un `PriceAlert`.
El moderador lo aprueba (→ `ACTIVE`) o rechaza (→ `REMOVED` + email al vendedor).

### Adjudicación automática de subastas (RF14)
`tasks/auction_adjudicator.py` usa APScheduler con un job que corre cada minuto.
Busca `Auction` donde `ends_at <= now() AND is_closed = false`. Para cada una:
1. Cierra la subasta (`is_closed = True`).
2. Si hay `current_bidder_id`: crea un `Order` con `status=PENDING`, notifica a
   comprador y vendedor. Cambia `Product.status = SOLD`.
3. Si no hay pujas: `Product.status = ACTIVE` de nuevo (o lógica que decida el equipo),
   notifica al vendedor de subasta desierta.

### Control de concurrencia en pujas (RNF07)
```python
async def place_bid(auction_id, bidder_id, amount, session):
    # Bloquea la fila para evitar race conditions
    auction = await session.exec(
        select(Auction)
        .where(Auction.id == auction_id)
        .with_for_update()
    ).one()

    if auction.is_closed or datetime.utcnow() > auction.ends_at:
        raise HTTPException(400, "Subasta cerrada")
    if amount <= auction.current_bid:
        raise HTTPException(400, "La puja debe superar la puja actual")

    auction.current_bid = amount
    auction.current_bidder_id = bidder_id
    session.add(Bid(auction_id=auction_id, bidder_id=bidder_id, amount=amount))
    await session.commit()
```

### Prevención de valoración duplicada (RF16, CU14)
Al crear un review, el servicio verifica `Order.buyer_reviewed` o `Order.seller_reviewed`
según quién revisa. Si ya está en `True`, devuelve `409 Conflict`. Si no, guarda la
review y pone el flag en `True` dentro de la misma transacción.

---

## 10. Sistema de diseño — ReMarket

Los ficheros de referencia del diseño están en `C:\Users\jorge\Documents\MENTAL BREAKDOWN\IW\design_handoff\iw\project\`. Contienen un prototipo React+Tailwind interactivo con las 10 pantallas implementadas. **Siempre contrastar con esos ficheros antes de implementar cualquier pantalla o componente.**

### Design tokens (Tailwind config)

```js
// tailwind.config.ts — copiar exactamente estos tokens
colors: {
  brand:    { DEFAULT: '#00A896', dark: '#007A6E', tint: '#E6F7F5', tint2: '#F0FBF9' },
  amber500: '#F5A623',
  danger:   '#E53E3E',
  success:  '#38A169',
  ink:      { 900: '#1A1A2E', 600: '#6B7280', 400: '#9CA3AF', 200: '#E5E7EB', 100: '#EFF1F4', 50: '#F9FAFB' },
},
boxShadow: {
  card:  '0 4px 16px rgba(0,0,0,0.10)',
  modal: '0 8px 32px rgba(0,0,0,0.18)',
},
borderRadius: { card: '12px' },
fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
```

Espaciado: base 4px (4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px).
Tipografía: Inter 400/500/600/700. Escala: 12 / 14 / 16 / 18 / 24 / 32 / 48px.

### CSS global obligatorio

```css
/* En index.css */
.skeleton {
  background: linear-gradient(90deg, #EEF0F3 0%, #F7F8FA 50%, #EEF0F3 100%);
  background-size: 200% 100%;
  animation: skl 1.4s ease-in-out infinite;
}
@keyframes skl { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.toast-in { animation: toastIn .35s cubic-bezier(.2,.7,.2,1); }
@keyframes toastIn { from { transform: translateY(-12px); opacity: 0; } to { transform: none; opacity: 1; } }
.fade-in { animation: fade .25s ease; }
@keyframes fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.focus-ring:focus-visible { outline: 2px solid #00A896; outline-offset: 2px; }
```

### Componentes primitivos (`src/components/ui/`)

Referencia canónica: `design_handoff/iw/project/src/ui.jsx` y `shared.jsx`.

| Componente | Variantes clave | Notas |
|-----------|----------------|-------|
| `Button` | `primary` (teal) / `amber` / `danger` / `ghost` / `outline` / `outlineBrand` / `outlineSuccess` / `outlineDanger` / `dark` | Tamaños: sm/md/lg/xl. Prop `loading` muestra spinner. |
| `Badge` | `neutral` / `brand` / `amber` / `amberSoft` / `danger` / `dangerSoft` / `success` / `successSoft` / `blue` / `white` / `dark` | Pill (rounded-full), 11px/semibold |
| `Chip` | active (teal filled) / inactive (white border) | Toggle filter chips |
| `Input` | Con `icon`, `prefix` (€), `suffix`, `error`, `hint` | h-11, rounded-lg, border-brand on focus |
| `Textarea` | Con `maxLength` counter y `error` | resize-y, min-h-[100px] |
| `Segmented` | — | Segmented control: bg-ink-100 p-1 rounded-lg |
| `Toggle` | sm / md | Checkbox estilo iOS |
| `Avatar` | `size` en px | Círculo con inicial del usuario, color de fondo por usuario |
| `Stars` | `value` float, `size` px | Estrella rellena en #F5A623 |
| `Modal` | `open`, `onClose`, `width` | Backdrop blur, fade-in |
| `Toast` | `kind`: success / error / info | Slide desde top-right, 4s auto-dismiss; sistema vía `ToastContext` |

### Componentes compartidos (`src/components/`)

| Componente | Descripción |
|-----------|-------------|
| `ProductCard` | Imagen 1:1, badge SUBASTA (amber), corazón wishlist, countdown chip, precio (teal/amber), seller, ciudad, condición |
| `SkeletonCard` | Placeholder animado para grids de carga |
| `Navbar` | Desktop: logo + categorías + search pill + iconos + "Publicar" + avatar |
| `BottomNav` | Mobile only, fixed bottom, 5 tabs, "Publicar" como pill teal elevado |
| `Footer` | Grid de 5 columnas en desktop; compacto en mobile |
| `AuctionTimer` | Boxes [DD] [HH] [MM] [SS] con fondo ink-900 y número blanco 32px/700 |

### Pantallas (`src/pages/`)

| Pantalla | Ruta | Fichero referencia |
|---------|------|--------------------|
| Home | `/` | `screen_home.jsx` |
| Búsqueda + filtros | `/search` | `screen_search.jsx` |
| Detalle producto (fijo + subasta) | `/products/:id` | `screen_product.jsx` |
| Publicar anuncio (3 pasos) | `/publish` | `screen_publish.jsx` |
| Perfil de usuario | `/profile/:id` | `screen_profile.jsx` |
| Wishlist | `/wishlist` | `screen_wishlist.jsx` |
| Mensajería | `/messages` | `screen_messages.jsx` |
| Auth (login + registro) | `/auth` | `screen_auth.jsx` |
| Panel moderador | `/moderation` | `screen_moderator.jsx` |
| Valorar transacción | Modal en perfil | `screen_rate.jsx` |

### Reglas visuales críticas

- **Fijo vs subasta**: precio en `text-brand-dark` (teal) para precio fijo; en `amber500` para puja actual. Badge "SUBASTA" en `tone="amber"`.
- **Moderador**: sidebar dark (`bg-ink-900`), resto del panel en blanco. Alertas de precio con borde izquierdo rojo (>50% desviación) o amber (20–50%).
- **Empty states**: toda lista/grid debe tener un empty state diseñado (icono + texto + CTA), nunca lista vacía sin feedback.
- **Skeletons**: mientras carga cualquier grid de productos, mostrar `SkeletonCard` con animación pulse.
- **Responsive**: mobile-first. `< 768px`: grid 2 col, BottomNav visible, Navbar sin categorías. `768–1024px`: grid 3 col. `> 1024px`: grid 4 col, sidebar de filtros visible.
- **Lucide icons**: `strokeWidth={1.5}` en todos los iconos sin excepción.

---

## 12. Frontend — Convenciones

### Estructura de componentes
- **Primitivos** (`src/components/ui/`): `Button`, `Input`, `Badge`, `Modal`, `Toast`,
  `Skeleton`, `Avatar`, `StarRating`. Sin lógica de negocio, solo props.
- **Compuestos** (`src/components/`): `ProductCard`, `AuctionTimer`, `BidForm`,
  `ConversationList`, `ReviewModal`. Pueden tener estado local.
- **Páginas** (`src/pages/`): Orquestan componentes, llaman a la API, manejan
  estado global via Zustand.

### TypeScript
- Tipos en `src/types/` que espejean exactamente los schemas de respuesta del backend.
- Prohibido usar `any`. Si el tipo es desconocido, usar `unknown` con type guard.
- Todos los componentes deben tener sus props tipadas con `interface`.

### Llamadas a la API
- Todas las llamadas en `src/api/` agrupadas por dominio (`productsApi.ts`, `authApi.ts`…).
- El interceptor de Axios añade automáticamente el header `Authorization: Bearer <token>`.
- Manejar siempre loading state, error state y success state en los componentes.

### Diseño
- Seguir el sistema de diseño definido (ver prompt de Claude Design).
- Colores via clases Tailwind personalizadas definidas en `tailwind.config.ts`.
- No usar estilos inline salvo para valores dinámicos (ej. countdown timer).
- Responsive: mobile-first. Breakpoints: `sm` (640), `md` (768), `lg` (1024), `xl` (1280).

---

## 11. Entorno de desarrollo

### Levantar todo con Docker
```bash
# Primera vez
cp backend/.env.example backend/.env
docker compose up --build

# Aplicar migraciones
docker compose exec backend alembic upgrade head

# Seed de datos de prueba
docker compose exec backend python -m app.seed
```

### Sin Docker (desarrollo rápido)
```bash
# Backend
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

### Variables de entorno (backend/.env.example)
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/remarket
SECRET_KEY=cambia_esto_en_produccion_min_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
PRICE_ALERT_THRESHOLD_PCT=30
MAX_IMAGE_SIZE_MB=5
```

---

## 13. Testing

### Backend
```bash
cd backend
uv run pytest tests/ -v --cov=app
```

Cada test usa una BD en memoria (SQLite) via fixture `test_session`.
No mockear la BD: usar transacciones que se revierten tras cada test.

Cobertura mínima exigida: **70%** en `services/`.

Casos obligatorios a testear:
- Registro con email duplicado → 409
- Login con credenciales incorrectas → 401
- Puja sobre subasta ya cerrada → 400
- Doble valoración de la misma orden → 409
- Acceso a endpoint de moderación sin rol → 403

### Frontend
```bash
cd frontend
npm run test
```

Testear al menos: `ProductCard`, `AuctionTimer`, lógica del `authStore`.

---

## 14. CI (GitHub Actions)

El workflow `.github/workflows/ci.yml` se ejecuta en cada push a cualquier rama
y en cada Pull Request a `main`.

Pasos:
1. `ruff check` y `ruff format --check` en backend.
2. `pytest` con coverage.
3. `eslint` y `tsc --noEmit` en frontend.
4. `vitest run` en frontend.

**Ningún PR puede mergearse a `main` si el CI falla.**

---

## 15. Flujo de trabajo en ramas

```
main          ← producción / entrega final. Protegida.
develop       ← integración. Todos los PR van aquí primero.
feat/<nombre> ← features individuales
fix/<nombre>  ← correcciones
```

Ejemplo de flujo:
```bash
git checkout develop
git pull
git checkout -b feat/auction-adjudicator
# ... trabajo ...
git add .
git commit -m "feat(auctions): implementar adjudicación automática al expirar subasta"
git push origin feat/auction-adjudicator
# Abrir PR: feat/auction-adjudicator → develop
```

---

## 16. Lo que NO hacer (antipatrones prohibidos)

- **No poner lógica en los routers.** Toda la lógica va en services.
- **No hardcodear secrets.** Todo via `.env` y `core/config.py`.
- **No usar `session.exec(select(Model))` sin paginar** en endpoints de listado.
- **No hacer `SELECT *` en endpoints que devuelven listas grandes.**
- **No saltarse el `SELECT FOR UPDATE` en la lógica de pujas.** Causará race conditions.
- **No subir archivos sin validar el MIME type real** (no confiar en la extensión).
- **No añadir datos de autoría de herramientas de IA en commits.** (Ver sección 0.)
- **No mergear a `main` sin pasar por `develop` y sin CI verde.**
- **No commitear el fichero `.env`** — solo `.env.example` va al repo.