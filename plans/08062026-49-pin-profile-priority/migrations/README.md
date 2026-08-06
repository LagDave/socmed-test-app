# Migration scaffold

Execution will add one PostgreSQL/Knex migration for caller-scoped conversation priority.

Do not reuse the removed 20260804160000_conversation_pins.ts filename. Choose a timestamp later than the current migration ledger during --execute, then verify both fresh and existing-database paths in an isolated runtime.
