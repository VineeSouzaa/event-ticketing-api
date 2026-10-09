# events

Vertical slice: event + ticket-tier CRUD. Owns the `Event`/`TicketTier` lifecycle (draft →
published → cancelled) and exposes the listing/detail endpoints (cursor-based pagination on the
list).

Imports from `core/` only (entities, database). Does not import `availability/` or
`reservations/` directly — if this slice ever needs something from them, that's a signal the
shared piece belongs in `core/` instead.
