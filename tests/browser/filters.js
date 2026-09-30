<script>
window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));const _ce=console.error;console.error=(...a)=>{__errs.push(a.map(String).join(' '));_ce(...a);};
const wait=ms=>new Promise(r=>setTimeout(r,ms));const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const chip=(root,f)=>document.querySelector(`${root} [data-f="${f}"]`);
(async()=>{
 localStorage.clear(); await wait(300); const o={};
 o.initialChips=$$('#home-chips .tt-chip').map(c=>c.textContent).join(' | ');
 o.sectionsWhenNoFilters=$$('#home-content .tt-walk-label').length;
 // Home chip → shared state
 chip('#home-chips','diet:vegan').click(); await wait(150);
 const vegan=await TerpData.getRestaurants({studentTags:['vegan']});
 o.veganHead=$('.tt-results-count').textContent; o.veganExpected=vegan.length; o.veganCards=$$('#home-content .tt-card').length;
 const d=$$('#home-content .tt-data span:nth-child(2)').map(s=>parseFloat(s.textContent)); o.sortedByDistance=d.every((x,i)=>i===0||d[i-1]<=x);
 o.sectionsHidden=$$('#home-content .tt-walk-label').length===0;
 // focus kept after toggle
 chip('#home-chips','diet:halal').focus(); chip('#home-chips','diet:halal').click(); await wait(100);
 o.focusKept=document.activeElement.dataset.f; chip('#home-chips','diet:halal').click(); await wait(100);
 // Filter panel reflects it
 chip('#home-chips','nav:filter').click(); await wait(200);
 o.panelVeganPressed=chip('#filter-body','diet:vegan').getAttribute('aria-pressed');
 o.panelGroups=$$('.tt-fgroup-title').map(e=>e.textContent).join(' | ');
 o.panelOpenNow=!!chip('#filter-body','open:');
 o.apply1=$('#filter-apply').textContent;
 chip('#filter-body','cuisine:Mexican').click(); await wait(150); o.apply2=$('#filter-apply').textContent;
 $('#filter-apply').click(); await wait(200);
 o.homeActive=$('#panel-home').classList.contains('active');
 o.homeChipsAfterPanel=$$('#home-chips .tt-chip[aria-pressed="true"]').map(c=>c.textContent).join(' | ');
 o.allFiltersLabel=chip('#home-chips','nav:filter').textContent;
 o.resultNames=$$('#home-content .tt-card-link').map(b=>b.textContent).join(', ');
 // remove Mexican from Home
 chip('#home-chips','cuisine:Mexican').click(); await wait(150); o.afterRemoveMexican=$('.tt-results-count').textContent;
 // Clear all in panel keeps search
 const s=$('#home-search'); s.value='noodle'; s.dispatchEvent(new Event('input')); await wait(300);
 o.searchHead=$('.tt-results-count').textContent;
 go('filter'); await wait(100); $('#filter-clear').click(); await wait(150);
 o.afterPanelClear={query:s.value, pressed:$$('#filter-body [aria-pressed="true"]').map(c=>c.textContent).join('|'), apply:$('#filter-apply').textContent};
 go('home'); await wait(150); o.searchOnly=$('.tt-results-count').textContent;
 // empty state + clear
 s.value='zzzz'; s.dispatchEvent(new Event('input')); await wait(300);
 o.emptyTitle=$('#home-content .tt-state-title')?.textContent; o.emptyBody=$('#home-content .tt-state-body')?.textContent;
 $('#home-content [data-action="clear"]').click(); await wait(150);
 o.afterClear={input:s.value, sections:$$('#home-content .tt-walk-label').length};
 // walk chip
 chip('#home-chips','walk:10').click(); await wait(150);
 o.walk10=$$('#home-content .tt-data span:nth-child(2)').map(s=>parseFloat(s.textContent)).every(x=>x<=0.5)+' / '+$('.tt-results-count').textContent;
 go('filter'); await wait(100); chip('#filter-body','walk:5').click(); await wait(100); o.walkPanel=$$('#filter-body [data-f^="walk:"][aria-pressed="true"]').map(c=>c.textContent).join('|');
 go('home'); await wait(150); o.walkHomeChip=$$('#home-chips [data-f^="walk:"]').map(c=>c.textContent+'='+c.getAttribute('aria-pressed')).join('|');
 // zero-result apply button
 go('filter'); await wait(100); chip('#filter-body','cuisine:BBQ').click(); await wait(150); o.zeroApply=$('#filter-apply').textContent+' disabled='+$('#filter-apply').disabled;
 o.errors=__errs;
 const pre=document.createElement('pre');pre.id='RESULT';pre.textContent=JSON.stringify(o);document.body.appendChild(pre);
})();
</script>
