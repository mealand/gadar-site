<?php
require __DIR__ . '/../api/lib/admin.php';
require __DIR__ . '/../api/lib/media.php';

$admin = require_admin();
$tabs = ['pending' => 'Awaiting Review', 'approved' => 'Published', 'rejected' => 'Declined'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_post_csrf();
    $id = (int) ($_POST['id'] ?? 0);
    $action = (string) ($_POST['action'] ?? '');
    $pdo = db();

    if ($id && $action === 'delete') {
        $files = $pdo->prepare('SELECT path FROM experience_media WHERE experience_id = ?');
        $files->execute([$id]);
        foreach ($files->fetchAll(PDO::FETCH_COLUMN) as $path) {
            delete_media_file($path);
        }
        $pdo->prepare('DELETE FROM experience_media WHERE experience_id = ?')->execute([$id]);
        $pdo->prepare('DELETE FROM experiences WHERE id = ?')->execute([$id]);
        flash('Story deleted along with its photos and video.');
    } elseif ($id && in_array($action, ['approve', 'reject', 'save'], true)) {
        $story = trim((string) ($_POST['story'] ?? ''));
        $event = trim((string) ($_POST['event_name'] ?? ''));
        $note = trim((string) ($_POST['moderator_note'] ?? '')) ?: null;
        if ($story === '' || $event === '') {
            flash('The story and event name cannot be empty.');
        } else {
            $sql = 'UPDATE experiences SET story = ?, event_name = ?, moderator_note = ?';
            $params = [mb_substr($story, 0, 2000), mb_substr($event, 0, 160), $note];
            if ($action !== 'save') {
                $sql .= ', status = ?, reviewed_at = ?, reviewed_by = ?';
                array_push($params, $action === 'approve' ? 'approved' : 'rejected', now(), $admin);
            }
            $params[] = $id;
            $pdo->prepare($sql . ' WHERE id = ?')->execute($params);

            // Remove individual media items the moderator unticked.
            $remove = array_map('intval', (array) ($_POST['remove_media'] ?? []));
            if ($remove) {
                $in = implode(',', array_fill(0, count($remove), '?'));
                $m = $pdo->prepare("SELECT id, path FROM experience_media WHERE experience_id = ? AND id IN ({$in})");
                $m->execute(array_merge([$id], $remove));
                foreach ($m->fetchAll() as $row) {
                    delete_media_file($row['path']);
                    $pdo->prepare('DELETE FROM experience_media WHERE id = ?')->execute([$row['id']]);
                }
            }
            flash(['approve' => 'Story published to the Gadar Experience wall.', 'reject' => 'Story declined. It will not be shown.', 'save' => 'Changes saved.'][$action]);
        }
    }
    redirect('experiences.php?tab=' . urlencode($_GET['tab'] ?? 'pending'));
}

$tab = isset($tabs[$_GET['tab'] ?? '']) ? $_GET['tab'] : 'pending';
$stmt = db()->prepare('SELECT * FROM experiences WHERE status = ? ORDER BY created_at ' . ($tab === 'pending' ? 'ASC' : 'DESC') . ' LIMIT 100');
$stmt->execute([$tab]);
$rows = $stmt->fetchAll();

$media = [];
if ($rows) {
    $ids = array_column($rows, 'id');
    $in = implode(',', array_fill(0, count($ids), '?'));
    $m = db()->prepare("SELECT * FROM experience_media WHERE experience_id IN ({$in}) ORDER BY sort");
    $m->execute($ids);
    foreach ($m->fetchAll() as $row) {
        $media[$row['experience_id']][] = $row;
    }
}

admin_header('Gadar Experiences', 'experiences');
?>
<div class="a-head">
  <h1>Gadar Experiences</h1>
  <div class="a-tabs">
    <?php foreach ($tabs as $key => $label): ?>
      <a href="?tab=<?= h($key) ?>" class="<?= $tab === $key ? 'is-active' : '' ?>"><?= h($label) ?></a>
    <?php endforeach; ?>
  </div>
</div>
<p class="a-muted">Stories only appear on the public wall after you publish them. You can correct spelling, remove a photo, or decline anything unsuitable. Only the first name is ever shown publicly.</p>

<?php if (!$rows): ?>
  <p class="a-empty"><?= $tab === 'pending' ? 'Nothing waiting for review. Lovely.' : 'Nothing here yet.' ?></p>
<?php endif; ?>

<?php foreach ($rows as $r): ?>
  <form method="post" class="a-card a-story" action="?tab=<?= h($tab) ?>">
    <?= csrf_field() ?>
    <input type="hidden" name="id" value="<?= (int) $r['id'] ?>">
    <div class="a-story__meta">
      <strong><?= h($r['name']) ?></strong>
      <span class="a-badge"><?= $r['role'] === 'client' ? 'Client' : 'Guest' ?></span>
      <a href="mailto:<?= h($r['email']) ?>"><?= h($r['email']) ?></a>
      <span class="a-muted a-right">Sent <?= h(date('j M Y, g:ia', strtotime($r['created_at']))) ?>
        <?php if ($r['reviewed_at']): ?> &middot; reviewed by <?= h($r['reviewed_by']) ?><?php endif; ?></span>
    </div>
    <?php if (!empty($media[$r['id']])): ?>
      <div class="a-media">
        <?php foreach ($media[$r['id']] as $m): ?>
          <figure>
            <?php if ($m['type'] === 'video'): ?>
              <video src="<?= h(media_url($m['path'])) ?>" controls preload="metadata"></video>
            <?php else: ?>
              <a href="<?= h(media_url($m['path'])) ?>" target="_blank" rel="noopener"><img src="<?= h(media_url($m['path'])) ?>" alt="Submitted photo"></a>
            <?php endif; ?>
            <label class="a-check"><input type="checkbox" name="remove_media[]" value="<?= (int) $m['id'] ?>"> Remove</label>
          </figure>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
    <label>Event <input name="event_name" value="<?= h($r['event_name']) ?>" maxlength="160"></label>
    <label>Story <textarea name="story" rows="5" maxlength="2000"><?= h($r['story']) ?></textarea></label>
    <label>Private note <input name="moderator_note" value="<?= h($r['moderator_note'] ?? '') ?>" placeholder="Only visible to admins"></label>
    <div class="a-actions">
      <?php if ($r['status'] !== 'approved'): ?><button class="a-btn a-btn--gold" name="action" value="approve">Publish</button><?php endif; ?>
      <button class="a-btn" name="action" value="save">Save changes</button>
      <?php if ($r['status'] !== 'rejected'): ?><button class="a-btn" name="action" value="reject"><?= $r['status'] === 'approved' ? 'Unpublish' : 'Decline' ?></button><?php endif; ?>
      <button class="a-btn a-btn--danger a-right" name="action" value="delete" onclick="return confirm('Delete this story and its media permanently?')">Delete</button>
    </div>
  </form>
<?php endforeach; ?>
<?php admin_footer();
