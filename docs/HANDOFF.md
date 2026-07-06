# 引き継ぎドキュメント — アニメどこ見れ（prime-anime）

> このファイルは、別環境（自分のPC/実機）で開発を続けるための完全な記録です。
> 経緯・意思決定・調査結果・技術検証・実装状態・残タスク・チャットの流れを1つにまとめています。
> 最終更新: 2026-07-06 / ブランチ: `claude/prime-video-anime-filter-mqekg2`

---

## 0. 一言サマリー

**「今期プライムビデオで配信中の新作アニメだけを、更新曜日つきで一覧できる iOS アプリ」**。
Prime はドラマ・映画・過去アニメが混在して今期新作が探しにくい、という課題を解決する。
＝「JustWatch のアニメ特化・日本語版」（多配信横断 × サービスフィルタ × 更新スケジュール）。

- 技術：React Native + Expo（TypeScript, Expo Router）
- データ：Annict GraphQL API（今期アニメ × 配信チャンネル）
- デザイン：getdesign.md の linear.app（ダーク＋ラベンダー単一アクセント）
- 目標：App Store 公開（ゆくゆく）／まずは自分の iPhone で動かす

---

## 1. 背景・目的（なぜ作るか）

ユーザーは dアニメストア から Amazon プライムビデオに乗り換えたばかり。プライムビデオは
ドラマ・映画・過去アニメが混在し、「今期の新作アニメで、どれがプライムで配信され、いつ更新されるか」
が非常に分かりにくい。これを一目で分かるようにする専用アプリを作る。

---

## 2. 意思決定ログ（ユーザーの選択）

| # | 論点 | 決定 |
|---|---|---|
| 1 | 成果物の形態 | **iOS アプリ**（動画へリンクで飛べる） |
| 2 | データ取得 | **公開アニメDBで抽出**（自分のPrimeアカウントは読まない） |
| 3 | 技術スタック | **React Native + Expo** |
| 4 | コンセプト深化 | 「リンクで配信に飛ぶ」横断ガイド＝**アニメ版JustWatch** ＋ **Prime等でフィルタ** |
| 5 | 配布形態 | **App Store 公開を目指す**（審査対策を内蔵） |
| 6 | 進め方 | **技術検証（フェーズ0）を先に** |
| 7 | 表紙画像 | **画像あり**（無い作品はモノグラムにフォールバック） |
| 8 | 権利対策 | **出典明記＋可能な限りの対策**（copyright表記・公式リンク・クレジット画面・削除要請窓口） |
| 9 | 連絡先 | 削除要請窓口 = `ai.asset.lab1@gmail.com` |
| 10 | 公開方法 | **お金を払わず公開** → **Web版(PWA) を CORESERVER（契約済み共有サーバー）で公開**。App Store($99)は当面見送り |

---

## 3. 競合調査（ディープリサーチの結論）

- 視聴管理型の日本アプリ（**AniHub / あにろぐ！/ AniStack**）はすべて Annict ベースで、
  「配信サービス別フィルタ」も「配信更新スケジュール」も持たない。
- 「リンクで配信に飛ぶ」横断ガイドは実在：
  - **JustWatch** … 全配信横断・映画/ドラマ中心・Prime限定に絞れない。
  - **LiveChart.me** … アニメ特化でスケジュール＋通知＋配信リンクありだが、世界基準・Prime日本限定フィルタ無し・日本語/iOS弱い。
- 同種の「Prime×今期」情報は無料Webサイト（animephilia.net / programming-cafe.com）が手動提供。
- **残る空白**：「日本のPrimeで見られる今期新作アニメだけを、日本の更新曜日で、日本語・iOSで」に最適化した
  ものが無い。→ 市場は"空白"ではなく"**未最適化のニッチ**"。差別化は「この特化＋アプリ体験（通知・タップ視聴・パーソナライズ）」。

### JustWatch 分析から得た設計判断
- JustWatch の堀は「全配信の availability を自前クロールで集めること」。**アニメに限れば Annict が既に横断保有**
  （dアニメ/Netflix/Prime/U-NEXT/FOD/Hulu/Disney+/Crunchyroll/DMM TV 等）→ 最大の労力をスキップできる。
