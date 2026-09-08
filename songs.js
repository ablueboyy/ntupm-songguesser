/* 金曲猜歌王 — 題庫(100 首)
 *
 * 這 100 首是「會被當成題目」的歌,每一首都需要音源
 * (audio/<id>.m4a 本地檔,或 previews.js 裡的官方試聽網址)。
 *
 * 每一局固定抽 8 題,曲風配額寫在 index.html 的 CONFIG.quota:
 *   華語現代 3 · 華語經典 1 · 台語 1 · 韓語 1 · 西洋 1 · 日文 1
 * 配額之內隨機抽,出題順序也是隨機的。
 *
 * genre 有兩個用途,但玩家在畫面上完全看不到它:
 *   1. 決定上面那個配額
 *   2. 挑干擾選項 —— 華語歌的九宮格要配華語的干擾項,
 *      不然一堆英文選項混進來,用刪去法就猜到了
 *
 * 純干擾用的歌名(不需要音源)放在 decoys.js。
 */
window.SONGS = [
  /* ---------- 華語現代 ---------- */
  { id: "daoxiang",         title: "稻香",                   artist: "周杰倫",       genre: "mando" },
  { id: "qingtian",         title: "晴天",                   artist: "周杰倫",       genre: "mando" },
  { id: "gaobaiqiqiu",      title: "告白氣球",               artist: "周杰倫",       genre: "mando" },
  { id: "wenrou",           title: "溫柔",                   artist: "五月天",       genre: "mando" },
  { id: "turanhaoxiangni",  title: "突然好想你",             artist: "五月天",       genre: "mando" },
  { id: "xiulianaiqing",    title: "修煉愛情",               artist: "林俊傑",       genre: "mando" },
  { id: "jiangnan",         title: "江南",                   artist: "林俊傑",       genre: "mando" },
  { id: "xiaoxingyun",      title: "小幸運",                 artist: "田馥甄",       genre: "mando" },
  { id: "shuohuang",        title: "說謊",                   artist: "林宥嘉",       genre: "mando" },
  { id: "shinian",          title: "十年",                   artist: "陳奕迅",       genre: "mando" },
  { id: "guangnianzhiwai",  title: "光年之外",               artist: "鄧紫棋",       genre: "mando" },
  { id: "haoburongyi",      title: "好不容易",               artist: "告五人",       genre: "mando" },
  { id: "yuzai",            title: "魚仔",                   artist: "盧廣仲",       genre: "mando" },
  { id: "xiaoqingge",       title: "小情歌",                 artist: "蘇打綠",       genre: "mando" },
  { id: "yujian",           title: "遇見",                   artist: "孫燕姿",       genre: "mando" },
  { id: "ribuluo",          title: "日不落",                 artist: "蔡依林",       genre: "mando" },
  { id: "yihoubiezuo",      title: "以後別做朋友",           artist: "周興哲",       genre: "mando" },
  { id: "yanyuan",          title: "演員",                   artist: "薛之謙",       genre: "mando" },
  { id: "xiaochou",         title: "消愁",                   artist: "毛不易",       genre: "mando" },
  { id: "shuixingji",       title: "水星記",                 artist: "郭頂",         genre: "mando" },
  { id: "xiangjianni",      title: "想見你想見你想見你",     artist: "八三夭",       genre: "mando" },
  { id: "haonianqing",      title: "我還年輕 我還年輕",      artist: "老王樂隊",     genre: "mando" },
  { id: "qifengle",         title: "起風了",                 artist: "買辣椒也用券", genre: "mando" },
  { id: "shuosanjiusan",    title: "說散就散",               artist: "JC 陳詠桐",    genre: "mando" },
  { id: "dayu",             title: "大魚",                   artist: "周深",         genre: "mando" },
  { id: "wangfei",          title: "王妃",                   artist: "蕭敬騰",       genre: "mando" },
  { id: "shenqibaima",      title: "身騎白馬",               artist: "徐佳瑩",       genre: "mando" },
  { id: "shishenmerang",    title: "是什麼讓我遇見這樣的你", artist: "白安",         genre: "mando" },
  { id: "aimei",            title: "曖昧",                   artist: "楊丞琳",       genre: "mando" },
  { id: "superstar",        title: "Super Star",             artist: "S.H.E",        genre: "mando" },
  { id: "zuishouxi",        title: "最熟悉的陌生人",         artist: "蕭亞軒",       genre: "mando" },
  { id: "nibuzhidao",       title: "你不知道的事",           artist: "王力宏",       genre: "mando" },
  { id: "jiushiaini",       title: "就是愛你",               artist: "陶喆",         genre: "mando" },
  { id: "libai",            title: "李白",                   artist: "李榮浩",       genre: "mando" },
  { id: "dang",             title: "當",                     artist: "動力火車",     genre: "mando" },
  { id: "shoufangkai",      title: "手放開",                 artist: "李聖傑",       genre: "mando" },
  { id: "kongbaige",        title: "空白格",                 artist: "蔡健雅",       genre: "mando" },
  { id: "lvxingdeyiyi",     title: "旅行的意義",             artist: "陳綺貞",       genre: "mando" },
  { id: "yinxingdechibang", title: "隱形的翅膀",             artist: "張韶涵",       genre: "mando" },
  { id: "womendeai",        title: "我們的愛",               artist: "F.I.R.",       genre: "mando" },
  { id: "haoxiangni",       title: "好想你",                 artist: "朱主愛",       genre: "mando" },
  { id: "qishidoumeiyou",   title: "其實都沒有",             artist: "楊宗緯",       genre: "mando" },
  { id: "yigerenxiangzhe",  title: "一個人想著一個人",       artist: "曾沛慈",       genre: "mando" },
  { id: "naxienian",        title: "那些年",                 artist: "胡夏",         genre: "mando" },
  { id: "haishihui",        title: "還是會",                 artist: "韋禮安",       genre: "mando" },
  { id: "aini",             title: "愛你",                   artist: "陳芳語",       genre: "mando" },
  { id: "zhuiguangzhe",     title: "追光者",                 artist: "岑寧兒",       genre: "mando" },
  { id: "zenyang",          title: "怎樣",                   artist: "戴佩妮",       genre: "mando" },

  /* ---------- 華語經典 ---------- */
  { id: "tianmimi",        title: "甜蜜蜜",         artist: "鄧麗君", genre: "classic" },
  { id: "zhishaohaiyouni", title: "至少還有你",     artist: "林憶蓮", genre: "classic" },
  { id: "wenbie",          title: "吻別",           artist: "張學友", genre: "classic" },
  { id: "hongdou",         title: "紅豆",           artist: "王菲",   genre: "classic" },
  { id: "tinghai",         title: "聽海",           artist: "張惠妹", genre: "classic" },
  { id: "pengyou",         title: "朋友",           artist: "周華健", genre: "classic" },
  { id: "yongqi",          title: "勇氣",           artist: "梁靜茹", genre: "classic" },
  { id: "xiaoxiaoniao",    title: "我是一隻小小鳥", artist: "趙傳",   genre: "classic" },
  { id: "tonghua",         title: "童話",           artist: "光良",   genre: "classic" },
  { id: "sileduyaoai",     title: "死了都要愛",     artist: "信樂團", genre: "classic" },
  { id: "qingfeideyi",     title: "情非得已",       artist: "庾澄慶", genre: "classic" },
  { id: "wangqingshui",    title: "忘情水",         artist: "劉德華", genre: "classic" },

  /* ---------- 台語 ---------- */
  { id: "langzihuitou",    title: "浪子回頭",     artist: "茄子蛋", genre: "tw" },
  { id: "chiqingnanzihan", title: "癡情男子漢",   artist: "玖壹壹", genre: "tw" },
  { id: "nishiwodehuaduo", title: "妳是我的花朵", artist: "伍佰",   genre: "tw" },
  { id: "daoyutianguang",  title: "島嶼天光",     artist: "滅火器", genre: "tw" },
  { id: "jiahou",          title: "家後",         artist: "江蕙",   genre: "tw" },
  { id: "amadehua",        title: "阿嬤的話",     artist: "蕭煌奇", genre: "tw" },

  /* ---------- 韓語 ---------- */
  { id: "dynamite",       title: "Dynamite",          artist: "BTS",          genre: "kpop" },
  { id: "gangnamstyle",   title: "Gangnam Style",     artist: "PSY",          genre: "kpop" },
  { id: "howyoulikethat", title: "How You Like That", artist: "BLACKPINK",    genre: "kpop" },
  { id: "ditto",          title: "Ditto",             artist: "NewJeans",     genre: "kpop" },
  { id: "tt",             title: "TT",                artist: "TWICE",        genre: "kpop" },
  { id: "tomboy",         title: "TOMBOY",            artist: "(G)I-DLE",     genre: "kpop" },
  { id: "sorrysorry",     title: "Sorry, Sorry",      artist: "Super Junior", genre: "kpop" },
  { id: "bluevalentine",  title: "Blue Valentine",    artist: "NMIXX",        genre: "kpop" },
  { id: "antifragile",    title: "ANTIFRAGILE",       artist: "LE SSERAFIM",  genre: "kpop" },
  { id: "supernova",      title: "Supernova",         artist: "aespa",        genre: "kpop" },
  { id: "growl",          title: "Growl",             artist: "EXO",          genre: "kpop" },
  { id: "psycho",         title: "Psycho",            artist: "Red Velvet",   genre: "kpop" },
  { id: "verynice",       title: "Very Nice",         artist: "SEVENTEEN",    genre: "kpop" },
  { id: "gee",            title: "Gee",               artist: "少女時代",     genre: "kpop" },

  /* ---------- 西洋 ---------- */
  { id: "shapeofyou",     title: "Shape of You",     artist: "Ed Sheeran",        genre: "west" },
  { id: "blindinglights", title: "Blinding Lights",  artist: "The Weeknd",        genre: "west" },
  { id: "someonelikeyou", title: "Someone Like You", artist: "Adele",             genre: "west" },
  { id: "badguy",         title: "Bad Guy",          artist: "Billie Eilish",     genre: "west" },
  { id: "shakeitoff",     title: "Shake It Off",     artist: "Taylor Swift",      genre: "west" },
  { id: "uptownfunk",     title: "Uptown Funk",      artist: "Mark Ronson",       genre: "west" },
  { id: "countingstars",  title: "Counting Stars",   artist: "OneRepublic",       genre: "west" },
  { id: "letitgo",        title: "Let It Go",        artist: "Idina Menzel",      genre: "west" },
  { id: "despacito",      title: "Despacito",        artist: "Luis Fonsi",        genre: "west" },
  { id: "happy",          title: "Happy",            artist: "Pharrell Williams", genre: "west" },
  { id: "flowers",        title: "Flowers",          artist: "Miley Cyrus",       genre: "west" },
  { id: "attention",      title: "Attention",        artist: "Charlie Puth",      genre: "west" },
  { id: "believer",       title: "Believer",         artist: "Imagine Dragons",   genre: "west" },
  { id: "vivalavida",     title: "Viva La Vida",     artist: "Coldplay",          genre: "west" },

  /* ---------- 日文 / 動漫 ---------- */
  { id: "lemon",       title: "Lemon",     artist: "米津玄師",         genre: "jp" },
  { id: "idol",        title: "Idol",      artist: "YOASOBI",          genre: "jp" },
  { id: "gurenge",     title: "紅蓮華",    artist: "LiSA",             genre: "jp" },
  { id: "pretender",   title: "Pretender", artist: "Official髭男dism", genre: "jp" },
  { id: "zankyosanka", title: "残響散歌",  artist: "Aimer",            genre: "jp" },
  { id: "zenzenzense", title: "前前前世",  artist: "RADWIMPS",         genre: "jp" }
];
