-- Leaderboard schema.
--
-- Paste the whole file into Supabase's SQL Editor and run it. Idempotent:
-- re-running applies the current rules without disturbing existing data.

create table if not exists public.scores (
  id         uuid primary key default gen_random_uuid(),
  nickname   text        not null,
  score      int         not null,
  correct    int         not null,
  device_id  text        not null,
  created_at timestamptz not null default now()
);

-- Moderation flag. Staff mark an unpleasant nickname or an impossible score
-- as hidden; it leaves the board but the row survives. A misclick during an
-- event is recoverable, which matters more than tidiness.
alter table public.scores add column if not exists hidden boolean not null default false;

-- These two used to exist and are no longer used: ordering moved into the
-- leaderboard view (which rides scores_best_idx), and the rate-limit lookup
-- reaches the same index by its leading column. Indexes are about two-thirds
-- of the per-row cost, so sql/prune.sql drops them; do not recreate them.
--   scores_score_idx  (score desc, created_at asc)
--   scores_device_idx (device_id, created_at desc)

-- Both the board and the staff page page through the table oldest-first
-- (PostgREST returns at most 1000 rows, so paging is unavoidable once there
-- are real numbers of players). This index serves that paging.
create index if not exists scores_created_idx on public.scores (created_at asc);

-- ══════════════════════════════════════════════════════════════
-- Sanity constraints
--
-- Client-side checks are trivially bypassed — open devtools and POST. The
-- real line is here. None of this stops someone determined, but it does make
-- a casual 999999 fail outright.
-- ══════════════════════════════════════════════════════════════

alter table public.scores drop constraint if exists scores_nickname_len;
alter table public.scores add  constraint scores_nickname_len
  check (char_length(btrim(nickname)) between 1 and 16);

alter table public.scores drop constraint if exists scores_score_range;
alter table public.scores add  constraint scores_score_range
  check (score between 0 and 10000);

alter table public.scores drop constraint if exists scores_correct_range;
alter table public.scores add  constraint scores_correct_range
  check (correct between 0 and 10);

-- The useful one. Scoring is 300 + 700 * (seconds left / 12), so a correct
-- answer is always worth 300-1000. That ties score to correct count:
--   10 correct -> 3000-10000
--    3 correct -> 900-3000  (claiming 9000 is impossible)
--    0 correct -> 0
-- Change baseScore / speedScore / questionCount in CONFIG and change this too.
alter table public.scores drop constraint if exists scores_score_matches_correct;
alter table public.scores add  constraint scores_score_matches_correct
  check (score >= correct * 300 and score <= correct * 1000);

-- ══════════════════════════════════════════════════════════════
-- Rate limit
--
-- Ten questions take tens of seconds however fast you are, so two submissions
-- from one device inside 20 seconds is a script. Rotating device_id defeats
-- it, but it turns "a thousand rows a second" into "three a minute".
-- ══════════════════════════════════════════════════════════════

create or replace function public.scores_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.scores
    where device_id = new.device_id
      and created_at > now() - interval '20 seconds'
  ) then
    raise exception '太快了 —— 同一台裝置 20 秒內只能上傳一次成績'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists scores_rate_limit_trg on public.scores;
create trigger scores_rate_limit_trg
  before insert on public.scores
  for each row execute function public.scores_rate_limit();

-- ══════════════════════════════════════════════════════════════
-- RLS: insert and select only
-- No update or delete, so a leaked anon key cannot alter or remove scores.
-- (PostgREST answers 204 for "RLS filtered everything out", not 403, so to
--  verify a policy actually blocks, check whether return=representation
--  comes back empty.)
-- ══════════════════════════════════════════════════════════════

alter table public.scores enable row level security;

-- Policies bind to roles, and logging in switches the role from anon to
-- authenticated. A policy naming only anon means staff see nothing once they
-- log in — no error, just empty. So both roles are listed.
-- (update/delete with return=representation also needs select.)
drop policy if exists "anyone can insert" on public.scores;
create policy "anyone can insert" on public.scores
  for insert to anon, authenticated with check (true);

drop policy if exists "anyone can read" on public.scores;
create policy "anyone can read" on public.scores
  for select to anon, authenticated using (true);

-- ══════════════════════════════════════════════════════════════
-- Staff (staff.html)
--
-- Edit rights hang off being logged in, not off knowing a key. staff.html
-- uses the same public anon key; logging in is what moves the session to the
-- authenticated role. Opening the page without an account achieves nothing.
--
-- To create an account: Supabase dashboard -> Authentication -> Users ->
-- Add user, fill in email and password, tick Auto Confirm User. Any number
-- of accounts is fine, and sharing one across a shift is fine too.
-- ══════════════════════════════════════════════════════════════

drop policy if exists "staff can update" on public.scores;
create policy "staff can update" on public.scores
  for update to authenticated using (true) with check (true);

drop policy if exists "staff can delete" on public.scores;
create policy "staff can delete" on public.scores
  for delete to authenticated using (true);

-- Or skip staff.html entirely and edit in the dashboard's Table Editor,
-- which runs as the service role and ignores every policy above.

-- ══════════════════════════════════════════════════════════════
-- Leaderboard view: best row per device
--
-- This merge used to happen on the phone, which meant shipping the whole
-- table down — several seconds once there were more than a thousand players.
-- The screen only ever needs three things: the top 20, your own row, and the
-- total. Doing the merge in the database makes each of those a few KB.
--
-- Ordering must match what the client used to do: higher score first, and on
-- a tie the earlier submission wins.
-- ══════════════════════════════════════════════════════════════

-- distinct on walks this index directly
create index if not exists scores_best_idx
  on public.scores (device_id, score desc, created_at asc);

drop view if exists public.leaderboard;
create view public.leaderboard as
select distinct on (device_id)
  device_id, nickname, score, correct, created_at
from public.scores
where not hidden
order by device_id, score desc, created_at asc;

-- A view reads its base table as its creator by default. scores is readable
-- by everyone anyway, so both roles would see the same rows, but invoker is
-- cleaner (and stops the dashboard warning about security definer views).
-- The option does not exist before PostgreSQL 15; failing is harmless.
do $$
begin
  execute 'alter view public.leaderboard set (security_invoker = true)';
exception when others then null;
end $$;

grant select on public.leaderboard to anon, authenticated;
