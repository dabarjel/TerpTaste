<script>
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const $=s=>document.querySelector(s);const T=e=>e?.textContent.replace(/\s+/g,' ').trim();
await wait(300); const o={};
await showDetail('marathon'); o.legacyDetail=T($('#detail-visit'));
go('profile'); await wait(150); o.legacyProfile=T($('#visit-history'))+' | stat='+T($('#stat-ci'));
const p=document.createElement('pre');p.id='RESULT';p.textContent=JSON.stringify(o);document.body.appendChild(p);})();
</script>
