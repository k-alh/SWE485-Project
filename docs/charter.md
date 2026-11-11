# Talea — Project Charter

## 1. Problem

A Saudi university student looking for a cooperative training placement (CO-OP) or a
graduate development programme (GDP) works across at least four places: company career
pages, university announcement boards, WhatsApp groups, and a spreadsheet or notes app
where the applications actually get tracked. The listings are scattered and the tracking
is manual, so deadlines are missed and the same opportunity is rediscovered twice.

The tracking half is the part nobody solves. Company portals know about their own
posting and nothing else; the university board knows about postings but not about what
the student did next. A student applying to fifteen opportunities has no single place
that answers "where does each one stand?"

## 2. Users and jobs

| User | Job to be done |
| --- | --- |
| Student (Year 3–5, or graduate) | Find opportunities that fit my year, save the ones worth applying to, and know where each application stands without opening five tabs |
| Admin (career services staff) | Get a new opportunity into the board quickly and correctly, without retyping six fields from a PDF or email |

The student is the primary user. The admin exists so the board stays accurate; admin
work is a cost to be minimised, not a feature to be celebrated.

## 3. Scope

In scope: a browsable catalogue of CO-OP and GDP opportunities with search and
deadline filters, a per-student tracker with a guarded status pipeline, accounts with
two roles, and an admin screen that turns pasted text into a reviewed listing.

Out of scope, permanently for this project: scraping, applying from inside Talea, file
uploads, notifications, recommendations, and any real student data. The reasons are in
[`trade-offs.md`](trade-offs.md).

## 4. Success criteria

The project is successful when all of these are true:

1. A student can sign in, find a listing that matches their year, save it, and move it
   to **applied** without reading documentation.
2. The pipeline cannot be driven into an impossible state — not by a click, not by a
   crafted request. Skipping a stage and reopening a rejection both fail at the API.
3. The same opportunity cannot be published twice; the second attempt names the
   existing listing.
4. A pasted opportunity produces a draft whose fields the admin can correct, and
   nothing reaches the catalogue until the admin approves it.
5. Text that tries to instruct the extractor is shown to the admin as flagged text and
   does not change the extracted fields.
6. Every rule above has an automated test that fails when the rule is removed.
7. A new contributor can clone, seed and run the project from the README without
   asking a question.

## 5. Constraints

| Constraint | Consequence |
| --- | --- |
| Course project, one author, fixed term | Scope ceilings in `RULES.md`; no speculative features |
| TypeScript only | One language across web, API and shared domain |
| SQLite | Single-file database, no operations burden, no concurrent writers |
| No paid services required | AI provider defaults to a deterministic offline mock |
| Synthetic data only | Seeded listings are invented; no real student records |

## 6. Stakeholders

- **Student** — primary user, decides whether the tracker is worth using
- **Admin / career services** — secondary user, cares about entry speed and accuracy
- **Course assessor** — reads the repository as evidence of process, not only output

## 7. Approach

A vertical slice first: one student journey end to end (sign in → browse → save →
advance), then the admin path, then the AI ingest, then the documentation that
explains the decisions. Every rule lives in `packages/shared` so the client and the
server cannot disagree about what is legal. Each increment lands as its own commit
with tests, and the AI-written work is separated from the human corrections in
history.
