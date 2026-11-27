---
status: done
tier: must
review: yes
---
# Mark written answers with validation

## Goal
Kamran marks written answers against the rubric, cannot give more than the question is worth, and the totals stay consistent. Covers spec 3.7 (manual grading with validation against assigned marks, consistent grading state).

## What to build
- On `/marking/[examId]` a "Written answers" queue: one answer at a time with the question, rubric and the candidate's text (show the roll number, not the name, to keep it blind; names come back at publish). Marks input and feedback; "Save and next".
- Server: marks between 0 and the question's marks in steps of 0.5; refuse otherwise ("This question is worth 5 marks"). Upsert `grades` with `source = manual` and `graded_by`.
- The exam's grading state: "Marking in progress (12 of 30 written answers)" or "All marked". Publishing results (task 090) needs "All marked".

## Edge cases judges try
7 out of 5 refused; −1 refused; a text value refused. Marking an attempt from another institution → not found.

## Done when
On Quiz 1 mark the first written answer 4 of 5: saved, the queue moves on, the count updates; type 7: refused with the message. The smoke test covers this part of step 8.

## Owns
`src/features/authoring/`, `src/app/(app)/marking/`.

## Stand-ins
None.
