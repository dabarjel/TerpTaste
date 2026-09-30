# TerpTaste

Restaurant discovery for UMD College Park students. Read `HANDOFF.md` first for current state and next steps.

- Design rules: `DESIGN.md`. Data contract: `DATA.md`. Current plan: `GOOGLE_PLACES_PLAN.md`.

## Stack

- Static site: vanilla HTML, CSS and JS. No framework, no build step. Hosted on GitHub Pages (`dabarjel.github.io/TerpTaste/`).
- Data comes only through `js/data/restaurants.js` (`TerpData.*`). Screens never read mock files directly.
- Planned backend: one Cloudflare Worker (`worker/`) that proxies Google Places (New) and holds the key.

## Tests

Data tests (Node 18+, each prints "all checks passed"):

```
node tests/data/data.test.js
node tests/data/persist.test.js
node tests/data/deals.test.js
node tests/data/friends.test.js
```

Browser tests (Windows, headless Edge):

```
powershell -ExecutionPolicy Bypass -File tests\run-browser.ps1
powershell -ExecutionPolicy Bypass -File tests\run-browser.ps1 -Only deals
```

Most browser suites report JSON rather than assert: read the output when you change related behavior.

axe and Lighthouse: start `node tests/tools/serve.js` (serves `http://localhost:8765`), then see `HANDOFF.md` > Running the tests.

## Conventions

- CSS values come from `css/tokens.css`. Component classes use the `tt-` prefix.
- UI functions in `js/ui/components.js` are pure and escape all interpolated text.
- Unknown data is `null`, and the UI shows nothing for it.
- Test switches: `?delay=500`, `?fail=1`, `?today=mon`, `?friendsVote=1`.
- Commit per step with a clear message. Push only when asked.

## Never do

- Never commit API keys or `.dev.vars`. Keys live only as Worker secrets.
- Never store Google data except `place_id` (no localStorage, files or repo). In-memory for the session is fine.
- Never invent data. Use `null`, or label it clearly as mock or sample. If a message has an unfilled placeholder (like `[spot name]`), say so instead of guessing.
- Never merge pull requests. The owner reviews and merges.
- No gradients (or glows). See `DESIGN.md`.
- Never run ahead: stop after each step for review and wait for a go-ahead.
- Don't add features or screens without asking first.
