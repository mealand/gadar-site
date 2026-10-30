<?php
require __DIR__ . '/../api/lib/admin.php';

$_SESSION = [];
session_regenerate_id(true);
session_destroy();
redirect('login.php');
