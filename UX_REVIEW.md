# TerpTaste UX Heuristics Review

**Date:** 2026-09-29
**Scope:** the live app (`index.html`, `js/app.js`) as of commit `feddae7`, before the `ui-overhaul` rebuild.
**Method:** Nielsen's 10 usability heuristics, applied by reading the code. No screenshots were used, so visual-only issues such as contrast and spacing are not covered here. Phase 5 covers those.
**Follow-up:** the Priority Actions are folded into Phases 3 and 4 of `TERPTASTE_UI_PLAN.md`.

> ⚠️ **Several issues to address.** The visuals are solid, but the Filter screen doesn't do anything, Saved can't be reached on mobile, and the app says reviews come from friends when many are from anonymous usernames.

Line numbers refer to the files at the commit above.

## H1: Visibility of System Status
- "Show Results →" on the Filter screen (`index.html:108`) just calls `go('home')`. None of the selections are applied, and Home gives no sign that any filters are active.
- The Group Vote banner says "Taqueria Habanero wins!" (`index.html:127`) while voting is still going on. It should say "Leading" and show how many people have voted (e.g. 3 of 4).
- `showDetail` resets the check-in button every time (`js/app.js:202`). If you reopen a place you already checked into, it asks you to check in again.
- Every restaurant has `open:true`, so the "Open Now" filter and the Closed badge never change anything.

## H2: Match Between System and the Real World
- "From your people" and "*X* checked in here" are shown next to handles like `d3f3n3strat3` and `asianmathmajor`. The Friends feed promises "people you actually know — no bots, no fake reviews." This goes against the app's main idea of trusting people you know. Label these as "Student review" and keep "friend" for actual friends.
- "For You — based on your preferences" is just the first 3 entries in the list (`js/app.js:98`). Either use the profile preferences or change the label.
- The "Cuisine type" filter includes Fast Food, Sit-Down and Café, which describe the type of restaurant, not the cuisine. "Dietary preferences" on Profile includes "Under $15" and "Open late."

## H3: User Control and Freedom
- "← Back to results" always goes to Home (`index.html:77`). If you opened a detail page from Saved, Friends, Group or Surprise Me, you lose your place.
- Check-in has no undo. In Group Vote, a spot you add can't be removed.
- Tapping "♡ Save spot" in the feed only ever adds. It doesn't show that a spot is already saved and can't remove it.

## H4: Consistency and Standards
- **The mobile bottom nav has no Saved tab** (`index.html:190-197`), so phone users can't open their saved list at all.
- Home has chips and there's also a Filter screen. They have different options and don't share state.
- Several buttons do nothing: "🔥 Same", "+ Invite friends by link", and "+ Add another option" (which only shows a toast).
- Almost everything you can click is a `<div onclick>` rather than a `<button>`, so it can't be reached with the keyboard and has no standard focus behavior.

## H5: Error Prevention
- The "×" that removes a saved spot is small, sits right next to the tap area that opens the spot, and removes it immediately with no undo. Add an Undo action to the toast.

## H6: Recognition Rather Than Recall
- Vote cards only mark your own pick with styling. Add a "Your vote" label.
- Wait time appears on the small cards but not on the main cards. Pick one set of details and use it on every card.

## H7: Flexibility and Efficiency of Use
- **There's no search.** A student who already knows where they want to go has to scroll through every card to find it.
- The Group Vote picker only offers the first 12 of the 22 restaurants (`js/app.js:247`).
- "Surprise Me" steps through the list in a fixed order (`js/app.js:292`), not at random.

## H8: Aesthetic and Minimalist Design
- The same restaurants appear in several Home sections (For You, Budget, More nearby). Show each one only once per page.
- The case study link on Profile belongs to the portfolio, not the app itself.

## H9: Help Users Recognize, Diagnose, and Recover from Errors
- There are no empty or error states on Home. A filter that matches nothing shows a "For You" heading with nothing under it. The plan's Phase 3 already calls for these states, so this confirms that step is needed.

## H10: Help and Documentation
- Group Vote never explains how friends join a session, and the invite button doesn't do anything yet.

## Priority Actions
1. **Fix the core flows that don't work:** make the Filter screen actually filter and share its state with the Home chips, add Saved to the mobile nav, and remove or finish the buttons that do nothing.
2. **Make the trust labels honest:** keep "friend" wording for real friends only, and rename "For You" and "wins!" to match what they actually show.
3. **Add search, plus empty and error states on Home.** This fits into Phase 3 of the plan.
