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
- **Avatar Cloudinary:** `CloudinaryService.extractPublicIdFromUrl()` extrae `public_id` de URL; `UsuarioService.actualizarPerfil` elimina avatar anterior de Cloudinary al cambiar o borrar.
- **Límite 3 fotos:** `ReporteService.agregarFoto` valía máximo 3 fotos via `fotoRepository.countByReporteId`. Frontend también bloquea UI al alcanzar límite.

---

## 🌐 Endpoints Implementados y Verificados (`/api/v1`)

| Método | Endpoint | Permisos | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Público | Registrar nuevo ciudadano |
| `POST` | `/api/v1/auth/login` | Público | Autenticar usuario y obtener JWT Token |
| `POST` | `/api/v1/reports` | Autenticado | Crear bache (evalúa colisión <30m → HTTP 409) |
| `GET` | `/api/v1/reports/nearby` | Público | Obtener baches cercanos en el mapa |
| `GET` | `/api/v1/reports/{id}` | Público | Obtener detalle de bache con fotos y validaciones |
| `PATCH`| `/api/v1/reports/{id}` | Creador/Admin | Editar descripción, severidad, dirección |
| `PATCH`| `/api/v1/reports/{id}/status` | Admin | Cambiar estado (`ACTIVO`, `EN_REPARACION`, `RESUELTO`) |
| `DELETE`| `/api/v1/reports/{id}` | Creador/Admin | Eliminar reporte de bache (con limpieza Cloudinary) |
| `POST` | `/api/v1/reports/{id}/validate` | Autenticado | Confirmar bache (dar "like" social) |
| `DELETE`| `/api/v1/reports/{id}/validate` | Autenticado | Remover confirmación/like |
| `GET` | `/api/v1/reports/{id}/validators` | Público | Listar usuarios que validaron el reporte |
| `GET` | `/api/v1/photos/signature` | Autenticado | Generar firma HMAC SHA-1 para Direct Upload a Cloudinary |
| `POST` | `/api/v1/reports/{id}/photos` | Autenticado | Registrar foto subida a Cloudinary |
| `DELETE`| `/api/v1/reports/{id}/photos/{photoId}`| Creador/Admin | Eliminar foto de reporte |
| `GET` | `/api/v1/users/me` | Autenticado | Perfil del usuario actual |
| `GET` | `/api/v1/users/me/reports` | Autenticado | Mis reportes creados |
| `GET` | `/swagger-ui.html` | Público | Documentación interactiva Swagger UI |

## 🎨 Estado Actual del Frontend (Web SPA)

### 1. Funcionalidades de Usuario & Geolocalización
- **Modal de Creación de Reportes de Bache (`NewReportModal.tsx`):**
  - **Pestaña 1 (Por nombre de calle):** Búsqueda interactiva con autocompletado en tiempo real utilizando la API OpenStreetMap Nominatim. Sanitizador de términos locales de RD (`esquina`, `esq`, `frente a`, `casi`) y validación estricta de existencia en Santo Domingo. Bloquea nombres de calle inventados (ej: `asdfasfa`).
  - **Pestaña 2 (GPS / Coordenadas):** Geolocalización nativa mediante `navigator.geolocation` o inserción manual de latitud/longitud.
- **Adjunto de Múltiples Fotos (Cloudinary Direct Upload):**
  - Permite seleccionar hasta **3 fotos máximo** (5 KB - 5 MB cada una).
  - Filtro estricto exclusivo para imágenes (`image/jpeg,image/png,image/webp,image/heic,image/heif`), bloqueando formatos de video o ejecutables.
  - Subida directa en paralelo a Cloudinary tras recibir la firma HMAC SHA-1 del backend (`/api/v1/photos/signature`).

### 2. UI/UX & Sistema de Diseño (Dark Glassmorphism & Paridad Web/Mobile)
- **Modal de Detalle (`ReportDetailModal.tsx`):** Carrusel de fotos interactivo con controles (`ChevronLeft`, `ChevronRight`), contador de imágenes `1 / X`, badges de severidad/estado y mapa interactivo. **Sincronización `useEffect`:** Sincroniza fotos del reporte en tiempo real al subir nuevas imágenes a Cloudinary. **Layout responsivo anti-overlap:** Disposición vertical limpia para datos de reporte y coordenadas, más 2 filas de acciones con botón prominente *"Validar este bache"*.
- **Diálogo de Confirmación de Borrado (`ConfirmDeleteDialog.tsx`):** Modal oscuro personalizado con efecto de cristal traslúcido (`backdrop-blur-sm`, `glass`), reemplazando las ventanas nativas del navegador.
- **Centro de Notificaciones & Menús Desplegables:**
  - Indicador de notificaciones no leídas posicionado en la esquina superior derecha (`top-1.5 right-1.5`) con pulso animado.
  - Renderizado condicional estricto con animación `.animate-dropdown` en Web y `Animated.View` nativo en Mobile, eliminando fantasmas de desenfoque (`backdrop-blur`).
  - Eliminación individual de notificaciones y descarte masivo con animación de colapso limpia (`.animate-item-dismiss`).
  - Cierre automático al tocar en cualquier punto exterior del mapa mediante propagación de eventos (`stopPropagation`).
