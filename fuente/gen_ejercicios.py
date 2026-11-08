"""Genera src/complementarios.body.html con ejercicios cuyas soluciones se calculan con código."""
import numpy as np
from pathlib import Path

def c(x, d=4):
    s = f"{x:.{d}f}".rstrip("0").rstrip(".") if abs(x) >= 1e-3 else f"{x:.3e}"
    return s.replace(".", "{,}")

EX = []
def ex(tema, unidad, enun, sol):
    EX.append((tema, unidad, enun, sol))

EXA = 2 * (1 - np.exp(-1))
# 1 Euler
f = lambda y: -2 * y + 4
y = 0; w = [0]
for _ in range(2): y += 0.25 * f(y); w.append(y)
ex("Euler", "UD4", r"Con Euler y \(h=0{,}25\) resuelve \(y'=-2y+4\), \(y(0)=0\). Calcula \(w_1\) y \(w_2\).",
   rf"\(w_1=0+0{{,}}25\,(4)={c(w[1],2)}\); \(w_2={c(w[1],2)}+0{{,}}25\,(-2\cdot{c(w[1],2)}+4)={c(w[2],2)}\). La exacta en \(t=0{{,}}5\) es \(2(1-e^{{-1}})={c(EXA)}\): Euler se pasa (error \({c(abs(w[2]-EXA),3)}\)).")
# 2 RK2
y = 0; r = [0]
for _ in range(2): y = y + 0.25 * f(y + 0.125 * f(y)); r.append(y)
ex("Runge-Kutta 2", "UD4", r"El mismo problema, ahora con RK2 de punto medio y \(h=0{,}25\). Calcula \(w_1\) y \(w_2\).",
   rf"Primer paso: pendiente en el punto medio \(f(0+0{{,}}125\cdot4)=f(0{{,}}5)=3\), \(w_1=0{{,}}25\cdot3={c(r[1],2)}\). Segundo: \(w_2={c(r[2],5)}\). La exacta en \(t=0{{,}}5\) es \({c(EXA)}\): el error baja de \({c(abs(w[2]-EXA),3)}\) (Euler) a \({c(abs(r[2]-EXA),3)}\) (RK2).")
# 3 RK4
y0 = 1; h = 0.5; k1 = y0; k2 = y0 + h/2*k1; k3 = y0 + h/2*k2; k4 = y0 + h*k3; w4 = y0 + h/6*(k1+2*k2+2*k3+k4)
ex("Runge-Kutta 4", "UD4", r"Un paso de RK4 con \(h=0{,}5\) para \(y'=y\), \(y(0)=1\). Compara con \(e^{0{,}5}\).",
   rf"\(k_1=1\); \(k_2={c(k2)}\); \(k_3={c(k3)}\); \(k_4={c(k4)}\); \(w_1=1+\tfrac{{0{{,}}5}}6\,(k_1+2k_2+2k_3+k_4)={c(w4,7)}\). \(e^{{0{{,}}5}}={c(np.exp(.5),7)}\): el error es \({c(abs(np.exp(.5)-w4),5)}\) con un solo paso.")
# 4 AB2
h = 0.1; a0 = 1; a1 = 0.9; a2 = a1 + h/2*(3*(-a1)-(-a0))
ex("Adams-Bashforth 2", "UD4", r"Para \(y'=-y\) con \(h=0{,}1\), \(w_0=1\) y \(w_1=0{,}9\), calcula \(w_2\) con Adams-Bashforth de dos pasos.",
   rf"\(w_2=w_1+\tfrac h2\,(3f_1-f_0)=0{{,}}9+0{{,}}05\,(3(-0{{,}}9)-(-1))={c(a2,3)}\). La exacta es \({c(np.exp(-0.2),4)}\).")
# 5 estabilidad
ex("Paso máximo", "UD4", r"¿Qué \(h\) máximo mantiene estable a Euler en \(y'=-50y\)? ¿Y si usas \(h=0{,}05\)?",
   r"Hace falta \(|1-50h|\lt1\), luego \(h\lt2/50=0{,}04\). Con \(h=0{,}05\) el factor es \(1-2{,}5=-1{,}5\): \(|{-1{,}5}|\gt1\), la solución numérica oscila y diverge.")
