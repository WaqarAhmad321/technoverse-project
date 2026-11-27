-- An examiner's decision on one attempt's integrity signals. Signals are for review, never a penalty.
create table public.integrity_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  exam_id uuid not null references public.exams (id) on delete cascade,
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  candidate_id uuid references public.candidates (id) on delete cascade,
  level text not null,
  reasons jsonb not null default '[]',
  status text not null default 'open',
  decision_note text not null default '',
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (attempt_id)
);

create index integrity_cases_exam on public.integrity_cases (exam_id);
