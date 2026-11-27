# Design language

One look for the whole product. Both slices follow this file. `.claude/rules/ui-design.md` wins where they disagree. Tokens live in `src/app/globals.css`; never write a raw colour or size in a slice.

## The feel

- Soft and quiet: big rounded panels on a slightly tinted page, almost no borders, almost no shadow.
- Colour is calm and neutral with a cool blue-violet tint; the one blue-violet accent is the only strong colour on any screen.
- Pill-shaped controls (buttons, tabs, search) against generously rounded panels. Text is friendly and geometric, never dense.

## Tokens

Our name = role. Values are OKLCH, same as `globals.css`. Dark is a cool slate, not black.

| Token | Role | Light | Dark | Used for |
|---|---|---|---|---|
| `background` | page | `oklch(0.982 0 0)` | `oklch(0.23 0.011 261)` | the page behind everything |
| `card` | surface | `oklch(1 0 0)` | `oklch(0.267 0.011 254)` | panels, cards, question card, dialogs |
| `popover` | floating surface | `oklch(1 0 0)` | `oklch(0.284 0.012 258)` | menus, select lists, tooltips |
| `foreground` | ink | `oklch(0.309 0 0)` | `oklch(0.961 0 0)` | all main text |
| `muted-foreground` | ink-soft | `oklch(0.482 0 0)` | `oklch(0.741 0 0)` | helper text, metadata, icons at rest |
| `border` | line | `oklch(0.906 0.021 277)` | `oklch(1 0 0 / 12%)` | dividers, input outline, outlined buttons |
| `input` | input line | same as `border` | `oklch(1 0 0 / 16%)` | input and select outline |
| `primary` | accent | `oklch(0.556 0.245 270)` | `oklch(0.852 0.074 279)` | the one main action, selected option, focus |
| `primary-foreground` | on accent | `oklch(1 0 0)` | `oklch(0.321 0.121 260)` | text on the main button |
| `secondary` / `muted` | tint fill | `oklch(0.954 0.015 278)` | `oklch(0.312 0.014 262)` | secondary buttons, chips that are real controls, inactive rows, skeletons |
| `accent` | hover tint only | `oklch(0.933 0.018 279)` | `oklch(0.343 0.017 262)` | hover and pressed state of tinted things. Never a brand colour |
| `ring` | focus | primary at 50% | primary at 50% | keyboard focus ring |
| `destructive` | error | `oklch(0.578 0.206 29)` | `oklch(0.745 0.127 26)` | error text, failed state, delete |

Notes:
- Light contrast: ink on page is about 11:1, ink-soft on page about 6:1, white on primary about 5.5:1. Dark primary is a light lavender, so its text is dark (`primary-foreground`).
- There is no green or amber token. Status uses text plus icon: saved = `text-muted-foreground` with a check, warning = `text-foreground` with a triangle icon, error = `text-destructive`.
- Hover: tinted surfaces go to `bg-accent`; the primary button goes `hover:bg-primary/90`. Pressed: one step darker, no scale.

## Type

Family: Figtree Variable (package `@fontsource-variable/figtree`, no network). It stands in for Google Sans, which is not installable: Figtree is also geometric, round and friendly, and reads well at 16px. One family only; `font-mono` (Geist Mono) for code and the timer digits if needed.

| Level | Classes | Size / line | Weight | Use |
|---|---|---|---|---|
| Display | `text-4xl md:text-5xl font-medium tracking-tight` | 36-48 / 1.1 | 500 | landing line, result score |
| Page title | `text-3xl font-medium tracking-tight` | 30 / 36 | 500 | one per screen |
| Section title | `text-xl font-medium` | 20 / 28 | 500 | panel and card headings |
| Body | `text-base leading-6` | 16 / 24 | 400 | everything, questions use `text-lg leading-7` |
| Small | `text-sm text-muted-foreground` | 14 / 20 | 400 | metadata, helper text. Never for the only copy of something important |
| Label | `text-sm font-medium` | 14 / 20 | 500 | field labels, button text, tab text. Sentence case, never all caps |

Headings are medium weight (500), not bold. Letter spacing is normal except a slight negative on display and page title.

## Radius

`--radius` is `1rem`. Tailwind steps: `rounded-md` 12.8px, `rounded-lg` 16px, `rounded-xl` 22px, `rounded-2xl` 29px, `rounded-3xl` 35px.

