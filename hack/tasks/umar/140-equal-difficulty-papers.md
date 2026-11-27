---
status: todo
tier: extra
review: yes
---
# Equal-difficulty random papers

## Goal
When each candidate gets a different random selection from a pool, every paper has about the same expected difficulty, while staying varied. Innovation challenge 5.2. Algorithm: `hack/research/innovation-design.md` (Bayesian-smoothed difficulty, blueprint, hill-climb).

## What to build
- Exam setting "Pick N questions per topic from the pool" (stored in `exams.settings`). Difficulty per question from past p-values, smoothed toward its label for new questions.
- Replace the insides of `buildPaper` in `src/lib/paper.ts` (shared; keep the signature) with: random start, then swaps that bring the paper's expected score within a tolerance of the target, seeded so the same attempt always gets the same paper.
- A fairness panel on `/manage/[examId]`: histogram of expected scores for 200 simulated papers, naive random vs balanced, and the spread in words.

## Done when
On an exam with a 20-question pool and "2 per topic": the fairness panel shows the balanced spread clearly narrower than naive; two starts with the same seed give the same paper.

## Owns
`src/features/authoring/`, `src/lib/paper.ts` (shared, same signature).

## Stand-ins
None.
