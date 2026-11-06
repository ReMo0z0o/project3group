# Pentagon Papers — le modèle révisé, pas à pas

Ce document explique comment l’arbre a été refait à partir de ton ébauche, comment chaque gain a été construit, tous les calculs de l’induction à rebours, et les réponses à chaque consigne de l’énoncé. Tous les nombres sont ceux de l’application (`src/model.js`) et sont vérifiés par `tests/model.test.cjs`.

Convention : les gains sont toujours écrits dans l’ordre **(Times ; Post ; Nixon)**. « Nixon » désigne l’administration.

---

## 1. L’arbre : celui de ton ébauche

```
x0 Times
├─ Publier → x1 Nixon
│   ├─ Poursuivre → x2 Post
│   │   ├─ Publier → x3 Nixon
│   │   │   ├─ Poursuivre    → O1  Procès du Post + tribunaux
│   │   │   └─ Laisser faire → O2  Le Post publie, pas de procès (tout sort)
│   │   └─ Ne pas publier → O3  Times censuré, Post muet
│   └─ Laisser faire → O4  Tout sort, sans procès
└─ Ne pas publier → x4 Post
    ├─ Publier → x5 Nixon
    │   ├─ Poursuivre    → O5  Procès du Post seul + juge local
    │   └─ Laisser faire → O6  Le Post publie seul
    └─ Ne pas publier → O7  Rien ne sort
```

Six nœuds de décision, sept feuilles. **Seuls les trois joueurs ont des nœuds.**

**Ce qui vient de ton ébauche et qui est juste :**

1. **L’ordre Times → Nixon → Post → Nixon**, la chronologie de juin 1971.
2. **La branche « le Times ne publie pas → le Post peut publier ».** Ellsberg avait déjà proposé l’étude à des sénateurs (dont J. William Fulbright) avant de la confier au Times : si le Times refusait, il aurait cherché un autre journal. Sans cette branche, « ne pas publier » terminait le jeu avec (0 ; 0 ; 0), comme si le secret tenait forcément sans le Times.
3. **Le Post décide à deux nœuds et Nixon à trois** : le Post a 2 × 2 = 4 stratégies, Nixon 2 × 2 × 2 = 8, le Times 2, soit 64 profils de stratégies (distinction action / stratégie du cours).
4. **Les juges ne sont pas des joueurs.** Un joueur choisit une action pour maximiser son propre gain. Les juges n’ont ni gains ni choix stratégique : ils n’ont donc **pas de nœud**. Leurs verdicts modifient seulement les gains du Times, du Post et de Nixon. C’est le sens de ton annotation « + tribunaux ».

**Ce que j’ai précisé :**

| Point | Précision | Raison |
|---|---|---|
| « + tribunaux » | Les feuilles avec procès portent des **gains espérés** qui intègrent les verdicts : un juge local refuse la censure avec la probabilité `q`, la Cour suprême donne raison aux journaux avec la probabilité `p` | L’énoncé demande l’effet de ces probabilités. Sans elles, impossible de calculer un gain ou un seuil. |
| Poursuivre le Times ≠ le censurer à coup sûr | Le juge local peut refuser la censure (`q` = 30 %) : ce verdict est intégré aux feuilles O1, O2, O3 | Le juge Gurfein a suspendu le Times le 15 juin, mais le 19 juin il a refusé l’injonction demandée par le gouvernement. |
| Les deux « Tout sort » | Le second devient « Le Post publie, pas de procès » (O2) | Le Times y a été poursuivi et paie ses frais : (90 ; 84 ; −210) contre (100 ; 0 ; −200). |
| Que vaut pour le Times la branche où il se tait ? | S’il renonce et que le Post publie, le Times perd `R_T` (scoop laissé au rival) | Sinon la nouvelle branche ne pourrait jamais changer sa décision. |

**Hypothèse sur les tribunaux** : la Cour suprême n’est saisie en urgence que si **deux journaux** sont poursuivis (affaires jointes, comme en 1971 : arrêt 17 jours après le premier article). Sans second journal, la censure ordonnée par le juge local tient. La Cour suprême n’intervient donc que dans O1.

