---
description: Lead. Build and land the shared core everyone starts from, a live URL, and a real check. `/shape` runs this by itself; type it only to redo or finish the shared core.
---

# Skeleton: the shared core

Read `hack/requirements.md`, `hack/architecture.md` and `hack/verification.md`. Run `scripts/clock`.

Two people are about to build on top of this, so speed of the first landing matters more than completeness. Land in the order below, with `scripts/land` after each numbered step. Do not wait until everything is done.

Work on a branch: `git switch -c skeleton origin/main` (or from `main` if there is no remote yet).

## With a stack starter

If `.claude/rules/stack.md` exists, most of this is already built and the team is already working on top of it. Read that file and `SETUP.md`. Then go through the steps below and do only what is still missing, in this order: the live URL (step 7, by following `SETUP.md`), the product's name and one-line promise, the look, the slice folders and navigation entries, and the tables and sample data from the data shapes.

## 1. The app shell (land within ten minutes)

- If the project already has an app from a stack starter, keep it. Otherwise create the app for the chosen stack with its standard starter, at the repo root.
- Create each slice's folder, empty, in the place `hack/architecture.md` names. Build nothing inside them: slice folders belong to their owners, and their first task fills them.
- Fill in `BUILD_COMMAND` in `scripts/check` with the real lint, type and build commands.
- Land. Tell the team the shell is on main.

## 2. The look and the navigation

- The shared tokens and base components: page, surface, text, accent, button, input, card, the loading, empty and error states. Follow `.claude/rules/ui-design.md`.
- The navigation, with an entry for each slice pointing at that slice's entry route. A route may be missing for a few minutes until its owner's stub lands.
- A first screen that says what the product does in one line and leads to the main demo action.
- Land.

## 3. Data and sample data

- Create every table or collection from the data shapes in `hack/architecture.md`.
- Write the sample data: believable names, numbers and dates, enough rows for every screen to look alive, and the exact records the demo story uses.
- One command that resets the data to that state. Write it into `hack/demo.md`.
- Land.

## 4. Login, or a demo account

Whichever is simpler for this product. A judge must get from the live URL into the product in one click. Land.

## 5. The demo-mode switch

One environment variable. When it is on, outside services answer from recorded responses, in one place per service. List it in `.env.example`. Land.

## 6. The smoke test

- A real-browser test that walks the demo story from `hack/verification.md` as far as the shell allows today. Steps whose slice is still a stub check only that the screen opens.
- Fill in `SMOKE_COMMAND` in `scripts/check`. The whole check must stay under about 90 seconds.
- Land.

## 7. The live URL

- Deploy main. Set it to deploy again on every push to main.
- Open the live URL and walk the first steps of the demo story on it yourself.
- Write the URL into the Live URL line of `CLAUDE.md`. Land.

## Rules for this step

- Stay out of the slice folders.
- Anything the slices will all need goes into the shared core now. It is cheaper here than later.
- If a piece fights back for more than ten minutes, land the simplest version that works and note it in `hack/log/waqar.md`.

End with three lines: what is on main, the live URL, and that Waqar runs `/next` for his own slice now.