# 6 FOPDT
ex("Escalón de primer orden", "UD2", r"Un escalón \(\Delta u=3\) lleva la salida de 2 a 8. Se lee \(t_{28}=2{,}5\) s y \(t_{63}=5{,}5\) s. Halla \(K\), \(\tau\) y \(T\).",
   r"\(K=\Delta y/\Delta u=6/3=2\); \(\tau=1{,}5\,(5{,}5-2{,}5)=4{,}5\) s; \(T=5{,}5-4{,}5=1\) s.")
# 7 segundo orden
M, K, B = 2, 50, 8; wn = np.sqrt(K/M); xi = B/(2*np.sqrt(K*M)); mp = np.exp(-np.pi*xi/np.sqrt(1-xi**2))
ex("Segundo orden", "UD1", r"\(2\ddot x+8\dot x+50x=F\). Halla \(\omega_n\) y \(\xi\) y di si oscila.",
   rf"\(\omega_n=\sqrt{{K/M}}={c(wn,1)}\) rad/s; \(\xi=\dfrac{{B}}{{2\sqrt{{KM}}}}={c(xi,1)}\lt1\): oscila (subamortiguado). La sobreoscilación es \(e^{{-\pi\xi/\sqrt{{1-\xi^2}}}}={c(mp*100,1)}\,\%\).")
# 8 motor
R, Ki, Kb, I, Bm = 2, 0.1, 0.1, 0.01, 0.002; den = Bm*R + Ki*Kb
ex("Motor de continua", "UD1", r"Motor con \(R=2\ \Omega\), \(K_i=K_b=0{,}1\), \(I=0{,}01\), \(B=0{,}002\) (inductancia despreciable). Halla \(K\) y \(\tau\) de \(\Omega/V\).",
   rf"\(K=\dfrac{{K_i}}{{BR+K_iK_b}}=\dfrac{{0{{,}}1}}{{0{{,}}004+0{{,}}01}}={c(Ki/den,2)}\) rad/s/V; \(\tau=\dfrac{{IR}}{{BR+K_iK_b}}=\dfrac{{0{{,}}02}}{{0{{,}}014}}={c(I*R/den,2)}\) s.")
# 9 tanque
S, Q0, h0 = 0.5, 0.004, 0.16
ex("Tanque linealizado", "UD1", r"Tanque de sección \(S=0{,}5\ \mathrm m^2\) con salida \(Q=k\sqrt h\), en equilibrio con \(h_0=0{,}16\) m y \(Q_0=0{,}004\ \mathrm{m^3/s}\). Halla la constante de tiempo del modelo linealizado.",
   rf"\(\tau=\dfrac{{2Sh_0}}{{Q_0}}=\dfrac{{2\cdot0{{,}}5\cdot0{{,}}16}}{{0{{,}}004}}={c(2*S*h0/Q0,0)}\) s.")
# 10 ARX
ex("Predicción ARX", "UD2", r"Modelo ARX \(y(k)=0{,}7\,y(k-1)+0{,}4\,u(k-1)\). Con \(y(k-1)=2\) y \(u(k-1)=1\), ¿cuánto vale \(\hat y(k)\)?",
   r"\(\hat y=0{,}7\cdot2+0{,}4\cdot1=1{,}8\). Si fuera OE, en lugar de \(y(k-1)\) medido se usaría la predicción \(\hat y(k-1)\).")
# 11 LS
u = np.array([1, 2, 3, 4]); yy = np.array([2.1, 3.9, 6.2, 7.8])
ex("Mínimos cuadrados", "UD2", r"Ajusta \(y=a\,u\) a los datos \(u=(1,2,3,4)\), \(y=(2{,}1;\ 3{,}9;\ 6{,}2;\ 7{,}8)\).",
   rf"\(\hat a=\dfrac{{\sum uy}}{{\sum u^2}}=\dfrac{{{c(u@yy,1)}}}{{{u@u}}}={c((u@yy)/(u@u),2)}\).")