## 2. Les gains

### 2.1 Cinq règles, identiques partout

C’est ce que l’énoncé appelle des gains « cohérents entre les (sous-)jeux » :

1. **Publier rapporte.** Un journal qui a publié reçoit `B` si tout finit par sortir, `θB` si sa censure est maintenue.
2. **Un procès coûte.** Un journal poursuivi paie ses frais totaux `c` ; Nixon paie `k` par procès.
3. **Une censure maintenue punit.** Le journal censuré subit en plus la sanction `S`.
4. **La fuite fait mal.** Nixon perd `D` si tout sort, `θD` si une censure est maintenue, 0 si rien ne sort.
5. **Être doublé coûte.** Si le Times renonce et que le Post publie, le Times perd `R_T` si tout sort, `θR_T` si le Post est censuré.

### 2.2 Les valeurs et leur justification

On fixe l’enjeu le plus lourd, le dommage de Nixon si tout sort, à 200 points d’utilité, et on situe les autres valeurs par rapport à lui.

| Paramètre | Valeur | Justification |
|---|---|---|
| `D` (Nixon) | 200 | Quatre administrations prises en défaut et un précédent qui exposerait tous les secrets futurs. Sert d’étalon. |
| `B_T` (Times) | 100 | Le scoop de la décennie (prix Pulitzer 1972) et la mission d’informer. |
| `B_W` (Post) | 120 | Pour le Post, publier c’est entrer dans la cour des grands : le gain relatif est plus fort. |
| `θ` | 0,3 | Trois articles du Times étaient parus avant la suspension. Même part retenue pour le Post. |
| `c_T`, `c_W` | 10, 15 | Frais d’avocats et procédures d’urgence ; un peu plus pour le Post, en pleine entrée en bourse. |
| `S_T` | 50 | Poursuites possibles contre les journalistes et la direction ; le Times est une institution solide. |
| `S_W` | 180 | La sanction la plus lourde : poursuites pénales, entrée en bourse du 15 juin menacée, licences de télévision (environ 100 millions de dollars). 1,5 × `B_W`. |
| `R_T` | 50 | Laisser son grand rival publier l’enquête qu’on a refusée : la moitié du scoop perdue. |
| `k_T`, `k_W` | 10, 20 | Coût total d’un procès pour Nixon, surtout en image de censeur ; poursuivre un second journal ressemble à une campagne contre la presse. |
| `q` | 0,3 | Probabilité qu’un juge local refuse la censure. Gurfein a suspendu le Times : une suspension provisoire s’obtient facilement en matière de sécurité nationale. |
| `p` | 0,65 | Probabilité que la Cour suprême donne raison aux journaux : jurisprudence hostile à la censure préalable (Near v. Minnesota, 1931), mais Cour divisée (6 voix contre 3). |

### 2.3 Étape 1 : les situations finales (après le verdict des juges)

| Situation finale | Times | Post | Nixon |
|---|---|---|---|
| Le juge local refuse de censurer le Times | B_T − c_T = **90** | **0** | −D − k_T = **−210** |
| Cour suprême : victoire des journaux | B_T − c_T = **90** | B_W − c_W = **105** | −D − k_T − k_W = **−230** |
| Cour suprême : censure confirmée + sanctions | θB_T − c_T − S_T = 30 − 10 − 50 = **−30** | θB_W − c_W − S_W = 36 − 15 − 180 = **−159** | −θD − k_T − k_W = **−90** |
| Times censuré, le Post publie sans procès | **90** | B_W = **120** | −D − k_T = **−210** |
| Times censuré, le Post se tait | θB_T − c_T − S_T = **−30** | **0** | −θD − k_T = **−70** |
| Le Times publie, aucun procès | B_T = **100** | **0** | −D = **−200** |
| Le juge refuse de censurer le Post seul | −R_T = **−50** | B_W − c_W = **105** | −D − k_W = **−220** |
| Le Post seul est censuré + sanctions | −θR_T = **−15** | θB_W − c_W − S_W = **−159** | −θD − k_W = **−80** |
| Le Post publie seul, aucun procès | −R_T = **−50** | B_W = **120** | −D = **−200** |
| Personne ne publie | **0** | **0** | **0** |

