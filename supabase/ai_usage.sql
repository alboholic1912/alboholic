-- Run in the Supabase SQL editor, after supabase/schema.sql. Safe to run more than once. Tracks token usage of Studio AI generations.
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  content_type text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_write_tokens integer not null default 0
);

alter table public.ai_usage enable row level security;

-- Only admins can read or write the log. is_admin() comes from supabase/schema.sql, so run that first.
drop policy if exists "Studio users can read AI usage" on public.ai_usage;
create policy "Studio users can read AI usage"
  on public.ai_usage for select using (public.is_admin());

drop policy if exists "Studio users can log AI usage" on public.ai_usage;
create policy "Studio users can log AI usage"
  on public.ai_usage for insert with check (public.is_admin());
