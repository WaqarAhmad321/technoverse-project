-- Run this once in the Supabase SQL editor of a new project. Running it again is safe.
-- It lets `scripts/db push` apply the files in db/migrations with the secret key, over HTTPS.

create table if not exists public.hack_migrations (
  name text primary key,
  checksum text not null,
  applied_at timestamptz not null default now()
);
alter table public.hack_migrations enable row level security;

create or replace function public.hack_apply_migration(migration_name text, migration_sql text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_checksum text := md5(migration_sql);
  old_checksum text;
  unprotected_table regclass;
begin
  -- Two laptops may push the same file at the same moment. The lock makes the second one wait and then skip.
  perform pg_advisory_xact_lock(hashtext('hack_apply_migration'));

  select checksum into old_checksum from public.hack_migrations where name = migration_name;
  if found then
    return case when old_checksum = new_checksum then 'unchanged' else 'changed' end;
  end if;

  execute migration_sql;

  -- New tables are closed to the public API keys and open to the server's secret key.
  for unprotected_table in
    select c.oid::regclass
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
  loop
    execute format('alter table %s enable row level security', unprotected_table);
  end loop;

  grant all on all tables in schema public to service_role;
  grant all on all sequences in schema public to service_role;
  grant execute on all functions in schema public to service_role;

  insert into public.hack_migrations (name, checksum) values (migration_name, new_checksum);
  notify pgrst, 'reload schema';
  return 'applied';
end;
$$;

revoke all on function public.hack_apply_migration(text, text) from public, anon, authenticated;
grant execute on function public.hack_apply_migration(text, text) to service_role;
grant all on table public.hack_migrations to service_role;

notify pgrst, 'reload schema';
