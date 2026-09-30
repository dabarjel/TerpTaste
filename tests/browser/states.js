<script>
window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const $=s=>document.querySelector(s);const mode=new URLSearchParams(location.search);const o={};
TerpData.setSaved('qu',true);
const screens=[['home','#home-content'],['deals','#deals-content'],['crew','#crew-activity'],['saved','#saved-content']];
if(mode.get('delay')){
  for(const [p,sel] of screens){ go(p); await wait(300); o[p+'Skeleton']=!!$(sel+' .tt-skel'); await wait(1200); o[p+'Loaded']=!$(sel+' .tt-skel'); }
  showDetail('aroy'); await wait(300); o.detailSkeleton=!!$('#detail-root [aria-busy="true"]'); await wait(1200); o.detailLoaded=$('.tt-detail-name')?.textContent;
} else {
  for(const [p,sel] of screens){ go(p); await wait(200); o[p+'Error']=$(sel+' .tt-state--error .tt-state-title')?.textContent||'MISSING'; }
  o.todayStripHidden=$('#deals-today').hidden;
  showDetail('aroy'); await wait(200); o.detailError=$('#detail-root .tt-state-title')?.textContent;
  TerpData.config.fail=false; $('#detail-root [data-action="retry"]').click(); await wait(200); o.detailRetry=$('.tt-detail-name')?.textContent;
  TerpData.config.fail=true; go('deals'); await wait(200); TerpData.config.fail=false; $('#deals-content [data-action="retry"]').click(); await wait(200); o.dealsRetry=!!$('#deals-content .tt-deal');
}
o.errorsOtherThanTestSwitch=__errs.filter(e=>!/fail=1/.test(e));
const p=document.createElement('pre');p.id='RESULT';p.textContent=JSON.stringify(o);document.body.appendChild(p);})();
</script>
