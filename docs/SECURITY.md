# セキュリティ対策

このアプリ（Web版/PWA + PHPプロキシ）で実施しているセキュリティ対策と、公開前のチェックリスト。

## ⚠️ 最優先：Annict トークンのローテーション

開発中に Annict トークンをチャット/スクリーンショットで共有したため、**そのトークンは漏洩扱い**です。
**公開前に必ず失効・再発行してください**：
1. https://annict.com/settings/apps で既存トークンを**削除**
2. 新しい個人トークン（read スコープ）を発行
3. サーバの `api/config.php` の `ANNICT_TOKEN` を新トークンに更新
（トークンは read 専用なので影響は限定的ですが、念のため必ず入れ替える）

## 実施済みの対策

### 1. トークンをクライアントに出さない
- Web バンドルにトークンを埋め込まない（`npm run build:web` は `EXPO_NO_DOTENV=1 --clear`）。
  ビルドのたびに `dist/` にトークン文字列が含まれないことを確認済み。
- ブラウザ → 同一オリジンの **PHPプロキシ `/api/annict.php`** 経由で Annict にアクセス。
  トークンはサーバの `config.php` にのみ存在（`.gitignore` 済み・`.htaccess` で直アクセス拒否）。

### 2. プロキシの"オープンプロキシ化"防止（`api/annict.php`）
- **許可クエリのみ**：`searchWorks`（読み取り）以外を拒否。`mutation` / `subscription` /
  `viewer` / `currentUser` / `__schema`・`__type`（イントロスペクション） / 各種書き込み・`oauth`/`token` を含む
  クエリを遮断 → **アカウント情報の露出や書き込み・トークン悪用を防ぐ**。
- **オリジン制限**：`config.php` の `ALLOWED_ORIGIN` に自サイトURLを設定すると、そのサイト以外からの呼び出しを 403。
- **レート制限**：IP 単位・1分あたり既定60回（`RATE_LIMIT_PER_MIN`）。超過は 429。
- **サイズ制限**：リクエストボディ 8KB 上限。
- **メソッド制限**：POST のみ。エラーメッセージは汎用（内部情報を出さない）。

### 3. 外部データ由来 URL の安全化
- Annict 由来の `officialSiteUrl` 等は `src/lib/url.ts` の `safeOpenUrl()` で **http/https のみ**開く
  （`javascript:` / `data:` 等を遮断）。

### 4. セキュリティヘッダ（`.htaccess`）
- **Content-Security-Policy**（`default-src 'self'`、通信は同一オリジンのみ、画像は https、object-src none、
  frame-ancestors none 等）
- `X-Content-Type-Options: nosniff` / `X-Frame-Options: DENY`（クリックジャッキング防止）
- `Referrer-Policy` / `Permissions-Policy` / `Strict-Transport-Security`（HSTS）

### 5. 秘匿ファイルの保護
- `.env` / `api/config.php` は `.gitignore` 済み（リポジトリに含めない）。
- `.htaccess` で `.env` と `config.php` への直接アクセスを拒否。

## 公開前チェックリスト
- [ ] **Annict トークンを再発行**して `config.php` に設定（漏洩済みトークンは失効）
- [ ] `config.php` の `ALLOWED_ORIGIN` に本番URLを設定
- [ ] HTTPS を有効化（CORESERVER の無料SSL）。HSTS が効く
- [ ] `dist/` にトークンが無いことを確認：`grep -r "（トークンの一部）" dist`（0件）
- [ ] `api/config.php` がブラウザから見えないことを確認（`/api/config.php` にアクセス→403/空）
- [ ] `/api/annict.php` に `viewer` クエリを投げて 403 になることを確認（任意）

## 既知の限界
- 共有サーバーのレート制限はファイルベースの簡易実装（多重防御の一つ）。厳密な保護が必要なら WAF/CDN を併用。
- CSP は Expo Web の都合で `script/style` に `'unsafe-inline'` を許容（完全な nonce 化はビルド連携が必要）。
- クライアント同梱の性質上、プロキシは「自サイトからの正当な利用」を前提とする（ALLOWED_ORIGIN＋レート制限で悪用を抑制）。
