# Baches RD — Backend (Spring Boot API)

Backend de alto rendimiento de Baches RD, implementado con **Spring Boot 3.4 / 4**, **Java 17**, **PostGIS 3.5**, **Flyway** y autenticación basada en **JWT**.

---

## 🛠️ Tecnologías y Arquitectura

* **Lenguaje & Framework:** Java 17 + Spring Boot.
* **Seguridad:** Spring Security + filtro `JwtAuthFilter` con hash BCrypt para contraseñas.
* **Persistencia Geoespacial:** Spring Data JPA + PostgreSQL 17 + PostGIS 3.5.
* **Migraciones de Base de Datos:** Flyway (`src/main/resources/db/migration`).
* **Documentación OpenAPI:** Swagger UI en `/swagger-ui.html`.

---

## 🗄️ Modelo de Datos Geoespacial

El motor usa **PostgreSQL 17 con extensión PostGIS 3.5** activa.
Las coordenadas de los baches se almacenan bajo el tipo de datos `GEOMETRY(POINT, 4326)`.

### Migraciones Flyway Incluidas:
- `V1__create_usuarios_table.sql`: Tabla de usuarios con roles (`CIUDADANO`, `ADMIN`).
- `V2__enable_postgis_and_create_reportes.sql`: Extensión `postgis` y tablas `reportes_baches` (índice GiST), `fotos_reporte` y `validaciones`.
- `V3__seed_admin_user.sql`: Usuario Administrador por defecto (`admin@bachesrd.com` / `admin123`).

---

## 🔑 Variables de Entorno Requeridas

| Variable | Descripción | Valor por Defecto |
| --- | --- | --- |
| `JWT_SECRET` | Clave secreta de firma HMAC de 256 bits para JWT | `baches_rd_super_secret_jwt_key_...` |
| `JWT_EXPIRATION` | Tiempo de expiración del token en ms | `86400000` (24 horas) |

---

## 🌐 Endpoints REST (`/api/v1`)

### Autenticación (`/api/v1/auth`)
* `POST /auth/register` - Registro de nuevos usuarios ciudadanos.
* `POST /auth/login` - Autenticación con email/password. Retorna JWT Token y objeto `user`.

---

## 🚀 Inicio Rápido para Desarrollo

### 1. Levantar Contenedores Docker (PostgreSQL + PostGIS + pgAdmin)
```powershell
cd backend
docker compose -f docker-compose.db.yml up -d
```
* **PostgreSQL:** `localhost:5433` (DB: `baches_rd_db`, User: `baches_user`, Pass: `baches_password`)
* **pgAdmin:** `localhost:5050` (Email: `admin@bachesrd.com`, Pass: `adminpassword`)

### 2. Ejecutar la Aplicación en IntelliJ IDEA / Maven
Configura la variable de entorno `JWT_SECRET` en la configuración de ejecución de IntelliJ o ejecuta desde terminal:

```powershell
$env:JWT_SECRET="074142544c0e3e63e4c3c1ae7b76bd8852a40e3d3a45665b9393b59f85f6881e"
.\mvnw.cmd spring-boot:run
```
