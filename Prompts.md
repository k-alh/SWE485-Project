# Prompts

The prompts that changed this repository, quoted as typed. Each entry records what the prompt asked
for, what it produced, and the commit that carries it, so a reader can check the claim against the
history. Trivial messages — confirmations, "push it", "is it pushed?" — are left out: they moved no work.

Prompts appear in the order they were sent. The Arabic in prompt 3 is reproduced as written.

---

## 1. Label the official-website link

> perfect everything is great, But can you add text next to the hyperlink that shows that it's a
> hyperlink, so for example "Click Here to Visit The Official Website "

The organisation name on a listing page already linked to the company's site, but nothing said so. The
prompt asked for a visible caption; the wording "Click here" was not used, because link text should name
its destination for anyone reading links out of context. The caption reads *Visit the official website ↗*
on its own line under the company name, inside the same link.

The first colour chosen for the caption failed contrast in light mode (3.34:1 against the paper), found by
measuring rather than by eye, and was replaced with a token that measures 5.0:1 light and 9.9:1 dark.

Commit `85f046e`.

## 2. Larger logos, and no saving for admins

> all is great, 2 last things please, 1- Logos are small I'd like to increase their size. 2- when logged
> in as the Admin we don't need the admin to save a card so remove the save button in the catalogue page
> and when accessing the details for a card ONLY when logged in as an Admin

Two independent changes. Organisation logos on cards went from 26 px to 36 px, and the listing-page logo
from 34 px to 46 px, with the `width`/`height` attributes updated so nothing shifts while loading.

Saving is now hidden for `role === 'admin'` in both places — the card button and the detail panel — and the
tracker request is skipped for admins instead of being made and ignored. Students keep the button.

Commit `fafd6fd`.

## 3. One active nav item, and the wordmark

> Perfect, the last thing to fix is firstly when in admin mode choosing the listings option highlights
> both listing and add listing rather than only one of them, and secondly the name of the website Talea
> طليعة need a space between them and the arabic text should increase in size to match the english one

The nav bug was a `NavLink` to `/admin` without `end`, so it also matched `/admin/listings`. Adding `end`
leaves exactly one item active on `/`, `/admin` and `/admin/listings`.

The wordmark had two separate faults: no space in the markup at all, and a `margin-inline-start` on an
element with `dir="rtl"`, which resolves to the *right* side — so the gap was placed outside the pair
instead of between the words. Fixed with a real space character, a physical margin, and the Arabic set at
`1em` instead of `0.72rem`.

Commit `554ce90`.

## 4. Use the supplied artwork as the logo

> can you put this as the logo for the webapp

The attached image was a clay mark with "Talea طليعة" in off-white on a near-black background. Because the
header is cream, the background was keyed out to transparency and the two flat colours were mapped onto the
existing tokens — clay mark with ink text in light mode, clay with cream text in dark mode — rather than
dropping a dark tile into a light header. The favicon changed to the mark alone.

The artwork is not reproduced in this repository; the derived assets are in `apps/web/public/brand/`.

Commit `a5ab7fa`.

## 5. This record

> Perfect, I also need to record the prompts in the repo under a file named Prompts.md so make the file
> and paste the prompts given in the chat (Value adding prompts only)

Produced this file.
