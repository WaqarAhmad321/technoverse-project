---
status: todo
tier: extra
review: no
---
# Camera-free integrity signals for review

## Goal
The examiner sees tab switches, large pastes and odd timing as a review list, never as a verdict. Innovation challenge 5.1, without a camera and without accusing anyone. Design: `hack/research/innovation-design.md`.

## What to build
- In the workspace: record `tab_hidden` (with seconds) on `visibilitychange`, `paste` (with the character count, not the text) in written answers, through the offline queue.
- On the monitor: per candidate a short neutral timeline ("Tab hidden 14 s at 10:42, right after Q4 was answered"). The heading says "Signals for review, not evidence of misconduct".
- Candidates are told in the instructions what is recorded.

## Done when
In the workspace switch tabs for 10 seconds and paste text into a written answer: the monitor shows both lines for that candidate within 10 seconds.

## Owns
`src/features/delivery/`.

## Stand-ins
None.
