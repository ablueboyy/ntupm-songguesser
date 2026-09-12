/* Which artists to pull decoys from, grouped by genre.
 *
 * build-decoys.js searches iTunes with this list; clean-decoys.js uses it to
 * throw out bad matches. Add an artist here and both scripts pick it up.
 *
 * ALIAS holds the other spellings the Taiwan store uses for the same artist.
 * Searching BTS, for instance, comes back as 防彈少年團; without the alias
 * those tracks would be discarded as mismatches.
 */

const ARTISTS = {
  mando: [
    '周杰倫','五月天','林俊傑','田馥甄','林宥嘉','陳奕迅','鄧紫棋','告五人',
    '盧廣仲','蘇打綠','孫燕姿','蔡依林','周興哲','薛之謙','毛不易','八三夭',
    '韋禮安','徐佳瑩','楊丞琳','S.H.E','蕭亞軒','王力宏','陶喆','李榮浩',
    '蔡健雅','陳綺貞','張韶涵','楊宗緯','蕭敬騰','吳青峰'
  ],
  classic: [
    '鄧麗君','張學友','王菲','張惠妹','周華健','梁靜茹','光良','信樂團',
    '庾澄慶','劉德華','林憶蓮','趙傳','任賢齊','莫文蔚','張宇','蘇慧倫'
  ],
  tw: [
    '茄子蛋','玖壹壹','伍佰','滅火器','江蕙','葉啟田','蕭煌奇','謝金燕'
  ],
  kpop: [
    'BTS','BLACKPINK','NewJeans','TWICE','(G)I-DLE','IVE','NMIXX','LE SSERAFIM',
    'aespa','ITZY','Red Velvet','BIGBANG','Girls\' Generation','Super Junior','EXO','SEVENTEEN'
  ],
  west: [
    'Ed Sheeran','Taylor Swift','Adele','Billie Eilish','The Weeknd','Bruno Mars',
    'Coldplay','Imagine Dragons','Charlie Puth','Maroon 5','OneRepublic','Justin Bieber',
    'Ariana Grande','Katy Perry','Dua Lipa','Post Malone'
  ],
  jp: [
    '米津玄師','YOASOBI','LiSA','Official髭男dism','RADWIMPS','Ado',
    'King Gnu','back number','あいみょん','ONE OK ROCK'
  ]
};

/* Aliases returned by the Taiwan store.
 *
 * Apple Music TW leans heavily on Chinese translations and on whatever name
 * an artist currently goes by, so a missing alias means real tracks get
 * discarded as mismatches — The Weeknd is listed as Abel Tesfaye, his legal
 * name. If build-decoys reports zero results for an artist, a line is
 * usually missing here.
 */
const ALIAS = {
  // K-pop
  'BTS': ['防彈少年團','방탄소년단'],
  'Girls\' Generation': ['少女時代','소녀시대'],
  '(G)I-DLE': ['(여자)아이들','여자아이들','i-dle'],
  'SEVENTEEN': ['세븐틴'],
  'Super Junior': ['슈퍼주니어'],
  'EXO': ['엑소'],
  'BIGBANG': ['빅뱅'],
  // Western
  'The Weeknd': ['Abel Tesfaye','威肯'],
  'Maroon 5': ['魔力紅'],
  'Ed Sheeran': ['紅髮艾德'],
  'Taylor Swift': ['泰勒絲'],
  'Adele': ['愛黛兒'],
  'Billie Eilish': ['怪奇比莉'],
  'Bruno Mars': ['火星人布魯諾'],
  'Coldplay': ['酷玩'],
  'Imagine Dragons': ['謎幻樂團'],
  'Charlie Puth': ['查理普斯'],
  'OneRepublic': ['共和世代'],
  'Justin Bieber': ['小賈斯汀'],
  'Ariana Grande': ['亞莉安娜'],
  'Katy Perry': ['凱蒂佩芮'],
  'Dua Lipa': ['杜娃黎波'],
  'Post Malone': ['波茲馬龍'],
  // Japanese
  'Official髭男dism': ['Official鬍子男dism','髭男'],
  // Mandarin
  '蘇打綠': ['魚丁糸']
};

const norm = s => String(s || '')
  .replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
  .toLowerCase()
  .replace(/[\s　'"'']/g, '');

/* Is this artistName one of ours, or a collaboration with one of ours? */
function knownArtist(artistName) {
  const a = norm(artistName);
  if (!a) return false;
  for (const list of Object.values(ARTISTS)) {
    for (const want of list) {
      const w = norm(want);
      if (w.length >= 2 && a.includes(w)) return true;
      for (const alt of (ALIAS[want] || [])) {
        if (a.includes(norm(alt))) return true;
      }
    }
  }
  return false;
}

module.exports = { ARTISTS, ALIAS, knownArtist, norm };
