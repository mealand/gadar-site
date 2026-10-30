<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

header('X-Frame-Options: DENY');
header('X-Robots-Tag: noindex, nofollow');
start_session();

function current_admin(): ?string
{
    if (empty($_SESSION['admin']) || ($_SESSION['admin_expires'] ?? 0) < time()) {
        return null;
    }
    $_SESSION['admin_expires'] = time() + 4 * 3600;
    return $_SESSION['admin'];
}

function require_admin(): string
{
    $admin = current_admin();
    if (!$admin) {
        header('Location: login.php');
        exit;
    }
    return $admin;
}

function require_post_csrf(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !csrf_valid($_POST['csrf'] ?? null)) {
        http_response_code(419);
        exit('Your session expired. Please go back and refresh the page.');
    }
}

function flash(?string $message = null): ?string
{
    if ($message !== null) {
        $_SESSION['flash'] = $message;
        return null;
    }
    $m = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $m;
}

function redirect(string $to): void
{
    header('Location: ' . $to);
    exit;
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . h(csrf_token()) . '">';
}

function pending_count(): int
{
    return (int) db()->query("SELECT COUNT(*) FROM experiences WHERE status = 'pending'")->fetchColumn();
}

function admin_header(string $title, string $active = ''): void
{
    $admin = current_admin();
    $flash = flash();
    $nav = '';
    if ($admin) {
        $pending = pending_count();
        $newBookings = (int) db()->query("SELECT COUNT(*) FROM bookings WHERE status = 'new'")->fetchColumn();
        $unread = (int) db()->query('SELECT COUNT(*) FROM messages WHERE is_read = 0')->fetchColumn();
        $items = [
            'bookings' => ['index.php', 'Call Requests', $newBookings],
            'experiences' => ['experiences.php', 'Gadar Experiences', $pending],
            'messages' => ['messages.php', 'Messages', $unread],
        ];
        $nav .= '<nav class="a-nav">';
        foreach ($items as $key => [$href, $label, $count]) {
            $nav .= '<a href="' . $href . '"' . ($active === $key ? ' class="is-active"' : '') . '>' . h($label)
                . ($count ? ' <b>' . $count . '</b>' : '') . '</a>';
        }
        $nav .= '</nav><div class="a-user">' . h($admin) . ' &middot; <a href="logout.php">Sign out</a></div>';
    }
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<title>' . h($title) . ' | Gadar Admin</title><meta name="robots" content="noindex">'
        . '<link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="admin.css"></head><body>'
        . '<header class="a-header"><a class="a-brand" href="index.php">Gadar<em>Admin</em></a>' . $nav . '</header><main class="a-main">';
    if ($flash) {
        echo '<p class="a-flash">' . h($flash) . '</p>';
    }
}

function admin_footer(): void
{
    echo '</main></body></html>';
}
