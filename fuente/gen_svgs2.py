import math
from pathlib import Path
D = Path(__file__).resolve().parent / "src" / "svg"
def w(name, body, h, title):
    (D / f"{name}.svg").write_text(f'<svg viewBox="0 0 640 {h}" role="img" aria-labelledby="{name}t"><title id="{name}t">{title}</title>{body}</svg>', encoding="utf-8")

def txt(x, y, s, c="s-tx", a="middle"): return f'<text x="{x}" y="{y}" text-anchor="{a}" class="{c}">{s}</text>'
def box(x, y, wd, ht, s, acc=False):
    cls = 's-acc" style="fill:var(--accent-soft)' if acc else "s-box"
    return f'<rect x="{x}" y="{y}" width="{wd}" height="{ht}" rx="8" class="{cls}"/>' + txt(x + wd / 2, y + ht / 2 + 5, s)
def arrow(d, a=False): return f'<path d="{d}" class="s-thin" marker-end="url(#{"aha" if a else "ah"})"/>'

# 1. Euler
f = lambda x: 215 - 150 * (1 - math.exp(-(x - 70) / 85))
df = lambda x: -150 / 85 * math.exp(-(x - 70) / 85)
pts = " ".join(f"{'M' if i == 0 else 'L'}{x:.1f} {f(x):.1f}" for i, x in enumerate(range(70, 600, 6)))
xk, xk1 = 150, 290
yk = f(xk); ytan = yk + df(xk) * (xk1 - xk); yre = f(xk1)
b = f'<path d="M70 20 V215 H610" class="s-ln"/><path d="{pts}" class="s-ln"/>'
b += f'<path d="M{xk} {yk:.1f} L{xk1} {ytan:.1f}" class="s-acc"/>'
b += f'<circle cx="{xk}" cy="{yk:.1f}" r="4.5" fill="var(--fg)"/><circle cx="{xk1}" cy="{ytan:.1f}" r="4.5" fill="var(--accent)"/><circle cx="{xk1}" cy="{yre:.1f}" r="4.5" fill="var(--fg)"/>'
b += f'<path d="M{xk} {yk:.1f} V215 M{xk1} {yre:.1f} V215" class="s-thin" stroke-dasharray="4 4"/>'
b += f'<path d="M{xk1+12} {ytan:.1f} V{yre:.1f}" class="s-thin" marker-end="url(#ah)" marker-start="url(#ah)"/>'
b += txt(xk, 233, "t(k)") + txt(xk1, 233, "t(k)+h") + txt(xk1 + 20, (ytan + yre) / 2 + 4, "error local", "s-tx2", "start")
b += txt(xk1 - 10, ytan - 10, "w(k+1)", "s-tx", "end") + txt(xk1 + 20, yre + 24, "y(t(k+1))", "s-tx2", "start")
b += txt(xk + 14, yk + 34, "pendiente f(w(k), t(k))", "s-tx2", "start") + txt(590, 238, "t", "s-it", "end") + txt(60, 30, "y", "s-it", "end")
w("euler", b, 245, "Un paso de Euler: se avanza por la tangente y el valor queda por encima de la solución real")

# 2. RK4
g = lambda x: 205 - 100 * (1 - math.exp(-(x - 90) / 150))
dg = lambda x: -100 / 150 * math.exp(-(x - 90) / 150)
pts = " ".join(f"{'M' if i == 0 else 'L'}{x:.1f} {g(x):.1f}" for i, x in enumerate(range(90, 600, 6)))
x0, xm, x1 = 130, 310, 490
def seg(x, y, s, cls, L=64):
    ang = math.atan(s); dx = L * math.cos(ang) / 2; dy = L * math.sin(ang) / 2
    return f'<path d="M{x-dx:.1f} {y-dy:.1f} L{x+dx:.1f} {y+dy:.1f}" class="{cls}"/>'
