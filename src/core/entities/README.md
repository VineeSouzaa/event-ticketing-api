# core/entities

Shared domain entities (TypeORM): `Event`, `TicketTier`. These are referenced by more than one
feature slice (`availability` reads `TicketTier.available`, `reservations` writes to it,
`events` owns the `Event`/`TicketTier` lifecycle) — that's exactly why they live here instead of
inside any one slice.

`Reservation` is **not** here — it belongs to `reservations/` alone, since nothing outside that
slice needs to reference it directly.
