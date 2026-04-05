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
**[Frontend Project Structure](./frontend.md)**

Comprehensive guide to the frontend codebase. Covers:
- Technology stack and dependencies
- Directory structure and file organization
- TanStack Router file-based routing
- Component organization (layout vs. UI components)
- Tailwind CSS 4 + CSS variables styling
- Development workflow and commands
- Design system integration

**[Internationalization (i18n)](../frontend/docs/i18n.md)**

Guide to the i18n setup with i18next. Covers:
- Translation file structure (one file per screen)
- Using translations in components
- Interpolation and variables
- Adding new languages
- Best practices for organizing translations

### ⚙️ Backend Architecture
**[Backend Project Structure](./backend.md)**

Complete guide to the backend layered architecture. Covers:
- Service, Repository, Schema, and Types layers
- Dependency injection and testability patterns
- Adding new features following the architecture
- Error handling and DTO patterns
- Database operations with Prisma
- Integration with OpenAPI workflow

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
2. **Frontend Code**: Follow the [Frontend Architecture](./frontend.md) patterns
3. **API Changes**: Update OpenAPI metadata and regenerate clients
4. **Documentation**: Keep docs in sync with code changes
