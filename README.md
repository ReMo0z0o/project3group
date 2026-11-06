# Pentagon Papers — Une affaire de décisions

Application du travail de théorie des jeux du groupe 5–6 (cours ECGEB366, jeux séquentiels).

**Ouvrir `index.html` dans un navigateur récent.** Ce fichier contient toute l’application : styles, scripts, polices et illustrations. Il fonctionne hors ligne ; seules les références bibliographiques ouvrent des sites externes.

## Le modèle

Jeu séquentiel à information parfaite avec coups de la Nature. Gains toujours dans l’ordre **Times, Post, Nixon**.

- **Neuf nœuds non terminaux** : six décisions (Times x0 ; Nixon x1, x4, x7 ; Post x3, x6) et trois coups de la Nature (juge local x2 et x8, probabilité `q` de refuser la censure ; Cour suprême x5, probabilité `p` de donner raison aux journaux).
- **Dix issues** (O1 à O10, de gauche à droite sous l’arbre). La branche « le Times ne publie pas » permet au Post de publier seul.
- **Cinq règles de gains**, identiques dans tous les sous-jeux : un journal reçoit `B` si tout sort et `θB` si sa censure est maintenue ; un journal poursuivi paie `c` ; une censure maintenue coûte `S` ; Nixon perd `D` si tout sort, `θD` sinon, et paie `k` par procès ; si le Times renonce et que le Post publie, le Times perd `R_T` au prorata de ce qui sort.
- **Hypothèse sur les tribunaux** : la Cour suprême n’est saisie en urgence que si deux journaux sont poursuivis (affaires jointes). Sinon, la censure du juge local tient.
- **Calibrage de référence** : q = 0,3 ; p = 0,65 ; θ = 0,3 ; B_T = 100 ; c_T = 10 ; S_T = 50 ; R_T = 50 ; B_W = 120 ; c_W = 15 ; S_W = 180 ; D = 200 ; k_T = 10 ; k_W = 20.
- **ENPS** : Times publie ; Post (publie en relais ; se tait seul) ; Nixon poursuit à ses trois nœuds. Gains espérés (60,6 ; 8,82 ; −189,7). Issues : O5 30 %, O2 (1971) 45,5 %, O1 24,5 %.

Les probabilités et gains sont un **calibrage illustratif**. Aux frontières d’indifférence, l’application retient la publication et l’absence de poursuite.

Le raisonnement complet (choix de l’arbre, construction des gains, calculs, réponses à l’énoncé, liens avec le cours) est détaillé dans [`docs/modele-revise.md`](docs/modele-revise.md).

## Modifier et reconstruire

```sh
python3 build.py
```

Sources :

- `src/model.js` : paramètres, arbre (`NODES`), gains des issues, résolution par induction à rebours (`solve`) et seuils ;
- `src/decision-tree.js` : dessin de la forme étendue (construction, sous-jeux, réduction, équilibre) ;
- `src/app.js` : chapitres interactifs (gains, résolution pas à pas, carte, coûts, laboratoire, réponses, quiz) ;
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

Le premier test utilise seulement Node.js. Il exécute le modèle embarqué dans `index.html` : gains des dix issues, solution de référence, onze scénarios du laboratoire, égalités, plus de 1 000 configurations, et recensement des 64 profils de stratégies (4 équilibres de Nash dans le jeu de référence, dont un seul ENPS ; 12 lorsque la menace contre le Post n’est pas crédible).

Le second nécessite Chromium et Playwright (`PLAYWRIGHT_MODULE` et `CHROMIUM_PATH` permettent d’indiquer leurs chemins). Il couvre les 18 chapitres à 320, 390, 768 et 1440 pixels, la construction de l’arbre en neuf étapes, les sous-jeux, l’induction à rebours, le laboratoire, l’export, le quiz, le thème et l’impression.

## Déployer sur Vercel

La configuration `vercel.json` désactive l’installation et la compilation : Vercel sert directement `index.html`. Dans Vercel, **Add New → Project → Import Git Repository**, puis `ReMo0z0o/project3group`, préréglage **Other**.

## Ressources

Les illustrations SVG sont originales. Les polices Newsreader, DM Sans et IBM Plex Mono viennent du dépôt officiel `google/fonts`, sous licence SIL Open Font License ; leurs licences sont dans `assets/`.
