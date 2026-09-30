<script>
window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));const _ce=console.error;console.error=(...a)=>{__errs.push(a.map(String).join(' '));_ce(...a);};
const wait=ms=>new Promise(r=>setTimeout(r,ms));const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const card=name=>$$('.tt-card').find(c=>c.querySelector('.tt-card-link')?.textContent===name);
const act=a=>$(`#detail-root [data-action="${a}"]`);
(async()=>{
 localStorage.clear(); await wait(300); const o={}; const sc=$('#main');
 // 1. Back to Discover restores scroll
 sc.scrollTop=700; await wait(50); const y=sc.scrollTop;
 card('Busboys & Poets').querySelector('.tt-card-link').click(); await wait(150);
 o.detailOpen=$('#panel-detail').classList.contains('active'); o.backLabel=act('back').textContent.trim(); o.navStillHome=$('#sb-home').getAttribute('aria-current')==='page';
 o.detailName=$('.tt-detail-name').textContent; o.reviewLabel=$$('.tt-dsec-title').map(e=>e.textContent).join('|');
 act('back').click(); await wait(200);
 o.backToHome=$('#panel-home').classList.contains('active'); o.scrollRestored=`${sc.scrollTop} (was ${y})`;
 // friend review label
 card('Taqueria Habanero').querySelector('.tt-card-link').click(); await wait(150);
 o.friendLabel=$('.tt-dsec-title').textContent;
 // 3a. Save from detail, unsave, Undo
 const sb=()=>$('#detail-root [data-save]');
 sb().click(); await wait(50); o.detailSaved=sb().textContent+' '+sb().getAttribute('aria-pressed');
 sb().click(); await wait(50); o.detailUnsaveToast=$('#toast-msg').textContent+' ['+$('#toast-action').textContent+']';
 $('#toast-action').click(); await wait(50); o.detailAfterUndo=sb().textContent+' / saved='+TerpData.savedIds().join(',');
 // 3b. Saved screen: order, remove via heart, Undo restores same position
 act('back').click(); await wait(150);
 ['aroy','qu'].forEach(id=>TerpData.setSaved(id,true));
 go('saved'); await wait(150);
 o.savedOrder=$$('#saved-content .tt-card-link').map(b=>b.textContent).join(', '); o.savedSub=$('#saved-sub').textContent;
 card('Aroy Thai').querySelector('[data-save]').click(); await wait(150);
 o.afterRemoveSaved=$$('#saved-content .tt-card-link').map(b=>b.textContent).join(', ');
 $('#toast-action').click(); await wait(150);
 o.afterUndoSaved=$$('#saved-content .tt-card-link').map(b=>b.textContent).join(', '); o.toastAfterUndo=$('#toast-msg').textContent;
 // Back to Saved
 card('Qu Japan').querySelector('.tt-card-link').click(); await wait(150); o.backLabelSaved=act('back').textContent.trim();
 act('back').click(); await wait(150); o.backToSaved=$('#panel-saved').classList.contains('active');
 // 3c. Home heart unsave + Undo
 go('home'); await wait(150); card('Qu Japan').querySelector('[data-save]').click(); await wait(50);
 o.homeUnsave=$('#toast-msg').textContent; $('#toast-action').click(); await wait(50);
 o.homeHeartAfterUndo=card('Qu Japan').querySelector('[data-save]').getAttribute('aria-pressed');
 // feed toggle reflects state
 go('crew'); await wait(50);
 const fb=$('#crew-activity [data-save="aroy"]'); o.feedAroy=fb.textContent+' '+fb.getAttribute('aria-pressed');
 fb.click(); await wait(50); o.feedAfterClick=fb.textContent; $('#toast-action').click(); await wait(50); o.feedAfterUndo=fb.textContent;
 // group vote from detail
 go('home'); await wait(150); card('Spice 6').querySelector('.tt-card-link').click(); await wait(150);
 act('vote').click(); await wait(50); o.voteToast=$('#toast-msg').textContent+' ['+$('#toast-action').textContent+']';
 $('#toast-action').click(); await wait(150); o.wentToGroup=$('#panel-crew').classList.contains('active')+' options='+TerpData.getVote().options.join(',');
 o.stats=$('#stat-ci').textContent+' check-ins, '+$('#stat-sv').textContent+' saved';
 o.errors=__errs;
 const pre=document.createElement('pre');pre.id='RESULT';pre.textContent=JSON.stringify(o);document.body.appendChild(pre);
})();
</script>
