# TerpTaste UI Upgrade Plan

## Context for the agent
TerpTaste is a restaurant discovery app for UMD students. It solves three problems: decision fatigue, group coordination friction, and distrust of anonymous reviews. It's currently a static HTML/CSS/JS site hosted on GitHub Pages (dabarjel.github.io/TerpTaste/) using hardcoded College Park restaurant data.

This round is **UI only**. The backend comes later, most likely using the Google Places API for real restaurants. So every UI decision should make that swap easy later.

Use the frontend-design skill for all visual and layout decisions.

## Ground rules
- Keep the current stack (vanilla HTML/CSS/JS). Don't add a framework or build step without asking me first.
- Work on a new branch: `ui-overhaul`.
- Commit at the end of each phase with a clear message. Stop after each phase and show me what changed before moving on.
- Don't touch the backend, API keys, or any Google setup. That's a later phase.
- Keep all existing features working: Saved Spots, check-ins, and group voting.

## Chosen direction: A, Signage (decided 2026-09-29)
Reference: `styleguide.html` and `css/tokens.css`.
- **Palette:** Asphalt `#1A1B1D` page, Curb `#25262A` surfaces, Lane line `#3A3B40` borders, Chalk `#EFEDE8` text. Terp Red `#E21833` is for actions and the current selection only. Gold `#FFD200` is for ratings and the vote leader only.
- **Type:** Big Shoulders Display for names, titles and vote counts. Inter for body, buttons and labels, in sentence case. IBM Plex Mono only for numbers people compare (price, distance, walk time, vote totals), never for labels.
- **Surfaces:** flat, no borders on cards, small radii (6px cards, 8px controls, 10px sheets), no drop shadows except floating layers.
- **Signature ideas (keep on every screen they apply to):**
  1. **Walk-time layout.** Discover is grouped by walk time from campus ("Under 10 min walk", "10 to 20 min walk", "Worth the drive") instead of "For You / More nearby". Each spot appears once.
  2. **Scoreboard vote.** Big Shoulders counts, gold bar and count on the leader, "Your vote" tag, status reads "Leading" until everyone has voted, then "Final". The count flip is the app's only signature motion.
  3. **Type-based photo fallback.** Cuisine name in cropped Big Shoulders bleeding off the tile. Replaces the emoji-on-gradient tiles.
- **Avoid:** all-caps tracked section labels, "A · B · C" meta strings (use aligned data columns), "→" on button text, hover-lift on every card.

## Phase 0: Audit
1. Read the whole repo and list every page, component, and script.
2. Find where restaurant data lives and how each page reads it.
3. List current UI problems (inconsistent spacing, hardcoded colors, broken mobile layouts, missing states, etc).
4. Give me a short summary and wait for my go-ahead.

## Phase 1: Design system ✅ (commit a8baa51)
Done: `css/tokens.css` and `styleguide.html`. Step 2 (migrating `css/app.css` to the new tokens) moved to Phases 3–4, because every screen gets rebuilt there and swapping tokens into the old CSS would be thrown away.

1. Create `css/tokens.css` as the single source of truth:
   - Colors: dark backgrounds, UMD Terp Red accent, gold for ratings, plus neutrals, success/error, and border colors
   - Type: Big Shoulders Display (headings), Inter (body), IBM Plex Mono (data like prices, distances, vote counts)
   - Type scale, spacing scale, radii, shadows, motion durations and easings
2. Replace every hardcoded color, font size, and spacing value in the existing CSS with tokens.
3. Build a simple `styleguide.html` page that shows every token and base component, so I can review the system in one place.

## Phase 2: Data layer prep (sets up the Google API swap) ✅
Done:
- `js/data/mock-places.js` has Google-shaped place records. Unknown fields (address, location, rating, userRatingCount, openingHours) are `null`, not invented.
- `js/data/terp-content.js` has TerpTaste-owned content keyed by place id. `review.isFriend` is ready for the trust-label fix in Phase 3.
- `js/data/restaurants.js` provides `TerpData.getRestaurants(filters)` / `getRestaurant(id)` plus user state (saved, check-ins, group vote). `fetchPlaces()` is the only function the proxy swap replaces.
- `?delay=500` adds latency; `?fail=1` forces the error path.
- `js/app.js` reads only through `TerpData`. Phase 2 has no visible change, except that the detail wait pill now always reads "~N min wait". Minimal "Loading…" and "Try again" placeholders stand in until Phase 3's components.