| Component | Class |
|---|---|
| Buttons, tabs, search, status pills that are real controls | `rounded-full` |
| Icon buttons | `rounded-full` |
| Inputs, selects | `rounded-xl` |
| Menus, popovers, tooltips | `rounded-xl` |
| List rows, option rows | `rounded-xl` |
| Cards | `rounded-2xl` |
| Large panels (workspace sections), dialogs | `rounded-3xl` |

Rule: the bigger the surface, the bigger the radius. Nested surfaces step down one size.

## Elevation

Surfaces separate by fill, not by shadow. Three levels only:

1. Flat: `bg-card` on `bg-background`, no border, no shadow. Default for cards and panels.
2. Raised: `shadow-sm` (a soft, wide, low-opacity blur) for hover on a clickable card and for the sticky status bar.
3. Floating: `shadow-lg` for menus, popovers, dialogs, toasts. Dialogs also dim the page with `bg-black/40`.

Borders: only where a fill cannot do the job (inputs, outlined buttons, table row dividers). One border colour, `border-border`.

## Spacing

4px grid. Page gutter `px-4 md:px-8`, content `max-w-5xl mx-auto` (workspace `max-w-6xl`). Panel padding `p-4 md:p-6`. Card padding `p-5`. Gap between panels `gap-4`, between items in a list `gap-2`, between a label and its field `gap-1.5`, between sections `space-y-8`. Generous: when unsure, add one step of space.

## Icons

`lucide-react`, outline style, `strokeWidth` default (1.5-2). Size 20px (`size-5`) in buttons, rows and nav; 16px (`size-4`) inline with small text; 24px (`size-6`) only in empty states. Icon colour is `text-muted-foreground` at rest and the text colour when active. Icon buttons are 44px (`size-11`) tap targets even if the glyph is 20px. No emoji.

## Motion

- Hover and press colour changes: `transition-colors duration-200 ease-out`.
- Panels, menus and dialogs opening: 150-200ms, `ease-[cubic-bezier(0.4,0,0.2,1)]`, opacity plus a small (4px) move. Never whole pages or sections on load.
- Progress, saved indicator, answer selection, a result arriving: allowed. A timer ticks without animation.
- Loading skeletons pulse; nothing else loops.
- Wrap anything beyond a colour change in `motion-safe:`; reduced motion gets no movement.

## Component recipes

Use the shadcn components in `src/components/ui/`. Their base classes already follow this file (pill buttons and tabs, `rounded-xl` inputs and menus, flat `rounded-2xl` cards, `rounded-3xl` dialogs, 56px table rows), so most recipes below need no extra classes.

**Page header**: use `PageHeader` from `@/components/page-header` (title, description, the main action as children). It is `flex flex-wrap items-center justify-between gap-4 pb-6`. Title `text-3xl font-medium tracking-tight`, one line of `text-muted-foreground` under it. The page's one main action sits at the right, `Button size="lg"`.

**Primary button**: `<Button size="lg" className="rounded-full">`; filled `bg-primary text-primary-foreground`, no shadow, no gradient. One per screen. Text is verb plus object.

**Secondary button**: `<Button variant="secondary" size="lg" className="rounded-full">`, tint fill, no border. **Outlined**: `variant="outline"` with `rounded-full`. **Text button**: `variant="ghost"`, hover `bg-accent`.

**Icon button**: `<Button variant="ghost" size="icon" className="size-11 rounded-full">` with an `aria-label`. Selected state: `bg-secondary`.

**Input / select**: `h-11 rounded-xl border-input bg-card px-4 text-base`; focus: `focus-visible:ring-3 ring-ring`. Label above, `text-sm font-medium`; helper or error below in `text-sm` (error `text-destructive`). Search field: `rounded-full` with a leading search icon.

**Card**: `<Card className="rounded-2xl border-0 shadow-none p-5">` on `bg-background`. Clickable card adds `hover:bg-accent hover:shadow-sm transition-colors`. Never a card inside a card: inside a card use `bg-muted rounded-xl` rows.

**Panel**: `rounded-3xl bg-card p-4 md:p-6`, with a `text-xl font-medium` heading row and an optional icon button at the right.

**List row**: `flex items-center gap-3 rounded-xl px-3 min-h-14 hover:bg-accent`; title `text-base`, meta `text-sm text-muted-foreground`; trailing icon or status at the right. **Table**: no outer border, header row `text-sm text-muted-foreground`, rows divided by `border-b border-border`, row height `h-14`, hover `bg-accent`. On a phone, turn rows into stacked list rows.

