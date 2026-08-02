# Migrations

Plan **08012026-34-message-notification-sounds** is **frontend-only**.

No database migrations are expected. Sound preference uses `localStorage` (`socmed.sounds.enabled`).

If execution discovers a need for server-persisted preferences, **halt**, append the Revision Log, and open a separate plan — do not add columns silently.
