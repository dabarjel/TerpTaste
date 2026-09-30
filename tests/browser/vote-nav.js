<script>
window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));const _ce=console.error;console.error=(...a)=>{__errs.push(a.map(String).join(' '));_ce(...a);};
const wait=ms=>new Promise(r=>setTimeout(r,ms));const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const status=()=>$('.tt-board-status')?.textContent.trim();
(async()=>{
 await wait(300); const o={};
 // nav
 o.navButtons=$$('.mobile-nav [data-nav]').map(b=>b.tagName+':'+b.dataset.nav).join(' ');
 o.homeCurrent=$('#sb-home').getAttribute('aria-current');
 $('#mn-saved').click(); await wait(100); o.mobileSavedGoes=$('#panel-saved').classList.contains('active')+' current='+$('#mn-saved').getAttribute('aria-current')+'/'+$('#sb-saved').getAttribute('aria-current');
 $('#sb-crew').click(); await wait(200);
 // empty
 o.emptyTitle=$('#vote-board .tt-state-title')?.textContent; o.pickerCount=$$('#vote-picker [data-vote-toggle]').length;
 o.invite=$('.tt-invite button').disabled+' / '+$('.tt-soon').textContent; o.noFire=!document.body.innerHTML.includes('🔥 Same');
 // add via picker
 $('#vote-picker [data-vote-toggle="habanero"]').click(); await wait(50);
 $('#vote-picker [data-vote-toggle="qu"]').click(); await wait(50);
 o.afterAdd=status(); o.pickerPressed=$$('#vote-picker [aria-pressed="true"]').map(b=>b.textContent).join(' | ');
 o.voters=$$('.tt-voter').map(v=>v.textContent.replace(/\s+/g,' ').trim()).join(' | ');
 // vote
 $('[data-vote="habanero"]').click(); await wait(50);
 o.afterVote=status(); o.yourVote=$('.tt-vrow .tt-mine')?.closest('.tt-vrow').querySelector('.tt-vname').firstChild.textContent;
 o.leaderRow=$('.tt-vrow.is-leader .tt-vname')?.firstChild.textContent;
 $('[data-vote="qu"]').click(); await wait(50);
 o.moveVote=status()+' | flips='+$$('.tt-vcount .flip').length+' | yours='+$('.tt-mine').closest('.tt-vrow').querySelector('[data-vote]').dataset.vote;
 // remove with undo (removes your voted option)
 $('[data-vote-remove="qu"]').click(); await wait(50);
 o.afterRemove=status()+' | options='+$$('.tt-vrow').length+' | toast='+$('#toast-msg').textContent;
 $('#toast-action').click(); await wait(50);
 o.afterUndo=status()+' | yours='+TerpData.getVote().mine;
 // picker toggle off + search
 $('#vote-picker [data-vote-toggle="habanero"]').click(); await wait(50); o.toggleOff=$$('.tt-vrow').length+' rows';
 $('#toast-action').click(); await wait(50);
 const ps=$('#picker-search'); ps.value='thai'; ps.dispatchEvent(new Event('input')); o.search=$$('#vote-picker [data-vote-toggle]').map(b=>b.textContent).join(', '); ps.value=''; ps.dispatchEvent(new Event('input'));
 // feed + detail add
 go('crew'); await wait(50); $('#crew-activity [data-vote-add="aroy"]').click(); await wait(50); o.feedAdd=$('#toast-msg').textContent+' ['+$('#toast-action').textContent+']';
 await showDetail('spice6'); $('#detail-root [data-action="vote"]').click(); await wait(50); o.detailAdd=$('#toast-msg').textContent;
 o.optionsNow=TerpData.getVote().options.map(x=>x.id).join(',');
 o.errors=__errs;
 const pre=document.createElement('pre');pre.id='RESULT';pre.textContent=JSON.stringify(o);document.body.appendChild(pre);
})();
</script>
