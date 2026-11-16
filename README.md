# Pentagon Papers — Une affaire de décisions

Application du travail de théorie des jeux du groupe 5–6 (cours ECGEB366, jeux séquentiels).

**Ouvrir `index.html` dans un navigateur récent.** Ce fichier contient toute l’application : styles, scripts, polices et illustrations. Il fonctionne hors ligne ; seules les références bibliographiques ouvrent des sites externes.

## Le modèle

Jeu séquentiel à information parfaite entre trois joueurs. Gains toujours dans l’ordre **Times, Post, Nixon**.

- **Six nœuds de décision**, tous des joueurs : Times x0 ; Nixon x1, x3, x5 ; Post x2, x4. **Sept feuilles** (O1 à O7), celles de l’ébauche du groupe. La branche « le Times ne publie pas » permet au Post de publier seul.
- **Les juges ne sont pas des joueurs** (ni gains ni choix) : ils n’ont pas de nœud. Leurs verdicts (un juge local refuse la censure avec la probabilité `q`, la Cour suprême donne raison aux journaux avec `p`) sont intégrés dans les gains des feuilles avec procès, sous forme de gains espérés.
- **Une équation de gain par joueur**, appliquée à toutes les issues (`σ` = part des documents qui sort : 1, `θ` ou 0). Un journal qui ne publie pas a **0** ; s’il publie, il a `B·σ − c` (s’il est poursuivi) `− S` (si sa censure est maintenue). Nixon a `−D·σ − k` par procès engagé. Le Times a donc 0 dans O5, O6 et O7.
- **Hypothèse sur les tribunaux** : la Cour suprême n’est saisie en urgence que si deux journaux sont poursuivis (affaires jointes). Sinon, la censure du juge local tient.
- **Calibrage de référence** : q = 0,3 ; p = 0,65 ; θ = 0,3 ; B_T = 100 ; c_T = 10 ; S_T = 50 ; B_W = 120 ; c_W = 15 ; S_W = 180 ; D = 200 ; k_T = 10 ; k_W = 20.
- **ENPS** : Times publie ; Post (publie en relais ; se tait seul) ; Nixon poursuit à ses trois nœuds. Feuille atteinte : O1 (procès du Post + tribunaux), gains espérés (60,6 ; 8,82 ; −189,7). Verdicts ensuite : juge favorable au Times 30 %, victoire des journaux (1971) 45,5 %, censure confirmée 24,5 %.

Les probabilités et gains sont un **calibrage illustratif**. Aux frontières d’indifférence, l’application retient la publication et l’absence de poursuite.

Le raisonnement complet (choix de l’arbre, construction des gains, calculs, réponses à l’énoncé, liens avec le cours) est détaillé dans [`docs/modele-revise.md`](docs/modele-revise.md).

Le document mathématique [`docs/modele-probabilites.pdf`](docs/modele-probabilites.pdf) reprend le modèle, les équations des gains et tous les calculs en fonction des probabilités des juges `q` et `p` (seuils, carte des équilibres, probabilités des issues, cas chiffrés). Sa source est `docs/modele-probabilites.tex` : compiler deux fois avec `pdflatex` (TeX Live avec les paquets `pgfplots`, `tcolorbox` et `babel-french`).

## Modifier et reconstruire

```sh
python3 build.py
```

Sources :

- `src/model.js` : paramètres, équation des gains (`gains`), situations finales, feuilles (verdicts des juges intégrés), arbre (`NODES`), résolution par induction à rebours (`solve`) et seuils ;
- `src/decision-tree.js` : dessin de la forme étendue (construction, sous-jeux, réduction, équilibre) ;
- `src/app.js` : consignes de l’énoncé (`CONSIGNES`) et chapitres interactifs (leçon sur les gains, résolution pas à pas, carte, coûts, laboratoire, réponses, quiz) ;
- `src/sections.html` : contenu des chapitres ; `src/shell.html` : interface ; `src/hero-art.html` : illustration d’accueil ;
- `src/presentation.*` : récit animé ; `src/premium.js` : navigation et confort de lecture ;
- styles : `src/dossier.css`, `src/premium.css`, `src/extras.css`, `src/course-ui.css`, `src/decision-tree.css`.

`src/original.html` est une archive de la première version reçue ; elle n’est plus utilisée par `build.py`.

Après une modification, lancer `python3 build.py` et inclure le fichier `index.html` reconstruit dans le commit.

## Vérifications

```sh
node --test tests/model.test.cjs
node tests/browser.test.cjs
```

Le premier test utilise seulement Node.js. Il exécute le modèle embarqué dans `index.html` : gains des sept feuilles et des situations finales, règle du zéro (un journal qui ne publie pas a 0), accord entre les équations affichées et les gains calculés, solution de référence, onze scénarios du laboratoire, égalités, plus de 1 000 configurations, et recensement des 64 profils de stratégies (4 équilibres de Nash dans le jeu de référence, dont un seul ENPS ; 12 lorsque la menace contre le Post n’est pas crédible).

Le second nécessite Chromium et Playwright (`PLAYWRIGHT_MODULE` et `CHROMIUM_PATH` permettent d’indiquer leurs chemins). Il couvre les 18 chapitres à 320, 390, 768 et 1440 pixels, la construction de l’arbre en six étapes, les sous-jeux, la leçon sur les gains (curseurs q et p compris), les consignes de l’énoncé, l’induction à rebours, le laboratoire, l’export, le quiz, le thème et l’impression.

## Déployer sur Vercel

La configuration `vercel.json` désactive l’installation et la compilation : Vercel sert directement `index.html`. Dans Vercel, **Add New → Project → Import Git Repository**, puis `ReMo0z0o/project3group`, préréglage **Other**.

## Ressources

Les illustrations SVG sont originales. Les équations LaTeX sont rendues hors ligne par [Temml](https://temml.org) 0.13.5 (licence MIT, `assets/temml-LICENSE.txt`). Les polices Newsreader, DM Sans et IBM Plex Mono viennent du dépôt officiel `google/fonts`, sous licence SIL Open Font License ; leurs licences sont dans `assets/`.
