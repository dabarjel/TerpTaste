# TerpTaste Phase 7: Real Restaurants with Google Places

## Goal
Replace the mock restaurant data with real nearby restaurants and photos from the Google Places API (New). The UI shouldn't change. Only `fetchPlaces()` in `js/data/restaurants.js` should need to swap.

## Ground rules
- Work on a new branch: `google-places`.
- Stop after each step so I can review. Commit at the end of each step.
- The Places API key never goes in frontend code, the repo, or a commit. It only lives as a secret in the proxy.
- Don't store or cache Google's data (names, ratings, photos, hours) in localStorage, files, or the repo. Only `place_id` can be stored. Keeping results in memory for the current session is fine.
- If the proxy fails or hits its quota, the app falls back to the error state with Try again. It never breaks.
- Keep every existing feature working: saved spots, reviews, Crew, deals, group vote.

## How it fits together
GitHub Pages (the app) → Cloudflare Worker (holds the key) → Google Places API (New)

The Worker returns JSON in the same shape as `js/data/mock-places.js`, so the rest of the app doesn't know the difference.

## Step 0: Setup I do myself (don't do these for me)
Walk me through these, but I'll do them by hand:
1. Create a Google Cloud project, add billing, and enable Places API (New).
2. Create an API key restricted to Places API (New) only.
3. Set daily quota caps on the Places API so a bug or bot can't run up a bill. Also add a budget alert.
4. Create a free Cloudflare account and install Wrangler.
5. Store the key as a Worker secret, and for local `wrangler dev` in `worker/.dev.vars`. Do this only after Step 1's first item has put `.dev.vars` in `.gitignore`.

## Step 1: Build the Worker
1. Before anything else, add `.dev.vars` (and `worker/.dev.vars`) to `.gitignore` and commit that, before any secret or `.dev.vars` file is created. Confirm with `git check-ignore worker/.dev.vars`.
2. Create a `worker/` folder with the Cloudflare Worker code. It must run locally with `wrangler dev`, reading the key from `worker/.dev.vars`, so it can be tested without deploying.
3. One endpoint, `/places`, that runs Nearby Search (New) around UMD.
   - Nearby Search returns a max of 20 results with no pagination, so run a few searches (campus, Route 1, downtown College Park) and merge them, removing duplicates by `place_id`.
   - Restaurant-type places only.
4. Keep the field mask minimal. Only request fields the app actually shows: id, name, address, location, rating, rating count, price level, types, opening hours, photos. Check the docs for which billing tier each field lands in and tell me the tier before I approve.
5. CORS: only allow requests from dabarjel.github.io.
6. Add basic rate limiting so one user can't burn the quota.
7. Return data normalized to the mock-places format (see `DATA.md`).
8. Test fixtures, so tests never use quota:
   - Capture a few real Nearby Search responses once, through `wrangler dev`.
   - Google data can't be stored (see Ground rules), so raw responses never get saved to disk. Keep the real structure and field set, but replace every value with clearly fake ones (names like "Fixture Place 1", made-up ids and coordinates), and commit only that scrubbed version under `worker/test/fixtures/`.
   - Worker tests run against the fixtures with `fetch` stubbed, and make no network calls.
9. Contract test: run the Worker's normalizer on the fixtures and check every record matches the `mock-places.js` shape. That means the same keys, each value the same type or `null`, no `_mockDistanceMiles`, and no extra fields. Run it next to the data tests (`node worker/test/contract.test.js`).

## Step 2: Photos
1. Add a `/photo` endpoint that calls Place Photos (New) with `skipHttpRedirect=true`, so the app gets a plain image URL and the key never reaches the browser.
2. Photo names expire and can't be stored. Always use fresh ones from the latest search.
3. Photos bill separately per request. Only request a photo when a card scrolls into view. Cards off screen keep the type-based fallback.
4. Show `authorAttributions` credits wherever a photo appears, when that field isn't empty.

## Step 3: Swap the data layer
1. Replace `fetchPlaces()` so it calls the Worker.
2. Add a `?mock=1` switch that uses the old mock data, for testing and demos without spending quota.
3. Keep results in memory for the session so switching screens doesn't re-fetch.
4. Distance and walk time are calculated from real coordinates, measured from McKeldin Mall.
5. Turn the Open Now filter back on automatically now that hours exist (the logic is already there).

## Step 4: Re-key TerpTaste content
1. Find the real `place_id` for each of the current spots.
2. Re-key `terp-content.js` (dishes, deals, student reviews) and `mock-friends.js` to those IDs.
3. Migrate anything stored in the browser under the old IDs (saved spots, reviews, vote) so nothing is lost.
4. List any spot that couldn't be matched so I can decide what to do.

## Step 5: Google requirements
1. Show the Google logo with Places data when no Google Map is on screen, following Google's attribution guidelines.
2. Add a simple Terms and Privacy page, linked in the footer, that includes Google's Terms of Service and Privacy Policy.
3. Photo credits from Step 2 are visible.

## Step 6: Verify
1. Test with the real Worker and with `?mock=1`.
2. Test the quota-hit and Worker-down cases. The app should show the error state, not break.
3. Search the repo and git history to confirm the API key is nowhere in it.
4. Check how many billable requests one Discover load makes, and estimate monthly usage for normal traffic.
5. Rerun the earlier browser tests, Lighthouse, and axe.
6. Summarize what changed and open a pull request link into main. Don't merge.

## Step 7: Adversarial audit
I run this myself in a fresh session, before merging the Step 6 pull request. The session gets no context from building the Worker. It uses two personas:
- **Hacker:** tries to get the key or misuse the Worker.
- **QA:** tries to break the app through the Worker's failure modes.

It focuses on three things:
1. **Key leaks:** the key in the repo, git history, frontend code, the built Worker, responses, error messages, logs, response headers, or photo URLs. `.dev.vars` ignored and never committed.
2. **Quota abuse:** getting around the rate limit (rotating IPs, headers, parallel requests), making `/places` or `/photo` fan out into many billable calls, requesting photos in a loop. Daily caps and budget alert confirmed in Google Cloud.
3. **CORS:** requests from other origins, `null` origin, look-alike domains (like `dabarjel.github.io.evil.com`), missing Origin (curl), preflight handling. CORS only guards browsers, so check what a non-browser client can still do.

Findings get ranked by severity, fixed on the `google-places` branch, and rechecked. Then it stops for my review.

## Later (not this phase)
- **Map view:** must be a Google Map, since Places data on a map has to be on a Google Map. Uses a separate Maps JavaScript key that's restricted to my domain. Shares the list's filters and search.
- **Accounts and real friends:** backend, friend graph, reviews stored on a server, group vote joined by link.
- **Deals and dishes database** with an admin form so I can update them without code.
