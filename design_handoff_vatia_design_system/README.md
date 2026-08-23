# Handoff: Vatia — Sistema di design (light + dark)

## Overview
Design system foundation for **Vatia**, a free browser-only weekly meal-planning tool (no accounts, no server; plan lives in `localStorage` and exports/imports as CSV). This bundle documents the visual language and the reusable components the app's screens are built from: palette (light + dark), type scale, and the live interactive components — kcal slider, macro split bar, macro rings, day selector, meal stepper, choice cards, drawer / bottom-sheet.

Target repo: `nicoloproietti/Vatia-dietengine`, branch `main`, app at `apps/web`. The tokens in this design system were **lifted from the repo's own `apps/web/src/styles.css`** — they are not new inventions. Treat this handoff as the canonical, cleaned-up spec of that file plus the component behaviors.

## About the Design Files
`Vatia Design System.dc.html` (+ `support.js`, its runtime) is a **design reference created in HTML** — a live prototype showing the intended look and behavior. It is not production code to copy. The task is to reproduce these tokens and components in the existing environment of `apps/web` (React 18 + TypeScript + Vite, plain CSS in `src/styles.css`, no CSS framework), following the patterns already there: CSS custom properties on `:root` / `[data-theme='dark']`, semantic class names, small presentational components under `src/components/`.

Open the file in a browser to interact with it. Everything except the drawer's inner search results is live.

## Fidelity
**High fidelity.** Final colors, typography, spacing, radii, and interaction states. Recreate pixel-perfectly using the repo's existing CSS-variable approach.

## Screens / Views
This is a single documentation page, in five sections.

### 00 — Fondamenta (hero)
- Container: `max-width:1120px`, centered, padding `56px 40px 120px`, vertical `gap:88px` between sections.
- Sticky header: `padding:22px 40px`, `border-bottom:1px solid var(--line)`, background `var(--bg)`, `z-index:20`. Left: brand — 10px accent dot (`border-radius:50%`, `background:var(--accent)`), gap 10px, "Vatia" at 16px/700/`-0.02em`, then "SISTEMA DI DESIGN" in mono 11px/400, `var(--ink-3)`, `letter-spacing:0.06em`, uppercase. Right: current theme name in mono 11px uppercase + "Cambia tema" button (secondary, `min-height:44px`, `padding:11px 18px`, 13px/600, uppercase, `letter-spacing:0.04em`).
- Headline: 64px / `line-height:1.02` / weight 800 / `letter-spacing:-0.035em`, `max-width:20ch`. Copy: "Cibo vero, numeri esposti."
- Lede: 20px / 1.45 / `var(--ink-2)` / `max-width:52ch`.
- Four meta badges: `padding:4px 10px`, 11px/600, uppercase, `letter-spacing:0.06em`, `border-radius:3px`, `background:var(--muted)`, `border:1px solid var(--line)`; the "radius 4 / 8" one uses `background:var(--accent-tint)`, `border-color:var(--accent)`, `color:var(--accent)`.

### 01 — Palette
- Section heading pattern (used by all sections): flex row, `align-items:baseline`, `justify-content:space-between`, `border-bottom:1px solid var(--line)`, `padding-bottom:12px`. Title 32px/700/`-0.025em`; right side mono 11px `var(--ink-3)` uppercase `letter-spacing:0.1em` ("01 — token · light / dark").
- Sub-headings: 12px/700, uppercase, `letter-spacing:0.14em`, `var(--ink-3)`.
- **Surfaces & ink swatches**: `grid-template-columns:repeat(auto-fill,minmax(150px,1fr))`, `gap:12px`. Each card: `border:1px solid var(--line)`, `border-radius:4px`, `background:var(--surface)`, `overflow:hidden`; 64px color block with bottom hairline; caption block `padding:10px 12px` with token name (13px/600) and both hex values in mono 11px `var(--ink-3)` formatted `LIGHT / DARK`.
- **Macro cards**: `repeat(auto-fit,minmax(200px,1fr))`, `gap:12px`; card `border-radius:8px`, `padding:16px 18px`, `gap:10px`; 8px color bar (`border-radius:4px`), then label 12px/700 uppercase `letter-spacing:0.1em` in the macro color, then token + both hex in mono 11px.
- **Category chips**: wrapping flex, `gap:8px`; chip `padding:5px 12px`, `border-radius:999px`, 11px/600, uppercase, `letter-spacing:0.06em`. Text is `var(--surface)` except `cereali`, `latticini`, `uova`, which use dark ink `#221D14` (only pairing that holds AA in both themes).

