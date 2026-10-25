/* «Yurist va Kadr» — telefon menyusi, aloqa tugmasi, yuqoriga qaytish */
(function () {
  var MANAGER = 'https://t.me/yuristkadr_menejer';
  var PHONE = '+998900108615', PHONE_TXT = '+998 90 010 86 15';
  var row = document.querySelector('.site-head .wrap') || document.querySelector('.brandrow .wrap');
  var nav = document.querySelector('.site-head .hnav') || document.querySelector('.menu nav');
  var head = document.querySelector('.site-head');
  if (head) {
    var hs = function () { head.classList.toggle('solid', head.classList.contains('static') || window.scrollY > 40); };
    hs(); window.addEventListener('scroll', hs, { passive: true });
  }

  function icon(id) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#' + id + '"/></svg>'; }

  /* 1) Telefon menyusi */
  if (row && nav && !document.querySelector('.site-head')) {
    var burger = document.createElement('button');
    burger.type = 'button';
    burger.className = 'burger';
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'drawer');
    burger.innerHTML = '<span class="bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="bl">Menyu</span>';
    row.appendChild(burger);

    var drawer = document.createElement('div');
    drawer.id = 'drawer';
    drawer.className = 'drawer';
    drawer.hidden = true;
    var links = [].map.call(nav.querySelectorAll('a'), function (a) {
      return '<a href="' + a.getAttribute('href') + '"' + (a.classList.contains('on') ? ' class="on"' : '') + '>' + a.textContent.trim() + '</a>';
    }).join('');
    drawer.innerHTML =
      '<div class="drawer-bg" data-close></div>' +
      '<aside class="drawer-panel" role="dialog" aria-modal="true" aria-label="Menyu">' +
        '<div class="drawer-top"><b>Menyu</b><button type="button" class="drawer-x" data-close aria-label="Yopish">✕</button></div>' +
        '<nav class="drawer-nav">' + links + '</nav>' +
        '<div class="drawer-lang"></div>' +
        '<a class="btn drawer-cta" href="' + (document.getElementById('royxat') ? '#royxat' : 'index.html#royxat') + '">Roʻyxatdan oʻtish</a>' +
        '<div class="drawer-contact"><a href="' + MANAGER + '" target="_blank" rel="noopener">' + icon('i-tg') + 'Menejerga yozish</a><a href="tel:' + PHONE + '">' + icon('i-phone') + PHONE_TXT + '</a></div>' +
      '</aside>';
    document.body.appendChild(drawer);
    var lang = document.querySelector('.site-head .lang') || document.querySelector('.brandrow .lang');
    if (lang) {
      var lc = lang.cloneNode(true);
      drawer.querySelector('.drawer-lang').appendChild(lc);
      lc.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () { if (window.ykSetLang) window.ykSetLang(b.getAttribute('data-lang')); });
      });
    }
    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      drawer.hidden = false;
      requestAnimationFrame(function () { drawer.classList.add('open'); });
      burger.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('no-scroll');
      var f = drawer.querySelector('.drawer-x'); if (f) f.focus();
    }
    function close() {
      drawer.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('no-scroll');
      setTimeout(function () { drawer.hidden = true; }, 250);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    burger.addEventListener('click', open);
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]') || e.target.closest('.drawer-nav a, .drawer-cta')) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hidden) close(); });
  }

  /* 2) Doim ko'rinadigan aloqa tugmasi */
  var fab = document.createElement('div');
  fab.className = 'fab';
  fab.innerHTML =
    '<div class="fab-menu" id="fabMenu" hidden>' +
      '<a class="fab-item tg" href="' + MANAGER + '" target="_blank" rel="noopener">' + icon('i-tg') + '<span>Menejerga yozish</span></a>' +
      '<a class="fab-item ph" href="tel:' + PHONE + '">' + icon('i-phone') + '<span>' + PHONE_TXT + '</span></a>' +
    '</div>' +
    '<button type="button" class="fab-main" aria-expanded="false" aria-controls="fabMenu" aria-label="Biz bilan bogʻlaning">' +
      '<span class="fab-ic fab-ic-chat">' + icon('i-chat') + '</span><span class="fab-ic fab-ic-x" aria-hidden="true">✕</span>' +
    '</button>';
  document.body.appendChild(fab);
  var fm = fab.querySelector('.fab-menu'), fb = fab.querySelector('.fab-main');
  fb.addEventListener('click', function () {
    var on = fm.hidden;
    fm.hidden = !on;
    fab.classList.toggle('on', on);
    fb.setAttribute('aria-expanded', String(on));
  });
  document.addEventListener('click', function (e) {
    if (!fm.hidden && !e.target.closest('.fab')) { fm.hidden = true; fab.classList.remove('on'); fb.setAttribute('aria-expanded', 'false'); }
  });

  /* 3) Yuqoriga qaytish */
  var top = document.createElement('button');
  top.type = 'button';
  top.className = 'totop';
  top.setAttribute('aria-label', 'Yuqoriga');
  top.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(top);
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      top.classList.toggle('show', window.scrollY > 700);
      ticking = false;
    });
  }, { passive: true });
})();

