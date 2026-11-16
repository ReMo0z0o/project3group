# Pentagon Papers — le modèle, pas à pas

Ce document explique l’arbre, la façon de calculer chaque gain, l’induction à rebours et les réponses aux cinq consignes de l’énoncé. Tous les nombres sont ceux de l’application (`src/model.js`) et sont vérifiés par `tests/model.test.cjs`.

Convention : les gains sont toujours écrits dans l’ordre **(Times ; Post ; Nixon)**. « Nixon » désigne l’administration.

---

## 1. L’arbre

```
x0 Times
├─ Publier → x1 Nixon
│   ├─ Poursuivre → x2 Post
│   │   ├─ Publier → x3 Nixon
│   │   │   ├─ Poursuivre    → O1  Procès du Post + tribunaux
│   │   │   └─ Laisser faire → O2  Le Post publie, pas de procès
│   │   └─ Ne pas publier → O3  Times censuré, Post muet
│   └─ Laisser faire → O4  Tout sort, sans procès
└─ Ne pas publier → x4 Post
    ├─ Publier → x5 Nixon
    │   ├─ Poursuivre    → O5  Procès du Post seul + juge local
    │   └─ Laisser faire → O6  Le Post publie seul
    └─ Ne pas publier → O7  Rien ne sort
```

Six nœuds de décision, sept feuilles. **Seuls les trois joueurs ont des nœuds.**

- **Les juges ne sont pas des joueurs** : ils n’ont ni gains ni choix stratégique. Seuls leurs verdicts ont une probabilité, et cette probabilité agit sur les gains des trois joueurs.
  - 1re cour (le juge local) : elle refuse la censure avec la probabilité `q` = 0,3.
  - 2e cour (la Cour suprême) : elle donne raison aux journaux avec la probabilité `p` = 0,65. Elle n’intervient que si la 1re cour a censuré et si les deux journaux sont poursuivis (affaires jointes, comme en 1971).
- **Stratégies** : le Times a 2 stratégies, le Post 2 × 2 = 4, Nixon 2 × 2 × 2 = 8, soit 64 profils.

## 2. Les gains : la méthode en cinq étapes

Un gain est un nombre qui dit ce qu’une issue vaut pour un joueur. Plus il est grand, plus le joueur préfère cette issue.

### Étape 1 — Les ingrédients

Les valeurs sont en points d’utilité, sans unité : seul compte le rapport entre elles. On fixe le plus gros enjeu, le dommage de Nixon si tout sort, à 200.

| Symbole | Valeur | Qui | Signification et justification |
|---|---|---|---|
| `B_T`, `B_W` | 100, 120 | Times, Post | Ce que rapporte une publication complète : scoop, prestige, mission d’informer. Plus fort pour le Post, qui entre dans la cour des grands. |
| `c_T`, `c_W` | 10, 15 | Times, Post | Frais de procès s’il est poursuivi ; un peu plus pour le Post, en pleine entrée en bourse. |
| `S_T`, `S_W` | 50, 180 | Times, Post | Sanction si la censure est maintenue. Pour le Post : poursuites pénales, entrée en bourse du 15 juin, licences de télévision (1,5 × `B_W`). |
| `D` | 200 | Nixon | Dommage si tout sort : crédibilité de l’exécutif, précédent pour les fuites futures. Sert d’étalon. |
| `k_T`, `k_W` | 10, 20 | Nixon | Coût d’un procès : frais et image de censeur ; plus lourd contre un second journal. |
| `θ` | 0,3 | tous | Part des documents déjà parue quand une censure tombe (trois articles). |
| `q` | 0,3 | juges | La 1re cour refuse la censure. Gurfein a suspendu le Times : une suspension provisoire s’obtient facilement. |
| `p` | 0,65 | juges | La 2e cour donne raison aux journaux. Jurisprudence hostile à la censure préalable, mais Cour divisée (6 voix contre 3). |

### Étape 2 — Une équation par joueur

La même équation sert pour toutes les issues : c’est ce qui rend les gains cohérents d’un sous-jeu à l’autre.

