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

const R = {
  habanero:{name:'Taqueria Habanero',cuisine:'Mexican',price:'$$',dist:0.4,wait:10,tags:['mexican','sitdown','vegan','halal'],open:true,late:false,badge:'⭐ Michelin Bib',bg:'bg-mex',pills:[{t:'Open til 10pm',c:'pill-open'},{t:'~10 min wait',c:'pill-wait'},{t:'$10–$18',c:'pill-price'}],trust:{p:'"Best tacos near campus, not even close. Al pastor, tinga, and polpo (octopus) are all elite. Michelin Bib Gourmand — for real."',s:'— Jordan T. · 6 check-ins'},menu:'Tacos al pastor, tinga, lengua, polpo. Burritos, enchiladas, guacamole. Agua fresca. Free chips first order.',diet:['Vegetarian tacos available','Vegan options','Gluten-free tortilla on request']},
  aroy:{name:'Aroy Thai',cuisine:'Thai',price:'$',dist:0.6,wait:10,tags:['asian','fast','vegan'],open:true,late:false,badge:'🌶 Hidden gem',bg:'bg-thai',pills:[{t:'Open til 8:30pm',c:'pill-open'},{t:'~10 min',c:'pill-wait'},{t:'$10–$14',c:'pill-price'}],trust:{p:'"A tiny spot on College Ave that gets overlooked — do not sleep on it. Drunken noodles at spice 3 is a rite of passage. Huge portions."',s:'— Aisha K. · 4 check-ins'},menu:'Drunken noodles, Pad Thai, Pad See Ew, green/red curry, pineapple fried rice, larb gai.',diet:['Vegetarian-friendly','Vegan on request']},
  marathon:{name:'Marathon Deli',cuisine:'Greek',price:'$',dist:0.4,wait:5,tags:['mediterranean','fast','halal'],open:true,late:true,badge:'🌙 Late night staple',bg:'bg-greek',pills:[{t:'Open late',c:'pill-open'},{t:'~5 min',c:'pill-wait'},{t:'$4–$12',c:'pill-price'}],trust:{p:'"Marathon Fries are the late-night institution of College Park. The gyro is genuinely great and under $12."',s:'— Simone P. · 9 check-ins'},menu:'Gyros, Marathon Fries, cheesesteaks, falafel, chicken wraps.',diet:['Vegetarian falafel','Halal-friendly']},
  qu:{name:'Qu Japan',cuisine:'Japanese',price:'$$',dist:0.3,wait:15,tags:['asian','sitdown'],open:true,late:false,badge:'🍜 Ramen + hibachi',bg:'bg-ramen',pills:[{t:'Open til 10pm',c:'pill-open'},{t:'~15 min',c:'pill-wait'},{t:'$13–$20',c:'pill-price'}],trust:{p:'"Chicken teriyaki ramen is the move. Pay cash for a 5% discount. Hibachi bowls are solid too."',s:'— Simone P. · 5 check-ins'},menu:'Ramen (tonkotsu, chicken teriyaki, shoyu), hibachi bowls, gyoza, bubble tea.',diet:['Gluten-free options','Vegan ramen available']},
  shagga:{name:'Shagga Ethiopian',cuisine:'Ethiopian',price:'$$',dist:1.8,wait:20,tags:['sitdown','vegan','halal'],open:true,late:false,badge:'🌍 Fan favorite',bg:'bg-eth',pills:[{t:'Open til 10pm',c:'pill-open'},{t:'Sit-down',c:'pill-wait'},{t:'$13–$20',c:'pill-price'}],trust:{p:'"Combo platter fed 3 of us. $16 each, all stuffed. Lamb wot and lentils both incredible. Best Ethiopian near campus."',s:'— Marcus R. · 4 check-ins'},menu:'Combo platters (meat or veggie), lamb wot, doro tibs, misir wot lentils, sambusas, Ethiopian coffee.',diet:['Vegetarian platter','Vegan-friendly','Gluten-free injera (teff)']},
  playa:{name:'Playa Bowls',cuisine:'Açaí',price:'$$',dist:0.5,wait:7,tags:['cafe','fast','vegan'],open:true,late:false,badge:'🌺 Healthy pick',bg:'bg-acai',pills:[{t:'Open til 9pm',c:'pill-open'},{t:'~7 min',c:'pill-wait'},{t:'$10–$17',c:'pill-price'}],trust:{p:'"Stupid Cupid bowl is the go-to. Great healthy option near campus between classes."',s:'— Kevin L. · 5 check-ins'},menu:'Açaí bowls, pitaya bowls, smoothies. Stupid Cupid, Pineapple Mango, Tropical Storm.',diet:['Vegan','Gluten-free','Dairy-free options']},
  spice6:{name:'Spice 6',cuisine:'Indian',price:'$',dist:0.5,wait:8,tags:['asian','fast','vegan','halal'],open:true,late:false,badge:'🍛 Chipotle-style',bg:'bg-india',pills:[{t:'Open til 9pm',c:'pill-open'},{t:'~8 min',c:'pill-wait'},{t:'$10–$16',c:'pill-price'}],trust:{p:'"Indian food served Chipotle-style. The naan pizza with tikka masala is $14 and legitimately massive."',s:'— Priya M. · 7 check-ins'},menu:'Naan pizza, tikka masala bowls, saag, dal, basmati rice, samosas.',diet:['Vegetarian','Vegan options','Halal']},
  busboys:{name:'Busboys & Poets',cuisine:'American',price:'$$',dist:1.5,wait:0,tags:['cafe','sitdown','vegan'],open:true,late:true,badge:'📚 Study spot',bg:'bg-cafe',pills:[{t:'Open late',c:'pill-open'},{t:'Sit-down',c:'pill-wait'},{t:'$15–$30',c:'pill-price'}],trust:{p:'"Vegan nachos are legitimately amazing. Free coffee refills. Great for a long study afternoon."',s:'— Kevin L. · 3 check-ins'},menu:'Vegan nachos, avocado toast, burgers, cocktails, coffee with free refills.',diet:['Strong vegan menu','Gluten-free options']},
  canes:{name:"Raising Cane's",cuisine:'Chicken fingers',price:'$',dist:0.5,wait:8,tags:['fast'],open:true,late:true,badge:'🍗 Box combo',bg:'bg-cafe',pills:[{t:'Open late',c:'pill-open'},{t:'~8 min',c:'pill-wait'},{t:'$10–$15',c:'pill-price'}],trust:{p:'"Three Finger Combo with Cane\'s sauce and crinkle fries — simple menu, never misses. Always packed after class."',s:'— Kevin B. · 4 check-ins'},menu:"Chicken finger boxes (3, 4, caniac), combo meals, crinkle fries, coleslaw, Texas Toast, Cane's sauce.",diet:['No vegetarian options']},
  saburo:{name:'Saburo Ramen',cuisine:'Japanese',price:'$$',dist:0.8,wait:15,tags:['asian','sitdown'],open:true,late:false,badge:'🍖 Inside Kangnam',bg:'bg-ramen',pills:[{t:'Open til 9pm',c:'pill-open'},{t:'~15 min',c:'pill-wait'},{t:'$12–$16',c:'pill-price'}],trust:{p:'"Get the tonkotsu pork spicy ramen — about $13 with tax. Stick to the ramen menu, skip the KBBQ."',s:'— Player72 · 2 check-ins'},menu:'Tonkotsu pork ramen (regular or spicy), shoyu ramen, gyoza. Located inside Kangnam BBQ at 8503 Route 1.',diet:['Vegetarian broth available']},
  hanami:{name:'Hanami',cuisine:'Sushi',price:'$$',dist:0.4,wait:20,tags:['asian','sitdown'],open:true,late:false,badge:'🍣 Sushi',bg:'bg-sushi',pills:[{t:'Open til 10pm',c:'pill-open'},{t:'~20 min',c:'pill-wait'},{t:'$15–$25',c:'pill-price'}],trust:{p:'"Same plaza as Taqueria Habanero. Good sushi for the price — solid for College Park."',s:'— imanawkwardloser · 3 check-ins'},menu:'Sushi rolls, sashimi, nigiri, bento boxes, miso soup. Lunch specials.',diet:['Gluten-free soy sauce available']},
  pupuseria:{name:'Pupuseria La Familiar',cuisine:'Salvadoran',price:'$',dist:0.4,wait:10,tags:['latin','fast'],open:true,late:false,badge:'🫓 3 for $7',bg:'bg-latin',pills:[{t:'Open til 9pm',c:'pill-open'},{t:'~10 min',c:'pill-wait'},{t:'$6–$12',c:'pill-price'}],trust:{p:'"3 pupusas is a solid meal for like $7. Get the carne asada too. Across from The Varsity — slept on."',s:'— d3f3n3strat3 · 2 check-ins'},menu:'Pupusas (cheese, chicharrón, loroco), carne asada, tamales.',diet:['Vegetarian pupusas','Gluten-free options']},
  jumbojumbo:{name:'Jumbo Jumbo',cuisine:'Taiwanese',price:'$',dist:0.5,wait:12,tags:['asian','fast'],open:true,late:false,badge:'🐔 Taiwanese chicken',bg:'bg-chinese',pills:[{t:'Open til 9pm',c:'pill-open'},{t:'~12 min',c:'pill-wait'},{t:'$10–$15',c:'pill-price'}],trust:{p:'"Taiwanese fried chicken is elite. Shrimp with lobster sauce on rice is also a must. Next to Domain Apartments."',s:'— asianmathmajor · 4 check-ins'},menu:'Taiwanese fried chicken, shrimp with lobster sauce on rice, bubble tea combos.',diet:['Dairy-free options']},
  tacosmadre:{name:'Tacos a La Madre',cuisine:'Mexican',price:'$',dist:0.7,wait:10,tags:['mexican','fast','vegan'],open:true,late:false,badge:'💧 Agua fresca',bg:'bg-mex',pills:[{t:'Open til 9pm',c:'pill-open'},{t:'~10 min',c:'pill-wait'},{t:'$3–$15',c:'pill-price'}],trust:{p:'"Shrimp, al pastor, and fried zucchini tacos at $3.25 each. The specialty fries are a massive portion."',s:'— atlas229999 · 3 check-ins'},menu:'Tacos (shrimp, al pastor, zucchini), specialty fries bundle ($15), agua fresca.',diet:['Vegetarian zucchini tacos','Vegan options']},
  federalist:{name:'Federalist Pig',cuisine:'BBQ',price:'$$',dist:1.5,wait:15,tags:['sitdown'],open:true,late:false,badge:'🥩 Legit BBQ',bg:'bg-bbq',pills:[{t:'Open til 9pm',c:'pill-open'},{t:'~15 min',c:'pill-wait'},{t:'$15–$25',c:'pill-price'}],trust:{p:'"Legit BBQ on Route 1 near Busboys. Brisket and pulled pork are the real deal."',s:'— imanawkwardloser · 2 check-ins'},menu:'Brisket, pulled pork, ribs, sandwiches, mac & cheese, collard greens.',diet:['Gluten-free meat options']},
  theHall:{name:'The Hall CP',cuisine:'American',price:'$$',dist:0.6,wait:0,tags:['sitdown','cafe'],open:true,late:true,badge:'🍩 Chicken donut',bg:'bg-bbq',pills:[{t:'Open late',c:'pill-open'},{t:'Bar + kitchen',c:'pill-wait'},{t:'$15–$25',c:'pill-price'}],trust:{p:'"Chicken sandwich on a glazed donut is unhinged in the best way. Good bar — better as a sit-down experience."',s:'— imanawkwardloser · 3 check-ins'},menu:'Donut chicken sandwich, burgers, loaded fries, full bar. Weekend brunch.',diet:['Vegetarian burger available']},
  ritchies:{name:"Ritchie's Colombian",cuisine:'Colombian',price:'$',dist:0.5,wait:10,tags:['latin','fast'],open:true,late:false,badge:'🫔 Arepas',bg:'bg-latin',pills:[{t:'Open til 8pm',c:'pill-open'},{t:'~10 min',c:'pill-wait'},{t:'$10–$16',c:'pill-price'}],trust:{p:'"Never had a bad meal. 2 empanadas and an arepa for $15. The arepas are incredible and criminally underrated."',s:'— UMD_dobre_sightings · 3 check-ins'},menu:'Arepas, empanadas, bandeja paisa, Colombian breakfast plates.',diet:['Vegetarian arepas available']},
  yums:{name:"Yum's Express",cuisine:'Chinese',price:'$',dist:0.8,wait:12,tags:['asian','fast'],open:true,late:false,badge:'🥡 Own delivery',bg:'bg-chinese',pills:[{t:'Open til 9pm',c:'pill-open'},{t:'~12 min',c:'pill-wait'},{t:'$10–$15',c:'pill-price'}],trust:{p:'"Pork lo mein is the move. They have their own driver so you can tip directly without third-party fees."',s:'— Undercoverbazooka · 2 check-ins'},menu:'Pork lo mein, orange chicken, fried rice, General Tso, combo plates.',diet:['Vegetarian fried rice']},
  franklinsbeer:{name:"Franklin's",cuisine:'American',price:'$$$',dist:1.8,wait:0,tags:['sitdown'],open:true,late:true,badge:'🍺 Craft beer + pizza',bg:'bg-cafe',pills:[{t:'Open late',c:'pill-open'},{t:'Sit-down',c:'pill-wait'},{t:'$15–$25',c:'pill-price'}],trust:{p:'"Good beer, good pizzas, great bratwurst. The gift shop has craft beer, hot sauces, and mead. Better when you\'re 21."',s:'— JimJamb0rino · 4 check-ins'},menu:'Artisan pizza, bratwurst, burgers, craft beer. Gift shop with hot sauces, mead, candy.',diet:['Vegetarian pizza available']},
  northwest:{name:'Northwest Chinese',cuisine:'Chinese',price:'$',dist:1.0,wait:10,tags:['asian','fast'],open:true,late:false,badge:'🥢 Cold noodles',bg:'bg-chinese',pills:[{t:'Open til 8pm',c:'pill-open'},{t:'~10 min',c:'pill-wait'},{t:'$9–$14',c:'pill-price'}],trust:{p:'"Amazing cold noodles — genuinely unlike anything else on Route 1. Super underrated Chinese spot."',s:'— Striking-Safe-3103 · 2 check-ins'},menu:'Cold noodles, dumplings, braised pork rice, mapo tofu, scallion pancake.',diet:['Vegetarian dumplings','Vegan noodles']},
  latao:{name:'LaTao Hot Pot',cuisine:'Chinese',price:'$$$',dist:0.9,wait:30,tags:['asian','sitdown'],open:true,late:false,badge:'🫕 Hot pot',bg:'bg-chinese',pills:[{t:'Open til 10pm',c:'pill-open'},{t:'~30 min',c:'pill-wait'},{t:'$25–$45',c:'pill-price'}],trust:{p:'"Pricey but all hot pot is great. The sushi side is actually affordable. Good for a special dinner."',s:'— JimJamb0rino · 2 check-ins'},menu:'All-you-can-eat hot pot, sushi, Korean BBQ fusion. Premium broth options.',diet:['Vegan broth available','Gluten-free dipping options']},
  eddiescafe:{name:"Eddie's Café",cuisine:'Chinese-American',price:'$',dist:1.2,wait:10,tags:['asian','fast'],open:true,late:false,badge:'🍊 Off Rhode Island',bg:'bg-chinese',pills:[{t:'Open til 8pm',c:'pill-open'},{t:'~10 min',c:'pill-wait'},{t:'$8–$14',c:'pill-price'}],trust:{p:'"Orange chicken, fried rice — all the classics done well. Off Rhode Island Ave, slightly off the beaten path but worth it."',s:'— fifapotato88 · 2 check-ins'},menu:'Orange chicken, fried rice, lo mein, beef with broccoli, spring rolls.',diet:['Vegetarian fried rice']}
};

