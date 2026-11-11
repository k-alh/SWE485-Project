# SPEC — Catalogue

**Requirements:** FR-1, FR-2, FR-6, FR-8
**Screens:** `/` (catalogue), `/listings/:id` (detail)
**Status:** implemented

## Purpose

A student finds opportunities that fit their year without opening five tabs. The catalogue is the
front door: it must answer "what is open, what closes soon, and can I apply?" at a glance.

## User stories

1. As a student, I search for a company or a role and see matching opportunities.
2. As a student, I filter to CO-OP or GDP so I am not reading postings I cannot take.
3. As a student, I see which deadlines are close before I sort by anything else.
4. As a student, I open a listing and know whether my year is eligible before I read the description.
5. As an admin, I archive a posting that is no longer live and it disappears for students.

## Behaviour rules

| Rule | Detail | Requirement |
| --- | --- | --- |
| Only active listings are public | Archived rows are excluded unless the caller is an admin asking for `includeArchived` | FR-8 |
| Deadline status is computed | `open` > 7 days, `closing_soon` within 7 days, `closed` after the deadline day | FR-6 |
| Deadline is a day, not an instant | Stored at UTC midnight, returned as `YYYY-MM-DD` | FR-6 |
| Closing first | Closed listings sort last; otherwise earliest deadline first | FR-1 |
| Search is case-insensitive | Matches title, organisation, city and description | FR-1 |
| Eligibility is a hint, never a block | A student outside the listed years still sees the listing | FR-2 |
| Unknown year says so | A student with no academic year sees "Add your year", not a guess | FR-2 |

## API surface

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/listings` | `q`, `type`, `city`, `deadlineStatus`, `includeArchived` |
| GET | `/api/listings/:id` | 404 when the listing is archived or missing |

## UI states

| State | Behaviour |
| --- | --- |
| Loading | Skeleton rows in the list, not a blank page |
| Empty | "No opportunities match" plus a clear-filters action |
| Error | Inline message with a retry, not a toast that disappears |
| Populated | Deadline pill, type tag, city, eligible years on each row |
| Archived (admin) | Visible only with `includeArchived`, marked archived |

## Acceptance criteria

- A `type=coop` request returns no GDP listings.
- Archiving a listing removes it from the student catalogue and keeps it for the admin.
- A listing with a deadline 30 days out reads `open`; one 4 days out reads `closing_soon`.
- The deadline in the response is `YYYY-MM-DD`, so a client in any timezone shows the same day.
- A Year 4 student sees "You can apply" on a Years 4–5 listing and "Not your year" on a Year 5-only listing.

## Out of scope

Saved searches, pagination beyond the current list response, recommendations, notifications,
scraped listings, and any listing that is not entered by an admin.
