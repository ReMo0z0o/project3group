# Pentagon Papers — le modèle révisé, pas à pas

Ce document explique comment l’arbre a été refait à partir de ton ébauche, comment chaque gain a été construit, tous les calculs de l’induction à rebours, et les réponses à chaque consigne de l’énoncé. Tous les nombres sont ceux de l’application (`src/model.js`) et sont vérifiés par `tests/model.test.cjs`.

Convention : les gains sont toujours écrits dans l’ordre **(Times ; Post ; Nixon)**. « Nixon » désigne l’administration.

---

## 1. Ton ébauche : ce qui est juste et ce que j’ai gardé

Ton arbre :

```
Times
├─ Publier → Nixon
│   ├─ Poursuivre → Post
│   │   ├─ Publier → Nixon
│   │   │   ├─ Poursuivre → Procès du Post + tribunaux
│   │   │   └─ Laisser faire → Tout sort
│   │   └─ Ne pas publier → Times censuré, Post muet
│   └─ Laisser faire → Tout sort
└─ Ne pas publier → Post
    ├─ Publier → Nixon
    │   ├─ Poursuivre → Procès du Post + tribunaux
    │   └─ Laisser faire → Le Post publie seul
    └─ Ne pas publier → Rien ne sort
```

**Gardé, parce que c’est juste :**

1. **L’ordre Times → Nixon → Post → Nixon.** C’est la chronologie de juin 1971.
2. **La nouvelle branche « le Times ne publie pas → le Post peut publier ».** C’est la meilleure idée de l’ébauche. Ellsberg avait déjà proposé l’étude à des sénateurs (dont J. William Fulbright) avant de la confier au Times : si le Times refusait, il aurait cherché un autre journal. Dans l’ancien arbre en chaîne, « ne pas publier » terminait le jeu avec (0 ; 0 ; 0), ce qui revenait à supposer que le secret tenait forcément sans le Times. Ta branche permet de tester cette hypothèse.
3. **Le Post décide à deux nœuds et Nixon à trois.** Cela enrichit les stratégies (lien direct avec la distinction action/stratégie du cours) : le Post a 2 × 2 = 4 stratégies, Nixon 2 × 2 × 2 = 8, le Times 2. Il y a 64 profils de stratégies.
4. **Les feuilles « Tout sort », « Times censuré, Post muet », « Le Post publie seul », « Rien ne sort ».** Je les ai toutes gardées.
5. **L’intuition « + tribunaux ».** Un procès ne se termine pas au moment où Nixon poursuit : son issue dépend des juges.

## 2. Ce que j’ai modifié, et pourquoi

| Problème dans l’ébauche | Modification | Raison |
|---|---|---|
| « + tribunaux » est une annotation, pas un nœud | Les tribunaux deviennent des **coups de la Nature** avec des probabilités | L’énoncé demande l’effet des probabilités que « le juge local puis la Cour suprême » soient favorables. Sans nœud de hasard, impossible de calculer un gain espéré ou un seuil. |
| « Poursuivre » mène directement à « Times censuré » | Ajout d’un **juge local** (x2) après la poursuite du Times : refus de la censure avec la probabilité `q`, censure avec `1 − q` | Une poursuite ne censure que si un juge l’ordonne. Le juge Gurfein a suspendu le Times le 15 juin, mais le 19 juin il a refusé l’injonction demandée par le gouvernement. Avec `q = 0`, on retrouve exactement ton ébauche. |
| « Procès du Post + tribunaux » est une feuille | C’est un **sous-arbre** : après la censure du Times, les deux affaires sont jointes devant la **Cour suprême** (x5, probabilité `p`) ; si le Post publie seul, son procès passe devant un **juge local** (x8) | En 1971, la Cour a joint les deux affaires et tranché 17 jours après le premier article. |
| Les deux « Tout sort » ont l’air identiques | Ils ne le sont pas : dans le second, le Times a été poursuivi et paie ses frais. Je l’ai renommé « Le Post publie sans procès » | Cohérence des gains : (100 ; 0 ; −200) d’un côté, (90 ; 120 ; −210) de l’autre. |
| Que vaut pour le Times la branche où il se tait ? | Si le Times renonce et que le Post publie, le Times perd `R_T` (scoop laissé au rival) | Sans ce terme, le Times serait indifférent entre « rien ne sort » et « le Post publie à ma place » : la nouvelle branche ne pourrait jamais changer sa décision. |