// ── STATE ─────────────────────────────────────────────────────────────────────
let savedSet = new Set();
let checkins = [];
let currentKey = null;
let voteOptions = ['habanero','qu','aroy'];
let voteCount = {habanero:3,qu:1,aroy:0};
let myVote = 'habanero';

// ── NAV ───────────────────────────────────────────────────────────────────────
const pages = ['home','filter','group','friends','saved','casestudy','profile'];
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
function renderHome(filter) {
  const all = Object.entries(R);
  let list = all;
  if(filter==='open') list=all.filter(([,r])=>r.open);
  else if(filter==='budget') list=all.filter(([,r])=>r.price==='$');
  else if(filter==='fast') list=all.filter(([,r])=>r.tags.includes('fast'));
  else if(filter==='sitdown') list=all.filter(([,r])=>r.tags.includes('sitdown'));
  else if(filter==='cafe') list=all.filter(([,r])=>r.tags.includes('cafe'));
  else if(filter==='vegan') list=all.filter(([,r])=>r.tags.includes('vegan'));
  else if(filter==='halal') list=all.filter(([,r])=>r.tags.includes('halal'));

  const forYou = list.slice(0,3);
  const budget = list.filter(([,r])=>r.price==='$').slice(0,6);
  const more = list.slice(3, list.length>6?9:list.length);
  const worth = list.filter(([,r])=>r.dist>1).slice(0,4);

  let h = '';
  h += `<div class="slabel">For You — based on your preferences</div><div class="cgrid">`;
  forYou.forEach(([k,r])=>{ h+=rCard(k,r); });
  h += `</div>`;
  if(budget.length){ h+=`<div class="slabel">Budget picks · Under $15</div><div class="mrow">`; budget.forEach(([k,r])=>{h+=rMini(k,r);}); h+=`</div>`; }
  if(more.length){ h+=`<div class="slabel">More nearby</div><div class="cgrid">`; more.forEach(([k,r])=>{h+=rCard(k,r);}); h+=`</div>`; }
  if(worth.length){ h+=`<div class="slabel">Worth the trip</div><div class="cgrid">`; worth.forEach(([k,r])=>{h+=rCard(k,r);}); h+=`</div>`; }
  h += `<div style="height:20px;"></div>`;
  document.getElementById('home-content').innerHTML = h;
}

