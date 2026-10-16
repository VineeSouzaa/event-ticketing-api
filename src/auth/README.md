# auth

Vertical slice: email + password sign-up / sign-in / sign-out and `GET /auth/me`. Authentication
is cookie-session based, built on `@nestjs/authentication` (global guard: every route requires a
session unless marked `@Public()`). `AuthenticationModule.forRootAsync` is configured once in
`AppModule`; this slice supplies the credential flow (`CredentialsService`, `UsersRepository`) and
`SessionAuth`, the provider that loads the `User` for a live session.

`User` lives in `core/entities/` because `reservations/` references it. Other slices get the
signed-in user with `@CurrentUser()` straight from `@nestjs/authentication` — they never import
from `auth/`.

- Sign-up and sign-in are throttled (5 attempts/minute per IP, `ThrottlerGuard` on those two
  routes only).
- The frontend origin (`WEB_ORIGIN`) gets CORS with credentials and is trusted by the session
  layer; without it the package rejects cross-origin state-changing requests with 403.
- Sessions and throttle counters are in-memory (single instance, lost on restart) — a Redis-backed
  `SessionStore` is the upgrade path.

Deliberately out of scope: email verification, password reset, MFA, roles.
