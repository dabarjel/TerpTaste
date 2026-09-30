# TerpTaste Phase 5 Audits

**Date:** 2026-09-29
**Branch:** `ui-overhaul`, audited after Phase 4 (`985687d`), fixed in `d7a8277`
**Scope:** the app: `index.html`, `css/tokens.css`, `css/app.css`, `css/components.css`, `js/ui/components.js`, `js/app.js`. The separate case-study page (`case-study.html`, `css/case-study.css`) was not part of this review.

Two audits were run:

1. **Accessibility** against WCAG 2.1 Level A and AA.
2. **Craft** against the 12 craft rules (visual and CSS quality).

Both used the source code, not just screenshots. Contrast ratios were calculated from the design tokens, and structure, focus and announcements were checked in the running app in a browser.

---

## 1. Accessibility (WCAG 2.1 A/AA)

**Verdict before fixes:** accessibility risks to fix.

**Already solid before the audit:** real `<button>`s for every control, `aria-pressed` on toggles, accessible names on icon-only buttons (save hearts), a `role="alert"` form error, `role="status"` on the toast, results count and vote status, `lang="en"`, decorative tile words marked `aria-hidden`, and `alt=""` on photo tiles.

### Findings and fixes

| # | Finding | WCAG | Severity | Measured | Fix |
|---|---|---|---|---|---|
| A1 | Muted text (hints, timestamps, walk counts, "Sample, not checked yet") too low contrast on raised surfaces | 1.4.3 Contrast (AA) | High | `#86857F` on Curb 4.08:1, on Curb-2 3.61:1 (needs 4.5:1) | `--chalk-3` → `#989792`: lowest 4.56:1 across all surfaces |
| A2 | Terp Red used as text or icons on dark ("♥ Saved", pressed mini buttons, current nav icon) too low contrast | 1.4.3 (AA), 1.4.11 (AA) | High | `#E21833` on page 3.62:1, on Curb 3.18:1, on Curb-2 2.81:1 | New `--action-text` `#ED6E7F` for red text and icons: lowest 4.54:1. `--red` stays for fills |
| A3 | Outlines were the only visible edge of chips, inputs, outlined buttons and the back button, and were nearly invisible | 1.4.11 Non-text contrast (AA) | High | Lane line `#3A3B40` vs page 1.54:1, vs Curb 1.35:1 (needs 3:1) | New `--control-border` `#79797D`: lowest 3.08:1. Lane line stays for decorative dividers |
| A4 | Unselected rating stars in the review form almost invisible | 1.4.11 (AA) | Medium | 1.35:1 | Unselected stars use `--control-border` (3:1+) |
| A5 | Only Discover had a real heading; other screen titles were `<div>`s | 1.3.1 Info and relationships (A), 2.4.6 Headings (AA) | High | 1 of 6 screens | Every screen title is an `<h1>`; only the visible screen's is exposed |
| A6 | No way to skip the navigation; no main landmark | 2.4.1 Bypass blocks (A) | Medium | None | "Skip to content" link (first focusable) targeting `<main id="main">` |
| A7 | Page title never changed between screens | 2.4.2 Page titled (A) | Medium | Always "TerpTaste — UMD Food Discovery" | Titles per screen ("Deals \| TerpTaste"); detail pages use the spot name |
| A8 | Switching screens left focus on the nav button; closing a detail page dropped focus | 2.4.3 Focus order (A) | High | n/a | Navigating focuses the screen `<h1>`; opening a spot focuses its name; Back returns focus to the card you opened |
| A9 | Decorative nav and search icons exposed to assistive tech | 1.1.1 Non-text content (A) | Low | 14 SVGs without `aria-hidden` | `aria-hidden="true" focusable="false"` on all 14 (each sits next to a visible label) |
| A10 | Whole results list and vote board were live regions, so every change re-read everything | 4.1.3 Status messages (AA) | Medium | 2 regions | `aria-live` removed from the containers; the results count and vote status inside already announce |
| A11 | Review form errors weren't tied to the field that needed fixing | 3.3.1 Error identification (A), 4.1.2 (A) | Medium | n/a | Failing fields get `aria-invalid="true"` and `aria-describedby="review-error"`; invalid stars and inputs also get a visible outline, not color alone |
| A12 | Undo toast disappeared on a fixed timer, and Undo was the only way to delete a review | 2.2.1 Timing adjustable (A) | High | 6s, no pause | Toast pauses while hovered or focused, Escape closes it, action toasts last 8s. "Remove review" added to the review edit form |
| A13 | Dish tag row used a fixed pixel height, so larger line spacing would hide every tag | 1.4.12 Text spacing (AA) | Medium | `max-height:22px` | Height set in `em` relative to the tag's own line height |
| A14 | Profile labels at 10–11px uppercase muted text | 1.4.3 (AA), readability | Medium | 10–11px | 12px+ in secondary color; section titles use the display font |
| A15 | Some focusable elements (legacy Profile link, headings) had no designed focus ring; sticky header could cover focused items | 2.4.7 Focus visible (AA) | Medium | n/a | Global `:focus-visible` ring on links, buttons, inputs and `[tabindex]`; `scroll-padding-top` on the scroll area |
| A16 | Only some animations respected reduced motion | 2.3.3 (AAA, best practice) | Low | Skeleton and one transition | All animation and transitions off under `prefers-reduced-motion` |

