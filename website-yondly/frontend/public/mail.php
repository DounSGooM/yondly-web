<?php
// Configuration headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuration Brevo
$apiKey = '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';
$adminEmail = 'contact@yondly.app'; // Updated to match frontend display
$senderEmail = 'contact@yondly.app';
$senderName = 'L\'équipe Yondly';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'No data received']);
    exit;
}

$type = $input['type'] ?? 'contact';
$data = $input; // Input contains flat data

// 1. Prepare Admin Notification Email
$adminSubject = "";
$adminHtmlContent = "";
$userEmail = $data['email'] ?? '';
$userName = $data['name'] ?? 'Utilisateur';

switch ($type) {
    case 'contact':
        $adminSubject = "Nouvelle demande de Contact - Yondly";
        $adminHtmlContent = "
            <h2>Nouveau message de contact</h2>
            <p><strong>Nom:</strong> " . htmlspecialchars($data['name'] ?? '-') . "</p>
            <p><strong>Email:</strong> " . htmlspecialchars($data['email'] ?? '-') . "</p>
            <p><strong>Sujet:</strong> " . htmlspecialchars($data['subject'] ?? '-') . "</p>
            <p><strong>Message:</strong><br>" . nl2br(htmlspecialchars($data['message'] ?? '-')) . "</p>
        ";
        break;

    case 'waitlist':
        $adminSubject = "Nouvelle inscription Waitlist - Yondly";
        $userName = explode('@', $userEmail)[0];
        $adminHtmlContent = "
            <h2>Nouvelle inscription Waitlist</h2>
            <p><strong>Email:</strong> " . htmlspecialchars($data['email'] ?? '-') . "</p>
            <p><strong>Profil:</strong> " . htmlspecialchars($data['status'] ?? 'Particulier') . "</p>
            <p><strong>Ville:</strong> " . htmlspecialchars($data['city'] ?? '-') . "</p>
            <p><strong>Commentaire:</strong> " . htmlspecialchars($data['comment'] ?? '-') . "</p>
        ";
        break;

    case 'partner':
        $adminSubject = "Nouveau Partenaire Potentiel - Yondly";
        $adminHtmlContent = "
            <h2>Demande Partenaire Pro</h2>
            <p><strong>Nom Contact:</strong> " . htmlspecialchars($data['name'] ?? '-') . "</p>
            <p><strong>Activité / Enseigne:</strong> " . htmlspecialchars($data['business'] ?? '-') . "</p>
            <p><strong>Ville:</strong> " . htmlspecialchars($data['city'] ?? '-') . "</p>
            <p><strong>Email:</strong> " . htmlspecialchars($data['email'] ?? '-') . "</p>
            <p><strong>Téléphone:</strong> " . htmlspecialchars($data['phone'] ?? '-') . "</p>
            <p><strong>Message:</strong><br>" . nl2br(htmlspecialchars($data['message'] ?? '-')) . "</p>
        ";
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid type']);
        exit;
}

// Function to send email via Brevo
function sendEmail($apiKey, $sender, $to, $subject, $htmlContent, $replyTo = null)
{
    $payload = [
        'sender' => $sender,
        'to' => [$to],
        'subject' => $subject,
        'htmlContent' => $htmlContent
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
        'content-type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $httpCode >= 200 && $httpCode < 300;
}

// Function to create or update contact in Brevo
function createOrUpdateContact($apiKey, $email, $attributes = [])
{
    $payload = [
        'email' => $email,
        'updateEnabled' => true
    ];
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
        'content-type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // 201 = Created, 204 = No Content (Updated), 400 = Error (maybe already exists without update)
    return $httpCode >= 200 && $httpCode < 300;
}

// 0. Save Contact to Brevo Database (CRM)
if ($userEmail) {
    $attributes = [];

    // Attempt to parse Name if available (very basic splitting)
    if (!empty($data['name'])) {
        $parts = explode(' ', trim($data['name']), 2);
        $attributes['PRENOM'] = $parts[0];
        if (isset($parts[1])) {
            $attributes['NOM'] = $parts[1];
        } else {
            $attributes['NOM'] = $parts[0]; // Fallback
        }
    }

    // Add specific attributes based on form type if relevant (and if Attributes exist in Brevo)
    // To be safe, we stick to standard attributes for now or basic lists.
    // Ideally user should create attributes VILLE, STATUS in Brevo. 
    // We send them, if they don't exist Brevo ignores them or errors? 
    // Brevo usually ignores unknown attributes or returns default.
    // Let's stick to Email + Name to avoid breaking the script if attributes aren't defined.

    createOrUpdateContact($apiKey, $userEmail, $attributes);
}

// 2. Send Admin Email
$adminSent = sendEmail(
    $apiKey,
    ['name' => $senderName, 'email' => $senderEmail],
    ['email' => $adminEmail, 'name' => 'Admin Yondly'],
    $adminSubject,
    $adminHtmlContent,
    ['email' => $userEmail] // Reply-To user
);

// 3. Send User Confirmation Email (Thank you email)
$userSent = false;
if ($userEmail) {
    $userSubject = "Merci de votre message ! 🚀 - Yondly";
    $userHtmlContent = "
        <html>
        <body style='font-family: Arial, sans-serif; color: #333;'>
            <h2>Bonjour " . htmlspecialchars($userName) . ",</h2>
            <p>Merci de nous avoir contactés ! Nous avons bien reçu votre demande.</p>
            " . ($type === 'waitlist' ? "<p>Vous êtes bien inscrit sur notre liste d'attente. On vous tient au courant très vite ! 🌱</p>" : "<p>Notre équipe va étudier votre message et revenir vers vous sous 48h.</p>") . "
            <br>
            <p>À très vite,</p>
            <p><strong>L'équipe Yondly</strong></p>
        </body>
        </html>
    ";

    $userSent = sendEmail(
        $apiKey,
        ['name' => $senderName, 'email' => $senderEmail],
        ['email' => $userEmail, 'name' => $userName],
        $userSubject,
        $userHtmlContent
    );
}

// Output result
if ($adminSent) {
    echo json_encode([
        'success' => true,
        'message' => 'Emails sent and contact saved',
        'details' => ['admin_sent' => $adminSent, 'user_sent' => $userSent]
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to send admin email']);
}
?>