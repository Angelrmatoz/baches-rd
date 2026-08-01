# syntax=docker/dockerfile:1
#
# Baches RD — Web SPA (React + Vite). Dockerfile multistage único.
# Build context: raíz del monorepo (frontend/), necesario para los workspace:* de @repo/*.
#
#   Producción: docker build --target runner -f apps/web/Dockerfile -t baches-web .
#   Desarrollo: docker build --target dev    -f apps/web/Dockerfile -t baches-web-dev .
#   (docker-compose.{dev,prod}.yml usan `target` para elegir el stage final)

# ---------- Stage 1: base (corepack + package.json de todo el monorepo) ----------
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/api/package.json packages/api/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/ui/package.json packages/ui/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/

# ---------- Stage 2: deps (caché fina; solo se re-ejecuta si cambia un package.json) ----------
FROM base AS deps
RUN pnpm install --frozen-lockfile

# ---------- Stage 3: DEV (servidor Vite con hot-reload) ----------
FROM deps AS dev
# Source completo; en compose el repo se monta encima para reflejar cambios al instante
COPY . .
EXPOSE 5173
CMD ["pnpm", "--filter", "web", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# ---------- Stage 4: builder (compilación de producción con tsc) ----------
FROM deps AS builder
COPY . .
RUN pnpm --filter web build

# ---------- Stage 5: runner (nginx sirve el dist + proxya /api al backend del host) ----------
FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# Template con ${BACKEND_UPSTREAM} sustituido por envsubst en el entrypoint de nginx
COPY apps/web/nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
# Banner antes de arrancar nginx: la URL de prod depende del mapeo del compose
# (por defecto 3000:80). nginx no imprime ninguna URL útil en sus logs.
CMD ["sh", "-c", "printf '\\n  ============================================\\n  Baches RD — PROD SERVER\\n  Abre en tu navegador:  http://localhost:3000/\\n  (si cambiaste el puerto en docker-compose.prod.yml, usa ese)\\n  ============================================\\n\\n' && nginx -g 'daemon off;'"]
