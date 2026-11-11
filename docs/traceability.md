# Traceability

Every requirement points at the code that implements it and the test that proves it.
A requirement without a test row is unfinished work, not a finished requirement.

Test names are the `it(...)` titles, so `npm test` output maps straight back here.

## Functional requirements

| Req | Implementation | Test |
| --- | --- | --- |
| FR-1 Browse catalogue | `apps/api/src/routes/listings.ts:10` (query parsing, filters), `packages/shared/src/schemas.ts` `listingQuerySchema`, `apps/web/src/pages/CataloguePage.tsx` | API: *filters by type and hides archived listings from students* |
| FR-2 Listing detail + eligibility hint | `apps/api/src/routes/listings.ts:51`, `packages/shared/src/domain.ts:119` `eligibilityHint`, `apps/web/src/pages/ListingPage.tsx` | Domain: *is eligible when the student year is listed*, *is not_yet when the student year is absent*, *is unknown when the student has no year* |
| FR-3 Accounts and sessions | `apps/api/src/routes/auth.ts`, `apps/api/src/auth.ts` (`hashPassword`, `startSession`, `endSession`, `getCurrentUser`) | API: *registers a student and returns a session cookie*, *rejects a duplicate email*, *rejects a wrong password with a generic message*, *returns the signed-in user and clears on logout* |
| FR-4 Save a listing, once | `apps/api/src/routes/tracker.ts:51`, unique `(userId, listingId)` in `apps/api/prisma/schema.prisma` | API: *saves a listing as the first pipeline stage*, *refuses to track the same listing twice* |
| FR-5 Guarded pipeline | `packages/shared/src/domain.ts:38` `ALLOWED_TRANSITIONS`, `:60` `assertTransition`, `apps/api/src/routes/tracker.ts:77` | Domain: *allows the forward path saved -> applied -> interview -> offer*, *rejects skipping a stage*, *rejects moving backwards*, *lets any open stage exit to rejected*, *treats rejected as terminal*, *refuses a no-op transition*. API: *refuses to skip a stage*, *walks the pipeline one stage at a time and records history*, *treats rejected as an exit* |
| FR-6 Deadline status computed | `packages/shared/src/domain.ts:106` `deadlineStatus`, `:94` `daysUntil`; deadline serialised as a day in `apps/api/src/services/listings.ts:23` | Domain: *is open when the deadline is well ahead*, *is closing soon inside the seven day window*, *is closed the day after the deadline*, *counts whole days regardless of clock time*, *throws on an unparseable date*. API: *stores only the deadline so status is computed at read time* |
| FR-7 Publish, duplicates blocked | `apps/api/src/routes/admin.ts:56`, `packages/shared/src/domain.ts:134` `buildDedupeKey`, unique `dedupeKey` column | Domain: *ignores case, punctuation and spacing*, *ignores the time of day of the deadline*. API: *lets an admin publish a listing*, *blocks a duplicate listing with the existing id* |
| FR-8 Edit and archive | `apps/api/src/routes/admin.ts:92`; archived rows filtered unless `includeArchived` | API: *filters by type and hides archived listings from students* |
| FR-9 Reviewable AI draft | `apps/api/src/services/extractor.ts` (mock provider), `apps/api/src/routes/admin.ts:129`, `apps/web/src/pages/AdminPage.tsx` | API: *extracts structured fields from pasted text*, *treats instruction-like text as data and flags it*, *reports fields it could not find instead of inventing them* |
| FR-10 Roles enforced server-side | `apps/api/src/auth.ts` `requireUser` / `requireAdmin`, used by every admin route and every tracker route | API: *refuses admin writes from a student session*, *is not available to students*, *hides other students entries* |

## Non-functional requirements

| Req | Implementation | Evidence |
| --- | --- | --- |
| NFR-1 Credential handling | `apps/api/src/auth.ts` (bcrypt cost 10, signed httpOnly cookie, 7-day session row), `toPublicUser` strips the hash | API: *registers a student and returns a session cookie*, *returns the signed-in user and clears on logout* |
| NFR-2 One source of truth | `packages/shared` imported by `apps/api` and `apps/web`; no rule re-implemented in a route or a component | `packages/shared/src/domain.test.ts` (18 tests) |
| NFR-3 Automated coverage | `packages/shared/src/domain.test.ts`, `apps/api/test/api.test.ts` | `npm test` → 37 tests across 2 files |
| NFR-4 No secrets | `.gitignore` excludes `.env`; `.env.example` placeholders only; gitleaks job in `.github/workflows/ci.yml` | CI job `secret-scan` |
| NFR-5 Accessible by default | labels on every input, `<h2>` per pipeline column, text plus colour for status, visible `:focus-visible` outline in `apps/web/src/styles.css` | Manual keyboard pass; see `REVIEW.md` |
| NFR-6 Fast enough | 250 ms search debounce in `CataloguePage.tsx`; Vite production build | `npm run build` output, 253 kB web bundle |

## Requirements without automated coverage

These are verified by hand and recorded in `REVIEW.md`. They are not silently dropped.

| Req | Why no test | How it was checked |
| --- | --- | --- |
| FR-2 eligibility hint in the browser | Rendered copy depends on the signed-in student | Logged in as `student@talea.test` (Year 4) and opened listings with different year sets |
| FR-4 return-to-listing after sign-in | Needs a real navigation flow | Followed the redirect manually; see the harness note in `REVIEW.md` |
| NFR-5 accessibility | No axe integration in this project | Keyboard pass over catalogue, detail, tracker and admin forms |
