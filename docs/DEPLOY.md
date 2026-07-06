# デプロイ手順 — CORESERVER（無料で Web版/PWA を公開）

App Store（年 $99）を使わず、契約済みの **CORESERVER**（PHP対応の共有サーバー）で
Web版（PWA）として無料公開する手順。トークンはサーバ側の PHP プロキシに置き、Web バンドルには含めない。

## 仕組み
- アプリ本体：Expo の Web 静的書き出し（`dist/`）＝ HTML/JS/CSS。
- データ取得：ブラウザ → 同一ドメインの **`/api/annict.php`**（トークンを付与して Annict に転送）。
  - Web バンドルにはトークンを入れない（`npm run build:web` は `.env` を読み込まない設定）。

## 前提
- CORESERVER で **PHP 7.4+ / cURL 拡張** が有効（標準で有効）。
- 独自ドメイン or サブドメインの公開ディレクトリ（例 `public_html/`）にアップロードできる。
- ここでは **ドメイン直下**に置く前提（サブフォルダ配置は末尾の注記参照）。

## 手順

### 1. Web をビルド
```
npm install
npm run build:web
```
→ `dist/` が生成される。`dist/` には以下が含まれる：
- `index.html` ほか各画面の HTML、`_expo/`（JS/CSS）、`assets/`
- `.htaccess`（ルーティング）
- `api/annict.php`（プロキシ）、`api/config.example.php`、`api/.htaccess`

> ✅ 安全確認：ビルド後、`dist/` にトークン文字列が**含まれない**こと（`npm run build:web` は `--clear` と
> `EXPO_NO_DOTENV=1` でトークンをバンドルに入れない）。

### 2. アップロード
`dist/` の**中身すべて**を、CORESERVER の公開ディレクトリ（例 `public_html/`）に FTP / ファイルマネージャで転送。
- 結果：`https://あなたのドメイン/` にアプリ、`https://あなたのドメイン/api/annict.php` にプロキシが配置される。

### 3. トークンを設定（サーバ上でのみ）
サーバ上の `api/` にある `config.example.php` を **`config.php`** にコピーし、Annict トークンを設定：
```php
<?php
define('ANNICT_TOKEN', 'あなたの Annict 個人アクセストークン(read)');
```
- Annict トークン発行：https://annict.com/settings/apps
- `config.php` は**サーバにだけ**置く（Git/バンドルには入れない。`.gitignore` 済み）。
- PHP ソースはブラウザに表示されないため、ここにトークンを置いても漏れない（`.htaccess` でも直接アクセス拒否）。

### 4. 動作確認
- `https://あなたのドメイン/` を開く → 今期プライム配信アニメの一覧が出る。
- 出ない場合：ブラウザの開発者ツール Network で `/api/annict.php` の応答を確認
  （401=トークン不正、500=config.php 未設置/空、200=OK）。

### 5. iPhone で「アプリ化」
Safari で開く → 共有 → **「ホーム画面に追加」** → アイコンがホームに並ぶ（アプリ風に起動）。

## 注意・既知の制約
- **更新通知**：Web版では iOS の通知が制限される（ネイティブほど確実でない）。確実な通知が要る場合は将来ネイティブ版（App Store）で。
- **サブフォルダ配置**（`https://ドメイン/anime/` 等）にする場合は、`app.json` の
  `expo.experiments.baseUrl` を `"/anime"` に設定してから `npm run build:web` し、`.htaccess` のパスも調整する。
- **視聴リンク**：Prime はタイトル検索で開く（`primeWatchUrl`）。アプリが開くか等は実機で確認。
- **キャッシュ**：`api/annict.php` は 30分の CDN/ブラウザキャッシュを付与（配信情報は頻繁に変わらないため）。

## まとめ（最短）
```
npm install
npm run build:web
# dist/ の中身を CORESERVER の public_html にアップロード
# サーバ上で api/config.example.php → api/config.php を作り、トークンを記入
# https://ドメイン/ を開く → 完了
```
