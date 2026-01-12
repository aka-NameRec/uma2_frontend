# UMA2 Frontend Demo

Demo frontend application for UMA2 (Unified Metadata Architecture) - SQL and JSQL query interface.

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd uma2_frontend
```

2. Install dependencies:
```bash
pnpm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure API URL in `.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_DEFAULT_DIALECT=generic
```

## Development

Start development server:
```bash
pnpm dev
```

The application will be available at http://localhost:3000

## Build

Build for production:
```bash
pnpm build
```

## Features

- SQL and JSQL query editors with syntax highlighting
- Query execution with results display
- SQL ↔ JSQL conversion
- Schema Explorer (coming soon)
- Query history (coming soon)
- Dark mode support
- Infinite scroll for large results (coming soon)

## Architecture

This project follows **Feature-Sliced Design (FSD)** architecture:

```
src/
├── app/          # Application configuration and providers
├── entities/      # Business logic and domain entities
├── features/       # UI features and components
├── pages/         # Page-level components and logic
└── shared/        # Shared utilities and configuration
```

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Pinia** - State management
- **TanStack Query** - Data fetching and caching
- **Vite** - Build tool

## API Integration

This frontend communicates with UMA2 backend API:

- `/api/uma/select` - Execute JSQL queries
- `/api/uma/transform/sql2jsql` - Convert SQL to JSQL
- `/api/uma/transform/jsql2sql` - Convert JSQL to SQL
- `/api/uma/meta/entity_list` - Get entity list
- `/api/uma/meta/entity_details` - Get entity metadata

See `docs/20260113-022005-log-implementation_plan.md` for detailed implementation plan.
