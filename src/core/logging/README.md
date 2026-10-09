# core/logging

Structured observability logs — MongoDB. **Logs only, never catalog or transactional data** (that
stays in Postgres; see `core/database`). This is the one deliberate use of MongoDB in the project,
chosen because logs are high-write-volume, schema-flexible per event type, effectively append-only,
and never joined relationally — a genuine fit for a document store, not an arbitrary one.

Contains:
- Correlation-ID middleware — generates or propagates an ID per request, so every log entry tied
  to one reservation's lifecycle (hold created → confirmed/expired) can be traced end to end.
- The structured log writer itself (reservation attempts, cache hit/miss, hold-expiry events).

Deliberately hand-built rather than using a managed APM/tracing SaaS (e.g. `@nestjs/observe`) — the
point of this module is to demonstrate the pattern, not outsource it.
