---
status: done
tier: must
review: no
---
# Create and configure an exam

## Goal
Kamran creates an exam with its title, instructions, window, duration, total marks and shuffle settings, and picks its questions from the bank. Covers spec 3.2 (create and configure, lifecycle) and 3.3 (assign questions, randomise).

## What to build
- `/manage`: exams with title, phase (draft, upcoming, open, closed from `examPhase`), window in Pakistan time, enrolled count, submitted count.
- `/manage/new` and the details form on `/manage/[examId]`: title, instructions, opens at, closes at, duration in minutes, total marks, shuffle questions, shuffle options. Rules: closes after opens; duration fits inside the window; total marks > 0.
- Questions tab: add from the bank (filter by topic and difficulty), remove, reorder; running total "45 of 50 marks".
- A published exam's questions and window are locked once any attempt exists ("2 candidates have started; questions are locked"); title and instructions stay editable.
- Links: "Preview as candidate" → `/exams/[examId]/take?preview=1`, "Live monitor" → `/monitor/[examId]`.

## Edge cases judges try
Closing time before opening time refused. Editing questions while an attempt is in progress refused with the reason. Another examiner's exam in the same institution: visible, editable only by its creator or an institution admin (`can(member, "exam.edit", exam)`).

## Done when
"Try as examiner" → "New exam" → "Physics Final", window next week, 60 minutes, 50 marks → add 5 questions: the total shows their sum; the exam appears on `/manage` as draft.

## Owns
`src/features/authoring/`, `src/app/(app)/manage/`.

## Stand-ins
Delivery owns the preview and monitor screens; link to them anyway.
