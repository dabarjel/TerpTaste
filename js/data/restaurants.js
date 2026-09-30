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
// Test switches (URL params): ?delay=500 adds latency, ?fail=1 makes every fetch reject,
// ?friendsVote=1 has the mock group members vote so Leading/Final can be reviewed.

const TerpData = (() => {
  const params = new URLSearchParams(location.search);
  const config = {
    delayMs: Number(params.get('delay')) || 0,
    fail: params.get('fail') === '1',
    friendsVote: params.get('friendsVote') === '1',
  };

  const CAMPUS = { lat: 38.9869, lng: -76.9426 }; // McKeldin Mall, UMD College Park

  // ── User state (TerpTaste-only) ─────────────────────────────────────────────
  // Persisted to localStorage when available. Storage can be missing or throw (private
  // windows, blocked site data), so every access is wrapped and the app falls back to
  // in-memory state.
  const STORAGE_KEY = 'terptaste:user:v1';
  // Group vote session. Members are mock until there's a backend; only "me" votes for real.
  // options: [{id, addedBy}], votes: {memberId: placeId}. Starts empty.
  const MEMBERS = [
    { id:'me', name:'You',       initials:'DA' },
    { id:'ak', name:'Aisha K.',  initials:'AK' },
    { id:'jt', name:'Jordan T.', initials:'JT' },
    { id:'mr', name:'Marcus R.', initials:'MR' },
  ];
  const emptySession = () => ({ name: 'Friday dinner', options: [], votes: {} });
  const user = {
    saved: new Set(),
    checkIns: [],                                    // [{id, date}], newest first
    session: emptySession(),
  };

  function loadUser() {
    let data;
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (_) { return; }
    if (!data || typeof data !== 'object') return;
    const isStr = s => typeof s === 'string';
    if (Array.isArray(data.saved)) user.saved = new Set(data.saved.filter(isStr));
    if (Array.isArray(data.checkIns)) user.checkIns = data.checkIns.filter(c => c && isStr(c.id) && isStr(c.date));
    // Older saves kept a seeded "vote" object; it's ignored so the vote starts empty.
    const s = data.session;
    if (s && Array.isArray(s.options)) {
      const options = s.options.filter(o => o && isStr(o.id)).map(o => ({ id: o.id, addedBy: isStr(o.addedBy) ? o.addedBy : 'me' }));
      const ids = new Set(options.map(o => o.id));
      const votes = {};
      MEMBERS.forEach(m => { const v = s.votes && s.votes[m.id]; if (isStr(v) && ids.has(v)) votes[m.id] = v; });
      user.session = { name: isStr(s.name) ? s.name : 'Friday dinner', options, votes };
    }
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ saved: [...user.saved], checkIns: user.checkIns, session: user.session }));
    } catch (_) { /* storage unavailable: keep in-memory state */ }
  }
  loadUser();

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
    // Open status only when hours data says so. null = unknown; the UI shows nothing.
    const isOpenNow = typeof place.openingHours?.openNow === 'boolean' ? place.openingHours.openNow
      : typeof place.isOpenNow === 'boolean' ? place.isOpenNow
      : null;
    return {
      ...fields,
      isOpenNow,
      distanceMiles,
      terp: {
        studentTags: [],
        ...content,
        saved: user.saved.has(place.id),
        checkIns: user.checkIns.filter(c => c.id === place.id).length,
        lastCheckIn: user.checkIns.find(c => c.id === place.id)?.date ?? null,
        groupVotes: user.session.options.some(o => o.id === place.id)
          ? Object.values(user.session.votes).filter(v => v === place.id).length : null,
      },
    };
  }

  // filters (all optional):
  //   ids            string[]  only these places, returned in this order
  //   openNow        boolean
  //   priceLevels    string[]  e.g. ['PRICE_LEVEL_INEXPENSIVE']
  //   studentTags    string[]  every tag must match, e.g. ['vegan','halal']
  //   anyStudentTags string[]  at least one must match, e.g. ['fast','sitdown']
  //   cuisines       string[]  primaryTypeDisplayName is one of these
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
    if (f.openNow) list = list.filter(r => r.isOpenNow === true); // unknown hours never count as open
    if (f.priceLevels?.length) list = list.filter(r => f.priceLevels.includes(r.priceLevel));
    if (f.studentTags?.length) list = list.filter(r => f.studentTags.every(t => r.terp.studentTags.includes(t)));
    if (f.anyStudentTags?.length) list = list.filter(r => f.anyStudentTags.some(t => r.terp.studentTags.includes(t)));
    if (f.cuisines?.length) list = list.filter(r => f.cuisines.includes(r.primaryTypeDisplayName));
    if (f.maxDistanceMiles != null) list = list.filter(r => r.distanceMiles != null && r.distanceMiles <= f.maxDistanceMiles);
    if (f.savedOnly) list = list.filter(r => r.terp.saved);
    if (f.query) {
      const q = f.query.trim().toLowerCase();
      list = list.filter(r => [r.name, r.primaryTypeDisplayName, r.terp.menu].some(s => s && s.toLowerCase().includes(q)));
    }
    if (f.sort === 'distance') list = list.slice().sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));
    return list;
  }

  // What the current data can be filtered by, so the UI only offers options backed by data.
  //   hasHours     true once any place has real open/closed data (gates "Open now")
  //   cuisines     distinct primaryTypeDisplayName values, A–Z
  //   priceLevels  distinct priceLevel values, cheapest first
  //   studentTags  distinct TerpTaste tags
  async function getFacets() {
    const list = (await fetchPlaces()).map(toRestaurant);
    const uniq = xs => [...new Set(xs.filter(Boolean))];
    const PRICE_ORDER = ['PRICE_LEVEL_INEXPENSIVE','PRICE_LEVEL_MODERATE','PRICE_LEVEL_EXPENSIVE','PRICE_LEVEL_VERY_EXPENSIVE'];
    return {
      hasHours: list.some(r => typeof r.isOpenNow === 'boolean'),
      cuisines: uniq(list.map(r => r.primaryTypeDisplayName)).sort((a, b) => a.localeCompare(b)),
      priceLevels: uniq(list.map(r => r.priceLevel)).sort((a, b) => PRICE_ORDER.indexOf(a) - PRICE_ORDER.indexOf(b)),
      studentTags: uniq(list.flatMap(r => r.terp.studentTags)),
    };
  }

  async function getRestaurant(id) {
    const [r] = await getRestaurants({ ids: [id] });
    if (!r) throw new Error(`No restaurant with id "${id}".`);
    return r;
  }

  // ── User actions ────────────────────────────────────────────────────────────
  function toggleSaved(id) { user.saved.has(id) ? user.saved.delete(id) : user.saved.add(id); persist(); return user.saved.has(id); }
  function setSaved(id, on) { on ? user.saved.add(id) : user.saved.delete(id); persist(); return on; }
  function savedIds() { return [...user.saved]; }
  // Put a spot back at its old position (used by Undo after removing it).
  function restoreSaved(id, index) {
    const ids = [...user.saved].filter(x => x !== id);
    ids.splice(Math.max(0, Math.min(index, ids.length)), 0, id);
    user.saved = new Set(ids);
    persist();
  }

  function localDay(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function addCheckIn(id, date = localDay()) {  // YYYY-MM-DD, local time
    if (user.checkIns.some(c => c.id === id)) return false;
    user.checkIns.unshift({ id, date });
    persist();
    return true;
  }
  // Returns the removed entry so Undo can put it back with its original date.
  function removeCheckIn(id) {
    const i = user.checkIns.findIndex(c => c.id === id);
    if (i < 0) return null;
    const [removed] = user.checkIns.splice(i, 1);
    persist();
    return { ...removed, index: i };
  }
  function restoreCheckIn(entry) {
    if (!entry || user.checkIns.some(c => c.id === entry.id)) return;
    user.checkIns.splice(Math.min(entry.index ?? 0, user.checkIns.length), 0, { id: entry.id, date: entry.date });
    persist();
  }
  function checkInHistory() { return user.checkIns.slice(); }

  // ── Group vote ──────────────────────────────────────────────────────────────
  // state: 'empty' (no spots yet) | 'waiting' (no votes) | 'leading' (some voted) | 'final' (everyone voted)
  function getVote() {
    const s = user.session;
    const counts = {};
    s.options.forEach(o => { counts[o.id] = 0; });
    Object.values(s.votes).forEach(id => { if (id in counts) counts[id]++; });
    const votedCount = Object.keys(s.votes).length;
    const max = Math.max(0, ...Object.values(counts));
    const leaders = max > 0 ? s.options.filter(o => counts[o.id] === max).map(o => o.id) : [];
    const state = !s.options.length ? 'empty' : votedCount === 0 ? 'waiting' : votedCount >= MEMBERS.length ? 'final' : 'leading';
    return {
      name: s.name,
      members: MEMBERS.map(m => ({ ...m, voted: m.id in s.votes })),
      options: s.options.map(o => ({ id: o.id, addedBy: o.addedBy, mine: o.addedBy === 'me', count: counts[o.id] })),
      mine: s.votes.me || null,
      votedCount, total: MEMBERS.length, leaders, state,
    };
  }
  // Test switch only: mock friends vote so Leading/Final can be seen without a backend.
  function simulateFriends() {
    // Waits for two spots so the demo shows a real race rather than a unanimous pick.
    if (!config.friendsVote || user.session.options.length < 2) return;
    MEMBERS.slice(1).forEach((m, i) => {
      if (!(m.id in user.session.votes)) user.session.votes[m.id] = user.session.options[i % 2].id;
    });
  }
  function addVoteOption(id) {
    if (user.session.options.some(o => o.id === id)) return false;
    user.session.options.push({ id, addedBy: 'me' });
    simulateFriends();
    persist();
    return true;
  }
  // Only spots you added can be removed. Returns what Undo needs to put it back.
  function removeVoteOption(id) {
    const s = user.session;
    const index = s.options.findIndex(o => o.id === id && o.addedBy === 'me');
    if (index < 0) return null;
    const [option] = s.options.splice(index, 1);
    const votes = {};
    Object.entries(s.votes).forEach(([m, v]) => { if (v === id) { votes[m] = v; delete s.votes[m]; } });
    persist();
    return { option, index, votes };
  }
  function restoreVoteOption(snapshot) {
    if (!snapshot || user.session.options.some(o => o.id === snapshot.option.id)) return;
    user.session.options.splice(Math.min(snapshot.index, user.session.options.length), 0, snapshot.option);
    Object.entries(snapshot.votes).forEach(([m, v]) => { if (!(m in user.session.votes)) user.session.votes[m] = v; });
    persist();
  }
  function castVote(id) {
    if (!user.session.options.some(o => o.id === id)) return false;
    user.session.votes.me = id;
    simulateFriends();
    persist();
    return true;
  }
  // Start over; returns the old session so Undo can bring it back.
  function resetVote() {
    const old = JSON.parse(JSON.stringify(user.session));
    user.session = emptySession();
    persist();
    return old;
  }
  function restoreVote(old) { if (old) { user.session = old; persist(); } }

  return {
    config,
    getRestaurants, getRestaurant, getFacets,
    toggleSaved, setSaved, savedIds, restoreSaved,
    addCheckIn, removeCheckIn, restoreCheckIn, checkInHistory,
    getVote, addVoteOption, removeVoteOption, restoreVoteOption, castVote, resetVote, restoreVote,
  };
})();
