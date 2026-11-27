---
status: todo
tier: must
review: no
---
# Roster and enrollment

## Goal
Kamran keeps his institution's roster of candidates and enrolls them into exams; only enrolled candidates can enter. Covers spec 3.4 (enroll and view enrollment, eligible candidates only) and accommodations from the research.

## What to build
- `/roster`: full name, roll number, email, masked CNIC, extra time %, exams enrolled. "Add candidate" form: name, roll number (kept as text), email (lower-cased), CNIC entered in full but stored masked (`35202-•••••••-3`), extra time 0–100%.
- On `/manage/[examId]` a Candidates tab: enrolled list with "Enroll all on roster", pick individuals, remove (only before they start).
- The candidate's login email must match the roster email; show a hint "Ayesha signs in with this email to see her exams."

## Edge cases judges try
Duplicate roll number refused. Invalid email or CNIC format refused with which field is wrong. Removing a candidate who has started is refused.

## Done when
Add "Hamza Riaz", roll 0245, `hamza.riaz@example.pk` → enroll him in Physics Midterm → the exam's Candidates tab shows 32 enrolled.

## Owns
`src/features/authoring/`, `src/app/(app)/roster/`, `src/app/(app)/manage/`.

## Stand-ins
None.
