# ── Stage 1: base ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config/package.json ./packages/config/
COPY apps/web/package.json ./apps/web/

# ── Stage 2: deps ─────────────────────────────────────────────────────────────
FROM base AS deps
RUN npm ci

# ── Stage 3: build ────────────────────────────────────────────────────────────
FROM deps AS build
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=apps/web

# ── Stage 4: runner (nginx) ──────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner
# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
# Single-page app: all routes fall back to index.html
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