**Une hypothèse à assumer** (règle des tribunaux) : la Cour suprême n’est saisie *en urgence* que si **deux journaux** sont poursuivis. Sans second journal, la procédure suit son cours ordinaire et la censure provisoire reste en place assez longtemps pour que les révélations perdent l’essentiel de leur portée. C’est pourquoi « Times censuré, Post muet » et « Post censuré » restent des feuilles, comme dans ton ébauche. La section 9 montre que le chemin d’équilibre de 1971 ne change pas si l’on retire cette hypothèse.

## 3. L’arbre retenu

Neuf nœuds non terminaux (six décisions, trois coups de la Nature) et dix issues, numérotées de gauche à droite sous l’arbre.

```
x0 Times
├─ Publier → x1 Nixon
│   ├─ Poursuivre → x2 Juge local (Nature)
│   │   ├─ Censure (1 − q) → x3 Post
│   │   │   ├─ Publier → x4 Nixon
│   │   │   │   ├─ Poursuivre → x5 Cour suprême (Nature)
│   │   │   │   │   ├─ Gouvernement (1 − p) → O1  Censure confirmée + sanctions
│   │   │   │   │   └─ Journaux (p)         → O2  Victoire des journaux (1971)
│   │   │   │   └─ Laisser faire → O3  Le Post publie sans procès
│   │   │   └─ Ne pas publier → O4  Times censuré, Post muet
│   │   └─ Refus (q) → O5  Le juge donne raison au Times
│   └─ Laisser faire → O6  Tout sort, sans procès
└─ Ne pas publier → x6 Post
    ├─ Publier → x7 Nixon
    │   ├─ Poursuivre → x8 Juge local (Nature)
    │   │   ├─ Censure (1 − q) → O7  Post censuré + sanctions
    │   │   └─ Refus (q)       → O8  Le juge donne raison au Post
    │   └─ Laisser faire → O9  Le Post publie seul
    └─ Ne pas publier → O10 Rien ne sort
```

Chaque joueur observe tout ce qui précède : chaque ensemble d’information contient un seul nœud (information parfaite).

## 4. Les gains

### 4.1 Cinq règles, identiques dans tous les sous-jeux

C’est ce que l’énoncé appelle des gains « cohérents entre les (sous-)jeux » : une même situation reçoit le même gain, quel que soit le chemin qui y mène.

1. **Publier rapporte.** Un journal qui a publié reçoit `B` si tout finit par sortir, `θB` si sa censure est maintenue (il garde la part déjà publiée).
2. **Un procès coûte.** Un journal poursuivi paie ses frais totaux `c` ; Nixon paie `k` par procès.
3. **Une censure maintenue punit.** Le journal censuré subit en plus la sanction `S`.
4. **La fuite fait mal.** Nixon perd `D` si tout sort, `θD` si une censure est maintenue, 0 si rien ne sort.
5. **Être doublé coûte.** Si le Times renonce et que le Post publie, le Times perd `R_T` si tout sort, `θR_T` si le Post est censuré.

### 4.2 Les valeurs et leur justification

Échelle : des points d’utilité. On fixe l’enjeu le plus lourd, le dommage de Nixon si tout sort, à 200, et on situe les autres valeurs par rapport à lui.

