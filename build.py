#!/usr/bin/env python3
"""Build the offline, standalone edition: one index.html with styles, scripts, fonts and art embedded."""
from pathlib import Path
import base64

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src'


def read(name):
    return (SRC / name).read_text()


# The animated story opens the dossier as its own chapter.
presentation = (
    '<section class="piece" id="video" data-toc="Le récit animé"><div class="piece-head"><div class="eyebrow">Prologue · Les faits</div>'
    '<h2>Une histoire qui ne devait<br>pas être publiée.</h2></div><div class="prose"><p>De la photocopieuse d’Ellsberg à la Cour suprême : '
    'les cinq moments qui ont fait basculer l’affaire. Lancez le récit ou parcourez les séquences à votre rythme.</p></div>'
    + read('presentation.html')
    + '<div class="note"><strong>Du récit au modèle.</strong> Les décisions historiques sont les faits à expliquer. Le jeu séquentiel qui suit '
    'utilise des gains hypothétiques pour montrer comment ces décisions peuvent être rationnelles.</div></section>'
)
sections = read('sections.html').replace('{{PRESENTATION}}', presentation).replace('{{SIMULATEUR}}', read('simulator.html'))
shell = read('shell.html').replace('{{HERO_ART}}', read('hero-art.html')).replace('{{SECTIONS}}', sections)

fonts = []
for filename, family, weight, style in [('newsreader', 'Newsreader', '400 600', 'normal'), ('newsreader-italic', 'Newsreader', '400 600', 'italic'),
                                         ('dm-sans', 'DM Sans', '400 700', 'normal'), ('plex-mono', 'IBM Plex Mono', '400', 'normal')]:
    data = base64.b64encode((ROOT / 'assets' / (filename + '.woff')).read_bytes()).decode()
    fonts.append(f"@font-face{{font-family:'{family}';font-style:{style};font-weight:{weight};font-display:swap;src:url(data:font/woff;base64,{data}) format('woff')}}")
fonts.append("@font-face{font-family:'IBM Plex Sans';src:local('DM Sans');font-weight:400 700}")

dossier = read('dossier.css')
# Temml renders the LaTeX equations as native MathML, offline (MIT licence, assets/temml-LICENSE.txt).
temml_font = base64.b64encode((ROOT / 'assets' / 'Temml.woff2').read_bytes()).decode()
temml_css = (ROOT / 'assets' / 'temml-local.css').read_text().replace("url('Temml.woff2')", f"url(data:font/woff2;base64,{temml_font})")
temml_js = (ROOT / 'assets' / 'temml.min.js').read_text()
styles = '\n'.join(read(name) for name in ['premium.css', 'extras.css', 'course-ui.css', 'decision-tree.css', 'simulator.css'])
# Model first, then the tree drawing and the interface that use it.
script = '\n'.join(read(name) for name in ['tools.js', 'model.js', 'decision-tree.js', 'app.js', 'simulator.js'])
early_theme = "try{document.documentElement.dataset.theme=localStorage.getItem('pp-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}"
favicon = ("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Crect width=%2764%27 height=%2764%27 rx=%2732%27 "
           "fill=%27%23912f2c%27/%3E%3Ctext x=%2715%27 y=%2748%27 font-family=%27Georgia%27 font-size=%2750%27 fill=%27%23f4f1e9%27%3EP%3C/text%3E%3C/svg%3E")
page = (
    '<!doctype html>\n<html lang="fr" data-theme="light"><head>\n'
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#f4f1e9">'
    '<meta name="description" content="Pentagon Papers : un dossier interactif sur la presse, le pouvoir et la théorie des jeux. Explorez le jeu séquentiel, ses équilibres et un laboratoire de scénarios.">'
    '<title>Pentagon Papers — Une affaire de décisions</title>\n'
    f'<link rel="icon" href="{favicon}">\n'
    f'<script>{early_theme}</script>\n'
    '<style>' + ''.join(fonts) + '</style>\n'
    '<style>\n' + dossier + '</style>\n'
    '<style>' + temml_css + '\n' + styles + '</style>\n'
    '</head><body>\n' + shell + '\n'
    '<script>' + temml_js + '</script>\n'
    '<script>\n' + script + '\n</script>\n'
    '<script>' + read('presentation.js') + '</script>\n'
    '<script>' + read('premium.js') + '</script>\n'
    '</body></html>\n'
)
# SVG drawings use the same embedded sans font as the rest of the interface.
page = page.replace('font-family="IBM Plex Sans, sans-serif"', 'font-family="DM Sans, sans-serif"')
(ROOT / 'index.html').write_text(page)
print(f'Built index.html: {len(page.encode()):,} bytes; all fonts, art and scripts embedded.')

# A standalone simulator: the same chapter, model and tree drawing, without the rest of the dossier.
sim_script = '\n'.join(read(name) for name in ['tools.js', 'model.js', 'decision-tree.js', 'simulator.js'])
sim_theme = ("try{const t=localStorage.getItem('pp-theme');document.documentElement.dataset.theme=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}"
             "catch{document.documentElement.dataset.theme='light'}")
sim_toggle = ("(()=>{const b=document.getElementById('sim-theme');const set=d=>{document.documentElement.dataset.theme=d?'dark':'light';"
              "b.textContent=d?'Ambiance papier':'Ambiance nuit';b.setAttribute('aria-pressed',String(d));try{localStorage.setItem('pp-theme',d?'dark':'light')}catch{}};"
              "set(document.documentElement.dataset.theme==='dark');b.addEventListener('click',()=>set(document.documentElement.dataset.theme!=='dark'))})();")
sim_page = (
    '<!doctype html>\n<html lang="fr" data-theme="light"><head>\n'
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
    '<meta name="description" content="Simulateur du jeu des Pentagon Papers : choisissez les gains, les coûts et les probabilités des tribunaux, suivez le chemin de l’arbre et l’intervalle du scénario de 1971.">'
    '<title>Pentagon Papers — Simulateur</title>\n'
    f'<link rel="icon" href="{favicon}">\n'
    f'<script>{sim_theme}</script>\n'
    '<style>' + ''.join(fonts) + '</style>\n'
    '<style>\n' + dossier + '</style>\n'
    '<style>' + styles + '\n'
    'body{background:var(--bg)}.sim-page{max-width:1180px;margin:0 auto;padding:22px 20px 60px}'
    '.sim-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}'
    '.sim-top .eyebrow{color:var(--muted)}.sim-page section.piece{padding-top:18px}.sim-foot{margin-top:28px;color:var(--muted)}</style>\n'
    '</head><body>\n<main class="sim-page">\n'
    '<div class="sim-top"><span class="eyebrow">Pentagon Papers · simulateur autonome</span>'
    '<button type="button" class="btn sm ghost" id="sim-theme" aria-pressed="false">Ambiance nuit</button></div>\n'
    + read('simulator.html') +
    '<p class="small ui sim-foot">Version autonome du chapitre « Le simulateur » de l’application (groupe 5–6, ECGEB366). '
    'Elle fonctionne hors ligne ; vos valeurs restent dans ce navigateur.</p>\n'
    '</main>\n<script>\n' + sim_script + '\n</script>\n<script>' + sim_toggle + '</script>\n</body></html>\n'
)
sim_page = sim_page.replace('font-family="IBM Plex Sans, sans-serif"', 'font-family="DM Sans, sans-serif"')
(ROOT / 'simulateur.html').write_text(sim_page)
print(f'Built simulateur.html: {len(sim_page.encode()):,} bytes; standalone simulator.')