### 02 — Tipografia
Rows in a single column, each `display:grid; grid-template-columns:170px 1fr; gap:24px; align-items:baseline; padding:20px 0; border-bottom:1px solid var(--line-2)` (last row no border). Left cell is the spec in mono 11px `var(--ink-3)`, `letter-spacing:0.06em`. Rows, in order: display 800/64/1.02; wizard question 700/40/1.1/`-0.025em`; lede 400/20/1.4 max 44ch; body 400/17/1.55 max 62ch `var(--ink-2)`; label 600/12 uppercase `0.1em` `var(--ink-3)`; numbers mono 500/32 `tabular-nums` `-0.02em`; number table — two columns (`1fr auto`, `gap:2px 20px`, `max-width:340px`) with sans food names at 15px and right-aligned mono 15px gram values.

### 03 — Componenti (all live)
- **Buttons**. Primary: `min-height:44px`, `padding:14px 22px`, 16px/600, `color:var(--accent-ink)`, `background:var(--accent)`, `border:1px solid var(--accent)`, `border-radius:4px`; hover → `var(--accent-2)` for both background and border. Secondary: same box, `background:transparent`, `color:var(--ink)`, `border-color:var(--line)`; hover → `background:var(--muted)`, `border-color:var(--ink-2)`. Ghost: `padding:10px 14px`, 14px/600, `var(--ink-2)`, transparent border; hover → `var(--ink)` on `var(--muted)`. Link: no padding/border, 14px/500, `var(--ink-2)`, underline with `text-underline-offset:3px`; hover → `var(--accent)`. Disabled: `opacity:0.35`, `cursor:not-allowed`.
- **Inputs**. Text: `padding:14px 16px`, 16px/500, `background:var(--bg)`, `border:1px solid var(--line)`, `border-radius:4px`; focus → `border-color:var(--accent)` + `box-shadow:0 0 0 4px var(--focus-ring)`, no outline. Measure (big numeric): mono, `padding:18px 20px`, 32px/500, `tabular-nums`. Label above: 12px/600 uppercase `letter-spacing:0.1em` `var(--ink-3)`, `margin-bottom:8px`.
- **Choice card** (wizard, one decision per screen). Full-width button, `display:flex`, `align-items:baseline`, `justify-content:space-between`, `gap:16px`, `min-height:44px`, `padding:16px 20px`, `border-radius:8px`, 17px/1.35, left-aligned; hint text 13px/400 `var(--ink-3)` on the right. Unselected: `border:1px solid var(--line)`, `background:var(--bg)`, weight 500. Selected: `border-color:var(--accent)`, `background:var(--accent-tint)`, weight 600. Group `display:grid; gap:10px`. Options shipped: Sedentario / Leggero / Moderato / Intenso with hints "ufficio, poco movimento", "1-3 allenamenti a settimana", "3-5 allenamenti a settimana", "6-7 allenamenti a settimana".
- **Meal stepper (2–6)**. Wrapper: inline-flex, `gap:6px`, `border:1px solid var(--line)`, `border-radius:4px`, `padding:4px`, `background:var(--bg)`, width fit-content. Pill: `min-width:44px; min-height:44px`, `padding:10px 18px`, `border:none`, `border-radius:3px`, 15px/600. Selected → `background:var(--ink)`, `color:var(--bg)`; else transparent with `var(--ink-2)`.
- **Wizard progress**. Flex `gap:6px`; each segment `height:4px; flex:1; border-radius:2px`. Done → `var(--accent)`; current → `var(--ink)`; upcoming → `var(--line)`. Below it, mono 12px uppercase `letter-spacing:0.06em` meta row: "passo 03 / 04" ↔ "profilo".
- **Kcal slider**. Value: mono 48px/500 `tabular-nums` `letter-spacing:-0.03em` with a `border-bottom:2px solid var(--line)`, suffix "kcal / giorno" 13px/500 `var(--ink-3)`. Track: `position:relative; height:32px`. Deficit zone (left of TDEE−100): `top:12px; height:8px; border-radius:4px; background:color-mix(in srgb, var(--c-carbs) 25%, transparent)`. Surplus zone (right of TDEE+100): same with `var(--accent) 25%`. TDEE tick: `top:6px; width:2px; height:20px; background:var(--ink)`, z-index 3. Thumb: 20px circle, `top:8px`, `transform:translateX(-10px)`, `border:3px solid var(--surface)`, filled with the current zone color, z-index 2. A native `<input type=range min=1200 max=3600 step=10>` sits over the whole track at `opacity:0` (z-index 4) as the drag surface — keep it a real input for keyboard/AT. Status row: zone badge (`padding:4px 10px`, 11px/600 uppercase `0.06em`, `border-radius:3px`, `border:1px solid var(--line)`, `background:var(--muted)`, text in zone color) + mono 12px "±N kcal vs TDEE · stima ±N,N kg / mese" + right-aligned mono "TDEE 2 460 · BMR 1 720". Zone logic: delta < −80 → `deficit` (`var(--c-carbs)`); delta > +80 → `surplus` (`var(--accent)`); otherwise `mantenimento` (`var(--ink-3)`). kg/month estimate: `delta * 7 / 7700 * 30`, one decimal, comma decimal separator.
- **Macro split bar**. Segmented bar: flex, `height:12px`, `border-radius:3px`, `overflow:hidden`, `background:var(--line-2)`; three segments in `--c-protein` / `--c-carbs` / `--c-fat` sized by each percentage over the current sum. Rows: `grid-template-columns:12px 1fr 84px 90px; gap:12px`; 10px color dot; name 14px/600; percentage `<input type=number>` 84px wide, mono 15px right-aligned; computed grams right-aligned mono 14px `var(--ink-2)`. Grams: protein and carbs `kcal * pct / 100 / 4`, fat `/ 9`, rounded. Sum indicator: bordered box `padding:10px 14px` on `var(--bg)` with an absolutely-positioned fill at `opacity:0.15` whose width is `min(sum,100)%`; color and copy — 100 → accent + "Somma 100% — a posto"; <100 → `var(--warn)` + "Somma N% — mancano N punti"; >100 → `var(--danger)` + "Somma N% — eccedono N punti".
- **Macro rings**. 4-up grid, `gap:16px`. Each ring: 96px box, SVG `viewBox="0 0 96 96"`, two circles at `cx=cy=48 r=44 stroke-width=8`; track `stroke:var(--line)`, fill `stroke-dasharray:276.5`, `stroke-dashoffset:276.5*(1-pct)`, `stroke-linecap:round`, `transform:rotate(-90 48 48)`, transition `stroke-dashoffset 350ms cubic-bezier(.4,0,.2,1)`. Center: value mono 19px/500 in the ring color over target mono 10px `var(--ink-3)` prefixed "/". Label below 11px/600 uppercase `letter-spacing:0.08em` in ring color; then the delta in mono 11px. **Overshoot rule**: when `value > target * 1.05` the ring, value and label all switch to `var(--danger)` — and the delta text always states the number, so the state is readable without color (`+12%`, `−4%`, `a target` when |delta| ≤ 2%). Mobile variant: 64px box, `r=28`, `stroke-width:6`, `stroke-dasharray:175.9`, value mono 13px, label 10px.
- **Target bars**. `grid-template-columns:120px 1fr 150px; gap:14px`, font 13px. Track `height:6px; background:var(--line-2); border-radius:3px; overflow:hidden`; fill in the macro color, `transition:width 250ms ease`. Right cell: mono `tabular-nums`, "value / target · delta".
- **Day selector**. `grid-template-columns:repeat(7,1fr); gap:6px`, wrapped in top and bottom hairlines with `padding:8px 0`. Tab: column flex, `gap:4px`, `min-height:48px`, `padding:10px 4px`, `border-radius:4px`, 12px/600 uppercase `letter-spacing:0.06em`; progress line mono 10px, `opacity:0.75`, no uppercase. Active → `background:var(--ink)`, `color:var(--bg)`, `border:1px solid var(--ink)`. Complete but inactive → text `var(--accent)`. Otherwise `var(--ink-2)`, transparent border. Labels lun–dom; progress shown as `done/mealsPerDay`.
- **Meal rows**. `grid-template-columns:1fr auto; gap:12px; align-items:baseline; padding:16px 0; border-bottom:1px solid var(--line-2)`. Done meal: name 18px/600 `var(--ink)`; pending: 18px/500 `var(--ink-2)`. Sub-line mono 12px `var(--ink-3)` ("target 780 kcal · fatto 774 kcal" / "target 620 kcal · da costruire"). Actions right: secondary "Modifica" + ghost "Copia alla settimana", or primary "Costruisci" for a pending meal.
- **Empty state**. `border:1px dashed var(--line)`, `border-radius:4px`, `padding:24px`, centered, 14px `var(--ink-3)`, copy that names the next action: "Nessun pasto ancora costruito per giovedì. Parti dalla colazione: scegli gli alimenti, i grammi li calcola Vatia."
- **Drawer (desktop ≥640px)**. Panel `width:min(560px,100vw)` in production (720px demo frame uses 400px), full height, `background:var(--surface)`, `border-left:1px solid var(--line)`, `box-shadow:-8px 0 40px color-mix(in srgb, var(--ink) 20%, transparent)`, animation `slideInRight 200ms cubic-bezier(.32,.72,0,1)`. Backdrop `color-mix(in srgb, var(--ink) 40%, transparent)`, `fadeIn 160ms`. Header `padding:20px 22px 16px` with hairline bottom: eyebrow 11px/600 uppercase `letter-spacing:0.14em` `var(--accent)` ("Fase 1 · scegli"), title 22px/700 `-0.02em`, and a 44×44 close button (`border:1px solid var(--line)`, `border-radius:4px`). Body `flex:1; overflow-y:auto; padding:18px 22px; display:flex; flex-direction:column; gap:14px` — **give every child block `flex:none`** so lists don't get compressed. Footer `padding:14px 22px` with hairline top and a full-width primary action ("Calcola i grammi").
- **Bottom sheet (mobile <640px)**. Same content, anchored to the bottom at `height:92dvh` (88% in the demo frame), `border-top-left-radius:12px` / `border-top-right-radius:12px`, `border-top:1px solid var(--line)`, animation `slideInUp 220ms cubic-bezier(.32,.72,0,1)`. Grab handle: 40×4px, `border-radius:2px`, `background:var(--line)`, `top:8px`, centered; header gets extra top padding (24px) to clear it. Footer respects `env(safe-area-inset-bottom)` and the primary button is `min-height:48px`, full width ("Salva il pasto").
- **Search result row**. `grid-template-columns:1fr auto; gap:10px; padding:11px 14px; border-bottom:1px solid var(--line-2)` (last row none). Name 14px/500; nutrition line mono 11px `var(--ink-3)` ("11 kcal · P 1,3 · C 1,4 · G 0,1" — comma decimals, Italian convention). Category chip on the right. Hover → `background:var(--muted)`.
- **Gram row (phase 2)**. `grid-template-columns:1fr 84px; gap:10px; padding:13px 0; border-bottom:1px solid var(--line-2)`. Left: food name 15px/500 + per-food contribution in mono 11px `var(--ink-3)`. Right: gram input 84px, mono 15px, right-aligned, `padding:10px`.

