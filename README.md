# Talea — طليعة

A student CO-OP and graduate development opportunity tracker for Saudi university
students. Talea keeps the listing board and the application pipeline in one place:
students browse opportunities, save the ones that fit their year, and move each
application through **saved → applied → interview → offer**, with **rejected** as an
exit. An admin turns pasted opportunity text into a reviewed listing with an AI
extractor that never publishes on its own.

Synthetic data only. Talea does not scrape, does not submit applications, and does
not send email.

## Scope

| In | Out |
| --- | --- |
| 5 screens: catalogue, listing detail, tracker, sign in/register, admin | CV or file uploads |
| 12 API endpoints, 2 roles (student, admin) | Recommendation algorithm |
| 8 database tables (users, sessions, listings, tracker entries, status events, extraction drafts) | Email or push notifications |
| Deadline status computed at read time | Scraping or in-app applying |
| AI extraction with a reviewable draft | Provider lock-in — offline mock is the default |

## Stack

TypeScript throughout.

- **Web** — React 18 + Vite, React Router
- **API** — Fastify 5, Zod validation, bcrypt + httpOnly session cookies
- **Data** — SQLite via Prisma
- **Tests** — Vitest (shared domain + API), Playwright (browser)
- **CI** — GitHub Actions: typecheck, tests, build, gitleaks

## Quick start

```bash
npm install
cp .env.example apps/api/.env     # then set SESSION_SECRET
npm run setup                     # prisma db push + seed
npm run dev                       # API :3000, web :5173
```

`npm run setup` creates `apps/api/prisma/dev.db` and seeds 14 synthetic listings
plus the two demo accounts below.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@talea.test` | `student12345` |
| Admin | `admin@talea.test` | `admin12345` |

### Environment

Copy `.env.example` to `apps/api/.env`. Only two variables matter for a local run:
`DATABASE_URL` and `SESSION_SECRET`. `AI_PROVIDER=mock` is the default and needs no
key; setting it to `openai` requires `OPENAI_API_KEY` and is not exercised by CI.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Builds the shared package, then runs API and web together |
| `npm run build` | Builds shared, API and web |
| `npm run typecheck` | Typechecks every workspace |
| `npm test` | Shared domain tests + API integration tests |
| `npm run test:e2e` | Playwright browser tests (needs `npx playwright install chromium`) |
| `npm run db:push` | Applies the Prisma schema |
| `npm run db:seed` | Reseeds synthetic listings and demo accounts |
| `npm run db:reset` | Drops, recreates and reseeds the database |

## How it is put together

```
apps/web        React client, five routes
apps/api        Fastify server, routes + services
packages/shared Status pipeline, deadline status, eligibility, dedupe key, schemas
docs/           Charter, requirements, traceability, C4, trade-offs, cost, risk, ADRs
specs/          One SPEC.md per feature
```

The status pipeline, deadline rules and dedupe key live in `packages/shared` and are
imported by both the API and the web client, so the two cannot drift. The API is the
only place that enforces them.

## Documentation

- [`RULES.md`](RULES.md) — how this repository is worked in
- [`docs/charter.md`](docs/charter.md) — problem, users, success criteria
- [`docs/requirements.md`](docs/requirements.md) — requirement IDs and acceptance
- [`docs/traceability.md`](docs/traceability.md) — requirement → code → test
- [`docs/c4.md`](docs/c4.md) — context, container and component views
- [`docs/trade-offs.md`](docs/trade-offs.md) — what was rejected and what it cost
- [`docs/cost-model.md`](docs/cost-model.md) — running cost at each scale
- [`docs/risk-register.md`](docs/risk-register.md) — risks, owners, mitigations
- [`docs/adr/`](docs/adr/) — architecture decision records (MADR)
- [`AI_USE_DISCLOSURE.md`](AI_USE_DISCLOSURE.md) — where AI was used and how it was checked
- [`REVIEW.md`](REVIEW.md) — review log

## Known limits

- SQLite and a single API process: fine for a course project, not for a cohort of thousands.
- Sessions live in the database and expire after 7 days; there is no refresh flow.
- The mock extractor is rule-based. It is deterministic and testable, not clever.
- Deadline status is computed in the client from a date string; the API filters on the
  same function, so the two agree by construction.
