-- The AI's blind second marking of one written answer. Advisory only: grades stay the final mark.
create table public.ai_marks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id uuid not null,
  marks_awarded numeric(6,2) not null,
  lines jsonb not null default '[]',
  summary text not null default '',
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);
