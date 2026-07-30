---
turn: 02
date: 07302026
role: contributor
by: kylie
branch: kylie/reactions-changed-icon → dev
spec: plans/07292026-20-reactions-changed-icon/spec.html
verdict: reply
status: addressed-pending-review
addresses: [01]
---

# Contributor reply — reactions changed icon + summary layout (PR #19)

All five findings actioned. Branch restacked on `origin/dev` (`b7ba00b`); history rewritten, force-pushed with `--force-with-lease`.

## Commits

| SHA | Subject |
|-----|---------|
| `e41e059` | feat: settle reaction stickers on Facebook-equivalent emoji (rebased from `ef44831`) |
| `271bb61` | feat: right-align reaction cluster with total count (rebased from `e014e7e`) |
| `1a86876` | docs: add reviewer needs-changes trace for reactions icons (PR #19) (rebased from `646a16f`) |
| `68033cc` | fix: drop dead ReactionIcon props and surface message reaction errors |

Dropped in the restack: `13ab6d3` (plan 18 comment/reply action icons) — already on `dev` via PR #17's feature-batch merge, and byte-identical there for `PostActionRow.tsx`, `FeedPage.tsx`, `PostDetailPage.tsx`, and the plan 18 spec/acceptance artifacts. `dev`'s copy is strictly newer (it also carries plan 18's own review trace), so re-carrying it added nothing.

## Per-finding response

| ID | Severity | Response | Where |
|----|----------|----------|-------|
| R1 | must-fix | fix | Rebased `--onto origin/dev`; messenger fixes preserved (verified below) |
| R2 | concern | fix | `spec.html` Rev 8 — What + Must/Must Not rewritten to settled stickers |
| R3 | concern | fix | Plans 17/18 dropped from the unique diff; now plan 20+24 only |
| R4 | advisory | fix | `59f7dec` — dead props removed; Messages catch surfaces the error |
| R5 | advisory | fix | `actions` left-slot composition kept through both conflict resolves |

### R1 — rebase onto `dev`, no messenger regression

Rebased with `git rebase --onto origin/dev 13ab6d3`. Only `plans/README.md` conflicted (add/add on the plan table), twice — resolved by keeping `dev`'s row 19 wording and appending rows 20 and 24.

**PR #24 landed on `dev` mid-fix**, so the branch was rebased a second time onto `b7ba00b`. That added `CHANGELOG.md` conflicts because plan 21 had claimed `0.1.11`, the version plan 20 was using. Renumbered rather than argued: plan 21 keeps `0.1.11`, plan 20 → `0.1.12`, plan 24 → `0.1.13`, and `package.json` / `package-lock.json` now say `0.1.13`. `frontend/src/index.css` and `MessagesPage.tsx` both auto-merged against PR #24's soft-page cleanup — the reaction CSS class rename and the sticker wiring are the only changes this PR still makes to them.

`frontend/src/pages/MessagesPage.tsx` auto-merged cleanly and **kept every PR #16 resolution** on `dev`:

- `generationRef` thread-switch gating on load, poll, send, upload, unsend, and `loadEarlier`
- `hasMore` + `loadEarlier()` pagination and the "Load earlier messages" control
- `mergeById()` poll merge and `stickToBottomRef` scroll behavior

The only change this PR makes to that file is the reaction sticker wiring (local `EMOJI_OPTIONS` → shared `REACTION_OPTIONS` + `ReactionIcon`) plus the R4 error surfacing. Backend messenger files (`src/services/MessageService.ts`, `src/models/ConversationModel.ts`, `src/utils/dbErrors.ts`) are untouched — they do not appear in the diff at all.

Worth recording, because it is exactly the risk R1 named: a **merge** rather than a rebase would have reverted all of the above. Before the restack, `git diff origin/dev..646a16f` showed the pre-fix `MessagesPage.tsx` deleting the generation gating and pagination, plus `dev`'s navbar changelog entries and `dropdown-menu.tsx`.

### R2 — spec 20 Constraints

Rev 8 appended (Rev 0–7 untouched, not renumbered). Rewritten to match shipped code:

- **What:** one shared `ReactionIcon` over the locked Unicode map; selected state is a ring, not a fill
- **Must:** `lib/reactionOptions.ts` is the single source of truth; ring marks the viewer's reaction
- **Must Not:** added bans on per-type color classes, filled/muted variants, and glyph literals outside the map; the old "no sticker emoji" ban became "no icon packs or image/SVG sticker assets — Unicode text glyphs only"

The `Context` section's branch note still describes the original exec base (`kylie/comment-action-icons` tip). Left as-is: it is a historical planning note, and Rev 8 records the restack onto `dev`.

### R3 — PR scope

`git diff origin/dev...HEAD --stat` is now 22 files / +1445 −193, and every file belongs to plan 20 or 24:

```
 CHANGELOG.md                                       |  16 ++
 frontend/src/components/PostActionRow.tsx          |  61 +++--
 frontend/src/components/ReactionBar.tsx            | 266 ++++++++++---------
 frontend/src/components/ReactionIcon.tsx           |  18 ++
 frontend/src/index.css                             |   6 +-
 frontend/src/lib/reactionOptions.ts                |  21 ++
 frontend/src/pages/MessagesPage.tsx                |  60 +++--
 frontend/src/pages/PostDetailPage.tsx              |  25 +-
 package-lock.json                                  |   4 +-
 package.json                                       |   2 +-
 plans/07292026-20-reactions-changed-icon/*          | spec, acceptance, review trace
 plans/07292026-24-reaction-summary-layout/*         | spec, acceptance
 plans/README.md                                    |   2 +
```

Gone from the diff: `AppShell.tsx`, `ui/dropdown-menu.tsx`, `FeedPage.tsx`, plan 17/18/19 folders, the migration files, and all `src/` backend churn.

### R4 — dead prop, silent catch

- `ReactionIcon`: removed `filled?: boolean` **and** `muted?: boolean`. Neither had a call site anywhere in `frontend/src` — both were leftovers from the lucide/per-type-color attempt (Rev 2–4).
- `MessageReactions`: the bare `catch { /* keep prior summary */ }` became `onError(...)`, wired to `ThreadView`'s existing `setError`. This is the pattern `onSend`, `onImage`, and `onUnsend` already use, and it renders in the error line already present at the bottom of the thread — no new error surface, and no `console.*` added (§16.2, §17.1).

Messages still has reaction UI after both rebases, so no re-wire was needed — the sticker wiring and the error fix both survived intact.

Acceptance item **T4a** added to plan 20's `test-results.json` for the new failure path, at `pending` — it needs a browser or `-tw` run to prove, so the artifact's roll-up went from `Passed` back to `Pending` rather than claiming a pass I did not observe. Flagging that openly since it is the one thing in this turn that is not green.

`frontend/src/components/ReactionBar.tsx:120` still has a `console.error` on reaction failure. That predates this PR (it is on `dev` at the same line) and there is no toast/logger in this project yet, so fixing it properly means introducing `lib/toast` — out of scope here (§17.1 noted, no drive-by refactor).

### R5 — `cloneElement` actions injection

Composition preserved exactly. `PostActionRow` clones its `ReactionBar` child with `actions: commentControl` so the comment icon lands in the bar's **left** slot beside the trigger; `PostDetailPage` passes `ReplyActionButton` through `actions` on parent comments. The sibling-after-bar layout from `dev` was **not** restored.

## Verification

| Gate | Result |
|------|--------|
| `npm run typecheck` (backend + frontend) | clean |
| `npm --prefix frontend run lint` (oxlint) | clean — 3 pre-existing warnings, all on `dev`, none in files this PR touches for those rules |
| Automated tests | none in this repo (no test script) |
| Acceptance | plan 24 `Passed`; plan 20 `Pending` on new T4a |

## Open for reviewer

1. T4a acceptance item is `pending` — needs a browser or `-tw` run.
2. Changelog versions were renumbered (plan 20 → `0.1.12`, plan 24 → `0.1.13`) to give way to plan 21's `0.1.11` on `dev`. Flagging in case anything downstream pins a version.
3. Stacking still applies as noted in turn 01. PR #24 has now landed and was absorbed; **#25** / **#26** (Messages realtime / friend picker) still touch `MessagesPage.tsx`, so this sticker wiring will need re-application against whichever Messages tip lands next. Merging this one promptly keeps that cheap.