**Tabs**: pill tabs. List `flex gap-1`; tab `h-9 rounded-full px-4 text-sm font-medium text-muted-foreground`; active `bg-secondary text-foreground`; hover `bg-accent`. No underline bar.

**Dialog**: `rounded-3xl bg-card p-6 shadow-lg`, max width `sm:max-w-md`. Title `text-xl font-medium`, one sentence of body, buttons right-aligned: outlined cancel, filled primary. Closes on Escape.

**Menu / select list**: `rounded-xl bg-popover p-1 shadow-lg`; items `rounded-lg px-3 h-10`, hover `bg-accent`.

**Toast** (`sonner`): `rounded-2xl bg-popover shadow-lg px-4 py-3 text-sm`, plain sentence, bottom centre on phone. Done = text plus a check icon.

**Status text**: `flex items-center gap-1.5 text-sm`. Saved: `text-muted-foreground` + `Check` icon, "Saved". Saving: `text-muted-foreground`, "Saving...". Offline: `text-foreground` + `WifiOff` icon, "You are offline. Your answers are kept on this device." Error: `text-destructive` + `CircleAlert` icon with the next step. Colour is never the only signal.

**Empty state** (`EmptyState`): centred, `size-6` icon in `text-muted-foreground`, one line, one outlined or primary button that fills it. **Loading**: `Skeleton` (`bg-muted rounded-xl`) in the exact shape and size of the content. **Error** (`ErrorState`): plain sentence, a `Retry` button, no technical text.

## Exam workspace

Layout: page `bg-background`; main column `max-w-3xl`; on desktop a right column `w-72` with the navigator and timer; on phone the navigator collapses into a bottom sheet opened from the status bar.

- **Question card**: `rounded-3xl bg-card p-6 md:p-8`. Small line `text-sm text-muted-foreground` ("Question 4 of 20"), then the question in `text-lg leading-7 font-medium`, then option rows `mt-6 space-y-2`.
- **Option row**: whole row is the tap target. `flex items-center gap-3 rounded-xl bg-muted px-4 min-h-14 text-base hover:bg-accent transition-colors`. Selected: `bg-primary/10 ring-2 ring-primary` with the radio dot filled in `primary`. Focus visible: `ring-3 ring-ring`. Keys A, B, C, D shown as plain `text-sm text-muted-foreground` at the left.
- **Question navigator**: panel `rounded-3xl bg-card p-4` with a `grid grid-cols-5 gap-2`; each cell is a 44px `rounded-full` (`size-11`) button with its number. Unanswered `bg-muted`; answered `bg-primary/15 text-foreground`; current `bg-primary text-primary-foreground`; flagged adds a small `Flag` icon, not colour only.
- **Timer**: `font-mono text-xl tabular-nums` in the navigator panel or the status bar. Under 5 minutes the text turns `text-destructive` and gains a clock icon; no flashing.
- **Sticky status bar**: `sticky bottom-0 bg-card/95 backdrop-blur-sm shadow-sm px-4 py-3 flex items-center justify-between gap-4`. Left: status text (saved, offline, error) and "12 of 20 answered". Right: outlined `Previous`, filled `Next` (the last question shows `Finish exam`, which opens a confirm dialog with the unanswered count).
- **Result**: display-size score, one sentence, then list rows per question with right or wrong as text plus icon.

## Do

- Let fill and space separate things. Keep one accent per screen.
- Keep text at 16px or larger for reading; 14px only for metadata.
- Design all four states of every screen with the recipes above.
- Check both themes; every token has a dark value.

## Do not copy

NotebookLM does these things, and `ui-design.md` bans them here:
- Animated gradient glows, rainbow or gradient "AI" accents, sparkle styling. Our accent is flat.
- Decorative chips, badges and new-feature labels. A chip is only a real control or real status.
- Tiny all-caps labels above headings.
- Fade or slide in of whole sections and cards on load.
- Emoji or coloured emoji tiles as icons; the cartoon notebook covers and generated artwork.
- Cards inside cards, and a shadow on every surface.
- Three-card feature rows and dashboards of charts.
- Any logo, Google branding or the product name. Use only the look: tokens, radius, type, recipes.

Where `ui-design.md` and this file disagree, `ui-design.md` wins.