| Paramètre | Valeur | Justification |
|---|---|---|
| `D` (Nixon) | 200 | Quatre administrations prises en défaut et un précédent qui exposerait tous les secrets futurs. Sert d’étalon. |
| `B_T` (Times) | 100 | Le scoop de la décennie (prix Pulitzer 1972) et la mission d’informer. |
| `B_W` (Post) | 120 | Pour le Post, publier c’est entrer dans la cour des grands : le gain relatif est plus fort que pour le Times. |
| `θ` | 0,3 | Trois articles du Times étaient parus avant la suspension. Même part retenue pour le Post, par simplicité. |
| `c_T`, `c_W` | 10, 15 | Frais d’avocats et procédures d’urgence ; un peu plus pour le Post, en pleine entrée en bourse. |
| `S_T` | 50 | Poursuites possibles contre les journalistes et la direction ; le Times est une institution solide. |
| `S_W` | 180 | La sanction la plus lourde : poursuites pénales, entrée en bourse du 15 juin menacée, licences de télévision (environ 100 millions de dollars). Fixée à 1,5 × `B_W`. |
| `R_T` | 50 | Laisser son grand rival publier l’enquête qu’on a refusée : la moitié du scoop perdue. |
| `k_T`, `k_W` | 10, 20 | Coût total d’un procès pour Nixon, surtout en image de censeur ; poursuivre un second journal ressemble à une campagne contre la presse et mène à la Cour suprême. |
| `q` | 0,3 | Le juge Gurfein, en fonction depuis quelques jours, a suspendu le Times : une suspension provisoire s’obtient facilement en matière de sécurité nationale. |
| `p` | 0,65 | La jurisprudence (Near v. Minnesota, 1931) est hostile à la censure préalable, mais la Cour est divisée (6 voix contre 3 au final). |

Par rapport à la première version, seules deux valeurs changent : `S_W` passe de 150 à 180 (le Post garde maintenant `θB_W` quand sa censure est maintenue, par cohérence avec le Times ; la sanction plus lourde reflète l’entrée en bourse et les licences), et `R_T = 50` est nouveau.

### 4.3 Les dix issues, calcul par calcul

| Issue | Times | Post | Nixon |
|---|---|---|---|
| O1 Censure confirmée + sanctions | θB_T − c_T − S_T = 30 − 10 − 50 = **−30** | θB_W − c_W − S_W = 36 − 15 − 180 = **−159** | −θD − k_T − k_W = −60 − 10 − 20 = **−90** |
| O2 Victoire des journaux (1971) | B_T − c_T = **90** | B_W − c_W = **105** | −D − k_T − k_W = **−230** |
| O3 Le Post publie sans procès | B_T − c_T = **90** | B_W = **120** | −D − k_T = **−210** |
| O4 Times censuré, Post muet | θB_T − c_T − S_T = **−30** | **0** | −θD − k_T = **−70** |
| O5 Le juge donne raison au Times | B_T − c_T = **90** | **0** | −D − k_T = **−210** |
| O6 Tout sort, sans procès | B_T = **100** | **0** | −D = **−200** |
| O7 Post censuré + sanctions | −θR_T = **−15** | θB_W − c_W − S_W = **−159** | −θD − k_W = **−80** |
| O8 Le juge donne raison au Post | −R_T = **−50** | B_W − c_W = **105** | −D − k_W = **−220** |
| O9 Le Post publie seul | −R_T = **−50** | B_W = **120** | −D = **−200** |
| O10 Rien ne sort | **0** | **0** | **0** |

Remarque sur O3 : si Nixon laisse le Post publier, les documents sont publics ; maintenir la censure du Times n’aurait plus d’objet, elle tombe. Le Times récupère donc `B_T`, mais il a payé ses frais.

## 5. L’induction à rebours, tous les calculs

On traite chaque nœud après toutes ses suites : d’abord la branche « le Times publie » (x5 → x1), puis la branche « le Times se tait » (x8 → x6), puis le Times (x0). À un nœud de la Nature, on calcule l’espérance du triplet ; à un nœud de décision, le joueur compare **sa** composante et on fait remonter le triplet entier.

**Étape 1 — x5, Cour suprême.** 0,35 × (−30 ; −159 ; −90) + 0,65 × (90 ; 105 ; −230) = **(48 ; 12,6 ; −181)**.

**Étape 2 — x4, Nixon face au Post.** Poursuivre −181 > laisser faire −210 ⇒ **il poursuit**.
Condition générale : poursuivre rapporte −k_T − k_W − D[p + (1 − p)θ], laisser faire −D − k_T. Donc Nixon poursuit si `(1 − p)(1 − θ)D > k_W` ⟺ `p < 1 − k_W / ((1 − θ)D)` = 1 − 20/140 ≈ **85,7 %**. Ici 0,35 × 0,7 × 200 = 49 > 20 : la menace est **crédible**.

