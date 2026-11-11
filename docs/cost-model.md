# Cost Model

Most of the cost of Talea is engineering time, not infrastructure. This document puts
numbers on both so a decision to grow the project is made with the real bill in view.

All prices are estimates at the time of writing and are marked as such. Re-check provider
pricing before budgeting; nothing here is a quote.

## Assumptions

| Assumption | Value |
| --- | --- |
| Active students | 100 / 1,000 / 10,000 |
| Listings live at once | 50 / 200 / 600 |
| Admin extractions per month | 40 / 300 / 1,500 |
| Average pasted posting | ~450 input tokens, ~250 output tokens |
| Requests per student per day | ~15 (browse, detail, tracker reads and writes) |
| Database size per student | ~2 kB (entries, events, session) |

## Tier 1 — 100 students (course demo)

| Item | Choice | Monthly |
| --- | --- | --- |
| Web + API | one small container, 0.5 vCPU / 512 MB | ~$5 |
| Database | SQLite file on the same volume | $0 |
| AI extraction | mock provider (offline) | $0 |
| **Total** | | **~$5** |

This is the tier the project is built for. Everything runs in one process against one file.

## Tier 2 — 1,000 students (one university)

| Item | Choice | Monthly |
| --- | --- | --- |
| Web + API | 1 container, 1 vCPU / 1 GB | ~$10 |
| Database | SQLite on a mounted volume, nightly file copy | ~$1 |
| AI extraction | 300 drafts × ~450 tokens ≈ 135k tokens input, 75k output on a small model | under $1 |
| Monitoring | uptime check + log retention | ~$3 |
| **Total** | | **~$15** |

At this tier the first real risk appears: two API instances cannot share a SQLite file
safely. Staying on one instance is cheaper than moving to Postgres, and one instance
handles a thousand students comfortably.

## Tier 3 — 10,000 students (several universities)

| Item | Choice | Monthly |
| --- | --- | --- |
| Web + API | 2 containers behind a load balancer | ~$30 |
| Database | managed Postgres, smallest tier | ~$15–25 |
| AI extraction | 1,500 drafts × ~450 tokens ≈ 675k input, 375k output | ~$1 |
| Backups | automated daily snapshots | included above |
| Monitoring | logs, alerts, error tracking | ~$10 |
| **Total** | | **~$60–75** |

The jump from Tier 2 is not traffic — it is the database. Two instances require Postgres,
and Postgres brings a managed service, a connection pool and a migration.

## What does not scale, and when it breaks

| Component | Breaks at | Why |
| --- | --- | --- |
| SQLite | ~2 API instances | one writer, file-level lock |
| In-process sessions table | ~10k users | a database read per request, on the same file |
| Single container | ~1k daily active | no failover; a restart is downtime |
| Full catalogue payload | ~600 listings | every filter is server-side, so the payload is bounded, but the list response grows |

## Engineering time, the real cost

| Activity | Hours | When |
| --- | --- | --- |
| Vertical slice (auth, catalogue, tracker) | ~24 | done |
| Admin path + duplicate blocking | ~10 | done |
| AI extraction + injection handling | ~8 | done |
| Tests (18 domain, 19 API) | ~8 | done |
| Documentation set | ~10 | done |
| Browser tests (deferred) | ~6 | not done |
| Postgres migration (Tier 3) | ~8 | not done |

The documentation is roughly a third of the effort. That is the deliberate trade: the code is
small, and the reasoning behind it is the part a reader cannot reconstruct.

## Cost of a bad extraction

One wrong deadline published to every student costs a correction, a re-publish and lost trust
in the board. The draft-and-review step (ADR 0003) costs the admin about a minute per
listing. That is the cheapest part of the whole system to run and the most expensive to skip.
