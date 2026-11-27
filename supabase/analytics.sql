-- Visitor analytics, kept in our own database instead of a third-party service.
-- Run in the Supabase SQL editor, after supabase/schema.sql. Safe to run more than once.
--
-- How it stays cookieless and anonymous:
--   * The reader's browser stores nothing. Each page view sends a small message to /api/p.
--   * The IP address is never stored. It is mixed with the browser name and a random secret
--     that is replaced every day (analytics_salts), and only the scrambled result is kept.
--     The same reader therefore gets a different code tomorrow, and nobody, including us,
--     can turn the code back into an address once the day's secret is deleted.
--   * Location is the town Vercel's network guesses from the address (city-level, never a
--     street), rounded to about a kilometre.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.page_views (
  -- Made by the reader's browser for this one page view, so later updates (time spent,
  -- how far they scrolled) can find the row. Random, so it can't be guessed.
  id uuid primary key,
  created_at timestamptz not null default now(),
  -- Updated while the page stays open. "Live" visitors are the ones seen in the last minute.
  last_seen_at timestamptz not null default now(),
  -- The day's scrambled code for this reader (see above). Not a person: it changes daily.
  visitor text not null,
  path text not null,
  -- The battle opened on the Battles map (/battles?battle=...), if any.
  battle text,
  -- Where the reader came from: "Instagram", "Google", "Direct", or the referring site.
  source text not null default 'Direct',
  referrer text,
  utm_campaign text,
  country text,
  region text,
  city text,
  lat real,
  lng real,
  device text,
  browser text,
  os text,
  -- Seconds the page was actually on screen (paused while the tab is in the background).
  seconds integer not null default 0,
  -- How far down the page the reader got, 0 to 100.
  scroll smallint not null default 0
);

create index if not exists page_views_created_at_idx on public.page_views (created_at);
create index if not exists page_views_last_seen_at_idx on public.page_views (last_seen_at);
create index if not exists page_views_visitor_idx on public.page_views (visitor, created_at);

alter table public.page_views enable row level security;

-- Only admins can read or clear the log. Readers write through the functions below.
drop policy if exists "Admin read page views" on public.page_views;
create policy "Admin read page views" on public.page_views
  for select using ((select public.is_admin()));

drop policy if exists "Admin delete page views" on public.page_views;
create policy "Admin delete page views" on public.page_views
  for delete using ((select public.is_admin()));

-- The daily secrets. No policies on purpose: only the functions below can see them, and
-- yesterday's is deleted as soon as a new day starts.
create table if not exists public.analytics_salts (
  day date primary key,
  salt text not null
);

alter table public.analytics_salts enable row level security;

