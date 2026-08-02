# Migrations — 07312026-30-default-message-stickers

## Expected (execute-time)

| Engine | File (suggested) | Change |
|--------|------------------|--------|
| PostgreSQL / Knex | `database/migrations/20260731180000_reaction_emoji_sad_angry.ts` | `ALTER TYPE reaction_emoji ADD VALUE IF NOT EXISTS 'sad'` and `'angry'` (idempotent guards). No change to `message_reactions.emoji` column (plain string + app allow-list). |

## Notes

- `message_reactions` stores emoji as `string`, not the PG enum — backend validation expands via `REACTION_EMOJIS` constant only.
- Post/comment `reactions.emoji` uses native enum `reaction_emoji` — migration required before sad/angry persist on feed surfaces.
- Verify timestamp unused before landing; adjust if another PR claims `20260731180000`.
- Land with `npm run migrate` and confirm existing four reaction rows unchanged.
