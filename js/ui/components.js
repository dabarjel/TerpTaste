// ── TerpTaste UI components ───────────────────────────────────────────────────
// Pure functions that take restaurant records (the TerpData shape) and return HTML.
// Styles live in css/components.css; every value comes from css/tokens.css.
// Interaction is wired by the page through data attributes:
//   data-open="<id>"    open the detail view
//   data-save="<id>"    toggle saved
//   data-action="<name>" buttons inside empty/error states, bound with UI.mount()

const UI = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  const PRICE_SYMBOL = { PRICE_LEVEL_INEXPENSIVE:'$', PRICE_LEVEL_MODERATE:'$$', PRICE_LEVEL_EXPENSIVE:'$$$', PRICE_LEVEL_VERY_EXPENSIVE:'$$$$' };
  const price = r => PRICE_SYMBOL[r.priceLevel] || '';

  // Walking at 3 mph = 20 min per mile. Past 20 min we call it a drive.
  const walkMinutes = mi => (mi == null ? null : Math.round(mi * 20));
  function walkLabel(mi) {
    const m = walkMinutes(mi);
    if (m == null) return '';
    return m > 20 ? 'drive' : `${m} min`;
  }
  const miles = mi => (mi == null ? '' : `${mi.toFixed(1)} mi`);

  const AVATAR_TOKENS = ['--avatar-red','--avatar-blue','--avatar-green','--avatar-purple','--avatar-orange','--avatar-teal'];
  function avatarColor(name) {
    let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_TOKENS.length;
    return `var(${AVATAR_TOKENS[h]})`;
  }
  const initials = name => name.replace(/[^A-Za-z ]/g, '').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Photo when the data has one; otherwise the cuisine name set large and cropped.
  // A photo that fails to load removes itself and the type tile shows through.
  function photoTile(r) {
    const photo = r.photos && r.photos[0] && r.photos[0].url;
    const word = r.primaryTypeDisplayName || r.name;
    return `<div class="tt-tile">
      <span class="tt-tile-word" aria-hidden="true">${esc(word)}</span>
      ${photo ? `<img class="tt-tile-img" src="${esc(photo)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : ''}
    </div>`;
  }

  // Only rendered when hours data gives a real answer.
  function openStatus(r) {
    if (typeof r.isOpenNow !== 'boolean') return '';
    return `<span class="tt-status${r.isOpenNow ? '' : ' is-closed'}">${r.isOpenNow ? 'Open' : 'Closed'}</span>`;
  }

  // Friends get their name; anyone else is labelled as a student review.
  function trustLine(r) {
    const rv = r.terp.review;
    if (!rv) return '';
    if (rv.isFriend) {
      const first = rv.author.split(' ')[0];
      return `<div class="tt-trust"><span class="tt-avatar" style="background:${avatarColor(rv.author)}" aria-hidden="true">${esc(initials(rv.author))}</span>${esc(first)} checked in</div>`;
    }
    return `<div class="tt-trust is-student">Student review</div>`;
  }

  function saveButton(r) {
    const on = !!r.terp.saved;
    return `<button type="button" class="tt-save" data-save="${esc(r.id)}" aria-pressed="${on}" aria-label="${on ? 'Remove' : 'Save'} ${esc(r.name)}">${on ? '♥' : '♡'}</button>`;
  }
  // Update a save button in place after a toggle.
  function setSaveButton(btn, on, name) {
    btn.setAttribute('aria-pressed', on);
    btn.setAttribute('aria-label', `${on ? 'Remove' : 'Save'} ${name}`);
    btn.textContent = on ? '♥' : '♡';
  }

  function dataRow(r) {
    return `<div class="tt-data"><span>${price(r)}</span><span>${miles(r.distanceMiles)}</span><span class="tt-data-strong">${walkLabel(r.distanceMiles)}</span></div>`;
  }

  // compact: narrower card for horizontal rows (no trust line).
  function card(r, { compact = false } = {}) {
    return `<article class="tt-card${compact ? ' tt-card--compact' : ''}">
      <div class="tt-card-media">${photoTile(r)}${openStatus(r)}${saveButton(r)}</div>
      <div class="tt-card-body">
        <h3 class="tt-card-name"><button type="button" class="tt-card-link" data-open="${esc(r.id)}">${esc(r.name)}</button></h3>
        ${compact ? '' : trustLine(r)}
        ${dataRow(r)}
      </div>
    </article>`;
  }

  function skeletonCards(n = 3, { compact = false } = {}) {
    const one = `<div class="tt-card tt-skel${compact ? ' tt-card--compact' : ''}" aria-hidden="true">
      <div class="tt-skel-block tt-skel-tile"></div>
      <div class="tt-card-body"><div class="tt-skel-block tt-skel-name"></div><div class="tt-skel-block tt-skel-line"></div></div>
    </div>`;
    return `<div class="tt-skel-group" role="status" aria-label="Loading restaurants">${one.repeat(n)}</div>`;
  }

  // action: { label, name, primary? }  → <button data-action="name">
  function actionButton(a) {
    return a ? `<button type="button" class="tt-btn${a.primary ? ' tt-btn--primary' : ''}" data-action="${esc(a.name)}">${esc(a.label)}</button>` : '';
  }
  function emptyState({ title, body, action } = {}) {
    return `<div class="tt-state">
      <h3 class="tt-state-title">${esc(title)}</h3>
      ${body ? `<p class="tt-state-body">${esc(body)}</p>` : ''}
      ${actionButton(action)}
    </div>`;
  }
  function errorState({ title = 'Restaurants didn’t load', body = 'Check your connection, then try again. Your saved spots are still here.', action = { label: 'Try again', name: 'retry', primary: true } } = {}) {
    return `<div class="tt-state tt-state--error" role="alert">
      <h3 class="tt-state-title">${esc(title)}</h3>
      <p class="tt-state-body">${esc(body)}</p>
      ${actionButton(action)}
    </div>`;
  }

  // Toggle chip. f is an opaque filter key the page interprets, e.g. "diet:vegan".
  function chip(label, { f, pressed = false, more = false } = {}) {
    return `<button type="button" class="tt-chip${more ? ' tt-chip--more' : ''}" data-f="${esc(f)}"${more ? '' : ` aria-pressed="${!!pressed}"`}>${esc(label)}</button>`;
  }

  // Insert HTML and bind any [data-action] buttons to the given handlers.
  function mount(el, html, handlers = {}) {
    el.innerHTML = html;
    el.querySelectorAll('[data-action]').forEach(b => {
      const fn = handlers[b.dataset.action];
      if (fn) b.addEventListener('click', fn);
    });
  }

  return { esc, price, walkMinutes, walkLabel, miles, avatarColor, initials,
    photoTile, openStatus, trustLine, card, setSaveButton, chip,
    skeletonCards, emptyState, errorState, mount };
})();
