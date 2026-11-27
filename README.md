# Imtihaan (امتحان)

**Online exams that survive Pakistan: load-shedding, leaked papers and wrong answer keys.**

Imtihaan is a full-stack exam platform for colleges, universities and boards. A platform admin approves institutions; each institution runs its own exams with real exam-office roles. Candidates sit exams that keep working through outages, examiners get help catching wrong answer keys before results go out, and every powerful action is recorded in a tamper-evident log. It works without a camera, without paid AI and on a 2G phone.

Built in one day for **Web-e-Thon, Technoverse 5.0 (COMSATS University Lahore)** by Waqar Ahmad and Umar.

- **Live URL:** _added at deployment_
- **Repository:** this one, with its full commit history

## Try it (test access for every role)

Open the live URL. The first screen has one-click demo sign-ins, no password needed:

| Button | Who you are | Try this |
|---|---|---|
| **Try as examiner** | Kamran Siddiqui, examiner at Ravi Science College, Lahore | Exams → Physics Midterm → Review and publish (the checklist catches 45 vs 50 marks). Marking → Physics Quiz 1 (Key Doctor flags Q7). |
| **Try as candidate** | Ayesha Khan, BS Physics Section A | My exams → Waves Practice Quiz: answer, go offline, reload, submit. My results → PDF and QR verify. |
| **Try as admin** | Sana Iqbal, institution admin | People (roles), Audit log → Verify chain. Give yourself *Controller of Examinations* to see the approval workflow. |
| **Platform admin** | Farah Naveed, platform admin | Institutions: approve or reject applications, suspend, appoint admins. |

You can also **create an account**: "Set and mark exams" creates a new institution (pending platform approval, seeded with sample data); "Sit exams" joins as a candidate (use an email on an institution's roster).

`scripts/db reset-demo` restores the demo institution to its starting state.

## What is built

### Core requirements (§03)
- **Auth and authorisation (3.1):** super admin → institutions → memberships (institution admin, examiner, candidate, Controller of Examinations, invigilator, observer). Every page, server action and API route checks role, institution and ownership on the server; a candidate typing an examiner URL gets "not found".
- **Exams (3.2):** create and configure (window, duration, total marks, shuffle settings); draft → published → open → closed from server time; a pre-publish checklist blocks broken papers; optional controller approval before publishing.
- **Question bank (3.3):** single-answer, multiple-select (all-or-nothing or partial, formula shown) and written questions with topic, difficulty and versioning; each attempt snapshots its paper, so edits never change a paper in progress.
- **Candidates (3.4):** roster with classes/sections, enroll a whole section, join link, "joined / not joined" status; only enrolled candidates in the window can start.
- **Exam workspace (3.5):** server-authoritative timer, question navigator (answered / not answered / marked for review), autosave, refresh-safe resume, one submission per attempt with a receipt code, automatic submission at the deadline using only answers received in time.
- **Monitoring (3.6):** live board (progress, connection, signals worded as "for review, not evidence"), announcements that reach candidates within seconds.
- **Grading (3.7):** automatic marking of objective answers, blind manual marking of written answers with mark validation, optional AI second marker.
- **Results (3.8):** controlled publication (optional controller sign-off), candidates see only their own published results, exam summary and per-candidate scores from real submissions, versioned results.

### Secondary features (§04)
1. **Network-aware interface:** heartbeat-based status, "Offline: 3 answers kept on this phone", last-saved time, slow-connection notice, pre-exam device check.
2. **PDF reports:** server-generated, access-checked result PDF with a verification QR.
3. **Exam sandbox:** examiners preview any exam (drafts too) as a candidate; sandbox attempts never count anywhere.
4. **Bulk import:** candidates and questions from CSV/JSON with a dry run, row-level errors and all-or-nothing commit.
5. **Question analytics:** share correct, discrimination, skip rate, distractor choices, observed against labelled difficulty.
6. **Verifiable reports:** public `/verify/<code>` page showing initials, exam, score and version only, and "superseded by version 2" when a result changes.
7. **Customisable workspace:** text size, high contrast and layout, saved to the account.
8. **Digital scratchpad:** a rough-work drawer per question with notes and a sketch pad, saved as you go, never marked, private.

### Open innovation (§05)
- **5.3 Failure-resilient exams:** answers are queued on the phone with rising sequence numbers and synced when the connection returns (the newest always wins); the timer follows the server, not the device clock; **fair time back**: an outage the candidate could not work through earns its time back (capped, examiner approval above five minutes), while one they kept answering through earns none.
- **5.4 Trust and dispute resolution:** the **Key Doctor** runs item analysis after an exam (difficulty, top-vs-bottom discrimination, distractor choices among top scorers), flags likely wrong or ambiguous keys and blocks publication until each is resolved; a fix regrades everyone. A **dispute desk** lets candidates challenge a question for free; decisions need a reason, can never lower a mark, and question-wide fixes reach every candidate with versioned results.
- **5.5 Leak tracing:** paste a leaked paper and the leak tracer matches it against each candidate's shuffled question order to name the paper it most likely came from, so a leak is traced to its source instead of forcing a full retest.
- **5.1 Integrity without a camera:** tab switches, pastes and connection gaps are recorded and shown to the examiner as signals "for review, not evidence"; nothing is ever an automatic penalty.
- **Governance:** platform approval of institutions, Controller of Examinations sign-off on papers and results (nobody approves their own), and a hash-chained audit log with a "Verify chain" check.

### AI (optional, as the rules require)
Every required feature works with AI switched off. With `ANTHROPIC_API_KEY` set, an AI second marker proposes marks for written answers and re-reads disputed written answers; it only proposes, an examiner decides, and candidate text is treated as data, never instructions. Without a key it says "unavailable" and marking continues by hand.

## Stack and architecture

- **Next.js 16** (App Router, TypeScript, Tailwind CSS, shadcn/ui) on **Vercel**; **Supabase** (Postgres and Auth). Package manager: pnpm.
- All data access is on the server; every query is scoped by institution and role. Answer keys, paper seeds and integrity details never reach a candidate's browser.
- Data model: institutions, memberships, candidates, questions, exams, exam_questions, enrollments, attempts, attempt_questions (per-attempt snapshot), answers, scratchpads, incidents, announcements, preferences, grades, results (versioned), key_fixes, disputes, approvals, audit_events (hash chain). Details in `hack/architecture.md`.
- Key dependencies: `next`, `react`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `pdf-lib`, `qrcode`, `lucide-react`, `sonner`, `radix-ui` (via shadcn), `@fontsource-variable/figtree`, `@anthropic-ai/sdk` (optional AI). Tests: `@playwright/test`.

## Run it locally

1. `pnpm install`
2. Create a Supabase project, run `db/bootstrap.sql` once in its SQL editor, then copy `.env.example` to `.env.local` and fill in the values (names only are listed there).
3. `scripts/db push` creates the tables.
4. `pnpm dev` and open the printed URL, then use the "Try as …" buttons.

A faster local database for the browser tests: `scripts/local-db up` (needs Docker) makes `scripts/check` run against a local Supabase.

**Checks:** `scripts/check` runs install, database push, lint, type check, build and the Playwright smoke test of the demo story.
