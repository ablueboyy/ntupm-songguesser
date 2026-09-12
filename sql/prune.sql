-- 金曲猜歌王 — 把 scores 瘦下來
--
-- 在 Supabase 的 SQL Editor 整份貼上執行。可以重複跑,跑幾次都一樣。
--
-- 為什麼要跑:排行榜只看「每台裝置的最高分」那一列,其餘的都是歷史紀錄。
-- 走紅之後一天進五十萬筆,免費方案 500MB 撐不到三天 —— 滿了專案會轉唯讀,
-- 那時候玩家連成績都交不上去。所以把歷史紀錄收成統計,列只留該留的。
--
-- 這支會刪資料。刪之前先把你真正在意的東西(每天玩幾局、幾個人)存成統計,
-- 那是刪不掉的。


-- ══════════════════════════════════════════════════════════════
-- 1. 先存統計 —— 刪掉的是紀錄,不是數字
-- ══════════════════════════════════════════════════════════════

create table if not exists public.play_daily (
  day        date primary key,
  plays      bigint not null,
  players    bigint not null,
  updated_at timestamptz not null default now()
);

-- 這張表沒有任何政策,所以 anon 讀不到也寫不到 —— 只有後台和 service role 看得見。
-- 它是給你看的,不是給遊戲用的。
alter table public.play_daily enable row level security;

-- greatest() 是關鍵:剪過之後再跑一次,同一天重算出來的數字只會更小
-- (因為列被刪掉了),所以要保留「曾經量到的最大值」,不能直接覆蓋。
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
-- 2. 每台裝置只留最高分的那一列
-- ══════════════════════════════════════════════════════════════
--
-- 三個東西刻意不刪:
--   · hidden 的列    —— 那是工作人員按過的判斷紀錄,不是垃圾
--   · 最近一小時的列 —— 免得跟正在玩的人打架(他那局剛交完就被掃掉)
--   · 每台的最高分   —— 榜上顯示的就是這一列
--
-- 留下來的那一列,跟 leaderboard view 挑的是同一列(同樣的排序規則),
-- 所以剪完之後排行榜、名次、總人數全都不會變。

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
-- 3. 沒人在用的索引
-- ══════════════════════════════════════════════════════════════
--
-- 索引大概佔每列成本的三分之二,留著沒用的等於白付空間。
--   scores_score_idx  全域照分數排序 —— 現在排序在 view 裡面做,走的是 best_idx
--   scores_device_idx best_idx 的第一欄也是 device_id,速率限制那個查詢照樣走得到

drop index if exists public.scores_score_idx;
drop index if exists public.scores_device_idx;


-- ══════════════════════════════════════════════════════════════
-- 4. 最後
-- ══════════════════════════════════════════════════════════════
--
-- 刪掉的空間不會自己還給硬碟,要 vacuum 過才會標成「可以再用」——
-- 之後新進來的成績就填回這些空位,檔案不會繼續長大。
-- 這行要單獨執行(vacuum 不能包在交易裡)。如果 SQL Editor 說不能跑,
-- 跳過也沒關係,autovacuum 自己會做,只是晚一點。
--
--   vacuum (analyze) public.scores;
--
-- 不要用 vacuum full —— 它會鎖住整張表,現在這個流量下等於把遊戲關掉幾分鐘。


-- 剪完看一下成果:
--   select count(*) from public.scores;          -- 應該剩下「玩家數 + 下架數 + 最近一小時」
--   select * from public.play_daily order by day; -- 你的歷史統計留在這裡
