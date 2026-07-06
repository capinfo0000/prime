# アニメどこ見れ（prime-anime）

今期（今シーズン）の新作 TV アニメを、**配信サービス別に絞り込んで**一覧できる iOS アプリ。
「Amazon プライム・ビデオで配信中の今期アニメだけ」を、**更新曜日・話数別の配信日**つきで表示し、
タップで視聴サービスを開く。ドラマ・映画・過去アニメが混在して探しにくいプライムビデオの不満を解消する。

＝ **「JustWatch のアニメ特化・日本語版」**（多配信横断 × サービスフィルタ × 更新スケジュール）。

## 技術スタック
- React Native + Expo（TypeScript, Expo Router）
- データ：[Annict GraphQL API](https://developers.annict.com/)（今期アニメ × 配信チャンネル）

## セットアップ
1. Annict の個人アクセストークン（read）を発行：https://annict.com/settings/apps
2. `.env` を作成（`.env.example` 参照）:
   ```
   ANNICT_TOKEN=xxxx
   EXPO_PUBLIC_ANNICT_TOKEN=xxxx
   ```
3. 依存インストール：`npm install`
4. 起動：`npx expo start` → iOS シミュレータ（`i`）または実機の Expo Go

## スクリプト
- `npm test` … ロジックのユニットテスト（season/services/schedule/workCard）
- `npm run typecheck` … 型チェック
- `npm run spike:annict` … Annict 実データ検証（`.env` の ANNICT_TOKEN 使用）
- `npm run spike:anilist` … AniList 検証（トークン不要）

## 構成
```
app/                 画面（Expo Router）
  index.tsx          一覧（今期TV・サービスフィルタ・更新曜日）
  work/[id].tsx      詳細（各話配信日・視聴導線・お気に入り）
src/
  api/annict.ts      Annict GraphQL クライアント
  lib/season.ts      日付→シーズン("2026-summer")
  lib/services.ts    channel→配信サービス正規化・Prime判定・視聴URL
  lib/schedule.ts    programs→最新話/次回更新/更新曜日（話数は配信日順で導出）
  lib/workCard.ts    生データ→画面用カード（サービス絞り込み・TV限定）
  lib/favorites.ts   お気に入り（AsyncStorage）
  lib/notifications.ts 更新通知（expo-notifications）
spikes/              フェーズ0 技術検証（FINDINGS.md に結論）
```

## 設計上のメモ
- Annict の `Program.episode` は取得しない（non-null 違反エラーになるため）。話数は配信日の並び順で導出。
- 一覧は `media: 'TV'` に限定（劇場版などを除外）。
- Prime 視聴はタイトル検索で開く（Prime の直リンクは不安定なため）。
- クライアント同梱トークンは個人用途では許容。公開配布時は軽量プロキシ経由に切り替える想定。

## 引き継ぎ / 経緯

別環境で開発を続けるための完全な記録（背景・意思決定・調査・技術検証・残タスク・チャット経緯）は
**[`docs/HANDOFF.md`](docs/HANDOFF.md)** にまとめています。まずはこれを読めば全体を把握できます。

## ステータス
- ✅ フェーズ0（技術検証）：Annict で Primeフィルタ・横断・更新曜日が取れることを実データで確認（`spikes/FINDINGS.md`）
- 🚧 フェーズ1（MVP）：一覧／詳細／お気に入り／更新通知を実装。実機での起動確認とプライム視聴リンクの実機テストが残タスク
