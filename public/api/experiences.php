<?php
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/media.php';

// Public list of approved stories. Email addresses are never returned.
handle_errors(function () {
    $perPage = 9;
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $role = $_GET['role'] ?? 'all';

    $where = "status = 'approved'";
    $params = [];
    if (in_array($role, ['client', 'attendee'], true)) {
        $where .= ' AND role = ?';
        $params[] = $role;
    }

    $sql = "SELECT id, name, role, event_name, story, reviewed_at FROM experiences WHERE {$where}
            ORDER BY reviewed_at DESC, id DESC LIMIT " . ($perPage + 1) . ' OFFSET ' . (($page - 1) * $perPage);
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    $hasMore = count($rows) > $perPage;
    $rows = array_slice($rows, 0, $perPage);

    $media = [];
    if ($rows) {
        $ids = array_column($rows, 'id');
        $in = implode(',', array_fill(0, count($ids), '?'));
        $m = db()->prepare("SELECT experience_id, type, path FROM experience_media WHERE experience_id IN ({$in}) ORDER BY sort");
        $m->execute($ids);
        foreach ($m->fetchAll() as $row) {
            $media[$row['experience_id']][] = ['type' => $row['type'], 'url' => media_url($row['path'])];
        }
    }

    $items = array_map(fn ($r) => [
        'id' => (int) $r['id'],
        // Only the first name is published.
        'name' => explode(' ', trim($r['name']))[0],
        'role' => $r['role'],
        'event_name' => $r['event_name'],
        'story' => $r['story'],
        'media' => $media[$r['id']] ?? [],
    ], $rows);

    json_out(['ok' => true, 'items' => $items, 'has_more' => $hasMore]);
});