- JustWatch の収益は実質「データ販売＋B2B広告」。個人がアプリ単体で稼ぐのは困難。
- **ディープリンクは業界的に不安定**（Amazon は 2023 年に deep linking を無効化）。JustWatch でも Prime 直リンクは苦戦。
  → 本アプリは「Prime のタイトル検索を開く」フォールバックが現実解。
- TMDB Watch Providers API は JustWatch データを無料提供するが、**ディープリンクは返さず**、アニメ×日本×話数更新は弱い。

### App Store 審査リスク（最重要・要対策）
- Guideline **4.2 / 4.2.2**（「アグリゲーター・リンク集」認定）でリジェクトされ得る。審査官の主観依存で不確実。
  → **デバイス固有機能（更新通知・お気に入り・ウィジェット）を内蔵**し「単なるリンク集ではない」ことを示す。
- Guideline **5.2.2**（第三者サービス許諾）／**5.2**（IP）遵守。提出のたびに独自価値の説明資料を添付。

---

## 4. 技術検証（フェーズ0）の結論 → GO

詳細は `spikes/FINDINGS.md`。要点：

- **AniList**（トークン不要）：今期一覧・`nextAiringEpisode` は取れるが、**日本 Prime の配信判定は不可**
  （Amazon/Prime リンクは 50件中3件・URLは米国 amazon.com）。→ MVP では不使用。
- **Annict**（トークン必須）：**GO**。
  - Prime フィルタ成立：今期 TV アニメで **Prime配信は21本**（全media では23本／今期アニメ全体は109作品）。
  - 横断 availability 豊富：dアニメ/TOKYO MX/ABEMA/AT-X/U-NEXT/バンダイ/**Amazonプライム**/DMM/Hulu…
  - 更新曜日・話数別配信日を `startedAt` から導出可能。
  - `officialSiteUrl` / `image.copyright`（例 `© えぞぎんぎつね・SBクリエイティブ／「ここ俺」製作委員会`）も取得可。

### 実装上の重要な注意（ハマりどころ）
1. **`Program.episode` は取得しない**：Annict のスキーマで non-null 必須なのに null を返し、
   クエリ全体が `Cannot return null for non-nullable field Program.episode` エラーになる。
   → **話数は `startedAt` の昇順の並び順で導出**（`src/lib/schedule.ts`）。
2. **`episodesCount`（全N話）は新番組では不正確** → 表示は program 件数/並びで判断。
3. **searchWorks は MOVIE 等も返す** → 一覧は `media: 'TV'` で絞る（`toWorkCards({mediaTypes:['TV']})`）。
4. Work の `id` は Relay グローバルID（例 `V29yay04NDEw`）。ルーティングにそのまま使用。
5. Node 22 の `fetch` はプロキシを自動利用しない環境がある（検証は curl 併用）。実機/Expo では通常の fetch でOK。

---

## 5. デザイン（getdesign.md / linear.app）

- getdesign.md は「実在企業の DESIGN.md（配色・タイポ・間隔・コンポーネント）」を配布するサービス。
  `npx getdesign@latest add linear.app` で `DESIGN.md` を取得（リポジトリ同梱）。
- 採用：**linear.app** の設計言語。
  - canvas `#010102` / surface `#0f1011`・`#141516` / hairline `#23252a`
  - ink `#f7f8f8`・subtle `#8a8f98` / **単一アクセント lavender `#5e6ad2`**
  - 角丸 md8(ボタン)・lg12(カード)・pill(チップ)、余白 4/8/12/16/24/32、負トラッキングの見出し
  - **ダーク単一テーマ**にコミット（Linear 原則「ライトモードを出さない」）
- トークンは `src/theme.ts` に集約。フォントは iOS 既定（SF Pro）＝ Linear の推奨フォールバック。

---

## 6. 権利・IP 対策（実装済み）

- **各作品の詳細に「出典・権利表記」ブロック**：Annict の `image.copyright`（公式権利表記）を表示、
  **公式サイト**リンク、**データ提供: Annict** リンク。
