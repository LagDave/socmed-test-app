---
name: code-constitution
description: >
  Enforces code architecture patterns across the full stack — backend (TypeScript + Express + Knex +
  PostgreSQL, in src/) and frontend (React 19 + Vite + TypeScript SPA, in frontend/). Use this skill
  whenever writing, modifying, or reviewing code: controllers, routes, services, models, middleware,
  migrations, API endpoints, and database queries on the backend; React components, hooks, contexts,
  the api/ client layer, state management, and pages on the frontend. Triggers on creating endpoints or
  components, adding business logic, writing queries or data-fetching, building middleware or hooks,
  refactoring either tree, or reviewing PRs. Also applies when the user asks to "follow our conventions,"
  "check standards," or "verify architecture." The document is a numbered instrument — Parts → Sections →
  Articles with stable §N.M IDs — so any violation can be cited precisely (e.g. "Section 7, Article 4").
---

# Code Constitution

This is the architecture contract for the whole Alloro codebase — **backend** (TypeScript + Express + Knex + PostgreSQL, under `src/`) and **frontend** (React 19 + Vite + TypeScript SPA, under `frontend/`). It applies both while writing code and as a verification pass after. These are not suggestions.

## Structure of this document

The Constitution is organized as **Parts → Sections → Articles**. Every Article has a stable identifier, **§N.M** (Section N, Article M) — e.g. **§7.4** is Section 7, Article 4. These identifiers are the contract: when new Articles are needed they are **appended**; Articles are **never renumbered**, so a citation written today stays valid.

- **Part I — Shared Principles** (Sections 1–5): apply to both stacks and mean the same thing on each side.
- **Part II — Backend** (Sections 6–11): `src/`, the Express/Knex/PostgreSQL stack.
- **Part III — Frontend** (Sections 12–17): `frontend/`, the React/Vite SPA.
- **Part IV — Verification** (Sections 18–19): the mechanized checks and the review checklist.

Read the Part that matches what you are editing; if a change spans both stacks, Parts I + the relevant stack Part apply.

## Enforcement Protocol — read before using this document

When you write or review code under this skill, **you must cite the Constitution on every violation.** Do not say "this is messy" — say which Article it breaks. Use this format:

> ⚠️ **Constitution violation — §N.M (Section N, Article M: _Title_)**
> **Rule:** "_the Article's rule statement, quoted verbatim_"
> **Where:** `path/to/file.ts:line`
> **Issue:** one line — how this code breaks the rule.
> **Fix:** the remedy the Article prescribes.
> **Severity:** must-fix · concern · advisory

A compact inline form is allowed in lists of findings:

`§14.2 — components/Admin/Foo.tsx:88 hand-rolls fetch() with its own Authorization header → route through api/index.ts.`

Rules of citation:

1. **Quote the Article verbatim** so the author sees the exact contract.
2. **Cite the most specific Article.** If a shared principle (Part I) and a stack-specific Article both apply, cite the stack-specific one and may reference the shared one.
3. **Severity:** _must-fix_ = any 🔎-mechanized Article, or a security/correctness Article; _concern_ = structural drift that will compound; _advisory_ = style or judgment. Frontend mechanized Articles are **advisory** until the frontend remediation lands (see §18).
4. **The mechanized checker** (`npm run check:conventions`) prints the same §IDs next to each finding, so manual review and CI speak one language.

Articles marked **🔎** are verified mechanically by `scripts/check-conventions.sh` and gate `--strict` (backend). The same script also runs a set of **Tier A advisory greps** that surface — but never fail — further Articles (see §18). The rest are judgment calls.

---

# Part I — Shared Principles

These five Sections govern both stacks.

## Section 1 — Naming

Names are self-documenting. Reading a filename or call should tell you what it does without opening the file.

### Article 1.1 — Files are named for what they export
**A file is named for its primary export:** `stripeWebhook.ts` not `webhook.ts`, `PatientService.ts` not `service.ts`.

### Article 1.2 — Functions describe the action
**Function names state what they do:** `getPatientsByPractice()` not `getData()`, `sendWelcomeEmail()` not `send()`.

### Article 1.3 — Booleans read as questions
**Boolean identifiers read as questions:** `isActive`, `hasSubscription`, `canEdit` — never `active`, `subscription`, `edit`.

