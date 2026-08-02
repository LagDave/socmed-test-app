# Migrations — Reply to Chat

## Target engine

PostgreSQL (Knex migration in repo root `database/migrations/`).

## Planned change

Add nullable `reply_to_message_id` on `messages`:

- Type: `UUID`
- FK: `messages(id)`
- On delete: `SET NULL` (replies remain; quote shows unavailable if parent row deleted — same as unsent UX)
- Existing rows: `NULL` (not a reply)

## Execution file (created at `-x`)

`database/migrations/YYYYMMDDHHMMSS_message_reply_to.ts`

## Verify

```bash
npm run migrate
```

Run on a database that already has the friends-messenger tables (`20260729140000_friends_messenger.ts`).
