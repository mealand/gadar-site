<?php
declare(strict_types=1);

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4' => 'mp4', 'video/quicktime' => 'mov', 'video/webm' => 'webm'];

// Normalises PHP's nested $_FILES['media'] structure into a flat list.
function uploaded_files(string $field): array
{
    if (empty($_FILES[$field]) || !is_array($_FILES[$field]['name'])) {
        return [];
    }
    $files = [];
    foreach ($_FILES[$field]['name'] as $i => $name) {
        if ($_FILES[$field]['error'][$i] === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        $files[] = [
            'name' => (string) $name,
            'tmp' => $_FILES[$field]['tmp_name'][$i],
            'error' => $_FILES[$field]['error'][$i],
            'size' => (int) $_FILES[$field]['size'][$i],
        ];
    }
    return $files;
}

function detect_mime(string $path): string
{
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    return (string) $finfo->file($path);
}

function upload_target(string $ext): array
{
    $sub = 'experiences/' . date('Y/m');
    $dir = rtrim(config('uploads_dir'), '/') . '/' . $sub;
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        throw new RuntimeException('Could not create upload folder.');
    }
    $name = bin2hex(random_bytes(16)) . '.' . $ext;
    return [$dir . '/' . $name, $sub . '/' . $name];
}

// Re-encodes an image with GD. This strips metadata and any hidden payload, fixes rotation and caps the size.
function save_image(string $tmp, string $mime): array
{
    $src = @imagecreatefromstring((string) file_get_contents($tmp));
    if (!$src) {
        throw new InvalidArgumentException('One of the photos could not be read.');
    }
    if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
        $exif = @exif_read_data($tmp);
        $rotate = [3 => 180, 6 => -90, 8 => 90][$exif['Orientation'] ?? 1] ?? 0;
        if ($rotate) {
            $src = imagerotate($src, $rotate, 0);
        }
    }
    $w = imagesx($src);
    $h = imagesy($src);
    $max = 2000;
    $scale = min(1, $max / max($w, $h));
    $nw = (int) round($w * $scale);
    $nh = (int) round($h * $scale);
    $dst = imagecreatetruecolor($nw, $nh);
    imagefill($dst, 0, 0, imagecolorallocate($dst, 11, 11, 12));
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
    [$abs, $rel] = upload_target('jpg');
    imagejpeg($dst, $abs, 84);
    imagedestroy($src);
    imagedestroy($dst);
    return ['type' => 'image', 'path' => $rel, 'mime' => 'image/jpeg', 'size' => (int) filesize($abs)];
}

function save_video(string $tmp, string $mime, int $size): array
{
    [$abs, $rel] = upload_target(VIDEO_TYPES[$mime]);
    if (!move_uploaded_file($tmp, $abs)) {
        throw new RuntimeException('Could not store the video.');
    }
    chmod($abs, 0644);
    return ['type' => 'video', 'path' => $rel, 'mime' => $mime, 'size' => $size];
}

function delete_media_file(string $rel): void
{
    $base = realpath(config('uploads_dir'));
    $path = realpath(rtrim(config('uploads_dir'), '/') . '/' . $rel);
    if ($base && $path && str_starts_with($path, $base) && is_file($path)) {
        unlink($path);
    }
}

function media_url(string $rel): string
{
    return rtrim(config('uploads_url', '/uploads'), '/') . '/' . $rel;
}
