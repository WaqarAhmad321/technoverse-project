---
description: Lead, during the freeze, and again on the morning of the evaluation. Write the demo script, rehearse it on the live URL, and prepare the safety nets.
argument-hint: [morning, to run only the evaluation-day check]
---

# Demo: script, rehearsal, safety nets

Mode: $ARGUMENTS

If the mode is `morning`, do only the last section.

## 1. The script: `hack/demo.md`

Turn the demo story from `hack/requirements.md` into a script for a three-minute slot:

- **The opening line.** The person and the pain in one sentence a judge feels. No "our platform leverages".
- **The steps.** For each: what the presenter clicks, the one sentence they say, what appears, and how long it takes. The demo moment falls before the two-minute mark.
- **The closing line.** What changes for that person, and one extra worth naming.
- **Who presents and who drives.** One talks, one clicks, one watches the room and the clock.
- **What is not real.** Every stand-in still on the demo path, from the freeze reports, with a one-line honest answer if a judge asks.

## 2. Demo data

- Reset the data with the command in `hack/demo.md` and confirm the records the script uses are there.
- The script uses the same records every time. Write their names into the script.

## 3. Rehearse on the live URL

Walk the whole script in a real browser on the live URL, as written, with a stopwatch. Take a screenshot at every step into `hack/demo-shots/`. Record, per step: worked or not, seconds taken, anything ugly.

Fix what broke, land it, and walk it again from a fresh reset until one full run passes without a stumble. If a step keeps failing, change the script to go around it. A shorter demo that works beats a longer one that might.

## 4. Safety nets

- **Backup video.** Tell the team to screen-record one clean run now, with the script's words, and keep the file on two laptops and a phone.
- **A second way in.** The app also runs locally in demo mode on the presenter's laptop, with the same data, in case the venue network fails.
- **Let the judges hold it.** Make a QR code for the live URL and put it in `hack/demo.md` and on the last slide.
- **If it breaks on stage.** One line in the script for each risky step: what the presenter says and does instead.

## 5. Morning of the evaluation (`/demo morning`)

The app has sat untouched overnight. Before anyone presents:

1. Open the live URL. Free hosting may have gone to sleep: wake it and note how long that took.
2. Check that every key still works and no quota ran out overnight.
3. Reset the demo data.
4. Walk the full script once on the live URL and once locally in demo mode.
5. Confirm the backup video plays on the presenting laptop.

Report in five lines: ready or not, what was fixed, how long the app took to wake, and what the presenter must do in the last ten minutes before going on.
