-- 金曲猜歌王 — 排行榜資料表
-- 在 Supabase 的 SQL Editor 整份貼上執行一次就好。

create table if not exists public.scores (
  id         uuid primary key default gen_random_uuid(),
  nickname   text        not null,
  score      int         not null,
  correct    int         not null,
  device_id  text        not null,
  created_at timestamptz not null default now(),

  -- 資料庫這一層先擋掉明顯亂來的值。前端也會檢查,但前端是可以繞過的。
  constraint scores_nickname_len check (char_length(nickname) between 1 and 16),
  constraint scores_score_range  check (score between 0 and 10000),
  constraint scores_correct_range check (correct between 0 and 10)
);

-- 榜是「分數由高到低」查出來的,這個索引讓它不用整表掃描
create index if not exists scores_score_idx on public.scores (score desc, created_at asc);

-- 同一支手機同一個暱稱只留最高分 —— 這件事在前端合併,
-- 資料庫照樣每一局存一筆(append-only),之後要看遊玩次數、時段分布都還有原始資料。

alter table public.scores enable row level security;

-- 只開 insert 和 select。
-- 不開 update / delete,所以 anon key 外流也改不掉、刪不掉既有分數。
drop policy if exists "anyone can insert" on public.scores;
create policy "anyone can insert" on public.scores
  for insert to anon with check (true);

drop policy if exists "anyone can read" on public.scores;
create policy "anyone can read" on public.scores
  for select to anon using (true);

-- 要清掉測試資料或不當暱稱時,到 Supabase 後台的 Table Editor 手動刪
-- (後台用的是 service role,不受上面的政策限制)。
