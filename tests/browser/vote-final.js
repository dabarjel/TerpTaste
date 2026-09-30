<script>
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];const status=()=>$('.tt-board-status')?.textContent.trim();
await wait(300); const o={}; go('crew'); await wait(200);
$('#vote-picker [data-vote-toggle="habanero"]').click(); await wait(50); $('#vote-picker [data-vote-toggle="qu"]').click(); await wait(50);
o.friendsVoted=status();
$('[data-vote="qu"]').click(); await wait(50);
o.final=status(); o.rowsDisabled=$$('[data-vote]').every(b=>b.disabled); o.removeGone=$$('[data-vote-remove]').length===0; o.pickerLocked=$$('#vote-picker [data-vote-toggle]').every(b=>b.disabled);
o.foot=$('.tt-board-foot').textContent.trim();
$('.tt-board-foot [data-action="reset"]').click(); await wait(50); o.afterReset=$('#vote-board .tt-state-title')?.textContent+' | toast='+$('#toast-msg').textContent;
$('#toast-action').click(); await wait(50); o.afterUndoReset=status();
const p=document.createElement('pre');p.id='RESULT';p.textContent=JSON.stringify(o);document.body.appendChild(p);})();
</script>
