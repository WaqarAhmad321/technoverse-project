# UI: one product, not a set of parts

Before building or changing any screen, read `hack/design.md` and follow it; it sets the tokens, type, radius, elevation and component recipes. Where it and this file disagree, this file wins.

Judges decide in the first thirty seconds whether this looks real. Slices built apart must read as one product, and none of it may look machine-made.

## Product standard (team decision, 16:40): build it like a Google product, not a demo
Every screen is designed from the user's side: what they came to do, the next step, and the way back. Use the shared pieces; never improvise a one-off.
- **Frame:** every signed-in screen sits in the sidebar frame. A new screen adds its nav line in `src/lib/nav.ts` and its icon in `src/components/nav-icons.tsx`.
- **Way back:** every detail, edit, import or "new" screen passes `back={{ href, label }}` to `PageHeader` ("Exams", "Question bank", ...). No dead ends.
- **Lists:** any list or table that can pass 10 rows pages with `paginate()` from `@/lib/pagination` and `<Pagination>` from `@/components/pagination` (server-side, `?page=`). Tables sit in `rounded-3xl bg-card p-2`. Row actions are visible buttons, never hover-only.
- **Icon-only buttons** have an `aria-label` and a `Tooltip` saying what they do. Main actions are a verb plus object with a leading icon where it helps.
- **Dropdowns:** use the shadcn `Select` from `@/components/ui/select` (it takes `name` for forms), never a native `<select>`. Menus and dialogs come from `src/components/ui/`.
- **Feedback:** a finished action shows a toast: `useActionToast(state)` from `@/components/use-action-toast` (or `toast.success` from `sonner`). A problem stays next to the form with `FormMessage tone="error"`. No success text dumped into the page.
- **Status** is an icon plus words (Check, CircleAlert, WifiOff, Clock), never colour alone.
- **Motion** is calm: colour changes 200ms ease-out, panels and menus 150 to 300ms with a fade, clickable cards use the `lift` class. Nothing snaps, bounces or loops; respect reduced motion.
- **Home and empty screens** point to the next action. An empty state has an icon, one line and the button that fills it.
- **Both themes:** the app opens dark; every screen must read well in dark and light. Only tokens, never raw colours.
- Before landing, look at the screen at 1440px and 390px, in dark, and click every button once.

## One look
- Colours, type sizes, spacing and corner radius come from the shared tokens. Never write a raw colour or a one-off size in a slice.
- Use a shared component before making a new one. If you need a new one that another slice could use, add it to the shared components.
- Tokens are named by role (`page`, `surface`, `line`, `ink`, `ink-soft`, `accent`), never by look.
- One accent colour, used for the main action on a screen and nothing else.
- At most two font families. Body text is at least 16px.

## Every screen
- One job and one main action. Other actions are plain or outlined.
- Four states, all designed: loading (a skeleton in the shape of the content), empty (one line on what goes here and the action that fills it), error (plain words and a retry), and done (a clear sign that it worked).
- Real-looking content from the sample data: real names, plausible numbers, real dates. No lorem ipsum, no "Test 123", no "John Doe".
- Works at 390px and at 1440px. No sideways scroll. Tap targets are at least 44px.
- Text contrast is at least 4.5:1. Inputs have labels. Keyboard focus is visible.

## Words
- Use the words the user uses, not the words the team uses for its own system.
- Buttons are a verb and its object: "Upload report", not "Submit".
- State what the person gets, not how it works. Not "AI-powered analysis engine"; say "See what is wrong with your contract".
- No exclamation marks. No "seamless", "unlock", "supercharge", "revolutionise", "effortless".

## Banned, because they read as templated or AI-made
- Decorative chips, badges and pills that are not real controls or real status.
- Tiny all-caps labels above headlines.
- Gradient buttons, gradient text, and purple or magenta "AI" glows.
- Emoji used as icons or bullets.
- Fade-in or slide-in on whole sections, cards or pages.
- Fake numbers, fake logos, fake testimonials.
- Cards inside cards, and a shadow on everything.
- A dashboard of charts that answer no question the user has.
- Three feature cards in a row with an icon, a title and a sentence each.

## Motion
- Motion only where it shows the product working: a result arriving, a progress step, an item moving to its new place.
- Nothing loops except a loading state. Respect reduced-motion settings.

## The first screen
- A judge who opens the live URL cold must know what the product does from one line, and reach the main demo action in at most two clicks.
- If login is in the way, offer a one-click demo account.
