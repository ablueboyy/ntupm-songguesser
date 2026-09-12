/* Leaderboard server settings — legacy.
 *
 * The game no longer reads this file; index.html stopped loading it when the
 * live leaderboard was replaced by the static crew board in crew.js. Only
 * staff.html still uses it, to browse the historical scores.
 *
 * Leave both fields empty and nothing breaks.
 *
 * To bring a live shared leaderboard back:
 *   1. Create a free project at supabase.com
 *   2. SQL Editor -> paste all of sql/leaderboard.sql -> Run
 *   3. Project Settings -> API Keys, fill in the project URL and anon key below
 *   4. Commit and push
 *
 * The anon key is meant to be public — it ships in the page source either way.
 * The actual gate is the RLS policy in the SQL: insert and select only, no
 * update or delete, so a leaked key cannot alter or remove existing scores.
 */
window.BOARD_CONFIG = {
  url:     'https://onixomvicywcbrqpdvgv.supabase.co',   // 例:https://abcdefghijk.supabase.co
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uaXhvbXZpY3l3Y2JycXBkdmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NjQ0MjksImV4cCI6MjEwNDU0MDQyOX0.dc8HfbYhu3oaAskFQQO9gdti-r8fNHWwTRtcg_8xCjA'    // 例:eyJhbGciOi...(很長的一串)
};
