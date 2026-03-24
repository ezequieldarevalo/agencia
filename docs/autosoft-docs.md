---
title: "AutoSoft — Documentación Completa"
subtitle: "Sistema de Gestión para Agencias de Autos"
author: "AutoSoft v0.1.0"
date: "Marzo 2026"
geometry: margin=2.5cm
fontsize: 11pt
toc: true
toc-depth: 3
numbersections: true
colorlinks: true
linkcolor: blue
urlcolor: blue
header-includes: |
  \usepackage{fancyhdr}
  \pagestyle{fancy}
  \fancyhead[L]{AutoSoft — Documentación}
  \fancyhead[R]{\thepage}
  \fancyfoot[C]{}
  \usepackage{longtable}
  \usepackage{booktabs}
---

\newpage

# Introducción

**AutoSoft** es un sistema integral de gestión diseñado para agencias de automóviles. Permite administrar inventario de vehículos, clientes, proveedores, empleados, movimientos de caja, deudas, calendario, pipeline de ventas e integraciones con plataformas externas (MercadoLibre, Meta/Facebook/Instagram, WhatsApp Business).

## Características Principales

- **Inventario de Vehículos**: Alta, baja, modificación con fotos, especificaciones técnicas y precios en ARS/USD.
- **Gestión de Clientes y Prospectos**: CRM con seguimiento de interacciones y pipeline de ventas.
- **Proveedores**: Gestión de proveedores de vehículos y servicios.
- **Empleados**: Alta de empleados con creación opcional de usuarios del sistema.
- **Caja y Finanzas**: Múltiples cuentas (efectivo, banco, USD), movimientos con categorización.
- **Deudas y Cobros**: Seguimiento de deudas con pagos parciales y recordatorios.
- **Calendario**: Agenda de eventos (test drives, seguimientos, pagos, entregas, reuniones).
- **Reportes**: Dashboard analítico con estadísticas de ventas, rentabilidad y métricas de negocio.
- **Integraciones**: MercadoLibre, Facebook/Instagram (Meta), WhatsApp Business API.
- **Búsqueda Global**: Búsqueda unificada de vehículos, clientes y proveedores.
- **Notificaciones**: Sistema de notificaciones en tiempo real.
- **App Móvil**: Soporte nativo para Android e iOS vía Capacitor + PWA.

\newpage

# Arquitectura del Sistema

## Stack Tecnológico

| Componente | Tecnología | Versión |
|---|---|---|
| Framework Web | Next.js (App Router) | 14.2.35 |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | 3.4.1 |
| Base de Datos | PostgreSQL (Neon) | — |
| ORM | Prisma | 5.22.0 |
| Autenticación | NextAuth.js | 4.24.13 |
| Gráficos | Recharts | 3.8.0 |
| Iconos | Lucide React | 0.577.0 |
| App Nativa | Capacitor | 8.2.0 |
| Encriptación | bcryptjs | 3.0.3 |

## Estructura del Proyecto

```
agencia/
└── app/                          # Proyecto principal
    ├── prisma/
    │   ├── schema.prisma         # Esquema de base de datos
    │   ├── seed.ts               # Datos iniciales
    │   └── migrations/           # Migraciones SQL
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx        # Layout raíz
    │   │   ├── globals.css       # Estilos globales
    │   │   ├── page.tsx          # Página principal (redirect)
    │   │   ├── login/            # Página de login
    │   │   ├── register/         # Página de registro
    │   │   ├── api/              # Rutas de API (backend)
    │   │   └── dashboard/        # Páginas del panel
    │   ├── components/
    │   │   ├── sidebar.tsx       # Barra lateral (colapsable en móvil)
    │   │   ├── top-bar.tsx       # Barra superior con breadcrumbs
    │   │   ├── global-search.tsx # Búsqueda global (Ctrl+K)
    │   │   ├── providers.tsx     # Providers (Session + Capacitor)
    │   │   └── ui/               # Componentes reutilizables
    │   └── lib/
    │       ├── auth.ts           # Configuración NextAuth
    │       ├── prisma.ts         # Cliente Prisma singleton
    │       ├── capacitor.ts      # Inicialización plugins nativos
    │       ├── utils.ts          # Utilidades (formateo, provincias)
    │       └── integrations/     # Lógica de integraciones
    ├── android/                  # Proyecto nativo Android
    ├── ios/                      # Proyecto nativo iOS
    ├── public/                   # Assets estáticos + íconos PWA
    ├── capacitor.config.ts       # Config Capacitor
    ├── tailwind.config.ts        # Config Tailwind
    └── package.json              # Dependencias y scripts
```

## Flujo de Datos

```
[Cliente Móvil/Web] → [Next.js Frontend (React)]
                           ↓ fetch(/api/...)
                    [Next.js API Routes]
                           ↓ Prisma ORM
                    [PostgreSQL - Neon]
                           ↓ (integraciones)
              [MercadoLibre / Meta / WhatsApp]
```

\newpage

# Base de Datos

## Diagrama de Modelos

El sistema utiliza PostgreSQL hospedado en Neon, gestionado mediante Prisma ORM. A continuación se describen todos los modelos.

