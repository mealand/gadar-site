<?php
require __DIR__ . '/../api/lib/admin.php';

$admin = require_admin();
$statuses = ['new' => 'New', 'contacted' => 'Contacted', 'booked' => 'Booked', 'closed' => 'Closed'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_post_csrf();
    $id = (int) ($_POST['id'] ?? 0);
    $status = (string) ($_POST['status'] ?? '');
    if ($id && isset($statuses[$status])) {
        db()->prepare('UPDATE bookings SET status = ?, admin_note = ?, updated_at = ? WHERE id = ?')
            ->execute([$status, trim((string) ($_POST['admin_note'] ?? '')) ?: null, now(), $id]);
        flash("Request #{$id} updated.");
    }
    redirect('index.php?status=' . urlencode($_GET['status'] ?? 'new'));
}

$filter = $_GET['status'] ?? 'new';
if ($filter !== 'all' && !isset($statuses[$filter])) {
    $filter = 'new';
}
$stmt = $filter === 'all'
    ? db()->query('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 200')
    : db()->prepare('SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC LIMIT 200');
if ($filter !== 'all') {
    $stmt->execute([$filter]);
}
$rows = $stmt->fetchAll();

admin_header('Call Requests', 'bookings');
?>
<div class="a-head">
  <h1>Call Requests</h1>
  <div class="a-tabs">
    <?php foreach (['new' => 'New'] + $statuses + ['all' => 'All'] as $key => $label): ?>
      <a href="?status=<?= h($key) ?>" class="<?= $filter === $key ? 'is-active' : '' ?>"><?= h($label) ?></a>
    <?php endforeach; ?>
  </div>
</div>

<?php if (!$rows): ?>
  <p class="a-empty">No call requests here yet.</p>
<?php endif; ?>

<?php foreach ($rows as $r): ?>
  <details class="a-card">
    <summary>
      <span class="a-badge a-badge--<?= h($r['status']) ?>"><?= h($statuses[$r['status']] ?? $r['status']) ?></span>
      <strong><?= h($r['name']) ?></strong>
      <span><?= h($r['event_type']) ?></span>
      <span class="a-muted"><?= h($r['location']) ?></span>
      <span class="a-muted a-right"><?= h(date('j M Y, g:ia', strtotime($r['created_at']))) ?></span>
    </summary>
    <div class="a-grid">
      <dl>
        <dt>Phone</dt><dd><a href="tel:<?= h($r['phone']) ?>"><?= h($r['phone']) ?></a>
          <?php if ($r['whatsapp_ok']): ?> &middot; <a href="https://wa.me/<?= h(preg_replace('/\D/', '', $r['phone'])) ?>" target="_blank" rel="noopener">WhatsApp</a><?php endif; ?></dd>
        <dt>Email</dt><dd><a href="mailto:<?= h($r['email']) ?>"><?= h($r['email']) ?></a></dd>
        <dt>Best time</dt><dd><?= h($r['preferred_time']) ?></dd>
        <dt>Event date</dt><dd><?= h($r['event_date'] ?: 'Not decided') ?></dd>
        <dt>Guests</dt><dd><?= h($r['guests']) ?></dd>
        <dt>Budget</dt><dd><?= h($r['budget'] ?: 'Prefer to discuss') ?></dd>
        <dt>Services</dt><dd><?= h($r['services'] ?: 'Not specified') ?></dd>
        <dt>Notes</dt><dd><?= nl2br(h($r['notes'] ?: 'None')) ?></dd>
      </dl>
      <form method="post" class="a-form">
        <?= csrf_field() ?>
        <input type="hidden" name="id" value="<?= (int) $r['id'] ?>">
        <label>Status
          <select name="status">
            <?php foreach ($statuses as $key => $label): ?>
              <option value="<?= h($key) ?>" <?= $r['status'] === $key ? 'selected' : '' ?>><?= h($label) ?></option>
            <?php endforeach; ?>
          </select>
        </label>
        <label>Internal note <textarea name="admin_note" rows="4"><?= h($r['admin_note'] ?? '') ?></textarea></label>
        <button class="a-btn a-btn--gold" type="submit">Save</button>
      </form>
    </div>
  </details>
<?php endforeach; ?>
<?php admin_footer();
