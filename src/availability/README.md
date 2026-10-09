# availability

Vertical slice: the hot read path. Exposes "how many tickets are left in this tier" — the endpoint
this entire project is built to prove can survive concurrent load, via the Redis cache in
`core/cache` sitting in front of Postgres.

Kept as its own slice, separate from `reservations/`, specifically so the cached (read) and
non-cached (write/correctness) responsibilities don't blur into one module. Imports from `core/`
only.
