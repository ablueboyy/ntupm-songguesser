/* 干擾選項庫要撈哪些歌手,依 genre 分組。
 *
 * build-decoys.js 用它去 iTunes 撈歌,clean-decoys.js 用它把撈錯的濾掉。
 * 要加歌手就加在這裡,兩支腳本會同時吃到。
 *
 * ALIAS 是同一位歌手在台灣商店的其他寫法 —— 例如查 BTS 回來的
 * artistName 是「防彈少年團」,不列進來就會被當成撈錯的濾掉。
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

/* 台灣商店回傳的別名。
 *
 * 台灣 Apple Music 大量使用中文譯名和藝人改名後的新名字,
 * 名單漏了就會把正牌的歌當成「撈錯」濾掉 ——
 * 例如 The Weeknd 在商店裡叫 Abel Tesfaye(他的本名)。
 * 如果 build-decoys 回報某位歌手撈到 0 首,通常就是這裡少了一條。
 */
const ALIAS = {
  // 韓語
  'BTS': ['防彈少年團','방탄소년단'],
  'Girls\' Generation': ['少女時代','소녀시대'],
  '(G)I-DLE': ['(여자)아이들','여자아이들','i-dle'],
  'SEVENTEEN': ['세븐틴'],
  'Super Junior': ['슈퍼주니어'],
  'EXO': ['엑소'],
  'BIGBANG': ['빅뱅'],
  // 西洋
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
  // 日文
  'Official髭男dism': ['Official鬍子男dism','髭男'],
  // 華語
  '蘇打綠': ['魚丁糸']
};

const norm = s => String(s || '')
  .replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
  .toLowerCase()
  .replace(/[\s　'"'']/g, '');

/* 這位 artistName 是不是名單上的人(或跟名單上的人合作)? */
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
