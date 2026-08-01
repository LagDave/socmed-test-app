# Migrations — edit message

## PostgreSQL

**File (to be created at execution):** `database/migrations/20260801140000_message_edited_at.ts`

**Change:** add nullable `edited_at` (`timestamptz`) to `messages`.

**Why:** Distinguish edited messages for the “(edited)” label and future analytics. Body text is updated in place; `created_at` is unchanged.

**Rollback:** drop `edited_at`.
