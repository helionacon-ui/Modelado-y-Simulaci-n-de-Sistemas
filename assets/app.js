/* Guía no oficial · Modelado y Simulación de Sistemas (UPCT) */
(function () {
  var root = document.documentElement;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }

  // tema claro / oscuro
  var saved = store('msg-theme');
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  var tbtn = document.getElementById('theme-btn');
  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function paintBtn() { if (tbtn) { tbtn.textContent = isDark() ? '☀' : '☾'; tbtn.setAttribute('aria-label', isDark() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'); } }
  if (tbtn) tbtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next); store('msg-theme', next); paintBtn();
  });
  paintBtn();

  // menú lateral en móvil
  var mbtn = document.getElementById('menu-btn');
  if (mbtn) {
    mbtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      mbtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!document.body.classList.contains('nav-open')) return;
      if (e.target.closest('.side a') || (!e.target.closest('.side') && !e.target.closest('#menu-btn'))) {
        document.body.classList.remove('nav-open'); mbtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // botón de volver arriba
  var up = document.getElementById('totop');
  if (up) {
    window.addEventListener('scroll', function () { up.classList.toggle('show', window.scrollY > 700); }, { passive: true });
    up.addEventListener('click', function () { window.scrollTo({ top: 0 }); });
  }

  // «En esta página»: resalta la sección visible
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  if (links.length && 'IntersectionObserver' in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('on'); });
          var a = map[en.target.id]; if (a) a.classList.add('on');
        }
      });
    }, { rootMargin: '-70px 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  // calculadora de nota (portada)
  var ne = document.getElementById('n-exam'), np = document.getElementById('n-prac'), co = document.getElementById('calc-out');
  if (ne && np && co) {
    var calc = function () {
      var e = parseFloat(ne.value), p = parseFloat(np.value);
      if (isNaN(e) || isNaN(p) || e < 0 || p < 0 || e > 10 || p > 10) { co.textContent = 'Pon notas entre 0 y 10.'; return; }
      var f = (0.8 * e + 0.2 * p).toFixed(2).replace('.', ',');
      if (e < 5) co.textContent = 'Nota ponderada ' + f + ', pero el examen no llega al 50 %: no se supera.';
      else if (p < 5) co.textContent = 'Nota ponderada ' + f + ', pero las prácticas no tienen evaluación positiva: no se supera.';
      else co.textContent = 'Nota final ' + f + ': ' + (parseFloat(f.replace(',', '.')) >= 5 ? 'aprobado.' : 'suspenso.');
    };
    ne.addEventListener('input', calc); np.addEventListener('input', calc); calc();
  }

  // autoevaluación
  var qs = Array.prototype.slice.call(document.querySelectorAll('.q'));
  var scoreEl = document.getElementById('score');
  if (qs.length) {
    var done = 0, good = 0;
    function paint() { if (scoreEl) scoreEl.innerHTML = 'Aciertos: <b>' + good + '</b> de ' + done + ' respondidas · ' + qs.length + ' preguntas'; }
    paint();
    qs.forEach(function (q) {
      var right = q.getAttribute('data-correct');
      var opts = Array.prototype.slice.call(q.querySelectorAll('.opt'));
      var ex = q.querySelector('.expl');
      opts.forEach(function (o) {
        o.addEventListener('click', function () {
          if (q.getAttribute('data-done')) return;
          q.setAttribute('data-done', '1'); done++;
          var ok = o.getAttribute('data-k') === right;
          if (ok) good++;
          opts.forEach(function (x) {
            x.disabled = true;
            if (x.getAttribute('data-k') === right) x.classList.add('right');
          });
          if (!ok) o.classList.add('wrong');
          if (ex) ex.hidden = false;
          paint();
        });
      });
    });
    var rs = document.getElementById('reset-q');
    if (rs) rs.addEventListener('click', function () {
      done = 0; good = 0;
      qs.forEach(function (q) {
        q.removeAttribute('data-done');
        q.querySelectorAll('.opt').forEach(function (o) { o.disabled = false; o.classList.remove('right', 'wrong'); });
        var ex = q.querySelector('.expl'); if (ex) ex.hidden = true;
      });
      paint();
    });
  }

  // progreso por temas (Cómo es el examen)
  var pr = document.getElementById('prog');
  if (pr) {
    var boxes = Array.prototype.slice.call(pr.querySelectorAll('input[data-p]'));
    var saved = {}; try { saved = JSON.parse(store('msg-prog') || '{}') || {}; } catch (e) { saved = {}; }
    var fill = document.getElementById('prog-fill'), ptxt = document.getElementById('prog-txt');
    var upd = function () {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      if (fill) fill.style.width = (100 * n / boxes.length) + '%';
      if (ptxt) ptxt.textContent = n + ' de ' + boxes.length + ' temas marcados';
    };
    boxes.forEach(function (b) {
      b.checked = !!saved[b.getAttribute('data-p')];
      b.addEventListener('change', function () { saved[b.getAttribute('data-p')] = b.checked; store('msg-prog', JSON.stringify(saved)); upd(); });
    });
    upd();
  }

  // buscador de toda la guía
  var gq = document.getElementById('gsrch'), gout = document.getElementById('gsrch-out');
  if (gq && gout) {
    var norm = function (t) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
    var loaded = false;
    var load = function (cb) {
      if (loaded || window.MSG_INDEX) { loaded = true; cb(); return; }
      var sc = document.createElement('script'); sc.src = 'assets/search-index.js';
      sc.onload = function () { loaded = true; cb(); }; sc.onerror = function () { gout.hidden = false; gout.textContent = 'No se pudo cargar el índice de búsqueda.'; };
      document.head.appendChild(sc);
    };
    var esc = function (t) { return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var run = function () {
      var words = norm(gq.value).split(/\s+/).filter(Boolean);
      if (!words.length) { gout.hidden = true; gout.innerHTML = ''; return; }
      var hits = [];
      for (var i = 0; i < window.MSG_INDEX.length && hits.length < 30; i++) {
        var e = window.MSG_INDEX[i], k = norm(e[0] + ' ' + e[2] + ' ' + e[1].replace(/[#-]/g, ' '));
        if (words.every(function (w) { return k.indexOf(w) >= 0; })) hits.push(e);
      }
      gout.hidden = false;
      gout.innerHTML = hits.length ? hits.map(function (e) { return '<a href="' + e[1] + '">' + esc(e[0]) + '<small>' + esc(e[2]) + '</small></a>'; }).join('') : '<p class="sim-msg">Sin resultados.</p>';
    };
    gq.addEventListener('input', function () { load(run); });
  }
})();
