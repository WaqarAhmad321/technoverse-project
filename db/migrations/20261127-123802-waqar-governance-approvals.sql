-- Approvals: a controller signs off an exam paper before it publishes, and its results before release.
-- Institutions gain a platform review: pending until the platform admin approves.

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  exam_id uuid not null references public.exams (id) on delete cascade,
  kind text not null,
  status text not null default 'pending',
  requested_by uuid not null references auth.users (id) on delete cascade,
  decided_by uuid references auth.users (id) on delete set null,
  comment text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (exam_id, kind)
);

create index approvals_institution on public.approvals (institution_id, status);

alter table public.institutions
  add column review_note text,
  add column reviewed_at timestamptz;
