# Hackathon project

- Product: Imtihaan, online exams that survive load-shedding, leaked papers and wrong answer keys
- Stack: Next.js 16, Supabase, Vercel
- Live URL: not deployed yet (`/shape` fills this in)

Two people build this in one day: Waqar and Umar, each with their own Claude Code. Each person owns one slice of the product from top to bottom. The goal is a demo that works on the live URL when the clock ends, and that a judge remembers.

## Hackathon mode

For this project these rules replace any personal or global workflow rules. There are no plan approvals, no reviewer that must pass before work lands, no delegating everything to subagents, and no docs standard: the `hack/` folder is the working paper for one day. Where a personal rule and this file disagree, this file wins.

## The three habits

1. **Own your slice fully.** Inside your slice you decide everything yourself: design, naming, libraries, what to cut. Nobody approves it.
2. **Never wait for a person.** If something from a teammate is missing, build a stand-in and move on. Never tell your person to wait for a teammate, ask a teammate, or get a decision from the lead. Decide, write one line in your log, keep going.
3. **Add to shared things freely.** A new field, endpoint, table, component or package needs no permission. If you change or remove something shared, you fix every place that uses it in the same change.

The details are in `.claude/rules/teamwork.md`.

## The loop

`/next` is the whole working day: take my next task, build it, check it, land it on main, take the next one. Git is handled by two scripts and never by hand:

- `scripts/task start` syncs with main, claims my next task and opens its branch.
- `scripts/land` brings main in, runs the check and pushes. It repeats if a teammate landed first.

## The clock

Every prompt carries a line that starts with `Hack clock:`. It gives the time left, the current phase and that phase's one rule. Follow the phase. When time is short, cut inside your own slice in this order: extras first, then should-haves, then the depth of a must-have. Never cut a step of the demo story.

## What matters, in order

1. The demo story works on the live URL, start to finish.
2. Main stays working. Every landing passes `scripts/check`.
3. It looks finished: real-looking data, no dead ends, no raw errors.
4. Should-haves, then extras.

## Where things are

| Path | What it holds |
|---|---|
| `hack/idea.md` | The chosen idea, why it wins, the judging criteria |
| `hack/requirements.md` | The person, the pain, the demo story, must / should / extras |
| `hack/architecture.md` | The stack, the shared core, the slices, the data shapes |
| `hack/tasks/<name>/` | One file per task, done in file-name order |
| `hack/verification.md` | The smoke test steps and the fallback for each outside service |
| `hack/log/<name>.md` | Each person's one-line notes: decisions, stand-ins, shared changes |
| `hack/demo.md`, `hack/pitch.md` | The demo script and the pitch |
| `scripts/` | `task`, `land`, `check`, `clock`, `setup` |

## Commands

| When | Command | Who |
|---|---|---|
| The team needs help choosing an idea (optional) | `/kickoff <the themes>` | Lead, with everyone in the room |
| The idea is decided | `/shape <everything we have in mind>` | Lead. It writes every document and task list, then builds the shared core |
| Once per laptop | `/start <name>` | Everyone |
| All day | `/next` | Everyone |
| Any time | `/board`, `/audit`, `/polish`, `/judge` | Anyone |
| At the freeze | `/freeze` | Everyone, on their own slice |
| During the freeze, and the next morning | `/demo`, `/demo morning` | Lead |
| After the build ends | `/pitch` | Lead |

## How to report

After each task: three lines at most. What works now, how it was checked (the command and its result line), and anything left as a stand-in. No file-by-file recaps.