## User (Usuarios)

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador único |
| email | String (unique) | Email de acceso |
| password | String | Contraseña hasheada (bcrypt) |
| name | String? | Nombre del usuario |
| role | String | Rol: "ADMIN" o "USER" |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

**Relaciones**: Un User puede estar vinculado a un Employee (1:1 opcional).

## Employee (Empleados)

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador único |
| firstName | String | Nombre |
| lastName | String | Apellido |
| email | String (unique) | Email |
| phone | String? | Teléfono |
| area | String | Área: "VENTAS", "ADMINISTRACION", etc. |
| dni | String? | DNI |
| province, city, street, streetNumber | String? | Dirección |
| active | Boolean | Estado activo/inactivo |
| userId | String? (unique) | Usuario vinculado |

## Client (Clientes)

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador único |
| personType | String | "FISICA" o "JURIDICA" |
| clientType | String | "CLIENTE" o "PROSPECTO" |
| firstName | String | Nombre |
| lastName | String | Apellido |
| email, phone | String? | Datos de contacto |
| dni, cuit, cuil | String? | Documentos fiscales |
| sex | String? | Sexo |
| province, city, street, streetNumber | String? | Dirección |
| observations | String? | Observaciones |
| lastContact | DateTime? | Último contacto |

**Relaciones**: Vehículos comprados, deudas, interacciones, mensajes WA, eventos de calendario.

## Supplier (Proveedores)

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador único |
| personType | String | "FISICA" o "JURIDICA" |
| supplierType | String | "VEHICULOS", "SERVICIOS", etc. |
| supplierSubtype | String? | Subtipo |
| firstName, lastName | String | Nombre completo |
| email, phone | String? | Contacto |
| dni, cuit, cuil | String? | Documentos |

**Relaciones**: Vehículos suministrados.

## Vehicle (Vehículos)

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador único |
| name | String | Nombre del vehículo |
| status | String | "DISPONIBLE", "RESERVADO", "VENDIDO", "EN_CONSIGNACION" |
| category | String | "AUTOS_Y_CAMIONETAS", "MOTOS", "CAMIONES", etc. |
| brand, model, version | String? | Marca, modelo, versión |
| year | Int? | Año |
| kilometers | Int? | Kilómetros |
| priceARS, priceUSD | Float? | Precios |
| currency | String | Moneda principal: "ARS" o "USD" |
| exchangeRate | Float? | Tipo de cambio |
| fuel | String? | Combustible |
| color | String? | Color |
| doors | Int? | Puertas |
| bodyType | String? | Tipo de carrocería |
| transmission | String? | Transmisión |
| engine | String? | Motor |
| domain | String? | Patente/dominio |
| engineNumber, chassisNumber | String? | Números de identificación |
| description, notes | String? | Descripción y notas |
| locationProvince, locationCity | String? | Ubicación |
| published | Boolean | Publicado en plataformas |
| supplierId, buyerId | String? | Proveedor y comprador |

**Relaciones**: Fotos, movimientos de caja, deudas, interacciones, publicaciones Meta, mensajes WA, listings ML, eventos de calendario.

## VehiclePhoto (Fotos de Vehículos)

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador |
| url | String | URL de la imagen |
| order | Int | Orden de visualización |
| vehicleId | String | Vehículo asociado |

## CashAccount (Cuentas de Caja)

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador |
| name | String | Nombre de la cuenta |
| type | String | "EFECTIVO", "BANCO", "MERCADOPAGO", etc. |
| currency | String | "ARS" o "USD" |
| identifier | String? | CBU/Alias/Número |
| initialBalance | Float | Saldo inicial |
| currentBalance | Float | Saldo actual |
| active | Boolean | Activa/Inactiva |

## CashMovement (Movimientos de Caja)

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador |
| date | DateTime | Fecha del movimiento |
| type | String | "INGRESO" o "EGRESO" |
| concept | String | Concepto |
| category | String? | Categoría |
| amountARS, amountUSD | Float | Montos |
| exchangeRate | Float? | Tipo de cambio |
| currency | String | Moneda |
| cashAccountId | String | Cuenta asociada |
| vehicleId | String? | Vehículo asociado (opcional) |

## Debt (Deudas)

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador |
| category | String | "VENTA", "SERVICIO", etc. |
| paymentMethod | String | "EFECTIVO", "TRANSFERENCIA", etc. |
| totalAmount | Float | Monto total |
| paidAmount | Float | Monto pagado |
| currency | String | Moneda |
| status | String | "PENDIENTE", "PARCIAL", "PAGADA" |
| nextPayment | DateTime? | Próximo vencimiento |
| clientId | String | Cliente deudor |
| vehicleId | String? | Vehículo asociado |
| concept | String? | Concepto |

**Relaciones**: Pagos parciales (DebtPayment[]).

