<?php
// このファイルを config.php にコピーし、Annict の個人アクセストークン(read)を設定してください。
// トークン発行: https://annict.com/settings/apps
// ※ config.php はサーバ上にのみ置き、Git やアプリのバンドルには絶対に含めないこと。
//   （PHP ソースは Web で直接表示されないため、ここに置いてもブラウザには漏れません）
define('ANNICT_TOKEN', 'ここに Annict の個人アクセストークンを貼る');
