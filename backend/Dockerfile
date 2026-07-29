# Multi-stage Dockerfile for TutorPal Backend.
# Build one component at a time:
#   docker buildx build --build-arg APP_COMPONENT=api ./backend
#   docker buildx build --build-arg APP_COMPONENT=worker ./backend
#
# APP_COMPONENT is intentionally used as the final stage selector. Values other
# than "api" or "worker" fail because no matching runtime stage exists.

ARG APP_COMPONENT=api

# Shared build base: dependencies and generated Prisma client are identical for
# the API and reminder worker.
FROM oven/bun:1-alpine AS builder-base

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY prisma ./prisma/
COPY src ./src/
COPY tsconfig.json ./
RUN bun run db:generate

FROM builder-base AS api-builder
RUN bun build --target=bun --outfile=dist/index.js src/index.ts

FROM builder-base AS worker-builder
RUN bun build --target=bun --outfile=dist/worker.js src/worker.ts

# API runtime: only the HTTP application needs curl, a port, and a health check.
FROM oven/bun:1-alpine AS api-runtime

WORKDIR /app
RUN apk add --no-cache curl
COPY --from=api-builder /app/dist/index.js ./index.js

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/v1/health || exit 1

CMD ["bun", "run", "./index.js"]

# Worker runtime: no HTTP server, health check, exposed port, or curl.
FROM oven/bun:1-alpine AS worker-runtime

WORKDIR /app
COPY --from=worker-builder /app/dist/worker.js ./worker.js

CMD ["bun", "run", "./worker.js"]

# Select either api-runtime or worker-runtime. An unsupported APP_COMPONENT
# resolves to a non-existent stage and Docker exits before producing an image.
FROM ${APP_COMPONENT}-runtime AS final
