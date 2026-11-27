---
description: Lead, after the build ends. Write the pitch, the slides' content, the README, the submission text and the answers to hard questions.
argument-hint: [the time slot and format, if the organisers gave one]
---

# Pitch: tell it so they remember

Slot and format: $ARGUMENTS

Read `hack/idea.md`, `hack/requirements.md`, `hack/demo.md` and the files in `hack/log/`. Write everything in the plain words of the person the product is for. No "leverage", "seamless", "revolutionary", "cutting-edge", "AI-powered".

## 1. The pitch: `hack/pitch.md`

Slide by slide, each with a headline of at most eight words, what is on the slide, and what the speaker says in at most three sentences:

1. **The person and the pain.** One real, specific situation. A number if we have a true one.
2. **What exists today and why it fails them.** Short and fair.
3. **What we built.** One sentence, then straight into the live demo.
4. **The demo.** It replaces slides. Reference `hack/demo.md`.
5. **How it works.** One simple diagram of the parts and the data between them. Thirty seconds.
6. **What is real.** What works today on the live URL, said plainly. Judges trust a team that says what is and is not finished.
7. **What comes next.** Two or three steps, and who would pay or who would use it.
8. **The team.** The names, who built what, the live URL and the QR code.

Map the pitch to the judging criteria at the end: one line per criterion on where in the pitch it is earned. If a criterion is not earned anywhere, fix the pitch.

## 2. Hard questions

Write the ten questions a sceptical judge is most likely to ask, with a two-sentence honest answer each. Include: how is this different from the obvious existing tool, what is faked in the demo, how does it handle the ugly case, would anyone pay, what about privacy or safety, and what would you do with one more week.

## 3. README.md

For someone who lands on the repo cold: what it is in one line, the live URL, one screenshot from `hack/demo-shots/`, how to run it locally in demo mode, the stack, and the team. No badge wall, no feature bullet lists.

## 4. Submission text

A short version (about 50 words) and a long version (about 200 words) for the submission form, plus the title, a one-line tagline and the list of what was built during the event.

## 5. Land it

Commit and run `scripts/land`. Report in four lines: where the pitch is, how long it runs when read aloud, the criterion it is weakest on, and what to rehearse.
