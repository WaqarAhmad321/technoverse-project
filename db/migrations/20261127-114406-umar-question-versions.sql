-- AI-written versions of a question, and which version each candidate's paper got (null = the original).
alter table public.questions add column variants jsonb not null default '[]';
alter table public.attempt_questions add column variant_key text;