# 12 estadísticos
e = np.array([0.2, -0.1, 0.3, -0.2, 0.1, 0.0]); n = len(e); m = e.mean(); s1 = np.sqrt(((e-m)**2).sum()/(n-1))
ex("Media y desviación", "UD5", r"Error: \(e=(0{,}2;\,-0{,}1;\,0{,}3;\,-0{,}2;\,0{,}1;\,0)\). Calcula la media, la desviación típica (con \(N-1\)) y la fracción de muestras con \(|e-\bar e|\le\sigma\).",
   rf"\(\bar e={c(m,3)}\); \(\sigma={c(s1,4)}\); dentro de una desviación hay \({int(np.sum(np.abs(e-m)<=s1))}\) de \({n}\), es decir \({c(np.mean(np.abs(e-m)<=s1)*100,0)}\,\%\). Con \(1/N\) sale \(\sigma={c(np.sqrt(((e-m)**2).mean()),4)}\) y el mismo recuento.")
# 13 autocorrelación
R_ = [(e[:n-r]*e[r:]).sum()/(n-r) for r in range(3)]
ex("Autocorrelación", "UD5", r"Con el mismo error, calcula \(\hat R(0)\), \(\hat R(1)\) y \(\hat R(2)\) con \(\hat R(r)=\frac1{N-r}\sum e(k)e(k+r)\).",
   rf"\(\hat R(0)={c(R_[0],4)}\) (valor medio cuadrático); \(\hat R(1)={c(R_[1],4)}\); \(\hat R(2)={c(R_[2],4)}\). Con solo seis datos no se puede decir que sea ruido blanco.")
# 14 RC
ex("Circuito RC", "UD1", r"Circuito RC en serie con \(R=10\ \mathrm{k\Omega}\), \(C=100\ \mu\mathrm F\), salida en el condensador. Función de transferencia y constante de tiempo.",
   r"\(\dfrac{V_o}{V_i}=\dfrac1{RCs+1}\) con \(\tau=RC=10^4\cdot10^{-4}=1\) s.")
# 15 RLC
L, Rr, C = 0.1, 20, 1e-3
ex("Circuito RLC", "UD1", r"RLC en serie con \(L=0{,}1\) H, \(R=20\ \Omega\), \(C=1\) mF, salida en el condensador. Halla \(\omega_n\) y \(\xi\).",
   rf"\(\dfrac{{V_o}}{{V}}=\dfrac1{{LCs^2+RCs+1}}\): \(\omega_n=\dfrac1{{\sqrt{{LC}}}}={c(1/np.sqrt(L*C),0)}\) rad/s; \(\xi=\dfrac R2\sqrt{{C/L}}={c(Rr/2*np.sqrt(C/L),1)}\): amortiguamiento crítico.")
# 16 inversor
ex("Amplificador operacional", "UD1", r"Inversor con \(R_f=100\ \mathrm{k\Omega}\) y \(R_i=10\ \mathrm{k\Omega}\). ¿Ganancia?",
   r"\(V_o/V_i=-Z_f/Z_i=-100/10=-10\).")

head = '''<header>
  <div class="kicker">Practicar · ejercicios cortos</div>
  <h1>Ejercicios complementarios</h1>
  <p class="lead">Dieciséis ejercicios cortos, de un solo cálculo, para practicar lo básico de cada unidad. Todas las soluciones se han calculado con código.</p>
  <div class="tags"><span class="tag">16 ejercicios</span><span class="tag">con solución</span></div>
  <p class="notice">Guía no oficial de la UPCT. Ejercicios propios, no del examen. Resuélvelos en papel antes de abrir cada solución.</p>
</header>
<section class="sec" id="lista">
  <h2><span class="dot"></span>Ejercicios por unidad</h2>
'''
body = head
for i, (tema, ud, enun, sol) in enumerate(EX, 1):
    body += f'  <details class="sol"><summary>{i} · {tema} <span class="pill">{ud}</span> — {enun}</summary>\n    <p>{sol}</p></details>\n'
body += "</section>\n"
Path(__file__).parent.joinpath("src", "complementarios.body.html").write_text(body, encoding="utf-8")
print(len(EX), "ejercicios")
