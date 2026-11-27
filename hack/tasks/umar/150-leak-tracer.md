---
status: todo
tier: extra
review: no
---
# Leak Tracer and quarantine

## Goal
When a paper turns up on WhatsApp, Kamran pastes it and sees which candidate's paper it came from, then quarantines the papers not yet started. Innovation challenge 5.5 (participant-defined) and the MDCAT 2024 Sindh leak. Design: `hack/research/innovation-design.md`.

## What to build
- `/manage/[examId]/leak`: paste text; match each pasted question to the exam's questions (normalised text similarity); compare the order of matched questions (and options) with every attempt's `attempt_questions` order; rank attempts by match with a confidence in words ("Matches roll 0231's order on 9 of 10 questions").
- "Quarantine": swap the leaked questions out of every attempt not yet started (they will get a new paper from `buildPaper` without them) and list attempts already finished that saw them. Audit `exam.quarantined`.

## Done when
Copy the questions of one Quiz 1 attempt in its order, paste them: that attempt ranks first with high confidence.

## Owns
`src/features/authoring/`, `src/app/(app)/manage/`.

## Stand-ins
None.
