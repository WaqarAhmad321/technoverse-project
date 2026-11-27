---
status: todo
tier: must
review: yes
---
# Resume, submit once, and finish at expiry

## Goal
A refresh or a closed tab loses nothing, a double submit is one submission, and the server finishes the attempt at the deadline with only the answers it received in time. Covers spec 3.5 (preserve progress and time on refresh, review and submit, enforce the time limit) and §06 (duplicate submissions, device clock).

## What to build
- Resume: opening `/take` for an in-progress attempt loads the saved answers and the server deadline; the remaining time is whatever the server says.
- Review step: "Review answers" lists every question with its state and links back; "Submit exam" asks once ("You have 2 unanswered questions. Submit anyway?") in an accessible dialog.
- Submit action: idempotent. The first call sets `status = submitted`, `submitted_at`, and a `receipt_code` (`IMT-` + 6 readable characters); a later call returns the same receipt. Answers arriving after submit are refused and logged as a `late_answer` incident.
- Expiry: the server treats an attempt as finished when `isAttemptFinished(attempt, now)`. When a finished in-progress attempt is next read (by the candidate, the monitor or a heartbeat), mark it `auto_submitted` with `submitted_at = attemptDeadline(attempt)`.
- `/exams/[examId]/receipt`: receipt code, the server time it was accepted, number of answers received, and "Your submission counted." Only the attempt's candidate sees it.

## Edge cases judges try
Double-click "Submit exam": one receipt. Close the tab, wait past the deadline, reopen: the receipt says it was submitted automatically at the deadline. Set the device clock forward: nothing ends early. Back button after submit: no way back into the workspace.

## Done when
Answer two questions, reload: both answers and the time left survive. Submit twice fast: one receipt code, the same on reload. A second attempt with a 1-minute exam (set `duration_minutes = 1` in the database) left alone reaches the receipt with "submitted automatically". The smoke test covers steps 4 and 7.

## Owns
`src/features/delivery/`, `src/app/(app)/exams/`, `src/app/api/attempts/`, `tests/smoke/delivery.spec.ts`.

## Stand-ins
None.
