---
status: done
tier: must
review: yes
---
# Review and publish with a checklist that blocks mistakes

## Goal
Before publishing, Kamran reviews the exam and a checklist stops anything broken from reaching candidates. Covers spec 3.2 (review before publication, lifecycle) and the research's wrong-paper incidents (Mardan class 9 paper, KU numbering). Story step 3.

## What to build
- "Review and publish" on `/manage/[examId]`: a summary of everything a candidate will get (instructions, window, duration, questions with marks) and the checklist, each line pass or fail with the fix:
  - question marks add up to the total ("Questions add up to 45 marks, the exam says 50");
  - every objective question has a valid key; every written question has a rubric;
  - at least one candidate is enrolled;
  - the window is in the future or open, and the duration fits;
  - a soft warning (does not block) for a window over Jumu'ah prayers (Friday 12:30–14:30 Pakistan time) or after 22:00.
- "Publish exam" is disabled while any line fails; the server re-runs the same checklist (one shared function) before setting `status = published` and `published_at`. Audit `exam.published`.
- "Unpublish" only while nobody has started.

## Done when
"Try as examiner" → Physics Midterm → "Review and publish": "Questions add up to 45 marks, the exam says 50" fails and the button is disabled; add a 5-mark question: all pass; "Publish exam": the phase shows open, and the candidate sees it under open exams. The smoke test covers step 3.

## Owns
`src/features/authoring/`, `src/app/(app)/manage/`, `tests/smoke/authoring.spec.ts`.

## Stand-ins
None.
