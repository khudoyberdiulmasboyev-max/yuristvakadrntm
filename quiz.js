/* «Yurist va Kadr» — "Qaysi kurs sizga mos?" va "Bilimingizni sinang" */
(function () {
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function goForm(format) {
    var sel = document.getElementById('f-format');
    if (sel && format) sel.value = format;
    var f = document.getElementById('royxat');
    if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ===== 1) Kurs tanlovchi ===== */
  var finder = $('#finder');
  if (finder) {
    var RES = {
      online: { t: 'Onlayn kurs', f: 'Onlayn kurs', d: ['18 kun, kuniga 2 soat', '15:00–17:00, Zoom platformasida', 'Jami 36 soat'], why: 'Ishdan ajralmasdan, istalgan viloyatdan qatnashasiz.' },
      offline: { t: 'Oflayn kurs (9 kun)', f: 'Oflayn kurs (9 kun)', d: ['9 kun ketma-ket, kuniga 4 soat', '09:00–13:00, markazimizda', 'Jami 36 soat'], why: 'Qisqa muddatda, ustoz bilan yuzma-yuz toʻliq dasturni oʻtasiz.' },
      weekend: { t: 'Shanba va yakshanbalik kurs', f: 'Shanba va yakshanbalik kurs', d: ['Faqat shanba va yakshanba', '5 hafta', 'Jami 40 soat'], why: 'Ish haftangizga xalal bermasdan, jonli darslarda qatnashasiz.' },
      org: { t: 'Tashkilot xodimlari uchun oʻquv', f: 'Tashkilot xodimlari uchun oʻquv', d: ['Markazda, onlayn yoki tashkilotingizda', 'Mavzular va jadval siz bilan kelishiladi'], why: 'Mavzular va jadval tashkilotingiz ehtiyojiga moslab tuziladi.' }
    };
    var ans = {};
    var steps = [].slice.call(finder.querySelectorAll('.fq'));
    var out = $('.fres', finder);
    function decide() {
      if (ans.who === 'org') return 'org';
      if (ans.where === 'region') return 'online';
      return ans.when || 'online';
    }
    function show() {
      steps.forEach(function (s, i) {
        var need = s.getAttribute('data-k');
        var prevDone = steps.slice(0, i).every(function (p) { var k = p.getAttribute('data-k'); return ans[k] || (k === 'where' && ans.who === 'org') || (k === 'when' && (ans.who === 'org' || ans.where === 'region')); });
        var skip = (need === 'where' && ans.who === 'org') || (need === 'when' && (ans.who === 'org' || ans.where === 'region'));
        s.hidden = !prevDone || skip;
      });
      var done = ans.who === 'org' || ans.where === 'region' || ans.when;
      if (!done) { out.hidden = true; return; }
      var r = RES[decide()];
      out.innerHTML = '<span class="fres-k">Sizga mos kurs</span><h3>' + esc(r.t) + '</h3><p>' + esc(r.why) + '</p><ul>' + r.d.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><div class="fres-act"><button type="button" class="btn" data-go>Shu kursga yozilish</button><button type="button" class="btn btn-line" data-reset>Qaytadan tanlash</button></div>';
      out.hidden = false;
      $('[data-go]', out).addEventListener('click', function () { goForm(r.f); });
      $('[data-reset]', out).addEventListener('click', function () {
        ans = {};
        finder.querySelectorAll('.fopt').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        show();
      });
    }
    finder.querySelectorAll('.fopt').forEach(function (b) {
      b.addEventListener('click', function () {
        var q = b.closest('.fq'), k = q.getAttribute('data-k');
        q.querySelectorAll('.fopt').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        ans[k] = b.getAttribute('data-v');
        if (k === 'who') { delete ans.where; delete ans.when; }
        if (k === 'where') { delete ans.when; }
        show();
      });
    });
    show();
  }

  /* ===== 2) Bilim testi ===== */
  var quiz = $('#quiz');
  if (!quiz) return;
  var Q = [
    { q: 'Bola parvarishlash taʼtilidagi xodimning ish joyi (lavozimi) nima boʻladi?', o: ['Saqlanadi', 'Faqat 1 yilgacha saqlanadi', 'Saqlanmaydi, ish beruvchi ixtiyorida'], a: 0, e: 'MK 405-moddasiga koʻra, bola parvarishlash taʼtillari davrida xodimning ish joyi (lavozimi) saqlanadi.', p: 13224 },
    { q: 'Dekretdagi xodim oʻrniga olingan xodim bilan qanday mehnat shartnomasi tuziladi?', o: ['Nomuayyan muddatli', 'Muddatli', 'Fuqarolik-huquqiy shartnoma'], a: 1, e: 'MK 112-moddasiga koʻra, ish joyi saqlanadigan xodimning oʻrniga muddatli mehnat shartnomasi tuziladi.', p: 13220 },
    { q: 'Mehnat shartnomasida majburiy shartlardan biri (masalan, muddat) tushib qolsa nima boʻladi?', o: ['Shartnoma tuzilmagan hisoblanadi', 'Shartnoma bekor qilinadi', 'Shartnoma qoʻshimcha kelishuv bilan toʻldiriladi'], a: 2, e: 'MK 104-moddasiga koʻra, bu shartnomani bekor qilish uchun asos emas: u yozma qoʻshimcha kelishuv bilan toʻldiriladi.', p: 13220 },
    { q: 'Xodimning oxirgi ish kuni dam olish kuniga toʻgʻri kelib qolsa, qaysi kun oxirgi ish kuni hisoblanadi?', o: ['Oʻsha dam olish kuni', 'Undan oldingi ish kuni', 'Undan keyingi birinchi ish kuni'], a: 2, e: 'MK 9 va 170-moddalariga koʻra, oxirgi kun dam olish kuniga toʻgʻri kelsa, undan keyingi birinchi ish kuni oxirgi ish kuni boʻladi.', p: 13236 },
    { q: 'Boʻshatish kuni xodim ishda boʻlmasa, ish beruvchi unga bildirishnomani qachongacha yuborishi shart?', o: ['3 ish kuni ichida', 'Keyingi ish kunidan kechiktirmay', 'Faqat xodim soʻraganda'], a: 1, e: 'MK 171-moddasiga koʻra, ish beruvchi keyingi ish kunidan kechiktirmay bildirishnoma yuborishi shart, aks holda javobgarlik yuzaga keladi.', p: 13243 },
    { q: 'Ishga tiklash haqida sudga murojaat qilish muddati qancha?', o: ['1 oy', '3 oy', '6 oy', '1 yil'], a: 1, e: 'MK 560-moddasiga koʻra, buyruqdan koʻchirma berilgan kundan boshlab 3 oy.', p: 13234 },
    { q: 'Progul uchun boʻshatish qonuniy boʻlishi uchun ichki mehnat tartibi qoidalarida nima belgilangan boʻlishi kerak?', o: ['Progul uchun jarima miqdori', 'Ishda qancha vaqt boʻlmaslik progul hisoblanishi', 'Kasaba uyushmasi raisining roziligi'], a: 1, e: 'Oliy sud Plenumining 26-son qarori 38-bandiga koʻra, qoidalarda progul deb hisoblanadigan vaqt aniq koʻrsatilmagan boʻlsa, boʻshatish noqonuniy boʻladi.', p: 13212 },
    { q: 'Xodimni vaqtincha masofaviy ishga oʻtkazish muddati qancha boʻlishi mumkin?', o: ['3 oygacha', '6 oygacha', '1 yilgacha'], a: 2, e: 'Mehnat kodeksiga koʻra, xodimni vaqtincha masofaviy ishga oʻtkazish muddati 1 yilgacha belgilanadi.', p: 13210 },
    { q: '1 iyuldan kasallik nafaqasining qancha kuni ish beruvchi hisobidan toʻlanadi?', o: ['3 kun', '5 kun', '10 kun', 'Toʻliq ish beruvchi hisobidan'], a: 1, e: 'Yangi tartibga koʻra, ish beruvchi 5 kunlik limitni toʻlaydi, qolgan qismi jamgʻarmadan toʻlanadi.', p: 13211 },
    { q: 'Saylanadigan lavozimdagi xodim yangi muddatga saylanmasa, mehnat shartnomasi qaysi modda asosida bekor qilinadi?', o: ['MK 161-modda', 'MK 168-modda', 'MK 169-modda'], a: 2, e: 'Yangi muddatga saylanmaganlik munosabati bilan shartnoma aynan MK 169-moddasiga asosan bekor qilinadi.', p: 13229 }
  ];
  var i = 0, score = 0, box = $('.quiz-box', quiz);
  function start() { i = 0; score = 0; render(); }
  function render() {
    if (i >= Q.length) return finish();
    var x = Q[i];
    box.innerHTML =
      '<div class="qz-top"><span class="qz-n">' + (i + 1) + ' / ' + Q.length + '</span><div class="qz-bar"><i style="width:' + (i / Q.length * 100) + '%"></i></div></div>' +
      '<h3 class="qz-q">' + esc(x.q) + '</h3>' +
      '<div class="qz-opts">' + x.o.map(function (o, k) { return '<button type="button" class="qz-o" data-k="' + k + '"><span class="qz-l">' + 'ABCD'[k] + '</span><span>' + esc(o) + '</span></button>'; }).join('') + '</div>' +
      '<div class="qz-fb" hidden></div>';
    box.querySelectorAll('.qz-o').forEach(function (b) { b.addEventListener('click', function () { pick(+b.getAttribute('data-k')); }); });
  }
  function pick(k) {
    var x = Q[i], ok = k === x.a;
    if (ok) score++;
    box.querySelectorAll('.qz-o').forEach(function (b) {
      var bk = +b.getAttribute('data-k');
      b.disabled = true;
      if (bk === x.a) b.classList.add('right');
      else if (bk === k) b.classList.add('wrong');
    });
    var fb = $('.qz-fb', box);
    fb.innerHTML = '<b class="' + (ok ? 'ok' : 'no') + '">' + (ok ? 'Toʻgʻri!' : 'Notoʻgʻri') + '</b><p>' + esc(x.e) + '</p><div class="qz-act"><a href="https://t.me/kadr_yurist/' + x.p + '" target="_blank" rel="noopener">Batafsil oʻqish</a><button type="button" class="btn" data-next>' + (i + 1 < Q.length ? 'Keyingi savol' : 'Natijani koʻrish') + '</button></div>';
    fb.hidden = false;
    $('[data-next]', fb).addEventListener('click', function () { i++; render(); var t = quiz.getBoundingClientRect().top; if (t < 0) quiz.scrollIntoView({ behavior: 'smooth' }); });
  }
  function finish() {
    var lvl = score >= 9 ? ['Aʼlo natija!', 'Siz Mehnat kodeksini juda yaxshi bilasiz. Bilimingizni sertifikat bilan tasdiqlang.'] :
              score >= 6 ? ['Yaxshi natija', 'Asoslarni bilasiz, lekin ayrim nozik jihatlarda xato qilish xavfi bor. Kursimiz bu boʻshliqlarni toʻldiradi.'] :
                           ['Bilimni mustahkamlash vaqti keldi', 'Bu savollar kadrlar ishida har kuni uchraydi. Kursimizda ularni amaliy misollar bilan oʻrganasiz.'];
    box.innerHTML =
      '<div class="qz-res"><div class="qz-score"><b>' + score + '</b><span>/ ' + Q.length + '</span></div>' +
      '<div><h3>' + lvl[0] + '</h3><p>' + lvl[1] + '</p>' +
      '<div class="qz-act"><button type="button" class="btn" data-enrol>Kursga yozilish</button><button type="button" class="btn btn-line" data-again>Qayta topshirish</button></div></div></div>';
    $('[data-enrol]', box).addEventListener('click', function () { goForm(); });
    $('[data-again]', box).addEventListener('click', start);
  }
  var st = $('[data-start]', quiz);
  if (st) st.addEventListener('click', start);
})();
