-- Ramit's Consulting Cortex - Phase 1 schema.
-- Run this in Supabase -> SQL Editor (admin op; not via an AI session).

create table if not exists public.cases (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  user_id       uuid,                 -- null until Auth (Phase 5)
  type          text,                 -- 'bookmark' | 'evaluation' | 'comparison' | 'question'
  title         text,
  industry_slug text,
  question      text,
  content       jsonb,
  score         numeric
);

alter table public.cases enable row level security;

-- Phase 1 (single-user): permissive policy so the public/anon key can read + write.
-- TIGHTEN in Phase 5 (Auth): replace the USING/CHECK with  (auth.uid() = user_id).
drop policy if exists "cortex_open_access" on public.cases;
create policy "cortex_open_access" on public.cases
  for all
  to anon, authenticated
  using (true)
  with check (true);
