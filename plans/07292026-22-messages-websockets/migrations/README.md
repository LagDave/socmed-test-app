# Migrations

Plan **07292026-22-messages-websockets** is **transport-only**.

No database migrations are expected. Plan 17 already owns `conversations`, `messages`, `message_reactions`, and per-user last-read columns.

If execution discovers a schema need, **halt**, append the Revision Log, and do not invent columns silently.