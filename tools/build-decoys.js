/* 金曲猜歌王 — 建立干擾選項庫
 *
 * 從 iTunes 商店撈一批歌手的代表作,當作九宮格的干擾選項。
 * 干擾項只需要「歌名」,不需要音源,所以可以放很多。
 *
 * 用 attribute=artistTerm 查詢,結果一定是該歌手的歌,
 * 歌名和歌手都直接採用 Apple 回傳的值,不靠人工記憶,不會記錯。
 *
 *   node tools/build-decoys.js
 *   node tools/build-decoys.js --per 10 --delay 3000
 *
 * 產出 decoys.js。已經在 songs.js 裡的歌會自動排除。
 */

const fs = require('fs');
const path = require('path');

global.window = {};
require('../songs.js');

const OUT = path.join(__dirname, '..', 'decoys.js');

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i+1] ? argv[i+1] : d; };
const PER     = parseInt(flag('per', '8'), 10);
const DELAY   = parseInt(flag('delay', '3000'), 10);
const COUNTRY = flag('country', 'TW');

const { ARTISTS, knownArtist } = require('./artists.js');

// 歌名比對用:全形轉半形、去空白、去標點,用來判斷是不是同一首歌
const norm = s => String(s || '')
  .replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
  .toLowerCase()
  .replace(/[\s　]/g, '')
  .replace(/[（）()\[\]【】「」『』、・·,，.。!！?？\-—_'"'']/g, '');

// 現場版、伴奏、翻唱這類不適合當選項 —— 玩家看到「(Live)」就知道是干擾項了
const BAD = /live|instrumental|karaoke|inst\.|remix|version|edit|伴奏|現場|演唱會|純音樂|feat\.|cover/i;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function byArtist(artist, attempt = 1) {
  const url = 'https://itunes.apple.com/search?' + new URLSearchParams({
    term: artist, attribute: 'artistTerm', entity: 'song',
    country: COUNTRY, limit: String(PER * 3)
  });
  const res = await fetch(url, { headers: { 'User-Agent': 'pm-songguesser/1.0' } });
  if (!res.ok) {
    if (attempt <= 2) { await sleep(8000); return byArtist(artist, attempt + 1); }
    throw new Error('HTTP ' + res.status);
  }
  return (await res.json()).results || [];
}

(async () => {
  // 已經是題目的歌要排除,不然同一首歌會同時是答案和干擾項
  const taken = new Set(window.SONGS.map(s => norm(s.title)));
  const seen  = new Set(taken);
  const decoys = [];
  const empty = [];

  const jobs = [];
  for (const [genre, list] of Object.entries(ARTISTS)) {
    for (const artist of list) jobs.push({ genre, artist });
  }

  console.log(`\n商店地區 ${COUNTRY} · ${jobs.length} 位歌手 · 每位最多 ${PER} 首`);
  console.log(`間隔 ${DELAY}ms,預計 ${Math.ceil(jobs.length * DELAY / 1000 / 60)} 分鐘\n`);

  for (let i = 0; i < jobs.length; i++) {
    const { genre, artist } = jobs[i];
    const tag = `[${String(i + 1).padStart(2)}/${jobs.length}]`;
    try {
      const results = await byArtist(artist);
      let kept = 0;
      for (const r of results) {
        if (kept >= PER) break;
        if (!r.trackName || BAD.test(r.trackName)) continue;
        if (!knownArtist(r.artistName)) continue;   // 團員個人作品之類的,濾掉
        const key = norm(r.trackName);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        decoys.push({ title: r.trackName, artist: r.artistName, genre });
        kept++;
      }
      console.log(`${tag} ${String(kept).padStart(2)} 首  ${artist}`);
      if (kept === 0) empty.push(`${artist} (${genre})`);
    } catch (e) {
      console.log(`${tag} 失敗   ${artist}:${e.message}`);
      empty.push(`${artist} (${genre}) — ${e.message}`);
    }
    if (i < jobs.length - 1) await sleep(DELAY);
  }

  const byGenre = {};
  decoys.forEach(d => { byGenre[d.genre] = (byGenre[d.genre] || 0) + 1; });

  const header = `/* 自動產生,請勿手動編輯 —— 由 tools/build-decoys.js 產出\n`
    + ` * 產生時間:${new Date().toISOString()}\n`
    + ` *\n`
    + ` * 這些歌只當九宮格的干擾選項,不會被當成題目,所以不需要音源。\n`
    + ` * 資料直接來自 iTunes 商店,歌名與歌手都是 Apple 回傳的原值。\n`
    + ` */\n`;
  fs.writeFileSync(OUT, header + 'window.DECOYS = ' + JSON.stringify(decoys, null, 1) + ';\n');

  console.log(`\n===== 結果 =====`);
  console.log(`干擾選項 ${decoys.length} 首`);
  Object.entries(byGenre).forEach(([g, n]) => console.log(`  ${g.padEnd(8)} ${n}`));
  console.log(`題目 ${window.SONGS.length} 首`);
  console.log(`選項總數 ${decoys.length + window.SONGS.length}`);
  if (empty.length) {
    console.log(`\n這幾位沒撈到東西,可能是名字在台灣商店的寫法不同:`);
    empty.forEach(e => console.log('  ' + e));
  }
  console.log('');
})();
