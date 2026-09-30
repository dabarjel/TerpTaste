# TerpTaste handoff

Last updated 2026-09-30. Read this first in a new session. Then read `GOOGLE_PLACES_PLAN.md` (the current work, see "Next up") and `TERPTASTE_UI_PLAN.md` (the full history and future notes) before changing anything.

## What TerpTaste is

TerpTaste is a restaurant discovery web app for University of Maryland students in College Park. It helps one student decide where to eat quickly, and helps a group of friends agree without a long group chat. Friend recommendations are the core of the product: what your friends ordered, how they rated it, and where they've been.

It's a static site (vanilla HTML, CSS and JS, no framework, no build step) hosted on GitHub Pages (`dabarjel.github.io/TerpTaste/`). All data is mock data for now. Real restaurants will come from the Google Places API through a small backend proxy.

## Current state

- **`main`** has the whole UI overhaul (Phases 0–6), merged through PR #1 (`28d91bc`).
- **This file, `GOOGLE_PLACES_PLAN.md` and the `tests/` folder** are on the `handoff` branch, which needs its own PR into `main`. Once that's merged, work from `main`. Phase 7 itself goes on a new `google-places` branch, per its plan.
- **Local `main` may be behind** `origin/main`. Run `git checkout main && git pull` before starting.
- **Nothing is uncommitted or unpushed** apart from what the `handoff` branch PR brings in.

## File map

| Path | What it is |
|---|---|
| `index.html` | The app: one page with a screen per `.panel` (Discover, Filter, Crew, Deals, Saved, Profile, detail). |
| `css/tokens.css` | Design tokens and the single source of truth: colors, type, spacing, radii, z-index layers, shadows, motion. |
| `css/components.css` | Every component's styles (`tt-` prefix). All values come from tokens. |
| `css/app.css` | Remaining app-shell and legacy styles (sidebar, screen headers, Profile). Uses tokens. |
| `js/data/restaurants.js` | **The data layer.** The only way the UI gets data: `TerpData.getRestaurants(filters)`, `getRestaurant(id)`, `getFacets()`, `getDeals()`, `getActivity()`, plus user actions (saved spots, reviews and visits, group vote). Handles localStorage and the test switches. When Google Places arrives, only `fetchPlaces()` in this file should change. |
| `js/data/mock-places.js` | Mock place records using the Google Places API (New) field names. Unknown fields are `null`. |
| `js/data/terp-content.js` | TerpTaste's own content keyed by place id: student tags, reviews, menus, dietary notes, standout dishes (`highlights`), deals. Also `TERP_DEALS_UNLINKED`. |
| `js/data/mock-friends.js` | Mock friends and their visits (star rating, what they got, note). Stands in until there are accounts. |
| `js/ui/components.js` | `UI.*`: pure functions that turn data into HTML (card, walk-time sections, detail, review form, scoreboard, deal, states…). All interpolated text is escaped. |
| `js/app.js` | Screens, navigation, shared filter state, events, toast, focus management. |
| `styleguide.html` | Living styleguide showing the tokens and the real components with mock data. |
| `case-study.html`, `css/case-study.css`, `js/case-study.js` | Separate UX case-study page (portfolio). Not part of the app and not restyled. |
| `GOOGLE_PLACES_PLAN.md` | **The current plan (Phase 7):** real restaurants and photos from Google Places (New) through a Cloudflare Worker, in Steps 0–6. Also sets the ground rules for this phase (no key in the repo, no storing Google data). |
| `TERPTASTE_UI_PLAN.md` | The UI overhaul plan: chosen direction, every phase (0–6) with what was done, and the future notes (Google Places proxy, Google Maps, accounts, admin for deals and dishes, review incentives). |
| `UX_REVIEW.md` | The original UX heuristics review (10 heuristics plus priority actions). |
| `AUDIT_PHASE5.md` | Accessibility (WCAG 2.1 A/AA) and craft audits, with findings, measured contrast and fixes. |
| `tests/` | Data tests, browser tests and tools (see below). |

## Key decisions and why

- **Direction A, "Signage".** Dark asphalt surfaces, flat cards with small corners, Big Shoulders Display for names and titles, Inter for body, IBM Plex Mono only for numbers people compare (price, distance, walk time). Chosen over two alternatives so the app feels like College Park signage rather than a generic template.
- **No gradients or glows.** Flat, deliberate color. The photo fallback is the cuisine name set large and cropped (drawn by CSS, decorative), not an emoji on a gradient.
- **Color has jobs.** Terp Red is only for actions and the current selection (fills use `--red`; red text and icons on dark use `--action-text` for contrast). **Gold is only for ratings and the group-vote leader**, so gold always means "best".
- **Null instead of guessed data.** If we don't know something (open/closed status, price level, distance, a deal's days), it's `null` and the UI shows nothing. "Open now" stays hidden until real hours exist; Five Guys has no price or distance until Places supplies them.
- **The data layer is the only way the UI gets data.** Screens never read mock files directly. This keeps the Google Places swap to one function.
- **Walk time, not miles, organizes Discover.** Every spot appears once, in bands: Under 10 min walk, 10 to 20 min, Worth the drive, Distance not listed yet. Walk time assumes 3 mph from McKeldin Mall.
- **Check-in merged into the review.** One action, "I went here", opens a quick review (stars, what you got, optional line); the review is the visit and what shows in Crew. Check-ins stored before this change still load as unrated visits.
- **Crew tab** replaced the separate Friends and Group tabs: friend activity on top, group vote below. Friend ratings show on cards ("Friends: ★4.7 (3)") only when friends have rated a spot.
- **Deals are sample data.** Each has a `lastChecked` date or shows "Sample, not checked yet". App-only deals (Uber Eats, DoorDash) link out instead of showing a price. Deals with no set days go under "Check the app" and never in Today's deals.
- **No rewards for reviews.** Planned incentives (badges, streaks, friend leaderboard) reward the act of reviewing, never the rating, and never with money or deals.
- **Accessibility is a baseline.** Contrast tokens were tuned to pass WCAG AA on every surface; each screen has one `<h1>` that receives focus; Back returns focus to the card you opened. See `AUDIT_PHASE5.md` before changing colors or focus behavior.

