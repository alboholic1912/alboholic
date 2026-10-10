-- Alboholic content schema.
-- Safe to run multiple times (idempotent) — paste this whole file into the
-- Supabase SQL Editor (Database > SQL Editor) any time it changes.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Content tables
-- ---------------------------------------------------------------------------

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category text not null default '',
  title text not null default '',
  excerpt text not null default '',
  body text[] not null default '{}',
  date date not null default now(),
  read_time text not null default '',
  image_tone text not null default 'stone' check (image_tone in ('crimson', 'amber', 'stone', 'slate')),
  image text,
  ai_image boolean not null default true,
  credit text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null default '',
  role text not null default '',
  era text not null default '',
  bio text,
  image text,
  image_tone text not null default 'stone' check (image_tone in ('crimson', 'amber', 'stone', 'slate')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Person profile columns: everything the public profile page shows beyond the basics.
-- `bio` is the short introduction under the name; `citations` are the public references
-- (the `sources` column below records what the Studio generated the entry from).
alter table people
  add column if not exists category text not null default '',
  add column if not exists pronoun text not null default 'they' check (pronoun in ('he', 'she', 'they')),
  add column if not exists birthplace text not null default '',
  add column if not exists known_for text not null default '',
  add column if not exists facts jsonb not null default '[]',
  add column if not exists significance jsonb not null default '[]',
  add column if not exists timeline jsonb not null default '[]',
  add column if not exists related_stories text[] not null default '{}',
  add column if not exists related_people jsonb not null default '[]',
  add column if not exists related_places jsonb not null default '[]',
  add column if not exists citations jsonb not null default '[]';

-- Battles: one pin each on the Battles map. `lat`/`lng` stay null until a pin is placed, and
-- a battle without them is never shown. `pin_note` records how the pin was placed, for editors.
create table if not exists battles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null default '',
  period text not null default '',
  date text not null default '',
  year integer not null default 0,
  location text not null default '',
  lat double precision,
  lng double precision,
  pin_note text not null default '',
  participants text not null default '',
  summary text not null default '',
  outcome text not null default '',
  key_people jsonb not null default '[]',
  details jsonb not null default '[]',
  story_slug text not null default '',
  citations jsonb not null default '[]',
  image text,
  ai_image boolean not null default false,
  image_tone text not null default 'stone' check (image_tone in ('crimson', 'amber', 'stone', 'slate')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Editorial workflow columns, added to every content table.
do $$
begin
  execute (
    select string_agg(
      format(
        $ddl$
          alter table %I
            add column if not exists status text not null default 'review'
              check (status in ('review', 'published'));
          alter table %I add column if not exists sources jsonb not null default '[]';
        $ddl$,
        tbl, tbl
      ),
      ''
    )
    from unnest(array['stories', 'people', 'battles']) as tbl
  );
end $$;

-- Drop the old published boolean now that `status` replaces it (no-op if absent).
alter table stories drop column if exists published;

-- The language a story is written in, so browsers and screen readers handle Albanian text properly.
alter table stories
  add column if not exists lang text not null default 'en' check (lang in ('en', 'sq'));

-- ---------------------------------------------------------------------------
-- Ideas / planning board — internal only, never shown on the public site.
-- ---------------------------------------------------------------------------

create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text not null default '',
  kind text not null default 'story' check (kind in ('story', 'person', 'battle')),
  sources text not null default '',
  status text not null default 'idea' check (status in ('idea', 'planned', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Admins — the only accounts allowed into the Studio or to write anything.
-- Being signed in is not enough: the account has to be listed here.
-- ---------------------------------------------------------------------------

create table if not exists admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- No policies on purpose: the list is only reachable through is_admin() and the SQL editor.
alter table admins enable row level security;

-- The first time this runs, the oldest account (the one that set the project up) becomes
-- the admin. Check the result under Table Editor > admins. To add another editor later:
--   insert into admins (user_id) select id from auth.users where email = 'someone@example.com';
insert into admins (user_id)
select id from auth.users
where not exists (select 1 from admins)
order by created_at asc
limit 1;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table stories enable row level security;
alter table people enable row level security;
alter table battles enable row level security;
alter table ideas enable row level security;

do $$
begin
  execute (
    select string_agg(
      format(
        $ddl$
          drop policy if exists "Public read published %1$s" on %1$I;
          create policy "Public read published %1$s" on %1$I
            for select using (status = 'published');

          drop policy if exists "Admin read all %1$s" on %1$I;
          create policy "Admin read all %1$s" on %1$I
            for select using (public.is_admin());

          drop policy if exists "Admin write %1$s" on %1$I;
          create policy "Admin write %1$s" on %1$I
            for all using (public.is_admin()) with check (public.is_admin());
        $ddl$,
        tbl
      ),
      ''
    )
    from unnest(array['stories', 'people', 'battles']) as tbl
  );
end $$;

-- Ideas are never public — admin only, in and out.
drop policy if exists "Admin only ideas" on ideas;
create policy "Admin only ideas" on ideas
  for all using (public.is_admin()) with check (public.is_admin());

-- AI usage log (created by supabase/ai_usage.sql, so it may not exist yet).
do $$
begin
  if to_regclass('public.ai_usage') is not null then
    drop policy if exists "Studio users can read AI usage" on public.ai_usage;
    create policy "Studio users can read AI usage"
      on public.ai_usage for select using (public.is_admin());

    drop policy if exists "Studio users can log AI usage" on public.ai_usage;
    create policy "Studio users can log AI usage"
      on public.ai_usage for insert with check (public.is_admin());
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Newsletter subscribers. Anyone may add an address; only admins can read the list.
-- ---------------------------------------------------------------------------

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null
    check (char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  created_at timestamptz not null default now()
);

alter table subscribers enable row level security;

drop policy if exists "Anyone can subscribe" on subscribers;
create policy "Anyone can subscribe" on subscribers
  for insert with check (true);

drop policy if exists "Admin read subscribers" on subscribers;
create policy "Admin read subscribers" on subscribers
  for select using (public.is_admin());

drop policy if exists "Admin delete subscribers" on subscribers;
create policy "Admin delete subscribers" on subscribers
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded images (featured images, person portraits, etc).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "Public read media" on storage.objects;
create policy "Public read media" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "Admin write media" on storage.objects;
create policy "Admin write media" on storage.objects
  for all using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());
