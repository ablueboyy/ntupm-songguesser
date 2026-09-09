# 金曲猜歌王 — NTUPM 18th 聯展攤位遊戲

台大流行音樂演唱社社團聯展擺攤用的猜歌遊戲。掃 QR → 取暱稱 → 十題九宮格搶答 → 達標兌獎。

**試玩版:https://ablueboyy.github.io/ntupm-songguesser/**

企劃書:https://claude.ai/code/artifact/f1f27848-a50f-4f9c-bc45-545944605b1a

---

## 怎麼跑起來

直接用瀏覽器打開 `index.html` 就能玩(不需要架伺服器)。

想在手機上測,或之後要放音檔,建議起一個本機伺服器:

```bash
python -m http.server 8000
# 然後開 http://localhost:8000
# 手機連同一個 Wi-Fi,開 http://<電腦IP>:8000
```

**電腦測試小技巧**:遊戲中按數字鍵 `1`–`9` 可以直接選第 N 格,不用滑鼠。

---

## 目前的狀態

| 部分 | 狀態 |
|---|---|
| 九宮格搶答、倒數、計分 | 完成 |
| 暱稱輸入、音量測試 | 完成 |
| 結算、五級稱號、兌獎判定(門檻 8,000 分) | 完成 |
| 音源 | Apple 官方試聽,執行時串流 |
| 排行榜 | **還沒做**,畫面上顯示「還在製作中」 |
| 本地音檔 | **還沒放**,`audio/` 是空的 |

## 部署

推到 `main` 就會自動更新 GitHub Pages,大約一分鐘後生效。

```bash
git add -A && git commit -m "..." && git push
```

---

## 放音檔

把每首歌的副歌片段剪成 15 秒,存成 `audio/<id>.m4a`,`<id>` 就是 `songs.js` 裡的 `id` 欄位。

```
audio/daoxiang.m4a      ← 稻香
audio/qingtian.m4a      ← 晴天
audio/xiaoxingyun.m4a   ← 小幸運
```

放進去就會自動改用真的音檔,程式不用改。沒放的歌繼續用示範音,可以一首一首慢慢補。

### 批次剪輯工具

`tools/clips.csv` 已經把 200 首歌的 id 都列好了,只要填兩欄:

```csv
id,title,artist,source,start
daoxiang,稻香,周杰倫,D:\music\稻香.mp3,62
qingtian,晴天,周杰倫,D:\music\晴天.m4a,1:15
```

- `source` — 來源檔完整路徑
- `start` — 副歌從第幾秒開始,可填 `62` 或 `1:15` 或 `00:01:15`

填好之後跑:

```powershell
.\tools\make-clips.ps1              # 剪還沒剪過的
.\tools\make-clips.ps1 -Force       # 全部重剪
.\tools\make-clips.ps1 -Seconds 12  # 改片段長度
```

需要先裝 ffmpeg:`winget install Gyan.FFmpeg`(裝完開一個新終端機視窗)。

單首手動剪的話:

```bash
ffmpeg -y -ss 62 -t 15 -i 原檔.mp3 -vn -c:a aac -b:a 96k audio/daoxiang.m4a
```

### 音源從哪來

**不要從 YouTube 或串流平台側錄下載。** 三條可行的路,遊戲會自動照這個順序找音源:

| 優先序 | 來源 | 狀態 |
|---|---|---|
| 1 | `audio/<id>.m4a` 本地音檔(社員自錄 或 合法擁有的檔案) | 要自己放 |
| 2 | Apple 官方 30 秒試聽,執行時直接串流 | **已接好** |
| 3 | 程式合成的示範音 | 自動 fallback |

示範音是依歌曲 id 產生的固定旋律 —— 同一首歌每次聽起來都一樣,但當然猜不出是哪首歌。
它的用途是讓你**先測試流程與手感**(12 秒夠不夠、九格好不好按、計分爽不爽),不是拿來當題目。

## Apple 官方試聽

`tools/fetch-previews.js` 用 Apple 公開的 iTunes Search API 查出每首歌的試聽網址,寫進 `previews.js`。
**只存網址,音檔不落地** —— 遊戲執行時直接串流 Apple 的伺服器。

```bash
node tools/fetch-previews.js                   # 只補還沒有的
node tools/fetch-previews.js --force           # 全部重抓
node tools/fetch-previews.js --only daoxiang   # 只抓指定的(逗號分隔)
node tools/fetch-previews.js --country JP      # 換商店地區(預設 TW)
node tools/fetch-previews.js --delay 3000      # 放慢(API 約 20 次/分鐘)
```

### 換歌之後一定要做的事

