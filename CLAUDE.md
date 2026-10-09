# event-ticketing-api — Claude Code instructions

## What this project is

Portfolio piece (NestJS backend) built specifically to demonstrate: correctness + performance
under concurrent load (the classic "10,000 users hit the same screen" interview question),
observability/traceability done naturally (not bolted on), and disciplined REST API design.
Paired with a separate frontend repo, `event-ticketing-web` (Next.js). Full planning history and
rationale for every decision below lives in
`~/Projects/AI/ai-solution-analysis/projects/personal/event-ticketing/decisions/v1-architecture.md`
— read it before proposing any architectural change, and update it (new version, not an edit) if a
decision here actually changes.

## Domain

Event ticket reservation platform. Tier-based counters (e.g. "47 VIP left"), **not** named/seated
tickets — that's an explicit, deliberate v1 scope boundary, not an oversight.

## Architecture — read before creating any module

**Vertical slices, with a shared core layer underneath — not layered-by-technical-type, not full
Hexagonal/Clean Architecture ceremony.**

- Organize by feature module: `reservations/`, `availability/`, `events/`. Each owns its
  controller, service, DTOs, and tests together.
- **Hard rule to prevent circular dependencies** (this bit us for real in a prior project —
  RUK Platform): feature slices **never import each other directly**. Shared domain concepts
  (Event, TicketTier) live in a `core/` (or `shared/`) module that slices import from — one
  direction only, slice → core, never core → slice, never slice → slice.
- Do not introduce formal ports/adapters, repository-interface-with-swappable-implementations, or
  DDD tactical patterns (aggregates, value objects as a formal pattern) — deliberately rejected,
  see the solution doc's "Alternatives considered" / decision rationale. This isn't the place to
  re-prove Clean Architecture; Vinicius already has that from real professional work (RUK). This
  project's job is to prove the things listed in the "What this project is" section above.
- If a genuine circular-dependency risk appears between two slices, the fix is: extract the shared
  piece into `core/`, not `forwardRef()`. Only use `forwardRef()` as a last resort, and comment
  *why* inline if it's ever used.

## The core technical thesis — do not blur these two concerns

1. **Correctness** (never oversell a ticket tier) is PostgreSQL's job: an atomic, conditional
   update (decrement only if enough quantity remains, in one operation, no read-then-write race).
2. **Performance** (don't let concurrent reads of "how many are left" hammer Postgres) is Redis's
   job: read-through cache in front of the availability query, invalidated/updated on every
   successful reservation state change.

Never use Redis as the source of truth for ticket counts, and never try to solve overselling with
caching alone — that conflation is explicitly called out as the mistake to avoid in the solution
doc.

## Reservation flow

Create hold → correlation ID generated (propagate it through every log line for that reservation's
lifecycle) → atomic conditional decrement in Postgres → structured log written (MongoDB) →
expiry timer started → on confirm (simulated payment webhook endpoint), log "confirmed"; on
timeout, expiry job releases the quantity (atomically — must be guarded against racing a
last-second confirmation: only release if status is still `pending` at release time). Every
successful state change triggers a Redis cache update + Pub/Sub publish, which the WebSocket
gateway forwards to clients watching that event.

## Observability

MongoDB holds structured logs only (reservation attempts, cache hit/miss, hold-expiry events) —
**not** catalog or transactional data; that stays in Postgres. Every request gets a correlation ID
(middleware, generated or propagated from an incoming header) that threads through every log entry
for that request's lifecycle, including anything the expiry job or the confirm webhook writes on
its behalf.

## API design

- REST only — no GraphQL, no tRPC. (Decided deliberately; see solution doc for why. Don't revisit
  as a style preference — a future change needs a genuine new multi-consumer or type-safety need.)
- Type-safety across the network boundary comes from **OpenAPI/Swagger** (`@nestjs/swagger`,
  generated from DTOs) as the contract — the frontend generates its typed client from this spec.
  Keep DTOs decorated properly so the generated spec stays accurate; this is load-bearing, not
  optional polish.
- Reservation creation requires a client-supplied **idempotency key** — must be honored (dedupe
  on it) to prevent double-decrement on retry/double-click.
- List endpoints (events) use **cursor-based pagination**, not offset/page.
- Real-time availability updates go over WebSocket (Redis Pub/Sub → NestJS WS Gateway), layered on
  top of REST — REST still handles every command (create/confirm/cancel).

## Testing

**Jest** (NestJS's default, already scaffolded) — not Vitest. Decided deliberately to minimize
tooling friction so effort goes into writing good tests for the things that actually matter here:
the atomic decrement under concurrency, the hold-expiry/confirm race guard, idempotency handling.
Automated testing discipline is an explicitly identified gap this project exists partly to close —
don't skip test coverage on the concurrency-sensitive paths to save time.

## Load testing

k6 (not Artillery/autocannon/Gatling/Locust — see solution doc for why). Exact scenario (virtual
user count, read/write mix, thresholds) is to be finalized when load testing is actually
implemented, not before — don't invent numbers now.

## Explicit non-goals for v1

- Named/seated tickets (seat maps, per-seat locking) — v2 candidate, not a small addition.
- `@nestjs/observe` or any managed APM/tracing SaaS — the observability layer is hand-built on
  purpose, to demonstrate the pattern, not to outsource it. Fine to mention awareness of it in
  documentation; don't wire it in.
- GCP/Azure-specific tooling — no cloud-provider lock-in assumed; keep infra choices
  provider-agnostic unless a future decision says otherwise.
