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

  // Omitted entirely when a spot has neither a price level nor a distance yet.
  function dataRow(r) {
    if (!price(r) && r.distanceMiles == null) return '';
    return `<div class="tt-data"><span>${price(r)}</span><span>${miles(r.distanceMiles)}</span><span class="tt-data-strong">${walkLabel(r.distanceMiles)}</span></div>`;
  }

  // ── Ratings and friends ───────────────────────────────────────────────────
  const starText = n => '★'.repeat(n) + '☆'.repeat(5 - n);
  const stars = n => `<span class="tt-stars" role="img" aria-label="${n} out of 5 stars">${starText(n)}</span>`;
  // "Friends: ★4.7 (3)" on cards, only when friends have rated the spot.
  function friendRating(r) {
    const fr = r.terp.friendRating;
    if (!fr) return '';
    return `<p class="tt-friends-rating"><span aria-hidden="true">Friends: <span class="tt-star">★</span>${fr.avg.toFixed(1)} (${fr.count})</span><span class="tt-visually-hidden">Friends rate it ${fr.avg.toFixed(1)} out of 5 from ${fr.count} ${fr.count === 1 ? 'rating' : 'ratings'}</span></p>`;
  }
  // "2h ago", "Yesterday", "3 days ago", then a date.
  function timeAgo(iso) {
    const ms = Date.now() - new Date(iso).getTime();
    const h = Math.floor(ms / 3600e3);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d === 1) return 'Yesterday';
    if (d < 7) return `${d} days ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  // One visit: who, where (optional), when, stars, what they got, note.
  function activityItem(a, { showPlace = true, actions = false } = {}) {
    const me = a.who.id === 'me';
    const who = me ? 'You' : a.who.name;
    return `<article class="tt-activity">
      <span class="tt-avatar tt-avatar--lg" style="background:${me ? 'var(--action)' : avatarColor(a.who.name)}" aria-hidden="true">${esc(me ? 'DA' : initials(a.who.name))}</span>
      <div class="tt-activity-body">
        <p class="tt-activity-head"><b>${esc(who)}</b>${showPlace ? ` went to <button type="button" class="tt-inline-link" data-open="${esc(a.place.id)}">${esc(a.place.name)}</button>` : ''}<span class="tt-when">${esc(timeAgo(a.at))}</span></p>
        <p class="tt-activity-rating">${stars(a.rating)}<span>Got ${esc(a.got)}</span></p>
        ${a.note ? `<p class="tt-activity-note">“${esc(a.note)}”</p>` : ''}
        ${actions ? `<div class="tt-activity-actions">${saveTextButton(a.place, { cls: 'tt-mini-btn', offLabel: '♡ Save spot' })}<button type="button" class="tt-mini-btn" data-vote-add="${esc(a.place.id)}" data-name="${esc(a.place.name)}">Add to group vote</button></div>` : ''}
      </div>
    </article>`;
  }

  // Quick review: stars, what you got (menu pick or typed), optional one line.
  function reviewForm(r) {
    const mine = r.terp.myReview;
    const options = [...new Set([...(r.terp.highlights || []), ...(r.terp.menuItems || [])])].slice(0, 10);
    const starInputs = [1, 2, 3, 4, 5].map(n => `<label class="tt-star-input"><input type="radio" name="rating" value="${n}"${mine?.rating === n ? ' checked' : ''}><span aria-hidden="true">★</span><span class="tt-visually-hidden">${n} ${n === 1 ? 'star' : 'stars'}</span></label>`).join('');
    return `<form class="tt-review-form" novalidate aria-labelledby="review-title">
      <h2 class="tt-dsec-title" id="review-title">${mine ? 'Edit your review' : `How was ${esc(r.name)}?`}</h2>
      <fieldset class="tt-field-group"><legend class="tt-field-label">Your rating</legend><div class="tt-star-row">${starInputs}</div></fieldset>
      <fieldset class="tt-field-group"><legend class="tt-field-label">What did you get?</legend>
        ${options.length ? `<div class="tt-fopts">${options.map(o => `<button type="button" class="tt-chip" data-dish="${esc(o)}" aria-pressed="${mine?.got === o}">${esc(o)}</button>`).join('')}</div>` : ''}
        <label class="tt-field"><span class="tt-field-hint">${options.length ? 'Or type it' : 'Type what you got'}</span><input type="text" name="got" maxlength="60" autocomplete="off" value="${esc(mine?.got || '')}"></label>
      </fieldset>
      <label class="tt-field"><span class="tt-field-label">One line <span class="tt-field-hint">(optional)</span></span><input type="text" name="note" maxlength="140" autocomplete="off" value="${esc(mine?.note || '')}"></label>
      <p class="tt-form-error" role="alert" hidden></p>
      <div class="tt-form-actions"><button type="submit" class="tt-btn tt-btn--primary">${mine ? 'Update review' : 'Post review'}</button><button type="button" class="tt-btn" data-action="cancel-review">Cancel</button></div>
    </form>`;
  }

  // Standout dishes. On cards the row is one line: tags that don't fit wrap onto a hidden
  // second line, so only whole tags ever show. No dishes → no row at all.
  function dishes(r, { large = false } = {}) {
    const list = r.terp.highlights || [];
    if (!list.length) return '';
    return `<ul class="tt-dishes${large ? ' tt-dishes--large' : ''}" aria-label="Standout dishes">${list.map(d => `<li class="tt-dish">${esc(d)}</li>`).join('')}</ul>`;
  }

  // ── Deals ─────────────────────────────────────────────────────────────────
  const DAY_NAMES = { sun:'Sunday', mon:'Monday', tue:'Tuesday', wed:'Wednesday', thu:'Thursday', fri:'Friday', sat:'Saturday' };
  const WHERE_LABEL = { 'in-store':'In store', 'uber-eats':'Uber Eats', 'doordash':'DoorDash' };
  const dayName = d => DAY_NAMES[d] || d;
  function dealDays(days, where = 'in-store') {
    if (!days.length) return where === 'in-store' ? 'Days not listed' : 'Days vary, check the app';
    if (days.length === 7) return 'Every day';
    if (days.length === 1) return `${dayName(days[0])}s`;
    return days.map(d => dayName(d).slice(0, 3)).join(', ');
  }
  const isAppDeal = d => d.where !== 'in-store';
  // App deals link out rather than promising a price the app controls.
  function dealAppUrl(d, placeName) {
    if (d.url) return d.url;
    const q = encodeURIComponent(placeName || '');
    return d.where === 'uber-eats' ? `https://www.ubereats.com/search?q=${q}` : `https://www.doordash.com/search/store/${q}/`;
  }
  function dealChecked(d) {
    return d.lastChecked ? `Last checked ${esc(formatDay(d.lastChecked))}` : 'Sample, not checked yet';
  }

  // Small tag on the card tile when the spot has a deal today.
  function dealTag(r) {
    const d = (r.terp.dealsToday || [])[0];
    return d ? `<span class="tt-deal-tag">Deal today: ${esc(d.title)}</span>` : '';
  }

  // One deal. The separate price only shows when the title doesn't already say it.
  // place names the spot (and the app search for app deals);
  // linkPlace shows it as a link to the detail page (off on the detail page itself).
  function dealItem(d, { place = null, linkPlace = true, showDays = true } = {}) {
    const app = isAppDeal(d);
    return `<article class="tt-deal">
      <div class="tt-deal-top">
        <h3 class="tt-deal-title">${esc(d.title)}</h3>
        ${!app && d.price != null && !d.title.includes('$') ? `<span class="tt-deal-price">$${d.price % 1 ? d.price.toFixed(2) : d.price}</span>` : ''}
      </div>
      ${place && linkPlace ? `<button type="button" class="tt-deal-place" data-open="${esc(place.id)}">${esc(place.name)}</button>` : ''}
      <p class="tt-deal-meta">${showDays ? `<span>${esc(dealDays(d.days, d.where))}</span>` : ''}<span>${esc(WHERE_LABEL[d.where])}</span></p>
      ${app ? `<a class="tt-link tt-deal-out" href="${esc(dealAppUrl(d, place?.name))}" target="_blank" rel="noopener">Check the price on ${esc(WHERE_LABEL[d.where])}<span class="tt-visually-hidden"> (opens in a new tab)</span></a>` : ''}
      <p class="tt-deal-checked">${d.sample && d.lastChecked ? 'Sample. ' : ''}${dealChecked(d)}</p>
    </article>`;
  }

  // compact: narrower card for horizontal rows.
  // Order: name, price/distance/walk time, dishes. The deal tag sits on the tile.
  function card(r, { compact = false } = {}) {
    return `<article class="tt-card${compact ? ' tt-card--compact' : ''}">
      <div class="tt-card-media">${photoTile(r)}${openStatus(r)}${saveButton(r)}${dealTag(r)}</div>
      <div class="tt-card-body">
        <h3 class="tt-card-name"><button type="button" class="tt-card-link" data-open="${esc(r.id)}">${esc(r.name)}</button></h3>
        ${dataRow(r)}
        ${dishes(r)}
        ${friendRating(r)}
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
        ${r.terp.myReview ? '' : '<button type="button" class="tt-link" data-action="review" aria-controls="detail-review">Rate it</button>'}
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
    // Order: your review, friends who've been, then the student review. A review by a friend
    // is already shown with their visit, so the student section only shows non-friends.
    const rv = t.review;
    const mine = t.myReview ? `<section class="tt-dsec">
        <h2 class="tt-dsec-title">Your review</h2>
        ${activityItem({ who: { id: 'me', name: 'You' }, place: r, rating: t.myReview.rating, got: t.myReview.got, note: t.myReview.note, at: t.myReview.date }, { showPlace: false })}
      </section>` : '';
    const friends = t.friendReviews?.length ? `<section class="tt-dsec">
        <h2 class="tt-dsec-title">Friends who’ve been</h2>
        <div class="tt-activity-list">${t.friendReviews.map(a => activityItem({ ...a, place: r }, { showPlace: false })).join('')}</div>
      </section>` : '';
    const review = rv && !rv.isFriend ? `<section class="tt-dsec">
        <h2 class="tt-dsec-title">Student review</h2>
        <blockquote class="tt-quote">
          <p>“${esc(rv.quote)}”</p>
          <footer>${esc(rv.author)}, ${rv.authorCheckIns} ${rv.authorCheckIns === 1 ? 'check-in' : 'check-ins'}</footer>
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
          <button type="button" class="tt-btn" data-action="review" aria-expanded="false" aria-controls="detail-review">${t.myReview ? 'Edit your review' : '★ Rate it'}</button>
        </div>
        <div id="detail-review" hidden></div>
        <div id="detail-checkin">${checkInBlock(r)}</div>
        <div class="tt-detail-cols">
          <div>
            ${t.highlights?.length ? `<section class="tt-dsec"><h2 class="tt-dsec-title">What to order</h2>${dishes(r, { large: true })}</section>` : ''}
            ${mine}
            ${friends}
            ${review}
            ${t.menu ? `<section class="tt-dsec"><h2 class="tt-dsec-title">On the menu</h2><p class="tt-dtext">${esc(t.menu)}</p></section>` : ''}
          </div>
          <div>
            ${t.deals?.length ? `<section class="tt-dsec"><h2 class="tt-dsec-title">Deals</h2><div class="tt-deal-list">${t.deals.map(d => dealItem(d, { place: r, linkPlace: false })).join('')}</div></section>` : ''}
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

  // ── Group vote scoreboard ─────────────────────────────────────────────────
  // vote: TerpData.getVote(); byId: Map of restaurants; changed: ids whose count just moved (flip).
  function voteStatus(vote, byId) {
    const n = `${vote.votedCount} of ${vote.total} voted`;
    const names = vote.leaders.map(id => byId.get(id)?.name || '').filter(Boolean);
    if (vote.state === 'waiting') return `No votes yet. ${n}.`;
    if (names.length > 1) return `<b>${vote.state === 'final' ? 'Final' : 'Tied'}:</b> ${names.map(esc).join(' and ')}${vote.state === 'final' ? ' tied' : ''}. ${n}.`;
    return `<b>${vote.state === 'final' ? 'Final' : 'Leading'}:</b> ${esc(names[0] || '')}. ${n}.`;
  }
  function scoreboard(vote, byId, { changed = [] } = {}) {
    const final = vote.state === 'final';
    const single = vote.leaders.length === 1 ? vote.leaders[0] : null;
    const voters = vote.members.map(m =>
      `<li class="tt-voter${m.voted ? ' is-voted' : ''}" title="${esc(m.name)}${m.voted ? ' voted' : ' hasn’t voted'}">
        <span class="tt-avatar" style="background:${m.id === 'me' ? 'var(--action)' : avatarColor(m.name)}" aria-hidden="true">${esc(m.initials)}</span>
        <span class="tt-voter-name">${esc(m.name)}</span><span class="tt-visually-hidden">${m.voted ? ', voted' : ', not voted yet'}</span>
      </li>`).join('');
    const rows = vote.options.map(o => {
      const r = byId.get(o.id);
      if (!r) return '';
      const lead = o.id === single;
      const mine = vote.mine === o.id;
      return `<li class="tt-vrow${lead ? ' is-leader' : ''}">
        <button type="button" class="tt-vrow-main" data-vote="${esc(o.id)}" aria-pressed="${mine}"${final ? ' disabled' : ''}>
          <span class="tt-vbar" aria-hidden="true"></span>
          <span class="tt-vrow-text">
            <span class="tt-vname">${esc(r.name)}${mine ? '<span class="tt-mine">Your vote</span>' : ''}</span>
            <span class="tt-vmeta">${price(r)}  ${miles(r.distanceMiles)}  ${walkLabel(r.distanceMiles)}</span>
          </span>
          <span class="tt-vcount" aria-label="${o.count} ${o.count === 1 ? 'vote' : 'votes'}"><span class="${changed.includes(o.id) ? 'flip' : ''}">${o.count}</span></span>
        </button>
        ${o.mine && !final ? `<button type="button" class="tt-vrow-remove" data-vote-remove="${esc(o.id)}" aria-label="Remove ${esc(r.name)} from the vote">Remove</button>` : ''}
      </li>`;
    }).join('');
    return `<section class="tt-board" aria-label="Group vote">
      <header class="tt-board-head">
        <h2 class="tt-board-title">${esc(vote.name)}</h2>
        <p class="tt-board-status" role="status">${voteStatus(vote, byId)}</p>
      </header>
      <ul class="tt-voters" aria-label="Who has voted">${voters}</ul>
      <ol class="tt-vrows">${rows}</ol>
      <footer class="tt-board-foot">${final
        ? `Everyone has voted. <button type="button" class="tt-link" data-action="reset">Start a new vote</button>`
        : 'Tap a spot to vote. You can change your vote until everyone has voted.'}</footer>
    </section>`;
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
    photoTile, openStatus, dishes, dealItem, dealTag, dealDays, dayName, card,
    stars, friendRating, timeAgo, activityItem, reviewForm, setSaveButton, saveTextButton, chip, formatDay,
    detail, detailSkeleton, checkInBlock, backButton, scoreboard, voteStatus,
    skeletonCards, emptyState, errorState, mount };
})();
