---
description: Lead. Tell it the idea and everything the team has in mind. It writes the requirements, one slice per person and a full day of tasks for each, then builds the shared core.
argument-hint: <the idea and everything the team has in mind, in plain words>
---

# Shape: requirements, slices, tasks

Notes from the team: $ARGUMENTS

Read `hack/idea.md` and run `scripts/clock`.

If "The chosen idea" in `hack/idea.md` is still empty, the team picked the idea without `/kickoff`, and the notes above are the idea. Fill in `hack/idea.md` and the Product line of `CLAUDE.md` from them first. If the notes do not say who the product is for, or what a judge should see in the demo, ask for those once, in one message. Decide everything else yourself.

This phase is short. Everything written here exists so that the team can then build all day without needing each other. Write tight: these files are read by every Claude many times today.

## 1. Requirements: `hack/requirements.md`

- **The person, the pain, the promise.** One line each.
- **The demo story.** Six to ten numbered steps, about three minutes. Each step says what the presenter does and what the judge sees. Step one is the live URL opened cold. One step is the demo moment from the idea. This story is the product: anything not in it is optional.
- **Must-haves.** Only what the demo story needs to run for real.
- **Should-haves.** What makes it feel finished and trustworthy.
- **Extras.** The things that make a judge say "they did that too?". Aim for three to five strong ones.
- **Out of scope.** What we will not build today, so nobody starts it.
- **How it scores.** One line per judging criterion: what in the product earns that point.

## 2. Stack

If `.claude/rules/stack.md` exists, the stack is chosen and its app is already in the project: copy its first line into `hack/architecture.md` and the Stack line of `CLAUDE.md`, and place every slice's folders, tables and tests the way that file says. Otherwise pick the simplest stack that fits this product and that the team has shipped before, in one line with the reason. Prefer one app, one deploy, one database, hosted services with a free tier, and nothing that needs a server we must manage. Write it into `hack/architecture.md` and the Stack line of `CLAUDE.md`.

## 3. The split: `hack/architecture.md`

**The shared core** is what everyone starts from: the look (tokens and base components), login or a one-click demo account, the navigation, the data shapes, the sample data, and the demo-mode switch.

**One slice per person.** The team is named at the top of `CLAUDE.md`. For each slice: its name, its owner, the demo-story steps it covers, its screens and routes, the data it writes, the folders it owns, and what it reads from other slices with the stand-in to use until that exists.

Rules for a good split. Check each one before showing it:

- Every slice is a full feature from screen to data that could be demoed alone.
- Slices meet only through data with shapes fixed here. No slice calls another slice's code.
- No slice needs another slice's screens to work. The sample data covers every shape, so each slice has realistic data from the first minute.
- No two slices own the same folder or write the same table.
- The demo story passes through every slice.
- The riskiest or hardest slice goes to Waqar. The rest are balanced in size.
- Each slice has enough should-haves and extras of its own to fill the whole day.

**The data shapes.** Every table or collection: its fields with types, the one slice that writes it, and the slices that read it. Include fields the should-haves and extras will need, so they are additions to code, not to the contract.

## 4. The team confirms (the second and last joint decision)

Show, in at most fifteen lines: the demo story, the slices with owners, and the stack. Ask: go, or change something? Apply any change, then carry on. After this, nobody needs anybody's approval for the rest of the day.

## 5. Tasks: `hack/tasks/<name>/NNN-short-name.md`

Use the format in `hack/tasks/README.md`. Number in tens (010, 020, 030) so tasks can be inserted later.

For each person, in this order:

1. **010: stub the slice.** Every screen of the slice is reachable from the navigation and shows sample data in the agreed shapes. Done within about twenty minutes, so the whole demo story is clickable early.
2. **Must-haves,** in demo-story order. Sized to be finished by the end of the main-flow phase with an hour to spare.
3. **Should-haves.**
4. **Extras.** More than they can finish. Nobody runs out and nobody has to ask for more.

Every task:

- Takes 20 to 60 minutes. Split anything bigger.
- Depends only on the shared core and the data shapes, never on a teammate's unfinished task. If it would, write the stand-in into the task.
- Has a "Done when" that someone can actually run: a click path with the expected result, or a request with the expected response.
- Has `review: yes` if it touches login, writes data other slices read, handles money, or could lose data on the demo path.

Waqar's list starts with nothing special: the shared core is built in step 8, not by a task.

## 6. Verification: `hack/verification.md`

- The smoke test: the demo story as steps a browser test can check.
- The fallback for every outside service on the demo path.
- The one command that resets the demo data.

## 7. Land it and send everyone off

Commit everything and run `scripts/land`. Then tell the team, in three lines:

- Each of you: run `/start <your-name>` now, then `/next` as soon as the app shell is on main. With a stack starter it already is, so start right away. Without one, step 8 lands it in about ten minutes; until then, finish the setup and read your slice in `hack/architecture.md`.
- From here on nobody waits for anybody. Decide inside your slice, use stand-ins, land after every task.
- The shared core is being built in this session now.

## 8. Build the shared core

Do not stop here and do not ask. In this same session, follow `.claude/commands/skeleton.md` from top to bottom.