// Parses "— Jordan T. · 6 check-ins" down to just the real name — no invented names.
function trustName(r){
  const m = r.trust && r.trust.s ? r.trust.s.replace(/^—\s*/,'').split('·')[0].trim() : '';
  return m || null;
}
const AVATAR_TOKENS = ['--avatar-red','--avatar-blue','--avatar-green','--avatar-purple','--avatar-orange','--avatar-teal'];
function avatarColorFor(name){
  let h = 0; for(let i=0;i<name.length;i++) h = (h*31 + name.charCodeAt(i)) % AVATAR_TOKENS.length;
  return `var(${AVATAR_TOKENS[h]})`;
}
function rFriendRow(r){
  const name = trustName(r);
  if(!name) return '';
  const initials = name.replace(/[^A-Za-z ]/g,'').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return `<div class="rfriends">
      <div class="rf-avatars"><div class="rf-avatar" style="background:${avatarColorFor(name)}">${initials}</div></div>
      <span class="rf-text">${name} checked in here</span>
    </div>`;
}
function rCard(k,r){
  const cs = CARD_STYLES[k] || {emoji:'🍽',grad:'linear-gradient(135deg,#1a1a1a,#333)'};
  const isSaved = savedSet.has(k);
  return `<div class="rcard" onclick="showDetail('${k}')">
    <div class="rimg">
      <div class="rimg-bg" style="background:${cs.grad}"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:52px;filter:drop-shadow(0 2px 12px rgba(0,0,0,0.6))">${cs.emoji}</div>
      <div class="rstatus ${r.open?'is-open':'is-closed'}"><span class="rstatus-dot"></span>${r.open?'Open':'Closed'}</div>
      <button class="rsave${isSaved?' is-saved':''}" onclick="event.stopPropagation();quickSave('${k}',this)">${isSaved?'♥':'♡'}</button>
    </div>
    <div class="rbody">
      <div class="rname">${r.name}</div>
      <div class="rmeta">${r.price} · ${r.cuisine} · ${r.dist} mi</div>
      ${rFriendRow(r)}
    </div>
  </div>`;
}
function quickSave(key, btn){
  if(savedSet.has(key)){ savedSet.delete(key); showToast('Removed from saved'); }
  else { savedSet.add(key); showToast('Saved! ♥'); }
  const isSaved = savedSet.has(key);
  btn.textContent = isSaved ? '♥' : '♡';
  btn.classList.toggle('is-saved', isSaved);
  updateStats();
}

