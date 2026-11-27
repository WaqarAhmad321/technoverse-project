---
status: done
tier: must
review: yes
---
# Start an attempt and answer in the workspace

## Goal
Ayesha starts the exam and answers in an accessible workspace with the server's time, a question navigator and autosave. Covers spec 3.5 (workspace, answered / unanswered / marked for review, autosave) and 3.3's snapshot rule.

## What to build
- Start action: `requireMember("candidate")`, enrolled, phase open, no finished attempt. Creates the attempt with a random `seed`, `deadline_at = now + duration × (1 + extra_time_pct/100)`, and the `attempt_questions` snapshot from `buildPaper(exam, items, seed)`. A second start returns the existing attempt (unique key), never a second paper.
- `/exams/[examId]/take`: one question at a time on phones, with a navigator of numbered buttons whose state reads as text and colour: answered, not answered, marked for review. Single choice as radio buttons, multiple as checkboxes, written as a textarea. "Mark for review" toggle. Marks shown per question.
- Time left: the page gets `deadline` from the server and counts down to it; it never trusts the device clock to decide anything. At zero it moves to the receipt (task 060 finalises).
- Saving: every change is sent to `/api/attempts/[attemptId]/answers` with `client_seq`; the server upserts on (attempt, question) only when `client_seq` is higher, sets `received_at`, and refuses answers after `attemptDeadline`. The bar shows "Saving…", then "Saved".
- Never send `answer_key` or `seed`: the take page selects only the columns it shows.

## Edge cases judges try
Inspecting the network responses shows no answer key. Editing a question in the bank during the attempt does not change her paper. Two quick clicks on an option save once. Keyboard only: Tab reaches every option and the navigator; focus is visible; the timer is announced politely, not every second.

## Done when
"Try as candidate" → Waves Practice Quiz → Start exam: questions in a shuffled order, the timer counts down from the server's deadline, choosing an option shows "Saved"; reload and the choice is still there; the navigator shows it as answered.

## Owns
`src/features/delivery/`, `src/app/(app)/exams/`, `src/app/api/attempts/`.

## Stand-ins
None.
