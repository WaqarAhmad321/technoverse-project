---
description: Lead, optional. Use it when the team needs help choosing. Turn the hackathon themes into scored problem ideas and lock one with the team.
argument-hint: <the themes and any rules, pasted as given>
---

# Kickoff: pick the idea

The themes and rules from the organisers:

$ARGUMENTS

This is the first phase of the day. The whole team is in the room. The goal is one locked idea, written down, before the phase ends. Run `scripts/clock` first and keep to it. A good idea picked on time beats a perfect idea picked late.

## 1. Facts (two minutes)

- If the build window in `hack/clock.env` is wrong, fix it.
- Write the judging criteria into `hack/idea.md`. If the organisers gave none, keep the five defaults already there.
- Write down the deliverables and any rule that limits what may be built or used.
- If no themes were pasted above, ask for them once, then go on.

## 2. Hand out the parallel work now

Say this to the team before generating ideas, so nobody sits idle during this phase:

- One teammate: put the project on GitHub, get a "hello" page on a live URL, and put the shared keys into everyone's `.env`.
- The other teammate: start reading about the themes. Who has these problems, what do they use today, what data and free APIs exist.

They stay in the conversation and vote on the idea. This work just runs alongside.

## 3. Ideas (ten minutes)

Produce six to eight problem ideas, spread across the themes. For each one, in four lines:

- **Who and what hurts:** a specific person and a specific pain. "Students" is not specific. "A final-year student who has to turn 40 papers into a literature review in a week" is.
- **What we build:** one sentence.
- **The demo moment:** the ten seconds a judge will remember.
- **The risk:** the one thing most likely to sink it today.

An idea only makes the list if:

- The pain is real and the person exists. No solutions looking for a problem.
- The demo moment can be shown live in under three minutes.
- The team, each with Claude, can build the main flow in about four hours.
- It splits naturally into one part per person, and the parts barely touch.
- Its data is available today: public, free, or easy to make up believably. Nothing that needs approval, scraping behind a login, or weeks of collection.
- It is not a plain wrapper around a chat model, and not a to-do list. If an AI model is the core, the product must do something with the answer that a chat window cannot.

## 4. Score

One table. Score each idea 1 to 5 on every judging criterion, plus two more columns: **buildable today** and **demo moment**. Total them. Be harsh: a 5 means a judge would say it out loud.

## 5. Reality check on the top three (five minutes, in parallel)

For each of the top three, check with a web search:

- Who already does this, and what our angle is next to them.
- Whether the data or API it needs is really free and instant to get.
- The hardest piece, and the fallback if it does not work by mid-afternoon.

Lower a score if the check hurts it.

## 6. The team picks

Show the top three in a few lines each: the person and pain, what we build, the demo moment, the score, the risk. Give your recommendation and the reason in one sentence. Then ask the team which one. This is one of only two decisions the team makes together today; the other is the split, in `/shape`.

## 7. Write it down and land it

- Fill in `hack/idea.md`: the chosen idea, the person, the pain, the demo moment, why it scores, the runner-up in one line, and the risk with its fallback.
- Update the Product line at the top of `CLAUDE.md`.
- Commit and run `scripts/land`.

End with one line: the idea is locked, and the lead runs `/shape` next.
