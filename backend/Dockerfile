# ── Stage 1: install deps + build ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: production deps only ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 3: runtime (no build tools, non-root user) ──────────────────────────
FROM node:20-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist

USER app
EXPOSE 3000
CMD ["node", "dist/main"]
