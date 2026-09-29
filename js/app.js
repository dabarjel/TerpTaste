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

// Restaurant data comes only from TerpData (js/data/restaurants.js).
const PRICE_SYMBOL = { PRICE_LEVEL_INEXPENSIVE:'$', PRICE_LEVEL_MODERATE:'$$', PRICE_LEVEL_EXPENSIVE:'$$$', PRICE_LEVEL_VERY_EXPENSIVE:'$$$$' };
const price = r => PRICE_SYMBOL[r.priceLevel] || '';
const cardStyle = id => CARD_STYLES[id] || {emoji:'🍽',grad:'linear-gradient(135deg,#1a1a1a,#333)'};

// Minimal loading/error placeholders; Phase 3 replaces these with skeleton and error components.
function withLoading(el, promise, render, retry){
  const t = setTimeout(()=>{ el.innerHTML = `<div class="empty-state">Loading…</div>`; }, 150);
  return promise.then(v=>{ clearTimeout(t); render(v); }).catch(err=>{
    clearTimeout(t);
    console.error(err);
    el.innerHTML = `<div class="empty-state">Restaurants didn’t load. Check your connection, then try again.<br><br><button class="abtn" type="button">Try again</button></div>`;
    el.querySelector('button').onclick = retry;
  });
}

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
  if(id==='home') renderHome(activeChip);
  if(id==='saved') renderSaved();
  if(id==='profile') renderProfile();
  if(id==='group') renderGroup();
}

// ── HOME ──────────────────────────────────────────────────────────────────────
const CHIP_FILTERS = {
  all:     {},
  open:    { openNow:true },
  budget:  { priceLevels:['PRICE_LEVEL_INEXPENSIVE'] },
  fast:    { studentTags:['fast'] },
  sitdown: { studentTags:['sitdown'] },
  cafe:    { studentTags:['cafe'] },
  vegan:   { studentTags:['vegan'] },
  halal:   { studentTags:['halal'] },
};
let homeReq = 0;
function renderHome(filter) {
  const req = ++homeReq;
  const el = document.getElementById('home-content');
  return withLoading(el, TerpData.getRestaurants(CHIP_FILTERS[filter] || {}), list=>{
    if(req!==homeReq) return; // a newer chip click won
    const forYou = list.slice(0,3);
    const budget = list.filter(r=>r.priceLevel==='PRICE_LEVEL_INEXPENSIVE').slice(0,6);
    const more = list.slice(3, list.length>6?9:list.length);
    const worth = list.filter(r=>r.distanceMiles>1).slice(0,4);

    let h = '';
    h += `<div class="slabel">For You — based on your preferences</div><div class="cgrid">`;
    forYou.forEach(r=>{ h+=rCard(r); });
    h += `</div>`;
    if(budget.length){ h+=`<div class="slabel">Budget picks · Under $15</div><div class="mrow">`; budget.forEach(r=>{h+=rMini(r);}); h+=`</div>`; }
    if(more.length){ h+=`<div class="slabel">More nearby</div><div class="cgrid">`; more.forEach(r=>{h+=rCard(r);}); h+=`</div>`; }
    if(worth.length){ h+=`<div class="slabel">Worth the trip</div><div class="cgrid">`; worth.forEach(r=>{h+=rCard(r);}); h+=`</div>`; }
    h += `<div style="height:20px;"></div>`;
    el.innerHTML = h;
  }, ()=>renderHome(filter));
}

const AVATAR_TOKENS = ['--avatar-red','--avatar-blue','--avatar-green','--avatar-purple','--avatar-orange','--avatar-teal'];
function avatarColorFor(name){
  let h = 0; for(let i=0;i<name.length;i++) h = (h*31 + name.charCodeAt(i)) % AVATAR_TOKENS.length;
  return `var(${AVATAR_TOKENS[h]})`;
}
function rFriendRow(r){
  const name = r.terp.review && r.terp.review.author;
  if(!name) return '';
  const initials = name.replace(/[^A-Za-z ]/g,'').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return `<div class="rfriends">
      <div class="rf-avatars"><div class="rf-avatar" style="background:${avatarColorFor(name)}">${initials}</div></div>
      <span class="rf-text">${name} checked in here</span>
    </div>`;
}
function rCard(r){
  const cs = cardStyle(r.id);
  const isSaved = r.terp.saved;
  return `<div class="rcard" onclick="showDetail('${r.id}')">
    <div class="rimg">
      <div class="rimg-bg" style="background:${cs.grad}"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:52px;filter:drop-shadow(0 2px 12px rgba(0,0,0,0.6))">${cs.emoji}</div>
      <div class="rstatus ${r.isOpenNow?'is-open':'is-closed'}"><span class="rstatus-dot"></span>${r.isOpenNow?'Open':'Closed'}</div>
      <button class="rsave${isSaved?' is-saved':''}" onclick="event.stopPropagation();quickSave('${r.id}',this)">${isSaved?'♥':'♡'}</button>
    </div>
    <div class="rbody">
      <div class="rname">${r.name}</div>
      <div class="rmeta">${price(r)} · ${r.primaryTypeDisplayName} · ${r.distanceMiles} mi</div>
      ${rFriendRow(r)}
    </div>
  </div>`;
}
function quickSave(key, btn){
  const isSaved = TerpData.toggleSaved(key);
  showToast(isSaved ? 'Saved! ♥' : 'Removed from saved');
  btn.textContent = isSaved ? '♥' : '♡';
  btn.classList.toggle('is-saved', isSaved);
  updateStats();
}