### Article 1.4 — Casing and role suffixes
**PascalCase for types, components, controllers, and services; role suffixes are mandatory where defined** — `Controller`/`Service` on the backend, `use`-prefix for hooks on the frontend. (Stack-specific detail in §6 and §12–13.)

## Section 2 — Structure & Responsibility

### Article 2.1 — One responsibility per file
**A file does one thing.** A file that needs "and" to describe its purpose should be two files.

### Article 2.2 — Functions under ~50 lines
**Keep functions to ~50 lines.** Beyond that, extract named helpers that describe each chunk.

### Article 2.3 — Nesting under 4 levels
**Maximum 3–4 levels of nesting.** Use early returns, guard clauses, or extracted functions to flatten.

### Article 2.4 — File-size tiers and the hard ceiling 🔎
**File size is tiered by role, with a hard ceiling of ~800 lines for any living source file** (past it, decomposition is a must-fix):
- *Single-purpose files* (models, utils, small services, presentational components): **~200–300 lines** target.
- *Orchestration controllers / complex services / page containers*: **up to ~400–700 lines** when one cohesive responsibility.
- *Hard ceiling*: **~800 lines.** Split into `feature-services/` + `feature-utils/` (backend) or hooks + child components + `*.utils.ts` (frontend). Never add to a file already over the ceiling — extract.
- *Historical migrations/seeds*: reported separately; not refactored for size unless the task edits them.

## Section 3 — Error Handling (philosophy)

### Article 3.1 — Every async call is handled
**Every `async` call is wrapped in try/catch or has a `.catch()` handler.** No exceptions.

### Article 3.2 — Never swallow errors
**Never swallow an error.** If you catch it, log it and either re-throw or return a typed error response. A `catch` that returns `undefined` and moves on is a violation.

### Article 3.3 — Errors carry context
**Error messages include context:** what operation was attempted and the key identifiers (userId, patientId, etc.).

### Article 3.4 — No internal leakage to clients
**Never expose stack traces, internal paths, or query details to clients.** Generic message externally; full detail logged internally.

## Section 4 — Code Hygiene

### Article 4.1 — No commented-out code
**Delete commented-out code.** Git has the history.

### Article 4.2 — No magic numbers or strings
**Extract magic values to named constants.** If a value appears in logic, it gets a name that explains it (backend: `config/`).

### Article 4.3 — DRY carefully
**Deduplicate only genuinely-identical concepts.** Coincidental similarity across domains is not duplication; premature abstraction is worse than repetition.

### Article 4.4 — Dependency discipline
**Prefer the standard library and existing utilities before adding a package; audit imports; pin versions in production; run `npm audit`.** Don't pull a 50KB package for one helper.

### Article 4.5 — Type safety: no `any`
**Avoid `any`. Type values explicitly; reach for `unknown` plus a narrow before `any`.** Shared across both stacks: the frontend instance is mechanized as §17.2, and the backend is held to a ratcheted baseline — new code must not add `: any`/`as any`, and the existing count only goes down.

## Section 5 — Security Baseline

### Article 5.1 — No secrets in code
**No secrets, API keys, or credentials in code** — environment variables only, accessed via config.

### Article 5.2 — Never trust client input
**Sanitize and validate all user input before processing.** Guard against SQL injection, XSS, and path traversal on every user-facing input.

### Article 5.3 — Never log sensitive data
**Never log passwords, tokens, or PII.** Redact before logging.

### Article 5.4 — Re-enforce every check server-side
**The client protects nothing.** Every authorization and validation check is authoritative on the server, regardless of what the frontend does.

### Article 5.5 — Tenant data is isolated
**Every read or write of tenant-owned data is scoped to the caller's tenant (organization/location), derived from server-side context — never from client input.** A query that can return another tenant's rows is a data-leak vulnerability, not a bug. Enforced on the backend by §11.7.

### Article 5.6 — Validate configuration at startup
**Validate required configuration and environment variables at startup and fail fast with a clear message.** Never discover a missing or malformed config value at request time.

---

# Part II — Backend (`src/` · TypeScript + Express + Knex + PostgreSQL)

## Section 6 — Reference & Folder Structure

### Article 6.1 — Mirror the reference implementation
**When in doubt, mirror `src/controllers/gbp-automation/`** — the certified-clean domain: thin controllers, business logic in `feature-services/`, helpers and typed errors in `feature-utils/`, every DB call through `models/`, the canonical `{ success, data, error }` handling. Copy its structure for any new domain.