## Test switches (URL parameters)

| Switch | Effect |
|---|---|
| `?delay=500` | Adds latency to every data fetch, to see loading skeletons. |
| `?fail=1` | Makes every data fetch fail, to see error states and Try again. |
| `?today=mon` | Pretends today is that day (`sun`…`sat`), to review deals. |
| `?friendsVote=1` | Mock group members vote once there are two spots, to see Leading, Tied and Final. |

## Running the tests

**Data tests** (Node 18+; each prints "all checks passed" or fails with the assertion):

```
node tests/data/data.test.js
node tests/data/persist.test.js
node tests/data/deals.test.js
node tests/data/friends.test.js
```

**Browser tests** (Windows, Microsoft Edge, PowerShell):

```
powershell -ExecutionPolicy Bypass -File tests\run-browser.ps1
powershell -ExecutionPolicy Bypass -File tests\run-browser.ps1 -Only deals
```

- Each suite in `tests/browser/` is appended to a copy of `index.html` and opened in headless Edge with a fresh profile. It clicks through the app and prints what it observed as JSON.
- A suite fails if it produces no result or the page logs errors. Most suites **report** values rather than assert them, so read the JSON when you change related behavior.
- `responsive.html` checks for horizontal scroll at 320, 375, 768, 1280 and 1600px on every screen.

**Accessibility engine (axe-core) and Lighthouse** need the app over HTTP:

- Start the server with `node tests/tools/serve.js`. It serves the repo at `http://localhost:8765`.
- **Lighthouse:** with `CHROME_PATH` set to Edge's `msedge.exe`, run `npx lighthouse http://localhost:8765/ --chrome-flags="--headless=new"` (add `--preset=desktop` for desktop). Last scores: mobile 97/100/100/100, desktop 100/100/100/100 (performance, accessibility, best practices, SEO).
- **axe:** `tests/tools/axe.js` is a snippet that runs axe on 10 screens and states. Append it to a copy of `index.html` saved in the repo root (it uses `<base href="http://localhost:8765/">`), open it through the server, and delete the copy afterwards. Last result: no violations.

## Known loose ends

- **Cheesesteak deal is unlinked.** The "$7 cheesesteak sub on Tuesdays" sample deal sits in `TERP_DEALS_UNLINKED` with no spot. The owner will add the spot themselves; leave it alone and don't ask about it.
- **Profile placeholders.** The Friends (12) and Groups (4) numbers on Profile are static placeholders until accounts exist. Profile is also the least-rebuilt screen.
- **Manual accessibility pass.** Still to do: a real screen reader (VoiceOver, NVDA) and a keyboard-only pass. Focus on the review form's star radios, the sideways-scrolling chip rows, and the toast Undo.
- **Case-study page** still uses the old styling (gradients, pure white). It's out of the app's scope.

## How the owner likes to work

- **Stop after each step for review.** Break big work into steps, finish one, summarize it, and wait for a go-ahead.
- **Commit per step**, with a clear message. Push when asked. The owner reviews and merges pull requests themselves: never merge.
- **Don't invent data.** Use `null` and show nothing, or label clearly as mock or sample. If a message contains an unfilled template placeholder (like `[spot name]`), say so instead of guessing.
- **Ask before adding new features.** Fixes and polish within the agreed scope are fine; new features or screens need a yes first.
- Keep the stack vanilla (no framework or build step) unless the owner agrees otherwise. Keep API keys out of the frontend.

## Next up: `GOOGLE_PLACES_PLAN.md`

The plan already exists in the repo root. **Read `GOOGLE_PLACES_PLAN.md` in full, then start with Step 0.**

- **Step 0 is setup the owner does by hand:** a Google Cloud project with billing, Places API (New), a key restricted to it, quota caps and a budget alert, a Cloudflare account with Wrangler, and the key stored as a Worker secret.
  - Walk the owner through each item; don't do them for them.
  - Never ask for the key, and never put it in the repo or a commit.
- **After Step 0, work one step at a time** (Worker, photos, data layer swap, re-keying content, Google requirements, verify) on a new `google-places` branch. Commit at the end of each step and stop for review.
- **The plan's ground rules add to the working style above:**
  - Don't store or cache Google's data beyond the session (only `place_id` may be stored).
  - Report the field-mask billing tier before it's approved.
  - Quota or Worker failures must fall back to the error state.
- The Map view stays out of this phase. It's listed under "Later" in the plan.
