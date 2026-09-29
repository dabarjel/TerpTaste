// ── RESTAURANT DATA ───────────────────────────────────────────────────────────
// Card visuals: emoji + cuisine-matched gradient. Always clear, zero network deps.
const CARD_STYLES = {
  habanero:     { emoji: '🌮', grad: 'linear-gradient(135deg,#6B1F1F,#C0392B)' },
  aroy:         { emoji: '🍜', grad: 'linear-gradient(135deg,#1A0A2E,#6C3483)' },
  marathon:     { emoji: '🥙', grad: 'linear-gradient(135deg,#0D2137,#1F618D)' },
  qu:           { emoji: '🍜', grad: 'linear-gradient(135deg,#0B2F1A,#1E8449)' },
  shagga:       { emoji: '🍛', grad: 'linear-gradient(135deg,#4A2200,#A04000)' },
  playa:        { emoji: '🍇', grad: 'linear-gradient(135deg,#2C0A3C,#7D3C98)' },
  spice6:       { emoji: '🍛', grad: 'linear-gradient(135deg,#3E1700,#D35400)' },
  busboys:      { emoji: '☕', grad: 'linear-gradient(135deg,#1A0D00,#6E3E1C)' },
  canes:        { emoji: '🍗', grad: 'linear-gradient(135deg,#5C0000,#E53935)' },
  saburo:       { emoji: '🍜', grad: 'linear-gradient(135deg,#0B1F3A,#1565C0)' },
  hanami:       { emoji: '🍣', grad: 'linear-gradient(135deg,#0A1628,#0E4D92)' },
  pupuseria:    { emoji: '🫓', grad: 'linear-gradient(135deg,#3B1A00,#8D4E00)' },
  jumbojumbo:   { emoji: '🐔', grad: 'linear-gradient(135deg,#3D1100,#BF360C)' },
  tacosmadre:   { emoji: '🌮', grad: 'linear-gradient(135deg,#4A1000,#C0392B)' },
  federalist:   { emoji: '🥩', grad: 'linear-gradient(135deg,#2A0A00,#784212)' },
  theHall:      { emoji: '🍔', grad: 'linear-gradient(135deg,#1A1200,#7D6608)' },
  ritchies:     { emoji: '🫔', grad: 'linear-gradient(135deg,#1A3300,#27AE60)' },
  yums:         { emoji: '🥡', grad: 'linear-gradient(135deg,#003318,#0B6623)' },
  franklinsbeer:{ emoji: '🍕', grad: 'linear-gradient(135deg,#2A1400,#935116)' },
  northwest:    { emoji: '🥟', grad: 'linear-gradient(135deg,#001F3A,#1A5276)' },
  latao:        { emoji: '🫕', grad: 'linear-gradient(135deg,#3A0000,#C0392B)' },
  eddiescafe:   { emoji: '🍊', grad: 'linear-gradient(135deg,#3A1400,#BA4A00)' },
};

// Restaurant data comes only from TerpData (js/data/restaurants.js); markup from UI (js/ui/components.js).
const price = UI.price;
const cardStyle = id => CARD_STYLES[id] || {emoji:'🍽',grad:'linear-gradient(135deg,#1a1a1a,#333)'};

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

// Cards anywhere in the app: open on click, save with the heart.
document.addEventListener('click', e=>{
  const save = e.target.closest('[data-save]');
  if(save){
    const id = save.dataset.save;
    const on = TerpData.toggleSaved(id);
    const name = save.closest('.tt-card')?.querySelector('.tt-card-link')?.textContent || '';
    UI.setSaveButton(save, on, name);
    showToast(on ? `Saved ${name}` : `Removed ${name} from saved`);
    updateStats();
    return;
  }
  const open = e.target.closest('[data-open]');
  if(open) showDetail(open.dataset.open);
});

// ── STATE ─────────────────────────────────────────────────────────────────────
let currentKey = null;
let currentRestaurant = null;

