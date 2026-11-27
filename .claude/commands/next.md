---
description: Everyone, all day. Take my next task, build it, check it, land it on main, and take the next one.
argument-hint: [how many tasks to do in a row; default 3]
---

# Next: the working loop

Tasks to do in this session: $ARGUMENTS (three if empty).

Do not ask for approval at any point in this loop. Decide, note it in the log, and keep moving.

## 1. Take the task

Run `scripts/task start`. It syncs with main, claims your next task and opens its branch.

- It prints the task file. Read it, and read your slice in `hack/architecture.md`.
- Exit code 3 means your list is empty. Go to "When the list is empty".
- If it says a task is marked done but not landed, run `scripts/land` first.
- If dependencies are not installed in this checkout, install them.

## 2. Build it

- Stay inside the folders your slice owns. Follow `.claude/rules/`.
- Something a teammate owns is missing: build a stand-in, mark it `STAND-IN(<owner>):`, and carry on. Never wait and never ask.
- A choice comes up: take the sensible default. If a teammate could trip over it, add one line to `hack/log/<you>.md`.
- Need something added to the shared core: add it yourself, in the same change.
- The task is bigger than it looked: build the smallest version that satisfies "Done when", and add a new task file for the rest.
- Truly stuck on something outside your control for more than about fifteen minutes: `scripts/task park <why>`, then start this loop again with the next task.

## 3. Check it

- Do the task's "Done when" for real: a real browser or real HTTP against the running app.
- If the task is a step of the demo story, extend the smoke test to cover it.
- Re-read your diff once. Try empty input, a second click, a failing outside service and a phone-width screen.
- If the task says `review: yes`, run the `reviewer` agent on your diff and fix what it finds. That takes a few minutes and waits on no person.

## 4. Land it

1. `scripts/task done`
2. Commit the work and the task file, staged by path, with a Conventional Commit message scoped to your slice.
3. `scripts/land`
   - Exit 0: landed.
   - Exit 1: the check failed. Fix the cause, commit, land again. Never weaken the check.
   - Exit 2: a merge conflict. Resolve it so both changes keep working (their folder: theirs; your folder: yours; shared files: both), then `git add -u && git commit --no-edit && scripts/land`.

## 5. Report and go on

Report in three lines at most: what works now, how it was checked with the result line, and any stand-in left behind. Then go straight back to step 1 for the next task, without asking.

Stop the session when any of these is true, and say which:

- You have done the number of tasks asked for. A fresh session keeps the context small and the work fast: tell the person to run `/next` again in a new session.
- The clock says the phase is Feature freeze or later. From then on nothing new is built: follow `.claude/commands/freeze.md`.
- The clock shows the main-flow phase is ending and a must-have is still open: say so in one line and keep going on must-haves only.

## When the list is empty

Your own list is done. Do not ask anyone for more. In this order:

1. Polish your slice: follow `.claude/commands/polish.md`.
2. Replace any `STAND-IN` of yours whose real version now exists on main.
3. Add two or three extras of your own, the kind a judge would notice: write their task files in `hack/tasks/<you>/`, commit them and run `scripts/land` so they are on main. Then run this loop on them.
