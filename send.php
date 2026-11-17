<?php
/**
 * Ajánlatkérő űrlap feldolgozó – Dér András Klímaszerelés (Tárhely.eu, PHP 8)
 *
 * - A beállítások a config.php-ban vannak (címzett, feladó, limitek).
 * - Ugyanazokat a szabályokat ellenőrzi, mint az assets/js/main.js.
 * - fetch-ből (X-Requested-With: fetch) JSON-t ad vissza: {ok, message, errors}.
 * - JS nélkül: siker → koszonjuk.html, hiba → index.html?hiba=1#ajanlatkeres.
 */
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');
mb_internal_encoding('UTF-8');
date_default_timezone_set('Europe/Budapest');

$config = require __DIR__ . '/config.php';

$ajax = ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch';

const SZOLGALTATASOK = [
    'Klímaberendezés beszerzése',
    'Klíma felszerelése, beütemezése',
    'Klímatisztítás',
    'Klíma fertőtlenítése',
    'Klíma javítása',
    'Szivárgás keresése',
    'Egyéb / még nem tudom',
];
const IDOPONTOK = ['Hétköznap délelőtt', 'Hétköznap délután', 'Hétvégén'];
const TELEFON_MINTA = '/^[0-9 +()\/\-]{7,20}$/';   // ugyanaz, mint az index.html pattern-je

function valasz(bool $ok, string $uzenet = '', array $hibak = [], int $kod = 200): never
{
    global $ajax;
    if ($ajax) {
        http_response_code($ok ? 200 : ($kod !== 200 ? $kod : 422));
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $uzenet, 'errors' => (object) $hibak], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: ' . ($ok ? 'koszonjuk.html' : 'index.html?hiba=1#ajanlatkeres'), true, 303);
    }
    exit;
}

/** Robotnak „sikert” mondunk, de nem küldünk semmit. */
function robot(): never
{
    valasz(true, 'Köszönöm, megkaptam az üzeneted!');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: index.html', true, 303);
    exit;
}

// --- 1. Honeypot: a rejtett „weboldal” mezőt ember nem tölti ki ---
if (trim((string) ($_POST['weboldal'] ?? '')) !== '') {
    robot();
}

// --- 2. Időbélyeg: 3 mp-nél gyorsabb vagy 1 napnál régebbi beküldés = robot ---
// A ts-t a main.js tölti ki. JS nélkül üres marad: ilyenkor ezt a lépést kihagyjuk,
// a többi védelem (honeypot, IP-korlát, linkszám) akkor is működik.
$ts = (string) ($_POST['ts'] ?? '');
if ($ts !== '') {
    if (!ctype_digit($ts)) {
        robot();
    }
    $eltelt = time() - (int) $ts;
    if ($eltelt < (int) $config['min_kitoltesi_ido'] || $eltelt > (int) $config['max_kitoltesi_ido']) {
        robot();
    }
}

// --- Mezők tisztítása (fejléc-befecskendezés ellen minden sortörés kikerül) ---
function egysoros(string $kulcs, int $max): string
{
    $v = (string) ($_POST[$kulcs] ?? '');
    $v = preg_replace('/[\r\n\t\x00-\x1F\x7F]+/u', ' ', $v) ?? '';
    $v = trim(strip_tags($v));
    return mb_substr($v, 0, $max);
}

$nev          = egysoros('nev', 80);
$telefon      = egysoros('telefon', 20);
$email        = egysoros('email', 120);
$telepules    = egysoros('telepules', 80);
$szolgaltatas = egysoros('szolgaltatas', 80);
$idopont      = egysoros('idopont', 40);
$uzenet       = (string) ($_POST['uzenet'] ?? '');
$uzenet       = trim(strip_tags(str_replace("\0", '', $uzenet)));
$adatkezeles  = ($_POST['adatkezeles'] ?? '') === 'igen';

