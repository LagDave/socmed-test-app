---
turn: 01
date: 08062026
role: reviewer
by: dave
branch: kylie/photos-centered → dev
spec: plans/08062026-photos-centered/spec.html
verdict: ship-it
status: open
addresses: []
---

# Reviewer turn 01 — ship-it

## Findings

### R1 — advisory — Visual acceptance still pending
A1–A3 and A5 remain `pending` in `test-results.json` (A4 build gate passed). Code review is clean; complete contained visual acceptance before `-d`.

### R2 — advisory — Verification section wording
The Verification section still frames this as a “CSS-only change,” while T1 correctly describes the `PostCard` / embed restructure. Align the wording for parity.

## What's good
Moving standalone media and `SharedPostEmbed` to card-level siblings fixes the avatar-column centering bug. Removing the duplicate `.post-media-stage { width: 100% }` restores the canonical `min(100%, 36rem)` rule. `#photos` navigation with composer autofocus gated to `#comments` matches the locked behavior.

## Merge notes
Coordinate with #72 (`PostCard`, `SharedPostEmbed`, `PostMediaGallery`).