### Article 6.2 — Every file has a home
**Place each file in the correct top-level folder:**

```
src/
  agents/        → AI agent logic
  auth/          → Authentication logic
  config/        → App configuration, env vars, named constants
  controllers/   → Business logic, nested by domain (e.g. controllers/admin/auth/)
  database/      → migrations/, seeds/, config.ts, connection.ts
  emails/        → Email templates and sending logic
  lib/           → Shared libraries
  middleware/    → Express middleware (auth, validation, rate limiting, errors)
  models/        → Knex database queries — ALL DB access goes through here
  routes/        → Thin route definitions only
  services/      → Top-level shared services
  utils/         → Reusable pure utilities
  validation/    → Input validation schemas
  workers/       → Background jobs (BullMQ)
  index.ts       → Entry point
```

### Article 6.3 — In-domain nesting uses `feature-` prefixes
**Domain-specific code nests under `feature-services/` (business logic) and `feature-utils/` (helpers, response builders, typed errors).** Do **not** create bare `services/` or `utils/` folders inside a domain — those names are reserved for the top-level `src/services/` and `src/utils/`.

```
controllers/gbp-automation/
  GbpAutomationController.ts        → thin orchestration
  feature-services/
    GbpReviewReplyService.ts        → business logic
  feature-utils/
    controllerResponses.ts          → ok() / fail() / handleGbpError()
    GbpAutomationError.ts           → typed domain error
```

## Section 7 — Data Flow & Layering

### Article 7.1 — The chain is strict
**Routes → Controllers → Services → Models.** Each layer talks only to the next.

### Article 7.2 — Routes are thin
**Routes define HTTP method/path, apply middleware, call the controller, and return — no business logic.**

```typescript
router.use(authenticateToken, rbacMiddleware, locationScopeMiddleware);

router.get("/readiness", GbpAutomationController.getReadiness);
router.get("/work-items", GbpAutomationController.listWorkItems);
```

### Article 7.3 — Controllers orchestrate, never touch the DB
**Controllers receive validated input, coordinate services, and shape the response. No business logic, no DB access.**

```typescript
static async getReadiness(req: Request, res: Response): Promise<Response> {
  try {
    const ctx = clientContext(req);
    const readiness = await GbpReadinessService.getLocationReadiness(
      ctx.organizationId,
      ctx.locationId
    );
    return ok(res, readiness);
  } catch (error) {
    return handleGbpError(res, error);
  }
}
```

### Article 7.4 — All database access lives in `models/` 🔎
**Every Knex query lives in a model file. No inline `db()`/SQL in routes, controllers, or services.** If you are writing a query outside `models/`, stop and move it.

```typescript
static async ensureForReviews(reviews: IReview[]): Promise<Map<string, IGbpReviewInsight>> {
  const existing = await GbpReviewInsightModel.findByReviewIds(reviews.map((r) => r.id));
  // ...classify and upsert through the model — never an inline db() call
}
```

## Section 8 — Response & Error Contracts

### Article 8.1 — The two response shapes
**Every endpoint returns exactly one of these — no variations:**

```typescript
// Success
{ success: true, data: { /* payload */ }, error: null }

// Error
{ success: false, data: null, error: { code: "MACHINE_CODE", message: "Human-readable", details: null } }
```

### Article 8.2 — Use thin response builders
**Don't hand-roll responses per handler.** Each domain exposes builders in `feature-utils/`, copied from `gbp-automation/feature-utils/controllerResponses.ts`:

```typescript
export function ok(res: Response, data: unknown, status = 200): Response {
  return res.status(status).json({ success: true, data, error: null });
}

function fail(res: Response, status: number, code: string, message: string, details: unknown = null): Response {
  return res.status(status).json({ success: false, data: null, error: { code, message, details } });
}
```

### Article 8.3 — Typed domain error + centralized status mapping
**Carry a machine code on a typed error; map error→HTTP status in one handler, not scattered `res.status()` calls.**

