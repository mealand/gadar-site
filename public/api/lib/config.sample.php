<?php
// Copy this file to config.php (same folder) on the server and fill in real values.
// config.php is never committed to git and is never overwritten by deployment.
return [
    'db' => [
        // 'mysql' on cPanel. 'sqlite' is handy for local testing only.
        'driver' => 'mysql',
        'host' => 'localhost',
        'name' => 'cpaneluser_gadar',
        'user' => 'cpaneluser_gadar',
        'pass' => 'CHANGE_ME',
        'sqlite_path' => __DIR__ . '/../../../database/local.sqlite',
    ],
    'mail' => [
        // Set to false on a local computer without a mail server.
        'enabled' => true,
        // Where new bookings, messages and stories are announced.
        'to' => 'hello@gadarevents.com',
        // Must be a mailbox on your own domain, created in cPanel > Email Accounts.
        'from' => 'no-reply@gadarevents.com',
        'from_name' => 'Gadar Events',
    ],
    'site_url' => 'https://gadarevents.com',
    'whatsapp' => '2348000000000',
    // Folder for shared photos and videos, relative to this file.
    'uploads_dir' => __DIR__ . '/../../uploads',
    'uploads_url' => '/uploads',
    'limits' => [
        'image_mb' => 8,
        'video_mb' => 50,
        'max_images' => 5,
        'max_videos' => 1,
    ],
    // Long random string used to anonymise visitor IP addresses for rate limiting.
    'secret' => 'CHANGE_ME_TO_A_LONG_RANDOM_STRING',
    'debug' => false,
];
