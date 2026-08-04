# Planned migration reconciliation

The reconciliation carries these PostgreSQL migrations, in this exact order:

1. `20260804170000_message_pins.ts` — one shared pin per message.
2. `20260804180000_message_pin_activities.ts` — shared pin/unpin timeline events.

Execution must inspect the target environment's Knex migration ledger first. The files are immutable history: do not rename, timestamp-shift, or rewrite a migration that has already been recorded. Existing conversations and messages require no backfill; they begin with no shared pins. Private conversation-pin persistence is out of scope and must not be added.
