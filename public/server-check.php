<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$response = [
    'status' => 'ok',
    'php_version' => phpversion(),
    'gd_installed' => extension_loaded('gd'),
    'uploads_exists' => file_exists('uploads'),
    'profiles_exists' => file_exists('uploads/profiles'),
    'uploads_writable' => is_writable('uploads'),
    'profiles_writable' => is_writable('uploads/profiles'),
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'script_path' => __DIR__
];

// Test writing a file
if ($response['profiles_writable']) {
    $testFile = 'uploads/profiles/test_perm.txt';
    $written = file_put_contents($testFile, 'permission test');
    $response['test_write'] = $written !== false;
    if ($written) {
        unlink($testFile); // Clean up
    }
} else {
    $response['test_write'] = false;
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>