**Ce qui sort.** On note $\sigma$ la part des documents qui finit par être publique :

$$
\sigma=\begin{cases}1 & \text{si tout sort,}\\ \theta=0{,}3 & \text{si une censure est maintenue,}\\ 0 & \text{si rien ne sort.}\end{cases}
$$

**Un journal** (j = T pour le Times, j = W pour le Post). En mots : gain = valeur de ce qu’il a réussi à publier − ses frais s’il est poursuivi − sa sanction si sa censure est maintenue.

$$
u_{j}=\begin{cases}0 & \text{s'il ne publie pas,}\\ B_{j}\,\sigma-c_{j}\,\mathbf{1}_{\{\text{poursuivi}\}}-S_{j}\,\mathbf{1}_{\{\text{censure maintenue}\}} & \text{s'il publie.}\end{cases}
$$

Le symbole $\mathbf{1}_{\{\dots\}}$ est une case à cocher : il vaut 1 si la phrase est vraie, 0 sinon.

> **Pas de publication, pas de gain ni de perte.** Un journal qui ne publie pas n’a pas de scoop, pas de procès et pas de sanction : son gain est 0. Si le Times renonce, il a donc 0, que le Post publie ensuite ou non, et que Nixon poursuive le Post ou non. C’est son gain dans O5, O6 et O7.

**Nixon.** En mots : gain = − dommage de ce qui sort − coût de chaque procès engagé.

$$
u_{N}=-D\,\sigma-k_{T}\,\mathbf{1}_{\{\text{Times poursuivi}\}}-k_{W}\,\mathbf{1}_{\{\text{Post poursuivi}\}}
$$

**Tous les cas possibles pour un journal :**

| Cas | σ | Équation | Times | Post |
|---|---|---|---|---|
| Il ne publie pas | — | 0 | 0 | 0 |
| Il publie, personne ne le poursuit | 1 | B | 100 | 120 |
| Il publie, il est poursuivi, tout sort quand même | 1 | B − c | 100 − 10 = 90 | 120 − 15 = 105 |
| Il publie, il est poursuivi, sa censure est maintenue | θ | θB − c − S | 0,3 × 100 − 10 − 50 = −30 | 0,3 × 120 − 15 − 180 = −159 |

**Tous les cas possibles pour Nixon :**

| Ce qui sort | Procès engagés | Équation et calcul |
|---|---|---|
| Rien | aucun | 0 |
| Tout | aucun | −D = −200 |
| Tout | contre le Times | −D − k_T = −210 |
| Tout | contre le Post seul | −D − k_W = −220 |
| Tout | contre le Times et le Post | −D − k_T − k_W = −230 |
| Les premiers articles seulement | contre le Times | −θD − k_T = −0,3 × 200 − 10 = −70 |
| Les premiers articles seulement | contre le Post seul | −θD − k_W = −80 |
| Les premiers articles seulement | contre le Times et le Post | −θD − k_T − k_W = −90 |

**Vérification : ces gains respectent les objectifs.**

- Times : publier librement (100) > gagner son procès (90) > ne pas publier (0) > être censuré (−30).
- Post : publier librement (120) > gagner son procès (105) > ne pas publier (0) > être censuré (−159). C’est lui qui a le plus à perdre.
- Nixon : rien ne sort (0) > censure maintenue (−70 à −90) > tout sort (−200 à −230) ; à résultat égal, moins de procès vaut mieux.

### Étape 3 — Les feuilles sans juge : le gain est certain

| Feuille | Ce qui se passe | Times | Post | Nixon |
|---|---|---|---|---|
| O4 Tout sort, sans procès | Le Times a publié, personne n’est poursuivi, σ = 1 | B_T = **100** | n’a pas publié : **0** | −D = **−200** |
| O6 Le Post publie seul | Le Post a publié, personne n’est poursuivi, σ = 1 | n’a pas publié : **0** | B_W = **120** | −D = **−200** |
| O7 Rien ne sort | Personne n’a publié, σ = 0 | **0** | **0** | **0** |

### Étape 4 — Les feuilles avec procès : le gain espéré

