# turbo-starter

Turborepo monorepo with a NestJS API, Next.js web app, shared UI kit, and Prisma (MySQL).

## Stack

| App / package | Tech |
|---------------|------|
| `apps/api` | NestJS, JWT cookie auth, OTP, OAuth, TOTP 2FA, RBAC, BullMQ, S3, Swagger |
| `apps/web` | Next.js 16 member app (auth + dashboard) |
| `apps/admin` | Next.js 16 admin dashboard (users, audit, files, 2FA) |
| `packages/client/ui` | Shared component library (`@repo/ui`) |
| `packages/client/api` | Typed API client (`@repo/api-client`) |
| `packages/server/database` | Prisma + MySQL (`@repo/database`) |
| `packages/server/types` | Shared Zod contracts + RBAC (`@repo/backend-types`) |

## Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) 9 (`corepack enable` recommended)
- Docker (optional, for local MySQL)

## Quick start

### 1. Clone and install

```bash
git clone <repo-url> turbo-starter
cd turbo-starter
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` if needed. The default `DATABASE_URL` matches the Docker MySQL service below.

Generate long random strings for the JWT and OTP secrets before running in any shared environment.

### 3. Database

Start MySQL, Redis, MinIO, and phpMyAdmin with Docker:

```bash
pnpm docker:dev
```

Apply migrations and seed default roles/permissions:

```bash
pnpm db:migrate:dev
pnpm db:seed
```

| Service | URL |
|---------|-----|
| MySQL | `localhost:3306` (user `turbo`, password `turbo`, database `turbo`) |
| Redis | `localhost:6379` |
| MinIO S3 | `localhost:9000` (console `localhost:9001`, user `minio` / `minio123`) |
| phpMyAdmin | http://localhost:8080 |

Stop Docker services:

```bash
pnpm docker:dev:down
```

If you use your own MySQL instance, update `DATABASE_URL` in `.env` accordingly.

### 4. Run apps

```bash
pnpm dev
```

| App | URL |
|-----|-----|
| Web | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/api-docs |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all packages and apps |
| `pnpm docker:dev` | Start MySQL + phpMyAdmin |
| `pnpm docker:dev:down` | Stop Docker services |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:migrate:dev` | Create/apply migrations (dev) |
| `pnpm db:migrate:deploy` | Apply migrations (production) |
| `pnpm db:migrate:reset` | Reset database and re-run migrations |
| `pnpm db:push` | Push schema without migration files |
| `pnpm db:seed` | Seed roles and permissions |
| `pnpm db:studio` | Open Prisma Studio |

Run a single app:

```bash
pnpm --filter @repo/api dev
pnpm --filter web dev
```

## Project layout

```
apps/
  api/          NestJS REST API
  web/          Next.js frontend
packages/
  client/       Shared frontend packages (ui, types, utils)
  server/       Shared backend packages (database, types, utils)
  common/       Shared ESLint and TypeScript configs
```

### Web feature modules

New features live under `apps/web/src/features/<feature-name>/` using this structure:

```
features/
  my-feature/
    components/   # UI scoped to the feature
    hooks/
    services/     # API calls, data access
    types/
    index.ts      # Barrel exports
```

Copy `apps/web/src/features/_template/` as a starting point. Empty subfolders are tracked with `.gitkeep`.

## SMTP

The API sends OTP and notification emails via SMTP. Configure `SMTP_*` variables in `.env`. For local development, point these at your provider or a local mail catcher.

## License

Private — UNLICENSED (see individual package licenses).
