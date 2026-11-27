---
status: todo
tier: must
review: yes
---
# Candidate sees only her own published results

## Goal
Ayesha sees her published results with a per-question breakdown and what changed if a key was corrected. Covers spec 3.8 (controlled publication, own results only, retained results).

## What to build
- `/results`: her current results (`is_current`, `published_at` not null, `candidate_id in myCandidateIds`), newest first: exam, score out of max, percentage, published date, version.
- `/results/[resultId]`: score, the breakdown by question (position, marks awarded of marks), her own answer for each question (from her `answers`) and, only after publication, the correct option. Notes from `key_fixes` in plain words: "Q7: the answer key was corrected; your mark was updated." If `version > 1`, show "Updated result (version 2): Q7 key corrected" from `reason`.
- "Challenge a question" link to authoring's `/disputes/new?result=<resultId>`.
- Another person's result id → not found. An unpublished result → not found.

## Done when
"Try as candidate" → My results → Physics Pre-test: score, breakdown and correct answers show. Changing the id in the URL to another candidate's result shows not found.

## Owns
`src/features/delivery/`, `src/app/(app)/results/`.

## Stand-ins
Results come from authoring's publish; the Pre-test results are seeded and published.
