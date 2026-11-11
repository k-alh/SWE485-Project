# SPEC — Application tracker

**Requirements:** FR-4, FR-5, FR-10
**Screens:** `/tracker`
**Status:** implemented

## Purpose

One board that answers "where does each application stand?" for every opportunity a student
saved. The board is the reason the project exists; the catalogue is the input to it.

## User stories

1. As a student, I save a listing and it appears on my board in **Saved**.
2. As a student, I move an application forward when something actually happens.
3. As a student, I record a rejection and stop seeing the entry as active work.
4. As a student, I see the full history of an entry, not just its current column.
5. As a student, I cannot accidentally save the same listing twice.

## Pipeline

```
saved ──▶ applied ──▶ interview ──▶ offer
  │           │            │           │
  └───────────┴────────────┴───────────┴──▶ rejected  (terminal)
```

`ALLOWED_TRANSITIONS` in `packages/shared/src/domain.ts` is the single definition. The board
renders its buttons from that map, so the UI cannot offer a move the API will refuse.

## Behaviour rules

| Rule | Detail | Requirement |
| --- | --- | --- |
| One entry per student per listing | Enforced by a unique `(userId, listingId)` constraint | FR-4 |
| New entries start in `saved` | The first status event records `null → saved` | FR-4 |
| Forward moves are one step | Skipping returns 409 naming the legal targets | FR-5 |
| No backwards moves | `interview → applied` is refused | FR-5 |
| No no-op moves | `saved → saved` is refused | FR-5 |
| `rejected` is terminal | Nothing moves out of it | FR-5 |
| Every move is recorded | A status event per transition, written in the same transaction | FR-5 |
| Only the owner sees an entry | Another student's id returns 404, not 403 | FR-10 |
| Archived listings cannot be saved | A save on an archived listing is a 404 | FR-4 |

## API surface

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/tracker` | The caller's entries with listing and event history |
| POST | `/api/tracker` | `{ listingId }`; 409 `ALREADY_TRACKED` |
| PATCH | `/api/tracker/:id` | `{ to, note? }`; 409 `INVALID_TRANSITION` |

## UI states

| State | Behaviour |
| --- | --- |
| Loading | Board renders with empty columns, then fills |
| Empty | "Nothing tracked yet" with a link to the catalogue |
| Error on move | The card stays in its column and the error is shown next to it |
| Rejected | Entry sits in its own column with no forward action |
| History | Each card shows the stages it has passed through, with dates |

## Acceptance criteria

- Saving a listing twice returns 409 and creates no second entry.
- `saved → offer` returns 409 `INVALID_TRANSITION` and the message names `applied`.
- Walking `applied → interview → offer` leaves four status events on the entry.
- A rejected entry cannot be reopened.
- A second student's entry id returns 404 for every operation.

## Out of scope

Notes threads, reminders, interviews scheduling, attachments, sharing an application with a
career advisor, and any status beyond the five defined.
