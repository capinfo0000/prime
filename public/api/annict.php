<?php
// Annict GraphQL プロキシ（CORESERVER 等の共有サーバー・PHP用）
// Web(PWA) からトークンを隠しつつ、"オープンプロキシ化" を防ぐための対策を実装。
//
// セットアップ:
//   1) config.example.php を config.php にコピーし、ANNICT_TOKEN（read）を設定
//      （任意）ALLOWED_ORIGIN に自分の公開URL（例 'https://example.com'）を設定すると
//      そのサイトからのリクエストだけに制限できる（推奨）。
//   2) この api/ フォルダごと Web 公開ディレクトリにアップロード
// 要件: PHP 7.4+ / cURL

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function deny(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

// --- メソッド ---
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    deny(405, 'Method Not Allowed');
}

// --- 設定読み込み ---
$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    deny(500, 'Server not configured');
}
require $configPath; // ANNICT_TOKEN、任意で ALLOWED_ORIGIN / RATE_LIMIT_PER_MIN
if (!defined('ANNICT_TOKEN') || ANNICT_TOKEN === '') {
    deny(500, 'Server not configured');
}

// --- オリジン制限（設定時のみ）---
if (defined('ALLOWED_ORIGIN') && ALLOWED_ORIGIN !== '') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $ok = ($origin !== '' && strpos($origin, ALLOWED_ORIGIN) === 0)
        || ($referer !== '' && strpos($referer, ALLOWED_ORIGIN) === 0);
    if (!$ok) {
        deny(403, 'Forbidden');
    }
}

// --- ボディサイズ制限（8KB）---
$raw = file_get_contents('php://input');
if ($raw === false || $raw === '' || strlen($raw) > 8192) {
    deny(400, 'Bad Request');
}

// --- JSON 検証 ---
$payload = json_decode($raw, true);
if (!is_array($payload) || !isset($payload['query']) || !is_string($payload['query'])) {
    deny(400, 'Bad Request');
}
$query = $payload['query'];

// --- クエリ検査（許可: 読み取りの searchWorks のみ）---
// 危険な操作（書き込み・アカウント情報・イントロスペクション）を遮断してトークン悪用を防ぐ。
$lower = strtolower($query);
$forbidden = ['mutation', 'subscription', 'viewer', 'currentuser', '__schema', '__type', 'createrecord', 'updatestatus', 'deleterecord', 'oauth', 'token'];
foreach ($forbidden as $bad) {
    if (strpos($lower, $bad) !== false) {
        deny(403, 'Query not allowed');
    }
}
if (strpos($lower, 'searchworks') === false) {
    deny(403, 'Query not allowed');
}

// --- 簡易レート制限（IP 単位・固定ウィンドウ）---
$limit = defined('RATE_LIMIT_PER_MIN') ? (int) RATE_LIMIT_PER_MIN : 60;
if ($limit > 0) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $bucket = sys_get_temp_dir() . '/annictproxy_' . md5($ip);
    $now = time();
    $window = 60;
    $count = 0;
    $start = $now;
    if (is_readable($bucket)) {
        $data = @json_decode((string) file_get_contents($bucket), true);
        if (is_array($data) && isset($data['start'], $data['count']) && ($now - $data['start']) < $window) {
            $start = $data['start'];
            $count = (int) $data['count'];
        }
    }
    $count++;
    @file_put_contents($bucket, json_encode(['start' => $start, 'count' => $count]), LOCK_EX);
    if ($count > $limit) {
        header('Retry-After: ' . ($window - ($now - $start)));
        deny(429, 'Too Many Requests');
    }
}

// --- 転送 ---
$ch = curl_init('https://api.annict.com/graphql');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $raw,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . ANNICT_TOKEN,
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
]);
$resp = curl_exec($ch);
if ($resp === false) {
    curl_close($ch);
    deny(502, 'Upstream error');
}
$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header('Cache-Control: s-maxage=1800');
http_response_code($code ?: 200);
echo $resp;
