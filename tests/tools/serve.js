// Minimal static server for the repo (Lighthouse needs http://, not file://).
const http=require('http'),fs=require('fs'),path=require('path');
const root=require('path').resolve(__dirname,'..','..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]); if(p.endsWith('/')) p+='index.html';
  const f=path.join(root,p); if(!f.startsWith(path.normalize(root))){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);return res.end('not found');} res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'max-age=3600'}); res.end(d); });
}).listen(8765,()=>console.log('serving on http://localhost:8765'));
