# Plataforma C2C: Sistema de Compra-Venta Web

## 🏗️ Estructura de Paquetes Spring Boot (Backend)
El backend está estructurado siguiendo los principios de Arquitectura Limpia y MVC:

```text
com.c2c.market
│
├── config/                 # Configuraciones globales
│   ├── SecurityConfig.java # Configuración de Spring Security y JWT
│   └── WebSocketConfig.java# Configuración de WebSockets (Chat STOMP)
│
├── controller/             # Controladores REST (API Endpoints)
│   ├── AuthController.java # Endpoints de Login/Registro
│   ├── ProductController.java # Endpoints de Productos
│   ├── AuctionController.java # Endpoints de Subastas y Pujas
│   └── ModerationController.java # Endpoints para Moderadores
│
├── service/                # Lógica de Negocio
│   ├── AuthService.java    # Gestión de JWT y BCrypt
│   ├── ProductService.java # Lógica CRUD, Sanitización (RNF06)
│   ├── AuctionSchedulerService.java # Tarea programada de adjudicación de subastas (CU08, CU11)
│   └── ModerationIntelligenceService.java # Algoritmo de detección de inflación (RF04)
│
├── repository/             # Acceso a Datos (Spring Data JPA)
│   ├── UserRepository.java
│   ├── ProductRepository.java # Consultas con búsqueda de texto completo (GIN)
│   └── BidRepository.java
│
├── entity/                 # Modelos de Dominio (Mapeados a JPA)
│   ├── User.java           # Roles: VISITOR, CLIENT, MODERATOR
│   ├── Product.java        # Tipos: FIXED, AUCTION
│   ├── Bid.java            # Control de concurrencia (@Version o Unique Constraint)
│   └── Transaction.java
│
├── dto/                    # Objetos de Transferencia de Datos
│   ├── request/            # Datos entrantes (e.g., ProductCreateRequest)
│   └── response/           # Datos salientes (e.g., AuthResponse)
│
└── exception/              # Manejo global de excepciones (@ControllerAdvice)
```

---

## 💾 Persistencia y Base de Datos (PostgreSQL)
Se ha generado el archivo `schema.sql` (ubicado en `backend/src/main/resources/schema.sql`).
Características clave:
- **Relaciones fuertes**: Uso estricto de claves foráneas.
- **Rendimiento (<0.5s)**: Se crearon índices avanzados como `GIN` con `to_tsvector` para búsquedas Full-Text en español sobre el título y descripción de los productos.
- **Concurrencia**: `UNIQUE(product_id, amount)` en la tabla `bids` previene condiciones de carrera donde dos usuarios pujan la misma cantidad al mismo exacto milisegundo.

---

## ⏱️ Lógica de Subastas y Adjudicación Automática (CU08, CU11)
El archivo `AuctionSchedulerService.java` implementa un `@Scheduled` (cron job) que se ejecuta cada minuto para revisar qué subastas han finalizado (`end_time` superado).
1. Busca subastas activas caducadas.
2. Encuentra la puja más alta (`BidRepository.findTopByProductId...`).
3. Genera automáticamente una `Transaction` en estado `PENDING`.
4. Utiliza `@Transactional` en las consultas para aplicar bloqueos optimistas/pesimistas asegurando la consistencia transaccional.
5. Emite notificaciones por email a vendedor y comprador mediante Spring Mail.

---

## 🤖 Inteligencia de Moderación (RF04, CU10)
En el backend, un *Listener* evalúa cada nuevo anuncio publicado:
- Si el precio del producto supera un umbral histórico de la categoría (ej. inflación > 30% del precio de mercado base), se marca internamente y genera un registro en la tabla `moderation_alerts`.
- El **Panel de Moderación** de React recibe estas alertas en tiempo real.

---

## 🎨 Componentes React y Diseño (Frontend)
Los componentes creados están listos para integrarse con React Router y TailwindCSS:

1. **`ClientDashboard.jsx`**: 
   - Diseño limpio con Tailwind, colores responsivos y modernos.
   - Búsqueda con filtros cruzados y funcionalidad de **Wishlist**. Si un usuario busca algo y no hay, puede activar el rastreo de búsquedas.
   - Vista de tarjetas ("Cards") de productos indicando si es Subasta o Venta directa con cuenta atrás en tiempo real.
   - Sanitización asumida: El backend envía una URL de imagen de un S3/Cloud Storage validada, evitando mostrar archivos maliciosos.

2. **`ModeratorPanel.jsx`**:
   - Diseño oscuro ("Dark Mode") profesional para enfocar la revisión de datos.
   - Pestaña de **Alertas de Inflación** (Algoritmo Automático) mostrando de forma visual el salto de precio abusivo.
   - Pestaña de **Reportes** donde los moderadores pueden dar de baja anuncios inapropiados o suspender usuarios.

## 🔒 Cumplimiento y Seguridad
- **Sanitización de Imágenes (RNF06)**: Las imágenes se verifican por su MIME-type y extensiones en el backend, guardándolas en un CDN seguro.
- **Privacidad (RGPD) (RNF05)**: Claves y mensajes del chat cifrados. Eliminación en cascada de datos privados.
- **Concurrencia (RNF07)**: Gestión de "Race Conditions" implementando aislamiento transaccional a nivel de Base de Datos y JPA.
- **Alta Disponibilidad**: Estructura de aplicación sin estado ("Stateless" con JWT), lo que permite replicar múltiples instancias del backend horizontalmente detrás de un balanceador de carga para mantener uptime 24/7.
