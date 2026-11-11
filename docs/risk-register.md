# Risk Register

Likelihood and impact are Low / Medium / High. Score is the pair that matters: a High
impact risk with Low likelihood is still worth a mitigation if the mitigation is cheap.

Owner is the single author of this project. The "Trigger" column is what would tell you the
risk has materialised, so the register is checkable rather than decorative.

| ID | Risk | Likelihood | Impact | Mitigation | Trigger | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | A listing shows the wrong deadline status because the page has been open for days | Low | Medium | Status is never stored; it is recomputed from the deadline on every render and every API read (FR-6) | A student reports "open" on a closed listing | Dev |
| R2 | An admin publishes a wrong deadline or city from a bad extraction | Medium | High | Extraction produces a draft only; missing fields are listed, not invented; the admin edits before publishing (FR-9) | A published listing with an empty or implausible field | Dev |
| R3 | Pasted text that looks like an instruction changes extracted fields | Low | High | Text is treated as data; instruction-like lines are flagged and shown to the admin; covered by *treats instruction-like text as data and flags it* | A draft whose title or deadline does not appear in the pasted text | Dev |
| R4 | Two admins publish the same opportunity twice | Medium | Medium | Unique `dedupeKey` in the database; the second attempt returns 409 naming the existing listing (FR-7) | Two catalogue rows with the same organisation and deadline | Dev |
| R5 | Session cookie stolen or forged | Low | High | Signed httpOnly `SameSite=Lax` cookie, `Secure` in production, 7-day expiry, server-side revocation on sign-out (NFR-1) | A session that stays valid after sign-out | Dev |
| R6 | SQLite write contention as usage grows | Medium | Medium | Scope ceilings in `RULES.md`; Prisma keeps the schema portable, so Postgres is a configuration change plus a migration | `SQLITE_BUSY` errors under load | Dev |
| R7 | The single database file is lost | Medium | High | Seed script regenerates the catalogue and demo accounts from source; a real deployment needs a volume and a backup job, which is out of scope here | A fresh clone with no data after a deploy | Dev |
| R8 | Real student data ends up in the repository | Low | High | Synthetic data only (`RULES.md` §9); `.env` gitignored; gitleaks runs in CI | A gitleaks finding, or a name that is not in the seed file | Dev |
| R9 | The configured AI provider is down or the key is missing | Medium | Low | `AI_PROVIDER=mock` is the default and needs nothing; a provider failure surfaces as an error and the admin can still type the listing by hand | A 5xx from the extraction route | Dev |
| R10 | A UI regression ships because screens have no browser tests | Medium | Medium | Manual pass recorded in `REVIEW.md`; browser tests deferred and the deferral stated in `trade-offs.md` D11 | A screen that renders but does not work | Dev |
| R11 | Scope creep: recommendations, notifications, scraping | High | Medium | Non-goals are written down in `RULES.md`; a new feature needs a trade-off entry first | A pull request that adds a third role or an outbound integration | Dev |
| R12 | A student's academic year is missing, so the eligibility hint is wrong | Medium | Low | The hint returns `unknown` and the UI asks for the year instead of guessing (FR-2) | "You can apply" shown to a student with no year | Dev |

## Accepted risks

Two risks are accepted rather than mitigated, and both are recorded in
[`trade-offs.md`](trade-offs.md):

- **R6** — SQLite contention. Acceptable at the project's scale; the migration path is a
  Prisma datasource change.
- **R10** — no automated browser coverage. Acceptable while the screens are still changing;
  the manual pass in `REVIEW.md` is the current control.

## Out of scope by rule

Scraping, in-app applications, uploads, notifications and recommendations are not risks to
manage — they are non-goals. If one appears in a request, it is declined with a pointer to
`RULES.md` §2 rather than added to this register.
