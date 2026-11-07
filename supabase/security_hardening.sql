-- Security hardening (November 2026). Safe to run more than once.
-- Paste into the Supabase SQL editor and run. supabase/schema.sql includes the same changes.

-- 1. Newsletter flood protection -------------------------------------------------------------
-- Signups can reach the subscribers table directly with the public key, so the limit lives in
-- the database: at most 20 new addresses in any 10 minutes, site-wide. Real readers never get
-- near it; a bot filling the list with fake addresses is stopped.

create index if not exists subscribers_created_at_idx on public.subscribers (created_at);

create or replace function public.throttle_subscribers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.subscribers where created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'Too many signups right now' using errcode = 'TH429';
  end if;
  return new;
end;
$$;

revoke all on function public.throttle_subscribers() from public;

drop trigger if exists throttle_subscribers on public.subscribers;
create trigger throttle_subscribers
  before insert on public.subscribers
  for each row execute function public.throttle_subscribers();

-- 2. Stop anyone listing the image files ------------------------------------------------------
-- The media bucket is public, so images load by their address without any policy. This policy
-- only let anyone list every file name, including images for unpublished drafts. Admins keep
-- full access through "Admin write media".

drop policy if exists "Public read media" on storage.objects;
