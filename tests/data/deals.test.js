// Run from anywhere: node tests/data/deals.test.js (paths below are relative to the repo root).
process.chdir(require('path').resolve(__dirname, '..', '..'));
const fs=require('fs'),vm=require('vm'),assert=require('assert');
function load(search){const ctx={location:{search},setTimeout,console,URLSearchParams,Math,Promise,Map,Set,Number,Error,JSON,Array,String,Date,Object,isFinite};vm.createContext(ctx);
 for(const f of ['mock-places.js','terp-content.js','mock-friends.js','restaurants.js'])vm.runInContext(fs.readFileSync('js/data/'+f,'utf8')+(f==='restaurants.js'?';this.TerpData=TerpData;':''),ctx);return ctx.TerpData;}
(async()=>{
 let D=load('?today=mon'); assert.equal(D.todayKey(),'mon');
 const m=await D.getRestaurant('marathon');
 assert.equal(m.terp.deals.length,1); assert.deepEqual(m.terp.deals[0].days,['mon']); assert.equal(m.terp.deals[0].where,'in-store');
 assert.equal(m.terp.deals[0].price,7); assert.equal(m.terp.deals[0].lastChecked,null); assert.equal(m.terp.deals[0].sample,true);
 assert.equal(m.terp.dealsToday.length,1);
 const all=await D.getDeals(); assert.equal(all.length,2); assert.ok(all.some(d=>d.place.id==='marathon')); const fg=all.find(d=>d.place.id==='fiveguys'); assert.deepEqual(fg.days,[]); assert.equal(fg.where,'uber-eats'); assert.equal((await D.getRestaurant('fiveguys')).terp.dealsToday.length,0);
 D=load('?today=tue'); assert.equal((await D.getRestaurant('marathon')).terp.dealsToday.length,0);
 D=load('?today=bogus'); assert.ok(D.DAYS.includes(D.todayKey()));
 // unlinked sample deals are not shown anywhere
 assert.ok(!(await load('').getDeals()).some(d=>/cheesesteak/.test(d.id)));
 // other spots have no deals
 assert.equal((await load('').getRestaurants()).filter(r=>r.terp.deals.length).length,2);
 console.log('deals: all checks passed');
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
