// Mock friends and their activity (TerpTaste mock mode).
// These are the same people as the old Friends feed and the group vote. Real friends need
// accounts and a backend (see TERPTASTE_UI_PLAN.md); until then this file stands in.
//
// Activity = a friend's visit: where, how long ago, their star rating (1–5), what they got,
// and an optional one-line note. Notes and dishes come from the original feed posts and
// friend reviews; the star ratings are mock values chosen to match each post's tone.
// The last three entries are rating-only mock visits so the "Friends: ★4.7 (3)" aggregate
// can be seen.
const MOCK_FRIENDS = [
  { id:'jt', name:'Jordan T.' },
  { id:'ak', name:'Aisha K.' },
  { id:'mr', name:'Marcus R.' },
  { id:'sp', name:'Simone P.' },
  { id:'kb', name:'Kevin B.' },
  { id:'pr', name:'Priya R.' },
];

const MOCK_FRIEND_ACTIVITY = [
  { friend:'jt', placeId:'habanero', hoursAgo:2,   rating:5, got:'Tacos al pastor',         note:'Al pastor and a hibiscus agua fresca. That’s the move. Michelin for a reason.' },
  { friend:'ak', placeId:'aroy',     hoursAgo:21,  rating:5, got:'Drunken noodles',         note:'Got the drunken noodles on 3-star spice. Do NOT underestimate it. So good though.' },
  { friend:'mr', placeId:'shagga',   hoursAgo:48,  rating:5, got:'Combo platter',           note:'Ubered over and split the combo platter with 2 friends. $16 each, stuffed. Go.' },
  { friend:'sp', placeId:'marathon', hoursAgo:72,  rating:4, got:'Marathon Fries',          note:'Marathon fries at midnight after studying. Classic. $4. They never miss.' },
  { friend:'kb', placeId:'canes',    hoursAgo:96,  rating:4, got:'Three Finger Combo',      note:'Three Finger Combo after lecture. Cane’s sauce goes crazy. Always a line but worth the 8 minutes.' },
  { friend:'pr', placeId:'spice6',   hoursAgo:120, rating:5, got:'Tikka masala naan pizza', note:'Naan pizza with tikka masala. $14 and you’ll be full for the rest of the day.' },
  { friend:'sp', placeId:'qu',       hoursAgo:168, rating:4, got:'Chicken teriyaki ramen',  note:'Chicken teriyaki ramen is the move. Pay cash for a 5% discount.' },
  // Rating-only mock visits (no note).
  { friend:'ak', placeId:'habanero', hoursAgo:200, rating:4, got:'Tinga',                   note:'' },
  { friend:'mr', placeId:'habanero', hoursAgo:260, rating:5, got:'Tacos al pastor',         note:'' },
  { friend:'mr', placeId:'marathon', hoursAgo:300, rating:4, got:'Gyro',                    note:'' },
];
