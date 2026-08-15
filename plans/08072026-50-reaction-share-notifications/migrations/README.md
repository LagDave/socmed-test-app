# Migration scaffold — reaction and share notifications

At execution, create one new idempotent Knex migration under `database/migrations/` using the timestamp at creation time, named `*_notification_reaction_activity.ts`.

It must:

- add nullable `notifications.reaction_emoji`, constrained to the existing `reaction_emoji` values where PostgreSQL supports that enum;
- create partial unique indexes for `reaction_on_post`, `reaction_on_comment`, and `reaction_on_photo`, scoped by recipient, actor, type, and the applicable target column;
- provide a safe, matching down migration that removes only this feature’s indexes and column;
- use `hasColumn`/`IF EXISTS` guards consistent with the repository’s recent migrations.

The project currently targets PostgreSQL through Knex; no other database engine migration is required.
