-- Ideas board v2: each idea says what it is for (story / person / battle),
-- keeps a list of sources, and moves through idea -> planned -> done.
-- Safe to run more than once. Run in the Supabase SQL editor.

alter table ideas add column if not exists kind text not null default 'story';
alter table ideas add column if not exists sources text not null default '';

alter table ideas drop constraint if exists ideas_status_check;
update ideas set status = 'done' where status = 'archived';
alter table ideas add constraint ideas_status_check
  check (status in ('idea', 'planned', 'done'));

alter table ideas drop constraint if exists ideas_kind_check;
alter table ideas add constraint ideas_kind_check
  check (kind in ('story', 'person', 'battle'));
