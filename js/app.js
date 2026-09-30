// Restaurant data comes only from TerpData (js/data/restaurants.js); markup from UI (js/ui/components.js).
const price = UI.price;

// Loading skeleton (only if the fetch takes over 150ms, so fast loads don't flicker),
// then render, or an error state with Try again.
function withLoading(el, promise, render, retry, skeleton = UI.skeletonCards(3)){
  const t = setTimeout(()=>{ el.innerHTML = `<div class="tt-gutter">${skeleton}</div>`; }, 150);
  return promise.then(v=>{ clearTimeout(t); render(v); }).catch(err=>{
    clearTimeout(t);
    console.error(err);
    UI.mount(el, `<div class="tt-gutter">${UI.errorState()}</div>`, { retry });
  });
}

// ── SAVE (every save button in the app goes through here) ────────────────────
// Keep every visible button for the same spot in step (card heart, detail, feed).
function syncSaveButtons(id){
  const on = TerpData.savedIds().includes(id);
  document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`).forEach(b=>UI.setSaveButton(b, on, b.dataset.name || ''));
}
function syncAllSaveButtons(){
  const saved = new Set(TerpData.savedIds());
  document.querySelectorAll('[data-save]').forEach(b=>UI.setSaveButton(b, saved.has(b.dataset.save), b.dataset.name || ''));
}
function afterSavedChange(id){
  syncSaveButtons(id);
  updateStats();
  if(activePanel()==='saved') renderSaved();
}
function toggleSavedWithUndo(id, name){
  const index = TerpData.savedIds().indexOf(id);
  const on = TerpData.toggleSaved(id);
  afterSavedChange(id);
  if(on){ showToast(`Saved ${name}`); return; }
  showToast(`Removed ${name} from saved`, { action:{ label:'Undo', run:()=>{
    TerpData.restoreSaved(id, index);
    afterSavedChange(id);
    showToast(`${name} is back in saved`);
  }}});
}

// Cards anywhere in the app: open on click, save with the heart.
document.addEventListener('click', e=>{
  const save = e.target.closest('[data-save]');
  if(save){ toggleSavedWithUndo(save.dataset.save, save.dataset.name || ''); return; }
  const open = e.target.closest('[data-open]');
  if(open) showDetail(open.dataset.open);
});

// ── NAV ───────────────────────────────────────────────────────────────────────
const pages = ['home','filter','crew','deals','saved','profile'];
const activePanel = () => (document.querySelector('.panel.active')?.id || '').replace('panel-','');
const scrollMemory = {};

function showPanel(id){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
}
function highlightNav(id){
  document.querySelectorAll('.snav[data-nav], .nitem[data-nav]').forEach(el=>{
    if(el.dataset.nav===id) el.setAttribute('aria-current','page');
    else el.removeAttribute('aria-current');
  });
}
const SCREEN_TITLES = { home:'Discover', filter:'Filter', crew:'Crew', deals:'Deals', saved:'Saved spots', profile:'Profile' };
const setTitle = t => { document.title = `${t} | TerpTaste`; };
// Put keyboard and screen reader focus on a screen's heading (without jumping the scroll).
const focusHeading = panel => document.querySelector(`#panel-${panel} h1`)?.focus({ preventScroll:true });

// restoreScroll: return to where the user was on that screen (used by Back from detail).
// section: id of a section to scroll to once the screen has rendered.
// focus: move focus to the screen's heading (off for the first load).
// focusOpen: after rendering, focus the element that opens this spot (Back returns you to it).
function go(id, { restoreScroll = false, section = null, focus = true, focusOpen = null } = {}) {
  const scroller = document.getElementById('main');
  showPanel(id);
  highlightNav(id);
  setTitle(SCREEN_TITLES[id] || 'TerpTaste');
  scroller.scrollTop = 0;
  let rendering;
  if(id==='home') rendering = renderHome();
  if(id==='filter') renderFilterPanel();
  if(id==='saved') rendering = renderSaved();
  if(id==='profile') rendering = renderProfile();
  if(id==='crew') rendering = renderCrew();
  if(id==='deals') rendering = renderDeals();
  if(focus && !focusOpen) focusHeading(id);
  if(restoreScroll || focusOpen){
    const y = scrollMemory[id] || 0;
    // The list is in the DOM once rendering resolves, so the position can be set right away.
    Promise.resolve(rendering).then(()=>{
      if(activePanel()!==id) return;
      if(restoreScroll) scroller.scrollTop = y;
      if(focusOpen){
        const opener = document.querySelector(`#panel-${id} [data-open="${CSS.escape(focusOpen)}"]`);
        opener ? opener.focus({ preventScroll:true }) : focusHeading(id);
      }
    });
  }
  if(section) Promise.resolve(rendering).then(()=>document.getElementById(section)?.scrollIntoView({ block:'start' }));
}


// ── FILTERS (one state shared by Home search, Home chips and the Filter panel) ──
const INEXPENSIVE = 'PRICE_LEVEL_INEXPENSIVE';
const PLACE_TYPES = [ ['fast','Fast food'], ['sitdown','Sit-down'], ['cafe','Café'] ];
const DIETS = [ ['vegan','Vegan'], ['halal','Halal'] ];            // only tags the data actually carries
const WALKS = [5, 10, 20];                                          // minutes from campus
const filters = { query:'', cuisines:new Set(), places:new Set(), prices:new Set(), diet:new Set(), maxWalk:null, openNow:false, late:false };
let facets = { hasHours:false, cuisines:[], priceLevels:[], studentTags:[] };

const activeFilterCount = () =>
  filters.cuisines.size + filters.places.size + filters.prices.size + filters.diet.size +
  (filters.maxWalk ? 1 : 0) + (filters.openNow ? 1 : 0) + (filters.late ? 1 : 0);
const hasActiveFilters = () => activeFilterCount() > 0 || !!filters.query.trim();

function filterQuery(){
  const q = { sort:'distance' };
  if(filters.query.trim()) q.query = filters.query.trim();
  if(filters.cuisines.size) q.cuisines = [...filters.cuisines];
  if(filters.places.size) q.anyStudentTags = [...filters.places];
  if(filters.prices.size) q.priceLevels = [...filters.prices];
  const all = [...filters.diet, ...(filters.late ? ['late'] : [])];
  if(all.length) q.studentTags = all;
  if(filters.maxWalk) q.maxDistanceMiles = filters.maxWalk / 20;
  if(filters.openNow && facets.hasHours) q.openNow = true;
  return q;
}

// Keys look like "kind:value"; one handler serves chips on Home and in the Filter panel.
function toggleFilter(key){
  const [kind, value] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':')+1)];
  const flip = set => set.has(value) ? set.delete(value) : set.add(value);
  if(kind==='cuisine') flip(filters.cuisines);
  else if(kind==='place') flip(filters.places);
  else if(kind==='price') flip(filters.prices);
  else if(kind==='diet') flip(filters.diet);
  else if(kind==='walk') filters.maxWalk = (value==='any' || Number(value)===filters.maxWalk) ? null : Number(value);
  else if(kind==='open') filters.openNow = !filters.openNow;
  else if(kind==='late') filters.late = !filters.late;
  filtersChanged();
}
function clearAllFilters({ keepQuery = false } = {}){
  ['cuisines','places','prices','diet'].forEach(k=>filters[k].clear());
  filters.maxWalk = null; filters.openNow = false; filters.late = false;
  if(!keepQuery){ filters.query = ''; document.getElementById('home-search').value = ''; }
  filtersChanged();
}
function filtersChanged(){
  renderChips();
  renderFilterPanel();
  if(document.getElementById('panel-home').classList.contains('active')) renderHome();
}