**Étape 3 — x3, le Post en relais.** Publier 12,6 > se taire 0 ⇒ **il publie**, de justesse.
Condition : `p(B_W − c_W) + (1 − p)(θB_W − c_W − S_W) ≥ 0` ⟺ `p ≥ (c_W + S_W − θB_W) / ((1 − θ)B_W + S_W)` = 159/264 ≈ **60,2 %**. Avec 65 %, le Post est juste au-dessus de son seuil.

**Étape 4 — x2, juge local.** 0,7 × (48 ; 12,6 ; −181) + 0,3 × (90 ; 0 ; −210) = **(60,6 ; 8,82 ; −189,7)**.

**Étape 5 — x1, Nixon face au Times.** Poursuivre −189,7 > laisser faire −200 ⇒ **il poursuit**.
Condition (le Post prendra le relais et sera poursuivi) : `k_T + (1 − q)k_W < (1 − q)(1 − p)(1 − θ)D` ⟺ 10 + 0,7 × 20 = **24 < 34,3**. Le premier procès ne vaut que parce que Nixon est prêt à poursuivre aussi le Post.

**Étape 6 — x8, juge local du Post seul.** 0,7 × (−15 ; −159 ; −80) + 0,3 × (−50 ; 105 ; −220) = **(−25,5 ; −79,8 ; −122)**.

**Étape 7 — x7, Nixon face au Post seul.** Poursuivre −122 > laisser faire −200 ⇒ **il poursuivrait**. Condition : `(1 − q)(1 − θ)D > k_W` ⟺ 98 > 20.

**Étape 8 — x6, le Post seul.** Publier −79,8 < se taire 0 ⇒ **il se tairait**. Condition pour publier seul : `q ≥ 60,2 %` (même seuil, mais face au juge local). Ici `q` = 30 %.

**Étape 9 — x0, le Times.** Publier 60,6 > se taire 0 (la suite serait O10) ⇒ **il publie**.

## 6. L’ENPS et le résultat

**ENPS (unique) :**

- **Times** : publier.
- **Post** : (publier après la censure du Times ; se taire si le Times renonce).
- **Nixon** : (poursuivre le Times ; poursuivre le Post ; poursuivre le Post seul).

Gains espérés à l’équilibre : **(60,6 ; 8,82 ; −189,7)**.

**Résultat (chemin d’équilibre) :** le Times publie → Nixon poursuit → [la Nature : censure, 70 %] → le Post publie → Nixon poursuit → [la Nature : Cour suprême favorable aux journaux, 65 %] → **O2, l’issue de 1971**.

Avant le premier article, trois issues étaient possibles : O5 **30 %**, O2 **45,5 %**, O1 **24,5 %**. L’ENPS ne dit pas que la victoire était certaine : il dit quelles décisions étaient rationnelles.

**Ce que la nouvelle branche ajoute :** seul, le Post ne l’aurait pas fait (−79,8). Sans le Times, rien ne serait sorti. Le Post publie parce que le Times a ouvert la voie : en relais, il affronte la Cour suprême (65 %) ; seul, un juge local qui censure 7 fois sur 10.

## 7. Réponses à l’énoncé

### 7.1 Joueurs et ordre

Trois joueurs stratégiques (Times, Post, Nixon), deux types de tribunaux représentés par la Nature (juges locaux, `q` ; Cour suprême, `p`), Ellsberg en coup fixé. Ordre : x0 Times → x1 Nixon → x2 juge local → x3 Post → x4 Nixon → x5 Cour suprême ; si le Times renonce : x6 Post → x7 Nixon → x8 juge local.

### 7.2 Résultats potentiels

- Pas de publication : O10.
- Pas d’action en justice : O6, O9.
- Action contre le New York Times uniquement : O5, O4, O3.
- Action contre le Washington Post également : O2, O1.
- Action contre le Post seul (si le Times renonce) : O8, O7.

### 7.3 Impact du coût total des procédures et des probabilités

**Quand les journaux publient-ils ?** Face à un procès, un journal publie si la probabilité que la justice lui donne finalement raison atteint son seuil

`τ = (c + S − θB) / ((1 − θ)B + S)`.

- Post en relais : `p ≥ τ_W` = 159/264 ≈ **60,2 %** (il affronte la Cour suprême).
- Post seul : `q ≥ 60,2 %` (il n’affronte que le juge local).
- Times : `τ_T` = 30/120 = **25 %**, appliqué à `π = q + (1 − q)p` = 75,5 % s’il anticipe le relais du Post, à `π = q` = 30 % sinon.
- Si la menace de procès n’est pas crédible, le journal publie sans condition.

