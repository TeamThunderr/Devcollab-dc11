# ── Stage 1: base ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
# Only copy manifests first for better layer caching
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

# ── Stage 2: dev ──────────────────────────────────────────────────────────────
FROM base AS dev
RUN npm ci
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
WORKDIR /app/apps/api
CMD ["npx", "tsx", "watch", "src/index.ts"]

# ── Stage 3: build ────────────────────────────────────────────────────────────
FROM base AS build
RUN npm ci
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
# Build shared-types first so the api can reference compiled output
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=apps/api

# ── Stage 4: runner (production) ─────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy production node_modules and compiled output only
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/index.js"]
