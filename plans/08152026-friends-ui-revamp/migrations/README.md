# Migration scaffold — PostgreSQL / Knex

This plan introduces one database migration during execution:

- `database/migrations/*_friend_suggestion_indexes.ts` — add the two composite indexes used by the accepted-friendship graph query: `(status, user_a)` and `(status, user_b)`.

No schema columns, tables, or enum values are planned. The migration must include an explicit `down` path that removes only the indexes it creates.
