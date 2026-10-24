#!/usr/bin/env python3
"""Build the offline, standalone edition from the original dossier and its redesign."""
from pathlib import Path
import base64
import re

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src'
original = (SRC / 'original.html').read_text()
original_style = re.search(r'<style>\s*/\* Dossier[\s\S]*?</style>', original).group()
sections = original[original.index('    <!-- VIDÉO -->'):original.index('    <footer>')]
presentation = (SRC / 'presentation.html').read_text()
presentation = '<section class="piece" id="video" data-toc="Le récit animé"><div class="piece-head"><div class="eyebrow">Prologue · Les faits</div><h2>Une histoire qui ne devait<br>pas être publiée.</h2></div><div class="prose"><p>De la photocopieuse d’Ellsberg à la Cour suprême : les cinq moments qui ont fait basculer l’affaire. Lancez le récit ou parcourez les séquences à votre rythme.</p></div>' + presentation + '<div class="note"><strong>Du récit au modèle.</strong> Les décisions historiques sont les faits à expliquer. Le jeu séquentiel qui suit utilise des gains hypothétiques pour montrer comment ces décisions peuvent être rationnelles.</div></section>'
sections = re.sub(r'    <!-- VIDÉO -->[\s\S]*?(?=    <!-- 1\. AFFAIRE -->)', lambda _: presentation, sections)
sections = re.sub(r'<button class="vid-chip"[^>]*>[\s\S]*?</button>', '', sections)
sections = sections.replace('probabilités de donner raison aux journaux', 'croyances illustratives sur une décision favorable aux journaux')
sections = sections.replace("Un juge ne cherche pas à maximiser un gain dans cette histoire : il applique le droit.", "Dans notre modèle, on ne prête pas d’objectif stratégique aux juges : leur décision est représentée comme un événement incertain.")
sections = sections.replace("Son objectif est que tout sorte, quoi qu'il lui en coûte. Son choix est donc fixé d'avance", "Pour simplifier, nous supposons que son objectif de divulgation prime : son choix est fixé d’avance")
sections = sections.replace("les autres paramètres restant ceux de 1971", "les autres paramètres restant ceux du calibrage illustratif")
sections = sections.replace("Valeurs en points d'utilité, avec les paramètres de 1971 ci-dessous.", "Valeurs en points d’utilité, avec le calibrage illustratif ci-dessous. Aucun montant monétaire réel n’est estimé.")
sections = sections.replace("les autres valeurs restant celles de 1971", "les autres valeurs restant celles du calibrage de référence")
sections = sections.replace("Le trait noir marque la valeur de 1971", "Le trait noir marque la valeur de référence")
sections = sections.replace("<strong>Même en 1971, rien n'était joué d'avance.</strong> Avec nos valeurs, avant le premier article, il y avait", "<strong>Ce que le calibrage permet d’illustrer.</strong> Dans le modèle, avant le premier article, il y a")
sections = sections.replace("Si le Post publierait :", "Si le Post publie sous une menace crédible de poursuite et si le dénominateur est positif :")
sections = sections.replace("Si le Post se tairait :", "Si le Post se tait :")
sections = sections.replace("si le gouvernement le poursuivrait ; sinon il publie toujours.", "si le gouvernement le poursuit ; sans poursuite, il publie (gain non négatif).")
sections = sections.replace("Le Times renonce si c<sub>T</sub> = 40 et q = 10 %", "Le Times renonce si c<sub>T</sub> = 40, q = 10 % et p = 50 %")
sections = sections.replace('<div class="grid2" id="concepts"></div>', (SRC / 'course-notes.html').read_text() + '<details class="course-definitions"><summary>Retrouver les huit définitions essentielles</summary><div class="grid2" id="concepts"></div></details>')
sections = sections.replace('<h2>L\'arbre du jeu et ses 7 issues</h2></div>', '<h2>Construire et lire l’arbre du jeu</h2></div>' + (SRC / 'tree-guide.html').read_text())
sections = sections.replace('Gains notés (NYT ; WP ; Gouv.). Cercles : joueurs. Losanges : la Nature (les juges). Faites défiler horizontalement sur téléphone.', 'Forme étendue adaptée des conventions du cours S6, diapositives 8–9 et 14. Gains empilés : NYT, Post, gouvernement. Losanges : ajout de la Nature pour représenter les jugements incertains. Faites défiler horizontalement si nécessaire.')
sections = sections.replace('Traits épais : choix d\'équilibre. ✕ : choix écartés. Encadrés noirs : gains espérés à chaque nœud. Pourcentages : probabilité d\'atteindre l\'issue.', 'Traits épais : actions retenues à l’équilibre. Pointillés et × : actions écartées. Cartouches : gains de continuation ou espérances aux nœuds de la Nature. Pourcentages : probabilités d’atteindre les issues depuis le début du jeu. La Nature conserve ses deux branches.')
sections = sections.replace('<div class="stepper">', (SRC / 'course-resolution.html').read_text() + '<div class="stepper">')
sections = sections.replace('<figure><div class="tree-wrap"><svg id="tree-step"', '<div class="reduction-tools"><p class="small ui" id="reduction-caption"></p><button type="button" class="btn sm ghost" id="reduction-toggle" aria-pressed="true">Voir l’arbre entier</button></div><figure><div class="tree-wrap"><svg id="tree-step"')
sections = re.sub(r'<div class="note">Avec ces valeurs, <strong>le Times publie toujours</strong>[\s\S]*?</div>', '<div class="note"><strong>Pourquoi le Times publie-t-il pour tous les couples (q, p) de cette carte ?</strong> Si le Post se tait, le Times conserve 30 − 10 = 20. Si le Post publie et sera poursuivi, il faut p ≥ 165/270 ; le Times anticipe alors au moins 120 × (165/270) − 30 ≈ 43,3 après la censure locale. Les autres continuations lui donnent aussi un gain positif. L’issue O7 reste pourtant négative (−30) : c’est l’<em>espérance</em> anticipée, pas chaque issue isolée, qui justifie de publier. Ces conclusions concernent les gains de référence.</div>', sections)
sections = sections.replace('<h2>Sources</h2></div>', '<h2>Sources</h2></div><div class="course-note"><h3>Le cours utilisé pour cette édition</h3><div class="theory-source-list"><p><strong>Benoit Decerf · ECGEB366 · S6, « B2. Jeux séquentiels ».</strong><br>Diapositives 3–6 : jeu de l’entrée et menace non crédible ; 7–13 : information, forme étendue, sous-jeux et ENPS ; 14–18 : action, stratégie et résultat ; 21–24 : réduction progressive de l’arbre ; 36–39 : ensembles d’information.</p><p><strong>S5, « Jeux simultanés ».</strong><br>Information complète et distinction des décisions simultanées (diapositive 10). Le concept de Nash fournit le point de départ, que la perfection en sous-jeux précise.</p><p><strong>S8, « B3. Jeux répétés ».</strong><br>Répétition d’un jeu entre périodes, stratégies conditionnelles à l’histoire et crédibilité des punitions (diapositives 3–9). Deux procès successifs ne suffisent pas à faire de notre modèle un jeu répété.</p></div><p class="small ui">Explications adaptées des PDF fournis. Les gains des Pentagon Papers et les coups de la Nature constituent notre application pédagogique ; ils ne sont pas des estimations issues du cours.</p><p class="course-ref"><a href="https://strategies-economiques.vercel.app/strategies/theorie/jeux-sequentiels" target="_blank" rel="noopener">Retrouver la page du cours sur les jeux séquentiels ↗</a></p></div>')

