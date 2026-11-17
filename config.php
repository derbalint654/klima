<?php
/**
 * Az ajánlatkérő űrlap beállításai (a send.php olvassa be).
 * A .htaccess letiltja, hogy böngészőből meg lehessen nyitni.
 *
 * ÉLESÍTÉS ELŐTT KITÖLTENDŐ: cimzett, felado.
 */
return [
    // Erre a címre érkeznek az ajánlatkérések (András e-mail címe).
    'cimzett' => '[ANDRÁS: e-mail cím, ahová az ajánlatkérések jöjjenek]',

    // Feladó: a tárhely domainjén lévő cím (Tárhely.eu cPanel → E-mail fiókok),
    // pl. noreply@andrasklima.hu. Más domainről küldve a levél spambe kerülhet.
    'felado' => 'noreply@andrasklima.hu',
    'felado_nev' => 'Weboldal – ajánlatkérés',

    // Spamvédelem
    'min_kitoltesi_ido' => 3,       // másodperc: ennél gyorsabb beküldés = robot
    'max_kitoltesi_ido' => 86400,   // másodperc (1 nap): ennél régebbi oldalról = robot
    'max_link' => 2,                // ennél több link az üzenetben = spam
    'ip_limit' => 5,                // ennyi üzenet ...
    'ip_ablak' => 3600,             // ... ennyi másodperc alatt egy IP-címről

    // Az IP-korlát átmeneti fájljai. A mappát a data/.htaccess védi.
    'adat_mappa' => __DIR__ . '/data',
];
