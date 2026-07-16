# Baches RD — Plataforma Cívica de Reporte Vial

Baches RD es una solución de tecnología cívica diseñada para empoderar a los ciudadanos de Santo Domingo a reportar, documentar y validar colectivamente daños en la infraestructura vial pública (baches, grietas, hundimientos).

El proyecto está diseñado bajo una filosofía de costo cero inicial y se ejecuta en un entorno de desarrollo 100% local basado en contenedores Docker y WSL2.

---

## 📁 Estructura del Repositorio

El proyecto se divide en dos repositorios lógicos que conviven en esta estructura de directorios:

```
baches-rd/
├── frontend/             # Monorepo Turborepo (React Native Expo + React Vite SPA)
│   ├── apps/
│   │   ├── mobile/       # Aplicación móvil para ciudadanos (Expo)
│   │   └── web/          # Dashboard web administrativo y de visualización (Vite)
│   └── packages/
│       └── shared-types/ # Tipos y definiciones de TypeScript compartidos
│
└── backend/              # Backend en Spring Boot (Java 25 + Maven + PostGIS + Docker)
    ├── docker/           # Infraestructura PostgreSQL 15 + PostGIS 3.4
    └── src/              # API REST y lógica de negocio geoespacial
```

---

## 🛠️ Tecnologías Clave

* **Diseño Estético:** Estilo visual **"Liquid Glass"** con Glassmorphism premium.
* **Componentes UI:** Shadcn UI (Web) y `react-native-reusables` (Móvil).
* **Base de Datos Geoespacial:** PostgreSQL 15 + PostGIS 3.4 con índices GIST.
* **Procesamiento de Archivos:** Flujo Direct Upload a Cloudinary (Signed Upload) para evitar sobrecarga del servidor.
* **Compilación de Alto Rendimiento:** GraalVM para compilar el backend como imagen nativa de Linux.

---

## 🚀 Requisitos de Entorno (Desarrollo Local en WSL2)

Para garantizar un óptimo rendimiento de E/S de archivos y evitar problemas con Hot Module Replacement (HMR) y volúmenes de Docker, el desarrollo debe realizarse dentro del sistema de archivos de Linux en **WSL2**.

### Prerrequisitos:
1. **WSL2** configurado por defecto:
   ```bash
   wsl --set-default-version 2
   ```
2. **Docker Desktop** con la integración de WSL2 activa (`Settings -> General -> Use WSL 2 based engine`).
3. **Node.js** v20+ e instalar **pnpm** de forma global.
4. **Java 25** y **Maven** para la compilación del backend.

---

## 🚦 Instrucciones Generales de Inicio

### 1. Levantar la Base de Datos (PostGIS)
Navega a la carpeta de backend y levanta los contenedores:
```bash
cd backend/docker
docker compose up -d
```

### 2. Iniciar el Backend
Desde la raíz del backend:
```bash
cd backend
mvn spring-boot:run
```

### 3. Iniciar el Frontend (Web y Móvil)
Desde la raíz de la carpeta frontend:
```bash
cd frontend
pnpm install
pnpm dev
```
Esto iniciará simultáneamente las aplicaciones web y móvil utilizando la canalización de Turborepo.