function rMini(r){
  const cs = cardStyle(r.id);
  return `<div class="mcard" onclick="showDetail('${r.id}')">
    <div class="mimg">
      <div class="mimg-bg" style="background:${cs.grad}"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:34px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.6))">${cs.emoji}</div>
      <div class="mimg-ov"></div>
      <div class="mbadge">${price(r)} · ${r.distanceMiles} mi</div>
    </div>
    <div class="mbody"><div class="mname">${r.name}</div><div class="msub">${r.primaryTypeDisplayName} · ${r.terp.waitMinutes ?? 0} min</div></div>
  </div>`;
}

let activeChip = 'all';
function filterChip(el, val) {
  document.querySelectorAll('#home-chips .chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  activeChip = val;
  renderHome(val);
}

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
    t.hoursNote && {t:t.hoursNote, c:'pill-open'},
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
  if(!ids.length){ el.innerHTML=`<div class="empty-state">No saved spots yet.<br>Tap ♡ on any restaurant to save it here.<br><br><small style="color:var(--text-muted);">Tip: you can also save from the Friends Feed.</small></div>`; return; }
  return withLoading(el, TerpData.getRestaurants({ids}), list=>{
    let h = `<div class="saved-grid">`;
    list.forEach(r=>{h+=`<div class="saved-item" onclick="showDetail('${r.id}')"><div><div class="saved-name">${r.name}</div><div class="saved-meta">${r.primaryTypeDisplayName} · ${price(r)} · ${r.distanceMiles} mi</div></div><div class="saved-remove" onclick="event.stopPropagation();unsave('${r.id}')">×</div></div>`;});
    h+=`</div>`;
    el.innerHTML = h;
  }, renderSaved);
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
        <div class="vmeta">${r.primaryTypeDisplayName} · ${price(r)} · ${r.distanceMiles} mi · ${r.isOpenNow?'Open now':'Closed'}</div>
        <div class="vbar-bg"><div class="vbar" style="width:${pct}%"></div></div>
        <div class="vcount">${v} of ${total} voted</div>
      </div>`;
    }).join('');
    const top = list.slice().sort((a,b)=>(b.terp.groupVotes||0)-(a.terp.groupVotes||0))[0];
    if(top && (top.terp.groupVotes||0)>0){
      document.getElementById('win-name').textContent = `${top.name} wins!`;
      document.getElementById('win-sub').textContent = `${top.distanceMiles} mi · ${top.primaryTypeDisplayName} · ${price(top)}`;
    }
  }, renderVoteCards);
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
    h.innerHTML = history.map(c=>{ const r=byId.get(c.id); if(!r) return ''; return `<div class="hist"><div><div class="hname">${r.name}</div><div class="hsub">${r.primaryTypeDisplayName} · ${price(r)}</div></div><div class="hdate">${c.date}</div></div>`; }).join('');
  }, renderProfile);
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

// ── FILTER HELPERS ────────────────────────────────────────────────────────────
function tF(el){el.classList.toggle('sel');}
function tP(el){el.classList.toggle('sel');}
function clearFilters(){document.querySelectorAll('.fopt,.popt').forEach(o=>o.classList.remove('sel'));}

// ── TOAST ─────────────────────────────────────────────────────────────────────
let tTimer;
function showToast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(tTimer);tTimer=setTimeout(()=>t.classList.remove('show'),2200);
}

// ── INIT ──────────────────────────────────────────────────────────────────────
renderHome('all');
