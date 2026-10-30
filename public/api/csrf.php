<?php
require __DIR__ . '/lib/bootstrap.php';

json_out(['ok' => true, 'token' => csrf_token()]);
