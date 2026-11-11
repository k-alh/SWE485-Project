# Trade-offs

Each decision records the option that was rejected, the cost that was accepted, and the
requirements it serves. An ADR exists for the three decisions that were hard to reverse;
the rest live here.

## D1 — SQLite instead of PostgreSQL

**Rejected:** PostgreSQL from the start.
**Accepted cost:** one writer at a time, no managed backups, and a migration to a real
database before more than a handful of concurrent users. Prisma keeps the schema portable,
but the move is still a piece of work.
**Why:** the project has one deploy target and no operations budget. A single file that
`npm run setup` creates is worth more than a connection string nobody can provision.
**Serves:** RULES scope ceilings, NFR-6.

## D2 — Database sessions instead of JWT

**Rejected:** stateless JWT in a cookie.
**Accepted cost:** a database read on every authenticated request, and a `Session` table
to clean up.
**Why:** sign-out must actually end access. A JWT cannot be revoked without a blocklist,
which is the same table with worse ergonomics.
**Serves:** FR-3, NFR-1. See [ADR 0001](adr/0001-session-cookies-over-jwt.md).

## D3 — Provider switch with an offline mock instead of OpenAI only

**Rejected:** calling OpenAI directly from the extractor.
**Accepted cost:** the mock is rule-based, so it misses formats a language model would
handle, and it needs its own tests. Two providers means two code paths to keep honest.
**Why:** tests and CI must not depend on a key, a network or a bill. The mock makes the
injection test deterministic, and swapping providers stays an environment variable.
**Serves:** FR-9, NFR-3, NFR-4. See [ADR 0002](adr/0002-provider-agnostic-extraction.md).

## D4 — Human approval before publish

**Rejected:** the extractor writing straight into the catalogue.
**Accepted cost:** the admin still reviews and corrects every draft, so extraction saves
typing rather than removing the task.
**Why:** an extractor that publishes is an extractor that can publish a wrong deadline to
every student. A draft makes the failure visible and cheap.
**Serves:** FR-9. See [ADR 0003](adr/0003-draft-review-before-publish.md).

## D5 — Server-side filtering

**Rejected:** fetching every listing once and filtering in the browser.
**Accepted cost:** a request per search term, mitigated by a 250 ms debounce.
**Why:** the client would have to know about archived listings and eligibility rules it
should not be trusted with, and the payload grows with the catalogue.
**Serves:** FR-1, FR-8.

## D6 — Vite + Fastify instead of Next.js

**Rejected:** Next.js with route handlers.
**Accepted cost:** two processes in development, explicit cookie and CORS configuration,
and no server rendering.
**Why:** the interesting rules are domain rules, and they belong in a package both sides
import, not in a framework's server layer. A separate API is also easier to test with
`app.inject()` than a framework request context.
**Serves:** NFR-2, NFR-3.

## D7 — One shared package instead of duplicated types

**Rejected:** types copied into web and API.
**Accepted cost:** `@talea/shared` must be built before the other workspaces, which makes
the root scripts slightly more involved and adds a build-order trap.
**Why:** duplicated rules drift. The pipeline exists once, so a status added in one place
cannot be offered by the UI and refused by the API.
**Serves:** FR-5, NFR-2.

## D8 — Computed deadline status instead of a stored column

**Rejected:** a `status` column updated by a scheduled job.
**Accepted cost:** every read computes the status, and there is no place to hang a
"closing soon" notification later without adding one.
**Why:** a stored status is wrong the moment the clock passes midnight and nothing has run.
Computing it from the deadline and `now` cannot be stale.
**Serves:** FR-6.

## D9 — Unique constraints instead of check-then-insert

**Rejected:** `SELECT` for an existing listing, then `INSERT`.
**Accepted cost:** the route has to recognise a Prisma unique-constraint error and turn it
into a domain error, which is less readable than an explicit check.
**Why:** two admins submitting the same posting at once would both pass a pre-check. The
constraint is the only thing that actually holds.
**Serves:** FR-4, FR-7.

## D10 — 404 instead of 403 for another student's entry

**Rejected:** 403 Forbidden, which is the more literal answer.
**Accepted cost:** a student who mistypes an id gets a slightly misleading message.
**Why:** 403 confirms the id exists. 404 leaks nothing.
**Serves:** FR-10.

## D11 — Browser tests deferred

**Rejected:** Playwright in CI from the first commit.
**Accepted cost:** UI regressions are caught by hand. The API has 19 tests; the screens have
none, and the review log says so.
**Why:** browser installation and flake would have dominated the early CI budget while the
UI was still changing shape. The trade is recorded rather than hidden, and `REVIEW.md`
lists what a browser pass covered.
**Serves:** NFR-3, with the gap stated.
