# core

Shared infrastructure and domain concepts. Feature slices (`events/`, `availability/`,
`reservations/`) import from here — **never the reverse, and slices never import each other
directly**. This is the one-directional dependency rule that prevents circular imports between
modules (see root `CLAUDE.md`).

If you're about to make two slices reference each other, the fix is to move the shared piece here,
not to add a `forwardRef()`.

- `entities/` — shared domain entities (Event, TicketTier) used across slices.
- `database/` — Postgres/TypeORM connection and configuration.
- `cache/` — Redis client configuration.
- `logging/` — correlation-ID middleware + structured log writer (MongoDB).
- `realtime/` — WebSocket gateway + Redis Pub/Sub subscriber. Shared infrastructure, not a
  business feature in itself — slices publish to Redis on state change, this module forwards to
  connected clients.
