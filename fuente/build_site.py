#!/usr/bin/env python3
"""Monta el sitio estático a partir de src/*.body.html.

Genera:
  site/      sitio completo (documentos con doctype), listo para GitHub Pages
  artifact/  variante para publicar como artefacto (la portada sin envoltorio)
Uso: python3 -I build_site.py
"""
import json, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HUB_URL = "https://helionacon-ui.github.io/GIEIA-UPCT/"
SITE_NAME = "Modelado y Simulación"
# (archivo, etiqueta del menú, grupo, título del documento)
PAGES = [
    ("index.html", "Portada", "Empezar", "Modelado y Simulación de Sistemas · Guía no oficial de la UPCT"),
    ("empezar.html", "Cómo es el examen", "Empezar", "Cómo es el examen y cómo estudiar · Modelado y Simulación"),
    ("tema-1-2.html", "T1–2 Modelado de sistemas", "Unidades", "T1–2 Modelado de sistemas · Modelado y Simulación"),
    ("tema-3-5.html", "T3–5 Identificación", "Unidades", "T3–5 Identificación de sistemas · Modelado y Simulación"),
    ("tema-6-8.html", "T6–8 Simulador, Simulink y Matlab", "Unidades", "T6–8 Diseñar y programar el simulador · Modelado y Simulación"),
    ("tema-9-11.html", "T9–11 Métodos numéricos", "Unidades", "T9–11 Métodos numéricos para simular · Modelado y Simulación"),
    ("tema-12-13.html", "T12–13 Predicción y error", "Unidades", "T12–13 Predicción y análisis del error · Modelado y Simulación"),
    ("practicas.html", "Prácticas del curso", "Prácticas", "Prácticas de modelado y simulación · Modelado y Simulación"),
    ("problemas.html", "Problemas resueltos", "Practicar", "Problemas de modelado e identificación · Modelado y Simulación"),
    ("examenes.html", "Qué se pregunta en el examen", "Practicar", "Qué se pregunta en el examen · Modelado y Simulación"),
    ("autoevaluacion.html", "Autoevaluación", "Practicar", "Autoevaluación · Modelado y Simulación"),
    ("formulario.html", "Formulario por unidad", "Repasar", "Formulario por unidad · Modelado y Simulación"),
    ("glosario.html", "Glosario", "Repasar", "Glosario · Modelado y Simulación"),
    ("plan.html", "Plan de estudio", "Repasar", "Plan de estudio · Modelado y Simulación"),
]
SUBS = {  # entradas del menú que apuntan a un apartado
    "index.html": [("#cero", "Empieza aquí desde cero")],
    "empezar.html": [("#prioridades", "Prioridades"), ("#progreso", "Tu progreso")],
}
KICK = {"index.html": "Portada"}

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800'
         '&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap">')
MATHJAX = ('<script>window.MathJax={tex:{inlineMath:[["\\\\(","\\\\)"]],displayMath:[["\\\\[","\\\\]"]]},svg:{fontCache:"global"}};</script>'
           '<script async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js"></script>')
THEME_INIT = ('<script>try{var t=localStorage.getItem("msg-theme");if(t==="light"||t==="dark")'
              'document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>')


def toc_for(body):
    out = []
    for m in re.finditer(r'<section class="sec[^"]*" id="([^"]+)">\s*<h2>(?:<span class="dot"></span>)?(.*?)</h2>', body, re.S):
        out.append((m.group(1), re.sub(r"<[^>]+>", "", m.group(2)).strip()))
    return out