```typescript
export class GbpAutomationError extends Error {
  constructor(public code: string, message: string, public details: Record<string, unknown> | null = null) {
    super(message);
  }
}

export function handleGbpError(res: Response, error: unknown): Response {
  if (error instanceof GbpAutomationError) {
    let status = 400;
    if (error.code.includes("NOT_FOUND")) status = 404;
    if (error.code.includes("ACCESS_DENIED")) status = 403;
    if (error.code.includes("RECONNECT_REQUIRED")) status = 401;
    return fail(res, status, error.code, error.message, error.details);
  }
  return fail(res, 500, "GBP_AUTOMATION_ERROR", "GBP automation failed.");
}
```

### Article 8.4 — Correct HTTP status codes
**Use the right code:** `200` success · `201` created · `400` bad request/validation · `401` unauthenticated · `403` unauthorized · `404` not found · `500` server error.

## Section 9 — Logging

### Article 9.1 — Pino only, no `console.*` 🔎
**No `console.log` in production code — use the Pino logger instance** (`pino-http` for request logging).

### Article 9.2 — Correct log levels
**`error`** failures/exceptions · **`warn`** recoverable issues, rate-limit hits · **`info`** key operations (user created, payment processed) · **`debug`** developer-only, never in production.

### Article 9.3 — Include request context
**Every log entry includes the route, userId, and relevant entity IDs.**

## Section 10 — Database (Knex + PostgreSQL)

### Article 10.1 — Parameterized queries only
**Use the Knex query builder; never concatenate strings into SQL.**

### Article 10.2 — Avoid `knex.raw()`
**Avoid `knex.raw()`; if unavoidable, parameterize:** `knex.raw('... WHERE id = ?', [userId])`.

### Article 10.3 — Schema changes go through migrations
**All schema changes are migrations in `database/migrations/`; never run manual DDL.** Reference/test data lives in `database/seeds/`.

### Article 10.4 — Index what you filter or join on
**If a query filters (`WHERE status = ?`) or joins (`ON user_id`), there is an index for it.**

### Article 10.5 — Transactions for multi-table writes
**Any operation writing to multiple tables runs in a transaction** — if one write fails, all roll back.

### Article 10.6 — Connection pooling is managed centrally
**Knex manages pooling via `database/connection.ts`. Never open/close connections per query.**

## Section 11 — API & Backend Security

### Article 11.1 — Auth middleware on every protected route 🔎
**Auth middleware on every protected route. No exceptions, no "add it later."** (The checker lists route files with no inline auth reference as advisory — public webhooks/forms are legitimate exceptions to confirm.)

### Article 11.2 — Validation at the boundary
**Input validation happens at the route level via schemas from `validation/` applied as middleware. Once data reaches the controller, it is trusted.**

### Article 11.3 — Rate-limit public endpoints
**Rate limiting on all public-facing endpoints** (login, signup, password reset, API). Failed auth attempts are rate-limited and logged (IP, timestamp, route).

### Article 11.4 — Transport & headers
**CORS configured explicitly (no wildcard `*` in production); Helmet enabled; CSRF protection on state-changing endpoints (POST/PUT/DELETE).**

### Article 11.5 — Credentials & tokens
**Password hashing with bcrypt, ≥10 salt rounds. JWTs short-expiry; httpOnly cookies preferred over localStorage.**

### Article 11.6 — Standard pagination
**All list endpoints paginate with the same shape:** `{ page, limit, total, totalPages }`.

### Article 11.7 — Enforce tenant scope in `models/`
**Every model query against a tenant-scoped table filters by the organization/location from server context, passed as a required argument — not an optional filter a caller may forget.** This is the backend enforcement of §5.5. (Mechanized only as a coarse heuristic — model files that query without a tenant-column reference are surfaced for review; it is a backstop, not proof. Strict promotion is pending a curated tenant-table list; until then it is advisory. Pair with §5.5 review and §20.2 tests.)

---

# Part III — Frontend (`frontend/` · React 19 + Vite + TypeScript SPA)

Strict mode (`tsconfig.app.json` `strict: true`) and ESLint (`typescript-eslint` + `react-hooks`) are on; honor them. These rules are derived from the parts of the codebase that already work — codify them, don't reinvent.

## Section 12 — Reference & Folder Structure

### Article 12.1 — Mirror the reference triad
**When in doubt, mirror the `frontend/src/api/` + React Query + feature-folder triad.** The shared HTTP client is `frontend/src/api/index.ts` (`apiGet/apiPost/apiPatch/apiPut/apiDelete`) — the *only* place that reads the JWT and sets `Authorization` (`getCommonHeaders()`). A domain file like `api/minds.ts` is a thin set of typed functions over it. Copy it.

