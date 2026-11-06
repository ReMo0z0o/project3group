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
sections = read('sections.html').replace('{{PRESENTATION}}', presentation)
shell = read('shell.html').replace('{{HERO_ART}}', read('hero-art.html')).replace('{{SECTIONS}}', sections)

fonts = []
for filename, family, weight, style in [('newsreader', 'Newsreader', '400 600', 'normal'), ('newsreader-italic', 'Newsreader', '400 600', 'italic'),
                                         ('dm-sans', 'DM Sans', '400 700', 'normal'), ('plex-mono', 'IBM Plex Mono', '400', 'normal')]:
    data = base64.b64encode((ROOT / 'assets' / (filename + '.woff')).read_bytes()).decode()
    fonts.append(f"@font-face{{font-family:'{family}';font-style:{style};font-weight:{weight};font-display:swap;src:url(data:font/woff;base64,{data}) format('woff')}}")
fonts.append("@font-face{font-family:'IBM Plex Sans';src:local('DM Sans');font-weight:400 700}")

dossier = read('dossier.css')
styles = '\n'.join(read(name) for name in ['premium.css', 'extras.css', 'course-ui.css', 'decision-tree.css'])
# Model first, then the tree drawing and the interface that use it.
script = '\n'.join(read(name) for name in ['model.js', 'decision-tree.js', 'app.js'])
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
    '<style>' + styles + '</style>\n'
    '</head><body>\n' + shell + '\n'
    '<script>\n' + script + '\n</script>\n'
    '<script>' + read('presentation.js') + '</script>\n'
    '<script>' + read('premium.js') + '</script>\n'
    '</body></html>\n'
)
# SVG drawings use the same embedded sans font as the rest of the interface.
page = page.replace('font-family="IBM Plex Sans, sans-serif"', 'font-family="DM Sans, sans-serif"')
(ROOT / 'index.html').write_text(page)
print(f'Built index.html: {len(page.encode()):,} bytes; all fonts, art and scripts embedded.')
