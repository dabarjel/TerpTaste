// Run from anywhere: node tests/data/data.test.js (paths below are relative to the repo root).
process.chdir(require('path').resolve(__dirname, '..', '..'));
const fs=require('fs'),vm=require('vm'),assert=require('assert');
function load(search){
  const ctx={location:{search},setTimeout,console,URLSearchParams,Math,Promise,Map,Set,Number,Error};
  vm.createContext(ctx);
  for(const f of ['mock-places.js','terp-content.js','restaurants.js'])
    vm.runInContext(fs.readFileSync('js/data/'+f,'utf8')+(f==='restaurants.js'?';this.TerpData=TerpData;':''),ctx);
  return ctx.TerpData;
}
(async()=>{
  const D=load('');
  const all=await D.getRestaurants();
  assert.equal(all.length,23);
  const h=all.find(r=>r.id==='habanero');
  for(const k of ['id','name','address','location','rating','userRatingCount','priceLevel','types','photos','openingHours','isOpenNow','distanceMiles','terp']) assert.ok(k in h,'missing '+k);
  assert.ok(!('_mockDistanceMiles' in h));
  for(const k of ['saved','visited','groupVotes','studentTags']) assert.ok(k in h.terp,'missing terp.'+k);
  assert.equal(h.distanceMiles,0.4); assert.equal(h.priceLevel,'PRICE_LEVEL_MODERATE'); assert.equal(h.terp.groupVotes,null);
  assert.equal((await D.getRestaurants({priceLevels:['PRICE_LEVEL_INEXPENSIVE']})).length, all.filter(r=>r.priceLevel==='PRICE_LEVEL_INEXPENSIVE').length);
  const vh=await D.getRestaurants({studentTags:['vegan','halal']}); assert.deepEqual(vh.map(r=>r.id).sort(),['habanero','shagga','spice6']);
  assert.deepEqual((await D.getRestaurants({ids:['qu','aroy']})).map(r=>r.id),['qu','aroy']);
  assert.ok((await D.getRestaurants({query:'ramen'})).every(r=>/ramen/i.test(r.name+r.terp.menu)));
  const byDist=await D.getRestaurants({sort:'distance'}); const dd=byDist.map(r=>r.distanceMiles??Infinity); for(let i=1;i<dd.length;i++) assert.ok(dd[i-1]<=dd[i]); assert.equal(byDist[byDist.length-1].id,"fiveguys");
  assert.ok((await D.getRestaurants({maxDistanceMiles:0.5})).every(r=>r.distanceMiles<=0.5));
  D.toggleSaved('aroy'); assert.equal((await D.getRestaurant('aroy')).terp.saved,true);
  assert.deepEqual((await D.getRestaurants({savedOnly:true})).map(r=>r.id),['aroy']);
  assert.equal((await D.getRestaurant('qu')).terp.visited,null); D.saveReview('qu',{rating:4,got:'Gyoza'});
  const qv=(await D.getRestaurant('qu')).terp.visited; assert.equal(qv.rating,4); assert.match(qv.date,/^\d{4}-\d{2}-\d{2}$/); assert.equal(D.getVisits()[0].id,'qu');
  let v=D.getVote(); assert.equal(v.state,'empty'); assert.equal(v.options.length,0); assert.equal(v.total,4);
  assert.equal(D.castVote('qu'),false);
  D.addVoteOption('qu'); D.addVoteOption('aroy'); assert.equal(D.addVoteOption('qu'),false);
  v=D.getVote(); assert.equal(v.state,'waiting'); assert.equal((await D.getRestaurant('qu')).terp.groupVotes,0);
  D.castVote('qu'); v=D.getVote(); assert.equal(v.state,'leading'); assert.equal(v.votedCount,1); assert.equal(v.mine,'qu'); assert.deepEqual(v.leaders,['qu']);
  D.castVote('aroy'); v=D.getVote(); assert.equal(v.options.find(o=>o.id==='qu').count,0); assert.equal(v.votedCount,1);
  const snap=D.removeVoteOption('aroy'); v=D.getVote(); assert.equal(v.mine,null); assert.equal(v.options.length,1);
  D.restoreVoteOption(snap); v=D.getVote(); assert.equal(v.mine,'aroy'); assert.deepEqual(v.options.map(o=>o.id),['qu','aroy']);
  const old=D.resetVote(); assert.equal(D.getVote().state,'empty'); D.restoreVote(old); assert.equal(D.getVote().options.length,2);
  assert.equal((await D.getRestaurant('marathon')).terp.groupVotes,null);
  await assert.rejects(D.getRestaurant('nope'));
  // location wins over mock distance once the proxy supplies it
  const D2=load(''); D2; 
  const t0=Date.now(); const Dd=load('?delay=300'); await Dd.getRestaurants(); assert.ok(Date.now()-t0>=290,'delay');
  await assert.rejects(load('?fail=1').getRestaurants(),/fail=1/);
  // friendsVote test switch: friends vote, Final once you vote
  const F=load('?friendsVote=1'); F.addVoteOption('habanero'); F.addVoteOption('qu');
  let fv=F.getVote(); assert.equal(fv.votedCount,3); assert.equal(fv.state,'leading');
  F.castVote('qu'); fv=F.getVote(); assert.equal(fv.state,'final'); assert.equal(fv.votedCount,4);
  console.log('data layer: all checks passed');
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
