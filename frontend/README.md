# Baches RD — Frontend (Monorepo Turborepo)

Este directorio contiene los clientes del proyecto: el dashboard web, la aplicación móvil y las definiciones de tipos TypeScript compartidos, gestionados mediante **Turborepo** y **pnpm**.

---

## 📁 Estructura del Monorepo

* **`apps/web/`**: Dashboard Web desarrollado con **React + Vite + TypeScript**. Implementa Leaflet para visualización de mapas y Tailwind CSS v4 para el estilo visual "Liquid Glass".
* **`apps/mobile/`**: Aplicación móvil para ciudadanos desarrollada con **React Native (Expo)**. Utiliza componentes de `react-native-reusables` y almacenamiento cifrado para JWT.
* **`packages/shared-types/`**: Definiciones y contratos de datos en TypeScript para asegurar coherencia entre móvil, web y backend.

---

## 🛠️ Tecnologías y Estándares

### Apps Móvil (`apps/mobile`)
* **Framework:** Expo SDK 51+ / React Native.
* **Estilos & UI:** Tailwind (NativeWind) junto con `react-native-reusables` para botones y modales.
* **Seguridad de Tokens:** Uso estricto de `expo-secure-store` para guardar el JWT en el Keychain (iOS) o Keystore (Android). Queda prohibido usar Async Storage.
* **Cámara & GPS:** `expo-camera` y `expo-location` para capturar coordenadas exactas del bache en tiempo real.

### Dashboard Web (`apps/web`)
* **Framework:** React 19 + Vite.
* **Estilos:** Tailwind CSS v4 (incorporado nativamente con `@tailwindcss/vite`).
* **UI:** Shadcn UI + Glassmorphism premium (utilidades de `backdrop-blur`).
* **Mapas:** Leaflet y `react-leaflet` con capas gratuitas de OpenStreetMap.

---

## 💻 Desarrollo Local

### Instalar dependencias
Desde este directorio (`frontend/`):
```bash
pnpm install
```

### Ejecutar todas las aplicaciones en modo dev
```bash
pnpm dev
```
Turborepo iniciará en paralelo la aplicación web (por defecto en `http://localhost:5173`) y el entorno Expo de la aplicación móvil.

### Compilar para producción
```bash
pnpm build
```

### Comprobar sintaxis y formato
```bash
pnpm lint
pnpm format
```

---

## ⚠️ Notas de Desarrollo

1. **Gestión de Tipos:** Si actualizas los modelos de baches o usuarios, hazlo en `packages/shared-types/src` y ejecuta `pnpm build` para propagar los cambios.
2. **CORS:** En desarrollo local, `apps/web` utiliza el proxy de Vite configurado en `vite.config.ts` para redireccionar las peticiones a la API del backend sin problemas de CORS.
3. **Flujo de Fotos (Direct Upload):**
   * El cliente pide firma criptográfica al backend (`GET /photos/signature`).
   * El cliente sube la foto directamente a la API de Cloudinary.
   * El cliente envía la URL e ID al backend para registrarla.
