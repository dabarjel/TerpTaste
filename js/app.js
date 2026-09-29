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
const pages = ['home','filter','group','friends','saved','profile'];
const activePanel = () => (document.querySelector('.panel.active')?.id || '').replace('panel-','');
const scrollMemory = {};

function showPanel(id){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
}
function highlightNav(id){
  pages.forEach(pg=>{
    const isA = pg===id;
    ['sb-','mn-'].forEach(pre=>{
      const el = document.getElementById(pre+pg);
      if(!el) return;
      el.classList.toggle('active', isA);
      el.querySelectorAll('path,circle,line,polyline').forEach(e=>e.setAttribute('stroke',isA?'var(--terp-gold)':'var(--text-muted)'));
    });
  });
}
// restoreScroll: return to where the user was on that screen (used by Back from detail).
function go(id, { restoreScroll = false } = {}) {
  const scroller = document.getElementById('main-scroll');
  showPanel(id);
  highlightNav(id);
  scroller.scrollTop = 0;
  let rendering;
  if(id==='home') rendering = renderHome();
  if(id==='filter') renderFilterPanel();
  if(id==='saved') rendering = renderSaved();
  if(id==='profile') rendering = renderProfile();
  if(id==='group') renderGroup();
  if(id==='friends') syncAllSaveButtons();
  if(restoreScroll){
    const y = scrollMemory[id] || 0;
    // The list is in the DOM once rendering resolves, so the position can be set right away.
    Promise.resolve(rendering).then(()=>{ if(activePanel()===id) scroller.scrollTop = y; });
  }
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
  const req = ++homeReq;
  const el = document.getElementById('home-content');
  const active = hasActiveFilters();
  return withLoading(el, TerpData.getRestaurants(active ? filterQuery() : {}), list=>{
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
    const grid = rs => `<div class="cgrid">${rs.map(r=>UI.card(r)).join('')}</div>`;
    if(active){
      // One list, nearest first, each spot once.
      UI.mount(el, `<div class="tt-results-head">
          <span class="tt-results-count">${list.length} ${list.length===1?'spot':'spots'}${q ? ` for “${UI.esc(q)}”` : ''}</span>
          <button type="button" class="tt-link" data-action="clear">Clear filters</button>
        </div>${grid(list)}<div style="height:20px;"></div>`, { clear: ()=>clearAllFilters() });
      return;
    }
    // No filters: section layout stays until Phase 4 replaces it with walk-time sections.
    const forYou = list.slice(0,3);
    const budget = list.filter(r=>r.priceLevel==='PRICE_LEVEL_INEXPENSIVE').slice(0,6);
    const more = list.slice(3, list.length>6?9:list.length);
    const worth = list.filter(r=>r.distanceMiles>1).slice(0,4);

    let h = '';
    h += `<div class="slabel">For You — based on your preferences</div>${grid(forYou)}`;
    if(budget.length) h += `<div class="slabel">Budget picks · Under $15</div><div class="mrow">${budget.map(r=>UI.card(r,{compact:true})).join('')}</div>`;
    if(more.length) h += `<div class="slabel">More nearby</div>${grid(more)}`;
    if(worth.length) h += `<div class="slabel">Worth the trip</div>${grid(worth)}`;
    h += `<div style="height:20px;"></div>`;
    el.innerHTML = h;
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
const BACK_LABELS = { home:'Back to Discover', saved:'Back to Saved', friends:'Back to Friends', group:'Back to Group vote', profile:'Back to Profile', filter:'Back to Filter' };
let detailFrom = 'home';
let detailReq = 0;

// Opens right away with a skeleton, then fills in. Back returns to the screen (and
// scroll position) the user came from.
async function showDetail(key) {
  const from = activePanel();
  if(from && from!=='detail'){ detailFrom = from; scrollMemory[from] = document.getElementById('main-scroll').scrollTop; }
  const req = ++detailReq;
  const root = document.getElementById('detail-root');
  const backLabel = BACK_LABELS[detailFrom] || 'Back';
  const handlers = { back: goBack };
  showPanel('detail');
  highlightNav(detailFrom);                         // stay "inside" the screen you came from
  document.getElementById('main-scroll').scrollTop = 0;
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
  UI.mount(root, UI.detail(r, { backLabel }), {
    ...handlers,
    vote: ()=>suggestToGroup(r),
  });
  bindCheckIn(r);
}
function goBack(){ go(detailFrom, { restoreScroll:true }); }

function suggestToGroup(r){
  const added = TerpData.addVoteOption(r.id);
  showToast(added ? `Added ${r.name} to the group vote` : `${r.name} is already in the group vote`,
    { action:{ label:'View vote', run:()=>go('group') } });
}

// Check-in block re-renders from saved data after every change.
async function refreshCheckIn(id){
  const r = await TerpData.getRestaurant(id);
  bindCheckIn(r);
  updateStats();
}
function bindCheckIn(r){
  const el = document.getElementById('detail-checkin');
  if(!el) return;
  UI.mount(el, UI.checkInBlock(r), {
    checkin: ()=>{
      TerpData.addCheckIn(r.id);
      refreshCheckIn(r.id);
      showToast(`Checked in at ${r.name}`, { action:{ label:'Undo', run:()=>{ TerpData.removeCheckIn(r.id); refreshCheckIn(r.id); } } });
    },
    uncheckin: ()=>{
      const removed = TerpData.removeCheckIn(r.id);
      refreshCheckIn(r.id);
      showToast(`Removed check-in at ${r.name}`, { action:{ label:'Undo', run:()=>{ TerpData.restoreCheckIn(removed); refreshCheckIn(r.id); } } });
    },
  });
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
      body: 'Tap ♡ on any spot, or Save spot in the Friends feed, to keep it here.',
      action: { label:'Browse spots', name:'browse' },
    })}</div>`, { browse: ()=>go('home') });
    return Promise.resolve();
  }
  return withLoading(el, TerpData.getRestaurants({ids}), list=>{
    if(req!==savedReq) return;
    el.innerHTML = `<div class="cgrid tt-saved-grid">${list.map(r=>UI.card(r)).join('')}</div><div style="height:20px;"></div>`;
  }, renderSaved, UI.skeletonCards(2));
}


// ── GROUP ─────────────────────────────────────────────────────────────────────
function renderGroup() {
  const sg = document.getElementById('gsugg');
  TerpData.getRestaurants().then(list=>{
    sg.innerHTML = list.slice(0,12).map(r=>`<div class="gchip" onclick="addToVote('${r.id}')">${r.name}</div>`).join('');
  }).catch(err=>{ console.error(err); sg.innerHTML=''; });
  renderVoteCards();
}
function addToVote(key) {
  if(!TerpData.addVoteOption(key)){ showToast('Already in the vote!'); return; }
  renderVoteCards();
  TerpData.getRestaurant(key).then(r=>showToast(`Added ${r.name} to the vote`)).catch(()=>{});
}
let voteReq = 0;
function renderVoteCards() {
  const el = document.getElementById('vcards'); if(!el) return;
  const req = ++voteReq;
  const vote = TerpData.getVote();
  return withLoading(el, TerpData.getRestaurants({ids: vote.options}), list=>{
    if(req!==voteReq) return;
    const total = list.reduce((a,r)=>a+(r.terp.groupVotes||0),0);
    const maxV = Math.max(...list.map(r=>r.terp.groupVotes||0));
    el.innerHTML = list.map(r=>{
      const v=r.terp.groupVotes||0; const pct=total>0?Math.round(v/total*100):0; const leading=v===maxV&&v>0;
      return `<div class="vcard${vote.mine===r.id?' picked':''}" onclick="castVote('${r.id}')">
        <div class="vheader"><div class="vname">${r.name}</div>${leading?'<div class="vtag">Leading</div>':''}</div>
        <div class="vmeta">${r.primaryTypeDisplayName} · ${price(r)} · ${r.distanceMiles} mi${typeof r.isOpenNow==='boolean' ? (r.isOpenNow?' · Open now':' · Closed') : ''}</div>
        <div class="vbar-bg"><div class="vbar" style="width:${pct}%"></div></div>
        <div class="vcount">${v} of ${total} voted</div>
      </div>`;
    }).join('');
    const top = list.slice().sort((a,b)=>(b.terp.groupVotes||0)-(a.terp.groupVotes||0))[0];
    if(top && (top.terp.groupVotes||0)>0){
      document.getElementById('win-name').textContent = `${top.name} wins!`;
      document.getElementById('win-sub').textContent = `${top.distanceMiles} mi · ${top.primaryTypeDisplayName} · ${price(top)}`;
    }
  }, renderVoteCards, UI.skeletonCards(1));
}
function castVote(key) {
  TerpData.castVote(key); renderVoteCards();
}

// ── PROFILE ───────────────────────────────────────────────────────────────────
function renderProfile() {
  updateStats();
  const h = document.getElementById('visit-history');
  const history = TerpData.checkInHistory();
  if(!history.length){ h.innerHTML = `<div style="font-size:13px;color:var(--text-muted);padding:8px 0;">No visits yet — check in after eating!</div>`; return; }
  return withLoading(h, TerpData.getRestaurants({ids: history.map(c=>c.id)}), list=>{
    const byId = new Map(list.map(r=>[r.id,r]));
    h.innerHTML = history.map(c=>{ const r=byId.get(c.id); if(!r) return ''; return `<div class="hist"><div><div class="hname">${r.name}</div><div class="hsub">${r.primaryTypeDisplayName} · ${price(r)}</div></div><div class="hdate">${UI.formatDay(c.date)}</div></div>`; }).join('');
  }, renderProfile, UI.skeletonCards(1));
}
function updateStats(){
  const ci=document.getElementById('stat-ci');const sv=document.getElementById('stat-sv');
  if(ci)ci.textContent=TerpData.checkInHistory().length;if(sv)sv.textContent=TerpData.savedIds().length;
}

// ── SURPRISE ME ───────────────────────────────────────────────────────────────
let sIdx=0;
function surpriseMe(){
  TerpData.getRestaurants().then(list=>{ if(list.length) showDetail(list[sIdx++%list.length].id); })
    .catch(err=>{ console.error(err); showToast('Restaurants didn’t load. Try again.'); });
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
// Optional action (e.g. Undo) keeps the toast up longer so there's time to use it.
let tTimer;
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
  clearTimeout(tTimer);
  tTimer = setTimeout(hideToast, action ? 6000 : 2400);
}
function hideToast(){ clearTimeout(tTimer); document.getElementById('toast').classList.remove('show'); }


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
renderChips();
loadFacets();
renderHome();
