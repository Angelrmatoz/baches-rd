# Baches RD — Plataforma Cívica de Reporte Vial

Baches RD es una solución de tecnología cívica diseñada para empoderar a los ciudadanos de Santo Domingo a reportar, documentar y validar colectivamente daños en la infraestructura vial pública (baches, grietas, hundimientos).

El proyecto se ejecuta en un entorno de desarrollo local basado en contenedores Docker y WSL2.

---

## 📁 Estructura del Proyecto

```
baches-rd/
├── AGENTS.md             # Guía de referencia rápida para Desarrolladores e Asistentes IA
├── .env.template        # Plantilla de variables de entorno (JWT, Cloudinary, DB)
├── frontend/             # Monorepo Turborepo (React Native Expo + React Vite SPA)
│   ├── apps/
│   │   ├── mobile/       # Aplicación móvil para ciudadanos (Expo)
│   │   └── web/          # Dashboard web administrativo (Vite + React)
│   └── packages/
│       └── shared-types/ # Interfaces TypeScript compartidas
│
└── backend/              # Backend en Spring Boot (Java 17/25 + Maven + PostGIS + Flyway)
    ├── docker-compose.db.yml # PostgreSQL 17 + PostGIS 3.5 + pgAdmin
    ├── .env.template     # Variables de entorno del backend
    └── src/              # API REST, Entidades JPA, Repositorios PostGIS y Flyway
```

---

## 🛠️ Tecnologías Clave

* **Diseño Estético:** Estilo visual **"Liquid Glass"** con Glassmorphism premium.
* **Componentes UI:** Shadcn UI (Web) y `react-native-reusables` (Móvil).
* **Base de Datos Geoespacial:** PostgreSQL 17 + PostGIS 3.5 con índices GIST (`Geometry(Point, 4326)`).
* **Filtro Anti-Duplicados:** Algoritmo PostGIS `ST_DWithin` a 30m para evitar reportes colisionados.
* **Seguridad & Excepciones:** Spring Security + JWT Tokens firmados + `GlobalExceptionHandler` (HTTP 400, 401, 403, 404, 409, 500).

---

## 🚦 Inicio Rápido de Desarrollo

### 1. Levantar la Base de Datos (PostGIS)
Navega a la carpeta de backend y ejecuta:
```powershell
cd backend
docker compose -f docker-compose.db.yml up -d
```

### 2. Iniciar el Backend (Spring Boot)
Define las variables de entorno de [.env.template](file:///c:/Dev/baches-rd/.env.template) y ejecuta:
```powershell
cd backend
$env:JWT_SECRET="074142544c0e3e63e4c3c1ae7b76bd8852a40e3d3a45665b9393b59f85f6881e"
.\mvnw.cmd spring-boot:run
```

### 3. Iniciar el Frontend (Web)
Desde la raíz de la carpeta frontend:
```powershell
cd frontend
pnpm install
pnpm dev
```

---
Para más detalles técnicos y la lista completa de endpoints REST, consulta [AGENTS.md](file:///c:/Dev/baches-rd/AGENTS.md).
