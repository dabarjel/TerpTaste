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

## Phase 0: Audit
1. Read the whole repo and list every page, component, and script.
2. Find where restaurant data lives and how each page reads it.
3. List current UI problems (inconsistent spacing, hardcoded colors, broken mobile layouts, missing states, etc).
4. Give me a short summary and wait for my go-ahead.

## Phase 1: Design system
1. Create `css/tokens.css` as the single source of truth:
   - Colors: dark backgrounds, UMD Terp Red accent, gold for ratings, plus neutrals, success/error, and border colors
   - Type: Big Shoulders Display (headings), Inter (body), IBM Plex Mono (data like prices, distances, vote counts)
   - Type scale, spacing scale, radii, shadows, motion durations and easings
2. Replace every hardcoded color, font size, and spacing value in the existing CSS with tokens.
3. Build a simple `styleguide.html` page that shows every token and base component, so I can review the system in one place.

## Phase 2: Data layer prep (sets up the Google API swap)
1. Create `js/data/restaurants.js` with one async function: `getRestaurants(filters)` that returns a Promise.
2. For now it reads the local mock data. Later it'll call a backend proxy that talks to Google Places. The UI should never know the difference.
3. Normalize the mock data to match fields Google Places returns:
   - `id`, `name`, `address`, `location { lat, lng }`, `rating`, `userRatingCount`, `priceLevel`, `types` (cuisine/category), `photos`, `openingHours`, `isOpenNow`
   - Keep TerpTaste-only fields separate: `saved`, `checkIns`, `groupVotes`, `studentTags`
4. Add a fake delay option (like 500ms) so loading states can be tested.
5. Refactor every page to use `getRestaurants()` instead of reading data directly.

## Phase 3: Components
Build or rebuild these as reusable pieces using tokens only:
- Restaurant card (photo, name, cuisine, price, rating, distance, open/closed badge, save button)
- Search bar and filter chips (cuisine, price, open now, distance, rating)
- Restaurant detail view (photos, hours, address, student check-ins, save, add to group vote)
- Saved Spots list
- Check-in button and check-in feed
- Group voting (create a vote, add options, vote, see results)
- Nav bar (mobile bottom nav, desktop top nav)
- **Every data view needs three states:** loading skeleton, empty state, and error state. These matter a lot once real API calls are involved.
- Photo fallback for restaurants with no image

## Phase 4: Screens
Rebuild each page with the new components:
1. Home / Discover
2. Search results
3. Restaurant detail
4. Saved Spots
5. Group vote flow
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