### Article 12.2 — Every file has a home
**Place each file correctly:**

```
frontend/src/
  api/        → one file per backend domain; the ONLY layer that calls the HTTP client
  components/ → reusable + feature components, nested by FEATURE FOLDER
  contexts/   → React context objects (.ts) + their providers (.tsx)
  hooks/      → shared hooks; hooks/queries/ holds the React Query hooks
  lib/        → shared singletons (toast, query client, http helpers)
  pages/      → route-level screens (one per route)
  stores/     → Zustand stores (client-only state) — sparingly
  types/      → shared TypeScript types
  utils/      → pure, framework-free helpers
```

### Article 12.3 — Feature folders, not flat dumps
**Group components by feature** (`components/Admin/identity/`, `components/Admin/posts/`, …). A directory accreting 80+ files in one level is the anti-pattern — the frontend analog of the backend's `feature-services/`/`feature-utils/` nesting.

### Article 12.4 — Enforce import boundaries
**Respect import boundaries:** `pages/` are not imported by other `pages/`; `components/` do not import from `pages/`; `api/` does not import from `components/` or `pages/`. The frontend analog of the backend layering rule (§7.1), enforced as an advisory baseline (a grep backstop today; dependency-cruiser / eslint-boundaries when configured).

## Section 13 — Size & Structure

### Article 13.1 — File-size tiers and hard ceiling 🔎
**Same tiers as §2.4, adjusted for JSX verbosity, with an ~800-line hard ceiling for any `.ts`/`.tsx`.** Past it, decompose: pull data-fetching into a `use<Feature>()` hook, pure helpers into a sibling `*.utils.ts`, sub-views into child components. A multi-thousand-line component is never acceptable.

### Article 13.2 — Small functions, lean components
**Max ~50 lines per component function/handler. A component carrying dozens of `useState`/`useEffect` is logic that belongs in a hook.**

### Article 13.3 — One responsibility per file
**A component renders; a hook owns logic; an `api/` file talks to one backend domain.**

## Section 14 — Data Flow

### Article 14.1 — The chain
**Component → hook (React Query / custom) → `api/` client → backend.**

### Article 14.2 — No raw `fetch`/`axios` outside the client 🔎
**Components and domain files never call `fetch`/`axios` directly or hand-roll an `Authorization` header.** Route everything through `api/index.ts`. (The biggest current drift — files that bypass the client re-implement auth and error parsing.)

### Article 14.3 — Data-fetching lives in a hook
**Data-fetching belongs in a `use<Feature>()` hook, not inline in the component body.**

## Section 15 — State Management

### Article 15.1 — Server state is React Query
**Anything fetched from the API is React Query state. Don't mirror it into `useState`.**

### Article 15.2 — UI state is Context
**UI / session / cross-cutting state lives in Context.** The `.ts` context-object + `.tsx` provider split is intentional (it keeps fast-refresh working) — follow it, don't "fix" it.

### Article 15.3 — Zustand sparingly
**Use Zustand only for client-only ephemeral domain state that is awkward in Context.**

### Article 15.4 — No fourth state system
**Do not introduce another state-management library.**

## Section 16 — Error Handling

### Article 16.1 — One error contract, end to end
**The `api/` layer unwraps `{ success, data, error }` and throws an `Error` carrying `error.code`/`message` on `success: false`; React Query surfaces it; the component renders an error state or fires a toast.** Do not let some helpers return `{ successful: false }`, some return `undefined`, and some throw.

### Article 16.2 — Never swallow
**No `catch (e) { console.log(e) }` that returns `undefined` and leaves the UI showing "Cannot read properties of undefined."** If you catch, surface it (toast, error boundary, or rethrow).

### Article 16.3 — Use the shared toast
**Surface errors through `lib/toast`, not ad-hoc `alert()`/`console`.**

## Section 17 — Hygiene & Security

### Article 17.1 — No `console.*` in shipped code 🔎
**Remove `console.*` before merge (or route through a thin logger).** It is noise and can leak data in the browser.

### Article 17.2 — No `any` 🔎
**No `: any` or `as any`.** Type API responses in `types/` and use them; reach for `unknown` + a narrow before an `any`.