Les juges ne jouent pas, mais leur verdict change les gains. Comme on ne sait pas quel verdict tombera, chaque joueur reçoit la **moyenne** de ses gains, pondérée par la probabilité de chaque verdict :

$$
\mathbb{E}[u_i]=\sum_{v}\Pr(v)\times u_i(v),\qquad i\in\{T,W,N\}
$$

Exemple simple : un billet qui rapporte 100 avec 30 % de chances et 0 sinon vaut en moyenne 0,3 × 100 + 0,7 × 0 = 30.

Trois gestes : (1) lister les verdicts et leurs probabilités, dont le total fait 100 % ; (2) calculer le gain après chaque verdict avec les équations de l’étape 2 ; (3) multiplier par les probabilités et additionner.

**O1 — Procès du Post + tribunaux** (le Times publie, Nixon le poursuit, le Post publie, Nixon le poursuit aussi)

| Verdict | Probabilité | Times | Post | Nixon |
|---|---|---|---|---|
| La 1re cour refuse de censurer le Times | q = 0,30 | 90 | 0 | −210 |
| La 1re cour censure, la 2e cour donne raison aux journaux | (1 − q) × p = 0,7 × 0,65 = 0,455 | 90 | 105 | −230 |
| La 1re cour censure, la 2e cour donne raison au gouvernement | (1 − q) × (1 − p) = 0,7 × 0,35 = 0,245 | −30 | −159 | −90 |
| **Gain espéré** | 1 | **60,6** | **8,82** | **−189,7** |

- Times : 0,3 × 90 + 0,455 × 90 + 0,245 × (−30) = 27 + 40,95 − 7,35 = **60,6**
- Post : 0,3 × 0 + 0,455 × 105 + 0,245 × (−159) = 0 + 47,775 − 38,955 = **8,82**
- Nixon : 0,3 × (−210) + 0,455 × (−230) + 0,245 × (−90) = −63 − 104,65 − 22,05 = **−189,7**

Formules générales :

$$
\mathbb{E}[u_T]=q\,(B_T-c_T)+(1-q)\big[p\,(B_T-c_T)+(1-p)\,(\theta B_T-c_T-S_T)\big]
$$

$$
\mathbb{E}[u_W]=(1-q)\big[p\,(B_W-c_W)+(1-p)\,(\theta B_W-c_W-S_W)\big]
$$

$$
\mathbb{E}[u_N]=q\,(-D-k_T)+(1-q)\big[p\,(-D-k_T-k_W)+(1-p)\,(-\theta D-k_T-k_W)\big]
$$

Si la 1re cour refuse de censurer le Times, le Times publie tout lui-même : le Post n’a pas à prendre le relais et reçoit 0.

**O2 — Le Post publie, Nixon ne le poursuit pas**

| Verdict | Probabilité | Times | Post | Nixon |
|---|---|---|---|---|
| La 1re cour refuse de censurer le Times | q = 0,30 | 90 | 0 | −210 |
| La 1re cour censure le Times, le Post publie tout | 1 − q = 0,70 | 90 | 120 | −210 |
| **Gain espéré** | 1 | **90** | **84** | **−210** |

Post : 0,3 × 0 + 0,7 × 120 = 84.

**O3 — Times censuré, Post muet**

| Verdict | Probabilité | Times | Post | Nixon |
|---|---|---|---|---|
| La 1re cour refuse de censurer le Times | q = 0,30 | 90 | 0 | −210 |
| La 1re cour censure le Times et la censure tient | 1 − q = 0,70 | −30 | 0 | −70 |
| **Gain espéré** | 1 | **6** | **0** | **−112** |

Times : 0,3 × 90 + 0,7 × (−30) = 27 − 21 = 6. Nixon : 0,3 × (−210) + 0,7 × (−70) = −63 − 49 = −112.

**O5 — Procès du Post seul** (le Times n’a pas publié : il a 0 quel que soit le verdict)

