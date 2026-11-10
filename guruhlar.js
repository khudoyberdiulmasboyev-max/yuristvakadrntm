/* «Yurist va Kadr» — oʻquv guruhlari va sertifikatni tekshirish.
   Maʼlumotlar guruhlar.json faylida. QR kod manzili: guruhlar.html?g=<guruh-id> */
(function () {
  var MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); };
  var norm = function (s) { return String(s || '').toLowerCase().replace(/[ʻʼ'`‘’]/g, '').replace(/\s+/g, ' ').trim(); };
  function d(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? { y: +p[0], m: +p[1], d: +p[2] } : null; }
  function range(a, b) {
    var x = d(a), y = d(b);
    if (!x) return '';
    if (!y) return x.d + '-' + MONTHS[x.m - 1] + ' ' + x.y;
    if (x.y === y.y && x.m === y.m) return x.d + '–' + y.d + '-' + MONTHS[x.m - 1] + ' ' + x.y;
    if (x.y === y.y) return x.d + '-' + MONTHS[x.m - 1] + ' – ' + y.d + '-' + MONTHS[y.m - 1] + ' ' + x.y;
    return x.d + '.' + x.m + '.' + x.y + ' – ' + y.d + '.' + y.m + '.' + y.y;
  }
  function fmtClass(f) { f = norm(f); return f.indexOf('onlayn') === 0 ? 'on' : f.indexOf('oflayn') === 0 ? 'off' : 'wk'; }

  var params = new URLSearchParams(location.search);
  var gId = params.get('g'), sId = params.get('s');
  var G = [];

  function groupCard(g, open) {
    var n = (g.tinglovchilar || []).length;
    return '<article class="gr-card' + (open ? ' open' : '') + '">' +
      '<div class="gr-card-h"><span class="gr-badge ' + fmtClass(g.format) + '">' + esc(g.format) + '</span><b>' + esc(g.nomi) + '</b></div>' +
      '<p class="gr-dates">' + esc(range(g.boshlanish, g.tugash)) + (g.soat ? ' · ' + esc(g.soat) + ' soat' : '') + '</p>' +
      (g.mavzu ? '<p class="gr-topic">' + esc(g.mavzu) + '</p>' : '') +
      '<p class="gr-count">' + n + ' nafar tinglovchi</p>' +
      (open ? '' : '<a class="gr-open" href="?g=' + encodeURIComponent(g.id) + '">Roʻyxatni koʻrish →</a>') +
      '</article>';
  }

  function list(g, hl) {
    var rows = (g.tinglovchilar || []).map(function (t, i) {
      var hit = hl && (norm(t.fio).indexOf(hl) > -1 || norm(t.sertifikat) === hl);
      return '<li' + (hit ? ' class="hit"' : '') + '><span class="n">' + (i + 1) + '</span><span class="fio">' + esc(t.fio) + '</span>' + (t.sertifikat ? '<span class="gr-sn">№ ' + esc(t.sertifikat) + '</span>' : '') + '</li>';
    }).join('');
    return '<ol class="gr-people">' + rows + '</ol>';
  }

  function timeline() {
    if (!G.length) { $('grTimeline').innerHTML = '<p class="gr-empty">Guruhlar roʻyxati tez orada joylanadi.</p>'; return; }
    var by = {};
    G.forEach(function (g) { var x = d(g.boshlanish); var k = x ? x.y + '-' + (x.m < 10 ? '0' : '') + x.m : '0'; (by[k] = by[k] || []).push(g); });
    $('grTimeline').innerHTML = Object.keys(by).sort().reverse().map(function (k) {
      var p = k.split('-'), label = p.length === 2 ? MONTHS[+p[1] - 1] + ' ' + p[0] : '';
      return '<div class="gr-month"><h3><span>' + esc(label) + '</span></h3><div class="gr-grid">' + by[k].map(function (g) { return groupCard(g); }).join('') + '</div></div>';
    }).join('');
  }

  function verifyGroup(g) {
    var v = $('grVerify');
    v.hidden = false;
    document.querySelector('.gr-hero').classList.add('compact');
    v.innerHTML = '<div class="gr-ok"><span class="gr-tick" aria-hidden="true">✓</span><div><b>Guruh tasdiqlandi</b><p>Ushbu guruh «Yurist va Kadr» NTMda malaka oshirish kursini tamomlagan. Sertifikatdagi ism-familiya quyidagi roʻyxatda boʻlishi kerak.</p></div></div>' +
      groupCard(g, true) +
      '<label class="gr-search sm"><input id="grIn" type="search" placeholder="Roʻyxatdan ism-familiyani qidirish" autocomplete="off"></label>' +
      '<div id="grPeople">' + list(g) + '</div>';
    $('grIn').addEventListener('input', function () { $('grPeople').innerHTML = list(g, norm(this.value)); });
    $('grTitle').textContent = 'Boshqa guruhlar';
    $('grAll').hidden = false;
  }

  function search(q) {
    var f = $('grFound');
    q = norm(q);
    if (q.length < 3) { f.hidden = true; f.innerHTML = ''; return; }
    var res = [];
    G.forEach(function (g) {
      (g.tinglovchilar || []).forEach(function (t) {
        if (norm(t.fio).indexOf(q) > -1 || (t.sertifikat && norm(t.sertifikat).replace(/\s/g, '') === q.replace(/\s/g, ''))) res.push({ g: g, t: t });
      });
    });
    f.hidden = false;
    f.innerHTML = res.length
      ? '<p class="gr-found-h">Topildi: ' + res.length + '</p>' + res.slice(0, 30).map(function (r) {
          return '<a class="gr-hit" href="?g=' + encodeURIComponent(r.g.id) + '"><span class="gr-tick sm" aria-hidden="true">✓</span><span><b>' + esc(r.t.fio) + '</b>' +
            '<small>' + esc(r.g.nomi) + ' · ' + esc(r.g.format) + ' · ' + esc(range(r.g.boshlanish, r.g.tugash)) + (r.t.sertifikat ? ' · № ' + esc(r.t.sertifikat) : '') + '</small></span></a>';
        }).join('')
      : '<p class="gr-none">Bunday maʼlumot topilmadi. Ism-familiyani sertifikatdagidek yozing yoki biz bilan bogʻlaning: <a href="tel:+998900108615">+998 90 010 86 15</a></p>';
  }

  fetch('guruhlar.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (j) {
    G = (j.guruhlar || []).slice().sort(function (a, b) { return String(b.boshlanish).localeCompare(String(a.boshlanish)); });
    if (gId) {
      var g = G.filter(function (x) { return x.id === gId; })[0];
      if (g) { verifyGroup(g); G = G.filter(function (x) { return x !== g; }); }
      else { var v = $('grVerify'); v.hidden = false; v.innerHTML = '<div class="gr-bad"><b>Guruh topilmadi</b><p>QR kod yoki havola notoʻgʻri. Iltimos, biz bilan bogʻlaning: <a href="tel:+998900108615">+998 90 010 86 15</a></p></div>'; }
    }
    timeline();
    var q = $('grq');
    q.addEventListener('input', function () { search(q.value); });
    if (sId) { q.value = sId; search(sId); }
  }).catch(function () { $('grTimeline').innerHTML = '<p class="gr-empty">Maʼlumotlarni yuklab boʻlmadi.</p>'; });
})();
