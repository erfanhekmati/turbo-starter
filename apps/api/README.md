# API

NestJS REST API for turbo-starter.

See the [root README](../../README.md) for setup (install, database, and running all apps).

## Commands

```bash
pnpm dev          # http://localhost:8000 (watch mode)
pnpm build
pnpm start:prod   # run compiled output
pnpm lint
pnpm test
pnpm test:e2e
```

## Swagger

Open http://localhost:8000/api-docs in development.

## Auth

Registration, OTP login, password reset, JWT access/refresh tokens, and RBAC are implemented under `src/modules/auth/`.