/* Galereya: rasmni kattalashtirib ko'rish */
(function () {
  var gal = document.getElementById('gal');
  if (!gal) return;
  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.hidden = true;
  lb.innerHTML =
    '<div class="lb-bg" data-x></div>' +
    '<figure class="lb-fig" role="dialog" aria-modal="true" aria-label="Rasm">' +
      '<img class="lb-img" alt="">' +
      '<figcaption class="lb-cap"><span class="lb-t"></span><a class="lb-link" target="_blank" rel="noopener">Telegramda ochish</a></figcaption>' +
    '</figure>' +
    '<button type="button" class="lb-btn lb-prev" aria-label="Oldingi">‹</button>' +
    '<button type="button" class="lb-btn lb-next" aria-label="Keyingi">›</button>' +
    '<button type="button" class="lb-btn lb-close" data-x aria-label="Yopish">✕</button>';
  document.body.appendChild(lb);
  var img = lb.querySelector('.lb-img'), cap = lb.querySelector('.lb-t'), link = lb.querySelector('.lb-link');
  var items = [], idx = 0, last = null;
  function visible() { return [].filter.call(gal.querySelectorAll('a'), function (a) { return !a.hidden; }); }
  function show(i) {
    idx = (i + items.length) % items.length;
    var a = items[idx], th = a.querySelector('img'), fc = a.querySelector('figcaption');
    img.src = th.getAttribute('src').replace(/\.jpg$/, '_L.jpg');
    img.alt = th.alt;
    var lab = fc && fc.querySelector('span'), rest = fc ? [].filter.call(fc.childNodes, function (n) { return n !== lab; }).map(function (n) { return n.textContent; }).join('').trim() : '';
    cap.textContent = (lab ? lab.textContent.trim() + ' · ' : '') + rest;
    link.href = a.href;
  }
  function open(a) {
    items = visible(); last = a;
    show(items.indexOf(a));
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('open'); });
    document.documentElement.classList.add('no-scroll');
    lb.querySelector('.lb-close').focus();
  }
  function close() {
    lb.classList.remove('open');
    document.documentElement.classList.remove('no-scroll');
    setTimeout(function () { lb.hidden = true; img.removeAttribute('src'); }, 200);
    if (last) last.focus();
  }
  gal.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    open(a);
  });
  lb.addEventListener('click', function (e) {
    if (e.target.closest('[data-x]')) close();
    else if (e.target.closest('.lb-prev')) show(idx - 1);
    else if (e.target.closest('.lb-next')) show(idx + 1);
  });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  var sx = null;
  lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  });
})();


/* Telefon maydonlari: +998 XX XXX XX XX */
(function () {
  function fmt(v) {
    var d = v.replace(/\D/g, '');
    if (d.indexOf('998') === 0) d = d.slice(3);
    d = d.slice(0, 9);
    var o = '+998';
    if (d.length) o += ' ' + d.slice(0, 2);
    if (d.length > 2) o += ' ' + d.slice(2, 5);
    if (d.length > 5) o += ' ' + d.slice(5, 7);
    if (d.length > 7) o += ' ' + d.slice(7, 9);
    return o;
  }
  document.querySelectorAll('input[type=tel]').forEach(function (el) {
    el.addEventListener('focus', function () { if (!el.value) el.value = '+998 '; });
    el.addEventListener('blur', function () { if (el.value.replace(/\D/g, '') === '998') el.value = ''; });
    el.addEventListener('input', function () {
      var atEnd = el.selectionStart === el.value.length;
      el.value = fmt(el.value);
      if (atEnd) el.setSelectionRange(el.value.length, el.value.length);
    });
  });
})();

/* Hujjat namunalari: Word fayli serverda boʻlsa, «Word» tugmasini qoʻshish */
(function () {
  document.querySelectorAll('.doc[data-docx]').forEach(function (d) {
    var u = d.getAttribute('data-docx');
    fetch(u, { method: 'HEAD' }).then(function (r) {
      if (!r.ok) return;
      var a = document.createElement('a');
      a.className = 'doc-w'; a.href = u; a.setAttribute('download', '');
      a.textContent = 'Word';
      d.querySelector('.doc-act').appendChild(a);
    }).catch(function () {});
  });
})();

