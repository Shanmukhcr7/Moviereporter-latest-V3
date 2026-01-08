<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Content-Type: application/json');

// ENABLE DEBUGGING
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// 1. Handle Deletion of Old Image (if provided)
if (isset($_POST['oldUrl']) && !empty($_POST['oldUrl'])) {
    $oldUrl = $_POST['oldUrl'];
    $currentHost = $_SERVER['HTTP_HOST'];

    // Only allow deleting files from THIS server
    if (strpos($oldUrl, $currentHost) !== false) {
        $urlParts = parse_url($oldUrl);
        $urlPath = $urlParts['path']; // e.g. /uploads/profiles/abc.jpg

        // We know where uploads are physically located relative to this script
        // Script is in /public/, uploads in /uploads/ (sibling to public)
        // So /uploads/profiles/abc.jpg maps to ../uploads/profiles/abc.jpg

        if (strpos($urlPath, '/uploads/profiles/') === 0) {
            $fileName = basename($urlPath);
            $localPath = "../uploads/profiles/" . $fileName;

            if (file_exists($localPath)) {
                unlink($localPath);
            }
        }
    }
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

// 2. Setup Upload Directory (Physically in ../uploads/profiles/)
$target_dir = "../uploads/profiles/";
if (!file_exists($target_dir)) {
    // Try to create it if permissions allow, though user already created it
    mkdir($target_dir, 0777, true);
}

$file = $_FILES['file'];
$fileType = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

// 3. Validation
$allowedTypes = ['jpg', 'png', 'jpeg', 'gif', 'webp'];
if (!in_array($fileType, $allowedTypes)) {
    echo json_encode(['error' => 'Only JPG, PNG, GIF & WEBP files are allowed.']);
    exit;
}

if ($file['size'] > 10000000) {
    echo json_encode(['error' => 'File is too large (Max 10MB).']);
    exit;
}

// 4. Compression & Saving
$fileName = uniqid() . '.jpg';
$target_file = $target_dir . $fileName;

// ... compressImage function remains same ...

try {
    if (compressImage($file['tmp_name'], $target_file, 75)) {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        // The URL is NOT the physical path. It is the web path.
        // Nginx will map /uploads/ to the physical ../uploads/ folder
        $url = $protocol . "://" . $_SERVER['HTTP_HOST'] . "/uploads/profiles/" . $fileName;

        echo json_encode([
            'success' => true,
            'url' => $url,
            'message' => 'Profile picture updated successfully.'
        ]);
    } else {
        throw new Exception("Compression failed");
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error processing image: ' . $e->getMessage()]);
}
?>