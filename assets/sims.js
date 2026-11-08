/* Simuladores interactivos · Guía no oficial de Modelado y Simulación (UPCT). Sin dependencias. */
(function () {
  'use strict';
  var uid = 0;

  /* ---------- utilidades ---------- */
  function fmt(v, d) {
    if (!isFinite(v)) return '—';
    var a = Math.abs(v);
    if (a !== 0 && (a < 1e-3 || a >= 1e5)) return v.toExponential(2).replace('.', ',');
    return v.toFixed(d === undefined ? 3 : d).replace('.', ',');
  }
  function ticks(a, b, n) {
    var r = (b - a) / n, p = Math.pow(10, Math.floor(Math.log(r) / Math.LN10)), s = r / p;
    var st = (s < 1.5 ? 1 : s < 3.5 ? 2 : s < 7.5 ? 5 : 10) * p, out = [];
    for (var v = Math.ceil(a / st - 1e-9) * st; v <= b + st * 1e-9; v += st) out.push(Math.abs(v) < st * 1e-9 ? 0 : v);
    return out;
  }
  function tickTxt(v) { return (Math.abs(v) < 1e-9 ? '0' : String(+v.toPrecision(3))).replace('.', ','); }
  function rng(seed) {
    var s = seed >>> 0;
    function u() { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    return { u: u, n: function () { var a = u() || 1e-12, b = u(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); } };
  }

  /* ---------- gráficas SVG ----------
     o: {h, xr, yr, xl, yl, series:[{t:'line'|'dots'|'bars'|'stems'|'hline'|'vline', x, y, cls, label, dash}], label} */
  function plot(o) {
    var W = 640, H = o.h || 270, L = 52, R = 14, T = 12, B = 40, id = 'c' + (++uid);
    var xa = o.xr[0], xb = o.xr[1], ya, yb, i, j, S = o.series;
    if (o.yr) { ya = o.yr[0]; yb = o.yr[1]; }
    else {
      ya = Infinity; yb = -Infinity;
      S.forEach(function (s) { if (s.t === 'hline' || s.t === 'vline') return; (s.y || []).forEach(function (v) { if (isFinite(v)) { if (v < ya) ya = v; if (v > yb) yb = v; } }); });
      if (!isFinite(ya)) { ya = 0; yb = 1; }
      if (o.zero) { ya = Math.min(ya, 0); yb = Math.max(yb, 0); }
      var pad = (yb - ya) * 0.08 || 0.5; ya -= pad; yb += pad;
    }
    function X(v) { return L + (v - xa) / (xb - xa) * (W - L - R); }
    function Y(v) { return H - B - (v - ya) / (yb - ya) * (H - T - B); }
    var g = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (o.label || 'Gráfica') + '">';
    g += '<defs><clipPath id="' + id + '"><rect x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '"/></clipPath></defs>';
    ticks(xa, xb, 6).forEach(function (v) { g += '<line class="gl" x1="' + X(v) + '" x2="' + X(v) + '" y1="' + T + '" y2="' + (H - B) + '"/><text class="gt" x="' + X(v) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + tickTxt(v) + '</text>'; });
    ticks(ya, yb, 5).forEach(function (v) { g += '<line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text class="gt" x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + tickTxt(v) + '</text>'; });
    g += '<rect class="gf" x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '"/>';
    g += '<g clip-path="url(#' + id + ')">';
    S.forEach(function (s) {
      var c = s.cls || 'p0', d = '';
      if (s.t === 'hline') { g += '<line class="pl ' + c + '" stroke-dasharray="' + (s.dash || '5 4') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(s.y) + '" y2="' + Y(s.y) + '"/>'; return; }
      if (s.t === 'vline') { g += '<line class="pl ' + c + '" stroke-dasharray="' + (s.dash || '5 4') + '" x1="' + X(s.x) + '" x2="' + X(s.x) + '" y1="' + T + '" y2="' + (H - B) + '"/>'; return; }
      if (s.t === 'bars') {
        var bw = (W - L - R) / (xb - xa) * s.dx * 0.9;
        for (i = 0; i < s.y.length; i++) g += '<rect class="bar ' + c + '" x="' + (X(s.x[i]) - bw / 2) + '" y="' + Y(s.y[i]) + '" width="' + bw + '" height="' + Math.max(0, Y(0) - Y(s.y[i])) + '"/>';
        return;
      }
      if (s.t === 'stems') {
        for (i = 0; i < s.y.length; i++) g += '<line class="pl ' + c + '" x1="' + X(s.x[i]) + '" x2="' + X(s.x[i]) + '" y1="' + Y(0) + '" y2="' + Y(s.y[i]) + '"/><circle class="pd ' + c + '" cx="' + X(s.x[i]) + '" cy="' + Y(s.y[i]) + '" r="2.6"/>';
        return;
      }
      if (s.t === 'dots') { for (i = 0; i < s.x.length; i++) g += '<circle class="pd ' + c + '" cx="' + X(s.x[i]) + '" cy="' + Y(s.y[i]) + '" r="' + (s.r || 2.4) + '"/>'; return; }
      for (i = 0; i < s.x.length; i++) {
        var yy = s.y[i]; if (!isFinite(yy)) continue;
        yy = Math.max(Math.min(yy, yb + (yb - ya) * 3), ya - (yb - ya) * 3);
        d += (d ? 'L' : 'M') + X(s.x[i]).toFixed(1) + ' ' + Y(yy).toFixed(1);
      }
      g += '<path class="pl ' + c + '"' + (s.dash ? ' stroke-dasharray="' + s.dash + '"' : '') + ' d="' + d + '"/>';
      if (s.marks) for (i = 0; i < s.x.length; i += s.marks) if (isFinite(s.y[i])) g += '<circle class="pd ' + c + '" cx="' + X(s.x[i]) + '" cy="' + Y(Math.max(Math.min(s.y[i], yb * 10 + 1e3), -1e3)) + '" r="2.5"/>';
    });
    g += '</g><rect class="gb" x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '"/>';
    if (o.xl) g += '<text class="gt" x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + o.xl + '</text>';
    if (o.yl) g += '<text class="gt" transform="translate(13 ' + ((T + H - B) / 2) + ') rotate(-90)" text-anchor="middle">' + o.yl + '</text>';
    var lx = L + 8, ly = T + 14;
    S.forEach(function (s) { if (!s.label) return; g += '<line class="pl ' + (s.cls || 'p0') + '" x1="' + lx + '" x2="' + (lx + 18) + '" y1="' + (ly - 4) + '" y2="' + (ly - 4) + '"' + (s.dash ? ' stroke-dasharray="4 3"' : '') + '/><text class="gt lg" x="' + (lx + 23) + '" y="' + ly + '">' + s.label + '</text>'; ly += 16; });
    return g + '</svg>';
  }

  /* ---------- constructor de simuladores ---------- */
  function build(root, cfg) {
    var wrap = document.createElement('div');
    var ctr = document.createElement('div'); ctr.className = 'sim-ctrl';
    var outEl = document.createElement('div'); outEl.className = 'sim-out'; outEl.setAttribute('aria-live', 'polite');
    var plots = [], vals = {}, els = {}, ptag = document.createElement('div'); ptag.className = 'sim-plots';
    for (var k = 0; k < (cfg.plots || 1); k++) { var p = document.createElement('div'); p.className = 'sim-plot'; ptag.appendChild(p); plots.push(p); }
    var title = cfg.title ? '<p class="sim-t">' + cfg.title + '</p>' : '';
    cfg.controls.forEach(function (c) {
      var lab = document.createElement('label'); lab.className = 'sim-c'; var inp, span;
      if (c.type === 'select') {
        lab.innerHTML = '<span>' + c.label + '</span>'; inp = document.createElement('select');
        c.options.forEach(function (o, i) { var op = document.createElement('option'); op.value = i; op.textContent = o; inp.appendChild(op); });
        inp.value = c.val || 0; vals[c.id] = +inp.value;
      } else if (c.type === 'check') {
        lab.className = 'sim-c sim-chk'; inp = document.createElement('input'); inp.type = 'checkbox'; inp.checked = c.val !== false; vals[c.id] = inp.checked;
        lab.appendChild(inp); span = document.createElement('span'); span.textContent = c.label; lab.appendChild(span);
      } else if (c.type === 'button') {
        inp = document.createElement('button'); inp.type = 'button'; inp.className = 'btn'; inp.textContent = c.label; lab = document.createElement('div'); lab.className = 'sim-c'; lab.appendChild(inp);
        inp.addEventListener('click', function () { c.onclick(vals); run(); });
      } else {
        span = document.createElement('span'); lab.innerHTML = '<span>' + c.label + ' <b class="v"></b></span>';
        inp = document.createElement('input'); inp.type = 'range'; inp.min = c.min; inp.max = c.max; inp.step = c.step; inp.value = c.val; vals[c.id] = +c.val;
      }
      if (c.type !== 'check' && c.type !== 'button') lab.appendChild(inp);
      if (c.mode !== undefined) lab.setAttribute('data-mode', c.mode);
      els[c.id] = { inp: inp, lab: lab, c: c }; ctr.appendChild(lab);
      if (c.type !== 'button') inp.addEventListener('input', function () { read(); run(); });
    });
    function read() {
      cfg.controls.forEach(function (c) {
        var e = els[c.id]; if (c.type === 'button') return;
        vals[c.id] = c.type === 'check' ? e.inp.checked : +e.inp.value;
        var v = e.lab.querySelector('.v'); if (v) v.textContent = (c.fmt || fmt)(vals[c.id], c.d) + (c.unit ? ' ' + c.unit : '');
      });
      cfg.controls.forEach(function (c) { if (c.mode !== undefined) els[c.id].lab.style.display = (c.mode === vals[cfg.modeVar]) ? '' : 'none'; });
    }
    function run() {
      var o = cfg.draw(vals);
      plots.forEach(function (p, i) { p.innerHTML = plot(o.plots[i]); });
      outEl.innerHTML = o.out.map(function (r) { return '<div class="ro' + (r[2] ? ' ' + r[2] : '') + '"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') + (o.msg ? '<p class="sim-msg">' + o.msg + '</p>' : '');
    }
    wrap.innerHTML = title; wrap.appendChild(ctr); wrap.appendChild(outEl); wrap.appendChild(ptag);
    root.appendChild(wrap);
    read(); run();
  }

  /* ---------- 1. Métodos numéricos sobre masa-muelle-fricción ---------- */
  function simNum(root) {
    var K = 5, M = 1;
    function f(B) { return function (x) { return [x[1], (-K * x[0] - B * x[1]) / M]; }; }
    function euler(F, h, N) { var x = [1, 0], o = [x[0]]; for (var i = 0; i < N; i++) { var d = F(x); x = [x[0] + h * d[0], x[1] + h * d[1]]; o.push(x[0]); } return o; }
    function rk2(F, h, N) { var x = [1, 0], o = [1]; for (var i = 0; i < N; i++) { var d = F(x), m = [x[0] + h / 2 * d[0], x[1] + h / 2 * d[1]], e = F(m); x = [x[0] + h * e[0], x[1] + h * e[1]]; o.push(x[0]); } return o; }
    function rk4(F, h, N) { var x = [1, 0], o = [1]; for (var i = 0; i < N; i++) { var a = F(x), b = F([x[0] + h / 2 * a[0], x[1] + h / 2 * a[1]]), c = F([x[0] + h / 2 * b[0], x[1] + h / 2 * b[1]]), d = F([x[0] + h * c[0], x[1] + h * c[1]]); x = [x[0] + h / 6 * (a[0] + 2 * b[0] + 2 * c[0] + d[0]), x[1] + h / 6 * (a[1] + 2 * b[1] + 2 * c[1] + d[1])]; o.push(x[0]); } return o; }
    function ab2(F, h, N) { var x = [1, 0], d0 = F(x), o = [1]; x = [x[0] + h * d0[0], x[1] + h * d0[1]]; o.push(x[0]); for (var i = 1; i < N; i++) { var d1 = F(x); x = [x[0] + h * (1.5 * d1[0] - 0.5 * d0[0]), x[1] + h * (1.5 * d1[1] - 0.5 * d0[1])]; d0 = d1; o.push(x[0]); } return o; }
    var M_ = [['Euler', euler, 'p2', 'ce'], ['RK2', rk2, 'p1', 'c2'], ['RK4', rk4, 'p3', 'c4'], ['Adams-Bashforth 2', ab2, 'p0', 'ca']];
    build(root, {
      title: 'Masa-muelle-fricción con M = 1, K = 5 y y(0) = 1. Compara cada método con la solución exacta.',
      controls: [
        { id: 'h', label: 'Paso h', min: 0.02, max: 0.5, step: 0.01, val: 0.2, unit: 's', d: 2 },
        { id: 'B', label: 'Fricción B', min: 0, max: 3, step: 0.1, val: 1, d: 1 },
        { id: 'ce', label: 'Euler', type: 'check' }, { id: 'c2', label: 'RK2', type: 'check' }, { id: 'c4', label: 'RK4', type: 'check' }, { id: 'ca', label: 'Adams-Bashforth 2', type: 'check', val: false }
      ],
      draw: function (v) {
        var F = f(v.B), T = 10, N = Math.round(T / v.h), ex = rk4(F, 0.002, 5000), tex = [], i, series = [], out = [];
        for (i = 0; i <= 5000; i += 5) tex.push(i * 0.002);
        series.push({ t: 'line', x: tex, y: ex.filter(function (_, j) { return j % 5 === 0; }), cls: 'pk', label: 'exacta' });
        var yex = ex[5000];
        M_.forEach(function (m) {
          if (!v[m[3]]) return;
          var w = m[1](F, v.h, N), t = []; for (i = 0; i <= N; i++) t.push(i * v.h);
          series.push({ t: 'line', x: t, y: w, cls: m[2], label: m[0], marks: N <= 60 ? 1 : 0 });
          var err = Math.abs(w[N] - yex);
          out.push([m[0] + ': error en t = 10', isFinite(err) && err < 1e4 ? fmt(err, 6) : 'diverge', err > 0.1 ? 'bad' : '']);
        });
        return { plots: [{ xr: [0, T], yr: [-1.5, 1.5], xl: 't (s)', yl: 'y', series: series, label: 'Comparación de métodos numéricos con la solución exacta' }], out: out, msg: 'Reduce h y mira cómo el error de cada método baja a distinto ritmo: Euler cae linealmente con h, RK4 con h⁴.' };
      }
    });
  }

  /* ---------- 2. Rigidez y estabilidad de Euler ---------- */
  function simStiff(root) {
    build(root, {
      title: 'Euler sobre y′ = λy con y(0) = 1. Cruza el límite h = 2/|λ| y observa lo que pasa.',
      controls: [
        { id: 'l', label: 'λ', min: -50, max: -1, step: 1, val: -10, d: 0 },
        { id: 'h', label: 'Paso h', min: 0.01, max: 0.5, step: 0.01, val: 0.15, unit: 's', d: 2 }
      ],
      draw: function (v) {
        var T = 2, N = Math.round(T / v.h), f = 1 + v.l * v.h, w = [1], t = [0], i, te = [], ye = [];
        for (i = 0; i < N; i++) { w.push(w[i] * f); t.push((i + 1) * v.h); }
        for (i = 0; i <= 200; i++) { te.push(i * T / 200); ye.push(Math.exp(v.l * i * T / 200)); }
        var lim = 2 / Math.abs(v.l), a = Math.abs(f), est, cls = '';
        if (a < 1e-9) est = 'cae a 0 en un solo paso'; else if (f > 0 && f < 1) est = 'estable y monótona'; else if (f < 0 && a < 1 - 1e-9) est = 'estable pero oscilante'; else if (Math.abs(a - 1) < 1e-9) est = 'oscila sin decaer (límite)'; else { est = 'INESTABLE: diverge'; cls = 'bad'; }
        return {
          plots: [{ xr: [0, T], yr: [-1.5, 1.5], xl: 't (s)', yl: 'y', label: 'Euler frente a la solución exacta', series: [{ t: 'line', x: te, y: ye, cls: 'pk', label: 'exacta e^(λt)' }, { t: 'line', x: t, y: w, cls: 'p2', label: 'Euler', marks: 1 }] }],
          out: [['Factor 1 + λh', fmt(f, 3)], ['Límite 2/|λ|', fmt(lim, 3) + ' s'], ['Estado', est, cls]],
          msg: v.h < lim ? 'Estás dentro del límite de estabilidad: h < 2/|λ|.' : 'Has superado h = 2/|λ|: el factor |1 + λh| ya no es menor que 1.'
        };
      }
    });
  }

  /* ---------- 3. Respuesta al escalón de 1.er y 2.º orden ---------- */
  function simOrden(root) {
    build(root, {
      title: 'Respuesta de un sistema a un escalón unitario. Cambia los parámetros y compara con las fórmulas.',
      modeVar: 'm',
      controls: [
        { id: 'm', label: 'Sistema', type: 'select', options: ['Primer orden', 'Segundo orden'], val: 1 },
        { id: 'K', label: 'Ganancia K', min: 0.5, max: 5, step: 0.1, val: 2, d: 1 },
        { id: 'tau', label: 'Constante τ', min: 0.2, max: 5, step: 0.1, val: 1, unit: 's', d: 1, mode: 0 },
        { id: 'xi', label: 'Amortiguamiento ξ', min: 0, max: 2, step: 0.05, val: 0.3, d: 2, mode: 1 },
        { id: 'wn', label: 'Frecuencia ωn', min: 0.5, max: 5, step: 0.1, val: 2, unit: 'rad/s', d: 1, mode: 1 }
      ],
      draw: function (v) {
        var K = v.K, t = [], y = [], i, T, out, hl = [], msg;
        if (v.m === 0) {
          T = 6 * v.tau; for (i = 0; i <= 300; i++) { t.push(i * T / 300); y.push(K * (1 - Math.exp(-i * T / 300 / v.tau))); }
          out = [['Valor final', fmt(K, 2)], ['t al 63,2 %', fmt(v.tau, 2) + ' s'], ['t asentamiento (2 %)', fmt(4 * v.tau, 2) + ' s'], ['Pendiente inicial', fmt(K / v.tau, 2)]];
          hl = [{ t: 'hline', y: K, cls: 'pk' }, { t: 'hline', y: 0.632 * K, cls: 'p2' }, { t: 'vline', x: v.tau, cls: 'p2' }];
          msg = 'La curva alcanza el 63,2 % de K exactamente en t = τ.';
        } else {
          var xi = v.xi, wn = v.wn; T = Math.min(30, 6 / (Math.max(xi, 0.1) * wn)); var h = T / 3000, x1 = 0, x2 = 0, ymax = 0;
          for (i = 0; i <= 3000; i++) {
            if (i % 10 === 0) { t.push(i * h); y.push(x1); } ymax = Math.max(ymax, x1);
            var a1 = x2, a2 = wn * wn * (K - x1) - 2 * xi * wn * x2; x1 += h * a1; x2 += h * a2;
          }
          var mp = xi < 1 ? Math.exp(-Math.PI * xi / Math.sqrt(1 - xi * xi)) * 100 : 0;
          out = [['Sobreoscilación', xi < 1 ? fmt(mp, 1) + ' %' : 'ninguna'], ['Tiempo de pico', xi < 1 ? fmt(Math.PI / (wn * Math.sqrt(1 - xi * xi)), 2) + ' s' : '—'], ['t asentamiento (2 %)', xi > 0 ? fmt(4 / (xi * wn), 2) + ' s' : 'no se asienta'], ['Régimen', xi === 0 ? 'oscilación sostenida' : xi < 1 ? 'subamortiguado' : xi === 1 ? 'crítico' : 'sobreamortiguado']];
          hl = [{ t: 'hline', y: K, cls: 'pk' }];
          msg = xi < 1 ? 'Con ξ < 1 hay sobreoscilación Mp = e^(−πξ/√(1−ξ²)); con ξ ≥ 1 la respuesta no se pasa de K.' : 'Con ξ ≥ 1 no hay sobreoscilación, pero la respuesta es más lenta.';
        }
        return { plots: [{ xr: [0, t[t.length - 1]], yr: [0, Math.max(K * 1.1, y.reduce(function (a, b) { return Math.max(a, b); }, 0) * 1.05)], xl: 't (s)', yl: 'y', label: 'Respuesta al escalón', series: hl.concat([{ t: 'line', x: t, y: y, cls: 'p0' }]) }], out: out, msg: msg };
      }
    });
  }

  /* ---------- 4. Tanque: no lineal frente a lineal ---------- */
  function simTanque(root) {
    var S = Math.PI * 0.15 * 0.15, Kv = 1e-3, a0 = 0.5, h0 = 0.25, f0 = 2.5e-4;
    build(root, {
      title: 'Tanque de la práctica 2 (radio 15 cm, punto de trabajo h₀ = 0,25 m). Cambia el caudal o la apertura y compara los dos modelos.',
      controls: [
        { id: 'df', label: 'Variación del caudal', min: -75, max: 100, step: 5, val: 45, unit: '%', d: 0 },
        { id: 'da', label: 'Variación de la apertura', min: -75, max: 100, step: 5, val: 0, unit: '%', d: 0 }
      ],
      draw: function (v) {
        var fi = f0 * (1 + v.df / 100), a = a0 * (1 + v.da / 100), dt = 0.5, T = 900, N = T / dt, h = h0, dh = 0, t = [0], hn = [h0], hl = [h0], i;
        for (i = 0; i < N; i++) {
          h += dt / S * (fi - Kv * a * Math.sqrt(Math.max(h, 0)));
          dh += dt / S * ((fi - f0) - Kv * a0 / (2 * Math.sqrt(h0)) * dh - Kv * Math.sqrt(h0) * (a - a0));
          if (i % 6 === 5) { t.push((i + 1) * dt); hn.push(h); hl.push(h0 + dh); }
        }
        var dif = hl[hl.length - 1] - hn[hn.length - 1];
        return {
          plots: [{ xr: [0, T], xl: 't (s)', yl: 'altura h (m)', zero: true, label: 'Altura del tanque: modelo no lineal y lineal', series: [{ t: 'hline', y: 0, cls: 'pk', dash: '2 3' }, { t: 'line', x: t, y: hn, cls: 'p0', label: 'no lineal' }, { t: 'line', x: t, y: hl, cls: 'p1', label: 'lineal', dash: '6 4' }] }],
          out: [['h final no lineal', fmt(hn[hn.length - 1], 3) + ' m'], ['h final lineal', fmt(hl[hl.length - 1], 3) + ' m'], ['Diferencia', fmt(dif, 3) + ' m', Math.abs(dif) > 0.05 ? 'bad' : '']],
          msg: hl[hl.length - 1] < 0 ? 'El modelo lineal predice una altura negativa: es físicamente imposible, así que se ha salido de su zona de validez.' : 'Prueba a cambiar solo la apertura: el lineal falla mucho antes que con el caudal.'
        };
      }
    });
  }

  /* ---------- 5. Analizador del error de predicción ---------- */
  function simError(root) {
    var seed = 7;
    build(root, {
      title: 'Genera un error de predicción y mira qué dicen de él la media, el histograma y la autocorrelación.',
      plots: 3,
      controls: [
        { id: 's', label: 'Tipo de error', type: 'select', options: ['Ruido blanco (modelo bueno)', 'Suma de senoides (dinámica sin modelar)', 'Ruido coloreado (correlado)', 'Ruido con sesgo (media ≠ 0)'], val: 0 },
        { id: 'N', label: 'Muestras N', min: 100, max: 2000, step: 100, val: 500, d: 0 },
        { type: 'button', id: 'rg', label: 'Regenerar', onclick: function () { seed = (seed * 31 + 11) % 100003; } }
      ],
      draw: function (v) {
        var N = v.N, r = rng(seed), e = [], i, k;
        for (i = 0; i < N; i++) {
          var w = r.n();
          if (v.s === 0) e.push(w);
          else if (v.s === 1) e.push(Math.sin(2 * Math.PI * 0.001 * i) + Math.sin(2 * Math.PI * 0.1 * i) + Math.sin(2 * Math.PI * 0.05 * i));
          else if (v.s === 2) e.push(i ? 0.9 * e[i - 1] + w : w);
          else e.push(w + 0.7);
        }
        var m = 0, rms = 0; e.forEach(function (x) { m += x; rms += x * x; }); m /= N; rms /= N;
        var s2 = 0; e.forEach(function (x) { s2 += (x - m) * (x - m); }); var sd = Math.sqrt(s2 / (N - 1));
        var pin = 0; e.forEach(function (x) { if (Math.abs(x - m) <= sd) pin++; }); pin /= N;
        var R = [], rho = [], rr = [], R0;
        for (k = 0; k <= 40; k++) { var a = 0; for (i = 0; i < N - k; i++) a += e[i] * e[i + k]; R.push(a / (N - k)); rr.push(k); }
        R0 = R[0]; R.forEach(function (x) { rho.push(x / R0); });
        var D = 21, mn = Math.min.apply(null, e), mx = Math.max.apply(null, e), de = (mx - mn) / D, hist = [], hx = [];
        for (i = 0; i < D; i++) { hist.push(0); hx.push(mn + (i + 0.5) * de); }
        e.forEach(function (x) { var b = Math.min(D - 1, Math.floor((x - mn) / de)); hist[b]++; });
        hist = hist.map(function (c) { return c / N; });
        var band = 1.96 / Math.sqrt(N), outside = 0; for (k = 1; k <= 40; k++) if (Math.abs(rho[k]) > band) outside++;
        var white = Math.abs(m) < 2 * sd / Math.sqrt(N) && outside <= 4;
        var n1 = Math.min(N, 200), t1 = [], y1 = []; for (i = 0; i < n1; i++) { t1.push(i); y1.push(e[i]); }
        return {
          plots: [
            { h: 190, xr: [0, n1], xl: 'muestra k (primeras 200)', yl: 'e(k)', label: 'Señal de error', series: [{ t: 'hline', y: 0, cls: 'pk', dash: '2 3' }, { t: 'line', x: t1, y: y1, cls: 'p0' }] },
            { h: 190, xr: [mn - de, mx + de], yr: [0, Math.max.apply(null, hist) * 1.1], xl: 'valor del error', yl: 'frecuencia', label: 'Histograma del error', series: [{ t: 'bars', x: hx, y: hist, dx: de, cls: 'p1' }, { t: 'vline', x: m, cls: 'p2' }] },
            { h: 190, xr: [-1, 41], yr: [-1.05, 1.05], xl: 'retardo r', yl: 'R(r)/R(0)', label: 'Autocorrelación normalizada', series: [{ t: 'hline', y: band, cls: 'pk' }, { t: 'hline', y: -band, cls: 'pk' }, { t: 'stems', x: rr, y: rho, cls: 'p3' }] }
          ],
          out: [['Media', fmt(m, 3)], ['Desviación (N−1)', fmt(sd, 3)], ['RMS²  = R(0)', fmt(rms, 3)], ['P(|e − ē| ≤ σ)', fmt(pin * 100, 1) + ' %'], ['Veredicto', white ? 'parece ruido blanco' : 'NO es ruido blanco', white ? '' : 'bad']],
          msg: 'Para un error gaussiano, P(|e − ē| ≤ σ) ≈ 68 %. Las líneas horizontales de la autocorrelación marcan ±1,96/√N: un ruido blanco deja casi todos los retardos r ≥ 1 dentro.'
        };
      }
    });
  }

  /* ---------- 6. Identificación de un sistema de primer orden con retardo ---------- */
  function simIdent(root) {
    var r = rng(21), t = [], y = [], i, KT = 2, DT = 1.5, TT = 4;
    for (i = 0; i <= 100; i++) { var tt = i * 0.2; t.push(tt); y.push(tt < DT ? 0 : KT * (1 - Math.exp(-(tt - DT) / TT))); y[i] += 0.06 * r.n(); }
    build(root, {
      title: 'Reto: ajusta K, el retardo T y la constante τ para que el modelo siga los datos medidos (escalón unitario con ruido).',
      controls: [
        { id: 'K', label: 'Ganancia K', min: 0, max: 4, step: 0.05, val: 1, d: 2 },
        { id: 'T', label: 'Retardo T', min: 0, max: 5, step: 0.1, val: 0, unit: 's', d: 1 },
        { id: 'tau', label: 'Constante τ', min: 0.2, max: 10, step: 0.1, val: 2, unit: 's', d: 1 },
        { id: 'g', label: 'Mostrar guías 28 % y 63 %', type: 'check', val: false },
        { id: 'sol', label: 'Ver la solución', type: 'check', val: false }
      ],
      draw: function (v) {
        var K = v.sol ? KT : v.K, T = v.sol ? DT : v.T, tau = v.sol ? TT : v.tau, ym = [], s = 0, i;
        for (i = 0; i < t.length; i++) { ym.push(t[i] < T ? 0 : K * (1 - Math.exp(-(t[i] - T) / tau))); s += (y[i] - ym[i]) * (y[i] - ym[i]); }
        var rmse = Math.sqrt(s / t.length), ser = [{ t: 'dots', x: t, y: y, cls: 'p2', r: 2, label: 'datos medidos' }, { t: 'line', x: t, y: ym, cls: 'p0', label: 'modelo' }];
        if (v.g) ser.push({ t: 'hline', y: 0.283 * K, cls: 'pk' }, { t: 'hline', y: 0.632 * K, cls: 'pk' }, { t: 'vline', x: T + tau / 3, cls: 'p1' }, { t: 'vline', x: T + tau, cls: 'p1' });
        return {
          plots: [{ xr: [0, 20], yr: [-0.3, 4.2], xl: 't (s)', yl: 'y', label: 'Datos medidos y modelo', series: ser }],
          out: [['RMSE', fmt(rmse, 3), rmse < 0.09 ? 'ok' : ''], ['t al 28,3 %', fmt(T + tau / 3, 2) + ' s'], ['t al 63,2 %', fmt(T + tau, 2) + ' s']],
          msg: rmse < 0.09 ? 'Muy bien: el error es del tamaño del ruido de medida (≈ 0,06).' : 'Pista: el valor final de los datos da K; el instante en que empiezan a subir da el retardo; con t28 = T + τ/3 y t63 = T + τ se despeja τ.'
        };
      }
    });
  }

  /* ---------- 7. PID digital: efecto del periodo de control ---------- */
  function simPid(root) {
    build(root, {
      title: 'Planta G(s) = 1/((s + 1)(0,5s + 1)) con un PID por computador. La planta se integra con h = 0,01 s y el controlador actúa cada Tc.',
      plots: 2,
      controls: [
        { id: 'Kp', label: 'Kp', min: 0.2, max: 12, step: 0.2, val: 3, d: 1 },
        { id: 'Ti', label: 'Ti', min: 0.2, max: 10, step: 0.1, val: 2, unit: 's', d: 1 },
        { id: 'Td', label: 'Td', min: 0, max: 1, step: 0.05, val: 0.2, unit: 's', d: 2 },
        { id: 'Tc', label: 'Periodo de control Tc', min: 0.01, max: 1.2, step: 0.01, val: 0.1, unit: 's', d: 2 }
      ],
      draw: function (v) {
        var h = 0.01, T = 15, N = T / h, n = Math.max(1, Math.round(v.Tc / h)), Tc = n * h, y = 0, yp = 0, I = 0, ep = 0, u = 0, t = [], ys = [], us = [], i, ymax = 0;
        for (i = 0; i <= N; i++) {
          if (i % n === 0) { var e = 1 - y; I += Tc * e; var d = i ? (e - ep) / Tc : 0; ep = e; u = Math.max(-10, Math.min(10, v.Kp * (e + I / v.Ti + v.Td * d))); }
          if (i % 5 === 0) { t.push(i * h); ys.push(y); us.push(u); }
          ymax = Math.max(ymax, Math.abs(y));
          var ypp = 2 * u - 3 * yp - 2 * y; y += h * yp; yp += h * ypp;
          if (Math.abs(y) > 1e4) { y = 1e4 * (y > 0 ? 1 : -1); }
        }
        var over = Math.max(0, (Math.max.apply(null, ys) - 1) * 100), last = ys[ys.length - 1], bad = Math.abs(last - 1) > 0.1 || ymax > 5;
        return {
          plots: [
            { h: 200, xr: [0, T], yr: [-0.2, 2], xl: 't (s)', yl: 'salida y', label: 'Salida del lazo', series: [{ t: 'hline', y: 1, cls: 'pk', label: 'referencia' }, { t: 'line', x: t, y: ys, cls: 'p0', label: 'salida' }] },
            { h: 170, xr: [0, T], yr: [-11, 11], xl: 't (s)', yl: 'acción u', label: 'Acción de control', series: [{ t: 'line', x: t, y: us, cls: 'p2' }] }
          ],
          out: [['Tc efectivo', fmt(Tc, 2) + ' s'], ['Sobreoscilación', fmt(over, 1) + ' %'], ['y en t = 15 s', fmt(last, 3), bad ? 'bad' : 'ok']],
          msg: bad ? 'El lazo no se estabiliza en 15 s. Con un periodo Tc grande el control actúa tarde y puede volverse inestable, y la acción saturada (±10) aparece como una recta.' : 'Sube Tc y mira cómo empeora la respuesta aunque no cambies Kp, Ti ni Td.'
        };
      }
    });
  }


  /* ---------- vídeos de YouTube bajo demanda ---------- */
  function initVideos() {
    var v = document.querySelectorAll('.yt[data-id]');
    for (var i = 0; i < v.length; i++) (function (el) {
      var id = el.getAttribute('data-id'), t = el.getAttribute('data-title') || 'Vídeo';
      var url = 'https://www.youtube.com/watch?v=' + id;
      el.innerHTML = '<button type="button" class="yt-btn" aria-label="Reproducir: ' + t.replace(/"/g, '') + '"><span class="yt-play" aria-hidden="true">▶</span><span class="yt-ti">' + t + '</span></button><a class="yt-open" href="' + url + '" target="_blank" rel="noopener">Abrir en YouTube</a>';
      el.querySelector('button').addEventListener('click', function () {
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0'; f.title = t; f.loading = 'lazy'; f.allowFullscreen = true;
        f.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen');
        f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        el.className = 'yt yt-on'; el.insertBefore(f, el.firstChild); el.querySelector('button').remove();
      });
    })(v[i]);
  }

  /* ---------- generador de ejercicios con corrección ---------- */
  function rnd(a, b, d) { var m = Math.pow(10, d || 0); return Math.round((a + Math.random() * (b - a)) * m) / m; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function fmt(x) { return String(Math.round(x * 1e4) / 1e4).replace('.', ','); }
  var GEN = [
    function () { var a = pick([1, 2, 3, 4, 5]), b = pick([1, 2, 3, 4]), h = pick([0.1, 0.2, 0.25, 0.5]), y0 = pick([0, 1, 2]);
      return { t: 'Euler, un paso', q: 'y′ = −' + a + '·y + ' + b + ', y(0) = ' + y0 + ', h = ' + fmt(h) + '. Calcula w₁.', a: y0 + h * (-a * y0 + b), u: '',
        s: 'w₁ = y₀ + h·f(y₀) = ' + y0 + ' + ' + fmt(h) + '·(−' + a + '·' + y0 + ' + ' + b + ')' }; },
    function () { var l = pick([5, 8, 10, 20, 25, 40, 50, 100]);
      return { t: 'Estabilidad de Euler', q: 'Un sistema tiene un polo en −' + l + ' s⁻¹. ¿Qué paso máximo h (en s) mantiene estable a Euler?', a: 2 / l, u: 's',
        s: 'h < 2/|λ| = 2/' + l }; },
    function () { var du = pick([1, 2, 3, 5]), K = pick([1, 1.5, 2, 3, 4]), tau = pick([2, 3, 4, 6]), T = pick([0.5, 1, 2]), y0 = pick([0, 1, 2]);
      var t28 = T + tau / 3, t63 = T + tau; t28 = Math.round((T + 0.333 * tau) * 100) / 100; t63 = T + tau;
      return { t: 'Primer orden con retardo', q: 'Un escalón Δu = ' + du + ' lleva la salida de ' + y0 + ' a ' + fmt(y0 + K * du) + '. Se lee t₂₈ = ' + fmt(t28) + ' s y t₆₃ = ' + fmt(t63) + ' s. Calcula τ (en s) con τ = 1,5·(t₆₃ − t₂₈).', a: 1.5 * (t63 - t28), u: 's',
        s: 'τ = 1,5·(' + fmt(t63) + ' − ' + fmt(t28) + '). Después K = Δy/Δu = ' + fmt(K) + ' y T = t₆₃ − τ = ' + fmt(t63 - 1.5 * (t63 - t28)) }; },
    function () { var M = pick([1, 2, 4]), K = pick([20, 50, 100]), B = pick([2, 4, 8]);
      return { t: 'Factor de amortiguamiento', q: 'Mẍ + Bẋ + Kx = F con M = ' + M + ' kg, B = ' + B + ' N·s/m, K = ' + K + ' N/m. Calcula ξ.', a: B / (2 * Math.sqrt(K * M)), u: '',
        s: 'ξ = B / (2√(K·M)) = ' + B + ' / (2√(' + K + '·' + M + '))' }; },
    function () { var a1 = pick([-0.9, -0.8, -0.5, 0.2]), b1 = pick([0.2, 0.5, 1, 2]), y = pick([1, 2, 3]), u = pick([1, 2, 4]);
      return { t: 'Predicción ARX', q: 'Modelo ARX y(k) = −a₁·y(k−1) + b₁·u(k−1) con a₁ = ' + fmt(a1) + ', b₁ = ' + fmt(b1) + '. Con y(k−1) = ' + y + ' y u(k−1) = ' + u + ', calcula la predicción ŷ(k).', a: -a1 * y + b1 * u, u: '',
        s: 'ŷ = −(' + fmt(a1) + ')·' + y + ' + ' + fmt(b1) + '·' + u }; }
  ];
  function simGen(el) {
    el.innerHTML = '<div class="gen"><div class="gen-t"></div><p class="gen-q"></p><div class="gen-row"><input type="text" inputmode="decimal" aria-label="Tu respuesta" placeholder="Tu respuesta"><button type="button" class="btn gen-ok">Comprobar</button><button type="button" class="btn gen-new">Otro ejercicio</button></div><p class="gen-fb" aria-live="polite"></p></div>';
    var cur, inp = el.querySelector('input'), fb = el.querySelector('.gen-fb'), n = 0, ok = 0;
    function nuevo() { cur = pick(GEN)(); el.querySelector('.gen-t').textContent = cur.t; el.querySelector('.gen-q').textContent = cur.q; inp.value = ''; fb.textContent = ''; fb.className = 'gen-fb'; inp.focus(); }
    el.querySelector('.gen-new').addEventListener('click', nuevo);
    function check() {
      var v = parseFloat(inp.value.replace(',', '.')); if (isNaN(v)) { fb.textContent = 'Escribe un número.'; return; }
      var good = Math.abs(v - cur.a) <= Math.max(0.02 * Math.abs(cur.a), 0.01); n++; if (good) ok++;
      fb.className = 'gen-fb ' + (good ? 'ok' : 'bad');
      fb.textContent = (good ? 'Correcto. ' : 'No coincide. ') + cur.s + ' = ' + fmt(cur.a) + (cur.u ? ' ' + cur.u : '') + '.' + (cur.x || '') + '  Aciertos: ' + ok + '/' + n;
    }
    el.querySelector('.gen-ok').addEventListener('click', check);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
    nuevo();
  }

  /* ---------- fichas de repaso ---------- */
  var CARDS = [
    ['Euler: fórmula y orden', 'wₖ₊₁ = wₖ + h·f(tₖ, wₖ). Orden 1: error global O(h).'],
    ['RK2 (punto medio)', 'Pendiente en el punto medio: wₖ₊₁ = wₖ + h·f(tₖ + h/2, wₖ + (h/2)·f). Orden 2.'],
    ['Adams-Bashforth de 2 pasos', 'wₖ₊₁ = wₖ + (h/2)·(3fₖ − fₖ₋₁). Necesita w₁ de un método de un paso.'],
    ['Límite de estabilidad de Euler', 'h < 2/|λ| para un polo λ < 0. Si no, la solución numérica oscila y crece.'],
    ['Rigidez', 'Polos con escalas muy distintas: el más rápido limita h aunque ya no influya. Se usa un solver implícito.'],
    ['Modelo FOPDT desde un escalón', 'K = Δy/Δu; τ = 1,5·(t₆₃ − t₂₈); T = t₆₃ − τ.'],
    ['Mínimos cuadrados', 'θ̂ = (ΦᵀΦ)⁻¹ΦᵀY. Necesita que la entrada excite el sistema.'],
    ['ARX frente a OE', 'ARX: usa salidas medidas, lineal en los parámetros, mínimos cuadrados. OE: realimenta sus propias predicciones, se resuelve iterando.'],
    ['Factor de amortiguamiento', 'ξ = B / (2√(K·M)); ωₙ = √(K/M). Con ξ < 1 hay sobreoscilación.'],
    ['Tiempo de retardo y paso de control', 'En control por computador el controlador se recalcula cada T_c = n·h y entre medias la salida se mantiene.'],
    ['Autocorrelación del error', 'R(0) es el valor medio cuadrado; si R(r) ≈ 0 para r ≠ 0, el error es ruido blanco: no queda dinámica sin modelar.'],
    ['¿Qué se guarda en cada paso?', 'Tiempo, estados, entrada y salida: lo necesario para dibujar y analizar después.']
  ];
  function simCards(el) {
    var i = Math.floor(Math.random() * CARDS.length), side = 0;
    el.innerHTML = '<div class="fc" role="button" tabindex="0" aria-live="polite"></div><div class="gen-row"><button type="button" class="btn fc-prev">Anterior</button><button type="button" class="btn fc-next">Siguiente</button><span class="fc-n"></span></div>';
    var c = el.querySelector('.fc');
    function show() { c.className = 'fc' + (side ? ' back' : ''); c.innerHTML = '<small>' + (side ? 'Respuesta' : 'Pregunta') + '</small><p>' + (side ? CARDS[i][1] : CARDS[i][0]) + '</p>'; el.querySelector('.fc-n').textContent = (i + 1) + ' / ' + CARDS.length + ' · toca la ficha para girarla'; }
    function flip() { side = 1 - side; show(); }
    c.addEventListener('click', flip); c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    el.querySelector('.fc-next').addEventListener('click', function () { i = (i + 1) % CARDS.length; side = 0; show(); });
    el.querySelector('.fc-prev').addEventListener('click', function () { i = (i + CARDS.length - 1) % CARDS.length; side = 0; show(); });
    show();
  }

  var SIMS = { num: simNum, stiff: simStiff, orden: simOrden, tanque: simTanque, error: simError, ident: simIdent, pid: simPid, gen: simGen, cards: simCards };
  function init() {
    var els = document.querySelectorAll('[data-sim]');
    for (var i = 0; i < els.length; i++) {
      var f = SIMS[els[i].getAttribute('data-sim')];
      if (f && !els[i].hasChildNodes()) { try { f(els[i]); } catch (e) { els[i].textContent = 'No se pudo cargar el simulador.'; } }
    }
  }
  function all() { init(); initVideos(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
})();
