# core/cache

Redis client configuration. **Read-performance layer only — never the source of truth.**

Redis serves the hot `availability` read path (so 10,000 concurrent "how many tickets are left?"
requests don't hit Postgres directly) and is invalidated/updated on every successful reservation
state change, which also triggers a Pub/Sub publish picked up by `core/realtime`.

Do not use Redis to decide whether a reservation can be made — that correctness decision belongs
to the atomic conditional update in `core/database`. Conflating the two (using cache to prevent
overselling) is the specific mistake this project is designed to avoid.
