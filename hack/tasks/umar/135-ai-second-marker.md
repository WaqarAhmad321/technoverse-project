---
status: done
tier: extra
review: no
---
# AI second marker for written answers

## Goal
Rechecking in Pakistani boards is a recount, not a re-read. The AI re-marks every written answer blind against the rubric, quoting the words that earned each mark, and flags scripts where it disagrees with the examiner. A dispute on a written question shows the AI's re-read. The AI never gives the final mark.

## What to build
- `aiMarkWritten` (Claude, structured output, behind `liveOrRecorded`): marks per rubric line with the quoted words.
- Written marking queue: "AI second marker: 3 of 5" with the quoted lines beside Kamran's form.
- After Kamran saves, a gap of more than 1 mark lists the script under "Needs a second look".
- Dispute page for a written question: the AI's re-read.

## Done when
Quiz 1 written queue shows the AI's mark and quotes; marking 1 where the AI says 4 lists the script under "Needs a second look".
