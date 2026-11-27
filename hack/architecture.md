# Architecture

Keep it current: when a data shape gains a field, the change lands here in the same commit.

## Stack

Next.js 16, Supabase, Vercel: one Next.js app (App Router, TypeScript, Tailwind, shadcn/ui) on Vercel, Supabase for the database and accounts, pnpm. Details in `.claude/rules/stack.md`.

## The structure in one paragraph

Platform → institutions → people. A **super admin** runs the platform and creates institutions. Each **institution** owns everything inside it: its roster, question bank, exams, attempts and results. A person gets powers in an institution through **memberships** (`institution_admin`, `examiner`, `candidate` today; `controller`, `moderator`, `invigilator`, `observer` and the rest of the Pakistani exam hierarchy later, as new membership roles, not new code paths). Every check goes through one policy function, so separation-of-duty rules (a setter cannot approve their own paper, a controller approves publication) are added in one place.

## The shared core

What everyone starts from. Adding to it is free; changing it means fixing every use.

- **The look:** shadcn tokens in `src/app/globals.css`, components in `src/components/ui/`, states in `src/components/states.tsx`.
- **Access (`src/lib/access.ts`), the only way to know who may do what:**
  - `requireMember(...roles)` → `{ user, profile, institution, roles }` for the person's current institution, or "not found" if they hold none of those roles there. Every page and action in a slice starts with it.
  - `requireSuperAdmin()` for platform screens.
  - `can(member, action, resource?)` for finer rules (`"exam.edit"` is true for the exam's creator or an institution admin). New roles and separation-of-duty rules go here.
  - `myCandidateIds(member)`: the roster rows in this institution whose email matches the person's login email. That is how a candidate account meets the roster; no linking step.
  - Roles are a TypeScript union checked with Zod, not a database check, so adding a role never needs a migration.
- **Current institution:** the person's first active membership. A switcher is an extra; the cookie name is reserved: `imtihaan-institution`.
- **Sign-up:** "I set exams" creates a new institution owned by the person, makes them its `institution_admin` and `examiner`, and seeds it. "I am a candidate" creates only the profile; at every sign-in the shared core adds a `candidate` membership for each institution whose roster has their email.
- **Demo accounts:** the landing page has "Try as examiner", "Try as candidate" and "Try as admin", and a small "Platform admin" link. All four share `DEMO_PASSWORD`; emails are `DEMO_EMAIL` with a tag (`+examiner`, `+candidate`, `+admin`, `+platform`). The first click creates the demo institution "Ravi Science College, Lahore" with all of them plus Bilal Ahmed (a candidate account the admin promotes in step 2). If a demo account exists with an old password, the sign-in resets it to the current `DEMO_PASSWORD`. Names and emails: `src/lib/demo-accounts.ts`.
- **Navigation:** `src/lib/nav.ts`, one line per screen with the roles that see it (`audience`). `/home` greets the person and shows their screens from the nav as buttons, so a new nav line appears there too.
- **Shared exam rules (`src/lib/exam-rules.ts`, pure):** `examPhase(exam, now)` → `draft | upcoming | open | closed`; `attemptDeadline(attempt)` = `deadline_at + credit_seconds`; `isAttemptFinished(attempt, now)`; `answerCounts(answer, attempt)` (received before the deadline). Both slices use these, so "ongoing" and "late" mean the same everywhere.
- **The paper (`src/lib/paper.ts`):** `buildPaper(exam, items, seed)` → the ordered snapshot rows for one attempt, shuffling questions and options from the seed when the exam says so. Delivery calls it when an attempt starts. Authoring may swap its insides for equal-difficulty selection, keeping the signature.
- **Audit (`src/lib/audit.ts`):** `recordAudit(member, action, entityId, payload)` appends to a per-institution hash chain. Call it for every publish, key change, regrade, role change and institution change.
- **Row types:** `src/lib/exam-types.ts`, one type per table below.
- **Sample data:** every new institution gets the world from `src/lib/seed-world.ts` (see Sample data). `scripts/db reset-demo` removes the demo accounts and their institution; the next click recreates them.
- **Demo-mode switch:** `DEMO_MODE=1`, through `liveOrRecorded` in `@/lib/demo`. Only the optional AI Paper Reviewer needs it.

## The slices

Each slice is a full feature from screen to data, owned by one person. Slices meet only through the tables below and the shared core; neither imports the other's `features/` folder. A link to the other slice's route is fine.

### Slice 1: Delivery (people, sitting the exam, results), owned by waqar

- **Demo-story steps it covers:** 1 (landing, with the shared core), 2, 4, 5, 6, 7, 9.
- **Screens and routes:** `/platform` (super admin: institutions, first admin) · `/admin/people` (institution admin: people and roles) · `/exams` (candidate: open, upcoming, completed) · `/exams/[examId]` (instructions, system check, start) · `/exams/[examId]/take` (workspace; `?preview=1` is the examiner's sandbox) · `/exams/[examId]/receipt` · `/monitor/[examId]` (live board and announcements) · `/results` and `/results/[resultId]` (candidate) · `/results/[resultId]/pdf` · `/verify/[code]` (public) · `/api/attempts/[attemptId]/*` (answer sync and heartbeat for the offline queue).
- **Data it writes:** `institutions`, `memberships` (role changes), `attempts`, `attempt_questions`, `answers`, `scratchpads`, `incidents`, `announcements`, `preferences`.
- **Folders it owns:** `src/features/delivery/`, `src/features/people/`, `src/app/(app)/platform/`, `src/app/(app)/admin/`, `src/app/(app)/exams/`, `src/app/(app)/monitor/`, `src/app/(app)/results/`, `src/app/verify/`, `src/app/api/attempts/`, `tests/smoke/delivery.spec.ts`.
- **Reads from other slices:** `exams`, `exam_questions`, `questions`, `candidates`, `enrollments`, `results`, `grades`, `key_fixes`, `disputes`. All seeded from the first minute. Until authoring publishes the Midterm, use the seeded open "Waves Practice Quiz".

### Slice 2: Authoring (setting and marking), owned by umar

- **Demo-story steps it covers:** 3, 8, and the dispute and result-version parts of the extras.
- **Screens and routes:** `/questions`, `/questions/new`, `/questions/[questionId]`, `/questions/import` · `/roster`, `/roster/import` · `/manage`, `/manage/new`, `/manage/[examId]` (details, questions, enrolled candidates, checklist, publish, "Preview as candidate" → `/exams/[examId]/take?preview=1`, "Live monitor" → `/monitor/[examId]`) · `/marking/[examId]` (grading, Key Doctor, question analytics, exam summary, publish results) · `/disputes`, `/disputes/new?result=<resultId>` (candidate), `/disputes/[disputeId]`.
- **Data it writes:** `questions`, `exams`, `exam_questions`, `candidates`, `enrollments`, `grades`, `results`, `key_fixes`, `disputes`.
- **Folders it owns:** `src/features/authoring/`, `src/app/(app)/questions/`, `src/app/(app)/roster/`, `src/app/(app)/manage/`, `src/app/(app)/marking/`, `src/app/(app)/disputes/`, `tests/smoke/authoring.spec.ts`.
- **Reads from other slices:** `attempts`, `attempt_questions`, `answers`, `incidents`, `memberships`. All seeded: 30 submitted Quiz 1 attempts, Q7's key wrong on purpose.

## Rules both slices keep

1. Every page and action: `requireMember(...)` (or `requireSuperAdmin()`), then filter by `institution_id = member.institution.id`, then `can(...)` for anything finer. A candidate's rows are also filtered by `candidate_id in myCandidateIds(member)`. Hiding a button is not a check.
2. **This replaces the kit's "filter by `user_id`" rule for exam data.** `user_id` on these tables is the account that created the row (for seeded rows, the account the world was seeded for). It exists so a deleted account takes its rows with it. Access never rests on it alone.
3. `answer_key`, `seed` and integrity details never reach a candidate's browser. Select the columns a candidate screen needs; never `select("*")` for them.
4. Time comes from the server. The browser shows a countdown to a deadline the server sent.
5. Saves are idempotent (`answers` is unique per attempt and question; an older `client_seq` never overwrites a newer one). A second submit returns the first receipt.
6. Sandbox attempts (`is_sandbox`) are left out of every grade, result, statistic and analytic.
7. Integrity and connection signals are for review only, worded that way, never a penalty.
8. Fictional Pakistani data only; CNICs shown masked (`35202-•••••••-3`).

## Data shapes

Every table: `id uuid primary key default gen_random_uuid()`, `user_id uuid not null references auth.users on delete cascade`, `created_at timestamptz default now()`. Every table below `institutions` also has `institution_id uuid not null references institutions on delete cascade`. These columns are not repeated in the blocks.

    profiles             written by: shared core     read by: both
      id                 uuid      = auth.users.id (no separate user_id)
      display_name       text
      email              text      lower case, copied at sign-up
      is_super_admin     boolean   platform level; default false

    institutions         written by: delivery (super admin), shared core (sign-up, demo)     read by: both
      name               text      'Ravi Science College, Lahore'
      kind               text      'university' | 'college' | 'board' | 'test_body'
      city               text
      status             text      'active' | 'suspended'

    memberships          written by: delivery (people screens), shared core (sign-up, candidate sync)     read by: both
      member_id          uuid      → auth.users, the person (user_id is who granted it)
      role               text      'institution_admin' | 'examiner' | 'candidate' today; more later
      active             boolean
      unique (institution_id, member_id, role)

    candidates           written by: authoring     read by: delivery
      full_name          text
      roll_number        text      text, so leading zeros survive
      email              text      lower case; matches the candidate's login email
      cnic_masked        text      e.g. 35202-•••••••-3
      extra_time_pct     int       accommodation, 0 by default
      unique (institution_id, roll_number)

    questions            written by: authoring     read by: delivery (via exam_questions)
      topic              text      e.g. 'Kinematics'
      difficulty         text      'easy' | 'medium' | 'hard'
      kind               text      'single' | 'multiple' | 'written'
      body               text
      options            jsonb     [{ id: 'a', text: '...' }]; [] for written
      answer_key         jsonb     ['b'] or ['a','c']; null for written
      marks              int       > 0
      multiple_rule      text      'all_or_nothing' | 'partial' (partial = max(0, (right − wrong) / keyed) × marks)
      rubric             text null marking guide for written
      version            int       +1 on every edit

    exams                written by: authoring     read by: delivery
      title              text
      instructions       text
      opens_at           timestamptz
      closes_at          timestamptz
      duration_minutes   int
      total_marks        int       the checklist compares it with the sum of question marks
      shuffle_questions  boolean
      shuffle_options    boolean
      status             text      'draft' | 'published'; upcoming, open and closed come from examPhase()
      published_at       timestamptz null
      results_published_at timestamptz null
      settings           jsonb     {}; extras keep their switches here (credit cap, balanced papers)

    exam_questions       written by: authoring     read by: delivery
      exam_id            uuid
      question_id        uuid
      position           int
      unique (exam_id, question_id)

    enrollments          written by: authoring     read by: delivery
      exam_id            uuid
      candidate_id       uuid      → candidates
      unique (exam_id, candidate_id)

    attempts             written by: delivery     read by: authoring
      exam_id            uuid
      candidate_id       uuid null null only for a sandbox attempt
      is_sandbox         boolean
      status             text      'in_progress' | 'submitted' | 'auto_submitted'
      seed               int       paper shuffle seed; never sent to the browser
      started_at         timestamptz
      deadline_at        timestamptz started_at + duration (+ extra_time_pct)
      credit_seconds     int       time given back after an outage (extra), 0 by default
      submitted_at       timestamptz null
      receipt_code       text null unique, e.g. 'IMT-7K2Q-9F'
      last_seen_at       timestamptz null  last heartbeat
      unique (exam_id, candidate_id) where not is_sandbox

    attempt_questions    written by: delivery     read by: authoring
      attempt_id         uuid
      question_id        uuid
      position           int       the order this candidate sees
      kind, body, topic, difficulty, marks, multiple_rule, rubric   copied at start
      options            jsonb     in this candidate's order
      answer_key         jsonb     copied at start; never sent to the browser
      unique (attempt_id, question_id)

    answers              written by: delivery     read by: authoring
      attempt_id         uuid
      question_id        uuid
      response           jsonb     { choices: ['b'] } or { text: '...' }
      marked_for_review  boolean
      client_seq         int       higher wins
      saved_offline      boolean   typed while offline, sent later
      received_at        timestamptz server time it arrived
      unique (attempt_id, question_id)

    scratchpads          written by: delivery     read by: delivery only (private to the candidate)
      attempt_id, question_id, body text, updated_at timestamptz
      unique (attempt_id, question_id)

    incidents            written by: delivery     read by: authoring (marking context)
      attempt_id         uuid
      kind               text      'offline' | 'resumed' | 'tab_hidden' | 'paste' | 'late_answer'
      details            jsonb     e.g. { seconds: 40 }
      occurred_at        timestamptz

    announcements        written by: delivery     read by: delivery
      exam_id            uuid
      body               text
      question_position  int null  a correction about one question

    preferences          written by: delivery     read by: delivery
      user_id is the person; unique (user_id), no institution_id
      font_scale         text      'normal' | 'large' | 'larger'
      contrast           text      'normal' | 'high'
      layout             text      'one_at_a_time' | 'all_on_one_page'
      updated_at         timestamptz

    grades               written by: authoring     read by: delivery (result breakdown)
      attempt_id         uuid
      question_id        uuid
      marks_awarded      numeric(6,2)  never above the question's marks
      source             text      'auto' | 'manual'
      feedback           text null
      graded_by          uuid null
      unique (attempt_id, question_id)

    results              written by: authoring     read by: delivery (candidate view, PDF, verify)
      exam_id            uuid
      attempt_id         uuid
      candidate_id       uuid
      version            int       1, then +1 for each regrade after publishing
      total              numeric(6,2)
      max_total          int
      breakdown          jsonb     [{ position, question_id, marks_awarded, marks }]
      reason             text null why this version exists ('Q7 key corrected')
      is_current         boolean
      verify_code        text unique  short public code for the QR
      published_at       timestamptz null  null means the candidate cannot see it

    key_fixes            written by: authoring     read by: delivery (result notes)
      exam_id            uuid
      question_id        uuid
      decision           text      'change_key' | 'accept_both' | 'full_marks' | 'drop'
      old_key            jsonb
      new_key            jsonb null
      reason             text

    disputes             written by: authoring     read by: delivery (status on the result)
      result_id          uuid
      candidate_id       uuid
      question_id        uuid null
      body               text
      status             text      'open' | 'upheld' | 'rejected'
      decision_reason    text null
      decided_by         uuid null
      decided_at         timestamptz null

    audit_events         written by: either slice, only through `@/lib/audit`     read by: both
      actor_id           uuid
      action             text      'exam.published' | 'key.fixed' | 'results.published' | 'role.changed' | ...
      entity_id          uuid null
      payload            jsonb
      prev_hash          text      the previous event's hash in this institution, '' for the first
      hash               text      sha256(prev_hash + action + entity_id + payload)

### Planned additions (extras; add as new tables, no change to the ones above)

- `departments` (name, hod_member_id) and `exams.department_id`.
- `exam_staff` (exam_id, member_id, role: 'setter' | 'moderator' | 'examiner' | 'head_examiner' | 'invigilator'): who works on which exam.
- `approvals` (exam_id, kind: 'paper' | 'results', requested_by, decided_by, decision): moderator and controller sign-off.
- `reports` (reporter, kind: 'problem' | 'objection' | 'complaint' | 'tip', subject, body, status, confidential): candidate reporting and case tracking.
- `committees` (kind: 'unfair_means' | 'grievance', members).

## Sample data

Seeded into every new institution by `src/lib/seed-world.ts`. All names fictional.

- **Roster:** Ayesha Khan (roll 0231, the demo candidate's email) and 30 more Lahore students, CNICs masked, one with 25% extra time. Bilal Ahmed has an account (candidate) in the demo institution.
- **Question bank:** 21 Physics questions across Kinematics, Forces, Energy and Waves; easy, medium and hard; single, multiple and written.
- **Physics Midterm:** draft, open from an hour ago for seven days, 30 minutes, total 50, but its questions add up to 45 (the checklist catches it in step 3). Everyone enrolled.
- **Waves Practice Quiz:** published and open now, 15 minutes, everyone enrolled. Delivery's always-open exam.
- **Physics Quiz 1:** closed yesterday, 30 submitted attempts with answers and no grades yet. Q7's key is C, but most top scorers chose B (the Key Doctor's case). One written question.
- **Physics Pre-test:** closed last week, graded, results published for everyone, verify codes set. Delivery's result data.