## Interaction (Interacciones/Leads)

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador |
| date | DateTime | Fecha |
| status | String | "CONSULTA_ABIERTA", "EN_NEGOCIACION", "RESERVADO", "CERRADO_GANADO", "CERRADO_PERDIDO" |
| origin | String? | Origen: "PRESENCIAL", "WHATSAPP", "MERCADOLIBRE", "INSTAGRAM", "FACEBOOK", "TELEFONO", "REFERIDO" |
| score | Int | Puntuación (0-100) |
| notes | String? | Notas |
| search* | Varios | Criterios de búsqueda del cliente |
| budget* | Varios | Presupuesto y condiciones |
| saleCompleted | Boolean | Venta completada |
| clientId | String | Cliente |
| vehicleId | String? | Vehículo de interés |

## Dealership (Agencia)

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador |
| name | String | Nombre de la agencia |
| email, phone | String? | Contacto |
| cuit | String? | CUIT |
| province, city, street, streetNumber | String? | Dirección |
| logoUrl | String? | Logo |
| schedule | String? | Horarios |
| videoUrl | String? | Video institucional |
| description | String? | Descripción |
| saleContract, depositReceipt, consignmentContract | String? | Documentos legales |
| plan | String | Plan: "V12_PREMIUM" |
| metaIntegration, whatsappIntegration, mlIntegration | Boolean | Integraciones habilitadas |
| meta*, wa*, ml* | Varios | Tokens y datos de integración |

## MetaPublication (Publicaciones Meta)

| Campo | Tipo | Descripción |
|---|---|---|
| vehicleId | String | Vehículo |
| platform | String | "FACEBOOK", "INSTAGRAM", "BOTH" |
| postId | String? | ID del post en la red social |
| status | String | "DRAFT", "PUBLISHED", "FAILED", "REMOVED" |
| message | String? | Texto de la publicación |
| reach, clicks, inquiries | Int | Métricas |

## WaTemplate (Templates WhatsApp)

| Campo | Tipo | Descripción |
|---|---|---|
| name | String | Nombre del template |
| slug | String (unique) | Identificador URL |
| category | String | "MARKETING", "UTILITY", "AUTHENTICATION" |
| body | String | Cuerpo con variables \{\{nombre\}\} |
| active | Boolean | Estado |

## WaMessage (Mensajes WhatsApp)

| Campo | Tipo | Descripción |
|---|---|---|
| direction | String | "INBOUND" o "OUTBOUND" |
| phone | String | Teléfono del cliente |
| messageType | String | "TEXT", "IMAGE", "TEMPLATE", "VEHICLE_CARD" |
| content | String | Contenido del mensaje |
| status | String | "SENT", "DELIVERED", "READ", "FAILED" |

## MlListing (Listings MercadoLibre)

| Campo | Tipo | Descripción |
|---|---|---|
| vehicleId | String | Vehículo |
| mlItemId | String? (unique) | ID del item en ML |
| status | String | "DRAFT", "ACTIVE", "PAUSED", "CLOSED", "UNDER_REVIEW" |
| title | String | Título de la publicación |
| price | Float | Precio |
| listingType | String | "free", "bronze", "silver", "gold", "gold_special" |
| views, questions, favorites | Int | Métricas |

## MlQuestion (Preguntas MercadoLibre)

| Campo | Tipo | Descripción |
|---|---|---|
| listingId | String | Listing asociado |
| buyerNickname | String? | Comprador |
| question | String | Pregunta |
| answer | String? | Respuesta |
| status | String | "UNANSWERED", "ANSWERED", "CLOSED_UNANSWERED" |

## Notification (Notificaciones)

| Campo | Tipo | Descripción |
|---|---|---|
| type | String | "NEW_LEAD", "PAYMENT_RECEIVED", "VEHICLE_SOLD", etc. |
| title | String | Título |
| message | String | Mensaje |
| link | String? | URL de navegación |
| read | Boolean | Leída |

## CalendarEvent (Eventos de Calendario)

| Campo | Tipo | Descripción |
|---|---|---|
| title | String | Título del evento |
| type | String | "TEST_DRIVE", "SEGUIMIENTO", "PAGO", "ENTREGA", "REUNION", "OTRO" |
| date, endDate | DateTime | Fecha inicio y fin |
| allDay | Boolean | Evento de día completo |
| description | String? | Descripción |
| clientId, vehicleId | String? | Cliente y vehículo asociados |
| completed | Boolean | Completado |
| color | String? | Color en el calendario |

\newpage

# API REST

Todas las rutas están bajo `/api/`. Los endpoints usan JSON para request/response.

## Autenticación

### POST /api/auth/register

Registra un nuevo usuario y crea la agencia por defecto.

**Request Body:**

```json
{
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "micontraseña"
}
```

**Response (201):**

```json
{
  "message": "Account created successfully",
  "userId": "cuid..."
}
```

### POST /api/auth/[...nextauth]

Login mediante NextAuth con credenciales (email + password). Retorna JWT session.

## Dashboard

### GET /api/dashboard?year=2026

Retorna estadísticas completas del dashboard.

**Response:**

```json
{
  "stats": {
    "total": 15,
    "disponibles": 8,
    "reservados": 3,
    "vendidos": 4
  },
  "monthlyOps": [
    { "mes": "Ene", "compras": 2, "ventas": 3 }
  ],
  "profitability": {
    "totalIngresos": 50000000,
    "totalEgresos": 35000000,
    "utilidadBruta": 15000000,
    "margenPromedio": 30
  },
  "details": [
    { "id": "...", "vehiculo": "Toyota Corolla", "compra": 10000000, "venta": 13000000 }
  ]
}
```