### 2.4 Étape 2 : les gains des sept feuilles (les juges intégrés)

Chaque feuille avec procès vaut la moyenne des situations possibles, pondérée par la probabilité de chaque verdict.

| Feuille | Calcul | Gains (Times ; Post ; Nixon) |
|---|---|---|
| O1 Procès du Post + tribunaux | 0,3 × (90 ; 0 ; −210) + 0,7 × 0,65 × (90 ; 105 ; −230) + 0,7 × 0,35 × (−30 ; −159 ; −90) | **(60,6 ; 8,82 ; −189,7)** |
| O2 Le Post publie, pas de procès | 0,3 × (90 ; 0 ; −210) + 0,7 × (90 ; 120 ; −210) | **(90 ; 84 ; −210)** |
| O3 Times censuré, Post muet | 0,3 × (90 ; 0 ; −210) + 0,7 × (−30 ; 0 ; −70) | **(6 ; 0 ; −112)** |
| O4 Tout sort, sans procès | pas de juge | **(100 ; 0 ; −200)** |
| O5 Procès du Post seul + juge local | 0,3 × (−50 ; 105 ; −220) + 0,7 × (−15 ; −159 ; −80) | **(−25,5 ; −79,8 ; −122)** |
| O6 Le Post publie seul | pas de juge | **(−50 ; 120 ; −200)** |
| O7 Rien ne sort | pas de juge | **(0 ; 0 ; 0)** |

Les 30 % de O2 et O3 correspondent au cas où le juge local refuse finalement de censurer le Times : le choix du Post ne change alors rien. Il faut le dire à l’oral.

## 3. L’induction à rebours

On traite chaque nœud après toutes ses suites. À chaque nœud, le joueur compare **sa** composante et on fait remonter le triplet entier.

1. **x3, Nixon face au Post.** Poursuivre (O1) −189,7 > laisser faire (O2) −210 ⇒ **il poursuit**. Condition générale : `(1 − p)(1 − θ)D > k_W` ⟺ `p < 1 − k_W / ((1 − θ)D)` ≈ **85,7 %**. Ici 0,35 × 0,7 × 200 = 49 > 20 : la menace est **crédible**.
2. **x2, le Post en relais.** Publier 8,82 > ne pas publier 0 ⇒ **il publie**, de justesse. Condition : `p(B_W − c_W) + (1 − p)(θB_W − c_W − S_W) ≥ 0` ⟺ `p ≥ (c_W + S_W − θB_W) / ((1 − θ)B_W + S_W)` = 159/264 ≈ **60,2 %**. (8,82 = 0,7 × 12,6 : dans 30 % des cas, le juge a refusé de censurer le Times et le choix du Post ne compte pas.)
3. **x1, Nixon face au Times.** Poursuivre −189,7 > laisser faire −200 ⇒ **il poursuit**. Condition : `k_T + (1 − q)k_W < (1 − q)(1 − p)(1 − θ)D` ⟺ 10 + 0,7 × 20 = **24 < 34,3**. Le premier procès ne vaut que parce que Nixon est prêt à poursuivre aussi le Post.
4. **x5, Nixon face au Post seul.** Poursuivre (O5) −122 > laisser faire (O6) −200 ⇒ **il poursuivrait**. Condition : `(1 − q)(1 − θ)D > k_W` ⟺ 98 > 20.
5. **x4, le Post seul.** Publier −79,8 < ne pas publier 0 ⇒ **il se tairait**. Il publierait seul seulement si `q ≥ 60,2 %` : sans second journal, pas de Cour suprême, il n’a que le juge local (30 % de chances).
6. **x0, le Times.** Publier 60,6 > ne pas publier 0 (la suite serait O7) ⇒ **il publie**.

## 4. L’ENPS et le résultat

**ENPS (unique) :**

- **Times** : publier.
- **Post** : (publier en relais ; se taire si le Times renonce).
- **Nixon** : (poursuivre le Times ; poursuivre le Post ; poursuivre le Post seul).

