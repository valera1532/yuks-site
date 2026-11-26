<?php
declare(strict_types=1);

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status): void
{
    http_response_code($status);
    echo json_encode(['ok' => $status === 200]);
    exit;
}

function field(array $data, string $key, int $limit): string
{
    $value = $data[$key] ?? '';
    if (!is_string($value) || !preg_match('/\A.{0,' . $limit . '}\z/us', $value)) {
        respond(422);
    }
    return trim($value);
}

// Keep one small, locked counter file for the current minute. Store no message content.
function limitRequests(): void
{
    $path = sys_get_temp_dir() . '/yuks-contact-' . hash('sha256', __DIR__);
    $file = fopen($path, 'c+');
    if (!$file || !flock($file, LOCK_EX)) {
        respond(503);
    }
    $state = json_decode(stream_get_contents($file), true);
    $minute = intdiv(time(), 60);
    if (($state['minute'] ?? null) !== $minute) {
        $state = ['minute' => $minute, 'requests' => []];
    }
    $client = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');
    $count = $state['requests'][$client] ?? 0;
    if ($count >= 5) {
        fclose($file);
        header('Retry-After: 60');
        respond(429);
    }
    $state['requests'][$client] = $count + 1;
    rewind($file);
    ftruncate($file, 0);
    fwrite($file, json_encode($state));
    fclose($file);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405);
}
$contentType = explode(';', $_SERVER['CONTENT_TYPE'] ?? '', 2)[0];
if (strtolower(trim($contentType)) !== 'application/json') {
    respond(415);
}
$raw = file_get_contents('php://input', false, null, 0, 16385);
if ($raw === false || strlen($raw) > 16384) {
    respond(413);
}
$data = json_decode($raw, true);
if (!is_array($data)) {
    respond(400);
}

$subjects = [
    'Проект' => 'Обсуждение проекта',
    'Вакансии' => 'Вакансии в ЮКС',
    'Другое' => 'Обращение в ЮКС',
];
$topic = field($data, 'subject', 16);
$message = field($data, 'message', 1400);
$contact = field($data, 'contact', 160);
$name = field($data, 'name', 100);
$phoneDigits = strlen(preg_replace('/\D/', '', $contact));
$phone = preg_match('/\A\+?[0-9 ().-]+\z/', $contact) && $phoneDigits >= 7 && $phoneDigits <= 15;
$email = preg_match('/\A[^\s@\p{C}]+@[^\s@\p{C}]+\.[^\s@\p{C}]+\z/u', $contact);

if (!isset($subjects[$topic]) || !preg_match('/\S/u', $message) || (!$phone && !$email)) {
    respond(422);
}
limitRequests();

$body = $message . "\n\nКонтакт для ответа: " . $contact;
if ($name !== '') {
    $body .= "\nИмя: " . $name;
}
$subject = '=?UTF-8?B?' . base64_encode($subjects[$topic]) . '?=';
$headers = [
    'From' => 'site@sk-yuks.ru',
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => 'base64',
];
if ($email && filter_var($contact, FILTER_VALIDATE_EMAIL)) {
    $headers['Reply-To'] = $contact;
}
$body = preg_replace('/\r\n|\r|\n/', "\r\n", $body);
$encodedBody = chunk_split(base64_encode($body));
if (!function_exists('mail') || !mail('yuks61@mail.ru', $subject, $encodedBody, $headers)) {
    respond(503);
}
respond(200);
