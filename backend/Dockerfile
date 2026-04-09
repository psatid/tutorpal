# Multi-stage Dockerfile for TutorPal Backend
# Optimized for minimal image size using Bun's bundler
# Prisma uses WASM engine (no native binary needed)

# Stage 1: Build
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install all dependencies
RUN bun install --frozen-lockfile

# Copy Prisma schema and source
COPY prisma ./prisma/
COPY src ./src/
COPY tsconfig.json ./

# Generate Prisma client (uses WASM engine)
RUN bun run db:generate

# Build standalone executable with Prisma files bundled
RUN bun build --target=bun --outfile=dist/index.js src/index.ts

# Stage 2: Production - Minimal runtime
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy the bundled application
COPY --from=builder /app/dist/index.js ./index.js

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/v1/health || exit 1

# Start the application
CMD ["bun", "run", "./index.js"]
