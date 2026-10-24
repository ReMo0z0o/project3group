# Pentagon Papers — Une affaire de décisions

Refonte de l’application fournie pour le travail de théorie des jeux du groupe 5–6.

**Ouvrir `index.html` dans un navigateur récent.** Ce fichier contient toute l’application : styles, scripts, polices et illustrations. Il fonctionne hors ligne ; seules les références bibliographiques ouvrent des sites externes. Aucun compte, service distant ou gestionnaire de paquets n’est nécessaire.

## Dans cette édition

- Direction artistique de dossier d’archives : papier ivoire, rouge profond, typographie éditoriale et illustrations SVG originales.
- Navigation dans 17 chapitres, suivi de lecture et affichage adapté aux petits écrans.
- Récit animé en cinq scènes, lecture/pause et navigation manuelle. Il remplace l’emplacement vidéo vide de l’original.
- Arbres de décision agrandissables, résolution pas à pas, cartes des équilibres et mini-expérience sur les menaces crédibles.
- Présentation pédagogique alignée sur les PDF du cours ECGEB366 : arbre descendant, construction en six étapes, lecture des sept issues et sous-jeu du Post. L’induction à rebours remplace visuellement les suites résolues par leurs gains et encadre la composante du joueur qui décide.
- Laboratoire de 12 paramètres, huit scénarios, résultats instantanés, mémorisation locale et export JSON.
- Quiz de sept questions avec correction et remise à zéro, lexique et sources.
- Ambiances papier/nuit, clavier, préférences de mouvement réduit et impression de l’intégralité du dossier.

Les objectifs du document Word sont conservés : joueurs et ordre des décisions, sept issues, coûts des procédures, seuils de probabilité, situations de non-publication et équilibre parfait en sous-jeux. Les probabilités et gains restent un **calibrage illustratif**. Aux frontières d’indifférence, l’application retient la publication et l’absence de poursuite ; plusieurs ENPS peuvent alors exister.

## Déployer sur Vercel

L’application générée est prête pour un hébergement statique. La configuration `vercel.json` désactive l’installation et la compilation : Vercel sert directement `index.html`.

Après envoi du dépôt sur GitHub, dans Vercel, choisir **Add New → Project → Import Git Repository**, puis `ReMo0z0o/project3group`. Si le dépôt n’apparaît pas, ouvrir **Adjust GitHub App Permissions** et autoriser ce dépôt pour l’application GitHub de Vercel, avec le compte GitHub qui possède le dépôt. Conserver le dossier racine du projet et le préréglage **Other**, puis déployer.

Après une modification des sources, lancer `python3 build.py` et inclure le fichier `index.html` reconstruit dans le commit envoyé à GitHub.

## Modifier et reconstruire

Le HTML livré est généré, mais ne nécessite aucune compilation pour être utilisé.

```sh
python3 build.py
```

Sources : `src/shell.html` pour l’interface, `src/premium.css` et `src/extras.css` pour les styles, `src/premium.js` pour la navigation et les interactions ajoutées, `src/presentation.*` pour le récit, `src/hero-art.html` pour l’illustration d’accueil. `src/original.html` conserve le document HTML reçu. `build.py` réemploie son contenu et son modèle, applique les corrections de calcul et de formulation, puis embarque les ressources dans `index.html`.

`src/decision-tree.*` dessine la forme étendue ; `src/tree-guide.html` et `src/course-ui.*` gèrent sa construction et sa lecture. `src/course-notes.html` et `src/course-resolution.html` expliquent les concepts à partir des PDF S5, S6 et S8 fournis. Les références de diapositives apparaissent dans le dossier ; les PDF eux-mêmes ne sont pas inclus dans l’application.

Pour un serveur de développement facultatif :

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

## Vérifications

```sh
node --test tests/model.test.cjs
node tests/browser.test.cjs
```

Le premier test utilise seulement Node.js et vérifie le modèle extrait du fichier livré, les scénarios, les égalités et plus de 1 400 configurations. Le second nécessite Chromium et Playwright : il cherche un module `playwright` ou `playwright-core` installé, ou le module présent dans l’environnement Codex. Les chemins peuvent être fournis par `PLAYWRIGHT_MODULE` et `CHROMIUM_PATH`.

Les contrôles navigateur couvrent 72 combinaisons de chapitre/largeur (320, 390, 768 et 1440 pixels), les paramètres, l’export, la persistance, le quiz, le récit animé, le thème, le clavier, l’impression et l’absence de dépendances réseau. Le serveur de test temporaire se ferme automatiquement.

## Ressources

Les illustrations SVG sont créées pour cette refonte. Les polices Newsreader, DM Sans et IBM Plex Mono sont issues du dépôt officiel `google/fonts`, sous licence SIL Open Font License ; leurs licences sont conservées dans `assets/`. Les fontes embarquées sont des sous-ensembles adaptés au français. Les sources historiques figurent dans le chapitre Sources de l’application.

L’original n’incluait aucun fichier vidéo. La séquence intégrée est une animation SVG native, sans vidéo externe ni bande sonore.