/* Tez aloqa oynasi: sarlavhadagi «Bogʻlanish» tugmasi */
(function () {
  var triggers = document.querySelectorAll('[data-cb]');
  if (!triggers.length) return;
  var MANAGER = 'yuristkadr_menejer';
  var m = document.createElement('div');
  m.className = 'cb-modal'; m.hidden = true;
  m.innerHTML =
    '<div class="cb-bg" data-cbx></div>' +
    '<div class="cb-box" role="dialog" aria-modal="true" aria-labelledby="cbT">' +
      '<button type="button" class="cb-x" data-cbx aria-label="Yopish">✕</button>' +
      '<h3 id="cbT">Sizga qoʻngʻiroq qilamiz</h3>' +
      '<p>Raqamingizni qoldiring — menejerimiz kurslar, narx va guruhlar haqida maʼlumot beradi.</p>' +
      '<form class="cb-f" novalidate>' +
        '<label>Ismingiz<input name="name" autocomplete="name" placeholder="Masalan, Dilnoza" required></label>' +
        '<label>Telefon raqamingiz<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998 90 123 45 67" required></label>' +
        '<label>Qaysi kurs qiziqtiradi?<select name="format">' +
          '<option value="Hali tanlamadim, maslahat kerak">Hali tanlamadim, maslahat kerak</option><option value="Onlayn kurs">Onlayn kurs</option><option value="Oflayn kurs (9 kun)">Oflayn kurs (9 kun)</option><option value="Shanba va yakshanbalik kurs">Shanba va yakshanbalik kurs</option><option value="Xarid faoliyati kursi">Xarid faoliyati kursi</option>' +
        '</select></label>' +
        '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<p class="cb-msg" hidden></p>' +
        '<button class="btn" type="submit">Qoʻngʻiroq qilishingizni kutaman</button>' +
        '<p class="cb-alt">Yoki hozir yozing: <a href="https://t.me/' + MANAGER + '" target="_blank" rel="noopener">@' + MANAGER + '</a> · <a href="tel:+998900108615">+998 90 010 86 15</a></p>' +
      '</form>' +
    '</div>';
  document.body.appendChild(m);
  var f = m.querySelector('form'), msg = m.querySelector('.cb-msg'), btn = f.querySelector('button[type=submit]'), last = null;

  // telefon niqobi
  var ph = f.phone;
  ph.addEventListener('focus', function () { if (!ph.value) ph.value = '+998 '; });
  ph.addEventListener('input', function () {
    var d = ph.value.replace(/\D/g, ''); if (d.indexOf('998') === 0) d = d.slice(3); d = d.slice(0, 9);
    var o = '+998'; if (d.length) o += ' ' + d.slice(0, 2); if (d.length > 2) o += ' ' + d.slice(2, 5); if (d.length > 5) o += ' ' + d.slice(5, 7); if (d.length > 7) o += ' ' + d.slice(7, 9);
    ph.value = o;
  });

  function open(e) {
    if (e) e.preventDefault();
    last = document.activeElement; m.hidden = false; msg.hidden = true;
    requestAnimationFrame(function () { m.classList.add('open'); });
    document.documentElement.classList.add('no-scroll');
    setTimeout(function () { f.name.focus(); }, 60);
  }
  function close() {
    m.classList.remove('open'); document.documentElement.classList.remove('no-scroll');
    setTimeout(function () { m.hidden = true; }, 250);
    if (last && last.focus) last.focus();
  }
  [].forEach.call(triggers, function (t) { t.addEventListener('click', open); });
  m.addEventListener('click', function (e) { if (e.target.closest('[data-cbx]')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !m.hidden) close(); });

  function show(text, cls) { msg.innerHTML = text; msg.className = 'cb-msg ' + cls; msg.hidden = false; }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = f.name.value.trim(), phone = f.phone.value.trim();
    if (name.length < 2) { show('Ismingizni yozing.', 'bad'); f.name.focus(); return; }
    if (phone.replace(/\D/g, '').length < 12) { show('Telefon raqamini toʻliq yozing.', 'bad'); f.phone.focus(); return; }
    btn.disabled = true; var lbl = btn.textContent; btn.textContent = 'Yuborilmoqda…';
    var ctl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 10000);
    fetch('ariza.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl ? ctl.signal : undefined,
      body: JSON.stringify({ name: name, phone: phone, format: f.format.value, role: 'Tez aloqa (qoʻngʻiroq soʻradi)', website: f.website.value })
    }).then(function (r) { return r.json().then(function (j) { return r.ok && j && j.ok; }); })
      .catch(function () { return false; })
      .then(function (ok) {
        clearTimeout(t); btn.disabled = false; btn.textContent = lbl;
        if (ok) { f.reset(); show('Rahmat! Tez orada sizga qoʻngʻiroq qilamiz.', 'ok'); return; }
        var text = 'Assalomu alaykum! Menga qoʻngʻiroq qiling.\nIsm: ' + name + '\nTelefon: ' + phone + '\nKurs: ' + f.format.value;
        show('Hozir yuborib boʻlmadi. <a href="https://t.me/' + MANAGER + '?text=' + encodeURIComponent(text) + '" target="_blank" rel="noopener">Telegramda yuborish</a> tugmasini bosing — menejer chati tayyor matn bilan ochiladi.', 'bad');
      });
  });
})();
