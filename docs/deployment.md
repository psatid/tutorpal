# Deployment Guide

This guide covers deploying the TutorPal backend to DigitalOcean App Platform with Docker and DigitalOcean Container Registry.

## Prerequisites

- [DigitalOcean Account](https://cloud.digitalocean.com/)
- [doctl CLI](https://docs.digitalocean.com/reference/doctl/) installed and authenticated
- [Docker](https://docs.docker.com/get-docker/) installed
- [Supabase](https://supabase.com/) project with connection string
- [Git](https://git-scm.com/) installed

## Architecture Overview

```
┌──────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Local Machine   │────▶│  DigitalOcean App    │────▶│   Supabase DB   │
│  (Build & Push)  │     │  Platform (Docker)   │     │   (Postgres)    │
└──────────────────┘     └──────────────────────┘     └─────────────────┘
          │                           ▲
          │                           │
          ▼                           │
┌──────────────────┐                  │
│  DO Container    │──────────────────┘
│  Registry        │     Pull dev image
└──────────────────┘
```

## Tagging Strategy

We use a **git-based tagging strategy** for deployments:

### Development Environment

| Tag | Purpose | Example |
|-----|---------|---------|
| `git-<sha>` | Immutable tag for specific commits | `git-abc1234` |
| `dev` | Mutable tag pointing to current dev | `dev` |

**Key Principles:**
- ✅ **Immutable tags** (`git-<sha>`) preserve history
- ✅ **Promotion = retagging**, not rebuilding
- ✅ **Easy rollback** by retagging `dev` to an older `git-<sha>`
- ✅ **No staging environment** (dev → prod workflow)

### Production Environment (Future)

| Tag | Purpose | Example |
|-----|---------|---------|
| `<semver>` | Semantic version from releases | `1.2.1` |
| `prod` | Mutable tag pointing to current prod | `prod` |

## Configuration Files

### 1. Dockerfile (`backend/Dockerfile`)

Multi-stage build optimized for production:
- **Stage 1 (builder)**: Install dependencies, generate Prisma client
- **Stage 2 (production)**: Minimal image with only production dependencies
- **Base image**: `oven/bun:1-alpine` for small footprint
- **Port**: 3000
- **Health check**: Built-in curl health check at `/v1/health`

### 2. DigitalOcean App Spec (`.do/dev.app.yaml`)

Defines the **development** App Platform service:
- **Service name**: `tutor-pal-backend-dev`
- **Source**: DigitalOcean Container Registry (no GitHub integration)
- **Image tag**: `dev` (mutable, points to current version)
- **Region**: Singapore (`sgp`) - change as needed
- **Health check**: HTTP GET `/v1/health`
- **Instance size**: `basic-xxs` (dev-sized instance)

### 3. Deployment Script (`scripts/deploy-dev.sh`)

Automated deployment script with:
- ✅ Git SHA-based tagging (7 characters)
- ✅ Uncommitted change detection
- ✅ Colorized output for better UX
- ✅ Opt-in deployment with `--deploy` flag
- ✅ Automatic health check verification

### 4. Environment Variables

Required environment variables (set in DO dashboard):

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase connection string | `postgresql://postgres:[password]@[host]:5432/postgres?sslmode=require` |
| `BETTER_AUTH_SECRET` | Strong random string for auth | Generate: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Backend public URL | Auto-set by DO as `${APP_URL}` |
| `CORS_ORIGIN` | Frontend domain(s) | `https://your-frontend.com` |

## Quick Start - Dev Deployment

### Option 1: Using the Automated Script (Recommended)

```bash
# Navigate to project root
cd /path/to/tutorpal

# Build and push only (no deployment)
./scripts/deploy-dev.sh

# Build, push, and deploy
./scripts/deploy-dev.sh --deploy
```

The script will:
1. ✅ Check for uncommitted changes
2. ✅ Get shortened git SHA (7 characters)
3. ✅ Build Docker image with SHA tag
4. ✅ Tag as `dev` (promotion)
5. ✅ Push both tags to registry
6. ✅ Optionally deploy to App Platform
7. ✅ Verify health check

### Option 2: Manual Deployment

If you prefer manual control:

```bash
# 1. Setup DigitalOcean Container Registry
# (Skip if already created)
doctl registry create tutor-pal --subscription-tier basic

# 2. Build with git SHA
cd /path/to/tutorpal
export GIT_SHA=$(git rev-parse --short=7 HEAD)
docker build -t tutor-pal-backend:git-${GIT_SHA} ./backend

# 3. Tag as dev (promotion without rebuild)
docker tag tutor-pal-backend:git-${GIT_SHA} tutor-pal-backend:dev

# 4. Push to registry
doctl registry login
docker tag tutor-pal-backend:git-${GIT_SHA} registry.digitalocean.com/tutor-pal/backend:git-${GIT_SHA}
docker tag tutor-pal-backend:dev registry.digitalocean.com/tutor-pal/backend:dev
docker push registry.digitalocean.com/tutor-pal/backend:git-${GIT_SHA}
docker push registry.digitalocean.com/tutor-pal/backend:dev

# 5. Create app (first time only)
doctl apps create --spec .do/dev.app.yaml

# 6. Update existing app
export APP_ID=$(doctl apps list --format ID,Name --no-header | grep "tutor-pal-backend-dev" | awk '{print $1}')
doctl apps update $APP_ID --spec=.do/dev.app.yaml
```

## First-Time Setup

### 1. Set Environment Variables in Dashboard

1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Find your app (`tutor-pal-backend-dev`)
3. Go to **Settings** tab
4. Click **Edit** on **App-Level Environment Variables**
5. Add:

```
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres?sslmode=require
BETTER_AUTH_SECRET=<generate with openssl rand -base64 32>
CORS_ORIGIN=https://your-frontend-domain.com
```

### 2. Run Database Migrations

⚠️ **Important**: Run migrations **before** deploying new code!

```bash
cd backend

# Set dev database URL
export DATABASE_URL="your-supabase-dev-url"

# Install dependencies
bun install

# Run migrations
bunx prisma migrate deploy

# Verify
bunx prisma migrate status
```

### 3. Verify Deployment

```bash
# Get app URL
export APP_ID=$(doctl apps list --format ID,Name --no-header | grep "tutor-pal-backend-dev" | awk '{print $1}')
export APP_URL=$(doctl apps get $APP_ID --format DefaultIngress --no-header)

# Test health
curl $APP_URL/v1/health
# Should return: {"status":"ok"}

# View API docs
open $APP_URL/v1/docs
```

## Rollback Strategy

If you need to rollback to a previous version:

```bash
# Find the commit SHA you want to rollback to
# (use git log or doctl registry repository list-tags tutor-pal/backend)

# Example: Rollback to git-abc1234
export ROLLBACK_SHA="abc1234"

# Pull the old image
docker pull registry.digitalocean.com/tutor-pal/backend:git-${ROLLBACK_SHA}

# Retag as dev
docker tag registry.digitalocean.com/tutor-pal/backend:git-${ROLLBACK_SHA} \
           registry.digitalocean.com/tutor-pal/backend:dev

# Push the retagged image
docker push registry.digitalocean.com/tutor-pal/backend:dev

# Trigger deployment
export APP_ID=$(doctl apps list --format ID,Name --no-header | grep "tutor-pal-backend-dev" | awk '{print $1}')
doctl apps create-deployment $APP_ID
```

## Update Deployment

For routine updates:

```bash
# Using the script (recommended)
./scripts/deploy-dev.sh --deploy

# Or manually
docker build -t tutor-pal-backend:git-$(git rev-parse --short=7 HEAD) ./backend
# ... (follow manual steps above)
```

## Local Testing

Test the Docker build locally:

```bash
# Build
cd backend
docker build -t tutor-pal-backend .

# Run with Supabase connection
docker run -p 3000:3000 \
  -e DATABASE_URL="your-supabase-url" \
  -e BETTER_AUTH_SECRET="test-secret" \
  -e CORS_ORIGIN="http://localhost:3001" \
  -e PORT=3000 \
  tutor-pal-backend

# Test in another terminal
curl http://localhost:3000/v1/health
```

## Useful Commands

```bash
# List all apps
doctl apps list

# Get dev app ID
export APP_ID=$(doctl apps list --format ID,Name --no-header | grep "tutor-pal-backend-dev" | awk '{print $1}')

# View app logs
doctl apps logs $APP_ID --type=run

# View build logs
doctl apps logs $APP_ID --type=build

# Update app spec
doctl apps update $APP_ID --spec=.do/dev.app.yaml

# Create deployment
doctl apps create-deployment $APP_ID

# Get app info
doctl apps get $APP_ID

# Delete app
doctl apps delete $APP_ID

# Registry commands
doctl registry login
doctl registry repository list-tags tutor-pal/backend
doctl registry repository list-v2 tutor-pal/backend

# List available images
docker images | grep tutor-pal-backend
```

## Production Readiness Checklist

When you're ready to set up production:

- [ ] Create `.do/prod.app.yaml` for production environment
- [ ] Use semantic versioning (e.g., `1.2.1`) for production tags
- [ ] Set up `prod` tag workflow (similar to `dev`)
- [ ] Upgrade instance size to `professional-xs` or higher
- [ ] Enable auto-scaling in prod spec
- [ ] Set up proper CORS origins for production domain
- [ ] Configure log drains for centralized logging
- [ ] Set up monitoring and alerts
- [ ] Run load testing
- [ ] Enable connection pooling in Supabase (PgBouncer)
- [ ] Review and optimize Prisma connection limits

## Troubleshooting

### Health check failing

```bash
# Check logs
doctl apps logs $APP_ID

# Verify health endpoint manually
curl https://your-app-domain.ondigitalocean.app/v1/health
```

### Database connection issues

- Verify `DATABASE_URL` is set correctly in dashboard
- Ensure Supabase allows connections from DO IPs
- Check Supabase connection pooling settings

### Build failures

```bash
# Build locally to debug
cd backend
docker build -t tutor-pal-backend .
```

### Image not found

```bash
# Verify image exists in registry
doctl registry repository list-tags tutor-pal/backend

# Re-push if needed
./scripts/deploy-dev.sh
```

### Uncommitted changes error

```bash
# Check git status
git status

# Add and commit changes
git add .
git commit -m "Your commit message"

# Then run deployment script again
./scripts/deploy-dev.sh --deploy
```

## Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [App Platform Spec Reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/)
- [doctl CLI Reference](https://docs.digitalocean.com/reference/doctl/)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [DigitalOcean Container Registry](https://docs.digitalocean.com/products/container-registry/)
