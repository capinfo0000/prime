# フェーズ0：技術検証メモ（進行中）

対象シーズン：2026-summer（検証日 2026-07-06）

## 0-2. AniList（トークン不要）— 実行済み ✅

`spikes/anilist-query.json` を `https://graphql.anilist.co` に投げ、`spikes/analyze-anilist.mjs` で集計。

| 項目 | 結果 | 評価 |
|---|---|---|
| 今期(Summer2026) TVアニメ一覧 | 取得可（total 5000, 1ページ50件, ページング可） | ✅ 一覧ソースになる |
| `nextAiringEpisode`（次回話数・放送日時） | **50/50 で取得可** | ✅ **更新曜日/次回更新の有力ソース**（ただし"放送"基準） |
| `streamingEpisodes` | 0/50 | ❌ ほぼ空 |
| Amazon/Prime 配信リンク(`externalLinks`) | **3/50 のみ**、URLは大半 amazon.**com**(US) | ❌ **日本のPrime判定には使えない** |
| STREAMING サイト内訳 | Crunchyroll 40 / YouTube 14 / Bilibili 14 / Netflix 5 / Amazon 3 … | 海外配信中心 |

**結論：** AniList は「シーズン一覧」と「次回放送日（＝更新曜日の proxy）」には有用。
ただし配信リンクは**海外中心で日本Primeの判定に不適**。→ **日本のPrime配信判定は Annict が必須**。

## 0-1. Annict（トークン必須）— スクリプト準備済み・実行待ち ⏳

- 認証確認：トークン無しで `searchWorks` を叩くと **HTTP 401 `Not authorized`**。→ 個人アクセストークン(read)が必須。
- 準備済み：`spikes/annict-query.json`（searchWorks: 2026-summer, WATCHERS_COUNT DESC, programs＋channel＋episode）、
  `spikes/run-annict.sh`（トークンで実行）、`spikes/analyze-annict.mjs`（Prime判定・横断チャンネル・更新曜日粒度を集計）。
- **実行方法**：`.env` に `ANNICT_TOKEN=xxxx` を書く → `bash spikes/run-annict.sh`
- **確認したいこと**：
  - (a) 各作品が **どの配信サービス(channel)にあるか** を横断で取れるか
  - (b) **「Amazonプライム」で絞り込めるか**（＝Primeフィルタの成否）
  - (c) **話数レベルの更新曜日/次回更新日** の粒度・網羅性

## 0-3. 視聴リンク（タップで飛ぶ）— 実機検証待ち ⏳

- 直リンク候補：`https://www.amazon.co.jp/gp/video/detail/<ASIN>`／検索フォールバック：`.../gp/video/search/?phrase=<title>`。
- AniList の Amazon URL は US(amazon.com)で日本アプリ起動には不適 → **日本のASIN or 検索フォールバック**前提。
- iPhone 実機で「アプリが開くか／Safari に落ちるか」の確認が必要（この環境では不可）。

## 暫定の設計示唆
- **データ主軸 = Annict**（日本Prime判定・横断availability）。**AniList = 次回更新日(曜日)の補完**。
- 視聴リンクは**検索フォールバックを既定**に、日本ASINが取れる作品のみ直リンク。
