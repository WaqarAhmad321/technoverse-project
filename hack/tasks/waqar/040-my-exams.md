---
status: todo
tier: must
review: no
---
# Candidate sees open, upcoming and completed exams

## Goal
Ayesha sees the exams she is enrolled in, grouped as open now, upcoming and completed, with instructions and a clear access state. Covers spec 3.4 (available, upcoming, completed; eligible only; availability window) and the entry to 3.5.

## What to build
- `/exams`: three sections. Rows come from `enrollments` for `myCandidateIds(member)`, joined to published `exams`. Phase from `examPhase(exam, now)`. Drafts never show.
  - Open: title, duration, closes at (Pakistan time, "closes Fri 4 Dec, 5:00 pm"), and "Start exam" or "Continue exam" if an attempt is in progress.
  - Upcoming: opens at, with a countdown in plain words ("opens in 2 days").
  - Completed: submitted or closed, with "See result" when a published result exists, otherwise "Result not published yet".
- `/exams/[examId]`: instructions, duration, total marks, number of questions, the marking rule for multiple-select in plain words, and "Start exam". The server refuses to show it unless the candidate is enrolled, and refuses to start unless the phase is open.

## Edge cases judges try
Opening `/exams/<a draft exam id>` or an exam she is not enrolled in → not found. Opening an upcoming exam → its page says when it opens and "Start exam" is absent; posting the start action anyway is refused by the server. Changing the device clock changes nothing, because the phase comes from the server.

## Done when
"Try as candidate" → My exams: Waves Practice Quiz under open, Physics Pre-test and Quiz 1 under completed, Physics Midterm absent while it is a draft. After the examiner publishes the Midterm it appears under open on reload.

## Owns
`src/features/delivery/`, `src/app/(app)/exams/`.

## Stand-ins
Physics Midterm is a draft until authoring's publish lands; to see it as open, set its status to published in the database.
