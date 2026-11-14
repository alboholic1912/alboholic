-- Instagram posts from the Studio. Run in the Supabase SQL editor, after supabase/schema.sql.
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- The connected Instagram account. One row only. The access token never leaves the server.
-- ---------------------------------------------------------------------------

create table if not exists public.instagram_account (
  id integer primary key default 1 check (id = 1),
  ig_user_id text not null,
  username text not null default '',
  access_token text not null,
  token_refreshed_at timestamptz not null default now(),
  token_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.instagram_account enable row level security;

drop policy if exists "Admin manage instagram account" on public.instagram_account;
create policy "Admin manage instagram account" on public.instagram_account
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Posts: drafts, scheduled posts and what was published.
-- `images` is an ordered list of { path, url, tags: [username], alt }.
-- ---------------------------------------------------------------------------

create table if not exists public.instagram_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The story, person or battle this post promotes. Both empty for a stand-alone post.
  content_type text check (content_type in ('stories', 'people', 'battles')),
  content_id uuid,
  caption text not null default '' check (char_length(caption) <= 2200),
  location_id text not null default '',
  location_name text not null default '',
  aspect text not null default 'portrait' check (aspect in ('portrait', 'square', 'landscape')),
  images jsonb not null default '[]',
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  ig_media_id text,
  permalink text,
  error text,
  attempts integer not null default 0
);

create index if not exists instagram_posts_content_idx
  on public.instagram_posts (content_type, content_id, created_at desc);
create index if not exists instagram_posts_due_idx
  on public.instagram_posts (scheduled_at) where status = 'scheduled';

alter table public.instagram_posts enable row level security;

drop policy if exists "Admin manage instagram posts" on public.instagram_posts;
create policy "Admin manage instagram posts" on public.instagram_posts
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Scheduler: every 5 minutes, ask the site to publish posts that are due.
-- This works on any Vercel plan (Vercel's own cron runs only once a day on Hobby).
--
-- Fill in the two values below, then run this block once on its own:
--   YOUR_SITE   the live address, e.g. https://alboholic.com
--   YOUR_SECRET the same value as CRON_SECRET in the Vercel environment variables
-- ---------------------------------------------------------------------------

-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
--
-- select cron.unschedule('instagram-publish')
-- where exists (select 1 from cron.job where jobname = 'instagram-publish');
--
-- select cron.schedule(
--   'instagram-publish',
--   '*/5 * * * *',
--   $$
--     select net.http_get(
--       url := 'YOUR_SITE/api/instagram/cron',
--       headers := jsonb_build_object('Authorization', 'Bearer YOUR_SECRET'),
--       timeout_milliseconds := 60000
--     );
--   $$
-- );
