<?php
require __DIR__ . '/lib/bootstrap.php';

handle_errors(function () {
    guard_post('contact', 5);

    $name = clean('name', 120);
    $email = clean('email', 160);
    $phone = clean('phone', 40);
    $subject = clean('subject', 160);
    $message = clean('message', 4000);

    $errors = [];
    if (mb_strlen($name) < 2) {
        $errors['name'] = 'Please tell us your name.';
    }
    if (!valid_email($email)) {
        $errors['email'] = 'Please enter a valid email address.';
    }
    if (mb_strlen($message) < 10) {
        $errors['message'] = 'Please write a short message.';
    }
    if ($errors) {
        fail('Please check the highlighted fields.', 422, $errors);
    }

    db()->prepare('INSERT INTO messages (name, email, phone, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$name, $email, $phone ?: null, $subject ?: null, $message, now()]);

    send_mail(
        config('mail.to'),
        'Website message: ' . ($subject ?: "from {$name}"),
        "Name: {$name}\nEmail: {$email}\nPhone: " . ($phone ?: 'Not given') . "\n\n{$message}\n\nView all messages: " . config('site_url') . '/admin/messages.php',
        $email
    );

    json_out(['ok' => true]);
});
