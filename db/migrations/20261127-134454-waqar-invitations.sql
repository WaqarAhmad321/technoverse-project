-- Admin invitations: a person is invited by email and joins on their next sign-in or sign-up.
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  email text not null,
  role text not null,
  status text not null default 'pending',
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (institution_id, email, role)
);

create index invitations_email on public.invitations (email) where status = 'pending';

-- Staff ask to join an institution; its admin approves or declines.
create table public.join_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  member_id uuid not null references auth.users (id) on delete cascade,
  role_requested text not null,
  note text not null default '',
  status text not null default 'pending',
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index join_requests_institution on public.join_requests (institution_id, status);
create index join_requests_member on public.join_requests (member_id);