1. Create `js/data/restaurants.js` with one async function: `getRestaurants(filters)` that returns a Promise.
2. For now it reads the local mock data. Later it'll call a backend proxy that talks to Google Places. The UI should never know the difference.
3. Normalize the mock data to match fields Google Places returns:
   - `id`, `name`, `address`, `location { lat, lng }`, `rating`, `userRatingCount`, `priceLevel`, `types` (cuisine/category), `photos`, `openingHours`, `isOpenNow`
   - Keep TerpTaste-only fields separate: `saved`, `checkIns`, `groupVotes`, `studentTags`
4. Add a fake delay option (like 500ms) so loading states can be tested.
5. Refactor every page to use `getRestaurants()` instead of reading data directly.

## Phase 3: Components
Built in four groups, with a stop for review after each:
1. ✅ Restaurant card, photo fallback, loading/empty/error states (`js/ui/components.js`, `css/components.css`)
2. ✅ Search bar and filter chips, with the Filter panel actually filtering
3. ✅ Detail view, check-in, Saved Spots (includes Back-to-origin, persistent check-in state, and Undo from Phase 4)
4. ✅ Group Vote scoreboard and nav, with Saved in the mobile nav

Build or rebuild these as reusable pieces using tokens only:
- Restaurant card (photo, name, cuisine, price, rating, distance, open/closed badge, save button)
- Search bar and filter chips (cuisine, price, open now, distance, rating)
- Restaurant detail view (photos, hours, address, student check-ins, save, add to group vote)
- Saved Spots list
- Check-in button and check-in feed
- Group voting (create a vote, add options, vote, see results)
- Nav bar (mobile bottom nav, desktop top nav)
- **Every data view needs three states:** loading skeleton, empty state, and error state. These matter a lot once real API calls are involved.
- Photo fallback for restaurants with no image (type-based tile from the styleguide)
- Replace old `css/app.css` values with `css/tokens.css` as each component is rebuilt; delete unused legacy rules.

Priority fixes from the UX heuristics review (2026-09-29), component level:
- **Filters that work.** One shared filter state used by both the Home chips and the Filter screen. "Show results" applies it, Home shows which filters are active, and a filter with no matches shows the empty state with "Clear filters".
- **No dead controls.** Every control is a real `<button>` with a label. Finish or remove "🔥 Same", "Invite friends by link" and "Add another option". Feed "Save spot" toggles and shows saved state.
- **Honest trust labels.** "*Name* checked in" and "From your people" only for actual friends; anonymous handles show as "Student review".
- **Scoreboard wording.** "Leading" plus "*n* of *m* have voted" until everyone votes, then "Final". Mark your pick with a "Your vote" tag.
- **Nav.** Saved gets a place in the mobile bottom nav.
- **Search bar** on Discover (name and dish), feeding the same filter state.

