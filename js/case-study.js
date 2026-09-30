// ── CASE STUDY NAV ────────────────────────────────────────────────────────────
function csScroll(sectionId) {
  const el = document.getElementById('cs-'+sectionId);
  if(!el) return;
  const offset = el.getBoundingClientRect().top + window.scrollY - 88;
  window.scrollTo({ top: offset, behavior: 'smooth' });
  document.querySelectorAll('.cs-nav-item').forEach(n=>n.classList.remove('active'));
  const map = {intro:0,research:1,ideation:2,prototype:3,testing:4,reflection:5};
  const idx = map[sectionId];
  if(idx !== undefined) document.querySelectorAll('.cs-nav-item')[idx]?.classList.add('active');
}

// Update case study nav active state on scroll
window.addEventListener('scroll', function() {
  const sections = ['intro','research','ideation','prototype','testing','reflection'];
  const navItems = document.querySelectorAll('.cs-nav-item');
  const scrollTop = window.scrollY + 100;
  let active = 0;
  sections.forEach((id, i) => {
    const el = document.getElementById('cs-'+id);
    if(el && el.offsetTop <= scrollTop) active = i;
  });
  navItems.forEach((n,i) => n.classList.toggle('active', i===active));
});