- **Control de Peticiones & Rate-Limiting (Debounce 450ms):**
  - Autocompletado de calles debouced a 450ms con cabecera `User-Agent: BachesRD-App/1.0`. Previene errores HTTP `429 (Too Many Requests)` y bloqueos de CORS en OpenStreetMap Nominatim.
  - Fallback automático y transparente a coordenadas por defecto de Santo Domingo (`18.4861, -69.9312`) si la API de geolocalización de OpenStreetMap está saturada o no responde.
- **Optimización React Native Web & Limpieza de Deprecaciones:**
  - Estilos inline explícitos para `borderRadius: 20`, `padding: 16` y `maxWidth` en `Animated.View`, resolviendo esquinas cuadradas a 90° y recortes en los bordes.
  - Evaluación booleana estricta `{!!avatarUrl && ...}` y `{!!error && ...}` evitando errores `Unexpected text node: . A text node cannot be a child of a <View>`.
  - Actualización de APIs deprecadas de React Native a estándares modernos: `style={{ pointerEvents: '...' }}`, `Platform.OS !== 'web'` para `useNativeDriver`, y helpers de sombra cross-platform (`boxShadow` en web).
- **Prevención de Overscroll Global:** Configuración de `overscroll-behavior: none` en `index.css` para prevenir el estiramiento o rebote (*rubber-banding*) en móviles y trackpads.

---

## 🧪 Suite de Pruebas Automatizadas

La plataforma cuenta con cobertura de pruebas automatizadas en Backend y Frontend:

### 1. Backend (Spring Boot + JUnit 5 + MockMvc):
- **38 Pruebas automatizadas (20 anteriores + 18 nuevas):** `UsuarioServiceTest` (9), `ReporteServiceTest` (11), `ValidacionServiceTest` (3), `CloudinaryServiceTest` (7), `SecurityIntegrationTest` (5), `AuthControllerTest` (2), `BackendApplicationTests` (1).
- **Pruebas nuevas:**
  - `extractPublicIdFromUrl` (6 casos: URL con/sin versión, null, vacía, sin `/upload/`, PNG).
  - `actualizarPerfil` avatar cleanup (3 casos: cambiar, borrar, mismo URL).
  - `actualizarReporte` (4 casos: creador ok, admin ok, otro usuario 403, inexistente 404).
  - `agregarFoto` (2 casos: éxito, límite 3 fotos 400).

### 2. Frontend (React 19 + Vitest + Playwright):
- **16 Pruebas Unitarias / Integración / Ciberseguridad (`pnpm test`):**
  - `NewReportModal.test.tsx`: Geolocalización, sugerencias de calle, rechazo de direcciones inexistentes, límite de 3 fotos, peso máx 5 MB y bloqueo de videos.
  - `ReportDetailModal.test.tsx`: Carrusel multi-foto, permisos de autor para eliminar y apertura de `ConfirmDeleteDialog`.
  - `FrontendSecurity.test.ts`: Sanitización anti-XSS, validación de expiración de JWT y restricción de MIME-Types.
  - `Dashboard.test.tsx` & `api.test.ts`: Autenticación Bearer Token y renderizado de métricas.
- **Pruebas End-to-End (`pnpm test:e2e`):**
  - `pothole-reporting-and-modals.spec.ts` & `auth-and-dashboard.spec.ts` ejecutados en navegadores Chromium/WebKit reales.

---

## ⚙️ Configuración del Entorno de Desarrollo

### Requisitos Locales:
- **Java:** JDK 17 / JDK 25.
- **Node.js:** v18+ & `pnpm` 8+.
- **Docker Desktop:** Contenedor de PostgreSQL 17 / PostGIS 3.5 (`docker-compose.db.yml`).
- **Variables de Entorno en IntelliJ IDEA (Ver [.env.template](file:///c:/Dev/baches-rd/.env.template)):**
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

#### 2. Ejecutar Pruebas Backend:
```powershell
cd backend
.\mvnw.cmd test
```

#### 3. Ejecutar Pruebas Frontend (Unitarias & Ciberseguridad):
```powershell
cd frontend/apps/web
pnpm test
```

#### 4. Ejecutar Pruebas Frontend (E2E Playwright):
```powershell
cd frontend/apps/web
pnpm test:e2e
```

#### 5. Compilar Monorepo (Frontend):
```powershell
cd frontend
pnpm build
```

