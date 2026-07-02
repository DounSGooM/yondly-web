<?php
// ─────────────────────────────────────────────────────────────────────────
// Endpoint d'envoi d'emails transactionnels via Brevo (contact / waitlist / pro)
//
// SÉCURITÉ :
//  - Clé API lue depuis l'environnement (BREVO_API_KEY) ou un fichier de config
//    hors webroot — JAMAIS codée en dur dans ce fichier versionné/déployé.
//  - CORS restreint aux domaines Yondly.
//  - POST uniquement.
//  - Validation des entrées + limites de longueur.
//  - Rate-limiting par IP pour éviter le relais de spam.
//  - Honeypot anti-bot.
//  - Vrais codes HTTP (200 succès, 4xx/5xx erreurs).
// ─────────────────────────────────────────────────────────────────────────

// ── CORS : liste blanche d'origines ──────────────────────────────────────
$allowedOrigins = [
    'https://yondly.app',
    'https://www.yondly.app',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Vary: Origin');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json');

// Préflight
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// POST uniquement
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// ── Récupération de la clé API (hors code source) ────────────────────────
$apiKey = getenv('BREVO_API_KEY') ?: '';
if (!$apiKey) {
    // Fallback : fichier de config placé HORS du webroot (non versionné).
    $configPath = __DIR__ . '/../brevo_config.php';
    if (is_readable($configPath)) {
        $cfg = require $configPath;
        $apiKey = is_array($cfg) ? ($cfg['api_key'] ?? '') : (string) $cfg;
    }
}
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Service indisponible']);
    exit;
}

$adminEmail = 'contact@yondly.app';
$senderEmail = 'contact@yondly.app';
$senderName = 'L\'équipe Yondly';

// ── Rate-limiting par IP (fichier temporaire) ────────────────────────────
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/yondly_rl_' . md5($ip);
$now = time();
$windowSeconds = 3600; // 1 heure
$maxPerWindow = 5;
$hits = [];
if (is_readable($rateFile)) {
    $hits = json_decode((string) file_get_contents($rateFile), true) ?: [];
}
$hits = array_filter($hits, fn($ts) => ($now - $ts) < $windowSeconds);
if (count($hits) >= $maxPerWindow) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Trop de requêtes, réessayez plus tard.']);
    exit;
}

// ── Lecture et validation de l'entrée ────────────────────────────────────
$raw = file_get_contents('php://input');
if (strlen($raw) > 20000) { // borne dure sur la taille du payload
    http_response_code(413);
    echo json_encode(['success' => false, 'message' => 'Payload trop volumineux']);
    exit;
}
$input = json_decode($raw, true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données invalides']);
    exit;
}

// Honeypot : un champ caché rempli = bot.
if (!empty($input['website']) || !empty($input['_gotcha'])) {
    // On répond 200 pour ne pas informer le bot.
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'OK']);
    exit;
}

