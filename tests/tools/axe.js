<script src="https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js"></script>
<script>
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const $=s=>document.querySelector(s);
localStorage.clear(); await wait(500); const out={};
TerpData.saveReview('aroy',{rating:5,got:'Drunken noodles',note:'Great'});TerpData.setSaved('qu',true);TerpData.addVoteOption('habanero');TerpData.addVoteOption('qu');TerpData.castVote('qu');
const screens=[['home',()=>go('home')],['filter',()=>go('filter')],['crew',()=>go('crew')],['deals',()=>go('deals')],['saved',()=>go('saved')],['profile',()=>go('profile')],
 ['detail',async()=>{await showDetail('habanero');}],['detail+form',async()=>{await showDetail('hanami');$('#detail-visit [data-action="review"]').click();$('#detail-review form').requestSubmit();}],
 ['search-empty',()=>{go('home');const s=$('#home-search');s.value='zzzz';s.dispatchEvent(new Event('input'));}],
 ['toast',()=>{go('home');showToast('Saved Aroy Thai',{action:{label:'Undo',run:()=>{}}});}]];
for(const [name,fn] of screens){ await fn(); await wait(450);
  const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});
  out[name]=r.violations.map(v=>v.id+'('+v.nodes.length+'): '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(' ; ')).join(' | ')||'none'; }
const p=document.createElement('pre');p.id='RESULT';p.textContent=JSON.stringify(out);document.body.appendChild(p);})();
</script>