y0 = g(x0); ym = g(xm); y1 = g(x1)
b = f'<path d="M90 20 V215 H610" class="s-ln"/><path d="{pts}" class="s-thin"/>'
b += f'<path d="M{x0} {y0:.1f} V215 M{xm} {ym:.1f} V215 M{x1} {y1:.1f} V215" class="s-thin" stroke-dasharray="3 5"/>'
s1, s2, s3, s4 = dg(x0), dg(xm) * 0.9, dg(xm) * 1.12, dg(x1) * 0.95
b += seg(x0, y0, s1, "s-ln") + seg(xm, ym - 8, s2, "s-ln") + seg(xm, ym + 8, s3, "s-ln") + seg(x1, y1, s4, "s-ln")
sa = (s1 + 2 * s2 + 2 * s3 + s4) / 6
b += f'<path d="M{x0} {y0:.1f} L{x1} {y0 + sa * (x1 - x0):.1f}" class="s-acc"/>'
b += f'<circle cx="{x0}" cy="{y0:.1f}" r="4.5" fill="var(--fg)"/><circle cx="{x1}" cy="{y0 + sa * (x1 - x0):.1f}" r="4.5" fill="var(--accent)"/>'
b += txt(x0, y0 - 24, "K1", "s-tx") + txt(xm, ym - 24, "K2", "s-tx") + txt(xm + 52, ym + 26, "K3", "s-tx") + txt(x1, y1 - 24, "K4", "s-tx")
b += txt(x0, 233, "t") + txt(xm, 233, "t + h/2") + txt(x1, 233, "t + h")
b += txt(560, y0 + sa * (x1 - x0) + 4, "(K1 + 2K2 + 2K3 + K4)/6", "s-tx2", "start") if False else txt(628, y0 + sa * (x1 - x0) + 34, "pendiente media", "s-tx", "end") + txt(628, y0 + sa * (x1 - x0) + 52, "(K1+2K2+2K3+K4)/6", "s-tx2", "end")
w("rk4", b, 245, "Runge-Kutta de orden 4: cuatro pendientes dentro del paso y una pendiente media ponderada")

# 3. estabilidad de Euler
b = '<path d="M30 110 H620" class="s-ln"/>'
X = lambda v: 330 + v * 140   # factor 1+lambda*h
zones = [(-2.2, -1, "var(--c-ter)", "diverge oscilando", "h > 2/|λ|"), (-1, 0, "var(--c-mec)", "decae oscilando", "1/|λ| < h < 2/|λ|"), (0, 1, "var(--c-ctl)", "decae sin oscilar", "h < 1/|λ|")]
for a_, b_, c, t1, t2 in zones:
    xa, xb = max(X(a_), 30), X(b_)
    b += f'<rect x="{xa:.0f}" y="84" width="{xb-xa:.0f}" height="52" fill="{c}" opacity=".25"/>' + txt((xa + xb) / 2, 106, t1, "s-tx") + txt((xa + xb) / 2, 126, t2, "s-tx2")
for v, l in [(-1, "−1"), (0, "0"), (1, "1")]:
    b += f'<path d="M{X(v):.0f} 78 V142" class="s-ln"/>' + txt(X(v), 164, l, "s-it")
b += txt(330, 40, "Factor de amplificación 1 + λh (λ < 0)", "s-tx") + txt(330, 64, "Con Euler, w(k) = (1 + λh)ᵏ · w(0): la solución numérica solo tiende a 0 si |1 + λh| < 1", "s-tx2")
b += txt(330, 192, "Estable: −1 < 1 + λh < 1, es decir, h < 2/|λ|", "s-tx", "middle")
w("estabilidad", b, 205, "Zonas del factor 1 más lambda por h: decae, decae oscilando y diverge")

# 4. ARX frente a OE
def pred(x, title, fb, fbtxt):
    s = box(x + 90, 98, 120, 70, title, True)
    s += txt(x + 12, 66, "u(k−1)…", "s-it", "start") + arrow(f"M{x+60} 72 Q{x+80} 100 {x+90} 118")
    s += txt(x + 12, 224, fbtxt, "s-it", "start") + arrow(f"M{x+60} 212 Q{x+80} 170 {x+90} 150")
    s += arrow(f"M{x+210} 133 H{x+262}", True) + txt(x + 262, 120, "ŷ(k)", "s-it", "end")
    return s
b = pred(0, "ARX", 0, "y(k−1)… real") + pred(330, "OE", 0, "ŷ(k−1)… predicha")
b += txt(150, 32, "ARX: realimenta lo MEDIDO", "s-tx") + txt(480, 32, "OE: realimenta lo PREDICHO", "s-tx")
b += f'<path d="M320 14 V250" class="s-thin" stroke-dasharray="4 5"/>'
b += txt(150, 248, "corrige con la salida real en cada paso", "s-tx2") + txt(480, 248, "el modelo corre solo con la entrada", "s-tx2")
w("arx-oe", b, 262, "Diferencia entre predecir con un modelo ARX, que usa la salida medida, y con un OE, que usa su propia predicción")

