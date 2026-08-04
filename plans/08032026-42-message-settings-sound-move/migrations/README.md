# Migrations

Plan **08032026-42-message-settings-sound-move** is **frontend-only**.

No database migrations are expected. Notification sound preferences remain in `localStorage` (`socmed.sounds.enabled`, `socmed.sounds.messageId`) — this plan only relocates the UI.

If execution discovers a need for server-persisted message preferences, **halt**, append the Revision Log, and open a separate plan — do not add columns silently.