| Verdict | Probabilité | Times | Post | Nixon |
|---|---|---|---|---|
| La 1re cour refuse de censurer le Post | q = 0,30 | 0 | 105 | −220 |
| La 1re cour censure le Post et la censure tient | 1 − q = 0,70 | 0 | −159 | −80 |
| **Gain espéré** | 1 | **0** | **−79,8** | **−122** |

Post : 0,3 × 105 + 0,7 × (−159) = 31,5 − 111,3 = −79,8. Nixon : 0,3 × (−220) + 0,7 × (−80) = −66 − 56 = −122.

### Étape 5 — Le tableau final

| Feuille | Juges | Times | Post | Nixon |
|---|---|---|---|---|
| O1 Procès du Post + tribunaux | 1re et 2e cours | 60,6 | 8,82 | −189,7 |
| O2 Le Post publie, pas de procès | 1re cour | 90 | 84 | −210 |
| O3 Times censuré, Post muet | 1re cour | 6 | 0 | −112 |
| O4 Tout sort, sans procès | aucun | 100 | 0 | −200 |
| O5 Procès du Post seul | 1re cour | 0 | −79,8 | −122 |
| O6 Le Post publie seul | aucun | 0 | 120 | −200 |
| O7 Rien ne sort | aucun | 0 | 0 | 0 |

## 3. L’induction à rebours

On traite chaque nœud après toutes ses suites. À chaque nœud, le joueur compare **sa** composante et on fait remonter le triplet entier.

1. **x3, Nixon face au Post.** Poursuivre (O1) −189,7 > laisser faire (O2) −210 ⇒ **il poursuit**. Condition générale : `(1 − p)(1 − θ)D > k_W` ⟺ `p < 1 − k_W / ((1 − θ)D)` ≈ **85,7 %**. Ici 0,35 × 0,7 × 200 = 49 > 20 : la menace est **crédible**.
2. **x2, le Post en relais.** Publier 8,82 > ne pas publier 0 ⇒ **il publie**, de justesse. Condition : `p(B_W − c_W) + (1 − p)(θB_W − c_W − S_W) ≥ 0` ⟺ `p ≥ (c_W + S_W − θB_W) / ((1 − θ)B_W + S_W)` = 159/264 ≈ **60,2 %**.
3. **x1, Nixon face au Times.** Poursuivre −189,7 > laisser faire −200 ⇒ **il poursuit**. Condition : `k_T + (1 − q)k_W < (1 − q)(1 − p)(1 − θ)D` ⟺ 10 + 0,7 × 20 = **24 < 34,3**. Le premier procès ne vaut que parce que Nixon est prêt à poursuivre aussi le Post.
4. **x5, Nixon face au Post seul.** Poursuivre (O5) −122 > laisser faire (O6) −200 ⇒ **il poursuivrait**. Condition : `(1 − q)(1 − θ)D > k_W` ⟺ 98 > 20.
5. **x4, le Post seul.** Publier −79,8 < ne pas publier 0 ⇒ **il se tairait**. Il publierait seul seulement si `q ≥ 60,2 %` : sans second journal, il n’a que la 1re cour (30 % de chances).
6. **x0, le Times.** Publier 60,6 > ne pas publier 0 ⇒ **il publie**. Ne pas publier lui rapporte 0 quoi que fasse ensuite le Post.

## 4. L’ENPS et le résultat

**ENPS (unique) :**

- **Times** : publier.
- **Post** : (publier en relais ; se taire si le Times renonce).
- **Nixon** : (poursuivre le Times ; poursuivre le Post ; poursuivre le Post seul).

Gains espérés : **(60,6 ; 8,82 ; −189,7)**.

**Chemin d’équilibre :** le Times publie → Nixon poursuit → le Post publie → Nixon poursuit → **O1**. Les juges tranchent ensuite : la 1re cour donne raison au Times **30 %**, la 2e cour donne raison aux journaux **45,5 %** (l’issue de 1971), censure confirmée et sanctions **24,5 %**.

**Ce que la branche « le Times ne publie pas » apporte.** Elle ne change pas le choix du Times, qui compare seulement « publier » à 0. Elle répond à une autre question : seul, le Post n’aurait pas publié (−79,8). Sans le Times, rien ne serait sorti.