Gains espérés : **(60,6 ; 8,82 ; −189,7)**.

**Chemin d’équilibre :** le Times publie → Nixon poursuit → le Post publie → Nixon poursuit → **O1, procès du Post + tribunaux**. Les juges tranchent ensuite : juge local favorable au Times **30 %**, victoire des journaux à la Cour suprême **45,5 %** (l’issue de 1971), censure confirmée et sanctions **24,5 %**.

**Ce que la branche « le Times se tait » apporte :** seul, le Post n’aurait pas publié (−79,8). Sans le Times, rien ne serait sorti.

## 5. Réponses à l’énoncé

### 5.1 Joueurs et ordre

Trois joueurs : Times, Post, Nixon. Ordre : x0 Times → x1 Nixon → x2 Post → x3 Nixon ; si le Times renonce : x4 Post → x5 Nixon. Information parfaite. Les juges ne sont pas des joueurs (ni gains ni choix) : leurs verdicts (`q`, `p`) entrent dans les gains des feuilles. Ellsberg déclenche le jeu par un coup fixé.

### 5.2 Résultats potentiels

- Pas de publication : O7.
- Pas d’action en justice : O4, O6.
- Action contre le New York Times uniquement : O3, O2.
- Action contre le Washington Post également : O1.
- Action contre le Post seul (si le Times renonce) : O5.

### 5.3 Impact du coût total des procédures et des probabilités

**Les journaux publient** si la probabilité que la justice leur donne finalement raison atteint leur seuil `τ = (c + S − θB) / ((1 − θ)B + S)` :

- Post en relais : `p ≥ 60,2 %` ; Post seul : `q ≥ 60,2 %` ;
- Times : `τ_T` = 30/120 = **25 %**, appliqué à `q + (1 − q)p` = 75,5 % s’il anticipe le relais du Post, à `q` = 30 % sinon ;
- si la menace de procès n’est pas crédible, sans condition.

**L’administration attaque** le Post en relais si `p < 85,7 %`, le Post seul si `q < 85,7 %`, le Times si `q < 1 − k_T / ((1 − p)(1 − θ)D − k_W)` ≈ **65,5 %** (avec p = 65 %) quand le Post prendrait le relais, `q < 92,9 %` si le Post se tairait, jamais si le Post publierait sans être poursuivi.

**Coût total :** deux procès si `k_T + (1 − q)k_W < (1 − q)(1 − p)(1 − θ)D` (24 < 34,3) et `k_W < (1 − p)(1 − θ)D` (20 < 49).

**Carte (q, p)** : rien ne sort si `q < 25 %` et `p < 60,2 %` ; procès du Times seulement si `25 % ≤ q < 92,9 %` et `p < 60,2 %` ; deux procès si `60,2 % ≤ p < 78,6 %` et `q < 1 − 10 / (140(1 − p) − 20)` ; aucun procès ailleurs (menace non crédible dès que `p ≥ 85,7 %`).

### 5.4 Valeurs pour lesquelles les documents ne sont pas publiés

1. **Le Post prend peur** (`p` = 50 %, `S_W` = 250 ou `c_W` > 27,6) : en relais, il perdrait en moyenne −27 (ou −11,9). Il se tait, Nixon poursuit le Times : feuille **O3**, la censure tient 70 % du temps.
2. **Le Times renonce** (`c_T` = 80, ou `S_T` > 297) : publier lui rapporterait −9,4. Seul, le Post perdrait 79,8 : **O7, rien ne sort**. Le Post aurait pourtant pris le relais (12,6 > 0) : c’est l’absence du Times qui garde le secret.
3. **Des tribunaux hostiles** (`q` = 20 %, `p` = 50 %) : pas de relais ; le Times n’a que 20 % de chances, sous son seuil de 25 % : **O7**.
4. **Même en 1971**, dans la feuille O1, le secret avait 24,5 % de chances de tenir : c’est le verdict défavorable des juges, pas un choix.
5. **Menace non crédible** (`p` = 50 %, `k_W` = 80) : poursuivre le Post rapporterait −220 à Nixon contre −210 en laissant faire. Si le Post y croyait, il se tairait et la censure tiendrait 7 fois sur 10 : c’est un équilibre de Nash, mais pas un ENPS. L’ENPS prédit que tout sort sans procès (O4).