## Phase 4: Screens ✅
First, before the screens (stop for review after this):
0. ✅ **Highlighted dishes.** Every restaurant card shows up to 3 standout dishes as small tags under the name, on one line so the card stays compact; the row is hidden entirely when a spot has no dish data. The detail page shows the same dishes with more room. Source: `highlights` in `js/data/terp-content.js` (dishes the student review specifically recommends, all on the spot's menu). This is TerpTaste content, so it stays when Google Places data arrives.

0b. ✅ **Card cleanup.** Card order is name, then price / distance / walk time, then dish tags. The "checked in" / "Student review" trust line is off the cards; check-in stays on detail pages, and reviews stay on detail pages with their honest label.
0c. ✅ **Deals** (TerpTaste content, in `js/data/terp-content.js` under each place's `deals`). Each deal has title, price (or null), days of the week, where it applies (`in-store` / `uber-eats` / `doordash`), `lastChecked` (date, or null if nobody has checked it), and `sample` (true until confirmed).
   - "Today's deals" strip at the top of Discover, based on the current day; hidden when there are none today.
   - Small "Deal today" tag on the card tile when that spot has a deal today.
   - "Deals" section on the detail page listing all of the spot's weekly deals.
   - Deals tab replaces Friends in the sidebar and mobile nav, grouped by day with today first ("No deals today" when today is empty).
   - App deals (Uber Eats / DoorDash) link out ("Check the price on Uber Eats") and never show a price.
   - Every deal shows "Last checked [date]", or "Sample, not checked yet" while unconfirmed. A banner on the Deals tab says the deals are samples.
   - Test switch `?today=mon` (any day) previews a different day.
   - Deals with no set days are listed under **"Check the app"** on the Deals tab ("Days vary, check the app" on detail) and never in Today's deals.
   - **Sample data:** Marathon Deli ($7 gyros, Mondays, in store) and Five Guys (buy one, get one on Uber Eats, no set days) are linked. Five Guys was added as a spot with only known facts (burgers, fast food); its price level and distance are null until Google Places supplies them. **Still waiting on you:** the $7 cheesesteak sub on Tuesdays stays in `TERP_DEALS_UNLINKED` until the spot is named.
0d. ✅ **Crew and friend recommendations** (friend recommendations are the core of TerpTaste). Mock friends and their visits live in `js/data/mock-friends.js`; see the future notes for real friends.
   - **Crew tab** replaces Group in both navs: friend activity on top (who went where, when, their star rating, what they got, their note, with Save spot and Add to group vote), group vote below. The old Friends and Group screens are merged into it.
   - **Cards** show "Friends: ★4.7 (3)" only when friends have rated the spot.
   - **Detail page:** "Your review" (if you've posted one), then "Friends who've been" with each friend's rating, dish and note, then the student review (only when it isn't by a friend, since friends' reviews already appear above).
   - **Discover:** "Your friends love" row of friends' top-rated spots (average 4+), hidden when there are none.
   - **Quick review = the visit.** One action on the detail page, **"I went here"**, opens the review: star rating, what you got (pick from the menu or type it), optional one line. Rating and dish are required; posting and updating offer Undo. The review is what shows in Crew. There is no separate check-in anymore. Check-ins saved before this change still load as visits ("Not rated yet" in Profile, with a prompt on the detail page to add a rating), and Profile counts all of them as Visits.
   - **Dishes feed highlights:** a dish rated 4+ by friends or you becomes a standout dish; most-mentioned first, then the curated picks, capped at 3.
   - **Mock ratings:** the friend posts had no star ratings, so mock ratings were chosen to match each post's tone, plus three rating-only mock visits so a multi-friend average shows. All clearly marked in `mock-friends.js`.
0e. **Review incentives (plan only, not built).** Badges (for example first review, 10 spots tried, every cuisine on Route 1), streaks (weeks in a row with a review), and a friend leaderboard (reviews or new spots tried this month, among friends only). **Rule: no discounts, deals or rewards of any kind tied to reviews or to the rating given**, since that biases reviews. Incentives reward the act of reviewing, never the score, and never with money.

Rebuild each page with the new components:
1. ✅ Home / Discover: header rebuilt (Big Shoulders title, "Near UMD College Park. Walk times are from McKeldin Mall." instead of the green "live location" dot, which implied tracking that doesn't exist). Below Today's deals, search and chips: "Your friends love" row, then every spot exactly once in walk-time bands: Under 10 min walk, 10 to 20 min walk, Worth the drive, Distance not listed yet. "For You / Budget / More nearby / Worth the trip" and "For You — based on your preferences" are gone.
2. ✅ Search results: any search or filter shows a count ("2 spots for noodle") and Clear filters, then the same walk-time bands, nearest first.
3. Restaurant detail: ✅ done in Phase 3 group 3: "Back" returns to wherever the user came from (Saved, Friends, Group, Surprise me), not always Home. Check-in has since merged into "I went here" (see 0d).
4. Saved Spots: ✅ done in Phase 3 group 3: removing a spot shows an Undo action in the toast.
5. Group vote flow: ✅ done in Phase 3 group 4: scoreboard board; the picker offers every restaurant (not just the first 12); options can be removed.
✅ "Surprise me" picks at random from the current results (so search and filters apply), never the same spot twice in a row. It is now a regular button; gold stays reserved for ratings and the vote leader.
✅ **List / Map toggle** in the Discover header. List is active; Map is disabled and labelled "Soon" until the Google Maps view exists (see future notes). No dead button.

## Phase 5: Polish ✅
Done (2026-09-29), including an accessibility audit (WCAG 2.1 A/AA) and a craft review, with every finding fixed:
- **Responsive:** no horizontal scroll on any screen at 320, 375, 768, 1280 and 1600px (checked on Discover, Filter, Crew, Deals, Saved, Profile and a detail page).
- **Contrast (1.4.3, 1.4.11):** muted text raised to `#989792`, red text/icons use `--action-text` `#ED6E7F`, control outlines (chips, inputs, outlined buttons, unselected stars) use `--control-border` `#79797D`, and text on red is `#FFFCF8`. Every pair now passes on every surface.
- **Structure (1.3.1, 2.4.1, 2.4.2, 2.4.6):** skip link, a `<main>` landmark, one `<h1>` per screen, per-screen page titles ("Deals | TerpTaste", spot name on detail), decorative SVGs hidden from assistive tech.
- **Focus (2.4.3, 2.4.7):** navigating focuses the screen heading; opening a spot focuses its name; Back returns focus to the card you opened; visible focus ring on everything; the sticky header no longer hides focused items.
- **Status and errors (3.3.1, 4.1.3):** whole-list live regions removed (counts and statuses announce instead); review errors are linked to the field with `aria-invalid` and `aria-describedby`.
- **Timing (2.2.1):** the Undo toast pauses while hovered or focused and Escape closes it. Your review can also be removed from its edit form ("Remove review"), not only through Undo.
- **Text spacing and size (1.4.12, 1.4.4):** dish rows size in `em`; Profile's 10–11px uppercase labels are now readable sizes.
- **Motion:** every animation and transition is off under `prefers-reduced-motion`; the vote flip is 240ms.
- **Craft:** documented z-index scale (sticky, toast, skip link), spacing back on the 4px scale, pressed (`:active`) and missing hover states designed, layered low-alpha overlay shadow, tabular numbers on Profile stats, no inline styles, unused legacy tokens removed.
- **Performance:** unused font weight dropped (Big Shoulders 600), font stylesheet preloaded, images lazy-load, no unused CSS classes.
- Out of scope: `case-study.html` / `css/case-study.css` (the separate case-study page) still uses gradients and pure white; it wasn't part of the app review.

Original checklist:
- Responsive at 375px, 768px, 1280px, and wider. No horizontal scroll on mobile.
- Accessibility: color contrast passes WCAG AA, keyboard navigation works, visible focus states, alt text, proper labels on buttons and inputs.
- Motion: subtle hover and transition effects, and respect `prefers-reduced-motion`.
- Performance: lazy-load images, preload fonts, no unused CSS.

## Phase 6: Verify
1. Test every page at the breakpoints above.
2. Confirm Saved Spots, check-ins, and group voting all still work.
3. Flip the fake delay on and confirm loading skeletons show. Force an error and confirm the error state shows.
4. No console errors.
5. Run Lighthouse and report scores.
6. Give me a summary of what changed and anything left undone.

## Not in this round (next phase notes)
- The Google Places API key **can't** live in frontend code on GitHub Pages. Anyone could grab it and run up charges. The next phase needs a small proxy (like a Cloudflare Worker or Vercel serverless function) that holds the key and calls Places for us.
- Once the proxy exists, only `js/data/restaurants.js` should need to change.
- **Real friends need accounts and a backend.** Today the friends, their visits and the group vote members are mock data in the browser, and your own reviews live only in localStorage. Real friend recommendations need: user accounts (sign-in, ideally UMD email), a friend graph (requests, accept, remove, block), reviews and check-ins stored server-side, a real group vote that friends join by link, privacy controls (who sees your activity), and reporting/moderation for reviews. Once that exists, `js/data/mock-friends.js` goes away and only the data layer changes.
- **Move deals and dishes out of code.** Deals and highlighted dishes currently live in `js/data/terp-content.js`, so every change is a code change. Move them (and eventually the rest of TerpTaste's own content) to a small database with a simple admin form, so deals, `lastChecked` dates and dishes can be updated without touching code. Keep the same record shape so `js/data/restaurants.js` is the only file that changes. The admin form should set `lastChecked` when someone confirms a deal, and flip `sample` to false.
- **Map view (Google Places phase).** Discover gets a working List / Map toggle. The map **must be a Google Map** (Maps JavaScript API): Google Maps Platform terms require Places content shown on a map to be displayed on a Google Map, so no Leaflet/OpenStreetMap/Mapbox.
  - Markers come from each place's `location`; tapping one opens the same card, then the detail view.
  - The map uses the same shared filter state and search as the list, so switching views never changes the results.
  - Keep Google's required attributions visible (map attribution, and photo `authorAttributions` on cards and detail).
  - The Maps JavaScript API key is loaded in the browser by design, so it must be locked down: restrict it by HTTP referrer (the GitHub Pages domain) and to the Maps JavaScript API only. The Places key stays in the proxy.
  - Detail view can add a small Google Map of the spot's location in the same phase.
  - Map needs its own loading and error states (for example, key or quota errors fall back to the list with a message).
