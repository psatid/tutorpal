# TutorPal Documentation

Welcome to the TutorPal documentation hub. This directory contains comprehensive documentation for the project's design system, frontend architecture, and API development workflows.

## Documentation

### 🎨 Design System
**[Design System Strategy: The Academic Atelier](./design.md)**

The creative north star and design philosophy for TutorPal. Covers:
- Color palette and tonal architecture
- Typography (Manrope + Inter pairing)
- Component primitives and styling patterns
- Do's and don'ts for maintaining the scholarly aesthetic

### 🏗️ Frontend Architecture
**[Frontend Overview](./frontend/)**

Comprehensive documentation for the frontend codebase organized by topic:

| Document | Description |
|----------|-------------|
| **[README](./frontend/README.md)** | Overview, quick start, technology stack |
| **[Architecture](./frontend/architecture.md)** | Project structure, thin routes pattern, naming conventions |
| **[Routing](./frontend/routing.md)** | TanStack Router file-based routing patterns |
| **[API Integration](./frontend/api-integration.md)** | React Query/Mutation patterns, error handling, pagination |
| **[State Management](./frontend/state-management.md)** | TanStack Query caching, optimistic updates |
| **[Components](./frontend/components.md)** | Base UI primitives, shadcn/ui, component patterns |
| **[Forms](./frontend/forms.md)** | React Hook Form, Zod validation |
| **[Development](./frontend/development.md)** | Dev workflow, config files, troubleshooting |
| **[i18n](../frontend/docs/i18n.md)** | Internationalization setup with i18next |

### ⚙️ Backend Architecture
**[Backend Project Structure](./backend.md)**

Complete guide to the backend layered architecture. Covers:
- Service, Repository, Schema, and Types layers
- Dependency injection and testability patterns
- Adding new features following the architecture
- Error handling and DTO patterns
- Database operations with Prisma
- Integration with OpenAPI workflow

### 🚀 Deployment
**[Deployment Guide](./deployment.md)**

Complete deployment documentation for production:
- Docker containerization with multi-stage builds
- DigitalOcean App Platform configuration
- Database migration strategy with Supabase
- CI/CD pipeline setup
- Production checklist and troubleshooting

### 📡 API Development Workflow
**[OpenAPI Spec Generation Workflow](./openapi-workflow.md)**

Complete guide to generating type-safe API clients. Covers:
- Defining API routes with `hono-openapi` metadata
- Serving and accessing OpenAPI specs
- Downloading specs to version-controlled files
- Generating frontend API clients with Orval
- Using generated clients with TanStack Query
- End-to-end development cycle

## Quick Reference

### Running the Application

```bash
# Backend
cd backend
npm run dev                    # Start on port 3000
npm run gen:openapi            # Download OpenAPI spec to file

# Frontend
cd frontend
npm run dev                    # Start on port 3001
npm run generate:api           # Generate API clients from spec
```

### Key URLs

| Service | URL |
|---------|-----|
| Backend API | `http://localhost:3000` |
| Frontend App | `http://localhost:3001` |
| OpenAPI Spec | `http://localhost:3000/v1/docs/open-api` |
| API Docs UI | `http://localhost:3000/v1/docs` |

## Development Workflow

When adding or modifying API endpoints:

1. **Define the route** in backend using `describeRoute()`
2. **Regenerate OpenAPI spec**: `cd backend && npm run gen:openapi`
3. **Update frontend clients**: `cd frontend && npm run generate:api`
4. **Use typed endpoints** in your React components

For detailed information, see the [OpenAPI Workflow](./openapi-workflow.md) documentation.

## Contributing

When contributing to the project:

1. **Design Changes**: Reference the [Design System](./design.md) for guidelines
2. **Frontend Code**: Follow the [Frontend Architecture](./frontend/) patterns
3. **API Changes**: Update OpenAPI metadata and regenerate clients
4. **Documentation**: Keep docs in sync with code changes