## Vehículos

### GET /api/vehicles

Lista todos los vehículos con fotos, proveedor y comprador.

### POST /api/vehicles

Crea un nuevo vehículo.

**Request Body:**

```json
{
  "name": "Toyota Corolla 2020",
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "kilometers": 45000,
  "priceARS": 15000000,
  "status": "DISPONIBLE",
  "category": "AUTOS_Y_CAMIONETAS"
}
```

### GET /api/vehicles/[id]

Detalle de un vehículo específico con todas sus relaciones.

### PUT /api/vehicles/[id]

Actualiza un vehículo existente.

### DELETE /api/vehicles/[id]

Elimina un vehículo y sus fotos asociadas (cascade).

## Clientes

### GET /api/clients

Lista todos los clientes.

### POST /api/clients

Crea un nuevo cliente.

### PUT /api/clients/[id]

Actualiza un cliente.

### DELETE /api/clients/[id]

Elimina un cliente.

## Proveedores

### GET /api/suppliers

Lista todos los proveedores.

### POST /api/suppliers

Crea un nuevo proveedor.

### PUT /api/suppliers/[id]

Actualiza un proveedor.

### DELETE /api/suppliers/[id]

Elimina un proveedor.

## Empleados

### GET /api/employees

Lista todos los empleados con su usuario vinculado.

### POST /api/employees

Crea un empleado. Si se provee `createUser: true`, también crea un usuario del sistema.

**Request Body:**

```json
{
  "firstName": "María",
  "lastName": "González",
  "email": "maria@agencia.com",
  "phone": "+54 11 1234-5678",
  "area": "VENTAS",
  "createUser": true,
  "password": "password123"
}
```

### PUT /api/employees/[id]

Actualiza un empleado.

### DELETE /api/employees/[id]

Elimina un empleado.

## Caja y Finanzas

### GET /api/cash/accounts

Lista todas las cuentas de caja.

### POST /api/cash/accounts

Crea una nueva cuenta.

### GET /api/cash/movements

Lista todos los movimientos de caja con su cuenta asociada.

### POST /api/cash/movements

Registra un nuevo movimiento. Actualiza automáticamente el saldo de la cuenta.

**Request Body:**

```json
{
  "type": "INGRESO",
  "concept": "Venta de vehículo",
  "amountARS": 15000000,
  "currency": "ARS",
  "cashAccountId": "cuid...",
  "vehicleId": "cuid..."
}
```

## Deudas

### GET /api/debts

Lista todas las deudas con sus pagos, cliente y vehículo. Ordenadas por próximo vencimiento.

### POST /api/debts

Crea una nueva deuda o registra un pago parcial.

**Crear deuda:**

```json
{
  "action": "create",
  "clientId": "cuid...",
  "totalAmount": 5000000,
  "currency": "ARS",
  "category": "VENTA",
  "nextPayment": "2026-04-15"
}
```

**Registrar pago:**

```json
{
  "action": "pay",
  "debtId": "cuid...",
  "amount": 1000000
}
```

## Interacciones / Leads

### GET /api/interactions

Lista todas las interacciones con cliente y vehículo asociados.

### POST /api/interactions

Crea una nueva interacción (lead).

**Request Body:**

```json
{
  "clientId": "cuid...",
  "status": "CONSULTA_ABIERTA",
  "origin": "WHATSAPP",
  "vehicleId": "cuid...",
  "notes": "Interesado en financiación",
  "score": 75
}
```

## Calendario

### GET /api/calendar?month=3&year=2026

Retorna eventos del mes y año indicado.

### POST /api/calendar

Gestión de eventos.

**Crear evento:**

```json
{
  "action": "create",
  "title": "Test Drive - Toyota Corolla",
  "type": "TEST_DRIVE",
  "date": "2026-03-25T10:00:00",
  "clientId": "cuid...",
  "vehicleId": "cuid..."
}
```

**Acciones:** `create`, `update`, `delete`, `toggle-complete`.

## Agencia (Dealership)

### GET /api/dealership

Retorna la configuración de la agencia. Si no existe, crea una por defecto.

### PUT /api/dealership

Actualiza la información de la agencia.

## Reportes

### GET /api/reports?period=month

Retorna reportes completos del negocio.

**Parámetros:** `period` = `month` | `year` | `all`

**Response incluye:**

- `inventory`: total, disponibles, reservados, vendidos, valor total
- `financial`: ingresos, egresos, balance, cuentas por cobrar
- `monthlySales`: operaciones por mes
- `topBrands`: marcas más vendidas
- `typeDistribution`: distribución por categoría
- `topProfitable`: vehículos más rentables
- `clients`: total, nuevos este mes
- `leads`: consultas abiertas, en negociación, tasa de conversión

## Búsqueda Global

### GET /api/search?q=toyota

Busca en vehículos, clientes y proveedores.

**Response:**

