# ADR 0003 — Extraction produces a draft that a human approves, never a published listing

- **Status:** Accepted
- **Date:** 2026-11-11
- **Deciders:** Talea author
- **Requirements:** FR-9, FR-7, R2, R3

## Context and problem statement

The extractor turns pasted text into listing fields. Something has to decide when those fields
become a listing that every student sees. The decision is about who is accountable for a wrong
deadline: the model, or the admin who pasted the text.

## Decision drivers

- A wrong deadline or city is visible to every student and destroys trust in the board.
- The extractor cannot know whether a posting is genuine, already published, or withdrawn.
- Duplicate blocking (FR-7) must apply to AI-produced listings exactly as it applies to typed ones.
- Pasted text may contain instructions aimed at the extractor; the review step is where a human sees them.

## Considered options

1. **Draft then review** — extraction writes an `AiExtractionDraft`; the admin corrects it and submits
   the normal create form, which applies duplicate blocking.
2. **Auto-publish on high confidence** — publish when the extractor is confident, review only otherwise.
3. **Auto-publish always** — extraction writes a listing directly.

## Decision outcome

**Chosen: option 1.** The extraction route returns a draft and creates no listing. The admin screen
pre-fills the create form from the draft, marks the fields the extractor could not find, and shows any
flagged instruction-like lines above the form. The admin's submit is an ordinary create, so dedupe, validation
and role checks are the same code path as a manual entry.

### Consequences

**Good**

- Every published listing has been read by a person. The failure mode is "slow", not "wrong".
- One write path: the duplicate key, the schema and the archive rule cannot diverge between AI and manual entry.
- Missing fields are visible as missing, so the admin knows what to look up rather than trusting a guess.
- Flagged instructions are shown in context, which makes an injection attempt visible instead of silent.

**Bad**

- The admin still does the review work, so extraction saves typing rather than labour.
- An extra table and an extra endpoint exist for a step that produces nothing user-visible.
- A careless admin can approve a bad draft, and the system cannot detect that.

### Pros and cons of the options

**Option 2 — auto-publish on high confidence**

- Good: fewer clicks for clean postings.
- Bad: confidence is the extractor's own estimate, and the postings that need review are exactly
  the ones where that estimate is least trustworthy. Rejected.

**Option 3 — auto-publish always**

- Good: the simplest possible flow.
- Bad: one bad extraction is a wrong deadline on the board, and the injection surface becomes
  production-facing with no human in the loop. Rejected.

## Links

- Implementation: `apps/api/src/routes/admin.ts` (extraction route, create route), `apps/web/src/pages/AdminPage.tsx`
- Related: [ADR 0002](0002-provider-agnostic-extraction.md)
- Trade-off summary: [`../trade-offs.md`](../trade-offs.md) D4
- Tests: *treats instruction-like text as data and flags it*, *blocks a duplicate listing with the existing id*
