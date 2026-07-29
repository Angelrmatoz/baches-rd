# AGENTS.md — Guía para Desarrolladores e IA

Documento de referencia para desarrolladores y asistentes IA sobre la arquitectura, estado actual y comandos del proyecto **Baches RD**.

---

## 📌 Visión General del Proyecto

**Baches RD** es una plataforma de Tecnología Cívica para reportar, validar y visualizar daños viales en Santo Domingo de Guzmán, República Dominicana.

- **Frontend:** Monorepo Turborepo con React + Vite (Web SPA) y React Native / Expo (Mobile App).
- **Backend:** Spring Boot (Java 17 / 25) + PostgreSQL 17 / PostGIS 3.5 + Flyway.
- **Base de Datos local (Docker):** PostgreSQL en puerto `5433`, pgAdmin en puerto `5050`.

---

## 🛠️ Estado Actual del Backend

### 1. Base de Datos & Migraciones Flyway
- `docker-compose.db.yml` utiliza la imagen `postgis/postgis:17-3.5`.
- **Migración V1 (`V1__create_usuarios_table.sql`):** Estructura base de usuarios (`com.bachesrd.backend.entity.Usuario`) con encriptación BCrypt y roles.
- **Migración V2 (`V2__enable_postgis_and_create_reportes.sql`):** Habilita la extensión `postgis` y crea las tablas `reportes_baches` (con índice GiST geoespacial), `fotos_reporte` y `validaciones`.
- **Migración V3 (`V3__seed_admin_user.sql`):** Seeding automático del usuario Administrador inicial.

#### Credenciales por defecto (Admin Seed):
- **Email:** `admin@bachesrd.com`
- **Password:** `admin123` *(BCrypt Hash verificado)*
- **Rol:** `ADMIN`

### 2. Autenticación JWT, Seguridad y Excepciones
- **Firma JWT & Cloudinary:** Configuradas 100% mediante Variables de Entorno en IntelliJ IDEA o archivo `.env`.
- **Duración del token:** 24 horas por defecto (`JWT_EXPIRATION=86400000`).
- **Filtro de seguridad:** `JwtAuthFilter` valida los tokens `Authorization: Bearer <token>` en cada solicitud protegida.
- **Manejador de Errores Centralizado:** `GlobalExceptionHandler` devuelve JSONs formateados para HTTP 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict anti-duplicados a 30m) y 500 (Internal Error).

---

## 🌐 Endpoints Implementados y Verificados (`/api/v1`)

| Método | Endpoint | Permisos | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Público | Registrar nuevo ciudadano |
| `POST` | `/api/v1/auth/login` | Público | Autenticar usuario y obtener JWT Token |
| `POST` | `/api/v1/reports` | Autenticado | Crear bache (evalúa colisión <30m → HTTP 409) |
| `GET` | `/api/v1/reports/nearby` | Público | Obtener baches cercanos en el mapa |
| `GET` | `/api/v1/reports/{id}` | Público | Obtener detalle de bache con fotos y validaciones |
| `PATCH`| `/api/v1/reports/{id}/status` | Admin | Cambiar estado (`ACTIVO`, `EN_REPARACION`, `RESUELTO`) |
| `DELETE`| `/api/v1/reports/{id}` | Creador/Admin | Eliminar reporte de bache |
| `POST` | `/api/v1/reports/{id}/validate` | Autenticado | Confirmar bache (dar "like" social) |
| `DELETE`| `/api/v1/reports/{id}/validate` | Autenticado | Remover confirmación/like |
| `GET` | `/api/v1/reports/{id}/validators` | Público | Listar usuarios que validaron el reporte |
| `GET` | `/api/v1/photos/signature` | Autenticado | Generar firma HMAC SHA-1 para Direct Upload a Cloudinary |
| `POST` | `/api/v1/reports/{id}/photos` | Autenticado | Registrar foto subida a Cloudinary |
| `DELETE`| `/api/v1/reports/{id}/photos/{photoId}`| Creador/Admin | Eliminar foto de reporte |
| `GET` | `/api/v1/users/me` | Autenticado | Perfil del usuario actual |
| `GET` | `/api/v1/users/me/reports` | Autenticado | Mis reportes creados |
| `GET` | `/swagger-ui.html` | Público | Documentación interactiva Swagger UI |

---

## 🧪 Suite de Pruebas Automatizadas

La aplicación cuenta con una suite completa de **20 pruebas automatizadas** (unitarias, de integración y de ciberseguridad) ejecutadas con `BUILD SUCCESS`:
- `UsuarioServiceTest`: Registro, BCrypt, cuentas inactivas y duplicados (5 pruebas).
- `ReporteServiceTest`: Mapeo PostGIS JTS Point, anti-duplicados a 30m y permisos (4 pruebas).
- `ValidacionServiceTest`: Contador de likes e idempotencia (3 pruebas).
- `CloudinaryServiceTest`: Generación de firmas HMAC SHA-1 (1 prueba).
- `SecurityIntegrationTest`: Ciberseguridad MockMvc, rechazo de firmas alteradas y control de acceso por roles (4 pruebas).
- `AuthControllerTest` & `BackendApplicationTests`: Pruebas de contexto e inicio de sesión (3 pruebas).

---

## ⚙️ Configuración del Entorno de Desarrollo

### Requisitos Locales:
- **Java:** JDK 17 / JDK 25.
- **Docker Desktop:** Para levantar el contenedor de PostgreSQL/PostGIS.
- **Variables de Entorno en IntelliJ IDEA (Ver plantilla [.env.template](file:///c:/Dev/baches-rd/.env.template)):**
  ```text
  JWT_SECRET=074142544c0e3e63e4c3c1ae7b76bd8852a40e3d3a45665b9393b59f85f6881e
  JWT_EXPIRATION=86400000
  CLOUDINARY_CLOUD_NAME=baches-rd
  CLOUDINARY_API_KEY=1234567890
  CLOUDINARY_API_SECRET=secret_cloudinary_key_baches
  ```

### Comandos de Utilidad:

#### 1. Levantar la Base de Datos (Docker):
```powershell
docker compose -f backend/docker-compose.db.yml up -d
```

#### 2. Ejecutar la Suite de Pruebas:
```powershell
cd backend
.\mvnw.cmd test
```

#### 3. Iniciar Frontend (Web):
```powershell
cd frontend
pnpm dev
```