function rMini(k,r){
  const cs = CARD_STYLES[k] || {emoji:'🍽',grad:'linear-gradient(135deg,#1a1a1a,#333)'};
  return `<div class="mcard" onclick="showDetail('${k}')">
    <div class="mimg">
      <div class="mimg-bg" style="background:${cs.grad}"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:34px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.6))">${cs.emoji}</div>
      <div class="mimg-ov"></div>
      <div class="mbadge">${r.price} · ${r.dist} mi</div>
    </div>
    <div class="mbody"><div class="mname">${r.name}</div><div class="msub">${r.cuisine} · ${r.wait} min</div></div>
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
function showDetail(key) {
  const r = R[key]; if(!r) return;
  currentKey = key;
  document.getElementById('dname').textContent = r.name;
  document.getElementById('dsub').textContent = `${r.cuisine} · ${r.price} · ${r.dist} mi away`;
  const cs = CARD_STYLES[key] || {emoji:'🍽',grad:'linear-gradient(135deg,#1a1a1a,#333)'};
  const heroBg = document.getElementById('dhero-bg');
  heroBg.className = 'dhero-bg';
  heroBg.style.background = cs.grad;
  let heroEmoji = document.getElementById('dhero-emoji');
  if(!heroEmoji){ heroEmoji = document.createElement('div'); heroEmoji.id='dhero-emoji'; heroEmoji.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:80px;filter:drop-shadow(0 4px 20px rgba(0,0,0,0.6));z-index:1;'; document.querySelector('.dhero').insertBefore(heroEmoji, document.querySelector('.dhero-ov')); }
  heroEmoji.textContent = cs.emoji;
  document.getElementById('dpills').innerHTML = r.pills.map(p=>`<div class="pill ${p.c}">${p.t}</div>`).join('');
  document.getElementById('dtrust').innerHTML = `<p>${r.trust.p}</p><p class="src">${r.trust.s}</p>`;
  document.getElementById('dmenu').textContent = r.menu;
  document.getElementById('ddiet').innerHTML = r.diet.map(d=>`<div class="dtag">✓ ${d}</div>`).join('');
  const isSaved = savedSet.has(key);
  const sb = document.getElementById('save-btn');
  sb.textContent = isSaved ? '♥ Saved' : '♡ Save';
  sb.className = 'abtn'+(isSaved?' saved-active':'');
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
  if(savedSet.has(currentKey)){ savedSet.delete(currentKey); showToast('Removed from saved'); }
  else { savedSet.add(currentKey); showToast('Saved! ♥'); }
  const isSaved = savedSet.has(currentKey);
  const sb = document.getElementById('save-btn');
  sb.textContent = isSaved?'♥ Saved':'♡ Save';
  sb.className = 'abtn'+(isSaved?' saved-active':'');
  updateStats();
}

function saveFromFeed(key) { savedSet.add(key); showToast(`Saved ${R[key]?.name}! ♥`); updateStats(); }

function checkIn() {
  if(!currentKey) return;
  const btn = document.getElementById('checkin-btn');
  btn.textContent = '✓ Checked In!'; btn.className = 'checkin-btn done';
  const r = R[currentKey];
  if(!checkins.find(h=>h.key===currentKey)) checkins.unshift({key:currentKey,name:r.name,cuisine:r.cuisine,price:r.price,date:'Today'});
  updateStats(); showToast(`Checked into ${r.name}!`);
}

// ── SAVED ─────────────────────────────────────────────────────────────────────
function renderSaved() {
  const el = document.getElementById('saved-content');
  if(!savedSet.size){ el.innerHTML=`<div class="empty-state">No saved spots yet.<br>Tap ♡ on any restaurant to save it here.<br><br><small style="color:var(--text-muted);">Tip: you can also save from the Friends Feed.</small></div>`; return; }
  let h = `<div class="saved-grid">`;
  savedSet.forEach(k=>{const r=R[k];if(!r)return;h+=`<div class="saved-item" onclick="showDetail('${k}')"><div><div class="saved-name">${r.name}</div><div class="saved-meta">${r.cuisine} · ${r.price} · ${r.dist} mi</div></div><div class="saved-remove" onclick="event.stopPropagation();unsave('${k}')">×</div></div>`;});
  h+=`</div>`;
  el.innerHTML = h;
}
function unsave(key){ savedSet.delete(key); renderSaved(); updateStats(); showToast('Removed from saved'); }

// ── GROUP ─────────────────────────────────────────────────────────────────────
function renderGroup() {
  const sg = document.getElementById('gsugg');
  if(sg) sg.innerHTML = Object.entries(R).slice(0,12).map(([k,r])=>`<div class="gchip" onclick="addToVote('${k}')">${r.name}</div>`).join('');
  renderVoteCards();
}
function addToVote(key) {
  if(voteOptions.includes(key)){ showToast('Already in the vote!'); return; }
  voteOptions.push(key); voteCount[key]=0; renderVoteCards(); showToast(`Added ${R[key].name} to the vote`);
}
function renderVoteCards() {
  const el = document.getElementById('vcards'); if(!el) return;
  const total = Object.values(voteCount).reduce((a,b)=>a+b,0);
  const maxV = Math.max(...voteOptions.map(k=>voteCount[k]||0));
  el.innerHTML = voteOptions.map(k=>{
    const r=R[k]; const v=voteCount[k]||0; const pct=total>0?Math.round(v/total*100):0; const leading=v===maxV&&v>0;
    return `<div class="vcard${myVote===k?' picked':''}" onclick="castVote('${k}')">
      <div class="vheader"><div class="vname">${r.name}</div>${leading?'<div class="vtag">Leading</div>':''}</div>
      <div class="vmeta">${r.cuisine} · ${r.price} · ${r.dist} mi · ${r.open?'Open now':'Closed'}</div>
      <div class="vbar-bg"><div class="vbar" style="width:${pct}%"></div></div>
      <div class="vcount">${v} of ${total} voted</div>
    </div>`;
  }).join('');
  const top = voteOptions.slice().sort((a,b)=>(voteCount[b]||0)-(voteCount[a]||0))[0];
  if(top && (voteCount[top]||0)>0){
    const r=R[top];
    document.getElementById('win-name').textContent = `${r.name} wins!`;
    document.getElementById('win-sub').textContent = `${r.dist} mi · ${r.cuisine} · ${r.price}`;
  }
}
function castVote(key) {
  if(myVote) voteCount[myVote]=Math.max(0,(voteCount[myVote]||1)-1);
  myVote=key; voteCount[key]=(voteCount[key]||0)+1; renderVoteCards();
}

// ── PROFILE ───────────────────────────────────────────────────────────────────
function renderProfile() {
  updateStats();
  const h = document.getElementById('visit-history');
  h.innerHTML = checkins.length ? checkins.map(c=>`<div class="hist"><div><div class="hname">${c.name}</div><div class="hsub">${c.cuisine} · ${c.price}</div></div><div class="hdate">${c.date}</div></div>`).join('') : `<div style="font-size:13px;color:var(--text-muted);padding:8px 0;">No visits yet — check in after eating!</div>`;
}
function updateStats(){
  const ci=document.getElementById('stat-ci');const sv=document.getElementById('stat-sv');
  if(ci)ci.textContent=checkins.length;if(sv)sv.textContent=savedSet.size;
}

// ── SURPRISE ME ───────────────────────────────────────────────────────────────
const rkeys=Object.keys(R);let sIdx=0;
function surpriseMe(){ showDetail(rkeys[sIdx++%rkeys.length]); }

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

// ── CASE STUDY NAV ────────────────────────────────────────────────────────────
function csScroll(sectionId) {
  const el = document.getElementById('cs-'+sectionId);
  if(!el) return;
  const scroll = document.getElementById('main-scroll');
  // account for sticky nav height (~44px) + cs-nav (~44px)
  const offset = el.getBoundingClientRect().top + scroll.scrollTop - 88;
  scroll.scrollTo({ top: offset, behavior: 'smooth' });
  document.querySelectorAll('.cs-nav-item').forEach(n=>n.classList.remove('active'));
  const map = {intro:0,research:1,ideation:2,prototype:3,testing:4,reflection:5};
  const idx = map[sectionId];
  if(idx !== undefined) document.querySelectorAll('.cs-nav-item')[idx]?.classList.add('active');
}

// Update case study nav active state on scroll
document.getElementById('main-scroll').addEventListener('scroll', function() {
  if(!document.getElementById('panel-casestudy').classList.contains('active')) return;
  const sections = ['intro','research','ideation','prototype','testing','reflection'];
  const navItems = document.querySelectorAll('.cs-nav-item');
  const scrollTop = this.scrollTop + 100;
  let active = 0;
  sections.forEach((id, i) => {
    const el = document.getElementById('cs-'+id);
    if(el && el.offsetTop <= scrollTop) active = i;
  });
  navItems.forEach((n,i) => n.classList.toggle('active', i===active));
});

// ── INIT ──────────────────────────────────────────────────────────────────────
renderHome('all');