script = re.search(r'<script>([\s\S]*?)</script>', original).group(1)
script = re.sub(r'// ====================== VIDÉO[\s\S]*?(?=// ====================== FRISE)', '', script)
script = script.replace('sc[2] > O.O5[2]', 'sc[2] > O.O5[2] + 1e-9')
script = script.replace('g2v[1] > O.O4[1]', 'g2v[1] >= O.O4[1] - 1e-9')
script = script.replace('judge[2] > O.O2[2]', 'judge[2] > O.O2[2] + 1e-9')
script = script.replace('g1v[0] > O.O1[0]', 'g1v[0] >= O.O1[0] - 1e-9')
script = script.replace('1 - P.k_W / ((1 - P.th) * P.D)', '((1 - P.th) * P.D > 0 ? 1 - P.k_W / ((1 - P.th) * P.D) : 0)')
script = script.replace('(P.c_W + P.S_W) / (P.B_W + P.S_W)', '(P.B_W + P.S_W > 0 ? (P.c_W + P.S_W) / (P.B_W + P.S_W) : P.c_W === 0 ? 0 : Infinity)')
script = script.replace("const pct = (x, d = 1) => fr(x * 100, d) + ' %';", "const pct = (x, d = 1) => Number.isFinite(x) ? fr(x * 100, d) + ' %' : '—';")
script = script.replace('const esc = s =>', (SRC / 'model-helpers.js').read_text() + '\nconst esc = s =>')
# Reuse remembered settings only if all values remain inside supported UI bounds.
anchor = "// ====================== FRISE"
validation = """if (saved) {
  const bounds = {q:[0,1],p:[0,1],B_T:[0,300],c_T:[0,120],S_T:[0,300],th:[0,.95],B_W:[0,300],c_W:[0,120],S_W:[0,400],D:[0,500],k_T:[0,120],k_W:[0,120]};
  saved = Object.fromEntries(Object.entries(saved).filter(([k,v]) => bounds[k] && Number.isFinite(v) && v >= bounds[k][0] && v <= bounds[k][1]));
}

"""
script = script.replace(anchor, validation + anchor)
script = script.replace("${cred ? '&gt;' : '&lt;'}", "${Math.abs(sue-let_) < 1e-9 ? '=' : cred ? '&gt;' : '&lt;'}")
script = script.replace("const cred = sue > let_;", "const cred = sue > let_ + 1e-9;")
script = script.replace("le procès coûte plus que le dommage qu'il éviterait", "le procès coûte au moins autant que le dommage qu’il éviterait")
script = script.replace("document.getElementById('labo').scrollIntoView();", "window.Papers.navigate('labo');")
script = script.replace("${M.wPub ? '&gt;' : '≤'} 0.", "${wGain > 1e-9 ? '&gt;' : wGain < -1e-9 ? '&lt;' : '='} 0.")
script = re.sub(r'<div class="note" style="margin-top:6px">Seuils actuels[^\n]*?</div>', '<div class="note" style="margin-top:6px"><p>${thresholdText(\'post\', M)}</p><p style="margin-top:8px">${thresholdText(\'government\', M)}</p></div>', script)
script = script.replace('Il poursuit tant que <span class="m">p</span> &lt; ${pct(M.pG)}.', '${thresholdText(\'government\', M)}')
script = script.replace('Seuil de publication sous la menace : <span class="m">p</span> ≥ ${pct(M.pW)}.', '${thresholdText(\'post\', M)}')
script = script.replace("Comme personne ne le poursuivrait, publier ne lui coûte rien.", "Sans poursuite, publier rapporte B<sub>W</sub> ≥ 0. À gain nul, notre convention retient la publication.")
script = script.replace("Comme personne ne le poursuivrait", "Sans poursuite")
script = script.replace("'1971 (référence)'", "'1971 · scénario de référence'")
script = script.replace("Avec les valeurs de 1971", "Avec le calibrage illustratif")
script = script.replace("(comme en 1971)", "(scénario de référence)")
script = script.replace("Avec les tirages réels de la Nature", "Avec la succession des décisions judiciaires historiques")
script = script.replace("(censure locale, puis victoire à la Cour suprême)", "(suspension locale, puis victoire à la Cour suprême)")
script = script.replace("Avant le 13 juin, trois avenirs étaient possibles", "Dans ce calibrage, trois issues ont une probabilité positive")
script = script.replace("(probabilité 70 %)", "(70 % dans le modèle)").replace("(65 %). On arrive", "(65 % dans le modèle). On arrive")
script = script.replace("Avec 65 %, le Post passe à peine au-dessus du seuil : c'est pourquoi la décision a été si difficile.", "Le calibrage de 65 % place le Post près de son seuil : le modèle illustre une décision risquée, sans mesurer la croyance réelle des dirigeants.")
script = script.replace('et le Times si q &lt;', 'et, si le Post publie sous une menace crédible de poursuite et si le dénominateur est positif, le Times si q &lt;')
script = script.replace('c<sub>T</sub> = 40 et q = 10 %', 'c<sub>T</sub> = 40, q = 10 % et p = 50 %')
script = script.replace("// ====================== INITIALISATION", "// ====================== INITIALISATION")
script = script.replace('stroke-width="${sw}" stroke-linecap="round"', 'stroke-width="${sw}" class="${isChosen ? \'eq-edge\' : \'\'}" stroke-linecap="round"')
# The regions depend on the payoffs, not on the currently selected q/p marker.
# Cache the raster so probability sliders and keyboard movement remain smooth.
script = script.replace('  const grid = [];', "  const mapKey = JSON.stringify([Object.entries(P).filter(([k]) => k !== 'q' && k !== 'p'), ['--reg-none','--reg-nosuit','--reg-nyt','--reg-both','--ok','--ink','--ink2'].map(css), document.fonts?.status]);\n  if (cv._mapKey === mapKey && cv._mapRaster) { g.putImageData(cv._mapRaster,0,0); } else {\n  const grid = [];")
script = script.replace('  if (marker) {', '  cv._mapRaster = g.getImageData(0,0,W,W); cv._mapKey = mapKey;\n  }\n  if (marker) {')
# Replace the original horizontal chart with the course's downward extensive form.
tree_start = script.index('function drawTree(')
tree_end = script.index('// arbre principal', tree_start)
script = script[:tree_start] + (SRC / 'decision-tree.js').read_text() + '\n' + script[tree_end:]
script = re.sub(r'^const (?:Y0|LEAF|GROUP|NODES) = [^\n]*\n', '', script, flags=re.M)
script = re.sub(r'const EDGES = \[[\s\S]*?\n\];\n', '', script)
script = script.replace("let mainMode = 'sym';", "let mainMode = 'num';")
script = script.replace('const STEPS = [', 'let reduceTree = true;\nconst STEPS = [')
script = script.replace("mode: 'num', step, probs: step >= 8, hist: step >= 8", "mode: 'num', step, probs: step >= 8, hist: step >= 8, reduce: reduceTree, scope: reduceTree && step >= 1 && step <= 6 ? 'focus' : 'full'")
# Keep map tooltip inside mobile containers.
script = script.replace("Math.min(x + 14, box.clientWidth - 250)", "Math.max(0, Math.min(x + 14, box.clientWidth - 225))")
# A new input cancels the pending frame so rapid slider movements do not queue work.
script = script.replace("$('#sliders').addEventListener('input',", "let labFrame = 0;\n$('#sliders').addEventListener('input',")
script = script.replace("fmtP(k, LP[k]); renderLab(); });", "fmtP(k, LP[k]); cancelAnimationFrame(labFrame); labFrame = requestAnimationFrame(() => renderLab()); });")

