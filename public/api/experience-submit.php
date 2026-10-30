<?php
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/media.php';

handle_errors(function () {
    // An oversized upload empties $_POST entirely, so explain that instead of a session error.
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_POST) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
        fail('Those files are too large to upload together. Please choose fewer or smaller files.', 413);
    }
    guard_post('experience', 4);

    $name = clean('name', 120);
    $email = clean('email', 160);
    $role = clean('role', 20);
    $eventName = clean('event_name', 160);
    $story = clean('story', 2000);

    $errors = [];
    if (mb_strlen($name) < 2) {
        $errors['name'] = 'Please tell us your name.';
    }
    if (!valid_email($email)) {
        $errors['email'] = 'Please enter a valid email address.';
    }
    if (!in_array($role, ['client', 'attendee'], true)) {
        $errors['role'] = 'Please tell us whether you were a client or a guest.';
    }
    if ($eventName === '') {
        $errors['event_name'] = 'Please tell us which event.';
    }
    if (mb_strlen($story) < 20) {
        $errors['story'] = 'Please write at least a sentence or two.';
    }
    if (empty($_POST['consent'])) {
        $errors['consent'] = 'Please confirm we may publish your story.';
    }

    $limits = config('limits');
    $files = uploaded_files('media');
    $images = [];
    $videos = [];
    foreach ($files as $f) {
        if ($f['error'] !== UPLOAD_ERR_OK) {
            $errors['media'] = in_array($f['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
                ? "{$f['name']} is too large."
                : "{$f['name']} could not be uploaded.";
            continue;
        }
        $mime = detect_mime($f['tmp']);
        if (in_array($mime, IMAGE_TYPES, true)) {
            if ($f['size'] > $limits['image_mb'] * 1048576) {
                $errors['media'] = "{$f['name']} is larger than {$limits['image_mb']} MB.";
            }
            $images[] = $f + ['mime' => $mime];
        } elseif (isset(VIDEO_TYPES[$mime])) {
            if ($f['size'] > $limits['video_mb'] * 1048576) {
                $errors['media'] = "{$f['name']} is larger than {$limits['video_mb']} MB.";
            }
            $videos[] = $f + ['mime' => $mime];
        } else {
            $errors['media'] = "{$f['name']} is not a supported photo or video.";
        }
    }
    if (count($images) > $limits['max_images']) {
        $errors['media'] = "Please add no more than {$limits['max_images']} photos.";
    }
    if (count($videos) > $limits['max_videos']) {
        $errors['media'] = 'Please add only one video.';
    }
    if ($errors) {
        fail(isset($errors['consent']) && count($errors) === 1 ? $errors['consent'] : 'Please check the highlighted fields.', 422, $errors);
    }

    $saved = [];
    try {
        foreach ($images as $img) {
            $saved[] = save_image($img['tmp'], $img['mime']);
        }
        foreach ($videos as $vid) {
            $saved[] = save_video($vid['tmp'], $vid['mime'], $vid['size']);
        }
    } catch (InvalidArgumentException $e) {
        array_walk($saved, fn ($m) => delete_media_file($m['path']));
        fail($e->getMessage(), 422, ['media' => $e->getMessage()]);
    }

    $pdo = db();
    $pdo->beginTransaction();
    $pdo->prepare('INSERT INTO experiences (name, email, role, event_name, story, status, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([$name, $email, $role, $eventName, $story, 'pending', ip_hash(), now()]);
    $id = (int) $pdo->lastInsertId();
    $media = $pdo->prepare('INSERT INTO experience_media (experience_id, type, path, mime, size, sort) VALUES (?, ?, ?, ?, ?, ?)');
    foreach ($saved as $i => $m) {
        $media->execute([$id, $m['type'], $m['path'], $m['mime'], $m['size'], $i]);
    }
    $pdo->commit();

    send_mail(
        config('mail.to'),
        "New Gadar Experience to review from {$name}",
        "{$name} ({$role}) shared a story about: {$eventName}\n\n{$story}\n\nAttachments: " . count($saved) . "\n\nReview it here: " . config('site_url') . '/admin/experiences.php'
    );

    json_out(['ok' => true]);
});