### Article 17.3 — No secrets in the bundle
**Only `VITE_`-prefixed public config is shipped.** Anything sensitive stays server-side.

### Article 17.4 — Avoid `dangerouslySetInnerHTML`
**Avoid `dangerouslySetInnerHTML`; if unavoidable, sanitize the input first.**

### Article 17.5 — JWT through one path only
**Read the JWT only through the client's `getCommonHeaders` path.** Don't scatter `localStorage.getItem("auth_token")` across components.

---

# Part IV — Verification

## Section 18 — Mechanized Checks

Run `npm run check:all` — it chains the bash detector (`check:conventions` → `scripts/check-conventions.sh`), ESLint (root `src/` + `frontend/`), and dependency-cruiser (backend layering). The detector scans both `src/` and `frontend/src/` and prints the §ID next to each finding. `npm run check:conventions --strict` exits non-zero on backend violations and is the **CI gate**; ESLint and dependency-cruiser run as **advisory baselines** (warn-level, ratcheted against a frozen baseline count, so review only has to catch *new* violations). **Frontend detector checks are advisory until the frontend remediation lands** (they do not fail `--strict` yet). See `plans/06152026-constitution-mechanization`.

**Bash detector — `check:conventions`, core checks (strict on backend size/console/db; the frontend mirror and the `(advisory)` rows do not fail `--strict`):**

| Check | Article | Tree |
|---|---|---|
| File over the ~800 hard ceiling | §2.4 / §13.1 | both |
| `console.*` in production code | §9.1 (BE) / §17.1 (FE) | both |
| `db()` outside `models/` | §7.4 | backend |
| Raw `fetch`/`axios` outside `api/index.ts` | §14.2 | frontend |
| `: any` / `as any` | §17.2 | frontend |
| Route file with no inline auth (advisory) | §11.1 | backend |
| Migration/seed over ceiling (advisory) | §10.3 | backend |

**Bash detector — Tier A quick greps (same script, always advisory — never fail `--strict`):**

| Check | Article | Tree |
|---|---|---|
| `dangerouslySetInnerHTML` | §17.4 | frontend |
| JWT/token read outside the api client | §17.5 | frontend |
| `process.env` in the FE bundle (use `VITE_`) | §17.3 | frontend |
| Stray client-state libraries in FE deps | §15.4 | frontend |
| `.raw(` outside `models/` | §10.2 | backend |
| Possible hardcoded secret literals | §5.1 | backend |
| Focused/skipped tests (`.only`/`.skip`/`xit`/`xdescribe`) | §20.3 | both |
| Frontend import-boundary breaches (components←pages, api←components) | §12.4 | frontend |
| Models querying without a tenant-scope column (heuristic) | §11.7 | backend |

**ESLint + dependency-cruiser — advisory baselines (`npm run lint`, `npm run depcruise`):**

| Check | Article | Tree |
|---|---|---|
| ESLint `no-explicit-any` | §17.2 | both |
| ESLint `max-lines-per-function` | §2.2 / §13.2 | both |
| ESLint `max-depth` | §2.3 | both |
| dependency-cruiser layering | §7.1–§7.4 | backend |

Run `npm run audit:constitution` for the full, untruncated list of every existing violation across both trees — the refactoring backlog. It is advisory and never gates CI; CI stays on `check:conventions --strict`, which fails only on *new* backend size/console/db violations.

Manual-only Articles (judgment calls — no mechanized check): magic values (§4.2), commented-out code (§4.1), DRY (§4.3), naming (§1, §13.3), response/error contracts (§3, §8, §16), state management (§15.1–§15.3), config validation at startup (§5.6), the tenant-isolation principle (§5.5 — the §11.7 grep is only a heuristic backstop), test coverage (§20.1, §20.2, §20.4), worker discipline (§21), and the data-flow Articles the layering check doesn't reach (§14.1, §14.3). Cite these from review, not the checker.

## Section 19 — Verification Checklist

After writing or modifying code, run the half that applies. Cite the §ID for any item that fails (see Enforcement Protocol).

