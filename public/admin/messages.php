<?php
require __DIR__ . '/../api/lib/admin.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_post_csrf();
    $id = (int) ($_POST['id'] ?? 0);
    if (($_POST['action'] ?? '') === 'delete') {
        db()->prepare('DELETE FROM messages WHERE id = ?')->execute([$id]);
        flash('Message deleted.');
    } else {
        db()->prepare('UPDATE messages SET is_read = 1 WHERE id = ?')->execute([$id]);
    }
    redirect('messages.php');
}

$rows = db()->query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 200')->fetchAll();

admin_header('Messages', 'messages');
?>
<div class="a-head"><h1>Messages</h1></div>
<?php if (!$rows): ?><p class="a-empty">No messages yet.</p><?php endif; ?>
<?php foreach ($rows as $r): ?>
  <details class="a-card <?= $r['is_read'] ? '' : 'is-unread' ?>">
    <summary>
      <?php if (!$r['is_read']): ?><span class="a-badge a-badge--new">New</span><?php endif; ?>
      <strong><?= h($r['name']) ?></strong>
      <span><?= h($r['subject'] ?: 'No subject') ?></span>
      <span class="a-muted a-right"><?= h(date('j M Y, g:ia', strtotime($r['created_at']))) ?></span>
    </summary>
    <p><a href="mailto:<?= h($r['email']) ?>"><?= h($r['email']) ?></a><?php if ($r['phone']): ?> &middot; <a href="tel:<?= h($r['phone']) ?>"><?= h($r['phone']) ?></a><?php endif; ?></p>
    <p><?= nl2br(h($r['message'])) ?></p>
    <form method="post" class="a-actions">
      <?= csrf_field() ?>
      <input type="hidden" name="id" value="<?= (int) $r['id'] ?>">
      <?php if (!$r['is_read']): ?><button class="a-btn a-btn--gold" name="action" value="read">Mark as read</button><?php endif; ?>
      <button class="a-btn a-btn--danger" name="action" value="delete" onclick="return confirm('Delete this message?')">Delete</button>
    </form>
  </details>
<?php endforeach; ?>
<?php admin_footer();