- **クレジット画面**（一覧右上 ⓘ → `app/about.tsx`）：データ提供元 Annict、著作権帰属、
  配信サービスの商標明記（**非公式アプリ**）、**削除要請の連絡先**（`ai.asset.lab1@gmail.com` へ mailto）、非商用の明記。
- **表紙画像**：各アニメ公式サイトの OGP を Annict 経由で参照（ホットリンク）。`SHOW_COVER_IMAGES` で切替可。
- 法的な位置づけ（※弁護士見解ではない）：無許諾表示は原則グレー。実務上は「削除要請→即削除」で収束するのが通常だが、
  リスクはゼロではない。最も安全なのは「公開版は画像オフ or 権利がクリアな画像のみ」。

---

## 7. 現在の実装（ファイルマップ）

```
prime/
├── app/                        画面（Expo Router）
│   ├── _layout.tsx             Stack（ダークヘッダ、about ルート登録）
│   ├── index.tsx               一覧：サービスフィルタ・TV限定・更新曜日・ⓘボタン
│   ├── work/[id].tsx           詳細：各話配信日・視聴導線・お気に入り・出典/権利表記
│   └── about.tsx               クレジット/出典/削除要請 画面
├── src/
│   ├── api/annict.ts           Annict GraphQL クライアント（fetch + Bearer）
│   ├── config.ts               トークン/画像フラグ/データ源/連絡先
│   ├── theme.ts                デザイントークン（linear.app）
│   ├── types.ts                ドメイン型
│   └── lib/
│       ├── season.ts           日付→"2026-summer"
│       ├── services.ts         channel→配信サービス正規化・Prime判定・視聴URL
│       ├── schedule.ts         programs→最新話/次回更新/更新曜日（話数=配信日順）
│       ├── workCard.ts         生データ→カード（サービス絞り込み・media絞り込み）
│       ├── store.ts            シーズン作品の取得＋キャッシュ
│       ├── favorites.ts        お気に入り（AsyncStorage）
│       └── notifications.ts    更新通知（expo-notifications）
├── spikes/                     フェーズ0 技術検証（FINDINGS.md に結論）
├── DESIGN.md                   getdesign.md(linear.app) のデザイン仕様
├── README.md / .env.example / app.json / tsconfig.json / babel.config.js
└── docs/HANDOFF.md             このファイル
```

- ロジックのユニットテスト（`src/lib/*.test.ts`）**15件 合格**、`tsc --noEmit` **クリーン**、Annict 実クエリ **errors:0**。

---

## 8. セットアップ & 続きの進め方（別環境で）

1. リポジトリを clone し、このブランチ `claude/prime-video-anime-filter-mqekg2` を checkout。
2. Annict の個人アクセストークン(read)を発行：https://annict.com/settings/apps
3. `.env` を作成（`.env.example` 参照）:
   ```
   ANNICT_TOKEN=（あなたのトークン）
   EXPO_PUBLIC_ANNICT_TOKEN=（同じ値）
   ```
   ※ `.env` は gitignore 済み。**トークンはリポジトリに含めない**。
4. `npm install`
5. 起動：`npx expo start` → iOS シミュレータ（`i`）または実機の **Expo Go**（QR）
6. 検証スクリプト：`npm test`（ロジック）／`npm run typecheck`／`npm run spike:annict`（要 .env）

---

## 8.5 無料公開（Web版/PWA・CORESERVER）

App Store（$99/年）を使わず、契約済みの **CORESERVER**（PHP対応の共有サーバー）で Web版として無料公開する。
- ビルド：`npm run build:web`（`.env` を読まず、トークンをバンドルに含めない。`dist/` を出力）
- `dist/` を CORESERVER の公開ディレクトリにアップロード
- サーバ上で `api/config.example.php` → `api/config.php` を作り Annict トークンを設定
  （トークンは PHP プロキシ `/api/annict.php` がサーバ側で付与。Webバンドルには入らない）
- iPhone は Safari で開き「ホーム画面に追加」でアプリ風に
- **詳細な手順は [`docs/DEPLOY.md`](DEPLOY.md)**
- 制約：Web版は iOS 通知が弱い／視聴リンクは実機確認推奨

## 9. 残タスク（この環境では不可＝要・実機/自環境）

