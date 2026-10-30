<?php
require __DIR__ . '/lib/bootstrap.php';

handle_errors(function () {
    guard_post('booking', 5);

    $eventTypes = ['Wedding', 'Government or Corporate Function', 'Entertainment Show', 'Private Celebration', 'Ushering Only', 'Other'];
    $allowedServices = ['planning', 'hosting', 'catering', 'ushering', 'decor', 'coordination'];

    $data = [
        'event_type' => clean('event_type', 80),
        'event_date' => clean('event_date', 10),
        'location' => clean('location', 160),
        'guests' => clean('guests', 40),
        'budget' => clean('budget', 80),
        'notes' => clean('notes', 3000),
        'name' => clean('name', 120),
        'phone' => clean('phone', 40),
        'email' => clean('email', 160),
        'preferred_time' => clean('preferred_time', 60),
    ];
    $services = array_values(array_intersect($allowedServices, (array) ($_POST['services'] ?? [])));

    $errors = [];
    if (!in_array($data['event_type'], $eventTypes, true)) {
        $errors['event_type'] = 'Please choose the type of event.';
    }
    if ($data['event_date'] !== '') {
        $date = DateTime::createFromFormat('Y-m-d', $data['event_date']);
        if (!$date || $date->format('Y-m-d') !== $data['event_date']) {
            $errors['event_date'] = 'Please choose a valid date.';
        }
    }
    if ($data['location'] === '') {
        $errors['location'] = 'Please tell us the city or venue.';
    }
    if ($data['guests'] === '') {
        $errors['guests'] = 'Please choose an approximate guest count.';
    }
    if (mb_strlen($data['name']) < 2) {
        $errors['name'] = 'Please tell us your name.';
    }
    if (strlen(preg_replace('/\D/', '', $data['phone'])) < 7) {
        $errors['phone'] = 'Please enter a phone number we can call.';
    }
    if (!valid_email($data['email'])) {
        $errors['email'] = 'Please enter a valid email address.';
    }
    if ($data['preferred_time'] === '') {
        $errors['preferred_time'] = 'Please choose a time.';
    }
    if ($errors) {
        fail('Please check the highlighted fields.', 422, $errors);
    }

    $stmt = db()->prepare(
        'INSERT INTO bookings (event_type, event_date, location, guests, budget, services, notes, name, phone, email, preferred_time, whatsapp_ok, status, ip_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $data['event_type'], $data['event_date'] ?: null, $data['location'], $data['guests'], $data['budget'] ?: null,
        implode(', ', $services) ?: null, $data['notes'] ?: null, $data['name'], $data['phone'], $data['email'],
        $data['preferred_time'], !empty($_POST['whatsapp_ok']) ? 1 : 0, 'new', ip_hash(), now(),
    ]);
    $id = db()->lastInsertId();

    $lines = [
        "New call request #{$id}",
        '',
        "Event type: {$data['event_type']}",
        'Date: ' . ($data['event_date'] ?: 'Not decided'),
        "Location: {$data['location']}",
        "Guests: {$data['guests']}",
        'Budget: ' . ($data['budget'] ?: 'Prefer to discuss'),
        'Services: ' . (implode(', ', $services) ?: 'Not specified'),
        '',
        "Name: {$data['name']}",
        "Phone: {$data['phone']}",
        "Email: {$data['email']}",
        "Best time to call: {$data['preferred_time']}",
        'WhatsApp OK: ' . (!empty($_POST['whatsapp_ok']) ? 'Yes' : 'No'),
        '',
        'Notes:',
        $data['notes'] ?: 'None',
        '',
        'Manage requests: ' . config('site_url') . '/admin/',
    ];
    send_mail(config('mail.to'), "New call request: {$data['event_type']} from {$data['name']}", implode("\n", $lines), $data['email']);

    $first = explode(' ', $data['name'])[0];
    send_mail(
        $data['email'],
        'Your Gadar Experience has begun',
        "Dear {$first},\n\nThank you for choosing Gadar Events. We have received your request for a call about your {$data['event_type']} and a senior planner will contact you within one working day.\n\nYour preferred call time: {$data['preferred_time']}.\n\nIf you would like to talk sooner, message us on WhatsApp: https://wa.me/" . config('whatsapp') . "\n\nWarm regards,\nGadar Events\nHave a Gadar Experience\n" . config('site_url')
    );

    json_out(['ok' => true, 'id' => (int) $id]);
});
