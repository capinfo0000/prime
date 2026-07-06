<?php
// Annict GraphQL プロキシ（CORESERVER 等の共有サーバー・PHP用）
// Web(PWA) からトークンを隠すため、サーバ側でトークンを付与して Annict に転送する。
//
// セットアップ:
//   1) config.example.php を config.php にコピーし、Annict の個人アクセストークン(read)を設定
//   2) この api/ フォルダごと Web 公開ディレクトリにアップロード
//   3) config.php はサーバ上にのみ置く（Git やバンドルに含めない）
// 要件: PHP 7.4+ / cURL 拡張

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'config.php not found. Copy config.example.php to config.php and set ANNICT_TOKEN.']);
    exit;
}
require $configPath; // defines ANNICT_TOKEN

if (!defined('ANNICT_TOKEN') || ANNICT_TOKEN === '') {
    http_response_code(500);
    echo json_encode(['error' => 'ANNICT_TOKEN is empty']);
    exit;
}

$body = file_get_contents('php://input');
if ($body === false || $body === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Empty request body']);
    exit;
}

$ch = curl_init('https://api.annict.com/graphql');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . ANNICT_TOKEN,
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
]);
$resp = curl_exec($ch);
if ($resp === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Upstream request failed', 'detail' => curl_error($ch)]);
    curl_close($ch);
    exit;
}
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header('Cache-Control: s-maxage=1800');
http_response_code($code ?: 200);
echo $resp;
