# Migrations — messages status icons

## PostgreSQL

**File (to be created at execution):** `database/migrations/20260731140000_message_delivered_at.ts`

**Change:** add nullable `delivered_at` (`timestamptz`) to `messages`.

**Why:** “Delivered” requires a durable record that the peer’s client received the message (socket ack or thread fetch). “Seen” reuses existing conversation read watermarks (`user_a_last_read_at` / `user_b_last_read_at`) — no new columns for read state.

**Rollback:** drop `delivered_at`.