改了 `songs.js` 就要重跑一次抓取,而且**要看報告**。實際跑下來,200 首裡有 5 首出問題,全部都是「台灣 Apple Music 沒有那個版本」造成的:

| 狀況 | 例子 | 怎麼處理 |
|---|---|---|
| 商店用字不同 | 「你是我的花朵」商店寫「妳是我的花朵」 | 改 `songs.js` 的字,重抓 |
| 只有 Remix / 演奏版 | 葉啟田「愛拚才會贏」只有 DJ Remix | 換一首歌 |
| 只有音樂盒 / 卡拉OK版 | 「残酷な天使のテーゼ」只有音樂盒版 | 換一首歌 |
| 整首沒上架 | 玖壹壹「癡情玫瑰花」、魏如萱「別問很可怕」 | 換同歌手的其他歌(後者換成「你啊你啊」) |

最後兩種最危險 —— **音樂盒版和卡拉OK版會照樣抓下來、照樣播,但玩家根本認不出是哪首歌**。腳本會把它標成 `low`,所以報告不能不看。

抓完**一定要看 `conf` 是 `low` 的那幾首**,很可能配錯歌。配錯的話有兩種修法:

- 直接編輯 `previews.js` 裡那首的 `url`
- 或把 `songs.js` 的歌名改精確一點,再 `--only <id>` 重抓

每首還有一個 `offset` 欄位(預設 0)。試聽片段如果從不夠好認的地方開始,可以填秒數往後挪。

### 兩個要注意的地方

**條款**:iTunes Search API 是公開的,但條款原意是為了推廣 iTunes 商店的內容。拿來當猜歌題庫屬於灰色地帶,所以這裡刻意做成「執行時串流、不下載存檔」,盡量貼近它原本的用途。這是社團自己承擔的判斷。

**現場網路**:走串流代表**攤位每一題都要連得上網**。校園 Wi-Fi 不穩的話會直接卡住遊戲。正式擺攤前務必在現場實測;真的不穩就改用本地音檔(第 1 條路),那才是攤位最保險的做法。

---

## 題庫架構

題庫分成兩池,**遊戲裡沒有任何分類選單,玩家看不到分類**:

| 檔案 | 內容 | 需要音源? |
|---|---|---|
| `songs.js` | 200 首,會被抽成題目 | 要 |
| `decoys.js` | 743 首,只當九宮格的干擾選項 | 不用 |

九宮格的九個選項從「`songs.js` + `decoys.js`」合起來的池子抽。干擾項不需要音檔,所以可以放很多 —— 這樣重玩很多次也不會一直看到同一批選項。

### songs.js

```js
{ id: "daoxiang", title: "稻香", artist: "周杰倫", genre: "mando" }
```

- `id` 是所有東西的鑰匙:音檔檔名 `audio/<id>.m4a`、`previews.js` 的對應都靠它
- `genre` 玩家完全看不到,但有兩個用途:
  1. **決定每局的曲風配額**(見下面的 `CONFIG.quota`)
  2. **挑干擾項** —— 華語歌的九宮格要配華語的干擾項,不然混進一堆英文歌名,用刪去法就猜到了,九選一的難度會垮
  - `mando` 華語現代 · `classic` 華語經典 · `tw` 台語 · `kpop` 韓語 · `west` 西洋 · `jp` 日文
- `title` 直接顯示在九宮格上,程式會依長度自動縮字級(中文 6/9/11 字、英文 9/14/20 字三段)

### decoys.js

由 `tools/build-decoys.js` 從 iTunes 商店自動撈,**歌名和歌手都是 Apple 回傳的原值,不靠人工記憶**:

```bash
node tools/build-decoys.js                  # 重建干擾庫
node tools/build-decoys.js --per 12         # 每位歌手多撈幾首
```

歌手名單寫在腳本最上面的 `ARTISTS`,依 genre 分組。要加歌手就加在那裡。已經在 `songs.js` 裡的歌會自動排除,不會同時是答案和干擾項。

顯示時程式會把「(電影《⋯》主題曲)」這類副標去掉 —— 答案的歌名是手寫的、本來就乾淨,干擾項來自商店常帶副標,兩邊不統一的話玩家會發現「沒有括號的那格就是答案」。

## 調難度

`index.html` 最上面的 `CONFIG`:

```js
questionCount: 10,                          // 每局題數
quota: { mando: 5, classic: 1, tw: 1 },     // 保底配額
foreignMin: 1,                              // 非中文保底題數
timeLimit: 12,        // 每題秒數 ← 實測後最可能改這個
baseScore: 300,       // 答對底分
speedScore: 700,      // 速度分上限
prizeScore: 8000,     // 兌獎門檻
```

