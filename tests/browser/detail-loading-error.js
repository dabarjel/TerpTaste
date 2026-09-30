<script>(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const q=s=>document.querySelector(s);const o={};
TerpData.config.delayMs=800; await w(1200);
showDetail('aroy'); await w(300); o.skeleton=!!q('#detail-root [aria-busy="true"]')+' back='+!!q('#detail-root [data-action="back"]');
await w(900); o.loaded=q('.tt-detail-name')?.textContent;
TerpData.config.delayMs=0; TerpData.config.fail=true; showDetail('qu'); await w(200);
o.error=q('#detail-root .tt-state-title')?.textContent+' retry='+!!q('#detail-root [data-action="retry"]');
TerpData.config.fail=false; q('#detail-root [data-action="retry"]').click(); await w(200); o.afterRetry=q('.tt-detail-name')?.textContent;
q('#detail-root [data-action="back"]').click(); await w(200); o.backWorks=q('#panel-home').classList.contains('active');
const p=document.createElement('pre');p.id='RESULT';p.textContent=JSON.stringify(o);document.body.appendChild(p);})();</script>
