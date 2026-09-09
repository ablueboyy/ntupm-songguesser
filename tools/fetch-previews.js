/* 金曲猜歌王 — 抓 iTunes 官方 30 秒試聽網址
 *
 * 用 Apple 公開的 iTunes Search API 查每首歌的 previewUrl,寫進 previews.js。
 * 只存「網址」,不下載音檔 —— 遊戲執行時直接串流 Apple 的伺服器。
 *
 *   node tools/fetch-previews.js                   只補還沒有的
 *   node tools/fetch-previews.js --force           全部重抓
 *   node tools/fetch-previews.js --only daoxiang   只抓指定的幾首(逗號分隔)
 *   node tools/fetch-previews.js --country JP      換商店地區(預設 TW)
 *   node tools/fetch-previews.js --delay 3000      放慢速度(API 約 20 次/分鐘)
 *
 * 抓完務必看一下 confidence 是 low 的那幾首,很可能配錯歌。
 */

const fs = require('fs');
const path = require('path');

global.window = {};
require('../songs.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'previews.js');

/* ---------- 參數 ---------- */
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const FORCE   = argv.includes('--force');
const ONLY    = flag('only', '').split(',').map(s => s.trim()).filter(Boolean);
const COUNTRY = flag('country', 'TW');
const DELAY   = parseInt(flag('delay', '2000'), 10);

/* ---------- 既有資料 ---------- */
function loadExisting() {
  try {
    const src = fs.readFileSync(OUT, 'utf8');
    const m = src.match(/window\.SONG_PREVIEWS\s*=\s*(\{[\s\S]*\});?\s*$/);
    return m ? JSON.parse(m[1]) : {};
  } catch (e) {
    return {};
  }
}

/* ---------- 字串正規化與比對 ---------- */
function norm(s) {
  return String(s || '')
    .replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .toLowerCase()
    .replace(/[\s　]/g, '')
    .replace(/[（）()\[\]【】「」『』、・·,，.。!！?？\-—_'"'']/g, '');
}

const BAD = /live|instrumental|karaoke|cover|remix|version|伴奏|現場|演唱會|純音樂/i;

// 專輯名稱看得出不是原版錄音的 —— 綜藝節目、演唱會實錄、卡拉OK、音樂盒。
// 這種最陰險:歌名和歌手都對得剛剛好,分數還比原版高(原版常常帶「(電影⋯主題曲)」副標),
// 但播出來是完全不同的編曲,玩家會聽到一首認不出來的歌。
const BAD_ALBUM = /第\s*\d+\s*期|演唱會|跨年|金曲撈|我是歌手|蒙面|聲生不息|好聲音|影音全記錄|串燒|卡拉|karaoke|オルゴール|音樂盒|音乐盒|instrumental|伴奏/i;

function score(song, item) {
  const t = norm(item.trackName), a = norm(item.artistName);
  const st = norm(song.title), sa = norm(song.artist);
  let s = 0;
  if (t === st) s += 4;
  else if (t.includes(st) || st.includes(t)) s += 2;
  if (a === sa) s += 3;
  else if (a.includes(sa) || sa.includes(a)) s += 2;
  if (BAD.test(item.trackName)) s -= 3;
  if (BAD_ALBUM.test(item.collectionName || '')) s -= 5;
  return s;
}

/* ---------- 查詢 ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function search(term, attempt = 1) {
  const url = 'https://itunes.apple.com/search?'
    + new URLSearchParams({ term, media: 'music', entity: 'song', country: COUNTRY, limit: '8' });
  const res = await fetch(url, { headers: { 'User-Agent': 'pm-songguesser/1.0' } });
  if (!res.ok) {
    if (attempt <= 2) {
      console.log(`    HTTP ${res.status},等 6 秒重試⋯`);
      await sleep(6000);
      return search(term, attempt + 1);
    }
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.results || [];
}

async function lookup(song) {
  const results = await search(`${song.title} ${song.artist}`);
  const usable = results.filter(r => r.previewUrl);
  if (!usable.length) return null;

  let best = null, bestScore = -Infinity;
  for (const item of usable) {
    const s = score(song, item);
    if (s > bestScore) { bestScore = s; best = item; }
  }
  if (!best || bestScore < 2) return null;

  return {
    url: best.previewUrl,
    title: best.trackName,
    artist: best.artistName,
    album: best.collectionName || '',
    offset: 0,
    conf: bestScore >= 6 ? 'high' : bestScore >= 4 ? 'medium' : 'low'
  };
}

/* ---------- 主流程 ---------- */
(async () => {
  const all = (window.SONGS || []).slice();
  const existing = loadExisting();
  let targets = all;
  if (ONLY.length) targets = all.filter(s => ONLY.includes(s.id));
  else if (!FORCE) targets = all.filter(s => !existing[s.id]);

  if (!targets.length) {
    console.log('\n沒有要抓的。用 --force 全部重抓,或 --only <id> 指定單首。\n');
    return;
  }

  console.log(`\n商店地區 ${COUNTRY} · 共 ${targets.length} 首 · 每首間隔 ${DELAY}ms`);
  console.log(`預計花 ${Math.ceil(targets.length * DELAY / 1000 / 60)} 分鐘\n`);

  const missing = [], lowConf = [];

  for (let i = 0; i < targets.length; i++) {
    const song = targets[i];
    const tag = `[${String(i + 1).padStart(2)}/${targets.length}]`;
    try {
      const hit = await lookup(song);
      if (hit) {
        existing[song.id] = hit;
        const mark = hit.conf === 'high' ? 'OK  ' : hit.conf === 'medium' ? 'OK? ' : '??  ';
        console.log(`${tag} ${mark} ${song.title} — ${song.artist}`);
        if (hit.conf !== 'high') {
          console.log(`            配到:${hit.title} — ${hit.artist}`);
          lowConf.push(`${song.id}  ${song.title} / ${song.artist}  →  ${hit.title} / ${hit.artist}`);
        }
      } else {
        console.log(`${tag} 找不到 ${song.title} — ${song.artist}`);
        missing.push(`${song.id}  ${song.title} — ${song.artist}`);
      }
    } catch (e) {
      console.log(`${tag} 失敗 ${song.title}:${e.message}`);
      missing.push(`${song.id}  ${song.title} — ${song.artist}  (${e.message})`);
    }
    if (i < targets.length - 1) await sleep(DELAY);
  }

  const header = `/* 自動產生,請勿手動編輯 —— 由 tools/fetch-previews.js 產出\n`
    + ` * 產生時間:${new Date().toISOString()}\n`
    + ` * 這裡只存 Apple 官方 30 秒試聽的網址,音檔不落地,遊戲執行時直接串流。\n`
    + ` * conf 是配對信心度,low 的請人工確認是不是配錯歌。\n`
    + ` */\n`;
  fs.writeFileSync(OUT, header + 'window.SONG_PREVIEWS = ' + JSON.stringify(existing, null, 2) + ';\n');

  console.log(`\n===== 結果 =====`);
  console.log(`previews.js 目前共 ${Object.keys(existing).length} 首`);

  if (lowConf.length) {
    console.log(`\n這 ${lowConf.length} 首請人工確認(可能配錯歌):`);
    lowConf.forEach(l => console.log('  ' + l));
    console.log(`\n配錯的話,直接編輯 previews.js 裡那首的 url,或改 songs.js 的歌名再 --only 重抓。`);
  }
  if (missing.length) {
    console.log(`\n這 ${missing.length} 首沒抓到,遊戲會用示範音:`);
    missing.forEach(l => console.log('  ' + l));
  }
  console.log('');
})();
