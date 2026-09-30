# TerpTaste handoff

Last updated 2026-09-30. Read this first in a new session, then:

- `CLAUDE.md`: stack, test commands, conventions and the never-do list.
- `DESIGN.md`: the Signage direction, token rules, and what red and gold may be used for.
- `DATA.md`: the data contract (every field, Google vs TerpTaste, what `getRestaurants()` returns).
- `GOOGLE_PLACES_PLAN.md`: the current work (see "Next up").
- `TERPTASTE_UI_PLAN.md`: full history of the UI overhaul and future notes.

## What TerpTaste is

A restaurant discovery web app for University of Maryland students in College Park. It helps one student decide where to eat quickly, and helps a group of friends agree without a long group chat. Friend recommendations are the core: what your friends ordered, how they rated it, and where they've been. All data is mock for now; real restaurants will come from Google Places through a Cloudflare Worker.

## Current state

- **`main`** has the UI overhaul (Phases 0–6, PR #1) and the handoff docs and `tests/` folder (PR #2).
- Run `git checkout main && git pull` before starting. Phase 7 goes on a new `google-places` branch.

## File map

| Path | What it is |
|---|---|
| `index.html` | The app: one page with a screen per `.panel` (Discover, Filter, Crew, Deals, Saved, Profile, detail). |
| `css/tokens.css`, `css/components.css`, `css/app.css` | Tokens, `tt-` components, app shell. See `DESIGN.md`. |
| `js/data/` | The data layer and data files. See `DATA.md`. |
| `js/ui/components.js` | `UI.*`: pure functions that turn data into HTML. |
| `js/app.js` | Screens, navigation, shared filter state, events, toast, focus management. |
| `styleguide.html` | Living styleguide of tokens and real components. |
| `case-study.html` + its CSS/JS | Separate portfolio page. Not part of the app and not restyled. |
| `UX_REVIEW.md`, `AUDIT_PHASE5.md` | Original heuristics review; accessibility and craft audits with measured contrast. |
| `tests/` | Data tests, browser tests and tools. Commands in `CLAUDE.md`. |

## Product decisions and why

Design decisions are in `DESIGN.md` and data decisions in `DATA.md`. The rest:

- **Walk time, not miles, organizes Discover.** Every spot appears once, in bands: Under 10 min walk, 10 to 20 min, Worth the drive, Distance not listed yet. 3 mph from McKeldin Mall.
- **Check-in merged into the review.** "I went here" opens a quick review (stars, what you got, optional line); the review is the visit and shows in Crew. Older check-ins still load as unrated visits.
- **Crew tab** replaced Friends and Group: friend activity on top, group vote below. Friend ratings show on cards only when friends have rated a spot.
- **Deals are sample data.** Each has a `lastChecked` date or shows "Sample, not checked yet". App-only deals link out. Deals with no set days go under "Check the app".
- **No rewards for reviews.** Future incentives reward the act of reviewing, never the rating, and never with money or deals.
- **Accessibility is a baseline.** One focused `<h1>` per screen; Back returns focus to the card you opened. Read `AUDIT_PHASE5.md` before changing colors or focus behavior.

## Running the tests: extra details

The commands are in `CLAUDE.md`. Beyond them:

- Each browser suite is appended to a copy of `index.html` and opened in headless Edge with a fresh profile. It fails if it produces no result or the page logs errors. `responsive.html` checks for horizontal scroll at 320–1600px.
- **Lighthouse:** with `CHROME_PATH` set to Edge's `msedge.exe` and the server running, `npx lighthouse http://localhost:8765/ --chrome-flags="--headless=new"` (add `--preset=desktop`). Last: mobile 97/100/100/100, desktop 100/100/100/100.
- **axe:** append `tests/tools/axe.js` to a copy of `index.html` in the repo root (it uses `<base href="http://localhost:8765/">`), open it through the server, then delete the copy. Last: no violations.

## Known loose ends

- **Cheesesteak deal is unlinked.** It sits in `TERP_DEALS_UNLINKED`. The owner will add the spot; leave it alone and don't ask about it.
- **Profile placeholders.** Friends (12) and Groups (4) are static until accounts exist.
- **Manual accessibility pass** still to do: screen reader (VoiceOver, NVDA) and keyboard-only, focusing on the star radios, sideways chip rows and the toast Undo.
- **Case-study page** still uses the old styling (gradients, pure white). Out of scope.

## Next up: `GOOGLE_PLACES_PLAN.md`

Read it in full, then start with Step 0.

- **Step 0 is setup the owner does by hand.** Walk them through it; don't do it for them. Never ask for the key.
- **Then one step at a time** (Worker, photos, data layer swap, re-keying content, Google requirements, verify) on the `google-places` branch. Commit at the end of each step and stop for review.
- **Step 7, the adversarial audit,** is run by the owner in a fresh session.
- The Map view stays out of this phase.