// Re-rendering replaces the buttons, so keep keyboard focus on the same chip.
function renderKeepingFocus(el, html){
  const f = document.activeElement && el.contains(document.activeElement) ? document.activeElement.dataset.f : null;
  el.innerHTML = html;
  if(f) el.querySelector(`[data-f="${CSS.escape(f)}"]`)?.focus();
}

// Quick chips on Home, plus a chip for anything set only in the Filter panel so every
// active filter is visible (and removable) from Home.
function renderChips(){
  const n = activeFilterCount();
  const c = [UI.chip(n ? `All filters (${n})` : 'All filters', { f:'nav:filter', more:true })];
  if(facets.hasHours) c.push(UI.chip('Open now', { f:'open:', pressed:filters.openNow }));
  c.push(UI.chip('Under $15', { f:`price:${INEXPENSIVE}`, pressed:filters.prices.has(INEXPENSIVE) }));
  c.push(UI.chip(filters.maxWalk && filters.maxWalk!==10 ? `${filters.maxWalk} min walk` : '10 min walk', { f:`walk:${filters.maxWalk || 10}`, pressed:!!filters.maxWalk }));
  [...filters.cuisines].forEach(cu=>c.push(UI.chip(cu, { f:`cuisine:${cu}`, pressed:true })));
  [...filters.prices].filter(p=>p!==INEXPENSIVE).forEach(p=>c.push(UI.chip(UI.price({priceLevel:p}), { f:`price:${p}`, pressed:true })));
  DIETS.forEach(([t,l])=>c.push(UI.chip(l, { f:`diet:${t}`, pressed:filters.diet.has(t) })));
  c.push(UI.chip('Open late', { f:'late:', pressed:filters.late }));
  PLACE_TYPES.forEach(([t,l])=>c.push(UI.chip(l, { f:`place:${t}`, pressed:filters.places.has(t) })));
  // Active chips first, so they stay on screen when the row scrolls on phones.
  const [more, ...rest] = c;
  const isOn = h => h.includes('aria-pressed="true"');
  renderKeepingFocus(document.getElementById('home-chips'), [more, ...rest.filter(isOn), ...rest.filter(h=>!isOn(h))].join(''));
}