**抽題分三步**:先照 `quota` 抽保底配額(7 題)→ 再從韓/西洋/日文混在一起抽 `foreignMin` 題
→ 剩下的名額從 200 首裡隨機補滿 `questionCount`。

第三步的池子包含非中文,所以**非中文保證至少 1 題,但常常不只 1 題**。跑 20,000 局的實際分布:

| 每局非中文題數 | 1 | 2 | 3 |
|---|---|---|---|
| 出現機率 | 59% | 36% | 5% |

平均 1.46 題。想讓非中文更常出現就調高 `foreignMin`,或把 `quota` 的華語配額減掉一些
(第三步的自由名額變多,非中文的機會就跟著變多)。`quota` 加總 + `foreignMin` 不要超過
`questionCount`,超過的話後面的保底會被擠掉。

得分公式:`300 + 700 × (剩餘秒數 ÷ 12)`,每題滿分 1,000,10 題滿分 **10,000**。
秒答約 995,用掉 6 秒約 650,拖到最後約 300,答錯 0。

門檻 8000 分約需「十題全對且平均 3.4 秒內作答」,或「九題全對且平均 1.9 秒內」。
八題全對就算每題秒答也只有約 8,000 的邊緣 —— 這是刻意設得很嚴的門檻。

| 門檻 | 全對時每題要多快 | 答對 9 題要多快 |
|---|---|---|
| 8,888 | 1.9 秒 | 不可能 |
| **8,000** | **3.4 秒** | **1.9 秒** |
| 7,000 | 5.1 秒 | 3.8 秒 |
| 6,250 | 6.4 秒 | 5.2 秒 |
| 5,000 | 8.6 秒 | 7.6 秒 |

覺得兌獎率太低就把 `prizeScore` 往下調,改一個數字即可,稱號不會受影響。

### 稱號

稱號是**另一張表**,跟兌獎門檻各走各的。文字寫在 `index.html` 的 `TITLES`,由上往下比,
第一個「分數 >= min」的就是結果;`line` 是稱號底下那句話,想留白就寫空字串。

| 分數 | 稱號 | 結語 |
|---|---|---|
| 8,000+ | 流唱社之光 | 拜託你來我們流唱社當教學啦! |
| 6,767+ | 金曲點唱機 | 來流唱社你一定會找到很多志同道合喜歡聽歌的朋友! |
| 5,000+ | 移動 KTV | 快要拿到獎品了,要不要來參加流唱社! |
| 3,000+ | 持續聽歌中 | 來流唱社一定會大大增加你的曲庫~~ |
| 0+ | 聽歌小萌新 | 沒關係,來流唱社聽一年就會了 |

---

## 接排行榜(下一步)

現在 `Store` 這個物件把分數寫在 localStorage,所以**每支手機看到的榜都不一樣**。
正式版要換成 Supabase,只要改 `Store` 的三個方法,其他程式碼都不用動。

1. 開一個 Supabase 專案,建 `scores` 資料表:

```sql
create table scores (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  score int not null,
  correct int not null,
  device_id text,
  created_at timestamptz default now()
);

alter table scores enable row level security;
create policy "anyone can insert" on scores for insert to anon with check (true);
create policy "anyone can read"   on scores for select to anon using (true);
-- 不開 update / delete,金鑰外流也改不了既有分數
```

2. 把 `Store.submit` 改成 `insert`、`Store.ranked` 改成 `select ... order by score desc limit 20`。
3. 想要即時更新,再訂閱 Realtime channel。

**待辦**:`board.html`(攤位螢幕用的全螢幕榜)、`staff.html`(刪除不當暱稱、清除異常分數)。
這兩頁要等接上伺服器才有意義 —— 現在做只會顯示那台電腦自己的分數。

---

## 檔案

```
index.html                遊戲本體(HTML + CSS + JS 全在裡面)
songs.js                  題庫 200 首(手工維護)
decoys.js                 干擾選項庫(自動產生)
previews.js               官方試聽網址(自動產生)
assets/theme.png          社團主視覺,當背景用
audio/                    本地音檔放這裡,放了就會蓋過串流
tools/fetch-previews.js   抓試聽網址
tools/build-decoys.js     建干擾選項庫
tools/make-clips.ps1      把自有音樂檔剪成 15 秒片段
tools/clips.csv           剪輯清單
```

自動產生的三個檔案裡,`previews.js` 和 `decoys.js` 可以手動微調單一項目(腳本預設不會覆蓋既有內容),但別整檔重寫。
