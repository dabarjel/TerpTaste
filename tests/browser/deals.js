<script>
window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));const _ce=console.error;console.error=(...a)=>{__errs.push(a.map(String).join(' '));_ce(...a);};
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
await wait(350); const o={today:TerpData.todayKey()};
o.nav=$$('.snav').map(b=>b.dataset.nav).join(',')+' | '+$$('.nitem').map(b=>b.dataset.nav).join(',');
o.stripHidden=$('#deals-today').hidden; o.strip=$$('#deals-today .tt-deal').map(d=>d.textContent.replace(/\s+/g,' ').trim()).join(' || ');
const card=name=>$$('#home-content .tt-card').find(c=>c.querySelector('.tt-card-link').textContent===name);
const mc=card('Marathon Deli'); o.marathonTag=mc?.querySelector('.tt-deal-tag')?.textContent||null;
o.order=[...card('Taqueria Habanero').querySelector('.tt-card-body').children].map(e=>e.className.split(' ')[0]).join(' > ');
o.noCheckedInOnCards=!$$('#home-content .tt-card').some(c=>/checked in|Student review/.test(c.textContent));
o.tagsOnOtherCards=$$('#home-content .tt-deal-tag').length;
// Deals tab
$('#sb-deals').click(); await wait(150);
o.dealsHeads=$$('.tt-deal-day-title').map(h=>h.textContent).join(' | '); o.dealsNote=!!$('.tt-deal-note');
o.dealsItems=$$('#deals-content .tt-deal').map(d=>d.textContent.replace(/\s+/g,' ').trim()).join(' || ');
o.dealsCurrent=$('#sb-deals').getAttribute('aria-current')+'/'+$('#mn-deals').getAttribute('aria-current');
// place link opens detail, back returns to deals
$('#deals-content [data-open="marathon"]').click(); await wait(150);
o.detailDeals=$$('#detail-root .tt-deal').map(d=>d.textContent.replace(/\s+/g,' ').trim()).join(' || ');
o.detailPlaceLink=!!$('#detail-root .tt-deal-place'); o.back=$('#detail-root [data-action="back"]').textContent.trim();
$('#detail-root [data-action="back"]').click(); await wait(150); o.backToDeals=$('#panel-deals').classList.contains('active');
// app deal (only if injected)
const app=$$('.tt-deal-out'); o.appLinks=app.map(a=>a.getAttribute('href')+' target='+a.target).join(' | ');
o.appPrice=$$('#deals-content .tt-deal').filter(d=>d.querySelector('.tt-deal-out')).map(d=>!!d.querySelector('.tt-deal-price')).join(',');
o.errors=__errs;
const p=document.createElement('pre');p.id='RESULT';p.textContent=JSON.stringify(o);document.body.appendChild(p);})();
</script>
