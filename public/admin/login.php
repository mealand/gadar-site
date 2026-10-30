<?php
require __DIR__ . '/../api/lib/admin.php';

if (current_admin()) {
    redirect('index.php');
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_valid($_POST['csrf'] ?? null)) {
        $error = 'Your session expired. Please try again.';
    } else {
        // Slow down repeated guesses: at most 8 attempts per hour per visitor.
        $pdo = db();
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM rate_limits WHERE ip_hash = ? AND action = 'login' AND created_at > ?");
        $stmt->execute([ip_hash(), date('Y-m-d H:i:s', time() - 3600)]);
        if ((int) $stmt->fetchColumn() >= 8) {
            $error = 'Too many attempts. Please wait an hour and try again.';
        } else {
            $username = trim((string) ($_POST['username'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');
            $stmt = $pdo->prepare('SELECT id, username, password_hash FROM admins WHERE username = ?');
            $stmt->execute([$username]);
            $row = $stmt->fetch();
            if ($row && password_verify($password, $row['password_hash'])) {
                session_regenerate_id(true);
                $_SESSION['admin'] = $row['username'];
                $_SESSION['admin_expires'] = time() + 4 * 3600;
                $pdo->prepare('UPDATE admins SET last_login = ? WHERE id = ?')->execute([now(), $row['id']]);
                if (password_needs_rehash($row['password_hash'], PASSWORD_DEFAULT)) {
                    $pdo->prepare('UPDATE admins SET password_hash = ? WHERE id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $row['id']]);
                }
                redirect('index.php');
            }
            $pdo->prepare("INSERT INTO rate_limits (ip_hash, action, created_at) VALUES (?, 'login', ?)")->execute([ip_hash(), now()]);
            $error = 'That username and password do not match.';
        }
    }
}

admin_header('Sign in');
?>
<form class="a-login" method="post">
  <h1>Welcome back</h1>
  <p>Sign in to manage call requests and moderate Gadar Experiences.</p>
  <?php if ($error): ?><p class="a-error"><?= h($error) ?></p><?php endif; ?>
  <?= csrf_field() ?>
  <label>Username <input name="username" autocomplete="username" required autofocus></label>
  <label>Password <input name="password" type="password" autocomplete="current-password" required></label>
  <button class="a-btn a-btn--gold" type="submit">Sign in</button>
</form>
<?php admin_footer();