-- ---------------------------------------------------------------------------
-- Recording (called by the site's /api/p route with the public key)
-- ---------------------------------------------------------------------------

create or replace function public.analytics_record_view(
  p_id uuid,
  p_ip text,
  p_user_agent text,
  p_path text,
  p_battle text,
  p_source text,
  p_referrer text,
  p_utm_campaign text,
  p_country text,
  p_region text,
  p_city text,
  p_lat real,
  p_lng real,
  p_device text,
  p_browser text,
  p_os text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  v_new_day date;
  v_salt text;
  v_visitor text;
begin
  if p_id is null or p_path is null or left(p_path, 1) <> '/' then
    return;
  end if;

  insert into public.analytics_salts (day, salt)
  values (v_day, encode(extensions.gen_random_bytes(32), 'hex'))
  on conflict (day) do nothing
  returning day into v_new_day;

  -- The first view of a new day throws away yesterday's secret, and page views older than
  -- two years (the privacy page promises both).
  if v_new_day is not null then
    delete from public.analytics_salts where day < v_day;
    delete from public.page_views where created_at < now() - interval '2 years';
  end if;

  select salt into v_salt from public.analytics_salts where day = v_day;

  v_visitor := left(
    encode(
      extensions.digest(v_salt || '|' || coalesce(p_ip, '') || '|' || coalesce(p_user_agent, ''), 'sha256'),
      'hex'
    ),
    20
  );

  -- Flood protection: one reader can't log more than 60 page views a minute.
  if (
    select count(*) from public.page_views
    where visitor = v_visitor and created_at > now() - interval '1 minute'
  ) >= 60 then
    return;
  end if;

  insert into public.page_views (
    id, visitor, path, battle, source, referrer, utm_campaign,
    country, region, city, lat, lng, device, browser, os
  )
  values (
    p_id,
    v_visitor,
    left(p_path, 300),
    left(nullif(p_battle, ''), 120),
    left(coalesce(nullif(p_source, ''), 'Direct'), 80),
    left(nullif(p_referrer, ''), 200),
    left(nullif(p_utm_campaign, ''), 120),
    left(nullif(p_country, ''), 2),
    left(nullif(p_region, ''), 80),
    left(nullif(p_city, ''), 80),
    case when p_lat between -90 and 90 then round(p_lat::numeric, 2)::real end,
    case when p_lng between -180 and 180 then round(p_lng::numeric, 2)::real end,
    left(nullif(p_device, ''), 20),
    left(nullif(p_browser, ''), 40),
    left(nullif(p_os, ''), 40)
  )
  on conflict (id) do nothing;
end;
$$;

-- Time spent and scroll depth only ever go up, and only on a view from the last few hours.
create or replace function public.analytics_record_ping(p_id uuid, p_seconds integer, p_scroll integer)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.page_views
  set
    seconds = greatest(seconds, least(greatest(coalesce(p_seconds, 0), 0), 14400)),
    scroll = greatest(scroll, least(greatest(coalesce(p_scroll, 0), 0), 100)),
    last_seen_at = now()
  where id = p_id
    and created_at > now() - interval '6 hours';
$$;

revoke all on function public.analytics_record_view(
  uuid, text, text, text, text, text, text, text, text, text, text, real, real, text, text, text
) from public;
grant execute on function public.analytics_record_view(
  uuid, text, text, text, text, text, text, text, text, text, text, real, real, text, text, text
) to anon, authenticated;

revoke all on function public.analytics_record_ping(uuid, integer, integer) from public;
grant execute on function public.analytics_record_ping(uuid, integer, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reports (Studio only)
-- ---------------------------------------------------------------------------

-- The start of a range, in the viewer's time zone: the last 24 hours, or the last 7 or 30
-- calendar days including today.
create or replace function public.analytics_range_start(p_range text, p_tz text)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select case p_range
    when '24h' then date_trunc('hour', now()) - interval '23 hours'
    when '7d' then (date_trunc('day', now() at time zone p_tz) - interval '6 days') at time zone p_tz
    else (date_trunc('day', now() at time zone p_tz) - interval '29 days') at time zone p_tz
  end;
$$;

create or replace function public.analytics_safe_tz(p_tz text)
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce((select name from pg_catalog.pg_timezone_names where name = p_tz limit 1), 'UTC');
$$;

-- Visitors and page views for the last 24 hours, 7 days and 30 days, each with the period
-- before it for comparison, plus who is on the site right now.
create or replace function public.analytics_overview(p_tz text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text := public.analytics_safe_tz(p_tz);
  v_result jsonb := '{}'::jsonb;
  v_range text;
  v_since timestamptz;
  v_prev timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  foreach v_range in array array['24h', '7d', '30d'] loop
    v_since := public.analytics_range_start(v_range, v_tz);
    v_prev := v_since - (now() - v_since);
    v_result := v_result || jsonb_build_object(
      v_range,
      (
        select jsonb_build_object(
          'visitors', count(distinct visitor) filter (where created_at >= v_since),
          'views', count(*) filter (where created_at >= v_since),
          'prevVisitors', count(distinct visitor) filter (where created_at < v_since),
          'prevViews', count(*) filter (where created_at < v_since)
        )
        from public.page_views
        where created_at >= v_prev
      )
    );
  end loop;

  return v_result || jsonb_build_object(
    'live',
    (select count(distinct visitor) from public.page_views where last_seen_at > now() - interval '1 minute')
  );
end;
$$;

-- Everything the Analytics page shows for one range.
create or replace function public.analytics_report(p_range text, p_tz text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text := public.analytics_safe_tz(p_tz);
  v_range text := case when p_range in ('24h', '7d', '30d') then p_range else '7d' end;
  v_since timestamptz;
  v_prev timestamptz;
  v_step interval;
  v_unit text;
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  v_since := public.analytics_range_start(v_range, v_tz);
  v_prev := v_since - (now() - v_since);
  v_step := case when v_range = '24h' then interval '1 hour' else interval '1 day' end;
  v_unit := case when v_range = '24h' then 'hour' else 'day' end;

  return (
    with
    views as (
      select *, date_trunc(v_unit, created_at at time zone v_tz) as bucket
      from public.page_views
      where created_at >= v_since
    ),
    -- One row per reader per day: their first page decides where they came from.
    visits as (
      select
        visitor,
        count(*) as views,
        sum(seconds) as seconds,
        (array_agg(source order by created_at))[1] as source,
        (array_agg(path order by created_at))[1] as landing
      from views
      group by visitor
    ),
    prev_visits as (
      select visitor, count(*) as views, sum(seconds) as seconds
      from public.page_views
      where created_at >= v_prev and created_at < v_since
      group by visitor
    ),
    buckets as (
      select generate_series(
        date_trunc(v_unit, v_since at time zone v_tz),
        date_trunc(v_unit, now() at time zone v_tz),
        v_step
      ) as bucket
    )
    select jsonb_build_object(
      'range', v_range,
      'tz', v_tz,
      'since', v_since,
      'totals', (
        select jsonb_build_object(
          'visitors', count(*),
          'views', coalesce(sum(views), 0),
          'avgVisitSeconds', coalesce(round(avg(seconds)), 0),
          'bounceRate', coalesce(round(100.0 * count(*) filter (where views = 1) / nullif(count(*), 0)), 0),
          'viewsPerVisitor', coalesce(round(avg(views), 2), 0)
        )
        from visits
      ),
      'prevTotals', (
        select jsonb_build_object(
          'visitors', count(*),
          'views', coalesce(sum(views), 0),
          'avgVisitSeconds', coalesce(round(avg(seconds)), 0),
          'bounceRate', coalesce(round(100.0 * count(*) filter (where views = 1) / nullif(count(*), 0)), 0),
          'viewsPerVisitor', coalesce(round(avg(views), 2), 0)
        )
        from prev_visits
      ),
      'series', (
        select coalesce(jsonb_agg(jsonb_build_object(
          't', to_char(b.bucket, 'YYYY-MM-DD"T"HH24:MI:SS'),
          'visitors', coalesce(s.visitors, 0),
          'views', coalesce(s.views, 0)
        ) order by b.bucket), '[]'::jsonb)
        from buckets b
        left join (
          select bucket, count(distinct visitor) as visitors, count(*) as views
          from views group by bucket
        ) s using (bucket)
      ),
      'pages', (
        select coalesce(jsonb_agg(p order by p.views desc), '[]'::jsonb)
        from (
          select
            path,
            count(*) as views,
            count(distinct visitor) as visitors,
            round(avg(seconds)) as "avgSeconds",
            round(avg(scroll)) as "avgScroll"
          from views
          group by path
          order by count(*) desc
          limit 15
        ) p
      ),
      'landing', (
        select coalesce(jsonb_agg(l order by l.visitors desc), '[]'::jsonb)
        from (
          select landing as path, count(*) as visitors
          from visits group by landing order by count(*) desc limit 8
        ) l
      ),
      'battles', (
        select coalesce(jsonb_agg(b order by b.views desc), '[]'::jsonb)
        from (
          select battle as slug, count(*) as views, count(distinct visitor) as visitors
          from views where battle is not null
          group by battle order by count(*) desc limit 8
        ) b
      ),
      'sources', (
        select coalesce(jsonb_agg(s order by s.visitors desc), '[]'::jsonb)
        from (
          select source as name, count(*) as visitors, sum(views) as views
          from visits group by source order by count(*) desc limit 10
        ) s
      ),
      'campaigns', (
        select coalesce(jsonb_agg(c order by c.visitors desc), '[]'::jsonb)
        from (
          select utm_campaign as name, count(distinct visitor) as visitors
          from views where utm_campaign is not null
          group by utm_campaign order by count(distinct visitor) desc limit 8
        ) c
      ),
      'countries', (
        select coalesce(jsonb_agg(c order by c.visitors desc), '[]'::jsonb)
        from (
          select country as code, count(distinct visitor) as visitors, count(*) as views
          from views where country is not null
          group by country order by count(distinct visitor) desc limit 20
        ) c
      ),
      'cities', (
        select coalesce(jsonb_agg(c order by c.visitors desc), '[]'::jsonb)
        from (
          select
            city as name, country, avg(lat)::real as lat, avg(lng)::real as lng,
            count(distinct visitor) as visitors, count(*) as views
          from views where city is not null and lat is not null
          group by city, country order by count(distinct visitor) desc limit 200
        ) c
      ),
      'unknownLocation', (select count(distinct visitor) from views where lat is null),
      'devices', (
        select coalesce(jsonb_agg(d order by d.visitors desc), '[]'::jsonb)
        from (
          select coalesce(device, 'Unknown') as name, count(distinct visitor) as visitors
          from views group by 1 order by 2 desc
        ) d
      ),
      'browsers', (
        select coalesce(jsonb_agg(d order by d.visitors desc), '[]'::jsonb)
        from (
          select coalesce(browser, 'Other') as name, count(distinct visitor) as visitors
          from views group by 1 order by 2 desc limit 8
        ) d
      ),
      'os', (
        select coalesce(jsonb_agg(d order by d.visitors desc), '[]'::jsonb)
        from (
          select coalesce(os, 'Other') as name, count(distinct visitor) as visitors
          from views group by 1 order by 2 desc limit 8
        ) d
      ),
      -- When people read: page views by weekday (1 = Monday) and hour, in the viewer's time zone.
      'heat', (
        select coalesce(jsonb_agg(h), '[]'::jsonb)
        from (
          select
            extract(isodow from created_at at time zone v_tz)::int as dow,
            extract(hour from created_at at time zone v_tz)::int as hour,
            count(*) as views
          from views group by 1, 2
        ) h
      )
    )
  );
end;
$$;

-- Who is on the site right now, and the latest page views as they happen.
create or replace function public.analytics_live()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'now', now(),
    'online', (
      select coalesce(jsonb_agg(o order by o."lastSeen" desc), '[]'::jsonb)
      from (
        select distinct on (visitor)
          visitor as id, path, battle, source, city, country, lat, lng, device, browser,
          seconds, scroll, created_at as "startedAt", last_seen_at as "lastSeen"
        from public.page_views
        where last_seen_at > now() - interval '1 minute'
        order by visitor, last_seen_at desc
      ) o
    ),
    'recent', (
      select coalesce(jsonb_agg(r order by r."at" desc), '[]'::jsonb)
      from (
        select
          id, path, battle, source, city, country, device, browser, os, seconds, scroll,
          created_at as "at", last_seen_at as "lastSeen"
        from public.page_views
        order by created_at desc
        limit 30
      ) r
    ),
    -- Page views per minute over the last half hour, oldest first.
    'perMinute', (
      select coalesce(jsonb_agg(coalesce(c.views, 0) order by m.minute), '[]'::jsonb)
      from generate_series(
        date_trunc('minute', now()) - interval '29 minutes',
        date_trunc('minute', now()),
        interval '1 minute'
      ) as m(minute)
      left join (
        select date_trunc('minute', created_at) as minute, count(*) as views
        from public.page_views
        where created_at > now() - interval '30 minutes'
        group by 1
      ) c using (minute)
    )
  );
end;
$$;

revoke all on function public.analytics_range_start(text, text) from public;
revoke all on function public.analytics_safe_tz(text) from public;
revoke all on function public.analytics_overview(text) from public;
revoke all on function public.analytics_report(text, text) from public;
revoke all on function public.analytics_live() from public;
grant execute on function public.analytics_overview(text) to authenticated;
grant execute on function public.analytics_report(text, text) to authenticated;
grant execute on function public.analytics_live() to authenticated;
