-- Run once in the Supabase SQL editor. Tracks token usage of Studio AI generations.
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

create policy "Studio users can read AI usage"
  on public.ai_usage for select to authenticated using (true);

create policy "Studio users can log AI usage"
  on public.ai_usage for insert to authenticated with check (true);
