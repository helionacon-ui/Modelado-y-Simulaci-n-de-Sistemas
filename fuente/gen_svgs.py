#!/usr/bin/env python3
"""Genera las gráficas de respuesta al escalón (curvas calculadas, no dibujadas a mano)."""
import math
from pathlib import Path
OUT = Path(__file__).resolve().parent / "src" / "svg"

def path(points):
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in points)

# --- primer orden con retardo: K=1 (normalizado), T=1 s, tau=4 s
X0, Y0, YT = 96, 226, 56          # origen, y(0) y y(1) en pantalla
sx = 510 / 14
sy = (Y0 - YT)
T, tau = 1.0, 4.0
pts = []
t = 0.0
while t <= 14.001:
    v = 0 if t < T else 1 - math.exp(-(t - T) / tau)
    pts.append((X0 + t * sx, Y0 - v * sy)); t += 0.1
def X(t): return X0 + t * sx
def Y(v): return Y0 - v * sy
t28, t63 = T + tau / 3, T + tau
svg = f'''<svg viewBox="0 0 640 280" role="img" aria-labelledby="g1t">
  <title id="g1t">Respuesta al escalón de un sistema de primer orden con retardo y los puntos del 28,3 % y el 63,2 %</title>
  <path d="M{X0} 24 V{Y0} H620" class="s-ln"/>
  <path d="M{X0} {Y(1):.1f} H610" class="s-thin" stroke-dasharray="6 4"/>
  <path d="{path(pts)}" class="s-acc"/>
  <path d="M{X0} {Y(0.283):.1f} H{X(t28):.1f} V{Y0}" class="s-thin" stroke-dasharray="3 4"/>
  <path d="M{X0} {Y(0.632):.1f} H{X(t63):.1f} V{Y0}" class="s-thin" stroke-dasharray="3 4"/>
  <path d="M{X(T):.1f} {Y0} V{Y0+8}" class="s-ln"/>
  <circle cx="{X(t28):.1f}" cy="{Y(0.283):.1f}" r="4" class="s-head-a"/><circle cx="{X(t63):.1f}" cy="{Y(0.632):.1f}" r="4" class="s-head-a"/>
  <text x="{X0-8}" y="{Y(1)+4:.1f}" text-anchor="end" class="s-tx2">KΔu</text>
  <text x="{X0-8}" y="{Y(0.632)+4:.1f}" text-anchor="end" class="s-tx2">0,632 KΔu</text>
  <text x="{X0-8}" y="{Y(0.283)+4:.1f}" text-anchor="end" class="s-tx2">0,283 KΔu</text>
  <text x="{X(T):.1f}" y="{Y0+24}" text-anchor="middle" class="s-tx2">T</text>
  <text x="{X(t28):.1f}" y="{Y0+24}" text-anchor="middle" class="s-tx2">t₂₈ = T + τ/3</text>
  <text x="{X(t63):.1f}" y="{Y0+24}" text-anchor="middle" class="s-tx2">t₆₃ = T + τ</text>
  <text x="614" y="{Y0-8}" text-anchor="end" class="s-tx2">t</text>
  <text x="{X0+8}" y="40" class="s-tx2">y(t)</text>
  <text x="{X(9):.1f}" y="{Y(0.5)+0:.1f}" class="s-tx">K = Δy / Δu</text>
</svg>'''
(OUT / "fopdt.svg").write_text(svg, encoding="utf-8")

# --- segundo orden subamortiguado: xi=0.5, tp=0.8 s
xi, tp = 0.5, 0.8
wd = math.pi / tp; wn = wd / math.sqrt(1 - xi**2); sg = xi * wn
X0, Y0, Y1 = 70, 236, 96
sx = 530 / 2.4; sy = Y0 - Y1
def y2(t):
    return 1 - math.exp(-sg * t) * (math.cos(wd * t) + sg / wd * math.sin(wd * t))
pts = []; t = 0.0
while t <= 2.4001: pts.append((X0 + t * sx, Y0 - y2(t) * sy)); t += 0.02
def X(t): return X0 + t * sx
def Y(v): return Y0 - v * sy
mp = y2(tp) - 1; ts2 = 4 / sg
svg = f'''<svg viewBox="0 0 640 290" role="img" aria-labelledby="g2t">
  <title id="g2t">Respuesta al escalón de un sistema de segundo orden subamortiguado con sobreoscilación, tiempo de pico y tiempo de establecimiento</title>
  <path d="M{X0} 28 V{Y0} H620" class="s-ln"/>
  <path d="M{X0} {Y(1):.1f} H610" class="s-thin" stroke-dasharray="6 4"/>
  <path d="M{X0} {Y(1.02):.1f} H610 M{X0} {Y(0.98):.1f} H610" class="s-thin" stroke-dasharray="2 4"/>
  <path d="{path(pts)}" class="s-acc"/>
  <path d="M{X(tp):.1f} {Y(1+mp):.1f} V{Y0}" class="s-thin" stroke-dasharray="3 4"/>
  <path d="M{X(ts2):.1f} {Y(1):.1f} V{Y0}" class="s-thin" stroke-dasharray="3 4"/>
  <path d="M{X(tp)+26:.1f} {Y(1):.1f} V{Y(1+mp):.1f}" class="s-ln" marker-start="url(#ah)" marker-end="url(#ah)"/>
  <circle cx="{X(tp):.1f}" cy="{Y(1+mp):.1f}" r="4" class="s-head-a"/>
  <text x="{X(tp)+34:.1f}" y="{(Y(1)+Y(1+mp))/2+4:.1f}" class="s-tx">Mp</text>
  <text x="{X(tp):.1f}" y="{Y0+22}" text-anchor="middle" class="s-tx2">tp = π/ωd</text>
  <text x="{X(ts2):.1f}" y="{Y0+22}" text-anchor="middle" class="s-tx2">ts ≈ 4/σ</text>
  <text x="{X0-8}" y="{Y(1)+4:.1f}" text-anchor="end" class="s-tx2">1</text>
  <text x="612" y="{Y(1.02)-6:.1f}" text-anchor="end" class="s-tx2">banda ±2 %</text>
  <text x="614" y="{Y0-8}" text-anchor="end" class="s-tx2">t</text>
  <text x="{X0+8}" y="42" class="s-tx2">y(t), con K = 1</text>
</svg>'''
(OUT / "segundo.svg").write_text(svg, encoding="utf-8")
print("ok", round(mp, 4), round(ts2, 3))