shell = (SRC / 'shell.html').read_text().replace('{{HERO_ART}}', (SRC / 'hero-art.html').read_text()).replace('{{SECTIONS}}', sections)
fonts = []
for filename, family, weight, style in [('newsreader','Newsreader','400 600','normal'),('newsreader-italic','Newsreader','400 600','italic'),('dm-sans','DM Sans','400 700','normal'),('plex-mono','IBM Plex Mono','400','normal')]:
    data = base64.b64encode((ROOT / 'assets' / (filename + '.woff')).read_bytes()).decode()
    fonts.append(f"@font-face{{font-family:'{family}';font-style:{style};font-weight:{weight};font-display:swap;src:url(data:font/woff;base64,{data}) format('woff')}}")
fonts.append("@font-face{font-family:'IBM Plex Sans';src:local('DM Sans');font-weight:400 700}")
styles = '\n'.join((SRC / name).read_text() for name in ['premium.css','extras.css','course-ui.css','decision-tree.css'])
early_theme = "try{document.documentElement.dataset.theme=localStorage.getItem('pp-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}"
page = '<!doctype html>\n<html lang="fr" data-theme="light"><head>\n<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#f4f1e9"><meta name="description" content="Pentagon Papers : un dossier interactif sur la presse, le pouvoir et la théorie des jeux. Explorez le jeu séquentiel, ses équilibres et un laboratoire de scénarios."><title>Pentagon Papers — Une affaire de décisions</title>\n<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Crect width=%2764%27 height=%2764%27 rx=%2732%27 fill=%27%23912f2c%27/%3E%3Ctext x=%2715%27 y=%2748%27 font-family=%27Georgia%27 font-size=%2750%27 fill=%27%23f4f1e9%27%3EP%3C/text%3E%3C/svg%3E">\n<script>' + early_theme + '</script>\n<style>' + ''.join(fonts) + '</style>\n' + original_style + '\n<style>' + styles + '</style>\n</head><body>\n' + shell + '\n<script>\n' + script + '\n</script>\n<script>' + (SRC / 'presentation.js').read_text() + '</script>\n<script>' + (SRC / 'premium.js').read_text() + '</script>\n</body></html>\n'
# SVG trees use the same embedded sans font as the rest of the UI.
page = page.replace('<script>' + (SRC / 'premium.js').read_text(), '<script>' + (SRC / 'course-ui.js').read_text() + '</script>\n<script>' + (SRC / 'premium.js').read_text())
page = page.replace('font-family="IBM Plex Sans, sans-serif"', 'font-family="DM Sans, sans-serif"')
(ROOT / 'index.html').write_text(page)
print(f'Built index.html: {len(page.encode()):,} bytes; all fonts, art and scripts embedded.')
