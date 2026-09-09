/* 排行榜的伺服器設定
 *
 * 兩個欄位都留空的話,遊戲照常能玩 —— 排行榜會自動退回「只有這支手機」的模式,
 * 而且畫面上會寫明,不會讓玩家誤以為自己上了全場榜。
 *
 * 要開啟全場共用的即時榜:
 *   1. 到 supabase.com 開一個免費專案(這步要用你自己的帳號)
 *   2. 左邊 SQL Editor → 貼上 sql/leaderboard.sql 整份 → Run
 *   3. Project Settings → API Keys,把 Project URL 和 anon public key 填到下面
 *   4. commit + push,GitHub Pages 更新後就生效
 *
 * anon key 是設計成可以公開的 —— 它本來就會出現在網頁原始碼裡,藏不住也不用藏。
 * 真正把關的是 SQL 裡的 RLS 政策:只開 insert 和 select,不開 update / delete。
 * 也就是說,金鑰就算外流,別人頂多灌一些假分數進來,改不掉也刪不掉任何既有成績。
 */
window.BOARD_CONFIG = {
  url:     '',   // 例:https://abcdefghijk.supabase.co
  anonKey: ''    // 例:eyJhbGciOi...(很長的一串)
};
