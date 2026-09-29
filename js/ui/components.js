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

  // Icon-only heart for cards. data-name lets any save button name the spot in toasts.
  function saveButton(r) {
    const on = !!r.terp.saved;
    return `<button type="button" class="tt-save" data-save="${esc(r.id)}" data-name="${esc(r.name)}" aria-pressed="${on}" aria-label="${on ? 'Remove' : 'Save'} ${esc(r.name)}">${on ? '♥' : '♡'}</button>`;
  }
  // Save button with a visible label (detail view, feed). data-off-label sets the unsaved text.
  function saveTextButton(r, { cls = 'tt-btn', offLabel = '♡ Save' } = {}) {
    const on = !!r.terp.saved;
    return `<button type="button" class="${cls}" data-save="${esc(r.id)}" data-name="${esc(r.name)}" data-style="text" data-off-label="${esc(offLabel)}" aria-pressed="${on}">${on ? '♥ Saved' : esc(offLabel)}</button>`;
  }
  // Update a save button in place after a toggle.
  function setSaveButton(btn, on, name) {
    btn.setAttribute('aria-pressed', on);
    if (btn.dataset.style === 'text') { btn.textContent = on ? '♥ Saved' : (btn.dataset.offLabel || '♡ Save'); return; }
    btn.setAttribute('aria-label', `${on ? 'Remove' : 'Save'} ${name}`);
    btn.textContent = on ? '♥' : '♡';
  }

  // "2026-09-29" → "Today" or "Sep 29".
  function formatDay(iso) {
    const d = new Date(`${iso}T12:00:00`);
    if (isNaN(d)) return iso || '';
    return d.toDateString() === new Date().toDateString() ? 'Today' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

  // ── Detail view ───────────────────────────────────────────────────────────
  const CHEVRON = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const backButton = label => `<button type="button" class="tt-back" data-action="back">${CHEVRON}${esc(label)}</button>`;

  // Check-in state comes from saved data, so it survives closing and reopening the page.
  function checkInBlock(r) {
    if (r.terp.checkIns > 0) {
      return `<div class="tt-checkin is-done">
        <span class="tt-checkin-text">✓ You checked in ${r.terp.lastCheckIn ? esc(formatDay(r.terp.lastCheckIn).replace(/^Today$/, 'today')) : ''}</span>
        <button type="button" class="tt-link" data-action="uncheckin">Remove check-in</button>
      </div>`;
    }
    return `<div class="tt-checkin">
      <button type="button" class="tt-btn tt-btn--primary tt-btn--block" data-action="checkin">Check in here</button>
      <p class="tt-checkin-hint">Been here? Checking in adds it to your visit history.</p>
    </div>`;
  }

  function detail(r, { backLabel = 'Back' } = {}) {
    const t = r.terp;
    const facts = [
      t.hoursNote && ['Hours', t.hoursNote, 'reported by students'],
      (t.waitNote || t.waitMinutes) && ['Wait', t.waitNote || `About ${t.waitMinutes} min`],
      t.priceRange && ['Typical price', t.priceRange],
    ].filter(Boolean);
    const rv = t.review;
    const review = rv ? `<section class="tt-dsec">
        <h2 class="tt-dsec-title">${rv.isFriend ? 'From your friends' : 'Student review'}</h2>
        <blockquote class="tt-quote">
          <p>“${esc(rv.quote)}”</p>
          <footer>${rv.isFriend ? `<span class="tt-avatar" style="background:${avatarColor(rv.author)}" aria-hidden="true">${esc(initials(rv.author))}</span>` : ''}${esc(rv.author)}, ${rv.authorCheckIns} ${rv.authorCheckIns === 1 ? 'check-in' : 'check-ins'}</footer>
        </blockquote>
      </section>` : '';
    return `<article class="tt-detail">
      <div class="tt-detail-hero">${photoTile(r)}${openStatus(r)}</div>
      <div class="tt-detail-body">
        ${backButton(backLabel)}
        <header class="tt-detail-head">
          <h1 class="tt-detail-name">${esc(r.name)}</h1>
          <p class="tt-detail-cuisine">${esc(r.primaryTypeDisplayName || '')}</p>
          ${dataRow(r)}
        </header>
        <div class="tt-detail-actions">
          ${saveTextButton(r)}
          <button type="button" class="tt-btn" data-action="vote">Add to group vote</button>
        </div>
        <div id="detail-checkin">${checkInBlock(r)}</div>
        <div class="tt-detail-cols">
          <div>
            ${review}
            ${t.menu ? `<section class="tt-dsec"><h2 class="tt-dsec-title">On the menu</h2><p class="tt-dtext">${esc(t.menu)}</p></section>` : ''}
          </div>
          <div>
            ${facts.length ? `<section class="tt-dsec"><h2 class="tt-dsec-title">Good to know</h2><dl class="tt-facts">${facts.map(([k, v, note]) =>
              `<div><dt>${esc(k)}</dt><dd>${esc(v)}${note ? ` <span class="tt-fact-note">${esc(note)}</span>` : ''}</dd></div>`).join('')}</dl></section>` : ''}
            ${t.dietNotes?.length ? `<section class="tt-dsec"><h2 class="tt-dsec-title">Dietary notes</h2><ul class="tt-dlist">${t.dietNotes.map(d => `<li>${esc(d)}</li>`).join('')}</ul></section>` : ''}
          </div>
        </div>
      </div>
    </article>`;
  }

  function detailSkeleton(backLabel) {
    return `<article class="tt-detail" aria-busy="true">
      <div class="tt-detail-hero"><div class="tt-skel-block tt-skel-hero"></div></div>
      <div class="tt-detail-body">${backButton(backLabel)}
        <div class="tt-skel-block tt-skel-title"></div><div class="tt-skel-block tt-skel-line"></div>
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
    photoTile, openStatus, trustLine, card, setSaveButton, saveTextButton, chip, formatDay,
    detail, detailSkeleton, checkInBlock, backButton,
    skeletonCards, emptyState, errorState, mount };
})();