**Quand l’administration attaque-t-elle ?**

- Le Post en relais : `p < 85,7 %`. Le Post seul : `q < 85,7 %`.
- Le Times : `q < 1 − k_T / ((1 − p)(1 − θ)D − k_W)` ≈ **65,5 %** (avec p = 65 %) si le Post prendrait le relais ; `q < 92,9 %` si le Post se tairait ; jamais si le Post publierait sans être poursuivi (censurer le Times ne servirait à rien).

**Le coût total :** les deux procès ont lieu si `k_T + (1 − q)k_W < (1 − q)(1 − p)(1 − θ)D` (coût total espéré < dommage espéré évité : 24 < 34,3) et si la seconde menace est crédible, `k_W < (1 − p)(1 − θ)D` (20 < 49).

**Carte (q, p)** avec les autres valeurs de référence :

- rien ne sort si `q < 25 %` et `p < 60,2 %` ;
- procès contre le Times seulement (Times censuré, Post muet) si `25 % ≤ q < 92,9 %` et `p < 60,2 %` ;
- deux procès si `60,2 % ≤ p < 78,6 %` et `q < 1 − 10 / (140(1 − p) − 20)` ;
- aucun procès ailleurs (menace non crédible dès que `p ≥ 85,7 %`).

### 7.4 Valeurs pour lesquelles les documents ne sont pas publiés, et pourquoi

1. **Le Post prend peur** (`p` = 50 %, ou `S_W` = 250, ou `c_W` > 27,6). En relais, il perdrait en moyenne 0,5 × 105 + 0,5 × (−159) = −27 (ou −11,9 avec `S_W` = 250). Il se tait. Nixon le sait et poursuit le Times (−112 au lieu de −200). La censure tient dans 70 % des cas : **O4**.
2. **Le Times renonce** (`c_T` = 80, ou `S_T` > 297). Publier lui rapporterait 0,3 × 20 + 0,7 × [0,65 × 20 + 0,35 × (−100)] = −9,4. Le Post aurait pris le relais (12,6 > 0), mais seul il perdrait 79,8 : **rien ne sort (O10)**. C’est l’absence du Times, pas le manque de courage du Post, qui garde le secret.
3. **Des tribunaux hostiles** (`q` = 20 %, `p` = 50 %). Le Post ne prendrait pas le relais ; le Times n’a alors que le juge local pour gagner : 0,2 × 90 + 0,8 × (−30) = −6. Le Post seul : 0,2 × 105 + 0,8 × (−159) = −106,2. **O10.**
4. **Même en 1971**, le secret avait 24,5 % de chances de tenir (O1). Ce n’est pas un choix : c’est l’issue défavorable du procès.
5. **Attention aux menaces non crédibles** (`p` = 50 %, `k_W` = 80). Poursuivre le Post rapporterait à Nixon −220 contre −210 : la menace n’est pas crédible. Si le Post y croyait, il se tairait et la censure du Times tiendrait 7 fois sur 10. Ce profil est un équilibre de Nash, mais pas un ENPS. L’ENPS prédit au contraire que tout sort, sans procès (O6).

### 7.5 Importance des coûts des actions en justice

- **Côté Nixon, le coût du second procès commande le premier.** `k_W` < 34,7 : deux procès. Entre 34,7 et 49 : aucun procès (la menace contre le Post resterait crédible, mais le gain net du second procès, 49 − `k_W`, ne justifie plus le premier : 0,7 × (49 − `k_W`) < 10). Au-delà de 49 : aucun procès, la menace n’est plus crédible. `k_T` ≥ 20,3 : aucun procès.
- **Côté journaux, le Post est le maillon faible** : frais > 27,6 ou sanction > 216 ⇒ il se tait et la censure du Times devient efficace. Le Times résiste jusqu’à 70,6 de frais ou 297 de sanction ; au-delà, rien ne sort.
- **Le rôle de `R_T`** (scénario « Publier pour ne pas être doublé » : `q` = 65 %, `p` = 50 %, `c_T` = 30, `S_T` = 150). Publier rapporte −7 au Times, mais se taire rapporterait −37,75, car le Post publierait seul. Le Times publie à perte. Avec `R_T` = 0, il laisserait le Post publier seul.
- Conclusion : des procès chers pour le pouvoir rendent la presse plus libre ; des procès chers pour les journaux mènent à l’autocensure.

