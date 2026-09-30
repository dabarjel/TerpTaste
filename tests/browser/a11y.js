<script>
window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));const _ce=console.error;console.error=(...a)=>{__errs.push(a.map(String).join(' '));_ce(...a);};
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];const T=e=>e?.textContent.replace(/\s+/g,' ').trim();
localStorage.clear(); await wait(400); const o={};
const nameOf=el=>(el.getAttribute('aria-label')||T(el)||(el.labels&&el.labels[0]&&T(el.labels[0]))||'').trim();
const unnamed=()=>$$('button, a[href], input:not([type=radio]), [role=button]').filter(el=>el.offsetParent!==null&&!nameOf(el)).map(el=>el.outerHTML.slice(0,80));
const audit={};
for(const p of ['home','filter','crew','deals','saved','profile']){ go(p); await wait(250); audit[p]={unnamed:unnamed().length,h1:$$('#panel-'+p+' h1').length,focus:document.activeElement.tagName+(document.activeElement.matches('h1')?':'+T(document.activeElement):''),title:document.title}; }
o.screens=audit;
const ids=$$('[id]').map(e=>e.id);o.dupIds=ids.filter((x,i)=>ids.indexOf(x)!==i);
o.skipFirst=T(document.querySelector('a,button,input'))+' → '+$('.tt-skip').getAttribute('href')+' exists='+!!document.getElementById('main');
o.svgsExposed=$$('svg:not([aria-hidden="true"])').length;
o.imgsNoAlt=$$('img:not([alt])').length;
o.htmlLang=document.documentElement.lang;
// detail: title + heading focus; Back returns focus to the opener card
go('home'); await wait(250);
const link=$$('#home-content .tt-card-link').find(b=>T(b)==='Marathon Deli'); link.focus(); link.click(); await wait(200);
o.detailTitle=document.title; o.detailFocus=document.activeElement.className+':'+T(document.activeElement);
o.detailUnnamed=unnamed().length;
$('#detail-root [data-action="back"]').click(); await wait(300);
o.backFocus=document.activeElement.dataset.open+' in '+document.activeElement.closest('.panel').id;
// review form: invalid wiring
await showDetail('hanami'); $('#detail-visit [data-action="review"]').click(); await wait(50);
$('#detail-review form').requestSubmit(); await wait(30);
const star=$('#detail-review input[name="rating"]'); o.invalidStars=star.getAttribute('aria-invalid')+' → '+star.getAttribute('aria-describedby')+' focused='+(document.activeElement===star);
star.click(); $('#detail-review form').requestSubmit(); await wait(30);
const got=$('#detail-review input[name="got"]'); o.invalidGot=got.getAttribute('aria-invalid')+' starsCleared='+!star.hasAttribute('aria-invalid');
$('#detail-review input[name="got"]').value='Nigiri'; $('#detail-review form').requestSubmit(); await wait(150);
o.focusAfterPost=T(document.activeElement);
// remove review from the edit form
$('#detail-visit [data-action="review"]').click(); await wait(50); o.removeBtn=!!$('#detail-review [data-action="remove-review"]');
$('#detail-review [data-action="remove-review"]').click(); await wait(150); o.afterRemove=T($('#detail-visit'))+' | '+T($('#toast-msg'));
// toast: pauses while hovered/focused, Escape closes
showToast('Test', {action:{label:'Undo',run:()=>{}}}); const t=$('#toast');
t.dispatchEvent(new MouseEvent('mouseenter')); $('#toast-action').focus(); await wait(8500); o.toastPausedStillShown=t.classList.contains('show');
document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})); o.toastEscClosed=!t.classList.contains('show');
o.reducedMotionRule=[...document.styleSheets].some(s=>{try{return [...s.cssRules].some(r=>r.conditionText&&r.conditionText.includes('reduce'))}catch(e){return false}});
o.errors=__errs;
const p=document.createElement('pre');p.id='RESULT';p.textContent=JSON.stringify(o);document.body.appendChild(p);})();
</script>
