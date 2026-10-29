-- Run in the Supabase SQL editor, after supabase/schema.sql. Safe to run more than once.
-- One row per AI image request from the Studio: the reference image, the prompt, and how it went.
-- Kept apart from the content tables so prompts and references are never readable by the public.
create table if not exists public.image_generations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  content_type text not null check (content_type in ('stories', 'people', 'battles')),
  content_id uuid not null,
  mode text not null check (mode in ('recreation', 'restoration')),
  prompt text not null,
  -- Claude's short visual description of the scene, written from the sources with the content.
  brief text not null default '',
  -- Path inside the `media` bucket.
  reference_path text not null,
  status text not null default 'pending' check (status in ('pending', 'generating', 'done', 'failed')),
  error text,
  image text
);

-- The OpenAI model chosen in the Studio. Rows from before the picker all used gpt-image-2.
alter table public.image_generations
  add column if not exists model text not null default 'gpt-image-2';

create index if not exists image_generations_content_idx
  on public.image_generations (content_type, content_id, created_at desc);

alter table public.image_generations enable row level security;

-- Only admins can read or write. is_admin() comes from supabase/schema.sql, so run that first.
drop policy if exists "Studio users manage image generations" on public.image_generations;
create policy "Studio users manage image generations"
  on public.image_generations for all using (public.is_admin()) with check (public.is_admin());
