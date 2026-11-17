# Dér András – Klímaszerelés (andrasklima.hu)

Egyoldalas bemutatkozó oldal klímaszereléshez Budapesten és Pomáz környékén.
Sima HTML + CSS + JS, build lépés és külső függőség nélkül. Élesben a **Tárhely.eu**-n fut (PHP 8),
a GitHub Pages csak előnézet.

## Mi van a repóban?

| Fájl / mappa | Mire való |
|---|---|
| `index.html` | A teljes oldal (hero, szolgáltatások, terület, miért klíma, árak, GYIK, rólam, ajánlatkérés) |
| `koszonjuk.html` | Visszaigazolás JS nélküli űrlapküldés után |
| `adatkezeles.html` | Adatkezelési tájékoztató (**vázlat, jogász nézze át**) |
| `send.php` | Az ajánlatkérő űrlap feldolgozója (e-mailt küld Andrásnak) |
| `config.php` | Az űrlap beállításai: címzett, feladó, spamlimitek. A `.htaccess` letiltja |
| `data/` | Az IP-korlát átmeneti fájljai (böngészőből nem elérhető) |
| `.htaccess` | HTTPS-átirányítás, tömörítés, gyorsítótár, biztonsági fejlécek, tiltások |
| `assets/css/style.css` | Az egyetlen stíluslap. A színek a `:root` változókban vannak |
| `assets/js/main.js` | Az egyetlen szkript: menü, animációk, űrlap-ellenőrzés és -küldés |
| `assets/img/` | Képek: `fotok/` (Unsplash), `rolam/` (András), `miert/`, `terulet/` (SVG-rajzok), `social/` |
| `assets/fonts/` | Bricolage Grotesque (latin + latin-ext, az ő/ű miatt) |
| `robots.txt`, `sitemap.xml` | Alap SEO |
| `LICENSES.md` | A képek forrása és licence |

## Feltöltés a Tárhely.eu-ra

1. cPanel → **SSL/TLS** (AutoSSL): kapcsold be az ingyenes tanúsítványt a domainre.
2. cPanel → **E-mail fiókok**: hozd létre a feladó címet (pl. `noreply@andrasklima.hu`).
3. cPanel → **Fájlkezelő** → `public_html`: töltsd fel a repó tartalmát, a rejtett fájlokkal együtt
   (`.htaccess`, `data/.htaccess`). A `.git`, `README.md`, `LICENSES.md` feltöltése nem kell.
4. Állítsd be a `config.php`-t (lásd lent), majd küldj egy próbaüzenetet az oldalról
   (nézd meg a spam mappát is).
5. Ha a HTTPS biztosan működik, a `.htaccess`-ben bekapcsolható a HSTS-sor.

Ha az SSL még nem él, a `.htaccess` HTTPS-átirányító blokkját ideiglenesen tedd megjegyzésbe.

## Élesítés előtt kitöltendő

- `config.php`: **`cimzett`** (András e-mail címe) és **`felado`** (a tárhely domainjén lévő cím).
- Az `index.html` és az `adatkezeles.html` összes **`[ANDRÁS: …]`** helyőrzője
  (keresd így: `grep -n "ANDRÁS" *.html`). A kék szaggatott keretes dobozok csak addig maradnak bent.
- Az `adatkezeles.html` végleges szövegét jogász nézze át.
- **Domain:** a canonical, az `og:url`, az `og:image`, a JSON-LD és a `sitemap.xml` / `robots.txt`
  az `andrasklima.hu`-ra mutat. **Amíg a domain nincs megvéve, ezek a címek nem élnek.**
  Ha más domain lesz, mindenhol cseréld le. Az `info@andrasklima.hu` cím is csak a domainnel együtt működik.
- Facebook: amíg nincs valódi oldal, a link ki van véve. A lábléc HTML-kommentje mutatja, hová kell visszatenni.

## Az űrlap működése

- JS-sel: a `main.js` ellenőriz, majd `fetch`-csel küld (`X-Requested-With: fetch`), és JSON-t kap vissza
  (`{ok, message, errors}`). GitHub Pages-en (`*.github.io`) és helyi fájlként nem küld, hanem kiírja,
  hogy ez előnézet, és megmutatja a telefonszámot.
- JS nélkül: sima POST; siker → `koszonjuk.html`, hiba → `index.html?hiba=1`.
- Kötelező: név, telefon, település, szolgáltatás, adatkezelés elfogadása. Nem kötelező: e-mail, üzenet, „Mikor érsz rá?”.
- Spamvédelem: rejtett `weboldal` csapdamező; `ts` időbélyeg (3 mp-nél gyorsabb vagy 1 napnál régebbi
  beküldés = robot; JS nélkül nincs időbélyeg, ilyenkor ez a lépés kimarad); legfeljebb 5 üzenet / óra / IP;
  legfeljebb 2 link az üzenetben; sortörések kiszűrése a fejlécekből.
- A levél Andrásnak megy, a `Reply-To` az ügyfél címe (ha megadta), a tárgyban a szolgáltatás és a település.

Helyi teszt: `php -S localhost:8000`, majd http://localhost:8000 (a levélküldéshez a gépen beállított
`sendmail` kell; enélkül a `send.php` „technikai hiba” választ ad).

## Képek cseréje

A képek témánként vannak az `assets/img/` mappában. Új fotónál készíts WebP-t két méretben
(pl. https://squoosh.app), és az `index.html`-ben írd át az `src`/`srcset`-et, a `width`/`height`-et és az `alt` szöveget.
