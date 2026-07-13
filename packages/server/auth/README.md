# @repo/auth

A self-contained NestJS authentication module providing email/password login, OTP-based email login, email-verified registration, password reset, and JWT access/refresh token management. Built on top of [`@repo/database`](../database) (Prisma).

## Contents

- [Features](#features)
- [Installation & Wiring](#installation--wiring)
- [Configuration](#configuration)
- [Data Model](#data-model)
- [HTTP API](#http-api)
  - [Registration](#registration-authregister)
  - [Login](#login-authlogin)
  - [Password Reset](#password-reset-authpassword-reset)
  - [Tokens & Session](#tokens--session-authtoken--authme)
- [Guarding Routes](#guarding-routes)
- [Security Model](#security-model)
- [Extending Mail Delivery](#extending-mail-delivery)
- [Package Exports](#package-exports)
- [Testing](#testing)

## Features

- **Password login** — email + password, verified with Argon2id.
- **OTP login** — passwordless sign-in via a 6-digit code emailed to the user.
- **Email-verified registration** — a 3-step flow (start → verify email → complete) that only creates a `User` once the email has been confirmed.
- **Password reset** — a 3-step flow (start → verify OTP → confirm) that revokes all of a user's refresh tokens on success.
- **JWT access + refresh tokens** — short-lived signed access tokens plus rotating, hashed-at-rest refresh tokens with reuse detection.
- **Login lockout** — temporary account lockout after repeated failed password attempts.
- **Rate-limited OTPs** — per-email/purpose send-window limits, resend cooldown, and max verification attempts.
- **Global auth guard** — every route is protected by default; opt out per-route/controller with `@Public()`.

## Installation & Wiring

The module is consumed as a workspace package (`@repo/auth`) and registered with `AuthModule.forRootAsync`, following the same async-options pattern as `@repo/database`'s `DatabaseModule`. It must be imported alongside `DatabaseModule` since all services depend on `PrismaService`.

The auth package has **zero mail-sending code of its own** — no transport, no templates, no exported mail types. It only knows how to *ask* for an OTP email to be sent, via a plain `sendOtpEmail` callback that the host app supplies as part of `AuthModuleOptions`. In `apps/api`, that callback is backed by [`apps/api/src/email`](../../../apps/api/src/email), a self-contained module that owns everything about mail delivery (SMTP transport, templates, provider swapping) — see [Extending Mail Delivery](#extending-mail-delivery).

```ts
// apps/api/src/app.module.ts
import { AuthModule } from '@repo/auth';
import { DatabaseModule } from '@repo/database';
import { EmailModule } from './email/email.module';
import { EmailService } from './email/email.service';

@Module({
  imports: [
    DatabaseModule.forRootAsync({ /* ... */ }),
    EmailModule,
    AuthModule.forRootAsync({
      imports: [ConfigModule, EmailModule],
      inject: [ConfigService, EmailService],
      useFactory: (config: ConfigService, emailService: EmailService) => ({
        jwt: {
          accessSecret: config.getOrThrow<string>('jwt.accessSecret'),
          refreshSecret: config.getOrThrow<string>('jwt.refreshSecret'),
          accessTtl: config.getOrThrow<string>('jwt.accessTokenTtl'),
          refreshTtl: config.getOrThrow<string>('jwt.refreshTokenTtl'),
        },
        otpSecret: config.getOrThrow<string>('otp.hashSecret'),
        sendOtpEmail: ({ email, code, purpose }) =>
          emailService.sendOtpEmail(email, code, purpose),
        // otp / registration / passwordReset / loginLockout are all optional —
        // see Configuration below for the full list of overridable knobs.
      }),
    }),
  ],
})
export class AppModule {}
```

`AuthModule.forRootAsync` registers:

- Controllers: `RegistrationController`, `LoginController`, `PasswordResetController`, `TokenController`.
- Providers: `PasswordHasherService`, `OtpService`, `LoginLockoutService`, `TokenService`, `AuthService`, `RegistrationService`, `PasswordResetService`, `JwtAccessStrategy`.
- A global `APP_GUARD` (`JwtAccessGuard`) — **every endpoint in the application is authenticated by default**, not just this module's routes. See [Guarding Routes](#guarding-routes).
- Exports `TokenService` only, for cases where another module needs to issue/revoke tokens directly.

`EmailModule` still needs to be part of `AuthModule.forRootAsync`'s `imports` — not because `AuthModule` injects anything mail-related (it doesn't), but because the `useFactory` above runs inside the dynamic module `forRootAsync` returns, and that factory's own `inject: [ConfigService, EmailService]` needs `EmailService` to be resolvable from that module's import graph.

## Configuration

`AuthModuleOptions` (see [`types/auth-module-options.type.ts`](src/types/auth-module-options.type.ts)) is provided via the async factory. Only `jwt` and `otpSecret` are required — everything else is an optional sub-object, and any field you omit falls back to a default from [`auth.constants.ts`](src/auth.constants.ts). The factory's return value is normalized once, at module registration time, by `resolveAuthModuleOptions` (in [`auth-module-options.resolver.ts`](src/auth-module-options.resolver.ts)) into a fully-populated `ResolvedAuthModuleOptions`, which is what's actually injected into services under the `AUTH_MODULE_OPTIONS` token.

| Option | Type | Default | Purpose |
| --- | --- | --- | --- |
| `jwt.accessSecret` | `string` | — (required) | HMAC secret used to sign/verify access tokens. |
| `jwt.refreshSecret` | `string` | — (required) | HMAC secret used to sign/verify refresh tokens. Must differ from `accessSecret`. |
| `jwt.accessTtl` | `string` | — (required) | Access token lifetime (e.g. `15m`), passed straight to `jsonwebtoken`'s `expiresIn`. |
| `jwt.refreshTtl` | `string` | — (required) | Refresh token lifetime (e.g. `7d`). |
| `otpSecret` | `string` | — (required) | HMAC secret used to hash OTP codes at rest (never stored in plaintext). |
| `sendOtpEmail` | `(params: { email, code, purpose }) => Promise<void>` | — (required) | Callback the host app supplies to actually deliver an OTP email. See [Extending Mail Delivery](#extending-mail-delivery). |
| `otp.length` | `number?` | `6` | Digits in a generated OTP code. |
| `otp.ttlMinutes` | `number?` | `10` | OTP validity window. |
| `otp.resendCooldownSeconds` | `number?` | `30` | Minimum gap between two OTP sends for the same email+purpose. |
| `otp.maxSendsPerWindow` | `number?` | `3` | Max OTP sends allowed within `otp.sendWindowMinutes`. |
| `otp.sendWindowMinutes` | `number?` | `10` | Rolling window the send-count limit is measured over. |
| `otp.maxVerifyAttempts` | `number?` | `5` | Wrong-code attempts allowed before the challenge is invalidated. |
| `registration.sessionTtlMinutes` | `number?` | `30` | Registration session lifetime. |
| `passwordReset.sessionTtlMinutes` | `number?` | `30` | Password reset session lifetime. |
| `loginLockout.threshold` | `number?` | `5` | Consecutive failed password logins before lockout. |
| `loginLockout.lockoutMinutes` | `number?` | `15` | Lockout duration once the threshold is hit. |

Since these are read from the `useFactory` return value, any of them can be sourced from `ConfigService` the same way `jwt`/`otpSecret` already are — nothing about the shape is special-cased for `apps/api`'s current env vars. For example, to make the OTP length configurable via an `OTP_LENGTH` env var:

```ts
useFactory: (config: ConfigService) => ({
  jwt: { /* ... */ },
  otpSecret: config.getOrThrow<string>('otp.hashSecret'),
  otp: { length: config.get<number>('otp.length') },
}),
```

In `apps/api`, the required fields are currently sourced from environment variables (see [`config/configuration.ts`](../../../apps/api/src/config/configuration.ts)):

| Env var | Maps to |
| --- | --- |
| `JWT_ACCESS_SECRET` | `jwt.accessSecret` |
| `JWT_REFRESH_SECRET` | `jwt.refreshSecret` |
| `JWT_ACCESS_TTL` | `jwt.accessTtl` (default `15m`) |
| `JWT_REFRESH_TTL` | `jwt.refreshTtl` (default `7d`) |
| `OTP_HASH_SECRET` | `otpSecret` |

SMTP env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_SECURE`) never reach `AuthModuleOptions` at all — they're read directly by `apps/api`'s `EmailModule`/`EmailService`, entirely outside the auth package. See [Extending Mail Delivery](#extending-mail-delivery).

## Data Model

The Prisma models this package depends on live in `@repo/database`, under [`prisma/schema/auth.prisma`](../database/prisma/schema/auth.prisma) (split out from the shared `prisma/schema/schema.prisma`, which only holds the `generator`/`datasource` blocks — additional domains get their own file the same way).

| Model | Purpose |
| --- | --- |
| `User` | Application user: credentials, name, verified-email timestamp. |
| `OtpChallenge` | Active one-time code per `(email, purpose)`, tracks hash, attempts, send window. |
| `RegistrationSession` | Tracks a signup in progress (`EMAIL_PENDING_VERIFICATION` → `EMAIL_VERIFIED`) until `complete()` consumes and deletes it. |
| `PasswordResetSession` | Tracks a reset in progress (`PENDING_VERIFICATION` → `VERIFIED`) until `confirm()` consumes and deletes it. |
| `LoginLockout` | Per-user failed-attempt counter and `lockedUntil` timestamp. |
| `RefreshToken` | Hashed refresh tokens with rotation metadata (`revokedAt`, `replacedByTokenHash`) for reuse detection. |

`OtpPurpose`, `RegistrationStep`, and `PasswordResetStep` are Prisma enums re-exported from `@repo/database` and consumed directly by this package's services.

## HTTP API

All request/response bodies are `class-validator`/`class-transformer` DTOs (see [`src/dto`](src/dto)) and are documented via `@nestjs/swagger` (`@ApiTags`, `@ApiProperty`). Routes marked **Public** bypass the global JWT guard (see [Guarding Routes](#guarding-routes)); all others require a valid `Authorization: Bearer <accessToken>` header.

### Registration (`/auth/register`)

All routes in this controller are **Public**.

| Method & Path | Body | Response | Description |
| --- | --- | --- | --- |
| `POST /auth/register/start` | `{ email }` | `{ registrationId }` | Creates/refreshes a `RegistrationSession` and emails an OTP. Throws `409 Conflict` if the email already belongs to a user. |
| `POST /auth/register/verify-email` | `{ registrationId, code }` | `{ registrationId }` | Verifies the OTP and marks the session `EMAIL_VERIFIED`. |
| `POST /auth/register/complete` | `{ registrationId, firstName, lastName, password, confirmPassword }` | `{ accessToken, refreshToken, user }` | Requires the session to be `EMAIL_VERIFIED`. Hashes the password, creates the `User`, deletes the session (in a transaction), and issues a token pair. `confirmPassword` must equal `password` (`@IsEqualTo`); `password` must satisfy `@IsStrongPassword()`. |

### Login (`/auth/login`)

All routes in this controller are **Public**.

| Method & Path | Body | Response | Description |
| --- | --- | --- | --- |
| `POST /auth/login/password` | `{ email, password }` | `{ accessToken, refreshToken, user }` | Verifies the password with Argon2id. Checks/updates `LoginLockoutService` around the attempt. `401 Unauthorized` on bad credentials or `429` if locked out. |
| `POST /auth/login/otp/start` | `{ email }` | `{ message }` | Sends an OTP if the email belongs to a user. Always returns the same generic message, whether or not the account exists (no user enumeration). |
| `POST /auth/login/otp/verify` | `{ email, code }` | `{ accessToken, refreshToken, user }` | Verifies the OTP and issues a token pair. |

### Password Reset (`/auth/password-reset`)

All routes in this controller are **Public**.

| Method & Path | Body | Response | Description |
| --- | --- | --- | --- |
| `POST /auth/password-reset/start` | `{ email }` | `{ resetId }` | Always creates/refreshes a `PasswordResetSession` regardless of whether the account exists; only sends an OTP if it does (no user enumeration via response, though the `resetId` itself is always returned). |
| `POST /auth/password-reset/verify-otp` | `{ resetId, code }` | `{ resetId }` | Verifies the OTP and marks the session `VERIFIED`. |
| `POST /auth/password-reset/confirm` | `{ resetId, password, confirmPassword }` | `{ message }` | Requires `VERIFIED` step. Updates the password hash and deletes the session in a transaction, then revokes **all** of the user's refresh tokens via `TokenService.revokeAllForUser`. |

### Tokens & Session (`/auth/token`, `/auth/me`)

| Method & Path | Auth | Body | Response | Description |
| --- | --- | --- | --- | --- |
| `POST /auth/token/refresh` | **Public** | `{ refreshToken }` | `{ accessToken, refreshToken }` | Rotates the refresh token — see [Refresh Token Rotation](#refresh-token-rotation--reuse-detection). |
| `POST /auth/token/logout` | **Public** | `{ refreshToken }` | `204 No Content` | Revokes the given refresh token (best-effort — no error if already revoked/unknown). |
| `GET /auth/me` | **Required** | — | `UserResponseDto` | Returns the current user, resolved from the access token's `sub` claim via `@CurrentUser()`. `404` if the user no longer exists. |

`UserResponseDto` exposes `id`, `email`, `firstName`, `lastName`, `emailVerifiedAt`, `createdAt` (via `class-transformer`'s `@Exclude`/`@Expose`, so `passwordHash` and other internal fields never leak).

## Guarding Routes

`AuthModule.forRootAsync` registers `JwtAccessGuard` as a global `APP_GUARD`. This means **every route in the host application** — not just this module's — requires a valid access token by default. To opt a controller or handler out, use the `@Public()` decorator:

```ts
import { Public } from '@repo/auth';

@Public()
@Get('health')
health() {
  return { ok: true };
}
```

Internally, `Public()` sets `isPublic` metadata that `JwtAccessGuard` reads via `Reflector#getAllAndOverride`, so it can be applied at the controller or handler level (handler wins).

Inside a protected handler, get the authenticated user with `@CurrentUser()`:

```ts
import { CurrentUser, AuthenticatedUser } from '@repo/auth';

@Get('profile')
profile(@CurrentUser() user: AuthenticatedUser) {
  return user; // { id, email }
}
```

`AuthenticatedUser` is only `{ id, email }` — it's the decoded JWT payload, not a full `User` row. Fetch the full record from `PrismaService` if you need more (see `TokenController#me` for the pattern).

## Security Model

### Passwords

Hashed with **Argon2id** (`argon2` package, `PasswordHasherService`). Strength is enforced client-of-this-API-side via `class-validator`'s `@IsStrongPassword()` on registration/reset DTOs.

### OTP codes

- Generated with `crypto.randomInt` (`generateOtpCode`), zero-padded to `otp.length` digits (see [Configuration](#configuration)).
- Never stored in plaintext — hashed with HMAC-SHA256 (`hashOtp`, keyed by `otpSecret`) and compared with `crypto.timingSafeEqual` (`verifyOtp` in [`utils/hmac.util.ts`](src/utils/hmac.util.ts)) to avoid timing attacks.
- Rate-limited per `(email, purpose)`: a rolling send window (`otp.maxSendsPerWindow` per `otp.sendWindowMinutes`) and a resend cooldown (`otp.resendCooldownSeconds`) both throw `429 TooManyRequestsException` with a `retryAfterSeconds` field.
- Verification is capped at `otp.maxVerifyAttempts`; exceeding it (or expiry) deletes the challenge, forcing a fresh `request`.
- Because `otp.length` is configurable, the verify DTOs (`RegisterVerifyEmailDto`, `LoginOtpVerifyDto`, `PasswordResetVerifyDto`) only validate that `code` is a non-empty string — the exact digit count is enforced by the hash comparison in `OtpService`, not by request validation.

### Refresh token rotation & reuse detection

- Refresh tokens are JWTs signed with a **separate** secret (`jwt.refreshSecret`) from access tokens, and carry a random `jti`.
- Only the **SHA-256 hash** of the refresh token (`hashToken`) is persisted (`RefreshToken.tokenHash`), never the raw token.
- On `POST /auth/token/refresh`, the old token is looked up by hash:
  - If it doesn't exist → `401`.
  - If it's already `revokedAt` (i.e. reuse of a rotated-out token) → **all of the user's refresh tokens are revoked** (`revokeAllForUser`) and a `401 Refresh token reuse detected` is thrown. This is the standard defense against stolen refresh tokens being replayed after the legitimate client has already rotated.
  - If expired → `401`.
  - Otherwise a new token pair is issued, and the old row is marked `revokedAt` + `replacedByTokenHash` (audit trail), rather than deleted.
- `revokeAllForUser` is also called after a successful password reset, invalidating every existing session.

### Login lockout

`LoginLockoutService` tracks `failedAttempts` per user. On the `loginLockout.threshold`-th consecutive failure it sets `lockedUntil = now + loginLockout.lockoutMinutes`. Any successful login clears the row entirely. Lockout is checked (`assertNotLocked`) **before** password verification on every attempt, throwing `429` with `retryAfterSeconds` while active.

### User enumeration

`startOtpLogin` and `password-reset/start` intentionally avoid revealing whether an email is registered: they return a generic success response/message in both branches, only sending mail when a matching user exists.

## Extending Mail Delivery

`@repo/auth` has **no mail code at all** — no transport, no `MailSender`/`MailMessage` types, no templates, no `nodemailer` dependency, nothing exported for the host app to implement or extend. Sending mail is infrastructure, not an auth concern, so the package doesn't model it as a class or DI token the way it might for something it actually owns. Instead, `AuthModuleOptions.sendOtpEmail` is a **plain async function** the host app hands in directly through the `forRootAsync` factory:

```ts
// types/auth-module-options.type.ts
export type SendOtpEmail = (params: {
  email: string;
  code: string;
  purpose: OtpPurpose; // from @repo/database
}) => Promise<void>;
```

`OtpService` calls `this.options.sendOtpEmail({ email, code, purpose })` directly — there's no `MailService`, no abstract class, no provider for the host app to bind against. Nothing under `@repo/auth`'s `src/` even imports `nodemailer` or anything mail-shaped.

Everything about *how* mail actually gets sent — SMTP transport, per-purpose subject/HTML templates, credentials — lives entirely in **`apps/api/src/email`**, which has no dependency on `@repo/auth` either:

- [`email.module.ts`](../../../apps/api/src/email/email.module.ts) — registers and exports `EmailService`.
- [`email.service.ts`](../../../apps/api/src/email/email.service.ts) — owns the `nodemailer` transporter (reading `mail.host` / `mail.port` / `mail.user` / `mail.password` / `mail.from` / `mail.secure` from `ConfigService`, i.e. the `SMTP_*` env vars) and exposes `sendOtpEmail(email, code, purpose)`.
- [`email/templates/otp-email.template.ts`](../../../apps/api/src/email/templates/otp-email.template.ts) — builds the subject/HTML per `OtpPurpose`.

`app.module.ts` is the only place the two packages meet: it injects `EmailService` into `AuthModule.forRootAsync`'s factory and wires `sendOtpEmail` to `emailService.sendOtpEmail.bind(...)` (see [Installation & Wiring](#installation--wiring)). To swap mail providers (e.g. a transactional email API instead of raw SMTP), change `EmailService`'s internals, or swap what `email.module.ts` provides — `@repo/auth` never needs to know or change, since all it sees is a function that resolves.

## Package Exports

Only the following are part of the public API surface (see [`src/index.ts`](src/index.ts)); everything else (controllers, most services, DTOs, strategies) is internal to the module:

- `AuthModule`, `AuthModuleAsyncOptions`
- `Public`, `CurrentUser` decorators
- `JwtAccessGuard`
- `TokenService`
- `AuthModuleOptions`, `ResolvedAuthModuleOptions`, `SendOtpEmail`, `SendOtpEmailParams`, `AuthenticatedRequest`, `AuthenticatedUser` types

Notably absent: anything mail-related. There is nothing to import for that — see [Extending Mail Delivery](#extending-mail-delivery).

## Testing

Unit tests (Jest + `ts-jest`) live alongside their subjects as `*.spec.ts`: `otp.service.spec.ts`, `login-lockout.service.spec.ts`, `password-hasher.service.spec.ts`, `token.service.spec.ts`.

```bash
pnpm --filter @repo/auth test
```