### Backend
- [ ] 🔎 §2.4 File within its size tier (~300 single-purpose, ~800 ceiling)?
- [ ] §2.2 Functions under ~50 lines? §2.3 Nesting under 4 levels?
- [ ] §6.2 File in the correct folder? §6.3 In-domain code under `feature-services/`/`feature-utils/`?
- [ ] §7.1 Data flow Routes → Controllers → Services → Models? §7.2 No business logic in routes?
- [ ] 🔎 §7.4 No DB queries outside `models/`?
- [ ] §3.1 Error handling on every async call? §8.1 `{ success, data, error }` shape?
- [ ] 🔎 §9.1 No `console.*` — using Pino?
- [ ] §5.1 No hardcoded secrets? §4.2 No magic values?
- [ ] §11.2 Input validated/sanitized at the boundary?
- [ ] 🔎 §11.1 Auth middleware on protected routes?
- [ ] §1 Naming conventions followed?
- [ ] §11.7 Tenant scope enforced in models? §5.5 No query can return another tenant's rows?
- [ ] §20.1 Tests exist and mirror the unit? §20.2 Contract, error paths, and tenant scope covered?
- [ ] §21 Workers idempotent, retried with a dead-letter path, calling services (if this touched `workers/`)?
- [ ] §4.1 No commented-out code? §10.5 Transactions for multi-table writes?

### Frontend
- [ ] 🔎 §13.1 File within its size tier (~300 single-purpose, ~800 ceiling)?
- [ ] 🔎 §14.2 No raw `fetch`/`axios` outside `api/index.ts`?
- [ ] 🔎 §17.1 No `console.*` in shipped code?
- [ ] 🔎 §17.2 No `: any` / `as any`?
- [ ] §13.2 Lean component (not dozens of `useState`/`useEffect`)? §14.3 Data-fetching in a hook?
- [ ] §15.1 Server state via React Query, §15.2 UI state via Context, §15.3 Zustand only when needed?
- [ ] §16.1 Errors surfaced through the one contract, §16.2 never swallowed?
- [ ] §12.3 Component in a feature folder, not a flat dump?
- [ ] §1/§13.3 Naming followed (PascalCase components, `use`-prefixed hooks, boolean-as-question)?
- [ ] §20.3 No `.only`/skipped tests? §12.4 Import boundaries respected?
- [ ] §4.1 No commented-out code? §4.2 No magic values?

---

# Part V — Testing & Operability

Appended after Part IV by the never-renumber rule. Two Sections: automated tests (the code-level proof) and background-job discipline.

## Section 20 — Testing

### Article 20.1 — Tests exist and mirror the unit
**Every model and service has tests, and a test file mirrors the path of the unit it covers** (`x.ts` → `x.test.ts` or `__tests__/x.test.ts`). Tests run on `vitest`.

### Article 20.2 — Cover the contract, the failures, and the tenant scope
**Tests cover the `{ success, data, error }` contract, the error/throw paths (not only the happy path), and — for tenant-scoped data — that one tenant cannot read another's rows.** The §11.7 isolation rule is proven here, not assumed.

### Article 20.3 — No focused or skipped tests merged
**No `.only`, `describe.skip`/`it.skip`/`test.skip`, `xit`, or `xdescribe` reaches the main branch** — they silently disable coverage. (Greppable; advisory Tier A.)

### Article 20.4 — Test data is synthetic
**Tests build their data via factories or seeds; never run against production data or real PII.**

### Article 20.5 — Every executed plan ships a passing acceptance artifact
**Every plan executed via `-x`/`-i` produces a `test.html` + `test-results.json` acceptance checklist (Layer 2 — behavioral validation against the running app), and `-d` cannot finalize until it passes or each failure is waived with a reason.** See the `test.html` convention in `CLAUDE.md`. This is behavioral validation and does **not** replace the automated tests in §20.1–§20.4.

## Section 21 — Background Jobs & Workers

### Article 21.1 — Jobs are idempotent
**A job may run more than once (retries, at-least-once delivery); design every job so a repeat run is safe** — guard with idempotency keys or upserts.

### Article 21.2 — Retries with backoff and a dead-letter path
**Configure bounded retries with backoff; route exhausted jobs to a dead-letter queue for inspection — never silently drop a failed job.**

### Article 21.3 — Jobs call services, not their own logic
**A worker orchestrates and calls the same `services/` the request path uses.** No business logic that diverges from the service layer.

### Article 21.4 — Job failures are logged with context
**Every job failure logs the job name, payload identifiers, attempt count, and the error — through Pino (§9), never `console`.**
