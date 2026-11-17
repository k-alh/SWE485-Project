# Prompts

The prompts that changed this repository, quoted as sent. Each entry records what the prompt asked for,
what it produced, and the commits that carry it, so a reader can check the claim against the history.
Trivial messages — confirmations, "push it", "is it pushed?" — are left out: they moved no work.

All Prompts were transcribed from the session by the author and quoted from the same log.

---

## 1. Read the course material first

> Hi DevAI, I need your help with building a project for my SWE485 course, Firstly I'll attach my course
> material which has info on how to structure our project github repo so I need you to go over them and
> familiarize yourself with the contents, then I'll attach my project brief and project idea then we'll proceed
> with building the project.

No code. The material was read before anything was written, which is why the repository opens with a document
set (charter, requirements, traceability, C4, trade-offs, cost model, risk register, ADRs) rather than with
application code, and why every later commit could point at a requirement.

## 2. Read the brief, then scaffold

> perfect, I've attached everything you need in the course-material\ folder, start with going over the course
> material, then the project brief and lastly the project idea. ask any question you need an answer for
> regarding the project idea. then start with scaffolding the Repo.

The questions came before the scaffolding: who the users are, what the tracker pipeline allows, and whether the
AI extractor may create listings on its own. The answers became the domain rules in `packages/shared`, and the
scaffold followed: npm workspaces, a Fastify API and a Vite web app sharing one types package.

Commits `77f7df3`, `beb8089`, then the documentation set `28caff2` → `6c9d0bd`.

## 3. Work in small steps

> partition the tasks to smaller tasks and commit changes step by step and not in the end.

This one set the working method rather than producing a change. The history is the evidence: one commit per
task, each with a single concern, and no commit that mixes a feature with a document edit. The same rule is
written into `RULES.md`.

## 4. Organisation prominence, and dark mode

> in the details section can the organizations name be more prominent, for example ELM, when entering to the
> details of the opportunity it's not clear that it's for ELM, the font is small, increase it in size and make it
> the same font as the job offers text. also add a dark mode feature for the web app.

The organisation became its own byline above the title, set in the display face at the title's size. Dark mode is a
token override on `[data-theme='dark']` with a toggle in the topbar, not a second stylesheet, so every component
follows without being touched.

Commits `619de9f`, `d8af06d`.

## 5. Split the admin area

> I want to make changes to the admin page, firstly the admin page doesn't need a tracker page, we'll keep the page
> but replace it to be a Listings page, and I'd like the "All Listings" which is in the Admin page to be moved
> there. Also change the Admin page name to "Add Listing". after finishing push to the repo so the deployed page
> updates.

The admin nav became Catalogue / Listings / Add Listing: the listing table moved off the Admin page onto its own
screen at `/admin/listings`, and the old Admin screen kept only the add form.

Commit `eb05e4c`.

## 6. Logos, the tracker box, and official links

> now let's move to the catalogue page, I want the cards to have logos of the given opportunities (ELM, STC, etc)
> just before the companies name (Small to medium size). and when we are in the details page lets move the box that
> has "save to tracker" button to be under the description text and make more of a rectangle rather than a square.
> Also if possible can we provide a link to the official websites of these companies (no need to link for an
> opportunities as I know these are mock examples but a simple link will make it look more professional).

Three changes: a logo chip before the organisation name on each card, the deadline/eligibility box moved below the
description as a full-width band with the Save button on its right, and the organisation byline turned into a link to
the company's real site. Logo files are committed with their provenance in `apps/web/public/logos/SOURCES.md`;
website URLs live in `lib/organisations.ts`, covered by four tests that check every seeded organisation resolves to
both a URL and an existing file.

While rewriting that CSS a pre-existing bug surfaced: the utilities block was nested inside `.side-panel`, so
`.visually-hidden` only applied there and the admin listings table rendered a visible "Actions" header.

Commits `cb571d1`, `d02e13b`, `8779d08`, `063c40c`.

## 7. Label the official-website link

> can you add text next to the hyperlink that shows that it's a hyperlink, so for example "Click Here to Visit The
> Official Website ".

The organisation name already linked to the company's site, but nothing said so. The caption reads *Visit the official
website ↗* on its own line under the company name, inside the same link. The wording "Click here" was not used, because
link text should name its destination for anyone reading links out of context.

The first colour chosen for the caption failed contrast in light mode (3.34:1 against the paper), found by measuring
rather than by eye, and was replaced with a token that measures 5.0:1 light and 9.9:1 dark.

Commit `85f046e`.

## 8. Larger logos, and no saving for admins

> 2 last things please, 1- Logos are small I'd like to increase their size. 2- when logged in as the Admin we don't
> need the admin to save a card so remove the save button in the catalogue page and when accessing the details for a
> card ONLY when logged in as an Admin.

Organisation logos went from 26 px to 36 px on cards and 34 px to 46 px on the listing page, with the `width`/`height`
attributes updated so nothing shifts while loading.

Saving is hidden for `role === 'admin'` in both places — the card button and the detail panel — and the tracker request is
skipped for admins instead of being made and ignored. Students keep the button.

Commit `fafd6fd`.

## 9. One active nav item, and the wordmark

> the last thing to fix is firstly when in admin mode choosing the listings option highlights both listing and add listing
> rather than only one of them, and secondly the name of the website Talea طليعة need a space between them and the arabic
> text should increase in size to match the english one

The nav bug was a `NavLink` to `/admin` without `end`, so it also matched `/admin/listings`. Adding `end` leaves exactly
one item active on `/`, `/admin` and `/admin/listings`.

The wordmark had two separate faults: no space in the markup at all, and a `margin-inline-start` on an element with
`dir="rtl"`, which resolves to the *right* side — so the gap was placed outside the pair instead of between the words.
Fixed with a real space character, a physical margin, and the Arabic set at `1em` instead of `0.72rem`.

Commit `554ce90`.

## 10. Use the supplied artwork as the logo

> can you put this as the logo for the webapp

The attached image was a clay mark with "Talea طليعة" in off-white on a near-black background. Because the header is
cream, the background was keyed out to transparency and the two flat colours were mapped onto the existing tokens — clay mark
with ink text in light mode, clay with cream text in dark mode — rather than dropping a dark tile into a light header. The
favicon changed to the mark alone.

The artwork itself is not reproduced in this repository; the derived assets are in `apps/web/public/brand/`.

Commit `a5ab7fa`.

## 11. This record

> Perfect, I also need to record the prompts in the repo under a file named Prompts.md so make the file and paste the
> prompts given in the chat (Value adding prompts only)

Produced this file, later completed with prompts 1–9 supplied by the author.

Commit `72d700d`.
