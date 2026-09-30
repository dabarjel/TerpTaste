# TerpTaste design rules

The app's visual direction and the rules that keep it consistent. `css/tokens.css` is the source of truth for every value; this file explains how to use them. `styleguide.html` shows the tokens and real components. `AUDIT_PHASE5.md` has the measured contrast behind these choices.

## Direction A: Signage

Chosen 2026-09-29 so the app feels like College Park signage rather than a generic template.

- **Surfaces:** dark asphalt page, flat "curb" cards with small corners (`--r-card` 6px), larger corners only on sheets (`--r-sheet`).
- **Flat:** no gradients, no glows. Shadow only on floating layers (`--shadow-overlay`); cards use none.
- **Type:**
  - Big Shoulders Display (`--f-display`): restaurant names, screen titles, vote counts.
  - Inter (`--f-body`): body, buttons, labels. Sentence case.
  - IBM Plex Mono (`--f-data`): only numbers people compare (price, distance, walk time, vote totals). Never labels.
- **Photo fallback:** the cuisine name set large and cropped off the tile, drawn by CSS and `aria-hidden`. Never an emoji on a gradient.
- **Motion:** one signature motion, the scoreboard count flip (`--dur-flip` 240ms). Everything else is quick and subtle. All motion is off under `prefers-reduced-motion`.

## Token rules

- **No raw values.** Colors, font sizes, spacing, radii, shadows, z-indexes and durations all come from tokens. No inline styles.
- **Use semantic tokens in components** (`--surface-1`, `--text-muted`, `--action`, `--highlight`), not primitives (`--curb`, `--chalk-3`, `--red`, `--gold`). Primitives are defined once and mapped.
- **Spacing** is the 4px scale (`--s-1`…`--s-8`). **Type** is the fixed scale (`--t-12`…`--t-72`).
- **Z-index** only from the layer tokens (`--z-sticky`, `--z-toast`, `--z-skip`). Anything else stays inside a component's own isolated stack.
- **Text contrast:** `--text-muted` is the lowest allowed text color (4.5:1 on every surface). Control outlines use `--control-border` (3:1); `--border` is for decorative dividers only.
- **Adding a token:** add the primitive, map it to a semantic name, check contrast on page, Curb, Curb-2 and tile surfaces, and show it in `styleguide.html`.

## Color has jobs

### Terp Red: actions and the current selection only

- Fills (primary buttons, selected chip, current nav) use `--action` (`--red`), pressed state `--action-press`.
- Text on red uses `--on-action`.
- Red **text or icons on dark** use `--action-text` (`#ED6E7F`). `--red` as text fails contrast.
- Never use red for decoration, headings, badges or emphasis. (`--danger` also maps to red.)

### Gold: ratings and the group-vote leader only

- `--highlight` (`--gold`) means "best". Use it for star ratings and the leading option's bar and count in the vote.
- Never for buttons (the "Surprise me" button was moved off gold for this reason), tags, deals or decoration.

### Other status colors

- `--status-open` (green) is for open-now status only. It shows only when real hours data says so.
- Avatar fills (`--avatar-*`) are only for avatars and each keeps 4.5:1 with its initials.
