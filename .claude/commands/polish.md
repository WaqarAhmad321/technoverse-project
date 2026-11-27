---
description: Anyone. Make my slice look and feel finished, then make it match the rest of the product.
argument-hint: [a screen or area to focus on; default is my whole slice]
---

# Polish: make it look finished

Focus: $ARGUMENTS

Work on a branch as usual: if this checkout holds no task, `git switch -c polish/<you> origin/main`. Land with `scripts/land` after each group of fixes.

## 1. See it

Open every screen of my slice in a real browser at 1440px and at 390px, against the running app with the sample data. Take a screenshot of each. Also open one screen from each other slice, to compare against.

## 2. Get a cold opinion

Start the `design-reviewer` agent with the screenshots and my slice's section of `hack/architecture.md`. It scores the screens against `.claude/rules/ui-design.md` and lists fixes, most valuable first.

## 3. Fix, in this order

1. Anything broken: overflow, overlapping text, a dead button, a raw error, a console error.
2. The four states on every screen of the demo story: loading, empty, error, done.
3. Banned items from the rules.
4. Differences from the other slices: spacing, headings, button styles, table and card layouts. Fix them by using the shared tokens and components, never by copying styles.
5. Words: buttons that name their action, headings in the user's language, no filler.
6. Sample data that looks fake.

Fix inside my own slice. If a shared component is the cause, fix the shared component, and check the other slices' screens still look right before landing.

## 4. Check and land

Run `scripts/check`, then `scripts/land`. Report in three lines: what changed, what a judge will notice, and what is still rough.
