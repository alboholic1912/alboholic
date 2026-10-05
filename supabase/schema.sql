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
    from unnest(array['stories', 'people']) as tbl
  );
end $$;

-- Drop the old published boolean now that `status` replaces it (no-op if absent).
alter table stories drop column if exists published;

-- ---------------------------------------------------------------------------
-- Ideas / planning board — internal only, never shown on the public site.
-- ---------------------------------------------------------------------------

create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text not null default '',
  status text not null default 'idea' check (status in ('idea', 'planned', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table stories enable row level security;
alter table people enable row level security;
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
            for select using (auth.uid() is not null);

          drop policy if exists "Admin write %1$s" on %1$I;
          create policy "Admin write %1$s" on %1$I
            for all using (auth.uid() is not null) with check (auth.uid() is not null);
        $ddl$,
        tbl
      ),
      ''
    )
    from unnest(array['stories', 'people']) as tbl
  );
end $$;

-- Ideas are never public — admin only, in and out.
drop policy if exists "Admin only ideas" on ideas;
create policy "Admin only ideas" on ideas
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

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
  for all using (bucket_id = 'media' and auth.uid() is not null)
  with check (bucket_id = 'media' and auth.uid() is not null);