```json
{
  "results": [
    {
      "type": "vehicle",
      "id": "cuid...",
      "title": "Toyota Corolla 2020",
      "subtitle": "45.000 km - $15.000.000",
      "url": "/dashboard/vehicles/cuid..."
    },
    {
      "type": "client",
      "id": "cuid...",
      "title": "Juan Pérez",
      "subtitle": "juan@email.com",
      "url": "/dashboard/clients"
    }
  ]
}
```

## Notificaciones

### GET /api/notifications

Lista las últimas 20 notificaciones.

### POST /api/notifications

Acciones: marcar como leída, marcar todas como leídas, eliminar.

## Operaciones

Las operaciones son el corazón del sistema. Representan cada transacción comercial de la agencia: compra, venta o consignación de un vehículo.

### Modelo de Datos

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador único |
| type | String | "COMPRA", "VENTA", "CONSIGNACION" |
| status | String | "EN_CURSO", "COMPLETADA", "CANCELADA" |
| vehicleId | String | Vehículo asociado |
| clientId | String? | Cliente (requerido en VENTA) |
| supplierId | String? | Proveedor (requerido en COMPRA) |
| amount | Float? | Monto total de la operación |
| paidAmount | Float | Monto pagado acumulado |
| notes | String? | Notas adicionales |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

**Relaciones**: steps (OperationStep[]), payments (CashMovement[]).

### OperationStep (Pasos de Operación)

Cada operación tiene pasos predefinidos según su tipo. Los pasos pueden ser requeridos u opcionales, y algunos son condicionales (solo aparecen si aplica).

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador |
| key | String | Clave del paso (ej: "deposito", "transferencia") |
| label | String | Nombre legible del paso |
| completed | Boolean | Completado |
| required | Boolean | Requerido para cerrar |
| order | Int | Orden de visualización |

### Pasos por Tipo de Operación

**COMPRA**: Verificación vehicular → Seña/depósito → Pago total → Transferencia → Retiro del vehículo → Publicación → Documentos de compra

**VENTA**: Reserva/seña → Cobro total → Transferencia → Entrega → Documentos de venta

**CONSIGNACION**: Contrato de consignación → Publicación → Seña recibida → Cobro total → Transferencia → Entrega → Liquidación al dueño → Documentos

### Lógica de Pasos Condicionales

- **Seña/depósito**: Solo aparece si hay monto de seña configurado
- **Publicación**: Se marca automáticamente si el vehículo ya está publicado
- **Documentos**: Solo aparece si hay templates de documentos configurados

### GET /api/operations

Lista todas las operaciones con vehículo, cliente, proveedor, pasos y pagos.

### POST /api/operations

Crea una nueva operación. Genera automáticamente los pasos según el tipo.

**Request Body:**

```json
{
  "type": "VENTA",
  "vehicleId": "cuid...",
  "clientId": "cuid...",
  "amount": 15000000,
  "notes": "Financiación en 12 cuotas"
}
```

### GET /api/operations/[id]

Detalle de operación con datos enriquecidos: incluye `alerts` (sugerencias inteligentes) y `financial` (estado financiero calculado).

**Response:**

```json
{
  "id": "cuid...",
  "type": "VENTA",
  "status": "EN_CURSO",
  "vehicle": { "name": "Toyota Corolla 2020", "...": "..." },
  "client": { "firstName": "Juan", "...": "..." },
  "steps": [
    { "key": "reserva_sena", "label": "Reserva / Seña", "completed": false, "required": true }
  ],
  "payments": [
    { "id": "cuid...", "amountARS": 5000000, "concept": "Seña" }
  ],
  "alerts": [
    { "type": "warning", "message": "Seña pendiente — registrala y generá el recibo", "priority": 1 }
  ],
  "financial": {
    "totalAmount": 15000000,
    "paidAmount": 5000000,
    "remainingAmount": 10000000,
    "paidPercentage": 33,
    "status": "PARCIAL"
  }
}
```

### PATCH /api/operations/[id]

Actualiza campos de la operación (status, amount, notes, clientId, supplierId). Retorna datos enriquecidos.

### PATCH /api/operations/[id]/steps/[stepId]

Marca un paso como completado o incompleto. Detecta automáticamente si todos los pasos requeridos están completos.

### GET /api/operations/today

Retorna las operaciones del día organizadas por prioridad, más métricas globales.

**Response:**

```json
{
  "summary": {
    "enCurso": 5,
    "bloqueadas": 1,
    "urgentes": 2,
    "porCerrar": 1,
    "pagosPendientes": 3
  },
  "global": {
    "totalToCollect": 25000000,
    "opsAtRisk": 3,
    "vehiclesNotPublished": 4,
    "nearCompletion": 1
  },
  "sections": {
    "urgent": [...],
    "blocked": [...],
    "nearCompletion": [...],
    "pendingActions": [...]
  }
}
```

## Sugerencias Inteligentes (Alerts)

El sistema genera alertas contextuales para cada operación basándose en:

- **Estado financiero**: Compara pagos registrados contra monto total
- **Progreso de pasos**: Detecta pasos pendientes y suggests next actions
- **Detección de seña**: Si el monto de seña fue cobrado, sugiere marcar el paso
- **Documentos**: Si la operación avanzó > 50%, recuerda generar documentos
- **Cierre**: Si queda un solo paso, destaca que es el último. Si todos los requeridos están completos, sugiere cerrar.

