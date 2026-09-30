// Run from anywhere: node tests/data/friends.test.js (paths below are relative to the repo root).
process.chdir(require('path').resolve(__dirname, '..', '..'));
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const mem=()=>{const m={};return{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v);}};};
function load(st){const ctx={location:{search:''},setTimeout,console,URLSearchParams,Math,Promise,Map,Set,Number,Error,JSON,Array,String,Date,Object,isFinite,localStorage:st};vm.createContext(ctx);
 for(const f of ['mock-places.js','terp-content.js','mock-friends.js','restaurants.js'])vm.runInContext(fs.readFileSync('js/data/'+f,'utf8')+(f==='restaurants.js'?';this.TerpData=TerpData;':''),ctx);return ctx.TerpData;}
(async()=>{
 const st=mem(); let D=load(st);
 const h=await D.getRestaurant('habanero');
 assert.deepEqual(h.terp.friendRating,{avg:4.7,count:3}); assert.equal(h.terp.friendReviews[0].who.name,'Jordan T.');
 assert.deepEqual(h.terp.highlights,['Tacos al pastor','Tinga','Polpo']);           // community "Tacos al pastor" x2, "Tinga" x1, then curated
 assert.equal((await D.getRestaurant('hanami')).terp.friendRating,null);
 const love=await D.getRestaurants({friendsLove:true,sort:'friends'}); assert.ok(love.length>0); assert.ok(love.every(r=>r.terp.friendRating.avg>=4));
 for(let i=1;i<love.length;i++) assert.ok(love[i-1].terp.friendRating.avg>=love[i].terp.friendRating.avg);
 // menu parsing keeps parentheses together
 assert.ok((await D.getRestaurant('qu')).terp.menuItems.includes('Ramen (tonkotsu, chicken teriyaki, shoyu)'));
 // reviews: validation, highlights feed, activity, persistence, undo
 assert.equal(D.saveReview('hanami',{rating:0,got:'x'}).ok,false); assert.equal(D.saveReview('hanami',{rating:5,got:''}).ok,false);
 const res=D.saveReview('hanami',{rating:5,got:'Spicy tuna roll',note:'  great  '}); assert.ok(res.ok); assert.equal(res.previous,null);
 let hn=await D.getRestaurant('hanami'); assert.deepEqual(hn.terp.highlights,['Spicy tuna roll']); assert.equal(hn.terp.myReview.note,'great');
 assert.equal(hn.terp.friendRating,null);                                            // your own rating isn't a friend rating
 const act=await D.getActivity(); assert.equal(act[0].who.id,'me'); assert.equal(act[0].place.id,'hanami'); assert.ok(act.some(a=>a.who.name==='Priya R.'));
 D=load(st); assert.equal((await D.getRestaurant('hanami')).terp.myReview.got,'Spicy tuna roll');
 const r2=D.saveReview('hanami',{rating:3,got:'Miso soup'}); assert.equal(r2.previous.got,'Spicy tuna roll');
 assert.deepEqual((await D.getRestaurant('hanami')).terp.highlights,[]);               // rated 3: not a standout
 D.restoreReview('hanami',r2.previous); assert.equal((await D.getRestaurant('hanami')).terp.myReview.rating,5);
 D.restoreReview('hanami',null); assert.equal((await D.getRestaurant('hanami')).terp.myReview,null);
 // corrupt stored reviews are dropped
 const bad=mem(); bad.setItem('terptaste:user:v1','{"reviews":{"qu":{"rating":9,"got":"x"},"aroy":{"rating":4,"got":"Pad Thai"}}}'); D=load(bad);
 assert.equal((await D.getRestaurant('qu')).terp.myReview,null); assert.equal((await D.getRestaurant('aroy')).terp.myReview.got,'Pad Thai');
 // works without the mock friends file (styleguide)
 const ctx={location:{search:''},setTimeout,console,URLSearchParams,Math,Promise,Map,Set,Number,Error,JSON,Array,String,Date,Object,isFinite};vm.createContext(ctx);
 for(const f of ['mock-places.js','terp-content.js','restaurants.js'])vm.runInContext(fs.readFileSync('js/data/'+f,'utf8')+(f==='restaurants.js'?';this.TerpData=TerpData;':''),ctx);
 assert.equal((await ctx.TerpData.getRestaurant('habanero')).terp.friendRating,null);
 console.log('friends + reviews: all checks passed');
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
