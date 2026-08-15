# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Tests

### Unitarias / Integración (Jest + React Native Testing Library)

```powershell
# Desde frontend/apps/mobile
pnpm test          # watch
pnpm test:ci       # CI: jest --ci --coverage=false --maxWorkers=2
# O desde la raíz del monorepo frontend:
pnpm --filter mobile test:ci
```

- Typecheck de tests: `pnpm exec tsc --noEmit` (desde `frontend/apps/mobile`) debe salir 0 errores. Requiere `compilerOptions.types: ["jest"]` en `tsconfig.json` (TS2708 "Cannot use namespace 'jest'" + TS2593 `describe`/`it` sin esos globals; `@types/jest` está hoisted en `frontend/node_modules`).
- No usar `global` en tests (no hay `@types/node` con `types: ["jest"]`) → usar `globalThis`.
- Fixtures de `UsuarioResponse`/`ReporteResponse` (de `@repo/shared-types`) deben incluir campos obligatorios (`createdAt`, `updatedAt`, `usuario.email/rol/activo/createdAt`, enums con `as const`).
- `jest.setup.ts` define `globalThis.IS_REACT_ACT_ENVIRONMENT = true` y mockea `Animated.timing`/`Animated.parallel` (llaman `start(cb)` sincrónicamente) para evitar crash de worker por el leak de animación de `ModalShell`.
- NO usar `jest.mock('react-native')` completo → rompe con `_ReactNativeCSSInterop`.
- `lib/storage.ts` cachea módulo `cachedToken`/`cachedUser`; `AsyncStorage.clear()` no lo resetea → limpiar cache explícito en tests.

### E2E (Maestro)

Requiere emulador/dispositivo con la app instalada y backend corriendo (Android: `10.0.2.2:8080`, iOS: `localhost:8080`).

```powershell
# Desde frontend/apps/mobile
pnpm test:e2e               # maestro test .maestro
maestro test .maestro/01-login.yaml          # flow individual
maestro test .maestro --exclude-tags=wip
```

Flows en `.maestro/`:
- `01-login.yaml` — login con admin seed (`admin@bachesrd.com` / `admin123`).
- `02-create-report.yaml` — login + crear reporte por nombre de calle (modo street) con severidad MEDIA.

Convenciones de los flows:
- `appId: com.angelrmatoz.mobile`.
- `clearState: true` al lanzar para empezar sin sesión. Tras `clearState` en un dev build conectado a Metro, la app re-descarga el bundle → usar `extendedWaitUntil: { visible: "Baches RD", timeout: 30000 }` para el primer assert en vez de `assertVisible` simple.
- La app NO abre login tras `clearState`: abre el dashboard público (mapa + reportes) con botón header "Iniciar sesión" (`index.tsx`). "Entrar al mapa" es el botón submit del formulario de login (`login.tsx`). Los flows deben navegar: assert + tap "Iniciar sesión" → login.
- Los inputs de login tienen `testID="login-email"` / `testID="login-password"` → seleccionar con `tapOn: { id: ... }` (testID RN → resource-id Android). NO usar `tapOn: "Contraseña"`: ese texto es un label Text, no el TextInput, y el texto se concatena al campo email.
- Para sugerencias de Nominatim: aparecen EN VIVO al escribir (debounce 450ms + fetch), el botón "Buscar calle" geocodifica directo (no muestra sugerencias). Esperar con `extendedWaitUntil: { visible: ".*27 de Febrero.*", timeout: 30000 }` y seleccionar `tapOn: { text: "…", index: 0 }`.
- El flow de creación es idempotente: si ya existe un reporte activo a <30m, el backend devuelve HTTP 409 y la app muestra el diálogo "Reporte duplicado detectado". Tolerar con `runFlow: { when: { visible: ... } }` antes del assert final.