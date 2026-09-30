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

## Phase 4: Screens
Rebuild each page with the new components:
1. Home / Discover: walk-time sections replace "For You / Budget / More nearby / Worth the trip"; each spot appears once. Drop "For You — based on your preferences" unless it actually uses the profile preferences.
2. Search results
3. Restaurant detail: ✅ done in Phase 3 group 3: "Back" returns to wherever the user came from (Saved, Friends, Group, Surprise me), not always Home. Check-in state persists when the page is reopened.
4. Saved Spots: ✅ done in Phase 3 group 3: removing a spot shows an Undo action in the toast.
5. Group vote flow: ✅ done in Phase 3 group 4: scoreboard board; the picker offers every restaurant (not just the first 12); options can be removed.
Also: "Surprise me" picks at random instead of stepping through the list in order.
Leave a placeholder spot on Discover and Detail for a map later. Don't build the map yet.

## Phase 5: Polish
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
