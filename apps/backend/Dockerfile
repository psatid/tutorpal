# Multi-stage Dockerfile for TutorPal Backend.
# Build one component at a time:
#   docker buildx build --build-arg APP_COMPONENT=api -f apps/backend/Dockerfile .
#   docker buildx build --build-arg APP_COMPONENT=worker -f apps/backend/Dockerfile .
#
# APP_COMPONENT is intentionally used as the final stage selector. Values other
# than "api" or "worker" fail because no matching runtime stage exists.

ARG APP_COMPONENT=api

# Shared build base: dependencies and generated Prisma client are identical for
# the API and reminder worker.
FROM oven/bun:1-alpine AS builder-base

WORKDIR /app

# The workspace manifest and lockfile establish the frozen dependency graph.
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/admin-frontend/package.json ./apps/admin-frontend/package.json
COPY apps/marketing-frontend/package.json ./apps/marketing-frontend/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN bun install --frozen-lockfile --filter @tutorpal/backend

WORKDIR /app/apps/backend

# Keep the build context limited to the backend sources required by both images.
COPY apps/backend/prisma ./prisma/
COPY apps/backend/src ./src/
COPY apps/backend/scripts/build-api.ts ./scripts/build-api.ts
COPY apps/backend/tsconfig.json ./
RUN bun run db:generate

FROM builder-base AS api-builder
RUN bun run build:api

FROM builder-base AS worker-builder
RUN bun build --target=bun --outfile=dist/worker.js src/worker.ts

# API runtime: only the HTTP application needs curl, a port, and a health check.
FROM oven/bun:1-alpine AS api-runtime

WORKDIR /app
RUN apk add --no-cache curl
COPY --from=api-builder /app/apps/backend/dist ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/v1/health || exit 1

CMD ["bun", "run", "./index.js"]

# Worker runtime: no HTTP server, health check, exposed port, or curl.
FROM oven/bun:1-alpine AS worker-runtime

WORKDIR /app
COPY --from=worker-builder /app/apps/backend/dist/worker.js ./worker.js

CMD ["bun", "run", "./worker.js"]

# Select either api-runtime or worker-runtime. An unsupported APP_COMPONENT
# resolves to a non-existent stage and Docker exits before producing an image.
FROM ${APP_COMPONENT}-runtime AS final
