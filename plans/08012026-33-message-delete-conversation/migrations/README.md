# Migrations scaffold — Delete Conversation

**Target engines:** PostgreSQL (Knex)

**Proposed migration:** `database/migrations/20260801140000_conversation_hide.ts`

## Up

Add to `conversations`:

- `user_a_hidden_at` — `timestamptz`, nullable
- `user_b_hidden_at` — `timestamptz`, nullable

No new indexes required for v1 (inbox query already filters by participant id).

## Down

Drop both columns.

## Verify before landing

Confirm timestamp `20260801140000` is unused in `database/migrations/`.
