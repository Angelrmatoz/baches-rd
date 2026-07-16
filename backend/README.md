# Baches RD — Backend (Spring Boot)

Este directorio contiene el backend de alto rendimiento de Baches RD, implementado con **Spring Boot**, **Java 25**, **Hibernate Spatial (PostGIS)** y soporte de compilación nativa con **GraalVM**.

---

## 🛠️ Tecnologías y Características

* **Lenguaje & Framework:** Java 25 + Spring Boot.
* **Seguridad:** Spring Security con filtros JWT y encriptación bcrypt para contraseñas de usuarios.
* **Persistencia:** Spring Data JPA + Hibernate Spatial para interactuar con datos geoespaciales.
* **Migraciones de Base de Datos:** Flyway o Liquibase.
* **Compilación Nativa:** Configuración multi-stage en Dockerfile para GraalVM, reduciendo drásticamente el uso de memoria RAM y el tiempo de arranque.

---

## 🗄️ Modelo de Datos Geoespacial y Lógica Anti-Duplicados

El motor principal usa **PostgreSQL 15+ con la extensión PostGIS** activa.
Las coordenadas geográficas de los baches se almacenan bajo el tipo de datos `GEOMETRY(POINT, 4326)`.

### Lógica Geoespacial Anti-Duplicados
Para evitar reportes basura e incentivar la validación social, el backend ejecuta una consulta de cercanía espacial en base a un radio configurable de 30 metros:
```sql
SELECT id, descripcion, total_validaciones
FROM reportes_baches
WHERE ST_DWithin(
  coordenadas::geography,
  ST_SetSRID(ST_MakePoint(:longitud, :latitud), 4326)::geography,
  30  -- metros
)
AND estado != 'resuelto'
LIMIT 5;
```
Si se detecta una colisión en este radio, `POST /reports` rechaza la solicitud arrojando una excepción capturada como **HTTP 409 Conflict** y devuelve el `existing_report_id` para que el cliente redirija al usuario a validarlo con un "like".

---

## 🌐 Resumen de la API REST

**Base URL:** `http://localhost:8080/api/v1`

### 🔑 Autenticación (`/auth`)
* `POST /auth/register` - Registro público.
* `POST /auth/login` - Inicio de sesión (devuelve JWT + Refresh Token).
* `POST /auth/refresh` - Renovación de tokens.
* `POST /auth/logout` - Revocación de sesión.

### 📍 Reportes de Baches (`/reports`)
* `GET /reports` - Listar reportes (paginación + filtros bbox).
* `GET /reports/nearby?latitud=X&longitud=Y` - Reportes cercanos por PostGIS.
* `GET /reports/:id` - Detalles de reporte (con fotos y validaciones).
* `POST /reports` - Crear reporte (bloqueado por filtro anti-duplicados 30m).
* `PATCH /reports/:id/status` - Cambiar estado (Admin).
* `DELETE /reports/:id` - Soft-delete de reporte (Autor u Admin).

### 📸 Flujo Direct Upload a Cloudinary (`/photos`)
* `GET /photos/signature` - Genera firma criptográfica Signed Upload de Cloudinary. El backend nunca procesa el archivo físico pesando en el ancho de banda del servidor.
* `POST /reports/:id/photos` - Registra `cloudinary_url` y `public_id` de la imagen subida directamente por el cliente.
* `DELETE /reports/:id/photos/:photoId` - Elimina foto de la BD y la API de Cloudinary.

### 👍 Validaciones/Likes (`/reports/:id/validate`)
* `POST /reports/:id/validate` - Validar (añadir like). Restricción UNIQUE en BD impide duplicados.
* `DELETE /reports/:id/validate` - Quitar validación.
* `GET /reports/:id/validators` - Listar usuarios que validaron.

---

## 🚀 Desarrollo Local

### 1. Levantar PostgreSQL + PostGIS (Docker)
Asegúrate de tener Docker activo y ejecuta:
```bash
cd docker
docker compose up -d
```
El archivo `init.sql` inicializará automáticamente la extensión de PostGIS en la base de datos `baches_db`.

### 2. Compilar e Iniciar la Aplicación
Usa Maven para levantar el servidor de desarrollo:
```bash
mvn spring-boot:run
```

### 3. Compilar Imagen Nativa (GraalVM)
Para compilar a imagen nativa optimizada (requiere GraalVM instalado localmente o a través de Docker):
```bash
mvn -Pnative native:compile
```
O compila la imagen directamente usando el Dockerfile multi-stage.
