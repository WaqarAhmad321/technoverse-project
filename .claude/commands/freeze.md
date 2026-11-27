---
description: Everyone, when the clock says Feature freeze. Stop adding, make my slice demo-safe, and land it.
---

# Freeze: make it safe to show

From now on nothing new is built. Each person runs this on their own slice. Run `scripts/clock` to see how long the freeze lasts.

## 1. Finish or hide

Run `scripts/task list <you>`. For every task that is not done:

- Minutes from done and on the demo story: finish it now.
- Anything else: hide it. Remove its entry from the navigation and its buttons from the screens, so the demo can never wander into something half-built. Leave the code and leave the task open. If it is the task this checkout holds and its work is not fit to land, park it with `scripts/task park "hidden at freeze"`. Note what was hidden in `hack/log/<you>.md`.

## 2. No stand-ins on the demo path

    grep -rn "STAND-IN(" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=hack --exclude-dir=.claude

For each one in my slice: if the real thing is on main, switch to it. If not, and it is on the demo path, make the stand-in good enough to show: believable data, no visible seam. Write each remaining one into `hack/demo.md` under "What is not real", so the presenter is never surprised.

## 3. Walk the demo story

Walk every step of the demo story from `hack/requirements.md` that touches my slice, on the live URL, in a real browser, with the demo data freshly reset. Then once more at phone width. Fix what breaks. Fix nothing that is merely imperfect unless it takes under five minutes.

## 4. Fallbacks

For each outside service my slice calls on the demo path, switch it off or point it at nothing, and confirm the fallback from `hack/verification.md` shows instead of an error.

## 5. Land

`scripts/check`, then `scripts/land`. Confirm the live URL has the new version.

Report in four lines: what was finished, what was hidden, what is not real, and whether my part of the demo story passes on the live URL.
