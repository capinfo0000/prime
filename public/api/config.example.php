<?php
// このファイルを config.php にコピーし、値を設定してください。
// ※ config.php はサーバ上にのみ置き、Git やアプリのバンドルには絶対に含めないこと。
//   （PHP ソースは Web で直接表示されないため、ここに置いてもブラウザには漏れません）

// 必須：Annict の個人アクセストークン(read)。 発行: https://annict.com/settings/apps
define('ANNICT_TOKEN', 'ここに Annict の個人アクセストークンを貼る');

// 推奨：自分の公開URL。設定するとこのサイト以外からの呼び出しを拒否する（オープンプロキシ悪用の防止）。
// 例: define('ALLOWED_ORIGIN', 'https://example.com');
define('ALLOWED_ORIGIN', '');

// 任意：1分あたりの許可リクエスト数（IP単位）。0で無効。既定60。
define('RATE_LIMIT_PER_MIN', 60);
