# PlayaManager Backend API

API REST para la gestión de kioskos de playa - MVP

## 🚀 Stack Tecnológico

- **Node.js** + **Express** - Framework web
- **TypeScript** - Lenguaje tipado
- **PostgreSQL** - Base de datos relacional
- **Prisma** - ORM (Object-Relational Mapping)
- **JWT** - Autenticación
- **bcrypt** - Hash de contraseñas

## 📦 Requisitos Previos

- Node.js 18+ instalado
- PostgreSQL 14+ instalado y corriendo
- npm o yarn

## ⚙️ Instalación

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar base de datos

Crear una base de datos PostgreSQL:

```sql
CREATE DATABASE playamanager_db;
CREATE USER playamanager WITH PASSWORD 'playapass123';
GRANT ALL PRIVILEGES ON DATABASE playamanager_db TO playamanager;
```

### 3. Configurar variables de entorno

Copiar el archivo de ejemplo y editarlo:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
DATABASE_URL="postgresql://playamanager:playapass123@localhost:5432/playamanager_db"
JWT_SECRET="tu_secreto_super_seguro"
PORT=3000
```

### 4. Ejecutar migraciones

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Cargar datos de prueba

```bash
npm run seed
```

Esto creará:
- 1 empresa: **BK-001** (Kiosko Playa Reñaca)
- 2 usuarios: **admin** y **operator**
- 4 productos de arriendo
- 2 arriendos de ejemplo

**Credenciales de prueba:**
- Company ID: `BK-001`
- Username: `admin` o `operator`
- Password: `demo123`

### 6. Iniciar servidor

**Modo desarrollo (con hot-reload):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm run build
npm start
```

El servidor estará corriendo en: `http://localhost:3000`

## 📡 Endpoints de la API

### Autenticación

#### POST `/api/auth/login`
Autentica un usuario y retorna JWT token.

**Request:**
```json
{
  "companyId": "BK-001",
  "username": "admin",
  "password": "demo123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "fullName": "Juan Pérez (Admin)",
    "role": "ADMIN_KIOSK",
    "company": {
      "id": "uuid",
      "companyId": "BK-001",
      "name": "Kiosko Playa Reñaca"
    }
  }
}
```

#### GET `/api/auth/me`
Obtiene datos del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

---

### Productos

Todas las rutas requieren autenticación (Bearer token).

#### GET `/api/products`
Lista todos los productos de la empresa.

**Query params opcionales:**
- `category`: RENTAL o VENDOR
- `isActive`: true o false

#### GET `/api/products/:id`
Obtiene un producto específico.

#### POST `/api/products`
Crea un nuevo producto.

**Request:**
```json
{
  "name": "Silla de Playa",
  "description": "Silla cómoda",
  "price": 5000,
  "category": "RENTAL",
  "isActive": true
}
```

#### PUT `/api/products/:id`
Actualiza un producto.

#### DELETE `/api/products/:id`
Elimina (soft delete) un producto.

---

### Arriendos (Rentals)

#### GET `/api/rentals`
Lista todos los arriendos.

**Query params opcionales:**
- `status`: ACTIVE, CLOSED, VOIDED

#### GET `/api/rentals/stats`
Obtiene estadísticas para KPIs.

**Response:**
```json
{
  "success": true,
  "stats": {
    "activeRentals": 15,
    "todayRentals": 23,
    "todayRevenue": 450000
  }
}
```

#### GET `/api/rentals/:id`
Obtiene un arriendo específico con detalles.

#### POST `/api/rentals`
Crea un nuevo arriendo.

**Request:**
```json
{
  "customerName": "Pedro Martínez",
  "customerIdPhoto": "https://...",
  "items": [
    {
      "productId": "uuid-producto",
      "quantity": 2,
      "unitPrice": 5000
    },
    {
      "productId": "uuid-quitasol",
      "quantity": 1,
      "unitPrice": 10000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rental created successfully",
  "rental": {
    "id": "uuid",
    "customerName": "Pedro Martínez",
    "totalAmount": 20000,
    "status": "ACTIVE",
    "items": [...]
  }
}
```

#### PUT `/api/rentals/:id`
Actualiza un arriendo (solo si está ACTIVE).

#### POST `/api/rentals/:id/close`
Cierra un arriendo.

#### DELETE `/api/rentals/:id`
Anula un arriendo (cambia status a VOIDED).

---

## 🗄️ Estructura de la Base de Datos

### Tablas principales:

- **companies** - Empresas/Kioskos (multitenant)
- **users** - Usuarios del sistema
- **products** - Catálogo de productos
- **rentals** - Arriendos
- **rental_items** - Items de cada arriendo

### Diagrama ER simplificado:

```
companies
  └── users
  └── products
  └── rentals
        └── rental_items
              └── product (reference)
```

## 🛠️ Comandos útiles

```bash
# Ver la base de datos en una UI
npm run prisma:studio

# Regenerar el cliente de Prisma
npm run prisma:generate

# Crear una nueva migración
npm run prisma:migrate

# Ver logs en desarrollo
npm run dev
```

## 🔐 Seguridad

- Passwords hasheados con bcrypt (10 rounds)
- JWT tokens con expiración configurable
- Validación de entrada con Zod
- Manejo de errores centralizado
- CORS habilitado

## 📝 Notas para Producción

Antes de ir a producción:

1. ✅ Cambiar `JWT_SECRET` a un valor seguro aleatorio
2. ✅ Usar variables de entorno reales (no .env)
3. ✅ Configurar CORS para dominios específicos
4. ✅ Habilitar HTTPS
5. ✅ Configurar rate limiting
6. ✅ Setup de backup de base de datos
7. ✅ Monitoreo y logs (Winston, Sentry)

## 🐛 Troubleshooting

### Error de conexión a PostgreSQL

Verificar que PostgreSQL esté corriendo:
```bash
# Linux/Mac
pg_isready

# Windows
psql -U postgres
```

### Error de migraciones

Resetear la base de datos:
```bash
npx prisma migrate reset
npm run seed
```

## 📞 Soporte

Para cualquier duda sobre el backend, revisar:
- Documentación de Prisma: https://www.prisma.io/docs
- Express docs: https://expressjs.com
- TypeScript docs: https://www.typescriptlang.org/docs
