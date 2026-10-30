<?php
declare(strict_types=1);

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    header('Content-Type: application/json');
    exit(json_encode(['ok' => false, 'message' => 'The site is not configured yet.']));
}
$config = require $configFile;

if (!empty($config['debug'])) {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
}
date_default_timezone_set('Africa/Lagos');

function config(string $key, $default = null)
{
    global $config;
    $value = $config;
    foreach (explode('.', $key) as $part) {
        if (!is_array($value) || !array_key_exists($part, $value)) {
            return $default;
        }
        $value = $value[$part];
    }
    return $value;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo) {
        return $pdo;
    }
    $c = config('db');
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    if ($c['driver'] === 'sqlite') {
        $fresh = !is_file($c['sqlite_path']);
        $pdo = new PDO('sqlite:' . $c['sqlite_path'], null, null, $options);
        if ($fresh) {
            $pdo->exec(file_get_contents(__DIR__ . '/../../../database/schema.sqlite.sql'));
        }
    } else {
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $c['host'], $c['name']);
        $pdo = new PDO($dsn, $c['user'], $c['pass'], $options);
    }
    return $pdo;
}

function now(): string
{
    return date('Y-m-d H:i:s');
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    session_name('gadar_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function csrf_token(): string
{
    start_session();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_valid(?string $token): bool
{
    start_session();
    return is_string($token) && !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $token);
}

function json_out(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400, array $errors = []): void
{
    json_out(['ok' => false, 'message' => $message, 'errors' => (object) $errors], $status);
}

function h($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function clean(string $key, int $max = 500): string
{
    $value = $_POST[$key] ?? '';
    if (!is_string($value)) {
        return '';
    }
    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '');
    return mb_substr($value, 0, $max);
}

function ip_hash(): string
{
    return hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown', (string) config('secret', 'gadar'));
}

// Rejects the request when the same visitor has done this action too often in the last hour.
function rate_limit(string $action, int $maxPerHour): void
{
    $pdo = db();
    $pdo->prepare('DELETE FROM rate_limits WHERE created_at < ?')->execute([date('Y-m-d H:i:s', time() - 86400)]);
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM rate_limits WHERE ip_hash = ? AND action = ? AND created_at > ?');
    $stmt->execute([ip_hash(), $action, date('Y-m-d H:i:s', time() - 3600)]);
    if ((int) $stmt->fetchColumn() >= $maxPerHour) {
        fail('You have sent several requests already. Please try again a little later or contact us on WhatsApp.', 429);
    }
    $pdo->prepare('INSERT INTO rate_limits (ip_hash, action, created_at) VALUES (?, ?, ?)')->execute([ip_hash(), $action, now()]);
}

// Shared checks for every public form submission.
function guard_post(string $action, int $maxPerHour): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        fail('Method not allowed.', 405);
    }
    if (!csrf_valid($_POST['csrf'] ?? null)) {
        fail('Your session expired. Please refresh the page and try again.', 419);
    }
    if (!empty($_POST['website'])) {
        // Honeypot field was filled in, so this is almost certainly a bot. Pretend it worked.
        json_out(['ok' => true]);
    }
    rate_limit($action, $maxPerHour);
}

function valid_email(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function send_mail(string $to, string $subject, string $body, ?string $replyTo = null): bool
{
    if (!config('mail.enabled', true)) {
        error_log("[gadar] mail disabled, skipped: {$subject}");
        return false;
    }
    $fromName = config('mail.from_name', 'Gadar Events');
    $from = config('mail.from', 'no-reply@gadarevents.com');
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: ' . mb_encode_mimeheader($fromName) . " <{$from}>",
    ];
    if ($replyTo && valid_email($replyTo)) {
        $headers[] = "Reply-To: {$replyTo}";
    }
    try {
        return @mail($to, mb_encode_mimeheader($subject), $body, implode("\r\n", $headers), "-f{$from}");
    } catch (Throwable $e) {
        error_log('Mail failed: ' . $e->getMessage());
        return false;
    }
}

function handle_errors(callable $fn): void
{
    try {
        $fn();
    } catch (Throwable $e) {
        error_log('[gadar] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
        fail(config('debug') ? $e->getMessage() : 'Something went wrong on our side. Please try again or contact us directly.', 500);
    }
}