// ── FILTER PANEL ──────────────────────────────────────────────────────────────
function renderFilterPanel(){
  const group = (title, chips, hint='') => chips.length ? `<section class="tt-fgroup">
      <h3 class="tt-fgroup-title">${UI.esc(title)}</h3>${hint ? `<p class="tt-fhint">${UI.esc(hint)}</p>` : ''}
      <div class="tt-fopts">${chips.join('')}</div></section>` : '';
  const hasTag = t => facets.studentTags.includes(t);
  const q = filters.query.trim();
  const html = (q ? `<p class="tt-fnote">Also searching for “${UI.esc(q)}”. Clear the search on Discover to see more.</p>` : '') + [
    group('Walk time from campus', [
      UI.chip('Any distance', { f:'walk:any', pressed:!filters.maxWalk }),
      ...WALKS.map(m=>UI.chip(`${m} min`, { f:`walk:${m}`, pressed:filters.maxWalk===m })),
    ]),
    group('Price', facets.priceLevels.map(p=>UI.chip(UI.price({priceLevel:p}), { f:`price:${p}`, pressed:filters.prices.has(p) })),
      '$ spots are usually under $15 a person.'),
    group('Type of place', PLACE_TYPES.filter(([t])=>hasTag(t)).map(([t,l])=>UI.chip(l, { f:`place:${t}`, pressed:filters.places.has(t) }))),
    group('Cuisine', facets.cuisines.map(cu=>UI.chip(cu, { f:`cuisine:${cu}`, pressed:filters.cuisines.has(cu) }))),
    group('Dietary', DIETS.filter(([t])=>hasTag(t)).map(([t,l])=>UI.chip(l, { f:`diet:${t}`, pressed:filters.diet.has(t) }))),
    group('Hours', [
      ...(facets.hasHours ? [UI.chip('Open now', { f:'open:', pressed:filters.openNow })] : []),
      ...(hasTag('late') ? [UI.chip('Open late', { f:'late:', pressed:filters.late })] : []),
    ], 'Open late is reported by students.'),
  ].join('');
  renderKeepingFocus(document.getElementById('filter-body'), html);
  updateApplyCount();
}

let countReq = 0;
function updateApplyCount(){
  const req = ++countReq;
  const btn = document.getElementById('filter-apply');
  TerpData.getRestaurants(filterQuery()).then(list=>{
    if(req!==countReq) return;
    btn.disabled = list.length===0;
    btn.textContent = list.length===0 ? 'No spots match' : `Show ${list.length} ${list.length===1?'spot':'spots'}`;
  }).catch(()=>{ if(req===countReq){ btn.disabled = false; btn.textContent = 'Show spots'; } });
}

