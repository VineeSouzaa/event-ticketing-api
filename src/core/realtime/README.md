# core/realtime

WebSocket gateway + Redis Pub/Sub subscriber. Pushes availability-changed events to clients
watching an event's page, one logical channel per event, as an addition on top of REST (not a
replacement — REST still handles every command: create/confirm/cancel a reservation).

This is shared infrastructure, not a business feature with its own domain logic — it forwards
whatever `core/cache` publishes when a reservation's state change invalidates/updates the
availability cache. Feature slices trigger the publish; this module only delivers it.
