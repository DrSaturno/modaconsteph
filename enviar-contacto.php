<!-- Contact Section - HTML actualizado -->
<?php
// /enviar-contacto.php
header('Content-Type: application/json; charset=utf-8');

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'message' => 'Método no permitido']);
  exit;
}

// Honeypot simple
if (!empty($_POST['website'] ?? '')) {
  echo json_encode(['success' => true]); // silencioso para bots
  exit;
}

// Sanitización
$nombre   = trim($_POST['nombre']   ?? '');
$email    = trim($_POST['email']    ?? '');
$telefono = trim($_POST['telefono'] ?? '');
$curso    = trim($_POST['curso']    ?? '');
$mensaje  = trim($_POST['mensaje']  ?? '');

// Validaciones
if ($nombre === '' || $email === '' || $mensaje === '') {
  echo json_encode(['success' => false, 'message' => 'Completá nombre, email y mensaje.']);
  exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  echo json_encode(['success' => false, 'message' => 'Email inválido.']);
  exit;
}

// Email
$to      = 'hola@modaconsteph.com';
$subject = 'Nueva consulta desde la web - Moda con Steph';

$body = "Nueva consulta desde la web:\n\n"
      . "Nombre:   {$nombre}\n"
      . "Email:    {$email}\n"
      . "Teléfono: {$telefono}\n"
      . "Interés:  {$curso}\n\n"
      . "Mensaje:\n{$mensaje}\n\n"
      . "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'N/D');

// Headers: usar remitente del MISMO dominio para pasar SPF/DMARC
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: Web Moda con Steph <no-reply@modaconsteph.com>';
$headers[] = 'Reply-To: ' . $nombre . ' <' . $email . '>';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$ok = @mail(
  $to,
  '=?UTF-8?B?'.base64_encode($subject).'?=',
  $body,
  implode("\r\n", $headers)
);

if ($ok) {
  echo json_encode(['success' => true]);
} else {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'No se pudo enviar el mail en el servidor. Probá SMTP.'
  ]);
}