### 04 — Regole
Four short rules in `repeat(auto-fit,minmax(260px,1fr))`, `gap:20px`: heading 12px/700 uppercase `letter-spacing:0.14em` `var(--accent)`, body 15px/1.5 `var(--ink-2)`, with inline mono spans for literal values. Content: never color alone (numeric delta always shown); 44px targets with ≥8px spacing; visible focus ring (2px accent, 3px offset, never `outline:none` without a replacement); explicit loading copy in mono ("cerco…", "calcolo…").

## Interactions & Behavior
- **Theme toggle** sets `document.documentElement.dataset.theme` to `light` | `dark`; every token flips through CSS variables. `body` transitions `background` and `color` over 160ms ease. Match the repo's existing `ThemeContext` (`src/state/ThemeContext.tsx`) rather than adding a second mechanism, and keep `color-scheme` set per theme.
- **Kcal slider** updates on `change`/`input` of the range; the thumb, zone badge, delta text and kg/month estimate all recompute. Zone thresholds ±80 kcal around TDEE.
- **Macro split** recomputes segment widths, grams and the sum indicator on every percentage change. The sum is never auto-corrected — the user is told what's missing or in excess.
- **Rings / bars** demo is driven by a 0–130% fill range so the overshoot state is reachable; in the app the same components are driven by real per-meal totals.
- **Day selector** and **meal stepper** are single-select; stepper changes the denominator of every day's progress label.
- **Drawer/sheet** toggles from "Costruisci" on a pending meal or the section's own open/close button. In production also: close on Escape and backdrop click, lock body scroll while open, `role="dialog" aria-modal="true"` with an accessible label (see `src/components/Drawer.tsx`).
- Animations: `slideInRight 200ms cubic-bezier(.32,.72,0,1)`, `slideInUp 220ms cubic-bezier(.32,.72,0,1)`, `fadeIn 160ms ease`; generic UI transition 160ms ease; ring 350ms `cubic-bezier(.4,0,.2,1)`; bar width 250ms ease.
- **Loading**: search and gram-calculation must show explicit mono text state, not just a spinner.
- **Responsive**: drawer becomes bottom sheet under 640px; ring grids drop from 4 to 2 columns under 540px; the macro/bar grids collapse their fixed side columns on narrow screens.

