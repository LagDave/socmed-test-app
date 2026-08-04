# Planned migration reconciliation

The source branch carries these PostgreSQL migrations, in this exact order:

1. `20260804160000_conversation_pins.ts` — private per-user conversation priority.
2. `20260804170000_message_pins.ts` — one shared pin per message.
3. `20260804180000_message_pin_activities.ts` — shared pin/unpin timeline events.

Execution must inspect the target environment's Knex migration ledger first. The files are immutable history: do not rename, timestamp-shift, or rewrite a migration that has already been recorded. Existing conversations and messages require no backfill; they begin unpinned.
