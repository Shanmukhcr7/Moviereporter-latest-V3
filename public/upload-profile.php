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
        // Extract relative path
        $urlParts = parse_url($oldUrl);
        $relativePath = ltrim($urlParts['path'], '/'); // Remove leading slash

        // Security check: ensure path starts with uploads/profiles/ and no directory traversal
        if (strpos($relativePath, 'uploads/profiles/') === 0 && strpos($relativePath, '..') === false) {
            if (file_exists($relativePath)) {
                unlink($relativePath);
            }
        }
    }
}

if (!isset($_FILES['file'])) {
    // If only deleting, we might exit here successfully, but usually this script is for upload
    if (isset($_POST['oldUrl'])) {
        // Maybe just wanted to delete? But usually we replace. 
        // For now, let's require file for upload.
    }
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

// 2. Setup Upload Directory
$target_dir = "uploads/profiles/";
if (!file_exists($target_dir)) {
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

if ($file['size'] > 10000000) { // 10MB limit (compression will reduce it)
    echo json_encode(['error' => 'File is too large (Max 10MB).']);
    exit;
}

// 4. Compression & Saving
$fileName = uniqid() . '.jpg'; // Save everything as JPG for consistency/compression
$target_file = $target_dir . $fileName;

// Function to compress image
function compressImage($source, $destination, $quality)
{
    $info = getimagesize($source);

    if ($info['mime'] == 'image/jpeg')
        $image = imagecreatefromjpeg($source);
    elseif ($info['mime'] == 'image/gif')
        $image = imagecreatefromgif($source);
    elseif ($info['mime'] == 'image/png')
        $image = imagecreatefrompng($source);
    elseif ($info['mime'] == 'image/webp')
        $image = imagecreatefromwebp($source);
    else
        return false;

    // Resize if too big (Max width 800px)
    $maxWidth = 800;
    $width = imagesx($image);
    $height = imagesy($image);

    if ($width > $maxWidth) {
        $newWidth = $maxWidth;
        $newHeight = floor($height * ($maxWidth / $width));
        $tmp = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($tmp, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        $image = $tmp;
    }

    // Save as JPEG with quality
    imagejpeg($image, $destination, $quality);
    return true;
}

try {
    if (compressImage($file['tmp_name'], $target_file, 75)) {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $url = $protocol . "://" . $_SERVER['HTTP_HOST'] . "/" . $target_file;

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