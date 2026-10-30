<?php
// One time setup: creates the first administrator. It switches itself off once an admin exists.
require __DIR__ . '/../api/lib/admin.php';

$hasAdmin = (int) db()->query('SELECT COUNT(*) FROM admins')->fetchColumn() > 0;
$error = '';

if (!$hasAdmin && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    if (!csrf_valid($_POST['csrf'] ?? null)) {
        $error = 'Your session expired. Please try again.';
    } elseif (!preg_match('/^[A-Za-z0-9_.]{3,60}$/', $username)) {
        $error = 'Usernames use 3 to 60 letters, numbers, dots or underscores.';
    } elseif (strlen($password) < 12) {
        $error = 'Please choose a password of at least 12 characters.';
    } elseif ($password !== ($_POST['confirm'] ?? '')) {
        $error = 'The two passwords do not match.';
    } else {
        db()->prepare('INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)')
            ->execute([$username, password_hash($password, PASSWORD_DEFAULT), now()]);
        flash('Administrator created. Please sign in, then delete admin/setup.php from the server.');
        redirect('login.php');
    }
}

admin_header('Setup');
?>
<div class="a-login">
<?php if ($hasAdmin): ?>
  <h1>Setup is complete</h1>
  <p>An administrator already exists. For safety, delete <code>admin/setup.php</code> from the server using cPanel File Manager.</p>
  <a class="a-btn a-btn--gold" href="login.php">Go to sign in</a>
<?php else: ?>
  <form method="post">
    <h1>Create the first administrator</h1>
    <p>This account will review call requests and approve Gadar Experience stories.</p>
    <?php if ($error): ?><p class="a-error"><?= h($error) ?></p><?php endif; ?>
    <?= csrf_field() ?>
    <label>Username <input name="username" required autocomplete="username" value="<?= h($_POST['username'] ?? '') ?>"></label>
    <label>Password (12 characters or more) <input name="password" type="password" required autocomplete="new-password"></label>
    <label>Confirm password <input name="confirm" type="password" required autocomplete="new-password"></label>
    <button class="a-btn a-btn--gold" type="submit">Create administrator</button>
  </form>
<?php endif; ?>
</div>
<?php admin_footer();
