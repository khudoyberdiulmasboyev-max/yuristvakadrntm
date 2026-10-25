/* «Yurist va Kadr» — Telegram kanallaridan yangiliklar va savol formasi */
(function () {
  var box = document.getElementById('news');
  if (!box) return;
  var moreBtn = document.getElementById('newsMore');
  var chips = [].slice.call(document.querySelectorAll('.news-chips .chip'));
  var NAMES = { kadr_yurist: '«Yurist va Kadr» NTM', yuristkadr: 'Saydali Muxtoraliyev' };
  var STEP = 6, shown = STEP, filter = 'all', posts = [];

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDate(iso) {
    var d = new Date(iso); if (isNaN(d)) return '';
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    var t = new Date(d.getTime() + 5 * 3600 * 1000); // Toshkent vaqti (UTC+5)
    return p(t.getUTCDate()) + '.' + p(t.getUTCMonth() + 1) + '.' + t.getUTCFullYear() + ' · ' + p(t.getUTCHours()) + ':' + p(t.getUTCMinutes());
  }
  function split(text) {
    var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var tags = [];
    while (lines.length && /^#\S+$/.test(lines[0].split(/\s+/)[0]) && lines[0].replace(/#\S+/g, '').trim() === '') { tags = tags.concat(lines.shift().match(/#\S+/g)); }
    var first = lines.shift() || '';
    var m = first.match(/^(#\S+)\s+(.*)$/); if (m) { tags.push(m[1]); first = m[2]; }
    var title = first.length > 110 ? first.slice(0, 105).replace(/\s+\S*$/, '') + '…' : first;
    var rest = (first.length > 110 ? first.slice(title.length - 1) + ' ' : '') + lines.join(' ');
    var ex = rest.length > 170 ? rest.slice(0, 165).replace(/\s+\S*$/, '') + '…' : rest;
    return { tags: tags.slice(0, 2), title: title, ex: ex };
  }
  function card(p) {
    var s = split(p.text || '');
    var img = p.img ? '<div class="nw-img"><img src="' + esc(p.img) + '" alt="" loading="lazy" decoding="async" onerror="this.parentNode.remove()"></div>' : '';
    return '<a class="nw' + (p.img ? '' : ' noimg') + '" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + img +
      '<div class="nw-b"><div class="nw-meta"><span class="nw-ch ' + esc(p.channel) + '">' + esc(NAMES[p.channel] || ('@' + p.channel)) + '</span><time>' + fmtDate(p.date) + '</time></div>' +
      (s.tags.length ? '<div class="nw-tags">' + s.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
      '<h3>' + esc(s.title) + '</h3>' + (s.ex ? '<p>' + esc(s.ex) + '</p>' : '') +
      '<span class="nw-go">Telegramda oʻqish</span></div></a>';
  }
  function render() {
    var list = posts.filter(function (p) { return filter === 'all' || p.channel === filter; });
    if (!list.length) { box.innerHTML = '<p class="news-load">Hozircha postlar topilmadi.</p>'; moreBtn.hidden = true; return; }
    box.innerHTML = list.slice(0, shown).map(card).join('');
    moreBtn.hidden = list.length <= shown;
    if (window.ykArmReveal) window.ykArmReveal(box);
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
      filter = c.getAttribute('data-ch'); shown = STEP; render();
    });
  });
  moreBtn.addEventListener('click', function () { shown += STEP; render(); });

  function load(url) {
    var ctl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 8000);
    return fetch(url, { signal: ctl ? ctl.signal : undefined, cache: 'no-cache' }).then(function (r) {
      clearTimeout(t);
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (j) { if (!j || !j.posts || !j.posts.length) throw new Error('empty'); return j.posts; });
  }
  // Avval jonli lenta (feed.php), u ishlamasa — saqlangan nusxa (posts.json)
  load('feed.php').catch(function () { return load('posts.json'); }).then(function (p) {
    posts = p; render();
  }).catch(function () {
    box.innerHTML = '<p class="news-load">Yangiliklarni yuklab boʻlmadi. Kanallarimizni Telegramda kuzating.</p>';
  });
})();

/* Savol formasi → ariza.php → Telegram bot */
(function () {
  var f = document.getElementById('askForm');
  if (!f) return;
  var err = document.getElementById('askErr'), ok = document.getElementById('askOk'), btn = document.getElementById('askBtn');
  function bad(msg, el) { err.textContent = msg; err.hidden = false; if (el) el.focus(); }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true; ok.hidden = true;
    var name = f.name.value.trim(), contact = f.contact.value.trim(), q = f.question.value.trim();
    if (name.length < 2) return bad('Ismingizni yozing.', f.name);
    var digits = contact.replace(/\D/g, '');
    var isUser = /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(contact);
    if (!(digits.length >= 9 || isUser)) return bad('Telefon raqamingiz yoki Telegram username’ingizni yozing.', f.contact);
    if (q.length < 10) return bad('Savolingizni batafsilroq yozing.', f.question);
    btn.disabled = true; var label = btn.textContent; btn.textContent = 'Yuborilmoqda…';
    var ctl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 10000);
    fetch('ariza.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl ? ctl.signal : undefined,
      body: JSON.stringify({ type: 'question', name: name, contact: contact, question: q, website: f.website.value })
    }).then(function (r) { return r.json().then(function (j) { return r.ok && j && j.ok; }); })
      .catch(function () { return false; })
      .then(function (sent) {
        clearTimeout(t); btn.disabled = false; btn.textContent = label;
        if (sent) { f.reset(); ok.hidden = false; return; }
        // Server ishlamasa — savolni nusxalab, botni ochamiz
        var txt = 'Savol (sayt orqali)\nIsm: ' + name + '\nAloqa: ' + contact + '\n\n' + q;
        try { navigator.clipboard.writeText(txt); } catch (x) {}
        err.innerHTML = 'Hozir yuborib boʻlmadi. Savolingiz nusxalandi — <a href="https://t.me/yuristkadrbot" target="_blank" rel="noopener">@yuristkadrbot</a> ga joylab yuboring.';
        err.hidden = false;
      });
  });
})();