// --- 3. Ellenőrzés: ugyanazok a szabályok, mint a main.js-ben ---
$hibak = [];
if (mb_strlen($nev) < 2) {
    $hibak['nev'] = 'Kérlek, add meg a neved.';
}
if ($telefon === '') {
    $hibak['telefon'] = 'Kérlek, add meg a telefonszámod.';
} elseif (!preg_match(TELEFON_MINTA, $telefon)) {
    $hibak['telefon'] = 'Kérlek, érvényes telefonszámot adj meg (pl. +36 30 123 4567).';
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $hibak['email'] = 'Kérlek, érvényes e-mail címet adj meg (pl. nev@pelda.hu).';
}
if ($telepules === '') {
    $hibak['telepules'] = 'Kérlek, add meg a települést vagy kerületet.';
}
if (!in_array($szolgaltatas, SZOLGALTATASOK, true)) {
    $hibak['szolgaltatas'] = 'Kérlek, válassz szolgáltatást.';
}
if ($idopont !== '' && !in_array($idopont, IDOPONTOK, true)) {
    $idopont = '';
}
if (mb_strlen($uzenet) > 2000) {
    $hibak['uzenet'] = 'Legfeljebb 2000 karakter lehet.';
}
if (!$adatkezeles) {
    $hibak['adatkezeles'] = 'Az ajánlatkéréshez el kell fogadnod az adatkezelési tájékoztatót.';
}
if ($hibak) {
    valasz(false, 'Kérlek, javítsd a pirossal jelölt mezőket.', $hibak);
}

// --- 4. Túl sok link az üzenetben = spam ---
if (preg_match_all('~(https?://|www\.)~i', $uzenet) > (int) $config['max_link']) {
    robot();
}

// --- 5. IP-alapú korlát: legfeljebb N üzenet / óra ---
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'ismeretlen');
$mappa = (string) $config['adat_mappa'];
if (!is_dir($mappa)) {
    @mkdir($mappa, 0750, true);
}
$korlatFajl = $mappa . '/rl_' . hash('sha256', $ip) . '.json';
$most = time();
$idok = [];
if (is_file($korlatFajl)) {
    $idok = json_decode((string) @file_get_contents($korlatFajl), true) ?: [];
}
$idok = array_values(array_filter($idok, static fn($t) => is_int($t) && $t > $most - (int) $config['ip_ablak']));
if (count($idok) >= (int) $config['ip_limit']) {
    valasz(false, 'Túl sok üzenet érkezett innen rövid idő alatt. Kérlek, próbáld újra később, vagy hívj: +36 30 385 1475.', [], 429);
}

// --- 6. Levél összeállítása ---
$cimzett = (string) $config['cimzett'];
$felado  = (string) $config['felado'];
if (!filter_var($cimzett, FILTER_VALIDATE_EMAIL) || !filter_var($felado, FILTER_VALIDATE_EMAIL)) {
    error_log('send.php: a config.php-ban nincs beállítva érvényes címzett/feladó.');
    valasz(false, 'Az űrlap még nincs beállítva. Kérlek, hívj: +36 30 385 1475.', [], 500);
}

$enc = static fn(string $s): string => '=?UTF-8?B?' . base64_encode($s) . '?=';

$targy = 'Ajánlatkérés: ' . $szolgaltatas . ' – ' . $telepules;

$torzs  = "Új ajánlatkérés érkezett a weboldalról.\n\n";
$torzs .= "Név:            {$nev}\n";
$torzs .= "Telefon:        {$telefon}\n";
$torzs .= 'E-mail:         ' . ($email !== '' ? $email : '(nem adta meg)') . "\n";
$torzs .= "Település:      {$telepules}\n";
$torzs .= "Szolgáltatás:   {$szolgaltatas}\n";
$torzs .= 'Mikor ér rá:    ' . ($idopont !== '' ? $idopont : '(nem adta meg)') . "\n\n";
$torzs .= "Üzenet:\n" . ($uzenet !== '' ? $uzenet : '(nem írt üzenetet)') . "\n\n";
$torzs .= '--' . "\nKüldve: " . date('Y-m-d H:i') . " | IP: {$ip}\n";

$fejlecek = [
    'From: ' . $enc((string) $config['felado_nev']) . " <{$felado}>",
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: andrasklima-urlap',
];
if ($email !== '') {
    $fejlecek[] = 'Reply-To: ' . $enc($nev) . " <{$email}>";
}

$elkuldve = @mail($cimzett, $enc($targy), $torzs, implode("\r\n", $fejlecek), '-f' . $felado);

if (!$elkuldve) {
    error_log('send.php: a mail() nem sikerült.');
    valasz(false, 'Technikai hiba miatt nem sikerült elküldeni az üzenetet. Kérlek, hívj: +36 30 385 1475.', [], 500);
}

$idok[] = $most;
@file_put_contents($korlatFajl, json_encode($idok), LOCK_EX);

valasz(true, 'Köszönöm, megkaptam az üzeneted!');
