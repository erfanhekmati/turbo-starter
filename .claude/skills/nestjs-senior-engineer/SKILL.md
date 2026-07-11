---
name: nestjs-senior-engineer
description: Design, build, review, or refactor the NestJS backend in this repo (apps/api, plus the Prisma-backed @repo/database package) with senior-engineer judgment — module architecture, dependency injection, DTO validation, exception handling, guards/interceptors/pipes, Prisma patterns, testing strategy, security hardening, and Turborepo/pnpm workspace integration. Use whenever writing or reviewing code in apps/api or packages/server/*, adding a NestJS feature module, controller, provider, or Prisma model, or debugging NestJS-specific issues (DI errors, circular deps, config validation, request lifecycle) — even if the user just says "backend," "API," or "endpoint" without naming NestJS.
---

# NestJS Senior Engineer — turbo-starter

Senior-engineer judgment for this repo's NestJS backend: code a staff engineer would approve on review — correctly layered, testable, secure by default, and consistent with the conventions already established in `apps/api` and `packages/server/*`. Apply these patterns by default, not only when explicitly asked for "best practices."

## This repo's stack (source of truth — check before assuming generic NestJS defaults)

- **App**: `apps/api` (`@repo/api`), NestJS 11, Express platform, `nest-cli`.
- **ORM**: **Prisma**, not TypeORM. Client lives in `packages/server/database` (`@repo/database`), generated output at `packages/server/database/src/generated/prisma`. Never add TypeORM or a second ORM.
- **Data access**: `PrismaService` ([prisma.service.ts](packages/server/database/src/prisma.service.ts)) extends `PrismaClient` with a `pg` `Pool` + `PrismaPg` adapter, wired via `DatabaseModule.forRootAsync` in [app.module.ts](apps/api/src/app.module.ts) as a **global module** — `PrismaService` is injectable anywhere without re-importing `DatabaseModule`.
- **Config**: `@nestjs/config` with `isGlobal: true`, validated via a `class-validator` DTO (`EnvDto` in [env.dto.ts](apps/api/src/config/dto/env.dto.ts)) run through `validateSync` in [env.validation.ts](apps/api/src/config/env.validation.ts) — **not Joi**. Structured config lives in [configuration.ts](apps/api/src/config/configuration.ts) as a namespaced factory (`app.*`, `database.*`, `jwt.*`, `swagger.*`), read via `configService.getOrThrow('namespace.key')`. New env vars need a field on `EnvDto` first, or boot fails loudly (by design — keep it that way).
- **Logging**: `nest-winston` + `winston`, configured in [logger/index.ts](apps/api/src/logger/index.ts) and wired via `app.useLogger()` in `main.ts` before anything else runs (`bufferLogs: true` on `NestFactory.create` so early logs aren't dropped). JSON format in production, pretty `nestLike` format in dev. Use Nest's `Logger` class (`new Logger('ContextName')`), never `console.log`.
- **Validation**: global `ValidationPipe` already set with `whitelist`, `forbidNonWhitelisted`, `transform`, `enableImplicitConversion` in `main.ts` — this is the baseline for every DTO, don't re-specify per-route.
- **Swagger**: [swagger/index.ts](apps/api/src/swagger/index.ts), bearer auth pre-configured, **disabled in production** (`nodeEnv === 'production'` short-circuits setup) — don't rely on Swagger being present outside dev.
- **Auth (upcoming)**: `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / TTL config already exist in `EnvDto` and `configuration.ts` but there's no `AuthModule` yet. When adding it: `@nestjs/jwt` + `@nestjs/passport`, access/refresh strategy pair, guards applied globally with a `@Public()` override decorator (see "Guards" below) rather than annotated per-route.
- **Monorepo**: pnpm workspaces + Turborepo. Shared code lives under `packages/server/*` as separate publishable-style packages: `@repo/database` (Prisma), `@repo/backend-types`, `@repo/backend-utils`. Anything reusable across a future second backend app belongs in one of these, not duplicated into `apps/api/src`. Client-side equivalents live in `packages/client/*` — never import from `packages/client/*` into `apps/api`.

## Core architectural stance

Don't write Express-style code inside the Nest shell (fat controllers, business logic in route handlers, manual `req`/`res`). If a handler does more than orchestration — call a service, map a DTO, return — that logic belongs one layer down.

**Layering (strict):**
- **Controller** — routing, request/response shape, delegates immediately. No `PrismaService` injected directly into a controller.
- **Service (provider)** — business logic, orchestration, injects `PrismaService` from `@repo/database` directly (this repo doesn't use a separate repository-class layer on top of Prisma — Prisma's generated client is already the data-access abstraction; don't add a redundant repository wrapper unless a domain genuinely needs to swap persistence).
- **DTOs** — `CreateXDto` for input, derive `UpdateXDto` via `PartialType` from `@nestjs/swagger` (keeps Swagger metadata), separate `XResponseDto`/`class-transformer` `@Exclude()` if the Prisma model exposes fields that shouldn't leave the API (password hashes, internal flags).

**Module boundaries**: one feature = one module under `apps/api/src/<feature>/` (mirrors the existing `config/`, `logger/`, `swagger/` folder-per-concern layout). Export only what other modules need. Circular deps between feature modules signal a wrong domain boundary — don't reach for `forwardRef()` as the first fix.

## Dependency injection discipline

- Constructor injection with `readonly` properties.
- Default singleton scope. Request-scoped (`Scope.REQUEST`) re-instantiates the DI chain per request — justify it explicitly (e.g., request-context-dependent Prisma tenancy), don't reach for it by default.
- Environment-dependent providers use `useFactory` + `inject: [ConfigService]`, matching the existing `DatabaseModule.forRootAsync` pattern in `app.module.ts` — follow that pattern for any new dynamic module (e.g., a future `MailModule` or third-party SDK wrapper).

## Validation and DTOs

The global `ValidationPipe` (whitelist + forbidNonWhitelisted + transform) is already enforced — every new DTO gets validated automatically, no per-controller opt-in needed. Still:
- Use `class-validator` decorators matching the `EnvDto` style already in the codebase (`@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@IsEnum()`, etc.).
- Derive `UpdateXDto` from `CreateXDto` via `PartialType` (`@nestjs/swagger`) instead of duplicating fields.
- `@ValidateNested()` + `@Type(() => NestedDto)` for nested objects/arrays — otherwise validation silently no-ops on the nested shape.

## Exception handling

Use Nest's built-in HTTP exceptions (`NotFoundException`, `ConflictException`, `BadRequestException`) at the service layer. Prisma throws typed errors (`Prisma.PrismaClientKnownRequestError` with codes like `P2002` unique constraint, `P2025` not found) — never let these leak to the client as raw 500s. Either catch and translate at the service boundary, or add a global `ExceptionFilter` (`@Catch(Prisma.PrismaClientKnownRequestError)`) once more than one service needs the same translation, mapping `P2002` → 409, `P2025` → 404, etc.

## Guards, interceptors, pipes

- **Pipes**: single-argument transform/validation (already global for DTOs; add route-specific ones like `ParseIntPipe` only where needed).
- **Guards**: authz decisions — once `AuthModule` exists, apply the JWT guard **globally** (`APP_GUARD`) with a `@Public()` decorator for the exceptions (login, refresh, health check), rather than annotating every protected route individually — much harder to accidentally ship an unprotected endpoint.
- **Interceptors**: cross-cutting request/response concerns (logging, response shaping). Don't put authz in an interceptor or business logic in a guard.

## Prisma patterns specific to this repo

- Schema lives at `packages/server/database/prisma/schema.prisma`; run `pnpm --filter @repo/database db:migrate` for dev migrations, `db:generate` after schema changes (also runs on `postinstall`). Never hand-edit `src/generated/prisma/*` — it's generated output.
- Wrap multi-step mutations in `prisma.$transaction(...)` — don't rely on per-call implicit transactions for anything where partial failure would corrupt state.
- Avoid N+1s: use `include`/`select` explicitly rather than looping and re-querying.
- If a new package needs its own Prisma-adjacent utility, it belongs in `@repo/database`, not duplicated per-app.

## Testing strategy

Jest is already configured per the `jest` block in [apps/api/package.json](apps/api/package.json) (`rootDir: src`, `ts-jest`, `*.spec.ts`) plus a separate e2e config (`test/jest-e2e.json`). Three tiers:
1. **Unit** (`*.spec.ts` beside the source file) — service logic in isolation; mock `PrismaService` via `Test.createTestingModule({...}).overrideProvider(PrismaService).useValue(mockPrisma)`.
2. **Integration** — module-level with a real (test) database when a service's Prisma queries themselves need verifying, not just the surrounding logic.
3. **E2E** (`test/*.e2e-spec.ts`, run via `pnpm test:e2e`) — `supertest` against a bootstrapped `AppModule`, exercising pipe → guard → controller → service → Prisma.

## Security defaults

- `helmet()` and explicit CORS (`app.enableCors({...})`) belong in `main.ts` alongside the existing `ValidationPipe`/logger/Swagger setup — not yet present, add when the app starts accepting cross-origin or public traffic.
- `@nestjs/throttler` on auth endpoints once `AuthModule` exists.
- Never trust client-supplied IDs for authorization — re-derive resource ownership server-side from the authenticated principal.
- JWT secrets are already validated as required, non-empty strings in `EnvDto` — keep that pattern for any new secret (fail fast at boot, don't let a missing secret surface as a runtime 500).

## Code review checklist

- [ ] No business logic or direct `PrismaService` calls in controllers
- [ ] New env vars added to `EnvDto` (`apps/api/src/config/dto/env.dto.ts`) and surfaced in `configuration.ts`, not read via raw `process.env` in feature code
- [ ] No raw Prisma errors reaching the client
- [ ] Multi-row mutations wrapped in `$transaction` where atomicity matters
- [ ] New providers have correct scope (flag unexplained `Scope.REQUEST`)
- [ ] Shared logic placed in `packages/server/*`, not duplicated into `apps/api/src`
- [ ] Tests added at the right tier (unit for service logic, e2e for new endpoints)
- [ ] No circular module dependencies introduced without a documented reason
- [ ] Swagger decorators (`@ApiTags`, `@ApiOperation`, response DTOs) added for new endpoints, consistent with the existing bearer-auth setup

## Writing style for responses

Give the idiomatic NestJS way first, matching this repo's existing patterns (global config validation, global `DatabaseModule`, folder-per-concern under `apps/api/src`) rather than a generic Express workaround or a different ORM's idioms. Flag explicitly when a request fights the framework's grain or this repo's established conventions, even if a workaround would technically work.
