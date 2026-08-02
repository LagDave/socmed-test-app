# Chat themes migration

## Engine

PostgreSQL only (matches existing messenger stack).

## Intended migration

**File:** `database/migrations/20260801140000_conversation_chat_themes.ts`

**Change:** Add nullable `theme` JSONB column on `conversations` plus audit columns:

| Column | Type | Notes |
|--------|------|-------|
| `theme` | `jsonb` nullable | Validated shape — see spec Data Model |
| `theme_updated_at` | `timestamptz` nullable | Set when theme last changed |
| `theme_updated_by` | `uuid` nullable FK → `users.id` | Participant who applied the theme |

**Default:** `NULL` theme = platform default (current B&W bubble styling).

**Rollback:** Drop the three columns.

## Validation (service layer, not DB)

- `presetId` must be in bundled allow-list **or** `null` with explicit custom color fields
- Custom colors: hex `#RRGGBB` only (no `rgb()`, no CSS injection)
- Custom gradient: exactly two hex stops + optional angle (0–360)
- Reject unknown keys in JSONB payload

## Notes

- Word effects do **not** require schema changes — curated client-side catalog only.
- No new tables unless execution discovers JSONB audit needs isolation (unlikely for 1:1).
