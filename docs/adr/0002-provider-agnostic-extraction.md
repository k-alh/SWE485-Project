# ADR 0002 — A provider-agnostic extractor with an offline mock as the default

- **Status:** Accepted
- **Date:** 2026-11-11
- **Deciders:** Talea author
- **Requirements:** FR-9, NFR-3, NFR-4

## Context and problem statement

An admin pastes the text of an opportunity and should not retype six fields. Extraction can be
done by a language model, by deterministic rules, or by both behind one interface. The choice
decides what CI needs, what a fresh clone needs before it can run, and whether the AI behaviour
can be tested at all.

## Decision drivers

- The project must run, and its tests must pass, with no API key and no network.
- Pasted text is untrusted input, so the extraction path needs a test that proves instructions in
  the text cannot change the output.
- A language model's output varies between runs; a test suite needs something that does not.
- Swapping providers later should not touch the route or the review form.

## Considered options

1. **A provider interface with a deterministic offline mock as the default**, plus an optional
   OpenAI implementation selected by `AI_PROVIDER`.
2. **OpenAI only** — the route calls the API directly.
3. **Rules only** — no provider abstraction, no model, ever.

## Decision outcome

**Chosen: option 1.** `services/extractor.ts` exposes one `extract(rawText)` returning fields,
`missing`, `flaggedInstructions` and the provider name. `AI_PROVIDER=mock` is the default;
`AI_PROVIDER=openai` requires `OPENAI_API_KEY`. Both paths return the same shape, so the route,
the review form and the tests are written once.

### Consequences

**Good**

- `npm test` and CI run offline, with no key, no cost and no flakiness.
- The injection test is meaningful: it asserts the mock never acts on instruction-like text, and the
  same assertion holds for any provider that follows the contract.
- The provider is an environment variable, not a code change.

**Bad**

- The mock is rule-based, so it misses formats a language model would infer — unusual date layouts,
  titles without a label, eligibility stated in prose. It is a demo extractor, not a good one.
- Two implementations mean two things to keep honest against one contract.
- The default being the mock risks a demo that looks worse than the real thing, and a real provider
  that is never exercised by the test suite.

### Pros and cons of the options

**Option 1 — provider interface, mock default**

- Good: testable, offline, swappable, no key in CI.
- Bad: the mock's quality is on the author, and it will not improve on its own.

**Option 2 — OpenAI only**

- Good: better extraction on messy text with no extra code.
- Bad: tests need a key and a network; every run costs money and varies; a missing key breaks
  a fresh clone on the first command. Rejected.

**Option 3 — rules only**

- Good: fully deterministic, no provider concept at all.
- Bad: the project's stated AI feature becomes a parser, and there is no path to a real model
  without rewriting the route. Rejected.

## Links

- Implementation: `apps/api/src/services/extractor.ts`, `apps/api/src/routes/admin.ts` (extraction route)
- Related: [ADR 0003](0003-draft-review-before-publish.md)
- Trade-off summary: [`../trade-offs.md`](../trade-offs.md) D3
- Tests: *extracts structured fields from pasted text*, *treats instruction-like text as data and flags it*, *reports fields it could not find instead of inventing them*
