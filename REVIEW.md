# Review Log

What was checked, how, and what it found. Findings are ordered by severity. A finding
stays here after it is fixed, with the commit that fixed it.

## How the review was done

| Method | Scope |
| --- | --- |
| Reading every route and service | `apps/api/src` — rules, role checks, error mapping |
| Reading every page | `apps/web/src/pages` — states, labels, transitions offered |
| Running the suite | `npm run typecheck`, `npm test`, `npm run build` |
| API smoke tests against a live server | Admin login, extraction, create, duplicate, role denial, illegal transition |
| Browser pass as the demo student | Sign in, browse, save, move through the pipeline |
| Adversarial extraction | Prompt-injection text pasted as a posting |

## Findings

### Critical — fixed

**C1 — Metadata labels leaked into the listing description.**
The extractor built the description from every line it had not consumed, so a posting
containing `Type: GDP` and `Eligibility: Graduates` produced a description that began
`Type: GDP Eligibility: Graduates`. The field looked populated and was wrong.
*Found by:* running the extractor against a real posting and reading the output.
*Fixed in:* `e0193be` — label lines are consumed as metadata, with the label set explicit.
*Evidence:* the API test *extracts structured fields from pasted text* asserts the description
contains the body text and not `Eligibility:`.

**C2 — The deadline was serialised as an instant.**
`GET /api/listings/:id` returned `2026-12-11T00:00:00.000Z` for a date field. A client west of
UTC would render the previous day, and the pill would disagree with the date beside it.
*Found by:* the API test for FR-6 failing on a date comparison.
*Fixed in:* `b87a59c` — the DTO returns `YYYY-MM-DD`.
*Evidence:* *stores only the deadline so status is computed at read time*.

### Important — open

**I1 — Browser tests exist but have not been run.**
`apps/web/playwright.config.ts` and `apps/web/e2e/student-journey.spec.ts` cover sign in → save →
advance, plus an illegal transition attempted by direct request. The spec has not been executed here:
`npx playwright install chromium` did not finish downloading the browser. Run `npm run test:e2e` once
chromium is installed, and add it to CI with `npx playwright install --with-deps chromium`.
The deferral is recorded in `trade-offs.md` D11 and risk R10; the manual browser pass below is the
current control.

**I2 — The OpenAI provider path is untested.**
`AI_PROVIDER=openai` compiles and returns the same contract, but no test exercises it and CI
cannot, because it needs a key. The mock is the tested path and the default. The risk is that the
two implementations drift; the contract test would catch it if the OpenAI path were run against a
recorded response.

**I3 — The admin screens were verified through the API, not the UI.**
Admin create, duplicate and extraction were confirmed by HTTP against a live server. The admin
*page* was reviewed by reading it and by rendering it, not by a full click-through of every field.

### Minor — open

**M1 — favicon 404.** The browser requests `/favicon.ico` and the app does not serve one. One
console error on every page load. Cosmetic; noted rather than fixed.

**M2 — React Router future-flag warnings.** The development console shows the v7 future-flag
warnings. They are informational and disappear with the router upgrade, which is out of scope.

**M3 — Search has no result count.** The catalogue says "no opportunities match" but does not say
how many matched before filtering. Useful, not required.

## Browser pass

Performed as `student@talea.test` (Year 4) against a live web and API process:

| Step | Result |
| --- | --- |
| Sign in | Redirected to the catalogue |
| Catalogue renders seeded listings | Yes, with deadline pills |
| Open a listing closing in 4 days | Pill reads "Closing soon", eligibility reads "You can apply" |
| Save the listing | Entry created, status `saved` |
| Open the tracker | Entry appears in the Saved column |
| Move to applied | Entry moves; buttons become "Move to interview" and "Rejected" |
| Attempt an illegal jump | Refused, with the legal targets named |

A note on method: in this environment the automation harness did not deliver real mouse
clicks to the page, so the click steps were driven programmatically against the same DOM
handlers. The requests that resulted were real — `POST /api/tracker` returned 201 and the
`PATCH` returned 200 — and the rendered state changed accordingly. This is a limitation of
the harness, not a finding about the app, and it is why I1 is open rather than closed.

## Verification evidence

| Command | Result |
| --- | --- |
| `npm run typecheck` | Clean across shared, api, web |
| `npm test` | 37 passing — 18 domain, 19 API |
| `npm run build` | Built; web bundle 253.04 kB (75.49 kB gzip) |
| `gitleaks` (CI) | No findings |

## What this review does not cover

- Load behaviour beyond the seeded dataset.
- A real AI provider's output quality.
- Accessibility with a screen reader; only a keyboard and contrast pass.
- Anything on a mobile device; responsive layout was checked by narrowing the window.
