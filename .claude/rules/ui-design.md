# UI: one product, not a set of parts

Before building or changing any screen, read `hack/design.md` and follow it; it sets the tokens, type, radius, elevation and component recipes. Where it and this file disagree, this file wins.

Judges decide in the first thirty seconds whether this looks real. Slices built apart must read as one product, and none of it may look machine-made.

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
