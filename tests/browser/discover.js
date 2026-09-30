<script>
window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));const _ce=console.error;console.error=(...a)=>{__errs.push(a.map(String).join(' '));_ce(...a);};
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];const T=e=>e?.textContent.replace(/\s+/g,' ').trim();
await wait(350); const o={};
// header
o.h1=T($('#panel-home h1')); o.sub=T($('#panel-home .ph-sub')); o.noLocPill=!$('.loc-pill');
o.toggle=$$('.tt-view-btn').map(b=>T(b)+(b.disabled?'(disabled)':'')+'='+b.getAttribute('aria-pressed')).join(' | ');
// bands
o.heads=$$('#home-content .tt-walk-label').map(T).join(' | ');
const bandCards=$$('#home-content .tt-walk:not(.tt-walk--row) .tt-card-link').map(T);
o.bandCardCount=bandCards.length+' unique='+new Set(bandCards).size+' of '+(await TerpData.getRestaurants()).length;
o.fiveGuysBand=T([...$$('#home-content .tt-walk')].find(s=>s.textContent.includes('Five Guys'))?.querySelector('.tt-walk-label'));
o.bandOrderOK=(()=>{const d=$$('#home-content .tt-walk:not(.tt-walk--row) .tt-data span:nth-child(2)').map(s=>parseFloat(s.textContent));return d.every((x,i)=>i===0||d[i-1]<=x);})();
o.oldSections=$$('.slabel').length;
// surprise me: random, no immediate repeats
const picks=[];for(let i=0;i<8;i++){ go('home'); await wait(60); $('#surprise-btn').click(); await wait(80); picks.push(T($('.tt-detail-name'))); }
o.surpriseDistinct=new Set(picks).size; o.noRepeat=picks.every((p,i)=>i===0||p!==picks[i-1]);
go('home'); await wait(100); toggleFilter('cuisine:Mexican'); await wait(150);
o.searchHead=T($('.tt-results-count')); o.searchBands=$$('#home-content .tt-walk-label').map(T).join(' | ');
const mex=[]; for(let i=0;i<5;i++){ go('home'); await wait(60); $('#surprise-btn').click(); await wait(80); mex.push(T($('.tt-detail-name'))); }
o.surpriseRespectsFilter=[...new Set(mex)].join(', ');
clearAllFilters(); go('home'); await wait(100);
// visit = review
await showDetail('aroy');
o.detailButtons=$$('#detail-root button').map(b=>T(b)).filter(t=>/check|rate|went|review/i.test(t)).join(' | ');
$('#detail-visit [data-action="review"]').click(); await wait(40);
$('#detail-review input[name="rating"][value="5"]').click(); $$('#detail-review [data-dish]')[0].click(); $('#detail-review form').requestSubmit(); await wait(150);
o.afterPost=T($('#detail-visit'))+' | toast='+T($('#toast-msg'));
go('profile'); await wait(150); o.visitsStat=T($('#stat-ci'))+' '+T($('#stat-ci').nextElementSibling); o.history=T($('#visit-history'));
go('crew'); await wait(200); o.crewFirst=T($('#crew-activity .tt-activity-head'));
o.errors=__errs;
const p=document.createElement('pre');p.id='RESULT';p.textContent=JSON.stringify(o);document.body.appendChild(p);})();
</script>