1. **実機での起動確認**（Expo Go / 開発ビルド）。
2. **プライム視聴リンクの実機テスト**：`primeWatchUrl()` の検索URLをタップ → Prime アプリが開くか／Safari に落ちるか。
   - 開かない場合の代替UX（Web で該当作品ページを開く等）を検討。
   - 日本の ASIN が取れる作品は `/gp/video/detail/<ASIN>` の直リンクに（現状 ASIN 源が無く検索フォールバック）。
3. **公開前の設定確認**：`CONTACT_EMAIL`（設定済み）、`SHOW_COVER_IMAGES`（現在 true）、Bundle ID（`com.example.primeanime` を自分のものに）。
4. **App Store 公開**：Apple Developer Program 登録（年 約$99）→ EAS Build（Mac不要）→ 審査
   （4.2/4.2.2 対策として通知・お気に入り等の独自価値を説明する資料を添付）。
5. **トークンの扱い**：クライアント同梱は個人利用は可。公開配布時は露出回避のため軽量プロキシ経由に。
6. （任意）**フェーズ2**：ホーム画面ウィジェット（今日更新）、曜日別カレンダー、視聴進捗、他配信拡張。

---

## 10. チャット経緯（時系列の要約）

1. ユーザー：「dアニメからプライムに乗り換えた。今期アニメで何が更新されてるか分からない。ドラマ/映画/過去アニメが混じって分かりにくいのを改善したい」
2. 調査：リポジトリは空。データ源の当たり（Annict）を確認。3点質問 → **iOSアプリ / 公開DB抽出 / React Native+Expo** に決定。
3. `/deep-research` 実行（iOSアプリ企画＋競合＋競合優位性）。→ 市場の空白、競合一覧、Annict実現性、App Store審査リスクを把握。
4. ユーザー：「似たようなアプリある」「リンク出して動画に飛ぶやつ」「プライム限定で絞る」→ コンセプトを**アニメ版JustWatch＋Primeフィルタ**に深化。
5. JustWatch 深掘り（データはクロール中心／収益はデータ・B2B／Amazonがディープリンク無効化／TMDBが無料でJustWatchデータ提供）。
6. ユーザー：「どういう案？」→ 具体案を説明 → **OK（承認）**。方針：**App Store公開狙い＋技術検証優先**。
7. ユーザー：「iOS化できるの？」→ 可能（Mac不要・EAS Build／公開はDeveloper登録＋審査）と回答。
8. フェーズ0検証：AniList は日本Prime不可 → Annict必須。ユーザーが Annict トークンを共有（スクショ）。
9. Annict 実データで **GO**（今期Prime TV = 21本）。episode非null問題・episodesCount不正確・movie混在に対応。
10. MVP実装（libs/画面/テスト15件/型チェック）→ プッシュ。ユーザー：「何作品ある？」→ **21本**と回答。
11. デザイン：getdesign.md の **linear.app** を適用（ダーク＋ラベンダー）。当初タイトル主役。
12. ユーザー：「画像使っていい？最悪名前だけ」→ 権利を整理。「スクショで比較」「画像ありがいい」「削除要請きたら削除で罰金？」→ 法的整理＋**画像ON**に。
13. ユーザー：「出典明記＋可能な限り対策」→ copyright表記・公式リンク・クレジット画面・削除要請窓口を実装。
14. ユーザー：連絡先 `ai.asset.lab1@gmail.com` を設定。
15. ユーザー：「この環境では不可なら別でやるので全て記録して」→ 本ドキュメント作成。

### 参考リンク（調査で使用）
- Annict GraphQL: https://developers.annict.com/docs/graphql-api/beta/query ／ Channels: https://annict.com/channels
- Apple 審査ガイドライン: https://developer.apple.com/app-store/review/guidelines/
- getdesign.md: https://getdesign.md ／ TMDB Watch Providers: https://developer.themoviedb.org/reference/movie-watch-providers
- 競合: JustWatch, LiveChart.me, AniHub, あにろぐ！, animephilia.net, programming-cafe.com
- Amazon deep linking 無効化(2023): https://blog.lon.tv/2023/01/17/amazon-kills-deep-linking-impacting-plex-reelgood-and-others-on-fire-tv/
