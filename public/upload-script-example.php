<?php
// FILE: upload.php
// Upload this file to your Hostinger public_html folder (e.g., https://yourdomain.com/upload.php)

header('Access-Control-Allow-Origin: *'); // Allow from any domain (or restrict to your Vercel app URL)
header('Access-Control-Allow-Methods: POST');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

// Create uploads directory if it doesn't exist
$target_dir = "uploads/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

$file = $_FILES['file'];
$fileType = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

// Allow certain file formats
$allowedTypes = ['jpg', 'png', 'jpeg', 'gif', 'webp'];
if (!in_array($fileType, $allowedTypes)) {
    echo json_encode(['error' => 'Sorry, only JPG, JPEG, PNG, GIF, & WEBP files are allowed.']);
    exit;
}

// Generate unique name
$fileName = uniqid() . '_' . basename($file['name']);
$target_file = $target_dir . $fileName;

// Check file size (5MB limit)
if ($file['size'] > 5000000) {
    echo json_encode(['error' => 'Sorry, your file is too large.']);
    exit;
}

if (move_uploaded_file($file['tmp_name'], $target_file)) {
    // Return the full URL
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $url = $protocol . "://" . $_SERVER['HTTP_HOST'] . "/" . $target_file;
    
    echo json_encode([
        'success' => true, 
        'url' => $url,
        'message' => 'The file has been uploaded.'
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Sorry, there was an error uploading your file.']);
}
?>