// ── HOME ──────────────────────────────────────────────────────────────────────
let homeReq = 0;
function renderHome() {
  renderTodayDeals();
  const req = ++homeReq;
  const el = document.getElementById('home-content');
  const active = hasActiveFilters();
  // Nearest first either way, so the walk-time bands read top to bottom.
  return withLoading(el, TerpData.getRestaurants(active ? filterQuery() : { sort:'distance' }), list=>{
    if(req!==homeReq) return; // a newer search or filter change won
    const q = filters.query.trim();
    if(!list.length){
      UI.mount(el, `<div class="tt-gutter">${UI.emptyState({
        title: 'No spots match',
        body: q ? `Nothing matches “${q}”${activeFilterCount() ? ' with these filters' : ''}. Try a different word or clear filters.`
                : 'Nothing nearby matches these filters. Remove one to see more.',
        action: { label:'Clear filters', name:'clear' },
      })}</div>`, { clear: ()=>clearAllFilters() });
      return;
    }
    if(active){
      // Search and filter results: a count, then the same walk-time bands.
      UI.mount(el, `<div class="tt-results-head">
          <span class="tt-results-count" role="status">${list.length} ${list.length===1?'spot':'spots'}${q ? ` for “${UI.esc(q)}”` : ''}</span>
          <button type="button" class="tt-link" data-action="clear">Clear filters</button>
        </div>${UI.walkSections(list)}<div class="tt-end"></div>`, { clear: ()=>clearAllFilters() });
      return;
    }
    // No filters: friends' top-rated spots (hidden when none), then every spot once by walk time.
    const loved = list.filter(r=>r.terp.friendRating && r.terp.friendRating.avg>=4)
      .sort((a,b)=>b.terp.friendRating.avg-a.terp.friendRating.avg || b.terp.friendRating.count-a.terp.friendRating.count).slice(0,6);
    el.innerHTML = UI.cardRow('Your friends love', 'row-friends', loved) + UI.walkSections(list) + '<div class="tt-end"></div>';
  }, ()=>{ loadFacets(); renderHome(); });
}

// Search: filter as you type (debounced), Enter or Escape handled by the native search field.
let searchTimer;
document.getElementById('home-search').addEventListener('input', e=>{
  clearTimeout(searchTimer);
  searchTimer = setTimeout(()=>{ filters.query = e.target.value; renderHome(); }, 150);
});

// Chip clicks, wherever the chip lives.
document.addEventListener('click', e=>{
  const chip = e.target.closest('[data-f]');
  if(!chip) return;
  if(chip.dataset.f==='nav:filter'){ go('filter'); return; }
  toggleFilter(chip.dataset.f);
});
document.getElementById('filter-clear').addEventListener('click', ()=>clearAllFilters({ keepQuery:true }));
document.getElementById('filter-apply').addEventListener('click', ()=>go('home'));

// ── DETAIL ────────────────────────────────────────────────────────────────────
const BACK_LABELS = { home:'Back to Discover', saved:'Back to Saved', crew:'Back to Crew', deals:'Back to Deals', profile:'Back to Profile', filter:'Back to Filter' };
let detailFrom = 'home';
let detailId = null;                                   // spot on the detail page (Back refocuses its card)
let detailReq = 0;

// Opens right away with a skeleton, then fills in. Back returns to the screen (and
// scroll position) the user came from.
async function showDetail(key) {
  const from = activePanel();
  if(from && from!=='detail'){ detailFrom = from; scrollMemory[from] = document.getElementById('main').scrollTop; }
  const req = ++detailReq;
  detailId = key;
  const root = document.getElementById('detail-root');
  const backLabel = BACK_LABELS[detailFrom] || 'Back';
  const handlers = { back: goBack };
  showPanel('detail');
  highlightNav(detailFrom);                         // stay "inside" the screen you came from
  document.getElementById('main').scrollTop = 0;
  const t = setTimeout(()=>{ if(req===detailReq) UI.mount(root, UI.detailSkeleton(backLabel), handlers); }, 150);
  let r;
  try { r = await TerpData.getRestaurant(key); }
  catch(err){
    clearTimeout(t); console.error(err);
    if(req!==detailReq) return;
    UI.mount(root, `<div class="tt-detail-body">${UI.backButton(backLabel)}${UI.errorState({ title:'This spot didn’t load' })}</div>`,
      { ...handlers, retry: ()=>showDetail(key) });
    return;
  }
  clearTimeout(t);
  if(req!==detailReq) return;
  renderDetailContent(r);
  setTitle(r.name);
  document.querySelector('#detail-root .tt-detail-name')?.focus({ preventScroll:true });
}
function renderDetailContent(r){
  UI.mount(document.getElementById('detail-root'), UI.detail(r, { backLabel: BACK_LABELS[detailFrom] || 'Back' }), {
    back: goBack,
    vote: ()=>suggestToGroup(r),
    review: ()=>toggleReviewForm(r),
  });
}
// Re-render the open detail page in place (after a review), keeping the scroll position.
// focusSel: what to focus afterwards, since re-rendering replaces the focused element.
async function refreshDetail(id, focusSel = null){
  const scroller = document.getElementById('main');
  const y = scroller.scrollTop;
  const r = await TerpData.getRestaurant(id);
  if(activePanel()!=='detail') return;
  renderDetailContent(r);
  scroller.scrollTop = y;
  if(focusSel) document.querySelector(focusSel)?.focus({ preventScroll:true });
}
function goBack(){ go(detailFrom, { restoreScroll:true, focusOpen: detailId }); }