## State Management
State held in this prototype (mirror it in the app's contexts — `ProfileContext`, `PlanContext`, `ThemeContext`):
- `theme: 'light' | 'dark'` — persisted, mirrored to `documentElement.dataset.theme`.
- `kcal: number` (1200–3600, step 10) — daily target.
- `activity: index 0-3` — wizard choice.
- `mealsPerDay: 2-6`.
- `selectedDay: 0-6`.
- `macro: { p, c, f }` percentages (not auto-normalized).
- `drawerOpen: boolean` (+ which meal it's editing, and phase 1 "scegli" / phase 2 "regola").
- Demo-only: `fill` percentage for the ring/bar showcase — drop it in the app.
Derived, never stored: BMR/TDEE (Mifflin-St Jeor), grams from percentages, deltas, zone, completion counts.
Data: foods come from Supabase (`packages/diet-engine`, `supabase/migrations/0001_foods_table.sql`); the plan itself stays in `localStorage` + CSV.

## Design Tokens
Copy verbatim; these match `apps/web/src/styles.css`.

Light (`:root`, `color-scheme: light`):
`--bg #FBF7EC` · `--surface #FFFDF6` · `--ink #221D14` · `--ink-2 #5A503F` · `--ink-3 #94886F` · `--line #E5DBC6` · `--line-2 #F0E9D6` · `--muted #F4EDDA` · `--accent #4E7A3B` · `--accent-2 #3A5E2C` · `--accent-ink #FBF7EC` · `--accent-tint #EAF2E3` · `--focus-ring rgba(78,122,59,.30)` · `--c-kcal #4E7A3B` · `--c-protein #C1362A` · `--c-carbs #E17400` · `--c-fat #B58900` · `--cat-verdura #4E7A3B` · `--cat-frutta #E17400` · `--cat-cereali #C68F00` · `--cat-legumi #7A5C2E` · `--cat-carne #C1362A` · `--cat-pesce #4A80A0` · `--cat-latticini #A88F5A` · `--cat-uova #E5AA1D` · `--cat-grassi #8B6914` · `--cat-altro #94886F` · `--ok #4E7A3B` · `--warn #B7791F` · `--danger #C1362A`

Dark (`[data-theme='dark']`, `color-scheme: dark`):
`--bg #171310` · `--surface #1E1913` · `--ink #F1E7CE` · `--ink-2 #C3B69A` · `--ink-3 #7B7059` · `--line #3A322A` · `--line-2 #2A241E` · `--muted #26201A` · `--accent #7EB05F` · `--accent-2 #9ECC80` · `--accent-ink #171310` · `--accent-tint #2A3A1F` · `--focus-ring rgba(126,176,95,.34)` · `--c-kcal #7EB05F` · `--c-protein #E76C60` · `--c-carbs #F09340` · `--c-fat #D9B558` · `--cat-verdura #7EB05F` · `--cat-frutta #F09340` · `--cat-cereali #E5B460` · `--cat-legumi #C09566` · `--cat-carne #E76C60` · `--cat-pesce #7BB0D0` · `--cat-latticini #D0B686` · `--cat-uova #F0C55D` · `--cat-grassi #C09E60` · `--cat-altro #94886F` · `--ok #7EB05F` · `--warn #E5B460` · `--danger #E76C60`

Type: `--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`; `--font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace`. Base `17px`. Weights used: 400, 500, 600, 700, 800. Sizes: 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 32, 40, 48, 64. Tracking: −0.035em (display), −0.025em (h2/wizard), −0.02em (numbers, drawer title), 0.06em / 0.1em / 0.14em (uppercase labels, increasing with smallness).

Numbers: **all** numeric values use `--font-mono` with `font-variant-numeric: tabular-nums`, right-aligned in tables and inputs. Thousands are grouped with a thin space `U+2009` ("2 140", "2 460"); negatives use the true minus `U+2212`; decimals use a comma (Italian). Never render numbers in the proportional sans.

Radius: `4px` default, `8px` large, `3px` small chips/pills, `999px` category chips, `12px` bottom-sheet top corners. Spacing scale actually used: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 40, 56, 88, 120. Borders: `1px solid var(--line)` hairline; `var(--line-2)` for internal dividers. Shadows: only one — the drawer's `-8px 0 40px color-mix(in srgb, var(--ink) 20%, transparent)`. No card shadows anywhere else.

## Assets
None. No icons, images or icon fonts — the only glyph is the close "✕" and the brand's accent dot (a plain CSS circle). Fonts load from Google Fonts (Inter 400–800, JetBrains Mono 400–500), same import as the repo's `styles.css`. Any placeholder blocks in the drawer demo frames are grey `var(--muted)` bars standing in for real content, not assets to reproduce.

## Files
- `Vatia Design System.dc.html` — the design reference. Open in a browser; interactive.
- `support.js` — runtime needed for the HTML to render. Not part of the design; do not port.
- `screenshots/design-system-light.png`, `screenshots/design-system-dark.png` — full-page captures of both themes, for visual comparison while implementing.

## Suggested prompt for Claude Code
> Implement the Vatia design system described in `design_handoff_vatia_design_system/README.md` inside `apps/web`. Reconcile the token block with the existing `src/styles.css` (it should already match — fix any drift, don't fork it), then build the missing reusable components under `src/components/`: ChoiceCard, MealStepper, WizardProgress, DaySelector, MacroSplit, MacroRing, TargetBar, CategoryChip, Drawer/BottomSheet, EmptyState. Keep the existing CSS-variable + semantic-class approach, no CSS framework. Respect the numeric formatting rule (mono, tabular-nums, thin-space grouping, true minus, comma decimals) and the accessibility rules (44px targets, visible focus ring, never color alone). Compare against `screenshots/design-system-light.png` and `-dark.png` when done.

## Not covered yet
This bundle is the design system only. The full screen flow — landing, CSV import prompt, profile wizard, daily setup, weekly plan workspace, meal builder phases, shopping list — is specified in `docs/claude-design-prompt.md` in the repo and still has to be designed on top of these components.