Cada alerta tiene `type` (success, warning, error, info), `message`, y `priority` (1 = urgente, 5 = informativo).

## Plantillas de Documentos

### DocumentTemplate

| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | Identificador |
| name | String | Nombre de la plantilla |
| type | String | "BOLETO_COMPRAVENTA", "RECIBO_SENA", "CONTRATO_CONSIGNACION", etc. |
| content | String | Contenido con variables \{\{variable\}\} |
| operationType | String? | Tipo de operación asociada |

### Variables Disponibles

Las plantillas soportan variables que se resuelven automáticamente:

| Variable | Descripción |
|---|---|
| \{\{vehiculo_nombre\}\} | Nombre del vehículo |
| \{\{vehiculo_dominio\}\} | Patente/dominio |
| \{\{vehiculo_marca\}\}, \{\{vehiculo_modelo\}\} | Marca y modelo |
| \{\{vehiculo_anio\}\}, \{\{vehiculo_km\}\} | Año y kilómetros |
| \{\{cliente_nombre\}\}, \{\{cliente_dni\}\} | Nombre y DNI del cliente |
| \{\{proveedor_nombre\}\} | Nombre del proveedor |
| \{\{operacion_monto\}\} | Monto de la operación |
| \{\{operacion_fecha\}\} | Fecha de la operación |
| \{\{agencia_nombre\}\}, \{\{agencia_cuit\}\} | Datos de la agencia |
| \{\{fecha_actual\}\} | Fecha actual |

### POST /api/templates/resolve

Resuelve una plantilla con datos reales de una operación.

**Request Body:**

```json
{
  "templateId": "cuid...",
  "operationId": "cuid..."
}
```

### Generación con IA

Si no existe una plantilla para el tipo de documento, el sistema puede generar el documento usando IA (Gemini 2.5 Flash). La generación toma el contexto de la operación (vehículo, cliente, montos) y produce un documento profesional.

\newpage

# Integraciones Externas

## MercadoLibre

### Conexión

AutoSoft soporta dos métodos de conexión:

1. **OAuth**: Redirige al usuario a MercadoLibre para autorizar. Callback en `/api/integrations/mercadolibre/callback`.
2. **Manual**: El usuario provee un access token directamente.

### Funcionalidades

- **Publicar vehículos**: Crear listings con título, precio, moneda y tipo de publicación.
- **Gestionar listings**: Pausar, activar, cerrar, actualizar precio.
- **Sincronizar métricas**: Visitas, preguntas, favoritos.
- **Responder preguntas**: Ver y responder preguntas de compradores.

### Endpoints

| Método | Ruta | Acción |
|---|---|---|
| GET | /api/integrations/mercadolibre | Estado de conexión |
| GET | /api/integrations/mercadolibre?action=auth-url | URL de autorización OAuth |
| GET | /api/integrations/mercadolibre?action=listings | Listar publicaciones |
| GET | /api/integrations/mercadolibre?action=questions | Preguntas pendientes |
| POST | /api/integrations/mercadolibre | connect, disconnect, publish, update-status, update-price, sync, answer-question |
| GET | /api/integrations/mercadolibre/callback | Callback OAuth |

## Meta (Facebook / Instagram)

### Conexión

Requiere un Access Token de página de Facebook con permisos de publicación.

### Funcionalidades

- **Publicar en Facebook**: Texto + imagen del vehículo en la página.
- **Publicar en Instagram**: Media upload + publicación (requiere cuenta Business vinculada).
- **Eliminar publicaciones**: Remover posts publicados.
- **Métricas**: Alcance, clics, consultas por publicación.

### Endpoints

| Método | Ruta | Acción |
|---|---|---|
| GET | /api/integrations/meta | Estado de conexión |
| GET | /api/integrations/meta?action=publications | Publicaciones |
| POST | /api/integrations/meta | connect, disconnect, publish-facebook, publish-instagram, remove |

## WhatsApp Business

### Conexión

Requiere datos de WhatsApp Business API: Phone Number ID, Business Account ID, Access Token.

### Funcionalidades

- **Mensajes de texto**: Envío libre a clientes.
- **Fichas de vehículo**: Envío automático de información completa del vehículo.
- **Templates**: Mensajes predefinidos con variables dinámicas.
- **Recordatorios de pago**: Envío automático de recordatorios de deudas.
- **Conversaciones**: Historial de mensajes agrupados por teléfono.
- **Webhook**: Recepción de mensajes entrantes.

### Templates por Defecto

| Template | Categoría | Descripción |
|---|---|---|
| Bienvenida | MARKETING | Saludo inicial al cliente |
| Info Vehículo | UTILITY | Información de un vehículo específico |
| Recordatorio de Pago | UTILITY | Recordatorio de cuota pendiente |
| Vehículo Disponible | MARKETING | Notificación de nuevo stock |
| Seguimiento | MARKETING | Follow-up post visita |

### Endpoints

