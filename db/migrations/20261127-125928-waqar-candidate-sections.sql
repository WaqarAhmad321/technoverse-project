-- A class or section on the roster, so an exam can be assigned to a whole section at once.
alter table public.candidates add column section text not null default '';
