#!/usr/bin/env python3
"""Monta el sitio estático a partir de src/*.body.html.

Genera:
  site/      sitio completo (documentos con doctype), listo para GitHub Pages
  artifact/  variante para publicar como artefacto (la portada sin envoltorio)
Uso: python3 -I build_site.py
"""
import re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HUB_URL = "https://helionacon-ui.github.io/GIEIA-UPCT/"
SITE_NAME = "Modelado y Simulación"
PAGES = [
    ("index.html", "Inicio", "Modelado y Simulación de Sistemas"),
    ("tema-1.html", "Tema 1 · Modelado de sistemas", "Tema 1 Modelado de sistemas"),
    ("identificacion.html", "UD 2 · Identificación", "Identificación de sistemas"),
    ("problemas.html", "Problemas", "Problemas de modelado e identificación"),
    ("metodos-numericos.html", "UD 4 · Métodos numéricos", "Métodos numéricos para simular"),
    ("error.html", "Predicción y análisis del error", "Predicción y análisis del error"),
    ("examenes.html", "Qué se pregunta en el examen", "Qué se pregunta en el examen"),
    ("practicas.html", "Prácticas", "Prácticas de modelado y simulación"),
]
SOON = ["Formulario", "Glosario"]

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
    items = []
    for fn, label, _ in PAGES:
        cur = ' aria-current="page"' if fn == current else ""
        items.append(f'<li><a href="{fn}"{cur}>{label}</a></li>')
    toc = "".join(f'<a href="#{i}">{t}</a>' for i, t in toc_for(body))
    soon = "".join(f'<li><span class="soon">{s}</span></li>' for s in SOON)
    return (f'<nav class="side" id="side" aria-label="Índice"><h4>Guía</h4><ul>{"".join(items)}</ul>'
            f'<h4>En esta página</h4><div class="toc">{toc}</div><h4>Próximamente</h4><ul>{soon}</ul></nav>')


DEFS = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
        '<marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="s-head"/></marker>'
        '<marker id="aha" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="s-head-a"/></marker>'
        '</defs></svg>')


def inline_svgs(body):
    return re.sub(r"\{\{svg:(\w+)\}\}", lambda m: (ROOT / "src" / "svg" / f"{m.group(1)}.svg").read_text(encoding="utf-8"), body)


def shell_body(current, body):
    return (f'{DEFS}<div class="top"><div class="top-in"><button class="icon-btn menu-btn" id="menu-btn" aria-controls="side" aria-expanded="false" aria-label="Abrir índice">☰</button>'
            f'<a class="hub" href="{HUB_URL}">← <span class="full">Hub </span>GIEIA-UPCT</a>'
            f'<div class="brand">{SITE_NAME} <span>· guía no oficial</span></div>'
            f'<button class="icon-btn" id="theme-btn" type="button" aria-label="Cambiar tema">☾</button></div></div>'
            f'<div class="layout">{sidebar(current, body)}<main>{body}'
            f'<footer>Guía no oficial de la UPCT. Hecha por y para estudiantes: no sustituye a la guía docente ni al criterio del profesorado.</footer></main></div>'
            f'<button class="totop" id="totop" type="button" aria-label="Volver arriba">↑</button>')


def full_doc(title, content, assets_prefix=""):
    return ('<!doctype html><html lang="es"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            f'<title>{title}</title>{FONTS}<link rel="stylesheet" href="{assets_prefix}assets/style.css">{THEME_INIT}{MATHJAX}</head>'
            f'<body>{content}<script src="{assets_prefix}assets/app.js"></script></body></html>')


def fragment(title, content):
    return (f'<title>{title}</title><meta name="claude:viewport-fit-sides" content="cover">{FONTS}'
            f'<link rel="stylesheet" href="assets/style.css">{THEME_INIT}{MATHJAX}{content}<script src="assets/app.js"></script>')


def main():
    for out in ("site", "artifact"):
        d = ROOT / out
        if d.exists():
            shutil.rmtree(d)
        (d / "assets").mkdir(parents=True)
        for f in (ROOT / "assets").iterdir():
            shutil.copy(f, d / "assets" / f.name)
    for fn, _, title in PAGES:
        body = inline_svgs((ROOT / "src" / fn.replace(".html", ".body.html")).read_text(encoding="utf-8"))
        content = shell_body(fn, body)
        (ROOT / "site" / fn).write_text(full_doc(title, content), encoding="utf-8")
        art = fragment(title, content) if fn == "index.html" else full_doc(title, content)
        (ROOT / "artifact" / fn).write_text(art, encoding="utf-8")
    for out in ("site",):
        (ROOT / out / ".nojekyll").write_text("")
    print("ok:", [p[0] for p in PAGES])


if __name__ == "__main__":
    main()
