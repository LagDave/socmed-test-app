# Migrations scaffold — plan 17 friends messenger

Target engine for this repo: **PostgreSQL** via Knex (`database/migrations/` in the app tree).

## Intended migration (execute phase)

Create one migration in the **application** tree (not only here), e.g.:

`database/migrations/20260729140000_friends_messenger.ts`

Adjust the timestamp if that ID is already claimed by another stacked PR.

### Tables

1. **conversations** — `user_a`, `user_b` with `user_a < user_b`, unique pair, last-read timestamps per side, `last_message_at`
2. **messages** — conversation FK, sender, nullable `body` / `image_url`, `unsent_at`
3. **message_reactions** — message FK, user FK, emoji, unique `(message_id, user_id)`

This folder holds planning notes only until `--execute` writes the real migration file.