## 5. Réponses aux cinq consignes

### Consigne 1 — Les joueurs et leur ordre

Trois joueurs : Times, Post, Nixon. Ordre : x0 Times → x1 Nixon → x2 Post → x3 Nixon ; si le Times renonce : x4 Post → x5 Nixon. Information parfaite. Les juges ne sont pas des joueurs : seuls leurs verdicts ont une probabilité (`q` pour la 1re cour, `p` pour la 2e), qui agit sur les gains. Ellsberg déclenche le jeu par un coup fixé.

### Consigne 2 — Les résultats possibles

- Pas de publication : O7.
- Pas d’action en justice : O4, O6.
- Action contre le New York Times uniquement : O3, O2.
- Action contre le Washington Post également : O1.
- Action contre le Post seul (si le Times renonce) : O5.

### Consigne 3 — L’effet des coûts et des probabilités

**Les journaux publient** si la probabilité que la justice leur donne finalement raison atteint leur seuil `τ = (c + S − θB) / ((1 − θ)B + S)` :

- Post en relais : `p ≥ 60,2 %` ; Post seul : `q ≥ 60,2 %` ;
- Times : `τ_T` = 30/120 = **25 %**, appliqué à `q + (1 − q)p` = 75,5 % s’il anticipe le relais du Post, à `q` = 30 % sinon ;
- si la menace de procès n’est pas crédible, sans condition.

**L’administration attaque** le Post en relais si `p < 85,7 %`, le Post seul si `q < 85,7 %`, le Times si `q < 1 − k_T / ((1 − p)(1 − θ)D − k_W)` ≈ **65,5 %** (avec p = 65 %) quand le Post prendrait le relais, `q < 92,9 %` si le Post se tairait, jamais si le Post publierait sans être poursuivi.

**Coût total :** deux procès si `k_T + (1 − q)k_W < (1 − q)(1 − p)(1 − θ)D` (24 < 34,3) et `k_W < (1 − p)(1 − θ)D` (20 < 49).

**Carte (q, p)** : rien ne sort si `q < 25 %` et `p < 60,2 %` ; procès du Times seulement si `25 % ≤ q < 92,9 %` et `p < 60,2 %` ; deux procès si `60,2 % ≤ p < 78,6 %` et `q < 1 − 10 / (140(1 − p) − 20)` ; aucun procès ailleurs (menace non crédible dès que `p ≥ 85,7 %`).

### Consigne 4 — Quand les documents ne sortent pas, et le rôle des coûts

1. **Le Post prend peur** (`p` = 50 %, `S_W` = 250 ou `c_W` > 27,6) : en relais, il perdrait en moyenne −27 (ou −11,9). Il se tait, Nixon poursuit le Times : feuille **O3**, la censure tient 70 % du temps.
2. **Le Times renonce** (`c_T` = 80, ou `S_T` > 297) : publier lui rapporterait −9,4, moins que le 0 de celui qui ne publie pas. Seul, le Post perdrait 79,8 : **O7, rien ne sort**.
3. **Des tribunaux hostiles** (`q` = 20 %, `p` = 50 %) : pas de relais ; le Times n’a que 20 % de chances, sous son seuil de 25 % : **O7**.
4. **Même en 1971**, dans la feuille O1, le secret avait 24,5 % de chances de tenir : c’est le verdict défavorable des juges, pas un choix.
5. **Menace non crédible** (`p` = 50 %, `k_W` = 80) : poursuivre le Post rapporterait −220 à Nixon contre −210 en laissant faire. Si le Post y croyait, il se tairait et la censure tiendrait 7 fois sur 10 : c’est un équilibre de Nash, mais pas un ENPS. L’ENPS prédit que tout sort sans procès (O4).

**L’importance des coûts :**

