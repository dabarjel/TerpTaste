# TerpTaste data contract

What the UI can rely on, and where each field comes from. The code is the authority: `js/data/restaurants.js` (the data layer), `js/data/mock-places.js`, `js/data/terp-content.js` and `js/data/mock-friends.js`. Update this file when any of them change shape.

## Rules

- **The data layer is the only way the UI gets data.** Screens call `TerpData.*` and never read the data files.
- **Google data is never stored.** Only `place_id` (`id`) may be saved (localStorage, files, the repo). Other Google fields live in memory for the session only.
- **Unknown is `null`.** Nothing is guessed. The UI shows nothing for a `null` field.
- **TerpTaste content is keyed by `id`** and never comes from Google.

## Place record (from Google, via the Worker)

This is the shape `fetchPlaces()` resolves to: an array of these. Today it's `MOCK_PLACES`; after Step 3 of `GOOGLE_PLACES_PLAN.md` it comes from the Worker, which must return exactly this shape. Field names follow Places API (New), with LocalizedText flattened to a string.

| Field | Type | Google source | Notes |
|---|---|---|---|
| `id` | string | `id` (place_id) | The only field that may be stored. Mock ids are short slugs until Step 4 re-keys them. |
| `name` | string | `displayName.text` | |
| `address` | string \| null | an address field (which one is decided in Step 1) | |
| `location` | `{lat, lng}` \| null | `location` (`latitude`/`longitude`) | Drives distance. `null` in mock data. |
| `rating` | number \| null | `rating` | |
| `userRatingCount` | number \| null | `userRatingCount` | |
| `priceLevel` | string \| null | `priceLevel` | `PRICE_LEVEL_INEXPENSIVE` … `PRICE_LEVEL_VERY_EXPENSIVE`. |
| `types` | string[] | `types` | |
| `primaryTypeDisplayName` | string \| null | `primaryTypeDisplayName.text` | Cuisine label, filters and photo-fallback word. **Not yet in the Step 1 field mask.** |
| `photos` | array | `photos` | Empty in mock data. The UI reads `photos[0].url`, which Step 2's `/photo` endpoint supplies. `authorAttributions` must be shown with any photo. |
| `openingHours` | object \| null | an opening-hours field (decided in Step 1) | The data layer reads `openingHours.openNow`. |
| `isOpenNow` | boolean \| null | derived | Mock-only fallback; the data layer prefers `openingHours.openNow`. |
| `_mockDistanceMiles` | number | none | Mock only. Stripped by the data layer and ignored once `location` exists. The Worker never sends it. |

## TerpTaste content (never from Google)

`TERP_CONTENT[id]` in `js/data/terp-content.js`. Every field is optional.

| Field | Type | Meaning |
|---|---|---|
| `studentTags` | string[] | Tags used by filters (e.g. `vegan`, `halal`, `fast`, `sitdown`, `late`). |
| `badge` | string | Short label on the card. |
| `hoursNote` | string | Student-written hours note (not Google hours). |
| `waitMinutes`, `waitNote` | number, string \| null | Wait estimate. |
| `priceRange` | string | Typical spend, e.g. `$10–$18`. |
| `review` | `{quote, author, authorCheckIns, isFriend}` | Featured student review. |
| `highlights` | string[] | Up to 3 curated dishes, all on the menu. |
| `menu` | string | Menu text; split into `menuItems` by the data layer. |
| `dietNotes` | string[] | Dietary notes. |
| `deals` | array | `{id, title, price, days, where, url?, lastChecked, sample}`. See the comment in `terp-content.js`. |

`TERP_DEALS_UNLINKED` holds deals with no spot yet. They aren't returned by `getDeals()`.

Friends and their visits are in `js/data/mock-friends.js` (`MOCK_FRIENDS`, `MOCK_FRIEND_ACTIVITY` keyed by `placeId`). Your own saved spots, reviews, older check-ins and group vote are in localStorage under `terptaste:user:v1`, keyed by place `id`.

## What `getRestaurants(filters)` returns

A promise of an array of restaurants. Each is the place record (without `_mockDistanceMiles`) plus:

| Field | Meaning |
|---|---|
| `isOpenNow` | `true`/`false` from hours data, else `null`. |
| `distanceMiles` | Straight-line miles from McKeldin Mall (38.9869, -76.9426), 1 decimal. From `location`, else the mock value, else `null`. |
| `terp` | Everything TerpTaste-only, below. |

`terp` holds all TerpTaste content fields above (with `studentTags` defaulting to `[]`), plus these derived ones:

| Field | Meaning |
|---|---|
| `highlights` | Up to 3: dishes friends (and you) rated 4+, most mentioned first, then curated picks. |
| `menuItems` | `menu` split into pickable items. |
| `deals` | Normalized deals. `dealsToday`: those whose `days` include today (or `?today=`). |
| `friendReviews` | Friends' visits here, newest first: `{who, placeId, rating, got, note, at}`. |
| `friendRating` | `{avg, count}` or `null` when no friend has rated it. |
| `myReview` | `{rating, got, note, date}` or `null`. |
| `saved` | boolean. |
| `visited` | `{id, at, date, rating, got}` (rating/got `null` for older check-ins) or `null`. |
| `groupVotes` | Vote count if the spot is in the group vote, else `null`. |

**Filters** (all optional): `ids`, `openNow`, `priceLevels`, `studentTags` (all must match), `anyStudentTags` (any), `cuisines`, `maxDistanceMiles`, `query` (name, cuisine, menu), `savedOnly`, `friendsLove` (friend avg 4+), `sort` (`'distance'` | `'friends'` | source order). `openNow` and `maxDistanceMiles` never match unknown values.

**Other reads:** `getRestaurant(id)` (one restaurant, rejects if unknown), `getFacets()` (`{hasHours, cuisines, priceLevels, studentTags}`, so the UI only offers options backed by data), `getDeals()` (every deal with its restaurant as `.place`), `getActivity()` (friends' visits plus your reviews, newest first, each with `.place`). Every read rejects under `?fail=1`, and the UI shows the error state with Try again.