// ── NAV ───────────────────────────────────────────────────────────────────────
const pages = ['home','filter','group','friends','saved','profile'];
function go(id) {
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  document.getElementById('main-scroll').scrollTop = 0;
  pages.forEach(pg=>{
    const isA = pg===id;
    ['sb-','mn-'].forEach(pre=>{
      const el = document.getElementById(pre+pg);
      if(!el) return;
      el.classList.toggle('active', isA);
      el.querySelectorAll('path,circle,line,polyline,rect').forEach(e=>{
        const tag = e.tagName.toLowerCase();
        if(tag==='rect') return; // don't stroke rect fill
        e.setAttribute('stroke',isA?'var(--terp-gold)':'var(--text-muted)');
      });
    });
  });
  if(id==='home') renderHome();
  if(id==='filter') renderFilterPanel();
  if(id==='saved') renderSaved();
  if(id==='profile') renderProfile();
  if(id==='group') renderGroup();
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
let detailReq = 0;
async function showDetail(key) {
  const req = ++detailReq;
  let r;
  try { r = await TerpData.getRestaurant(key); }
  catch(err){ console.error(err); showToast('That restaurant didn’t load. Try again.'); return; }
  if(req!==detailReq) return;
  currentKey = key;
  currentRestaurant = r;
  const t = r.terp;
  document.getElementById('dname').textContent = r.name;
  document.getElementById('dsub').textContent = `${r.primaryTypeDisplayName} · ${price(r)} · ${r.distanceMiles} mi away`;
  const cs = cardStyle(key);
  const heroBg = document.getElementById('dhero-bg');
  heroBg.className = 'dhero-bg';
  heroBg.style.background = cs.grad;
  let heroEmoji = document.getElementById('dhero-emoji');
  if(!heroEmoji){ heroEmoji = document.createElement('div'); heroEmoji.id='dhero-emoji'; heroEmoji.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:80px;filter:drop-shadow(0 4px 20px rgba(0,0,0,0.6));z-index:1;'; document.querySelector('.dhero').insertBefore(heroEmoji, document.querySelector('.dhero-ov')); }
  heroEmoji.textContent = cs.emoji;
  const pills = [
    t.hoursNote && {t:t.hoursNote, c:'pill-price'}, // student-reported hours, not a live open/closed status
    (t.waitNote || t.waitMinutes) && {t:t.waitNote || `~${t.waitMinutes} min wait`, c:'pill-wait'},
    t.priceRange && {t:t.priceRange, c:'pill-price'},
  ].filter(Boolean);
  document.getElementById('dpills').innerHTML = pills.map(p=>`<div class="pill ${p.c}">${p.t}</div>`).join('');
  const rv = t.review;
  document.getElementById('dtrust').innerHTML = rv ? `<p>"${rv.quote}"</p><p class="src">— ${rv.author} · ${rv.authorCheckIns} check-ins</p>` : '';
  document.getElementById('dmenu').textContent = t.menu || '';
  document.getElementById('ddiet').innerHTML = (t.dietNotes||[]).map(d=>`<div class="dtag">✓ ${d}</div>`).join('');
  const sb = document.getElementById('save-btn');
  sb.textContent = t.saved ? '♥ Saved' : '♡ Save';
  sb.className = 'abtn'+(t.saved?' saved-active':'');
  const cb = document.getElementById('checkin-btn');
  cb.textContent = 'Been Here — Check In'; cb.className = 'checkin-btn';
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-detail').classList.add('active');
  document.getElementById('main-scroll').scrollTop = 0;
  pages.forEach(pg=>{
    ['sb-','mn-'].forEach(pre=>{const el=document.getElementById(pre+pg);if(el){el.classList.remove('active');el.querySelectorAll('path,circle,line,polyline').forEach(e=>e.setAttribute('stroke','var(--text-muted)'));}});
  });
}

function toggleSave() {
  if(!currentKey) return;
  const isSaved = TerpData.toggleSaved(currentKey);
  showToast(isSaved ? 'Saved! ♥' : 'Removed from saved');
  const sb = document.getElementById('save-btn');
  sb.textContent = isSaved?'♥ Saved':'♡ Save';
  sb.className = 'abtn'+(isSaved?' saved-active':'');
  updateStats();
}

function saveFromFeed(key) {
  TerpData.setSaved(key, true); updateStats();
  TerpData.getRestaurant(key).then(r=>showToast(`Saved ${r.name}! ♥`)).catch(()=>showToast('Saved! ♥'));
}

function checkIn() {
  if(!currentKey) return;
  const btn = document.getElementById('checkin-btn');
  btn.textContent = '✓ Checked In!'; btn.className = 'checkin-btn done';
  TerpData.addCheckIn(currentKey);
  updateStats(); showToast(`Checked into ${currentRestaurant.name}!`);
}

// ── SAVED ─────────────────────────────────────────────────────────────────────
function renderSaved() {
  const el = document.getElementById('saved-content');
  const ids = TerpData.savedIds();
  if(!ids.length){
    UI.mount(el, `<div class="tt-gutter">${UI.emptyState({
      title: 'No saved spots yet',
      body: 'Tap ♡ on any spot, or Save spot in the Friends feed, to keep it here.',
      action: { label:'Browse spots', name:'browse' },
    })}</div>`, { browse: ()=>go('home') });
    return;
  }
  return withLoading(el, TerpData.getRestaurants({ids}), list=>{
    let h = `<div class="saved-grid">`;
    list.forEach(r=>{h+=`<div class="saved-item" onclick="showDetail('${r.id}')"><div><div class="saved-name">${r.name}</div><div class="saved-meta">${r.primaryTypeDisplayName} · ${price(r)} · ${r.distanceMiles} mi</div></div><div class="saved-remove" onclick="event.stopPropagation();unsave('${r.id}')">×</div></div>`;});
    h+=`</div>`;
    el.innerHTML = h;
  }, renderSaved, UI.skeletonCards(2));
}
function unsave(key){ TerpData.setSaved(key, false); renderSaved(); updateStats(); showToast('Removed from saved'); }

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
    h.innerHTML = history.map(c=>{ const r=byId.get(c.id); if(!r) return ''; return `<div class="hist"><div><div class="hname">${r.name}</div><div class="hsub">${r.primaryTypeDisplayName} · ${price(r)}</div></div><div class="hdate">${formatDay(c.date)}</div></div>`; }).join('');
  }, renderProfile, UI.skeletonCards(1));
}
function formatDay(iso){
  const d = new Date(iso+'T12:00:00');
  if(isNaN(d)) return iso;
  const today = new Date();
  if(d.toDateString()===today.toDateString()) return 'Today';
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
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
let tTimer;
function showToast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(tTimer);tTimer=setTimeout(()=>t.classList.remove('show'),2200);
}

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
