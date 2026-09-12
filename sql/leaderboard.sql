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

-- 下架用的旗標。工作人員把不當暱稱或異常分數標成 hidden 之後,
-- 榜上就看不到了,但資料還在 —— 誤按可以救回來,活動當下這比「刪掉」重要。
alter table public.scores add column if not exists hidden boolean not null default false;

-- 這兩條以前有,現在沒人用了(排序搬進 leaderboard view,走的是 scores_best_idx;
-- 速率限制那個查詢也走得到 best_idx 的第一欄)。索引佔每列成本的三分之二,
-- 留著沒用的等於白付空間 —— sql/prune.sql 會把它們刪掉,這裡不要再建回來。
--   scores_score_idx  (score desc, created_at asc)
--   scores_device_idx (device_id, created_at desc)

-- 排行榜和工作人員頁都是照 created_at 由舊到新分頁把整張表抓回來的
-- (PostgREST 一次最多只回 1000 列,人一多就一定要翻頁)。這條索引就是給那個翻頁用的。
create index if not exists scores_created_idx on public.scores (created_at asc);

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

-- 政策是「綁角色」的,而登入之後身分會從 anon 換成 authenticated。
-- 只寫 to anon 的話,工作人員一登入反而什麼都看不到 ——
-- 不會報錯,就是空的。所以這兩條要同時涵蓋兩種角色。
-- (update / delete 帶 return=representation 也需要 select,一併靠這條。)
drop policy if exists "anyone can insert" on public.scores;
create policy "anyone can insert" on public.scores
  for insert to anon, authenticated with check (true);

drop policy if exists "anyone can read" on public.scores;
create policy "anyone can read" on public.scores
  for select to anon, authenticated using (true);

-- ══════════════════════════════════════════════════════════════
-- 工作人員(staff.html)
--
-- 刪改權綁在「有沒有登入」,不是「知不知道金鑰」。
-- staff.html 用的還是那把公開的 anon key,登入之後才換到
-- authenticated 身分 —— 所以就算有人打開 staff.html,
-- 沒帳號密碼一樣什麼都做不了。
--
-- 開帳號:Supabase 後台 → Authentication → Users → Add user,
-- 填 email 和密碼,並勾選 Auto Confirm User。
-- 帳號要開幾個都行,攤位輪班的人共用一個也可以。
-- ══════════════════════════════════════════════════════════════

drop policy if exists "staff can update" on public.scores;
create policy "staff can update" on public.scores
  for update to authenticated using (true) with check (true);

drop policy if exists "staff can delete" on public.scores;
create policy "staff can delete" on public.scores
  for delete to authenticated using (true);

-- 也可以完全不用 staff.html,直接到後台 Table Editor 改
-- (後台走 service role,不受上面任何政策限制)。

-- ══════════════════════════════════════════════════════════════
-- 排行榜的 view:每台裝置只留最高分的那一列
--
-- 以前是把整張 scores 抓回手機、在前端合併的。人一破千,光是把資料
-- 搬下來就要好幾秒 —— 但畫面上其實只需要「前 20 名 + 自己 + 總人數」。
-- 合併搬到資料庫做,前端就只要問這三件事,每次都是幾 KB。
--
-- 排序規則要跟前端原本那套一模一樣:分數高的在前,同分則早交的在前。
-- ══════════════════════════════════════════════════════════════

-- distinct on 就是照這條索引的順序走
create index if not exists scores_best_idx
  on public.scores (device_id, score desc, created_at asc);

drop view if exists public.leaderboard;
create view public.leaderboard as
select distinct on (device_id)
  device_id, nickname, score, correct, created_at
from public.scores
where not hidden
order by device_id, score desc, created_at asc;

-- view 預設是用建立者的身分去讀底層表。這張 view 底下的 scores 本來就
-- 開放所有人 select,兩種身分讀到的東西一樣 —— 但還是設成 invoker 比較乾淨
-- (也免得 Supabase 後台一直跳 security definer view 的警告)。
-- PostgreSQL 15 以前沒有這個選項,失敗就算了,不影響功能。
do $$
begin
  execute 'alter view public.leaderboard set (security_invoker = true)';
exception when others then null;
end $$;

grant select on public.leaderboard to anon, authenticated;
