/* «Yurist va Kadr» — sahifa animatsiyalari */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  var root = document.documentElement;
  root.classList.add('anim-on');

  /* 1) Raqamlarni sanash */
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function countUp(el) {
    var to = parseInt(el.getAttribute('data-count'), 10) || 0, suf = el.getAttribute('data-suffix') || '';
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(to * e)) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { cio.unobserve(e.target); countUp(e.target); } });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) {
    el.textContent = '0' + (el.getAttribute('data-suffix') || '');
    cio.observe(el);
  });

  /* 2) Boʻlimlarning yumshoq paydo boʻlishi (faqat ekran pastidagilar) */
  var SEL = '.nw, .ask, .doc, .steps li, .teachers>*, .gal>a, .faq details, .prog li, .reg-grid>*, .adv, .lic-strip, .sh, .partners-head, .cta-head, .quiz, .cards4>*, .newcourse';
  var vh = window.innerHeight;
  var rio = new IntersectionObserver(function (es) {
    var batch = es.filter(function (e) { return e.isIntersecting; });
    batch.forEach(function (e, i) {
      var el = e.target;
      el.style.transitionDelay = Math.min(i, 5) * 70 + 'ms';
      el.classList.add('rv-in');
      rio.unobserve(el);
      setTimeout(function () { el.style.transitionDelay = ''; el.classList.remove('rv', 'rv-in'); }, 1200);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  function arm(scope) {
    (scope || document).querySelectorAll(SEL).forEach(function (el) {
      if (el.dataset.rvArmed) return;
      el.dataset.rvArmed = '1';
      if (el.getBoundingClientRect().top > vh * 0.92) { el.classList.add('rv'); rio.observe(el); }
    });
  }
  arm();
  window.ykArmReveal = arm;
  /* 3) Kurslar bo'limi: rasm ochilishi + matn ketma-ketligi */
  var kurs = document.getElementById('kurslar');
  if (kurs) {
    var below = kurs.getBoundingClientRect().top > window.innerHeight * 0.85;
    if (below) {
      kurs.classList.add('k-pre');
      var kio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          kio.unobserve(e.target);
          e.target.classList.add('k-in');
          setTimeout(function () { e.target.classList.remove('k-pre', 'k-in'); }, 1600);
        });
      }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
      kio.observe(kurs);
    }
  }
 // dinamik qoʻshilgan elementlar uchun
})();
