-- Imtihaan's shared data: institutions, memberships and every exam table from hack/architecture.md.

alter table public.profiles
  add column email text not null default '',
  add column is_super_admin boolean not null default false;

create index profiles_email on public.profiles (email);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null default 'college',
  city text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  member_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (institution_id, member_id, role)
);

create index memberships_member on public.memberships (member_id);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  full_name text not null,
  roll_number text not null,
  email text not null,
  cnic_masked text not null default '',
  extra_time_pct int not null default 0 check (extra_time_pct between 0 and 100),
  created_at timestamptz not null default now(),
  unique (institution_id, roll_number)
);

create index candidates_email on public.candidates (email);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  topic text not null,
  difficulty text not null,
  kind text not null,
  body text not null,
  options jsonb not null default '[]',
  answer_key jsonb,
  marks int not null check (marks > 0),
  multiple_rule text not null default 'partial',
  rubric text,
  version int not null default 1,
  created_at timestamptz not null default now()
);

create index questions_institution on public.questions (institution_id);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  title text not null,
  instructions text not null default '',
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  duration_minutes int not null check (duration_minutes > 0),
  total_marks int not null check (total_marks > 0),
  shuffle_questions boolean not null default true,
  shuffle_options boolean not null default false,
  status text not null default 'draft',
  published_at timestamptz,
  results_published_at timestamptz,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index exams_institution on public.exams (institution_id);

create table public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  exam_id uuid not null references public.exams (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  position int not null,
  created_at timestamptz not null default now(),
  unique (exam_id, question_id)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  exam_id uuid not null references public.exams (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (exam_id, candidate_id)
);

create index enrollments_candidate on public.enrollments (candidate_id);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  exam_id uuid not null references public.exams (id) on delete cascade,
  candidate_id uuid references public.candidates (id) on delete cascade,
  is_sandbox boolean not null default false,
  status text not null default 'in_progress',
  seed int not null,
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  credit_seconds int not null default 0,
  submitted_at timestamptz,
  receipt_code text unique,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index attempts_one_real_per_candidate on public.attempts (exam_id, candidate_id) where not is_sandbox;
create index attempts_exam on public.attempts (exam_id);

-- Snapshot rows keep no foreign key to questions: a paper must survive the bank changing.
create table public.attempt_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id uuid not null,
  position int not null,
  kind text not null,
  body text not null,
  topic text not null,
  difficulty text not null,
  marks int not null,
  multiple_rule text not null,
  rubric text,
  options jsonb not null default '[]',
  answer_key jsonb,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id uuid not null,
  response jsonb not null default '{}',
  marked_for_review boolean not null default false,
  client_seq int not null default 0,
  saved_offline boolean not null default false,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table public.scratchpads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id uuid not null,
  body text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  kind text not null,
  details jsonb not null default '{}',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index incidents_attempt on public.incidents (attempt_id);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  exam_id uuid not null references public.exams (id) on delete cascade,
  body text not null,
  question_position int,
  created_at timestamptz not null default now()
);

create table public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  font_scale text not null default 'normal',
  contrast text not null default 'normal',
  layout text not null default 'one_at_a_time',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id uuid not null,
  marks_awarded numeric(6, 2) not null check (marks_awarded >= 0),
  source text not null,
  feedback text,
  graded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  exam_id uuid not null references public.exams (id) on delete cascade,
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  version int not null default 1,
  total numeric(6, 2) not null,
  max_total int not null,
  breakdown jsonb not null default '[]',
  reason text,
  is_current boolean not null default true,
  verify_code text not null unique,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (attempt_id, version)
);

create index results_candidate on public.results (candidate_id);

create table public.key_fixes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  exam_id uuid not null references public.exams (id) on delete cascade,
  question_id uuid not null,
  decision text not null,
  old_key jsonb,
  new_key jsonb,
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  result_id uuid not null references public.results (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  question_id uuid,
  body text not null,
  status text not null default 'open',
  decision_reason text,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

-- One event per previous hash and institution, so two racing writers cannot fork the chain.
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  actor_id uuid not null,
  action text not null,
  entity_id uuid,
  payload jsonb not null default '{}',
  prev_hash text not null,
  hash text not null,
  created_at timestamptz not null default now(),
  unique (institution_id, prev_hash)
);