### Contrast after fixes (worst case across page, Curb, Curb-2 and tile surfaces)

| Use | Color | Worst ratio | Required |
|---|---|---|---|
| Muted text | `#989792` | 4.56:1 | 4.5:1 |
| Secondary text | `#B4B2AC` | 6.30:1 | 4.5:1 |
| Red text and icons | `#ED6E7F` | 4.54:1 | 4.5:1 |
| Control borders | `#79797D` | 3.08:1 | 3:1 |
| Gold (ratings, vote leader) | `#FFD200` | 9.20:1 | 3:1 |
| Text on red buttons | `#FFFCF8` | 4.65:1 | 4.5:1 |
| Toast action (red on chalk) | `#C8142C` | 5.00:1 | 4.5:1 |

### Still needs a human check

Automated checks can't cover everything. Before calling the app conformant, do a pass with a real screen reader (VoiceOver on iOS/macOS, NVDA on Windows) and with keyboard only, covering: the review form's star radios, the chip rows that scroll sideways, and the toast Undo.

---

## 2. Craft (12 rules)

**Verdict before fixes:** a few rough edges.

**Already fine:** no gradients or glows in the app (R1, R2), no `transition: all` (R3), no placeholder copy (R5), component stacking already isolated on cards (R6), near-black and warm neutrals (R7), a small type scale with tight display line heights (R9), flat cards with no stacked border and shadow (R10), and loading, empty and error states for every data view (R11).

### Findings and fixes

| # | Rule | Where | Fix |
|---|---|---|---|
| C1 | R6 Stacking contexts | `z-index: 999` (toast), `1000` (skip link), `10` and `5` (sticky header and footer), undocumented | Tokens `--z-sticky: 10`, `--z-toast: 900`, `--z-skip: 1000`; every overlay uses them. In-card layers stay at 1–2 inside `isolation: isolate` |
| C2 | R7 No pure white | `--on-red: #FFFFFF` | `#FFFCF8`, a warm near-white that still passes 4.65:1 on red |
| C3 | R8 Space on a scale | One-off paddings and gaps: `3px 8px 3px 7px` (status), `6px`, `10px`, `3px`, `1px 6px` (chips, buttons, back, view toggle, nav) | All on the 4px scale via `--s-*` tokens, with explicit min-heights (chips 36px, buttons 40px, nav 40px, back 32px) |
| C4 | R11 Design every state | No `:active` (pressed) state on any control; no hover on save hearts or inline links | Pressed states for buttons, chips, mini buttons, back, view toggle, vote rows, nav and hearts; hover states for hearts and inline links; named-property transitions |
| C5 | R10 Elevation | Toast shadow `0 8px 24px rgba(0,0,0,.45)`, a single heavy shadow | Layered, lower alpha: `0 1px 2px rgba(0,0,0,.24), 0 8px 24px rgba(0,0,0,.28)` |
| C6 | R12 Motion | Vote count flip at 320ms | 240ms (inside the 120–250ms range); all motion off under reduced motion |
| C7 | R9 Type | Profile stats not tabular | `font-variant-numeric: tabular-nums` on stats |
| C8 | R4 / hygiene | Inline `style=""` in Profile, an arrow in "Read the UX case study →", stale "check in after eating!" copy | Classes instead of inline styles; arrow removed; copy updated to "Tap “I went here” on a spot after you eat there." |
| C9 | Token hygiene | Legacy tokens in `app.css` (`--surface-3`, `--terp-gold-dim`, `--status-wait`, `--status-done`, `--border-strong`…) | Unused ones removed; the remaining ones mapped onto system tokens; one alias (`--terp-red`) left for older rules |
| C10 | Performance | Big Shoulders 600 loaded but never used; font stylesheet not preloaded | Weight dropped; stylesheet preloaded. Unused-CSS scan found no dead classes |

---

## Verification

- **Responsive:** no horizontal scroll on Discover, Filter, Crew, Deals, Saved, Profile or a detail page at 320, 375, 768, 1280 and 1600px.
- **Automated accessibility checks in the browser:** no unnamed controls on any screen, one `<h1>` per screen, no duplicate ids, no exposed decorative SVGs, no images without `alt`, and `lang="en"`. Also checked:
  - page titles update per screen and on detail pages
  - focus lands on the heading after navigation and on the spot name on detail, and Back returns focus to the opening card
  - review errors set `aria-invalid` and `aria-describedby`, and move focus to the field
  - the toast stays visible while hovered or focused, and Escape closes it
- **Contrast:** every pair in the table above recalculated from `css/tokens.css`.
- **Regression:** every earlier browser test (filters, detail/Back/Undo, saved, vote, deals, Crew, reviews, Phase 4 Discover) and the four data test suites pass, with no console errors.
