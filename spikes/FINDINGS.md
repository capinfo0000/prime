# フェーズ0：技術検証メモ（完了 → GO）

対象シーズン：2026-summer（検証日 2026-07-06）

## 結論：GO ✅
Annict だけで「横断availability ＋ Primeフィルタ ＋ 更新曜日/話数別配信日」を満たせることを実データで確認。
AniList は MVP には必須でない（更新日は Annict の startedAt で十分）。

## 0-1. Annict（トークン必須）— 実行済み ✅
`bash spikes/run-annict.sh`（`searchWorks` 2026-summer, WATCHERS_COUNT DESC, 50件）

| 確認項目 | 結果 |
|---|---|
| 認証 | 個人アクセストークン(read)で HTTP 200 |
| Primeフィルタ | **12/50 作品**が「Amazon プライム・ビデオ」配信 → 絞り込み成立 ✅ |
| 横断 availability | dアニメ(420)/TOKYO MX/ABEMA/AT-X/U-NEXT/バンダイ/**Amazonプライム(120)**/DMM/Hulu 等、豊富に取得 ✅ |
| 更新曜日 | Prime作品ごとに一貫した曜日を startedAt から導出可（例:「ここは俺に任せて…」=金曜） ✅ |
| 話数別配信日 | クール作品は Prime program が14件（7〜10月の週次）＝話数レベルの配信日あり ✅ |

### 実装上の重要な注意（確定事項）
1. **`Program.episode` は取得しない**：Annict のスキーマで non-null 必須なのに null を返し、クエリ全体が
   `Cannot return null for non-nullable field Program.episode` エラーになる。
   → **話数は `startedAt` の昇順の並び順で導出**（`src/lib/schedule.ts`）。
2. **`episodesCount`（全N話）は新番組では不正確**（"全1話"等）→ 表示は program 件数/並びベースで判断。
3. **movie(劇場版)も混ざる**：`searchWorks` は MOVIE 等も返す → 一覧は `media: 'TV'` で絞る（`toWorkCards({mediaTypes:['TV']})`）。
4. Work の `id` は Relay グローバルID（例 `V29yay04NDEw`）。ルーティングにそのまま使用可。
   アプリの実クエリ（`src/api/annict.ts`）はライブで **errors:0** を確認済み。

## 0-2. AniList（トークン不要）— 実行済み ✅（補完扱い）
- シーズン一覧・`nextAiringEpisode`（次回放送）は 50/50 取得可。
- ただし配信リンクは海外中心（Amazon/Prime は 3/50・URLは amazon.com）→ **日本Prime判定には不適**。
- 位置づけ：MVP では不使用。将来、放送基準の次回時刻や直リンク補完に使える余地あり。

## 0-3. 視聴リンク（タップで飛ぶ）— 方針確定・実機確認は残タスク ⏳
- Prime の安定したディープリンクは業界的に不安定（Amazon が2023年に無効化）。
- 方針：`primeWatchUrl(title)` = `https://www.amazon.co.jp/gp/video/search/?phrase=<title>`（検索フォールバックを既定）。
  日本ASINが取れる作品のみ `/gp/video/detail/<ASIN>` の直リンク（現状ASIN源が無いため保留）。
- 残タスク：iPhone 実機で「アプリが開くか／Safari に落ちるか」を確認（この環境では不可）。

## 確定した設計
- データ主軸 = **Annict**（横断＋Primeフィルタ＋更新曜日/配信日）。AniList/TMDB は将来の補完。
- 話数は配信日の並び順で導出。一覧は TV に限定。視聴は検索フォールバック。