- **Le coût du second procès commande le premier** : `k_W` < 34,7 : deux procès ; entre 34,7 et 49 : aucun (0,7 × (49 − `k_W`) < 10) ; au-delà de 49 : aucun, menace non crédible. `k_T` ≥ 20,3 : aucun procès.
- **Le Post est le maillon faible** : frais > 27,6 ou sanction > 216 ⇒ il se tait. Le Times résiste jusqu’à 70,6 de frais ou 297 de sanction ; au-delà, rien ne sort.
- **Un cas où le Post publie seul** (`q` = 65 %, `p` = 50 %, `c_T` = 30, `S_T` = 150) : publier rapporterait −7 au Times, qui renonce (0). Le Post, lui, publie seul car la 1re cour lui est plutôt favorable : 0,65 × 105 + 0,35 × (−159) = 12,6 > 0.

### Consigne 5 — Des gains cohérents et les ENPS

Les gains viennent d’une seule équation par joueur (section 2), donc ils sont cohérents entre les sous-jeux, et l’ordre des préférences respecte les objectifs de chacun. L’ENPS est donné en section 4. Sous-jeu du Post en relais (x2) : le Post publie, Nixon le poursuit. Sous-jeu « le Times ne publie pas » (x4) : le Post se tait, O7. Le jeu complet rationalise 1971 : le Times publie car ses chances (75,5 %) dépassent son seuil (25 %) ; Nixon attaque car la censure peut tenir jusqu’au bout (24,5 %) et les procès coûtent moins que le dommage évité ; le Post publie car ses chances devant la 2e cour (65 %) dépassent de peu son seuil (60,2 %).

## 6. Liens avec le cours

Références tirées des diapositives citées dans l’application (Decerf, ECGEB366). Je n’ai pas pu ouvrir le site du cours depuis mon environnement : vérifie les numéros de diapositives.

- **Forme étendue** (S6, 8–9 et 14) : nœud initial en haut, un joueur par nœud, une action par branche, gains dans un ordre fixe sous chaque feuille.
- **Joueurs** (S5 ; S6, 7–9) : seuls ceux qui choisissent et ont des gains. Les juges n’en sont pas ; leur incertitude est traitée par des gains espérés (notre ajout).
- **Une feuille résume une histoire complète** (S6, 14–18) : « tout sort » ne vaut pas la même chose avec procès (O2) ou sans (O4).
- **À un nœud, chacun compare sa propre composante** (S6, 21–24).
- **Un sous-jeu garde les gains du jeu entier** (S6, 10–13) : d’où une seule équation par joueur.
- **Information parfaite** (S6, 7 et 36–39) : chaque ensemble d’information contient un seul nœud.
- **Action et stratégie** (S6, 14–18) : 2, 4 et 8 stratégies, 64 profils. L’ENPS précise ce que le Post ferait en x4, jamais atteint en 1971.
- **Induction à rebours et réduction de l’arbre** (S6, 21–24) : section 3.
- **Nash et ENPS, menace non crédible, jeu de l’entrée** (S6, 3–6) : le Post joue l’entrant (publier = entrer), Nixon la firme en place (poursuivre = guerre). Sur les 64 profils, 4 équilibres de Nash dans le jeu de référence (même issue, différents hors du chemin, en x4 et x5) et un seul ENPS ; avec `p` = 50 % et `k_W` = 80, 12 équilibres de Nash, dont certains gardent le secret grâce à une menace non crédible.
- **Jeux simultanés** (S5) et **jeux répétés** (S8) : extensions possibles, non modélisées.

## 7. Limites

- La 2e cour n’est saisie que si deux journaux sont poursuivis. Si elle tranchait aussi l’affaire d’un journal seul, le Post oserait publier seul (40,3 > 0) ; le chemin d’équilibre de 1971 ne changerait pas.
- Un journal qui ne publie pas a 0 : on ne compte pas le regret du Times si le Post publie à sa place.
- Croyances communes : tous les joueurs partagent `q` et `p`.
- Les verdicts sont résumés en un tirage par tribunal ; les allers-retours réels (suspension, refus d’injonction, appel) sont simplifiés.
- Une même part `θ` pour les deux journaux, une même valeur `B_W` pour le Post seul ou en relais.
- Les gains sont des hypothèses : le laboratoire de l’application montre quelles conclusions résistent quand on les change.
