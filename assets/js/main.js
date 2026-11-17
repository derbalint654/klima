/* Dér András – Klímaszerelés | egyetlen JS fájl */
(function () {
  'use strict';

  var doc = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- Évszám a láblécben ---------- */
  var ev = $('#ev');
  if (ev) ev.textContent = new Date().getFullYear();

  /* ---------- Fejléc görgetéskor ---------- */
  var header = $('.site-header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 20); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobilmenü ---------- */
  var toggle = $('.menu-toggle');
  var nav = $('#fomenu');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    if (open) { var first = $('a', nav); if (first) first.focus(); }
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { if (nav.classList.contains('is-open')) setMenu(false); }); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1040 && nav.classList.contains('is-open')) setMenu(false); });

  /* ---------- Aktív menüpont ---------- */
  var navLinks = $$('.main-nav a[href^="#"]:not(.btn)');
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) {
          if (l.getAttribute('href') === '#' + en.target.id) l.setAttribute('aria-current', 'true');
          else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (l) { var s = $(l.getAttribute('href')); if (s) secObs.observe(s); });
  }

  /* ---------- Beúszó elemek + számlálók ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count), pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = pre + target + suf; return; }
    var start = null, dur = 1400;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + Math.round(target * eased) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var reveals = $$('.reveal');
  // Testvér-elemek egymás után úsznak be
  reveals.forEach(function (el) {
    var sibs = $$(':scope > .reveal', el.parentElement);
    var i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', Math.min(i, 5) * 0.08 + 's');
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        $$('[data-count]', en.target).forEach(countUp);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { obs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
    $$('[data-count]').forEach(countUp);
  }

  /* ---------- Termosztát: 35 → 22 °C ---------- */
  var dialNum = $('#dial-num');
  if (dialNum) {
    if (reduceMotion) { dialNum.textContent = '22'; }
    else {
      var from = 35, to = 22, t0 = null, d = 2600, delay = 300;
      setTimeout(function () {
        requestAnimationFrame(function tick(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / d, 1);
          var e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
          dialNum.textContent = Math.round(from + (to - from) * e);
          if (p < 1) requestAnimationFrame(tick);
        });
      }, delay);
    }
  }

  /* ---------- „Tudtad?” érdekességek ---------- */
  var facts = [
    'Az első modern klímát 1902-ben Willis Carrier tervezte – de nem embereknek, hanem egy nyomdának, hogy a páratartalom ne hullámosítsa a papírt.',
    'A klíma párátlanít is: egy fülledt nyári napon a kifolyócsövön akár 10 liternél is több víz távozhat.',
    'A klíma és a hűtőszekrény ugyanazon az elven működik: a hűtőközeg elpárolgása hőt von el. A klíma tulajdonképpen „beteszi a szobádat a hűtőbe”.',
    'A „klíma” szó a görög klima szóból ered, ami eredetileg lejtést, hajlásszöget jelentett – a napsugarak beesési szögére utalva.',
    'Nyáron érdemes legfeljebb 6–8 fokkal hűvösebbre állítani a lakást, mint kint – így elkerülhető a hősokk és a megfázás.',
    'Az inverteres klíma nem kapcsolgat ki-be, hanem fokozatmentesen szabályoz, ezért csendesebb és jóval takarékosabb, mint a régi típusok.'
  ];
  var factIdx = 0, factBtn = $('#funfact-btn'), factText = $('#funfact-text');
  if (factBtn && factText) {
    factBtn.addEventListener('click', function () {
      factIdx = (factIdx + 1) % facts.length;
      factText.classList.add('is-changing');
      setTimeout(function () {
        factText.textContent = facts[factIdx];
        factText.classList.remove('is-changing');
      }, reduceMotion ? 0 : 250);
    });
  }

  /* ---------- Ajánlatkérő űrlap ---------- */
  var form = $('#ajanlat-form');
  if (!form) return;
  var ts = $('#ts'); if (ts) ts.value = String(Math.floor(Date.now() / 1000));
  var statusEl = $('#form-status'), submitBtn = $('#kuldes-gomb'), success = $('#form-success');
  // A böngésző saját buborékjai helyett a saját, felolvasható hibaüzeneteinket használjuk.
  // JS nélkül a böngésző beépített ellenőrzése és a send.php dolgozik.
  form.noValidate = true;
  var labels = {
    nev: 'a neved', telefon: 'a telefonszámod', telepules: 'a települést vagy kerületet',
    szolgaltatas: 'Kérlek, válassz szolgáltatást.', adatkezeles: 'Az ajánlatkéréshez el kell fogadnod az adatkezelési tájékoztatót.'
  };
  var fields = $$('input:not([type="hidden"]):not([type="radio"]):not(#weboldal), select, textarea', form);
  var phoneLink = '<a href="tel:+36303851475">+36 30 385 1475</a>';
  // JS nélküli beküldés után visszairányított hiba (send.php ?hiba=1)
  if (/[?&]hiba=1/.test(location.search)) {
    statusEl.textContent = 'Nem sikerült elküldeni az üzenetet. Kérlek, ellenőrizd az adatokat és próbáld újra.';
    statusEl.classList.add('is-error');
  }

  function message(el) {
    var v = el.validity, name = el.name;
    if (v.valid) return '';
    if (v.valueMissing) {
      if (name === 'szolgaltatas' || name === 'adatkezeles') return labels[name];
      return 'Kérlek, add meg ' + labels[name] + '.';
    }
    if (v.typeMismatch && el.type === 'email') return 'Kérlek, érvényes e-mail címet adj meg (pl. nev@pelda.hu).';
    if (v.patternMismatch && name === 'telefon') return 'Kérlek, érvényes telefonszámot adj meg (pl. +36 30 123 4567).';
    if (v.tooShort) return 'Kérlek, add meg a teljes neved.';
    if (v.tooLong) return 'Legfeljebb ' + el.maxLength + ' karakter lehet.';
    return 'Kérlek, ellenőrizd ezt a mezőt.';
  }
  function check(el) {
    if (el.type !== 'checkbox' && el.value) el.value = el.value.replace(/^\s+/, '');
    var msg = message(el), err = $('#' + el.id + '-hiba');
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
    return !msg;
  }
  fields.forEach(function (el) {
    el.addEventListener('blur', function () { if (el.dataset.touched) check(el); });
    el.addEventListener('input', function () { el.dataset.touched = '1'; if (el.getAttribute('aria-invalid') === 'true') check(el); });
    el.addEventListener('change', function () { el.dataset.touched = '1'; check(el); });
  });

  function setStatus(msg, isError, asHtml) {
    if (asHtml) statusEl.innerHTML = msg; else statusEl.textContent = msg;
    statusEl.classList.toggle('is-error', !!isError);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('', false);
    var firstBad = null;
    fields.forEach(function (el) { el.dataset.touched = '1'; if (!check(el) && !firstBad) firstBad = el; });
    if (firstBad) {
      setStatus('Kérlek, javítsd a pirossal jelölt mezőket.', true);
      firstBad.focus();
      return;
    }

    // Előnézet: helyi fájl vagy GitHub Pages – itt nincs PHP, ezért nem próbálunk küldeni.
    if (location.protocol === 'file:' || /\.github\.io$/i.test(location.hostname)) {
      setStatus('Ez az oldal előnézete, innen az űrlap még nem küld üzenetet. Hívj inkább: ' + phoneLink + '.', true, true);
      return;
    }

    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.disabled = true;
    $('.btn-label', submitBtn).textContent = 'Küldés folyamatban…';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'fetch' }
    })
      .then(function (r) {
        return r.json().catch(function () { return { ok: false, message: '' }; });
      })
      .then(function (data) {
        if (data && data.ok) {
          form.hidden = true;
          success.hidden = false;
          success.focus();
          form.reset();
          fields.forEach(function (el) { delete el.dataset.touched; el.removeAttribute('aria-invalid'); });
        } else {
          if (data && data.errors) {
            Object.keys(data.errors).forEach(function (k) {
              var el = form.elements[k], err = $('#' + k + '-hiba');
              if (el && err) { el.setAttribute('aria-invalid', 'true'); err.textContent = data.errors[k]; }
            });
          }
          setStatus((data && data.message) || 'Hiba történt a küldés közben. Kérlek, próbáld újra, vagy hívj: +36 30 385 1475.', true);
          var firstErr = $('[aria-invalid="true"]', form); if (firstErr) firstErr.focus();
        }
      })
      .catch(function () {
        setStatus('Nem sikerült kapcsolódni a szerverhez. Kérlek, próbáld újra később, vagy hívj: +36 30 385 1475.', true);
      })
      .then(function () {
        submitBtn.removeAttribute('aria-busy');
        submitBtn.disabled = false;
        $('.btn-label', submitBtn).textContent = 'Ajánlatkérés elküldése';
      });
  });

  var again = $('#uj-uzenet');
  if (again) again.addEventListener('click', function () {
    success.hidden = true; form.hidden = false; setStatus('', false);
    if (ts) ts.value = String(Math.floor(Date.now() / 1000));
    $('#nev').focus();
  });
})();