$type = $input['type'] ?? 'contact';
if (!in_array($type, ['contact', 'waitlist', 'partner'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Type invalide']);
    exit;
}

// Consentement RGPD requis (le front l'envoie).
if (empty($input['rgpd_consent']) && empty($input['consent'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Consentement requis']);
    exit;
}

// Helper : nettoyage + limite de longueur.
function field($data, $key, $maxLen = 200)
{
    $v = trim((string) ($data[$key] ?? ''));
    return mb_substr($v, 0, $maxLen);
}

$userEmail = field($input, 'email', 254);
$userName = field($input, 'name', 100) ?: 'Utilisateur';

// Email obligatoire et valide.
if (!$userEmail || !filter_var($userEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email invalide']);
    exit;
}

// ── Construction de l'email admin selon le type ──────────────────────────
$adminSubject = '';
$adminHtmlContent = '';

switch ($type) {
    case 'contact':
        $adminSubject = 'Nouvelle demande de Contact - Yondly';
        $adminHtmlContent = "
            <h2>Nouveau message de contact</h2>
            <p><strong>Nom:</strong> " . htmlspecialchars($userName) . "</p>
            <p><strong>Email:</strong> " . htmlspecialchars($userEmail) . "</p>
            <p><strong>Sujet:</strong> " . htmlspecialchars(field($input, 'subject')) . "</p>
            <p><strong>Message:</strong><br>" . nl2br(htmlspecialchars(field($input, 'message', 5000))) . "</p>
        ";
        break;

    case 'waitlist':
        $adminSubject = 'Nouvelle inscription Waitlist - Yondly';
        $userName = explode('@', $userEmail)[0];
        $adminHtmlContent = "
            <h2>Nouvelle inscription Waitlist</h2>
            <p><strong>Email:</strong> " . htmlspecialchars($userEmail) . "</p>
            <p><strong>Profil:</strong> " . htmlspecialchars(field($input, 'status') ?: 'Particulier') . "</p>
            <p><strong>Ville:</strong> " . htmlspecialchars(field($input, 'city')) . "</p>
            <p><strong>Commentaire:</strong> " . htmlspecialchars(field($input, 'comment', 2000)) . "</p>
        ";
        break;

    case 'partner':
        $adminSubject = 'Nouveau Partenaire Potentiel - Yondly';
        $adminHtmlContent = "
            <h2>Demande Partenaire Pro</h2>
            <p><strong>Nom Contact:</strong> " . htmlspecialchars($userName) . "</p>
            <p><strong>Activité / Enseigne:</strong> " . htmlspecialchars(field($input, 'business')) . "</p>
            <p><strong>Ville:</strong> " . htmlspecialchars(field($input, 'city')) . "</p>
            <p><strong>Email:</strong> " . htmlspecialchars($userEmail) . "</p>
            <p><strong>Téléphone:</strong> " . htmlspecialchars(field($input, 'phone', 30)) . "</p>
            <p><strong>Message:</strong><br>" . nl2br(htmlspecialchars(field($input, 'message', 5000))) . "</p>
        ";
        break;
}

// ── Fonctions Brevo ──────────────────────────────────────────────────────
function sendEmail($apiKey, $sender, $to, $subject, $htmlContent, $replyTo = null)
{
    $payload = [
        'sender' => $sender,
        'to' => [$to],
        'subject' => $subject,
        'htmlContent' => $htmlContent,
    ];
    if ($replyTo) {
        $payload['replyTo'] = $replyTo;
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.brevo.com/v3/smtp/email');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'accept: application/json',
        'api-key: ' . $apiKey,
        'content-type: application/json',
    ]);
    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $httpCode >= 200 && $httpCode < 300;
}

function createOrUpdateContact($apiKey, $email, $attributes = [])
{
    $payload = ['email' => $email, 'updateEnabled' => true];
    if (!empty($attributes)) {
        $payload['attributes'] = $attributes;
    }
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.brevo.com/v3/contacts');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'accept: application/json',
        'api-key: ' . $apiKey,
        'content-type: application/json',
    ]);
    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $httpCode >= 200 && $httpCode < 300;
}

// ── Enregistrement contact CRM ───────────────────────────────────────────
$attributes = [];
if (!empty($input['name'])) {
    $parts = explode(' ', trim(field($input, 'name', 100)), 2);
    $attributes['PRENOM'] = $parts[0];
    $attributes['NOM'] = $parts[1] ?? $parts[0];
}
createOrUpdateContact($apiKey, $userEmail, $attributes);

// ── Envoi email admin ────────────────────────────────────────────────────
$adminSent = sendEmail(
    $apiKey,
    ['name' => $senderName, 'email' => $senderEmail],
    ['email' => $adminEmail, 'name' => 'Admin Yondly'],
    $adminSubject,
    $adminHtmlContent,
    ['email' => $userEmail]
);

// ── Email de confirmation utilisateur ────────────────────────────────────
$userSubject = 'Merci de votre message ! 🚀 - Yondly';
$userHtmlContent = "
    <html><body style='font-family: Arial, sans-serif; color: #333;'>
        <h2>Bonjour " . htmlspecialchars($userName) . ",</h2>
        <p>Merci de nous avoir contactés ! Nous avons bien reçu votre demande.</p>
        " . ($type === 'waitlist'
            ? "<p>Vous êtes bien inscrit sur notre liste d'attente. On vous tient au courant très vite ! 🌱</p>"
            : "<p>Notre équipe va étudier votre message et revenir vers vous sous 48h.</p>") . "
        <br><p>À très vite,</p><p><strong>L'équipe Yondly</strong></p>
    </body></html>
";
$userSent = sendEmail(
    $apiKey,
    ['name' => $senderName, 'email' => $senderEmail],
    ['email' => $userEmail, 'name' => $userName],
    $userSubject,
    $userHtmlContent
);

// ── Enregistrement du hit pour le rate-limiting ──────────────────────────
$hits[] = $now;
@file_put_contents($rateFile, json_encode(array_values($hits)), LOCK_EX);

// ── Réponse avec vrai code HTTP ──────────────────────────────────────────
if ($adminSent) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Message envoyé',
        'details' => ['admin_sent' => $adminSent, 'user_sent' => $userSent],
    ]);
} else {
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => "Échec de l'envoi, réessayez plus tard."]);
}
