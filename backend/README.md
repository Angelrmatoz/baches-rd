# Baches RD — Backend (Spring Boot API)

Backend de alto rendimiento de Baches RD, implementado con **Spring Boot 3.4 / 4**, **Java 17 / 25**, **PostGIS 3.5**, **Flyway** y autenticación basada en **JWT**.

---

## 🛠️ Tecnologías y Arquitectura

* **Lenguaje & Framework:** Java 17/25 + Spring Boot.
* **Seguridad:** Spring Security + filtro `JwtAuthFilter` con hash BCrypt para contraseñas.
* **Persistencia Geoespacial:** Spring Data JPA + PostgreSQL 17 + PostGIS 3.5 + `org.locationtech.jts`.
* **Migraciones de Base de Datos:** Flyway (`src/main/resources/db/migration`).
* **Documentación OpenAPI:** Swagger UI en `/swagger-ui.html`.

---

## 🗄️ Modelo de Datos Geoespacial

El motor usa **PostgreSQL 17 con extensión PostGIS 3.5** activa.
Las coordenadas de los baches se almacenan bajo el tipo de datos `GEOMETRY(POINT, 4326)`.

---

## 🔑 Variables de Entorno (Configuradas en IntelliJ IDEA)

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `JWT_SECRET` | Clave secreta de firma HMAC de 256 bits | `074142544c0e3e63e4...` |
| `JWT_EXPIRATION` | Tiempo de expiración del token en ms | `86400000` (24 horas) |
| `CLOUDINARY_CLOUD_NAME` | Nombre de cuenta en Cloudinary | `baches-rd` |
| `CLOUDINARY_API_KEY` | Clave API de Cloudinary | `1234567890` |
| `CLOUDINARY_API_SECRET` | Secreto API de Cloudinary | `secret_cloudinary_key_baches` |

---

## 🧪 Pruebas Automatizadas

El backend incluye una suite de **20 pruebas automatizadas** (unitarias, de integración y ciberseguridad):

```powershell
cd backend
.\mvnw.cmd test
```

---

## 🌐 Endpoints REST (`/api/v1`)

* `POST /api/v1/auth/register` - Registro público.
* `POST /api/v1/auth/login` - Inicio de sesión JWT.
* `POST /api/v1/reports` - Crear bache (anti-duplicados a 30m → HTTP 409).
* `GET /api/v1/reports/nearby` - Baches cercanos para el mapa.
* `GET /api/v1/reports/{id}` - Detalle de bache.
* `PATCH /api/v1/reports/{id}/status` - Cambiar estado (Admin).
* `DELETE /api/v1/reports/{id}` - Eliminar bache.
* `POST /api/v1/reports/{id}/validate` - Dar confirmación/like.
* `DELETE /api/v1/reports/{id}/validate` - Quitar confirmación.
* `GET /api/v1/reports/{id}/validators` - Listar validadores.
* `GET /api/v1/photos/signature` - Firma HMAC SHA-1 para Direct Upload a Cloudinary.
* `POST /api/v1/reports/{id}/photos` - Registrar foto.
* `DELETE /api/v1/reports/{id}/photos/{photoId}` - Eliminar foto.
* `GET /api/v1/users/me` - Perfil del usuario actual.
* `GET /api/v1/users/me/reports` - Reportes del usuario actual.
