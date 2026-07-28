# AGENTS.md — Guía para Desarrolladores e IA

Documento de referencia para desarrolladores y asistentes IA sobre la arquitectura, estado actual y comandos del proyecto **Baches RD**.

---

## 📌 Visión General del Proyecto

**Baches RD** es una plataforma de Tecnología Cívica para reportar, validar y visualizar daños viales en Santo Domingo de Guzmán, República Dominicana.

- **Frontend:** Monorepo Turborepo con React + Vite (Web SPA) y React Native / Expo (Mobile App).
- **Backend:** Spring Boot (Java 17) + PostgreSQL 17 / PostGIS 3.5 + Flyway.
- **Base de Datos local (Docker):** PostgreSQL en puerto `5433`, pgAdmin en puerto `5050`.

---

## 🛠️ Estado Actual del Backend (Sprint Activo)

### 1. Base de Datos e Migraciones Flyway
- `docker-compose.db.yml` utiliza la imagen `postgis/postgis:17-3.5`.
- **Migración V1 (`V1__create_usuarios_table.sql`):** Estructura base de usuarios (entidad JPA `Usuario` en `com.bachesrd.backend.entity`) con encriptación BCrypt y roles.
- **Migración V2 (`V2__enable_postgis_and_create_reportes.sql`):** Habilita la extensión `postgis` y crea las tablas `reportes_baches` (con índice GiST geoespacial), `fotos_reporte` y `validaciones`.
- **Migración V3 (`V3__seed_admin_user.sql`):** Seeding automático del usuario Administrador inicial.

#### Credenciales por defecto (Admin Seed):
- **Email:** `admin@bachesrd.com`
- **Password:** `admin123` *(BCrypt Hash verificado)*
- **Rol:** `ADMIN`

### 2. Autenticación JWT y Seguridad
- **Firma JWT:** Configurada mediante la variable de entorno `JWT_SECRET`.
- **Duración del token:** 24 horas por defecto (`jwt.expiration`).
- **Filtro de seguridad:** `JwtAuthFilter` valida los tokens `Authorization: Bearer <token>` en cada solicitud protegida.
- **CORS:** Habilitado universalmente para peticiones desde el frontend web (`http://localhost:5173`).

---

## 🌐 Endpoints Implementados y Verificados

| Método | Endpoint | Permisos | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Público | Registrar nuevo ciudadano |
| `POST` | `/api/v1/auth/login` | Público | Autenticar usuario y obtener JWT Token |
| `GET` | `/swagger-ui.html` | Público | Documentación interactiva de la API |

---

## ⚙️ Configuración del Entorno de Desarrollo

### Requisitos Locales:
- **Java:** JDK 17 (Target de compilación en `pom.xml`).
- **Docker Desktop:** Para levantar el contenedor de PostgreSQL/PostGIS.
- **Variable de Entorno para el Backend:**
  ```text
  JWT_SECRET=074142544c0e3e63e4c3c1ae7b76bd8852a40e3d3a45665b9393b59f85f6881e
  ```

### Comandos de Utilidad:

#### 1. Levantar la Base de Datos (Docker):
```powershell
docker compose -f backend/docker-compose.db.yml up -d
```

#### 2. Compilar e Iniciar Backend (Spring Boot):
```powershell
cd backend
.\mvnw.cmd clean compile
.\mvnw.cmd spring-boot:run
```

#### 3. Iniciar Frontend (Web):
```powershell
cd frontend
pnpm dev
```