| Método | Ruta | Acción |
|---|---|---|
| GET | /api/integrations/whatsapp | Estado de conexión |
| GET | /api/integrations/whatsapp?action=conversations | Listar conversaciones |
| GET | /api/integrations/whatsapp?action=conversation&phone=X | Historial de chat |
| GET | /api/integrations/whatsapp?action=templates | Templates disponibles |
| POST | /api/integrations/whatsapp | connect, disconnect, send-text, send-vehicle, send-template, send-reminder, CRUD templates, webhook |

\newpage

# Interfaz de Usuario

## Páginas del Dashboard

| Ruta | Descripción |
|---|---|
| /dashboard | Panel principal con estadísticas, gráficos, estado global y sección "Hoy" |
| /dashboard/vehicles | Inventario de vehículos con filtros y CRUD |
| /dashboard/vehicles/[id] | Detalle de vehículo con galería de fotos |
| /dashboard/clients | Gestión de clientes y prospectos |
| /dashboard/employees | Gestión de empleados |
| /dashboard/suppliers | Gestión de proveedores |
| /dashboard/cash | Caja: cuentas, movimientos, estadísticas |
| /dashboard/debts | Seguimiento de deudas y pagos |
| /dashboard/leads | Interacciones y pipeline de leads |
| /dashboard/pipeline | Tablero Kanban de pipeline de ventas |
| /dashboard/calendar | Calendario/agenda de eventos |
| /dashboard/reports | Reportes analíticos del negocio |
| /dashboard/settings | Configuración de la agencia y plantillas de documentos |
| /dashboard/integrations | Panel de integraciones |
| /dashboard/integrations/meta | Gestión de Meta (Facebook/Instagram) |
| /dashboard/integrations/whatsapp | Gestión de WhatsApp Business |
| /dashboard/integrations/mercadolibre | Gestión de MercadoLibre |
| /dashboard/operations | Gestión de operaciones (compra/venta/consignación) |

## Componentes UI Reutilizables

| Componente | Ubicación | Descripción |
|---|---|---|
| Button | ui/button.tsx | Botón con variantes: primary, secondary, danger, ghost |
| Card / StatCard | ui/card.tsx | Tarjeta con padding responsivo + StatCard para métricas |
| DataTable | ui/data-table.tsx | Tabla con búsqueda, paginación y acciones |
| Modal | ui/modal.tsx | Dialog modal responsivo con header y cierre |
| Input | ui/input.tsx | Input con label y estilos dark theme |
| Select | ui/select.tsx | Select estilizado |
| Badge | ui/badge.tsx | Badge con variantes: default, success, warning, danger |
| Tabs | ui/tabs.tsx | Tabs con scroll horizontal en móvil |

## Diseño Responsivo

La aplicación está diseñada con enfoque mobile-first utilizando breakpoints de Tailwind CSS:

- **Mobile** (< 640px): Layout de 1 columna, sidebar como drawer, tablas con scroll horizontal.
- **Tablet** (640px - 1024px): Grids de 2 columnas, formularios adaptados.
- **Desktop** (> 1024px): Layout completo con sidebar fija, grids de 3-4 columnas.

### Sidebar

- **Desktop**: Sidebar fija de 64px (solo íconos) en el lado izquierdo.
- **Mobile**: Drawer colapsable de 264px con overlay oscuro, activado por botón hamburguesa.

### Safe Areas

Soporte completo para dispositivos con notch (iPhone X+, Android punch-hole) mediante `env(safe-area-inset-*)`.

## Dashboard Principal

El dashboard muestra dos secciones principales:

### Estado Global de la Agencia

Cuatro tarjetas de estado siempre visibles:

- **Por cobrar**: Suma de montos pendientes de todas las operaciones en curso
- **En riesgo**: Operaciones urgentes o bloqueadas que requieren atención
- **Por cerrar**: Operaciones con todos los pasos requeridos completados, listas para finalizar
- **Sin publicar**: Vehículos disponibles que aún no fueron publicados en plataformas

### Sección "Hoy"

Resumen de acciones del día organizado por prioridad:

1. **Urgentes**: Operaciones que necesitan acción inmediata
2. **Bloqueadas**: Operaciones detenidas por falta de datos o pasos dependientes
3. **Por cerrar**: Operaciones casi completas
4. **Acciones pendientes**: Operaciones en curso con pasos por completar

Cada item es clickeable y navega al detalle de la operación.

## Página de Operaciones

La página de operaciones tiene dos vistas:

### Vista Lista
Muestra todas las operaciones con filtros por tipo y estado. Cada tarjeta muestra:
- Tipo de operación (color por tipo)
- Vehículo asociado
- Cliente/Proveedor
- Barra de progreso de pasos
- Estado financiero (pagado vs total)

### Vista Detalle
Panel lateral o vista expandida con:
- Información completa del vehículo y contraparte
- Lista de pasos con botones de acción
- Alertas inteligentes con sugerencias contextuales
- Historial de pagos vinculados
- Botón de generación de documentos (con IA o plantillas)
- Formulario de notas

### Onboarding (Estado Vacío)
Si no hay operaciones, se muestra una guía explicativa con tarjetas para cada tipo de operación (Compra, Venta, Consignación) con descripción de cuándo usar cada una.
\newpage