### 7.6 Gains cohérents et ENPS

Voir les sections 4 et 6. Les sous-jeux ont aussi leur ENPS : sous-jeu du Post en relais (x3) : le Post publie, Nixon le poursuit, espérance (48 ; 12,6 ; −181) ; sous-jeu « le Times se tait » (x6) : le Post se tait, issue O10. Le jeu complet rationalise 1971 : le Times publie car ses chances (75,5 %) dépassent son seuil (25 %) ; Nixon attaque car la censure peut tenir jusqu’au bout (24,5 %) et les procès coûtent moins que le dommage évité ; le Post publie car ses chances à la Cour suprême (65 %) dépassent de peu son seuil (60,2 %).

## 8. Liens avec le cours

Références tirées des diapositives déjà citées dans l’application (Decerf, ECGEB366). Je n’ai pas pu ouvrir le site du cours depuis mon environnement : vérifie les numéros de diapositives et le vocabulaire exact.

- **Forme étendue** (S6, diapositives 8–9 et 14) : nœud initial en haut, un joueur par nœud, une action par branche, des gains dans un ordre fixe sous chaque feuille.
- **Information parfaite** (S6, 7 et 36–39) : chaque ensemble d’information contient un seul nœud ; le Post sait si le Times a publié, a été censuré ou a renoncé.
- **Action et stratégie** (S6, 14–18) : 2 stratégies pour le Times, 4 pour le Post, 8 pour Nixon, 64 profils. L’ENPS précise ce que le Post ferait en x6, nœud jamais atteint en 1971.
- **Sous-jeux** (S6, 10–13) : chaque nœud non terminal ouvre un sous-jeu (9 au total, dont le jeu entier).
- **Induction à rebours et réduction de l’arbre** (S6, 21–24) : section 5 ; l’application remplace chaque sous-jeu résolu par son triplet de gains.
- **Nash et ENPS, menace non crédible, jeu de l’entrée** (S6, 3–6) : le Post joue le rôle de l’entrant (publier = entrer) et Nixon celui de la firme en place (poursuivre = guerre). Le recensement des 64 profils donne 4 équilibres de Nash dans le jeu de référence (même issue, ils ne diffèrent qu’hors du chemin, en x6 et x7) et un seul ENPS. Avec `p` = 50 % et `k_W` = 80, on obtient 12 équilibres de Nash, dont certains gardent le secret grâce à une menace non crédible ; l’ENPS les élimine.
- **Coups de la Nature** : extension utilisée ici pour représenter l’incertitude judiciaire ; on y calcule un gain espéré.
- **Jeux simultanés** (S5) : si le Times et le Post devaient décider sans s’observer, certains ensembles d’information contiendraient plusieurs nœuds.
- **Jeux répétés** (S8) : presse et pouvoir se retrouvent d’une affaire à l’autre (le Watergate commence un an plus tard) ; une réputation de fermeté compterait alors. Non modélisé : deux procès dans une même affaire ne font pas un jeu répété.

## 9. Limites et robustesse

- **La règle des tribunaux.** Si la Cour suprême tranchait aussi l’affaire d’un journal seul, le Post oserait publier seul : 105 − 0,245 × 264 = 40,3 > 0. Le secret ne tiendrait plus si le Times renonçait, mais le chemin d’équilibre de 1971 resterait identique (mêmes calculs aux nœuds x1 à x5).
- Croyances communes : tous les joueurs partagent `q` et `p`.
- Un tirage par tribunal : les allers-retours réels (suspension, refus d’injonction, appel) sont résumés.
- Une même part `θ` pour les deux journaux, une même valeur `B_W` pour le Post qu’il publie seul ou en relais.
- Le Times ne revient pas dans le jeu après avoir renoncé ; Ellsberg ne contacte pas d’autres journaux (le Boston Globe et d’autres ont publié ensuite).
- Les gains sont des hypothèses : le laboratoire de l’application montre quelles conclusions résistent quand on les change.
