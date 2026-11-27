---
status: todo
tier: should
review: yes
---
# Bulk import candidates from CSV or JSON

## Goal
Kamran imports a class list from a spreadsheet; every bad row is reported clearly and nothing half-imports. Covers secondary feature 4.4 with the research's Excel traps (Urdu garbled, leading zeros dropped).

## What to build
- `/roster/import`: upload a CSV or JSON file (columns: full_name, roll_number, email, cnic, extra_time_pct). Parse on the server; keep roll numbers as text; accept UTF-8 with or without BOM; validate each row with Zod and against the roster (duplicate roll numbers).
- Dry run first: "28 rows ready, 2 rows with problems", a table of row number, field and the problem ("Row 7: email is not valid"). "Import 28 candidates" only when the file is clean, or after the person removes bad rows, in one transaction (all or nothing).
- A sample CSV to download.

## Done when
Upload a CSV with one bad email and one duplicate roll number: both rows are listed with the reason and nothing is saved; fix them and import: the roster grows by that many.

## Owns
`src/features/authoring/`, `src/app/(app)/roster/`.

## Stand-ins
None.
