// Run from anywhere: node tests/data/persist.test.js (paths below are relative to the repo root).
process.chdir(require('path').resolve(__dirname, '..', '..'));
const fs=require('fs'),vm=require('vm'),assert=require('assert');
function load(storage){
  const ctx={location:{search:''},setTimeout,console,URLSearchParams,Math,Promise,Map,Set,Number,Error,JSON,Array,String,Date,Object};
  if(storage!==undefined) ctx.localStorage=storage;
  vm.createContext(ctx);
  for(const f of ['mock-places.js','terp-content.js','restaurants.js'])
    vm.runInContext(fs.readFileSync('js/data/'+f,'utf8')+(f==='restaurants.js'?';this.TerpData=TerpData;':''),ctx);
  return ctx.TerpData;
}
const mem=()=>{const m={};return{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v);},_m:m};};
(async()=>{
  // persists across reloads
  const st=mem(); let D=load(st);
  D.toggleSaved('aroy'); D.saveReview('qu',{rating:5,got:'Gyoza'}); D.addVoteOption('qu'); D.addVoteOption('spice6'); D.castVote('qu');
  D=load(st); const Dsaved=D;
  assert.deepEqual(D.savedIds(),['aroy']); assert.equal(D.getVisits()[0].id,'qu'); assert.equal(D.getVisits()[0].rating,5);
  assert.match(D.getVisits()[0].date,/^\d{4}-\d{2}-\d{2}$/);
  // Check-ins stored before the merge still load as unrated visits, and survive a later save.
  const old=mem(); old.setItem('terptaste:user:v1','{"saved":["qu"],"checkIns":[{"id":"aroy","date":"2026-09-20"},{"id":"marathon","date":"2026-09-10"}]}'); D=load(old);
  assert.deepEqual(D.getVisits().map(x=>x.id+':'+x.rating),['aroy:null','marathon:null']);
  assert.equal((await D.getRestaurant('aroy')).terp.visited.date,'2026-09-20');
  D.saveReview('aroy',{rating:4,got:'Drunken noodles'}); D=load(old);
  assert.equal(D.getVisits().length,2); assert.equal(D.getVisits().find(x=>x.id==='aroy').rating,4); assert.equal(D.getVisits().find(x=>x.id==='marathon').rating,null);
  const v=Dsaved.getVote(); assert.equal(v.mine,'qu'); assert.equal(v.options.find(o=>o.id==='qu').count,1); assert.ok(v.options.some(o=>o.id==='spice6'));
  assert.equal((await Dsaved.getRestaurant('aroy')).terp.saved,true);
  // no localStorage at all
  D=load(undefined); D.toggleSaved('qu'); assert.deepEqual(D.savedIds(),['qu']);
  // storage that throws
  const bad={getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}};
  D=load(bad); D.toggleSaved('qu'); D.castVote('aroy'); assert.deepEqual(D.savedIds(),['qu']);
  // corrupt / hostile data
  for(const junk of ['{not json','null','"str"','{"saved":"x","checkIns":5,"vote":{"options":[1,"qu"],"counts":{"qu":"-4"},"mine":"zzz"}}']){
    const s=mem(); s.setItem('terptaste:user:v1',junk); D=load(s);
    assert.ok(Array.isArray(D.savedIds())); await D.getRestaurants();
  }
  const s=mem(); s.setItem('terptaste:user:v1','{"vote":{"options":["habanero"],"counts":{"habanero":3},"mine":"habanero"},"session":{"options":[{"id":1},{"id":"qu"}],"votes":{"me":"zzz","ak":"qu","hacker":"qu"}}}'); D=load(s);
  const gv=D.getVote(); assert.deepEqual(gv.options.map(o=>o.id),['qu']); assert.equal(gv.mine,null); assert.equal(gv.votedCount,1);
  const s2=mem(); s2.setItem('terptaste:user:v1','{"vote":{"options":["habanero"],"counts":{"habanero":3},"mine":"habanero"}}'); D=load(s2);
  assert.equal(D.getVote().state,'empty');
  // open status unknown => null, and openNow filter matches nothing
  D=load(mem()); const all=await D.getRestaurants();
  assert.ok(all.every(r=>r.isOpenNow===null)); assert.equal((await D.getRestaurants({openNow:true})).length,0);
  console.log('persistence + open status: all checks passed');
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
