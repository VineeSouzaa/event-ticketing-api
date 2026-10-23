# reservations

Vertical slice: the hold → pay / cancel / expire lifecycle (`pending → paid | cancelled | expired`,
all three final; no cancelling after payment in v1). Owns `Reservation` (not shared via
`core/`, since nothing outside this slice references it directly).

Flow: create hold (atomic conditional decrement on `TicketTier.available` via `core/database`) →
structured log written (`core/logging`) → expiry timer started → on payment (simulated
payment-webhook endpoint, marks the reservation `paid`) or on timeout (`reservations.scheduler.ts`),
finalize/release — the two must be mutually guarded (atomic status check) so a last-second payment
can't race the expiry job.

Every successful state change updates the Redis cache and triggers a Pub/Sub publish
(`core/cache` → `core/realtime`). Reservation creation requires a client-supplied idempotency key
— dedupe on it, don't decrement twice for the same client-side retry.

Imports from `core/` only.