# App Móvil (Capacitor)

## Arquitectura

AutoSoft utiliza **Capacitor 8.2** para empaquetar la app web como aplicación nativa. El mismo código fuente genera:

1. **Web App** — Accesible desde cualquier navegador.
2. **PWA** — Instalable desde Safari (iOS) o Chrome (Android).
3. **App Nativa Android** — APK/AAB compilable con Android Studio.
4. **App Nativa iOS** — IPA compilable con Xcode (requiere macOS).

## Configuración Nativa

**App ID:** `com.autosoft.app`

**Plugins nativos incluidos:**

| Plugin | Funcionalidad |
|---|---|
| @capacitor/app | Manejo de lifecycle y botón atrás (Android) |
| @capacitor/browser | Apertura de URLs externas |
| @capacitor/camera | Acceso a cámara (fotos de vehículos) |
| @capacitor/haptics | Retroalimentación háptica |
| @capacitor/keyboard | Manejo de teclado virtual |
| @capacitor/push-notifications | Notificaciones push |
| @capacitor/splash-screen | Pantalla de carga |
| @capacitor/status-bar | Personalización de barra de estado |

## Scripts de Desarrollo

```bash
# Sincronizar plugins y assets a plataformas nativas
npm run cap:sync

# Desarrollo Android (abre Android Studio)
npm run mobile:dev:android

# Desarrollo iOS (abre Xcode - requiere macOS)
npm run mobile:dev:ios

# Build producción Android
CAPACITOR_SERVER_URL=https://mi-dominio.com npm run mobile:build:android

# Build producción iOS
CAPACITOR_SERVER_URL=https://mi-dominio.com npm run mobile:build:ios
```

## Modo de Operación

- **Desarrollo**: La app nativa se conecta a `http://localhost:3000` (el dev server de Next.js). Android usa `10.0.2.2` como alias de localhost del emulador.
- **Producción**: Se configura `CAPACITOR_SERVER_URL` apuntando al servidor desplegado.

## PWA (Progressive Web App)

La app incluye configuración PWA completa:

- **manifest.json** con nombre, íconos (72x72 a 512x512), modo standalone.
- **Tema oscuro** (background: #030712).
- **Instalable** desde Safari (iOS) o Chrome (Android) sin compilar.

\newpage

# Configuración y Despliegue

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| DATABASE_URL | URL de conexión PostgreSQL | postgresql://user:pass@host/db |
| NEXTAUTH_SECRET | Secret para JWT de NextAuth | string-aleatorio-seguro |
| NEXTAUTH_URL | URL base de la app | http://localhost:3000 |
| CAPACITOR_SERVER_URL | URL del servidor para app nativa | https://mi-dominio.com |

## Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd agencia/app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Ejecutar migraciones
npx prisma migrate deploy

# Sembrar datos iniciales
npm run seed

# Iniciar servidor de desarrollo
npm run dev
```

## Datos Iniciales (Seed)

El seed crea los siguientes datos de prueba:

| Entidad | Cantidad | Detalle |
|---|---|---|
| Usuarios | 2 | admin@autosoft.com (ADMIN), ventas@autosoft.com (USER) |
| Clientes | 4 | Mix de clientes y prospectos |
| Proveedores | 2 | Vehículos y servicios |
| Vehículos | 5 | Disponibles, reservados, vendidos |
| Cuentas de Caja | 3 | Efectivo ARS, Banco ARS, Caja USD |
| Movimientos | 5 | Ingresos y egresos de ejemplo |
| Deudas | 2 | Pendiente y pagada |
| Interacciones | 4 | Diversos estados y orígenes |
| Agencia | 1 | Configuración por defecto (plan V12 Premium) |

**Credenciales por defecto:**

- **Admin**: admin@autosoft.com / admin123
- **Ventas**: ventas@autosoft.com / ventas123

## Build de Producción

```bash
# Compilar la app web
npm run build

# Iniciar servidor de producción
npm start

# Sincronizar con plataformas nativas
npm run cap:sync
```

\newpage

# Seguridad

## Autenticación

- Passwords hasheados con **bcrypt** (salt rounds automáticos).
- Sesiones gestionadas con **JWT** (NextAuth.js).
- Roles: **ADMIN** y **USER**.
- Página de login protegida: `/login`.

## Base de Datos

- Conexión SSL habilitada (`sslmode=require`).
- Prisma previene SQL injection mediante queries parametrizadas.
- Validaciones de datos en las API routes.

## Frontend

- **CSRF**: Protección integrada por NextAuth.
- **XSS**: React escapa automáticamente el contenido renderizado.
- **Tokens de integración**: Almacenados en la base de datos, no expuestos al frontend.

## App Nativa

- `cleartext: true` solo habilitado en modo desarrollo.
- Safe area insets para dispositivos con notch.
- Deshabilita selección de texto (previene copy/paste accidental) excepto en inputs.

\newpage

# Licencia y Contacto

**AutoSoft** v0.1.0 — Sistema de Gestión para Agencias de Autos.

Aplicación privada. Todos los derechos reservados.
