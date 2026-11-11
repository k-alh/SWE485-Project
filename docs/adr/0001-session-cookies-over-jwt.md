# ADR 0001 — Database sessions in httpOnly cookies instead of JWT

- **Status:** Accepted
- **Date:** 2026-11-11
- **Deciders:** Talea author
- **Requirements:** FR-3, FR-10, NFR-1

## Context and problem statement

Students sign in on a browser and stay signed in across visits. The API needs to know who is
calling on every request and must be able to end access immediately on sign-out. The client is
a separate Vite application talking to a Fastify API on another origin, so the mechanism has to
work cross-origin without exposing the token to JavaScript.

## Decision drivers

- Sign-out must actually revoke access, not merely ask the browser to forget a token.
- The token must not be readable by client-side script.
- One extra round trip per request is acceptable; the project is not latency-bound.
- No third-party identity service in scope.

## Considered options

1. **Database session with an httpOnly signed cookie** — random token, hashed and stored in a
   `Session` row, cookie signed with `SESSION_SECRET`.
2. **Stateless JWT in an httpOnly cookie** — signed claims, no server-side record.
3. **JWT in `localStorage`** — client reads and sends the token as a bearer header.

## Decision outcome

**Chosen: option 1.** Sign-in creates a session row and sets a signed, httpOnly,
`SameSite=Lax` cookie with a 7-day expiry. Sign-out deletes the row, and the next request
carries a token that no longer resolves, so it is treated as signed out.

### Consequences

**Good**

- Revocation is a `DELETE`, which is the behaviour a student expects from "sign out".
- `httpOnly` means a script injected into the page cannot read the session.
- The session row gives an audit trail of who is signed in and until when.
- No token format to keep secret in two places; the cookie is opaque.

**Bad**

- Every authenticated request costs one indexed database read.
- Expired sessions accumulate and need a cleanup pass on sign-in (implemented in `startSession`).
- Horizontal scaling requires a shared database, which the SQLite choice already forbids.

### Pros and cons of the options

**Option 1 — database session cookie**

- Good: revocable, script-invisible, simple to reason about.
- Bad: a read per request, and a table to maintain.

**Option 2 — stateless JWT**

- Good: no read, no table.
- Bad: sign-out cannot revoke. A stolen token stays valid until expiry. A blocklist table
  reintroduces the state the option was chosen to avoid.

**Option 3 — JWT in localStorage**

- Good: trivial to send from a fetch client.
- Bad: readable by any script on the page, so one XSS is a full account takeover. Rejected
  outright; it is listed because it is the most common shortcut, not because it was close.

## Links

- Implementation: `apps/api/src/auth.ts` (`startSession`, `endSession`, `getCurrentUser`)
- Trade-off summary: [`../trade-offs.md`](../trade-offs.md) D2
- Tests: *returns the signed-in user and clears on logout*, *registers a student and returns a session cookie*