# 5. tanque
b = '<rect x="210" y="70" width="150" height="190" class="s-box" style="fill:none"/>'
b += '<rect x="212" y="150" width="146" height="108" class="s-water"/><path d="M212 150 H358" class="s-acc"/>'
b += arrow("M70 52 H200 Q232 52 232 92", True) + txt(70, 42, "caudal de entrada fᵢ", "s-tx", "start") + txt(70, 74, "15 l/min", "s-tx2", "start")
b += '<path d="M360 244 H430" class="s-ln"/>'
b += '<path d="M430 224 V244 M418 224 H442" class="s-ln"/><circle cx="430" cy="244" r="6" fill="var(--accent)"/>' + txt(452, 212, "válvula, apertura a", "s-tx", "start") + txt(452, 230, "a₀ = 50 %", "s-tx2", "start")
b += arrow("M436 244 H520", True) + txt(526, 249, "fₒ = K·a·√h", "s-tx", "start")
b += f'<path d="M382 150 V258" class="s-thin" marker-end="url(#ah)" marker-start="url(#ah)"/>' + txt(390, 205, "h", "s-it", "start")
b += txt(285, 100, "S = πr²", "s-it") + txt(285, 120, "r = 15 cm", "s-tx2") + txt(285, 140, "h₀ = 25 cm", "s-tx2")
b += txt(285, 288, "S·dh/dt = fᵢ − K·a·√h", "s-tx")
w("tanque", b, 305, "Tanque con caudal de entrada y válvula de salida de apertura a, con la ecuación de la altura")

# 6. control digital
b = box(26, 90, 66, 54, "r") if False else ""
b += txt(28, 122, "r(t)", "s-it") + arrow("M52 118 H92") + '<circle cx="106" cy="118" r="14" class="s-box"/>' + txt(106, 123, "Σ")
b += arrow("M120 118 H150") + box(150, 92, 92, 52, "muestreo Tc") + arrow("M242 118 H272") + box(272, 92, 92, 52, "PID digital", True)
b += arrow("M364 118 H394") + box(394, 92, 76, 52, "ZOH") + arrow("M470 118 H500") + box(500, 92, 80, 52, "planta")
b += arrow("M580 118 H622", True) + txt(612, 100, "y(t)", "s-it", "end")
b += '<path d="M598 118 V196 H106 V132" class="s-thin" marker-end="url(#ah)"/>' + txt(106, 150, "−", "s-it", "start") if False else ""
b += f'<path d="M600 118 V190 H106 V133" class="s-thin" marker-end="url(#ah)"/><circle cx="600" cy="118" r="3.5" fill="var(--fg)"/>' + txt(350, 212, "realimentación de la salida medida", "s-tx2")
b += txt(106, 88, "e(k)", "s-it", "start") if False else txt(196, 78, "k·Tc", "s-tx2") + txt(318, 78, "u(k)", "s-it") + txt(432, 78, "u(t) constante", "s-tx2")
b += txt(318, 40, "El controlador solo actúa cada Tc = n·h; entre dos instantes la salida se mantiene", "s-tx", "middle")
w("pid-digital", b, 232, "Lazo de control por computador: muestreo, PID digital, retenedor de orden cero y planta continua")

# 7. paso variable
cx = lambda x: 215 - 150 / (1 + math.exp(-(x - 250) / 22))
xs = [60 + i * 36 for i in range(5)] + [60 + 4 * 36 + 18 * k for k in range(1, 4)]
xs = [60, 96, 132, 168, 196, 214, 228, 240, 250, 260, 272, 286, 304, 330, 366, 408, 450, 492, 534, 576]
pts = " ".join(f"{'M' if i == 0 else 'L'}{x:.1f} {cx(x):.1f}" for i, x in enumerate(range(60, 600, 4)))
b = f'<path d="M50 20 V215 H610" class="s-ln"/><path d="{pts}" class="s-thin"/>'
for x in xs: b += f'<circle cx="{x}" cy="{cx(x):.1f}" r="4" fill="var(--accent)"/><path d="M{x} 215 V221" class="s-ln"/>'
b += txt(105, 244, "pasos largos", "s-tx2") + txt(251, 244, "pasos cortos", "s-tx2") + txt(240, 262, "(la solución cambia deprisa)", "s-tx2") + txt(480, 244, "otra vez pasos largos", "s-tx2")
b += txt(330, 40, "Con paso variable, h se adapta a lo que hace la solución", "s-tx")
w("paso-variable", b, 272, "Puntos calculados por un método de paso variable: más densos donde la solución cambia deprisa")
print("ok")