### 5.5 Importance des coûts

- **Le coût du second procès commande le premier** : `k_W` < 34,7 : deux procès ; entre 34,7 et 49 : aucun (0,7 × (49 − `k_W`) < 10) ; au-delà de 49 : aucun, menace non crédible. `k_T` ≥ 20,3 : aucun procès.
- **Le Post est le maillon faible** : frais > 27,6 ou sanction > 216 ⇒ il se tait. Le Times résiste jusqu’à 70,6 de frais ou 297 de sanction ; au-delà, rien ne sort.
- **Le rôle de `R_T`** (`q` = 65 %, `p` = 50 %, `c_T` = 30, `S_T` = 150) : publier rapporte −7 au Times, se taire −37,75 car le Post publierait seul. Le Times publie à perte. Avec `R_T` = 0, il laisserait le Post publier seul.

### 5.6 Gains cohérents et ENPS

Voir les sections 2 et 4. Sous-jeu du Post en relais (x2) : le Post publie, Nixon le poursuit. Sous-jeu « le Times se tait » (x4) : le Post se tait, O7. Le jeu complet rationalise 1971 : le Times publie car ses chances (75,5 %) dépassent son seuil (25 %) ; Nixon attaque car la censure peut tenir jusqu’au bout (24,5 %) et les procès coûtent moins que le dommage évité ; le Post publie car ses chances à la Cour suprême (65 %) dépassent de peu son seuil (60,2 %).

## 6. Liens avec le cours

Références tirées des diapositives citées dans l’application (Decerf, ECGEB366). Je n’ai pas pu ouvrir le site du cours depuis mon environnement : vérifie les numéros de diapositives.

- **Forme étendue** (S6, 8–9 et 14) : nœud initial en haut, un joueur par nœud, une action par branche, gains dans un ordre fixe sous chaque feuille.
- **Joueurs** : seuls ceux qui choisissent et ont des gains. Les juges n’en sont pas ; leur incertitude est traitée par des gains espérés.
- **Information parfaite** (S6, 7 et 36–39) : chaque ensemble d’information contient un seul nœud.
- **Action et stratégie** (S6, 14–18) : 2, 4 et 8 stratégies, 64 profils. L’ENPS précise ce que le Post ferait en x4, jamais atteint en 1971.
- **Sous-jeux** (S6, 10–13) : un par nœud de décision, 6 au total dont le jeu entier.
- **Induction à rebours et réduction de l’arbre** (S6, 21–24) : section 3.
- **Nash et ENPS, menace non crédible, jeu de l’entrée** (S6, 3–6) : le Post joue l’entrant (publier = entrer), Nixon la firme en place (poursuivre = guerre). Sur les 64 profils, 4 équilibres de Nash dans le jeu de référence (même issue, différents hors du chemin, en x4 et x5) et un seul ENPS ; avec `p` = 50 % et `k_W` = 80, 12 équilibres de Nash, dont certains gardent le secret grâce à une menace non crédible.
- **Jeux simultanés** (S5) et **jeux répétés** (S8) : extensions possibles, non modélisées.

## 7. Limites

- La Cour suprême n’est saisie que si deux journaux sont poursuivis. Si elle tranchait aussi l’affaire d’un journal seul, le Post oserait publier seul (40,3 > 0) ; le chemin d’équilibre de 1971 ne changerait pas.
- Croyances communes : tous les joueurs partagent `q` et `p`.
- Les verdicts sont résumés en un tirage par tribunal ; les allers-retours réels (suspension, refus d’injonction, appel) sont simplifiés.
- Une même part `θ` pour les deux journaux, une même valeur `B_W` pour le Post seul ou en relais.
- Les gains sont des hypothèses : le laboratoire de l’application montre quelles conclusions résistent quand on les change.
