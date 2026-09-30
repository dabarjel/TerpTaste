<script>
window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));const _ce=console.error;console.error=(...a)=>{__errs.push(a.map(String).join(' '));_ce(...a);};
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];const T=e=>e?.textContent.replace(/\s+/g,' ').trim();
localStorage.clear(); await wait(350); const o={};
o.nav=$$('.snav').map(b=>b.dataset.nav).join(',')+' | '+$$('.nitem').map(b=>T(b)).join(',');
o.oldPanels=!!document.getElementById('panel-group')||!!document.getElementById('panel-friends');
o.sections=$$('#home-content .tt-walk-label').map(T).join(' | ');
o.lovedRow=$$('#home-content .tt-hrow')[0]?.querySelectorAll('.tt-card-link') ? [...$$('#home-content .tt-hrow')[0].querySelectorAll('.tt-card-link')].map(T).join(', ') : null;
const card=n=>$$('#home-content .tt-card').find(c=>T(c.querySelector('.tt-card-link'))===n);
o.habRating=T(card('Taqueria Habanero').querySelector('.tt-friends-rating [aria-hidden]'));
o.habOrder=[...card('Taqueria Habanero').querySelector('.tt-card-body').children].map(e=>e.className.split(' ')[0]).join(' > ');
o.noRatingOnUnrated=!card('Playa Bowls').querySelector('.tt-friends-rating');
// Crew
$('#sb-crew').click(); await wait(200);
o.crewSections=$$('#panel-crew .tt-section-title').map(T).join(' | ');
o.activityCount=$$('#crew-activity .tt-activity').length; o.firstActivity=T($('#crew-activity .tt-activity'));
o.voteInCrew=!!$('#panel-crew #vote-board .tt-state-title, #panel-crew #vote-board .tt-board');
$('#crew-activity [data-vote-add="habanero"]').click(); await wait(100); o.addFromActivity=T($('#toast-msg'))+' | board='+!!$('#vote-board .tt-board');
$('#crew-activity [data-save="aroy"]').click(); await wait(50); o.saveFromActivity=T($('#crew-activity [data-save="aroy"]'));
// Detail from crew
$('#crew-activity [data-open="habanero"]').click(); await wait(150);
o.back=T($('#detail-root [data-action="back"]'));
o.detailSections=$$('#detail-root .tt-dsec-title').map(T).join(' | ');
o.friendsWhoveBeen=$$('#detail-root .tt-activity').length;
// detail → View vote goes to crew vote section
$('#detail-root [data-action="vote"]').click(); await wait(50); o.voteToast=T($('#toast-msg'))+' ['+T($('#toast-action'))+']';
await showDetail('hanami'); await wait(50);
o.hanamiSections=$$('#detail-root .tt-dsec-title').map(T).join(' | ');
// review flow
$('#detail-visit [data-action="review"]').click(); await wait(50);
const form=$('#detail-review form'); o.formOpen=!!form+' expanded='+$('#detail-visit [data-action="review"]').getAttribute('aria-expanded');
o.dishOptions=$$('#detail-review [data-dish]').map(T).slice(0,4).join(' | ');
form.requestSubmit(); await wait(30); o.errNoRating=T($('#detail-review .tt-form-error'));
$('#detail-review input[name="rating"][value="5"]').click(); form.requestSubmit(); await wait(30); o.errNoDish=T($('#detail-review .tt-form-error'));
$$('#detail-review [data-dish]')[0].click(); o.pickedDish=$('#detail-review input[name="got"]').value+' pressed='+$$('#detail-review [data-dish]')[0].getAttribute('aria-pressed');
$('#detail-review input[name="note"]').value='Solid rolls for the price.';
form.requestSubmit(); await wait(150);
o.afterPost=$$('#detail-root .tt-dsec-title').map(T).join(' | ')+' || '+T($('#toast-msg'));
o.highlightsAfter=$$('#detail-root .tt-dishes--large .tt-dish').map(T).join(', ');
o.editLabel=T($('#detail-visit [data-action="review"]'));
$('#sb-crew').click(); await wait(200); o.crewFirst=T($('#crew-activity .tt-activity .tt-activity-head'));
await showDetail('hanami'); $('#detail-visit [data-action="review"]').click(); await wait(30);
o.editPrefilled=$('#detail-review input[name="rating"]:checked')?.value+' / '+$('#detail-review input[name="got"]').value;
$('#detail-review [data-action="cancel-review"]').click(); await wait(30); o.cancelClosed=$('#detail-review').hidden;
// undo a new review
await showDetail('qu'); $('#detail-visit [data-action="review"]').click(); await wait(30);
$('#detail-review input[name="rating"][value="2"]').click(); $('#detail-review input[name="got"]').value='Gyoza'; $('#detail-review form').requestSubmit(); await wait(150);
$('#toast-action').click(); await wait(150); o.undoReview=!$$('#detail-root .tt-dsec-title').some(h=>T(h)==='Your review');
// Five Guys
go('deals'); await wait(200); o.dealSections=$$('.tt-deal-day-title').map(T).join(' | ');
await showDetail('fiveguys'); o.fgDeal=T($('#detail-root .tt-deal')); o.fgDataRow=!!$('#detail-root .tt-detail-head .tt-data');
o.errors=__errs;
const p=document.createElement('pre');p.id='RESULT';p.textContent=JSON.stringify(o);document.body.appendChild(p);})();
</script>
