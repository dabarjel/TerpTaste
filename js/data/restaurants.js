// ── TerpTaste data layer ──────────────────────────────────────────────────────
// The only file the UI talks to for restaurant data. Today it reads the local mock
// (MOCK_PLACES + TERP_CONTENT); later fetchPlaces() calls the backend proxy that holds
// the Google Places key, and nothing outside this file changes.
//
// Restaurant shape returned by getRestaurants() / getRestaurant():
//   Google Places fields
//     id, name, address, location {lat,lng}, rating, userRatingCount, priceLevel,
//     types, primaryTypeDisplayName, photos, openingHours, isOpenNow
//   Derived here
//     distanceMiles   straight-line miles from campus (from location, or the mock value)
//   TerpTaste-only (never from Google), under .terp
//     saved, checkIns, groupVotes, studentTags,
//     badge, hoursNote, waitMinutes, waitNote, priceRange, review, menu, dietNotes
//
// Test switches (URL params): ?delay=500 adds latency, ?fail=1 makes every fetch reject.

const TerpData = (() => {
  const params = new URLSearchParams(location.search);
  const config = {
    delayMs: Number(params.get('delay')) || 0,
    fail: params.get('fail') === '1',
  };

  const CAMPUS = { lat: 38.9869, lng: -76.9426 }; // McKeldin Mall, UMD College Park

  // ── User state (TerpTaste-only; in memory until there's a backend) ─────────
  const user = {
    saved: new Set(),
    checkIns: [],                                    // [{id, date}], newest first
    vote: { options: ['habanero','qu','aroy'], counts: { habanero:3, qu:1, aroy:0 }, mine: 'habanero' },
  };

  // ── Source ──────────────────────────────────────────────────────────────────
  // Swap point: replace the body with a fetch to the proxy that returns the same shape.
  function fetchPlaces() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (config.fail) reject(new Error('Restaurants could not be loaded (fail=1 test switch).'));
        else resolve(MOCK_PLACES);
      }, config.delayMs);
    });
  }

  function milesBetween(a, b) {
    const toRad = d => d * Math.PI / 180, R = 3958.8;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function toRestaurant(place) {
    const { _mockDistanceMiles, ...fields } = place;
    const content = TERP_CONTENT[place.id] || {};
    const distanceMiles = place.location
      ? Math.round(milesBetween(CAMPUS, place.location) * 10) / 10
      : (_mockDistanceMiles ?? null);
    return {
      ...fields,
      distanceMiles,
      terp: {
        studentTags: [],
        ...content,
        saved: user.saved.has(place.id),
        checkIns: user.checkIns.filter(c => c.id === place.id).length,
        groupVotes: user.vote.options.includes(place.id) ? (user.vote.counts[place.id] || 0) : null,
      },
    };
  }

  // filters (all optional):
  //   ids            string[]  only these places, returned in this order
  //   openNow        boolean
  //   priceLevels    string[]  e.g. ['PRICE_LEVEL_INEXPENSIVE']
  //   studentTags    string[]  every tag must match, e.g. ['vegan','halal']
  //   maxDistanceMiles number
  //   query          string    matches name, cuisine, menu
  //   savedOnly      boolean
  //   sort           'distance' | undefined (source order)
  async function getRestaurants(filters = {}) {
    let list = (await fetchPlaces()).map(toRestaurant);
    const f = filters;
    if (f.ids) {
      const byId = new Map(list.map(r => [r.id, r]));
      list = f.ids.map(id => byId.get(id)).filter(Boolean);
    }
    if (f.openNow) list = list.filter(r => r.isOpenNow);
    if (f.priceLevels?.length) list = list.filter(r => f.priceLevels.includes(r.priceLevel));
    if (f.studentTags?.length) list = list.filter(r => f.studentTags.every(t => r.terp.studentTags.includes(t)));
    if (f.maxDistanceMiles != null) list = list.filter(r => r.distanceMiles != null && r.distanceMiles <= f.maxDistanceMiles);
    if (f.savedOnly) list = list.filter(r => r.terp.saved);
    if (f.query) {
      const q = f.query.trim().toLowerCase();
      list = list.filter(r => [r.name, r.primaryTypeDisplayName, r.terp.menu].some(s => s && s.toLowerCase().includes(q)));
    }
    if (f.sort === 'distance') list = list.slice().sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));
    return list;
  }

  async function getRestaurant(id) {
    const [r] = await getRestaurants({ ids: [id] });
    if (!r) throw new Error(`No restaurant with id "${id}".`);
    return r;
  }

  // ── User actions ────────────────────────────────────────────────────────────
  function toggleSaved(id) { user.saved.has(id) ? user.saved.delete(id) : user.saved.add(id); return user.saved.has(id); }
  function setSaved(id, on) { on ? user.saved.add(id) : user.saved.delete(id); return on; }
  function savedIds() { return [...user.saved]; }

  function addCheckIn(id, date = 'Today') {
    if (user.checkIns.some(c => c.id === id)) return false;
    user.checkIns.unshift({ id, date });
    return true;
  }
  function checkInHistory() { return user.checkIns.slice(); }

  function getVote() { return { options: user.vote.options.slice(), counts: { ...user.vote.counts }, mine: user.vote.mine }; }
  function addVoteOption(id) {
    if (user.vote.options.includes(id)) return false;
    user.vote.options.push(id); user.vote.counts[id] = 0;
    return true;
  }
  function castVote(id) {
    const v = user.vote;
    if (v.mine) v.counts[v.mine] = Math.max(0, (v.counts[v.mine] || 1) - 1);
    v.mine = id; v.counts[id] = (v.counts[id] || 0) + 1;
  }

  return {
    config,
    getRestaurants, getRestaurant,
    toggleSaved, setSaved, savedIds,
    addCheckIn, checkInHistory,
    getVote, addVoteOption, castVote,
  };
})();
