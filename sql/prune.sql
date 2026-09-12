-- Prune scores.
--
-- Paste the whole file into Supabase's SQL Editor. Safe to run repeatedly.
--
-- Why: the board only ever reads the best row per device; everything else is
-- history. At peak this table took half a million rows a day, which fills the
-- free tier's 500MB in under three days — and a full project goes read-only,
-- at which point players cannot submit at all. So history becomes statistics
-- and only the rows that matter stay.
--
-- This deletes data. What you actually care about (plays and players per day)
-- is written to a stats table first, and that part is never deleted.


-- ══════════════════════════════════════════════════════════════
-- 1. Save the statistics first: rows go, numbers stay
-- ══════════════════════════════════════════════════════════════

create table if not exists public.play_daily (
  day        date primary key,
  plays      bigint not null,
  players    bigint not null,
  updated_at timestamptz not null default now()
);

-- No policies on this table, so anon can neither read nor write it; only the
-- dashboard and the service role can see it. It is for you, not for the game.
alter table public.play_daily enable row level security;

-- greatest() is the point: re-running after a prune recomputes a smaller
-- number for the same day, because rows are gone. Keep the largest figure
-- ever measured rather than overwriting with the latest.
insert into public.play_daily (day, plays, players)
select (created_at at time zone 'Asia/Taipei')::date,
       count(*), count(distinct device_id)
from public.scores
group by 1
on conflict (day) do update set
  plays      = greatest(public.play_daily.plays,   excluded.plays),
  players    = greatest(public.play_daily.players, excluded.players),
  updated_at = now();


-- ══════════════════════════════════════════════════════════════
-- 2. Keep only the best row per device
-- ══════════════════════════════════════════════════════════════
--
-- Three things are deliberately kept:
--   * hidden rows      a record of a staff decision, not junk
--   * the last hour    so this does not race someone mid-round
--   * each device's best   that is the row the board shows
--
-- The surviving row is the same one the leaderboard view picks, by the same
-- ordering, so the board, the ranks and the totals are unchanged by a prune.

with keep as (
  select distinct on (device_id) id
  from public.scores
  where not hidden
  order by device_id, score desc, created_at asc
)
delete from public.scores s
where not s.hidden
  and s.created_at < now() - interval '1 hour'
  and not exists (select 1 from keep k where k.id = s.id);


-- ══════════════════════════════════════════════════════════════
-- 3. Unused indexes
-- ══════════════════════════════════════════════════════════════
--
-- Indexes are roughly two-thirds of the per-row cost; unused ones are pure
-- overhead.
--   scores_score_idx   global score ordering, now done inside the view via best_idx
--   scores_device_idx  best_idx leads with device_id, so the rate-limit lookup still hits an index

drop index if exists public.scores_score_idx;
drop index if exists public.scores_device_idx;


-- ══════════════════════════════════════════════════════════════
-- 4. Afterwards
-- ══════════════════════════════════════════════════════════════
--
-- Deleted space is not returned to disk until a vacuum marks it reusable;
-- after that, new scores fill the gaps and the file stops growing.
-- Run this on its own (vacuum cannot sit inside a transaction). If the SQL
-- Editor refuses, skip it — autovacuum gets there eventually.
--
--   vacuum (analyze) public.scores;
--
-- Not vacuum full: it locks the whole table, which under load means taking the game offline for minutes.


-- Check the result:
--   select count(*) from public.scores;          -- expect players + hidden + the last hour
--   select * from public.play_daily order by day; -- your history lives here
