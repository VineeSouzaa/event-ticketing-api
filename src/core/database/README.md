# core/database

PostgreSQL connection/config via TypeORM. This is the system of record for `Event`, `TicketTier`,
and `Reservation` — correctness (never overselling a ticket tier) is guaranteed here through an
atomic, conditional update (decrement `available` only if `available >= quantity requested`, in
one operation), not through the cache layer. See `core/cache/README.md` for why that split matters.

TypeORM was chosen over Prisma specifically because this conditional-update pattern is a natural
fit for TypeORM's QueryBuilder (`.update().set().where()`, reading affected-row-count back), where
Prisma would mostly mean dropping to raw SQL anyway for this exact operation.