def sidebar(current, body):
    parts = []
    last = None
    for fn, label, grp, _ in PAGES:
        if grp != last:
            parts.append(f'<div class="grp">{grp}</div>')
            last = grp
        cur = ' aria-current="page" class="cur"' if fn == current else ""
        parts.append(f'<a href="{fn}"{cur}>{label}</a>')
        for anchor, sub in SUBS.get(fn, []):
            parts.append(f'<a class="sub" href="{fn}{anchor}">{sub}</a>')
    parts.append(f'<div class="grp">Todo junto</div><a href="guia-completa.html"{" aria-current=page class=cur" if current == "guia-completa.html" else ""}>Guía completa en una página</a>')
    toc = "".join(f'<a href="#{i}">{t}</a>' for i, t in toc_for(body))
    return (f'<nav class="side" id="side" aria-label="Índice"><div class="pg">{"".join(parts)}</div>'
            f'<h4>En esta página</h4><div class="toc">{toc}</div></nav>')


def pages_grid():
    cards = "".join(f'<a href="{fn}"><small>{grp}</small>{label}</a>' for fn, label, grp, _ in PAGES if fn != "index.html")
    cards += '<a href="guia-completa.html"><small>Todo junto</small>Guía completa en una sola página</a>'
    return f'<div class="pages">{cards}</div>'


def pager(current):
    names = [p[0] for p in PAGES]
    i = names.index(current)
    prev = f'<a href="{PAGES[i-1][0]}"><small>← Anterior</small>{PAGES[i-1][1]}</a>' if i > 0 else "<span></span>"
    nxt = f'<a class="nx" href="{PAGES[i+1][0]}"><small>Siguiente →</small>{PAGES[i+1][1]}</a>' if i < len(PAGES) - 1 else ""
    return f'<nav class="pager" aria-label="Páginas">{prev}{nxt}</nav>'


SEARCH = ('<div class="srch-card gs"><label class="srch-lab" for="gsrch">Buscar en toda la guía</label>'
          '<input type="search" id="gsrch" placeholder="Por ejemplo: Euler, ARX, linealización, rigidez…" autocomplete="off" spellcheck="false">'
          '<div id="gsrch-out" class="gs-out" hidden></div></div>')


DEFS = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
        '<marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="s-head"/></marker>'
        '<marker id="aha" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="s-head-a"/></marker>'
        '</defs></svg>')


def inline_svgs(body):
    return re.sub(r"\{\{svg:([\w-]+)\}\}", lambda m: (ROOT / "src" / "svg" / f"{m.group(1)}.svg").read_text(encoding="utf-8"), body)


def load(fn):
    body = (ROOT / "src" / fn.replace(".html", ".body.html")).read_text(encoding="utf-8")
    body = body.replace("{{herramientas}}", (ROOT / "src" / "herramientas.part.html").read_text(encoding="utf-8"))
    body = body.replace("{{pages-grid}}", pages_grid())
    return inline_svgs(body)


def split_hero(body):
    m = re.match(r'\s*(<header class="hero".*?</header>)', body, re.S)
    if m:
        return m.group(1), body[m.end():]
    return "", body


def shell_body(current, body, pg=True):
    hero, rest = split_hero(body)
    if current != "index.html" and pg:
        rest = SEARCH + rest
    foot = pager(current) if pg else ""
    return (f'{DEFS}<div class="top"><div class="top-in"><button class="icon-btn menu-btn" id="menu-btn" aria-controls="side" aria-expanded="false" aria-label="Abrir índice">☰</button>'
            f'<a class="hub" href="{HUB_URL}">← <span class="full">Todas las guías </span>GIEyA</a>'
            f'<div class="brand">{SITE_NAME} <span>· guía no oficial</span></div>'
            f'<button class="icon-btn" id="theme-btn" type="button" aria-label="Cambiar tema">☾</button></div></div>'
            f'{hero}<div class="layout">{sidebar(current, rest)}<main id="top">{rest}{foot}'
            f'<footer>Guía no oficial de la UPCT (Modelado y Simulación de Sistemas). Hecha por y para estudiantes: no sustituye a la guía docente ni al criterio del profesorado.</footer></main></div>'
            f'<button class="totop" id="totop" type="button" aria-label="Volver arriba">↑</button>')