// ── QUICK REVIEW ──────────────────────────────────────────────────────────────
// Stars, what you got (menu pick or typed), optional one line. The dish feeds highlights.
function toggleReviewForm(r){
  const box = document.getElementById('detail-review');
  if(!box.hidden){ closeReviewForm(); return; }
  UI.mount(box, UI.reviewForm(r), { 'cancel-review': closeReviewForm });
  box.hidden = false;
  document.querySelectorAll('#detail-root [data-action="review"]').forEach(b=>b.setAttribute('aria-expanded','true'));
  const form = box.querySelector('form');
  const got = form.elements.got;
  const err = form.querySelector('.tt-form-error');
  const syncDishes = ()=>box.querySelectorAll('[data-dish]').forEach(ch=>ch.setAttribute('aria-pressed', ch.dataset.dish===got.value.trim()));
  box.querySelectorAll('[data-dish]').forEach(ch=>ch.addEventListener('click', ()=>{ got.value = ch.dataset.dish; syncDishes(); }));
  got.addEventListener('input', syncDishes);
  const VISIT_BTN = '#detail-visit [data-action="review"]';
  const undoTo = previous => ()=>{
    TerpData.restoreReview(r.id, previous);
    updateStats();
    if(activePanel()==='detail') refreshDetail(r.id, VISIT_BTN);
    if(activePanel()==='crew') renderCrewActivity();
  };
  // Errors are tied to the field that needs fixing (aria-invalid + aria-describedby).
  const clearInvalid = ()=>form.querySelectorAll('[aria-invalid]').forEach(el=>{ el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
  form.addEventListener('submit', e=>{
    e.preventDefault();
    clearInvalid();
    const rating = Number(form.elements.rating.value);
    const fail = (msg, fields, focusEl)=>{
      err.textContent = msg; err.hidden = false;
      fields.forEach(el=>{ el.setAttribute('aria-invalid','true'); el.setAttribute('aria-describedby','review-error'); });
      focusEl.focus();
    };
    const stars = [...form.querySelectorAll('input[name="rating"]')];
    if(!rating) return fail('Pick a star rating.', stars, stars[0]);
    if(!got.value.trim()) return fail('Add what you got: pick it from the menu or type it.', [got], got);
    const res = TerpData.saveReview(r.id, { rating, got: got.value, note: form.elements.note.value });
    if(!res.ok) return fail('That review couldn’t be saved. Check the rating and dish, then try again.', [got], got);
    refreshDetail(r.id, VISIT_BTN);
    updateStats();
    showToast(res.previous ? `Updated your review of ${r.name}` : `Posted: you went to ${r.name}`, { action:{ label:'Undo', run: undoTo(res.previous) } });
  });
  // Removing your review is always available here, not only through a toast's Undo.
  box.querySelector('[data-action="remove-review"]')?.addEventListener('click', ()=>{
    const previous = r.terp.myReview;
    TerpData.restoreReview(r.id, null);
    updateStats();
    refreshDetail(r.id, VISIT_BTN);
    showToast(`Removed your review of ${r.name}`, { action:{ label:'Undo', run: undoTo(previous) } });
  });
  (form.querySelector('input[name="rating"]:checked') || form.querySelector('input[name="rating"]')).focus();
}
function closeReviewForm(){
  const box = document.getElementById('detail-review');
  if(!box) return;
  box.hidden = true; box.innerHTML = '';
  const btn = document.querySelector('#detail-visit [data-action="review"]');
  document.querySelectorAll('#detail-root [data-action="review"]').forEach(b=>b.setAttribute('aria-expanded','false'));
  btn?.focus();
}

function suggestToGroup(r){ addToVote(r.id, r.name); }

// ── DEALS ─────────────────────────────────────────────────────────────────────
// Week starting today, e.g. tue, wed, … mon.
function weekFromToday(){
  const i = TerpData.DAYS.indexOf(TerpData.todayKey());
  return [...TerpData.DAYS.slice(i), ...TerpData.DAYS.slice(0, i)];
}
const sampleNote = deals => deals.some(d=>d.sample)
  ? `<p class="tt-fnote tt-deal-note">Sample deals: these haven’t been confirmed yet, so check with the spot before you go.</p>` : '';

// "Today's deals" strip on Discover. Hidden when nothing runs today (or deals fail to load).
function renderTodayDeals(){
  const box = document.getElementById('deals-today');
  const list = document.getElementById('deals-today-list');
  TerpData.getDeals().then(deals=>{
    const today = deals.filter(d=>d.days.includes(TerpData.todayKey()));
    box.hidden = !today.length;
    list.innerHTML = today.map(d=>UI.dealItem(d, { place:d.place, showDays:false })).join('');
  }).catch(err=>{ console.error(err); box.hidden = true; });
}

// Deals tab: every day that has deals, today first.
let dealsReq = 0;
function renderDeals(){
  const req = ++dealsReq;
  const el = document.getElementById('deals-content');
  return withLoading(el, TerpData.getDeals(), deals=>{
    if(req!==dealsReq) return;
    if(!deals.length){
      UI.mount(el, `<div class="tt-gutter">${UI.emptyState({ title:'No deals yet', body:'Deals near campus will show up here once they’ve been added.', action:{ label:'Browse spots', name:'browse' } })}</div>`, { browse: ()=>go('home') });
      return;
    }
    const days = weekFromToday().map((day, i)=>({ day, i, list: deals.filter(d=>d.days.includes(day)) })).filter(g=>g.list.length);
    // No set days: app deals go under Check the app; in-store ones under Days not listed.
    const checkApp = deals.filter(d=>!d.days.length && d.where!=='in-store');
    const noDays = deals.filter(d=>!d.days.length && d.where==='in-store');
    const section = (title, list, id) => `<section class="tt-deal-day" aria-labelledby="${id}">
        <h2 class="tt-deal-day-title" id="${id}">${title}</h2>
        <div class="tt-deal-list">${list.map(d=>UI.dealItem(d, { place:d.place, showDays:false })).join('')}</div>
      </section>`;
    const todayEmpty = days[0]?.i === 0 ? '' : `<section class="tt-deal-day"><h2 class="tt-deal-day-title">Today, ${UI.dayName(TerpData.todayKey())}</h2><p class="tt-fhint">No deals today.</p></section>`;
    el.innerHTML = `<div class="tt-deals">${sampleNote(deals)}${todayEmpty}${
      days.map(g=>section(g.i===0 ? `Today, ${UI.dayName(g.day)}` : UI.dayName(g.day), g.list, `deal-day-${g.day}`)).join('')}${
      checkApp.length ? section('Check the app', checkApp, 'deal-day-app') : ''}${
      noDays.length ? section('Days not listed', noDays, 'deal-day-none') : ''}</div>`;
  }, renderDeals, UI.skeletonCards(2));
}

// ── SAVED ─────────────────────────────────────────────────────────────────────
// Newest saves first. Removing one (heart) re-renders the list and offers Undo.
let savedReq = 0;
function renderSaved() {
  const req = ++savedReq;
  const el = document.getElementById('saved-content');
  const sub = document.getElementById('saved-sub');
  const ids = TerpData.savedIds().reverse();
  sub.textContent = ids.length ? `${ids.length} saved ${ids.length===1?'spot':'spots'}, newest first` : 'Your shortlist';
  if(!ids.length){
    UI.mount(el, `<div class="tt-gutter">${UI.emptyState({
      title: 'No saved spots yet',
      body: 'Tap ♡ on any spot to keep it here.',
      action: { label:'Browse spots', name:'browse' },
    })}</div>`, { browse: ()=>go('home') });
    return Promise.resolve();
  }
  return withLoading(el, TerpData.getRestaurants({ids}), list=>{
    if(req!==savedReq) return;
    el.innerHTML = `<div class="tt-saved"><div class="tt-grid">${list.map(r=>UI.card(r)).join('')}</div></div><div class="tt-end"></div>`;
  }, renderSaved, UI.skeletonCards(2));
}


// ── CREW (friend activity on top, group vote below) ──────────────────────────
function renderCrew(){
  const activity = renderCrewActivity();
  renderGroup();
  return activity;
}
let crewReq = 0;
function renderCrewActivity(){
  const req = ++crewReq;
  const el = document.getElementById('crew-activity');
  return withLoading(el, TerpData.getActivity(), list=>{
    if(req!==crewReq) return;
    if(!list.length){
      UI.mount(el, UI.emptyState({ title:'No friend activity yet', body:'When friends rate a spot, it shows up here. Rate the spots you’ve been to from their page.', action:{ label:'Browse spots', name:'browse' } }), { browse: ()=>go('home') });
      return;
    }
    el.innerHTML = `<div class="tt-activity-list">${list.slice(0, 20).map(a=>UI.activityItem(a, { actions:true })).join('')}</div>`;
  }, renderCrewActivity, UI.skeletonCards(1));
}

// ── GROUP VOTE ────────────────────────────────────────────────────────────────
// All spots come from TerpData; the board and picker re-render from TerpData.getVote().
let allSpots = null;                                   // cached list for the picker and board
let lastCounts = {};                                   // to flip only the counts that moved
function loadSpots(){
  return allSpots ? Promise.resolve(allSpots) : TerpData.getRestaurants().then(l=>(allSpots = l));
}
function renderGroup(){
  const el = document.getElementById('vote-board');
  return withLoading(el, loadSpots(), ()=>{ renderVoteBoard(); renderPicker(); },
    ()=>{ allSpots = null; renderGroup(); }, UI.skeletonCards(1));
}
function renderVoteBoard(){
  const el = document.getElementById('vote-board');
  if(!allSpots) return;
  const vote = TerpData.getVote();
  const changed = vote.options.filter(o=>o.id in lastCounts && lastCounts[o.id]!==o.count).map(o=>o.id);
  lastCounts = Object.fromEntries(vote.options.map(o=>[o.id, o.count]));
  if(vote.state==='empty'){
    UI.mount(el, UI.emptyState({
      title: 'No spots in this vote yet',
      body: `Add a few spots to get started, here or with Add to group vote on any spot. Everyone taps their pick, and the result is final once all ${vote.total} have voted.`,
    }));
    return;
  }
  const byId = new Map(allSpots.map(r=>[r.id, r]));
  UI.mount(el, UI.scoreboard(vote, byId, { changed }), { reset: resetVoteWithUndo });
}
function renderPicker(){
  const el = document.getElementById('vote-picker');
  if(!allSpots) return;
  const q = document.getElementById('picker-search').value.trim().toLowerCase();
  const inVote = new Map(TerpData.getVote().options.map(o=>[o.id, o]));
  const list = allSpots.filter(r=>!q || r.name.toLowerCase().includes(q) || (r.primaryTypeDisplayName||'').toLowerCase().includes(q));
  const final = TerpData.getVote().state==='final';
  el.innerHTML = list.length ? list.map(r=>{
    const o = inVote.get(r.id);
    // In the vote: pressed. Only spots you added can be taken out again.
    const locked = final || (o && !o.mine);
    return `<button type="button" class="tt-chip" data-vote-toggle="${UI.esc(r.id)}" aria-pressed="${!!o}"${locked ? ' disabled' : ''}>${o ? '✓ ' : ''}${UI.esc(r.name)}</button>`;
  }).join('') : `<p class="tt-fhint">No spots match “${UI.esc(q)}”.</p>`;
}
function refreshVote(){ renderVoteBoard(); renderPicker(); }

function addToVote(id, name){
  const added = TerpData.addVoteOption(id);
  if(activePanel()==='crew') refreshVote();
  showToast(added ? `Added ${name} to the group vote` : `${name} is already in the group vote`,
    activePanel()==='crew' ? {} : { action:{ label:'View vote', run:()=>go('crew', { section:'crew-vote' }) } });
}
function removeFromVoteWithUndo(id){
  const name = allSpots?.find(r=>r.id===id)?.name || 'Spot';
  const snap = TerpData.removeVoteOption(id);
  if(!snap) return;
  refreshVote();
  showToast(`Removed ${name} from the vote`, { action:{ label:'Undo', run:()=>{ TerpData.restoreVoteOption(snap); refreshVote(); } } });
}
function resetVoteWithUndo(){
  const old = TerpData.resetVote();
  lastCounts = {};
  refreshVote();
  showToast('Started a new vote', { action:{ label:'Undo', run:()=>{ TerpData.restoreVote(old); refreshVote(); } } });
}

document.getElementById('picker-search').addEventListener('input', renderPicker);
document.addEventListener('click', e=>{
  const nav = e.target.closest('[data-nav]');
  if(nav){ go(nav.dataset.nav); return; }
  const vote = e.target.closest('[data-vote]');
  if(vote){ TerpData.castVote(vote.dataset.vote); refreshVote(); return; }
  const rm = e.target.closest('[data-vote-remove]');
  if(rm){ removeFromVoteWithUndo(rm.dataset.voteRemove); return; }
  const tog = e.target.closest('[data-vote-toggle]');
  if(tog){
    const id = tog.dataset.voteToggle;
    if(tog.getAttribute('aria-pressed')==='true') removeFromVoteWithUndo(id);
    else addToVote(id, allSpots.find(r=>r.id===id)?.name || 'Spot');
    return;
  }
  const add = e.target.closest('[data-vote-add]');
  if(add) addToVote(add.dataset.voteAdd, add.dataset.name || 'Spot');
});

// ── PROFILE ───────────────────────────────────────────────────────────────────
function renderProfile() {
  updateStats();
  const h = document.getElementById('visit-history');
  // Visits = your reviews plus any check-ins saved before check-in merged into reviews.
  const visits = TerpData.getVisits();
  if(!visits.length){ h.innerHTML = `<p class="tt-muted-line">No visits yet. Tap “I went here” on a spot after you eat there.</p>`; return; }
  return withLoading(h, TerpData.getRestaurants({ids: visits.map(v=>v.id)}), list=>{
    const byId = new Map(list.map(r=>[r.id,r]));
    h.innerHTML = visits.map(v=>{
      const r = byId.get(v.id); if(!r) return '';
      const sub = v.rating ? `${UI.stars(v.rating)} <span>Got ${UI.esc(v.got)}</span>` : 'Not rated yet';
      return `<div class="hist"><div><button type="button" class="hname tt-inline-link" data-open="${UI.esc(r.id)}">${UI.esc(r.name)}</button><div class="hsub">${sub}</div></div><div class="hdate">${UI.formatDay(v.date)}</div></div>`;
    }).join('');
  }, renderProfile, UI.skeletonCards(1));
}
function updateStats(){
  const ci=document.getElementById('stat-ci');const sv=document.getElementById('stat-sv');
  if(ci)ci.textContent=TerpData.getVisits().length;if(sv)sv.textContent=TerpData.savedIds().length;
}

// ── SURPRISE ME ───────────────────────────────────────────────────────────────
// A random spot from the current results (so filters and search apply), never the
// same one twice in a row.
let lastSurprise = null;
function surpriseMe(){
  TerpData.getRestaurants(hasActiveFilters() ? filterQuery() : {}).then(list=>{
    if(!list.length){ showToast('No spots match your filters. Clear one to get a surprise.'); return; }
    const pool = list.length > 1 ? list.filter(r=>r.id!==lastSurprise) : list;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    lastSurprise = pick.id;
    showDetail(pick.id);
  }).catch(err=>{ console.error(err); showToast('Restaurants didn’t load. Try again.'); });
}
document.getElementById('surprise-btn').addEventListener('click', surpriseMe);

// ── TOAST ─────────────────────────────────────────────────────────────────────
// Optional action (e.g. Undo) keeps the toast up longer so there's time to use it.
// The timer pauses while the toast is hovered or focused, so there's always time to use
// Undo (WCAG 2.2.1); Escape closes it.
let tTimer, tDelay = 0;
const armToast = ()=>{ clearTimeout(tTimer); tTimer = setTimeout(hideToast, tDelay); };
function showToast(msg, { action } = {}){
  const t = document.getElementById('toast');
  const btn = document.getElementById('toast-action');
  document.getElementById('toast-msg').textContent = msg;
  btn.hidden = !action;
  btn.onclick = null;
  if(action){
    btn.textContent = action.label;
    btn.onclick = ()=>{ hideToast(); action.run(); };
  }
  t.classList.add('show');
  tDelay = action ? 8000 : 3000;
  armToast();
}
function hideToast(){ clearTimeout(tTimer); document.getElementById('toast').classList.remove('show'); }
(()=>{
  const t = document.getElementById('toast');
  const pause = ()=>clearTimeout(tTimer);
  const resume = ()=>{ if(t.classList.contains('show') && !t.matches(':hover') && !t.contains(document.activeElement)) armToast(); };
  t.addEventListener('mouseenter', pause); t.addEventListener('focusin', pause);
  t.addEventListener('mouseleave', resume); t.addEventListener('focusout', ()=>setTimeout(resume));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && t.classList.contains('show')) hideToast(); });
})();


// ── INIT ──────────────────────────────────────────────────────────────────────
// Filter options come from the data. "Open now" only appears once some spot has real hours,
// so it comes back on its own when Google Places supplies them.
function loadFacets(){
  return TerpData.getFacets().then(f=>{
    facets = f;
    if(!f.hasHours) filters.openNow = false;
    renderChips();
    renderFilterPanel();
  }).catch(err=>console.error(err));
}
highlightNav('home');
setTitle('Discover');
renderChips();
loadFacets();
renderHome();
