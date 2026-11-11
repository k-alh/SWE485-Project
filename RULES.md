# Rules

How this repository is worked in. These are constraints on the work, not aspirations.

## 1. Scope ceilings

The project stays inside these numbers. A change that needs more is a scope change and
gets recorded in `docs/trade-offs.md` first.

| Ceiling | Limit | Current |
| --- | --- | --- |
| Screens | 6 | 5 |
| API endpoints | 12 | 12 |
| Database tables | 8 | 6 |
| Roles | 2 | 2 |
| Deploy targets | 1 | 1 |

## 2. Non-goals

Not built, not planned, not "nice to have later" in this course:

- scraping job boards or company sites
- applying to opportunities from inside Talea
- CV or document uploads
- email, SMS or push notifications
- a recommendation or ranking algorithm
- real student or company data — the database is synthetic

If a feature request needs one of these, the answer is no, and the reason goes in
`docs/trade-offs.md`.

## 3. Domain rules are shared, enforcement is server-side

- The status pipeline, deadline status, eligibility hint and dedupe key live in
  `packages/shared`. The web client imports them for display only.
- Every rule is enforced in the API. The client never decides whether a transition is
  legal, whether a listing is a duplicate, or whether a user may write.
- Adding a status or an edge means changing `ALLOWED_TRANSITIONS` and its tests in the
  same commit. The UI derives its buttons from that map, so it cannot offer a move the
  API will reject.

## 4. AI features are reviewable and grounded

- The extractor reads only the text the admin pasted. No outside lookup.
- Its output is a **draft**. Nothing reaches the catalogue until a human approves it.
- Pasted text is data, never instruction. Instruction-like lines are flagged and shown
  to the admin, and there is a test that proves a prompt injection cannot change the
  extracted title.
- Missing fields are reported as missing, never invented. Defaults are marked as
  defaults.
- The provider is an environment switch with a deterministic offline mock as the
  default, so tests and CI never need a key or a network call.

## 5. Tests before claims

- A behaviour that matters has a test that fails without it: pipeline transitions,
  duplicate blocking, role checks, injection handling.
- `npm run typecheck`, `npm test` and `npm run build` must pass before a commit is
  called done.
- A bug fix starts with the failing test or a reproduction, not with a guess.

## 6. Commits

- Short-lived branches, one concern per commit.
- AI-written work is committed first, then corrected in a separate human-review commit,
  so the diff between the two is visible in history.
- Commits that contain AI-authored code carry a `Co-authored-by:` trailer.
- Commit messages say what changed and why, in the imperative. No "wip", no "fixes".

## 7. Documentation is part of the change

A change that alters a rule, an endpoint, a table or a screen updates, in the same
branch: the relevant `specs/*/SPEC.md`, `docs/requirements.md`, and
`docs/traceability.md`. A requirement with no test row is an unfinished requirement.

## 8. Security floor

- Passwords are bcrypt-hashed; the API never returns a hash.
- Sessions are httpOnly, SameSite=Lax cookies with a signed secret and a 7-day expiry.
- Role checks run on the server for every admin route. Hiding a button is not a control.
- Secrets live in `.env`, which is gitignored. `.env.example` carries names only.
- No secret is ever logged, and no error message reveals whether an email exists.

## 9. Data

Synthetic only. Seeded organisations are real companies with invented postings; no real
student, application or personal record is stored anywhere in this repository.
