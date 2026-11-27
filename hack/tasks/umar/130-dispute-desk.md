---
status: todo
tier: extra
review: yes
---
# Dispute desk with blind review and versioned results

## Goal
Ayesha challenges a question from her result for free; a reviewer decides with a reason; a question-wide fix reaches every candidate, not only those who complained. Innovation challenge 5.4 and the research's recount-only rechecking (Rs 1,200–1,500 per paper).

## What to build
- `/disputes/new?result=<resultId>` (candidate, own published result only): pick a question, write the reason, "Send challenge". One open challenge per question per result.
- `/disputes` (examiner): open challenges grouped by question ("Q4: 3 challenges"); `/disputes/[disputeId]`: the question, key, the candidate's answer (roll number only), the item statistics, and a decision: uphold or reject, with a required reason. No-penalty rule: a challenge can never lower a mark.
- Upholding a question-level problem offers the same fixes as the Key Doctor (they write `key_fixes`), regrades everyone and publishes new result versions with the reason.
- Candidate sees the status on her result page (delivery reads `disputes`).

## Done when
As the candidate challenge Q4 on Quiz 1; as the examiner uphold it with "accept both": Ayesha's result shows version 2 with the reason; every candidate who chose that option also gains the marks.

## Owns
`src/features/authoring/`, `src/app/(app)/disputes/`.

## Stand-ins
None.
