---
status: done
tier: should
review: no
---
# Question analytics

## Goal
Kamran sees how each question behaved: how many got it right, how well it separated strong and weak candidates, how often it was skipped, which wrong options attracted people, and whether its labelled difficulty matched reality. Covers secondary feature 4.5.

## What to build
- An "Questions" tab on `/marking/[examId]` reusing the Key Doctor numbers: share correct, discrimination, skip rate, option shares (a small bar per option), average marks for written questions, and "Labelled medium, behaved hard".
- Sandbox attempts excluded.

## Done when
On Quiz 1 the tab lists every question with these numbers; Q7 shows B as the most chosen option among the top group.

## Owns
`src/features/authoring/`, `src/app/(app)/marking/`.

## Stand-ins
None.