def full_doc(title, content, assets_prefix=""):
    return ('<!doctype html><html lang="es"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            f'<title>{title}</title>{FONTS}<link rel="stylesheet" href="{assets_prefix}assets/style.css">{THEME_INIT}{MATHJAX}</head>'
            f'<body>{content}<script src="{assets_prefix}assets/app.js"></script><script src="{assets_prefix}assets/sims.js"></script></body></html>')


def fragment(title, content):
    return (f'<title>{title}</title><meta name="claude:viewport-fit-sides" content="cover">{FONTS}'
            f'<link rel="stylesheet" href="assets/style.css">{THEME_INIT}{MATHJAX}{content}<script src="assets/app.js"></script><script src="assets/sims.js"></script>')


def strip(t):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t)).strip()


def search_index(bodies):
    out = []
    for fn, body in bodies.items():
        sec_id, sec_title = "", ""
        for m in re.finditer(r'<section class="sec[^"]*" id="([^"]+)">|<h2>(.*?)</h2>|<h3[^>]*>(.*?)</h3>|<h4>(.*?)</h4>|<summary>(.*?)</summary>|<div class="qh">(.*?)</div>\s*<p>(.*?)</p>|<b>([^<]{4,48})</b>', body, re.S):
            if m.group(1):
                sec_id = m.group(1)
            elif m.group(2) is not None:
                sec_title = strip(m.group(2))
                out.append([sec_title, f"{fn}#{sec_id}" if sec_id else fn, sec_title])
            else:
                txt = strip(m.group(8) if m.group(8) else (next(g for g in m.groups()[2:6] if g) if m.group(7) is None else m.group(6) + " " + m.group(7)))
                if txt:
                    out.append([txt[:160], f"{fn}#{sec_id}" if sec_id else fn, sec_title or dict((p[0], p[1]) for p in PAGES).get(fn, "")])
    seen, uniq = set(), []
    for e in out:
        k = (e[0], e[1])
        if k not in seen:
            seen.add(k)
            uniq.append(e)
    return uniq


def main():
    bodies = {fn: load(fn) for fn, *_ in PAGES}
    idx = search_index(bodies)
    gc = '<header><div class="kicker">Todo junto</div><h1>Guía completa en una sola página</h1><p class="lead">Las mismas páginas de la guía una detrás de otra, para buscar con Ctrl+F o imprimir.</p></header>'
    gc += '<nav class="gc-toc"><b>Contenido</b> ' + " · ".join(f'<a href="#pg-{fn[:-5]}">{lab}</a>' for fn, lab, *_ in PAGES if fn != "index.html") + "</nav>"
    for fn, lab, *_ in PAGES:
        if fn == "index.html":
            continue
        gc += f'<div class="gc-page" id="pg-{fn[:-5]}">{bodies[fn]}</div>'
    gc = re.sub(r'<div class="srch-card.*?</div></div>', "", gc, flags=re.S)
    for out in ("site", "artifact"):
        d = ROOT / out
        if d.exists():
            shutil.rmtree(d)
        (d / "assets").mkdir(parents=True)
        for f in (ROOT / "assets").iterdir():
            shutil.copy(f, d / "assets" / f.name)
        (d / "assets" / "search-index.js").write_text("window.MSG_INDEX=" + json.dumps(idx, ensure_ascii=False) + ";", encoding="utf-8")
    for fn, _, _, title in PAGES:
        content = shell_body(fn, bodies[fn])
        (ROOT / "site" / fn).write_text(full_doc(title, content), encoding="utf-8")
        art = fragment(title, content) if fn == "index.html" else full_doc(title, content)
        (ROOT / "artifact" / fn).write_text(art, encoding="utf-8")
    gtitle = "Guía completa · Modelado y Simulación"
    for out in ("site", "artifact"):
        (ROOT / out / "guia-completa.html").write_text(full_doc(gtitle, shell_body("guia-completa.html", gc, pg=False)), encoding="utf-8")
    (ROOT / "site" / ".nojekyll").write_text("")
    print("ok:", len(PAGES) + 1, "páginas;", len(idx), "entradas de búsqueda")


if __name__ == "__main__":
    main()
