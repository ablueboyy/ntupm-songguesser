-- 金曲猜歌王 — 排行榜資料表
--
-- 在 Supabase 的 SQL Editor 整份貼上執行。這份是冪等的:
-- 重跑一次會把最新的規則套上去,不會弄壞既有資料。

create table if not exists public.scores (
  id         uuid primary key default gen_random_uuid(),
  nickname   text        not null,
  score      int         not null,
  correct    int         not null,
  device_id  text        not null,
  created_at timestamptz not null default now()
);

create index if not exists scores_score_idx  on public.scores (score desc, created_at asc);
create index if not exists scores_device_idx on public.scores (device_id, created_at desc);

-- ══════════════════════════════════════════════════════════════
-- 資料合理性
--
-- 前端的檢查是可以繞過的(打開開發者工具就能直接 POST),
-- 所以真正的防線在這裡。這些規則擋不住鐵了心要作假的人,
-- 但能讓「隨手灌一個 999999 分」這種事直接失敗。
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

-- 這條最有用。得分公式是 300 + 700 × (剩餘秒數 ÷ 12),
-- 所以每答對一題必定落在 300 ~ 1000 分之間 ——
-- 分數和答對題數之間存在硬性關係,對不上就是假的。
--   答對 10 題  → 3000 ~ 10000
--   答對 3 題   → 900 ~ 3000(想報 9000 分?不可能)
--   答對 0 題   → 只能是 0 分
-- 改了 CONFIG 的 baseScore / speedScore / questionCount 就要同步改這裡。
alter table public.scores drop constraint if exists scores_score_matches_correct;
alter table public.scores add  constraint scores_score_matches_correct
  check (score >= correct * 300 and score <= correct * 1000);

-- ══════════════════════════════════════════════════════════════
-- 速率限制
--
-- 一局十題,再怎麼快也要幾十秒。同一台裝置 20 秒內連續上傳
-- 就是腳本在灌,不是人在玩。擋不住換 device_id 重來的人,
-- 但能把「一秒灌一千筆」壓成「一分鐘三筆」。
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
-- RLS:只開 insert 和 select
-- 不開 update / delete,所以 anon key 外流也改不掉、刪不掉既有分數。
-- (PostgREST 對「被 RLS 濾掉、實際 0 列」也是回 204,不是 403 ——
--  要驗證有沒有擋住,得看 Prefer: return=representation 回不回空陣列。)
-- ══════════════════════════════════════════════════════════════

alter table public.scores enable row level security;

drop policy if exists "anyone can insert" on public.scores;
create policy "anyone can insert" on public.scores
  for insert to anon with check (true);

drop policy if exists "anyone can read" on public.scores;
create policy "anyone can read" on public.scores
  for select to anon using (true);

-- 要清測試資料或不當暱稱,到後台 Table Editor 手動刪
-- (後台走 service role,不受上面的政策限制)。
