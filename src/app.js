const BOUNDS = { q: [0, 1], p: [0, 1], th: [0, 0.95], B_T: [0, 300], c_T: [0, 120], S_T: [0, 400], B_W: [0, 300], c_W: [0, 120], S_W: [0, 400], D: [0, 500], k_T: [0, 120], k_W: [0, 120] };
let saved = null; try { saved = JSON.parse(localStorage.getItem('pp-lab-v3') || 'null'); } catch (e) { saved = null; }
if (saved && typeof saved === 'object') saved = Object.fromEntries(Object.entries(saved).filter(([k, v]) => BOUNDS[k] && Number.isFinite(v) && v >= BOUNDS[k][0] && v <= BOUNDS[k][1]));
else saved = null;

/* Seuils décrits en mots plutôt que par une division par zéro. */
function thresholdText(who, M) {
  const t = M.th, p = '<span class="m">p</span>', q = '<span class="m">q</span>';
  if (who === 'post') {
    if (!M.g2Sue) return `Nixon ne poursuivrait pas le Post en relais : le Post publie quelle que soit sa chance devant la Cour suprême.`;
    if (t.tauW > 1) return 'Sous la menace d’un procès, aucune probabilité de victoire ne rend la publication rentable pour le Post.';
    if (t.tauW <= 0) return 'Sous la menace d’un procès, le Post publie pour toute probabilité de victoire. À gain nul, notre convention retient la publication.';
    return `Sous la menace d’un procès, le Post publie en relais si ${p} ≥ ${pct(t.tauW)}, et seul si ${q} ≥ ${pct(t.tauW)}.`;
  }
  if (!Number.isFinite(t.gPost) || t.gPost <= 0) return 'Avec ces paramètres, poursuivre le Post n’est strictement rentable pour aucune probabilité de victoire des journaux.';
  return `Nixon poursuit le Post en relais si ${p} &lt; ${pct(t.gPost)}, et le Post seul si ${q} &lt; ${pct(t.gPost)}.`;
}

// ====================== CONSIGNES DE L'ÉNONCÉ ======================
/* Les cinq consignes, citées telles quelles, et les chapitres qui y répondent. */
const CONSIGNES = [
  { n: 1, short: 'Les joueurs et leur ordre', text: 'Identifier les joueurs prenant part à cette histoire et l’ordre dans lequel ils interviennent', pages: ['joueurs'] },
  { n: 2, short: 'Les résultats possibles', text: 'Identifier les différents résultats potentiels : pas de publication, pas d’action en justice, une action en justice contre le New York Times uniquement, une action contre le Washington Post également…', pages: ['arbre'] },
  { n: 3, short: 'L’effet des coûts et des probabilités', text: 'Montrer l’impact du coût total des procédures judiciaires et des probabilités que le juge local puis la Cour Suprême soient favorables aux journaux. Pour quelles probabilités les journaux vont-ils publier les documents ? Pour quelles probabilités l’administration va-t-elle attaquer en justice ?', pages: ['carte', 'couts', 'simulateur'] },
  { n: 4, short: 'Quand les documents ne sortent pas', text: 'Identifier des valeurs de payoffs/de probabilités pour lesquels les documents ne seront pas publiés et expliquez dans chaque cas pourquoi ils ne le seront pas. Discutez de l’importance des valeurs des coûts associés aux différentes actions en justice.', pages: ['secret', 'couts'] },
  { n: 5, short: 'Des gains cohérents et les ENPS', text: 'Identifier des payoffs, cohérents avec les objectifs des différents joueurs et cohérents entre les (sous)-jeux, permettant de rationaliser l’issue de la situation (trouver les ENPS de ces jeux et leur résultat associé)', pages: ['gains', 'resolution'] },
];
const pieceLabel = id => { const section = document.getElementById(id); return `${section.querySelector('.piece-head .eyebrow').textContent.trim()} · ${section.dataset.toc}`; };
document.querySelectorAll('section.piece').forEach(section => {
  const list = CONSIGNES.filter(c => c.pages.includes(section.id));
  if (!list.length) return;
  section.querySelector('.piece-head').insertAdjacentHTML('afterend', `<aside class="consigne" aria-label="Consigne de l’énoncé traitée dans ce chapitre">${list.map(c => `<div class="consigne-item"><span class="consigne-tag">Consigne ${c.n} de l’énoncé</span><p>« ${c.text} »</p></div>`).join('')}<a class="consigne-link" href="#enonce">Lire la réponse rédigée →</a></aside>`);
});
$('#consigne-map').innerHTML = CONSIGNES.map(c => `<li><span class="cm-n">${c.n}</span><div><h3>${c.short}</h3><p>« ${c.text} »</p><p class="cm-links">Réponse : ${c.pages.map(id => `<a href="#${id}">${pieceLabel(id)} →</a>`).join(' ')}</p></div></li>`).join('');
$('#home-consignes').innerHTML = CONSIGNES.map(c => `<li><a href="#${c.pages[0]}"><span class="hc-n">${c.n}</span><span class="hc-t"><b>${c.short}</b><small>${c.pages.map(pieceLabel).join(' · ')}</small></span><span class="hc-arrow" aria-hidden="true">→</span></a></li>`).join('');

// ====================== FRISE ======================
const TL = [
  ['1945 → 1967', '--muted', "Période couverte par l'étude : présidences de Truman, Eisenhower, Kennedy et Johnson."],
  ['1967', '--gov', "Robert McNamara commande l'étude secrète : 47 volumes, environ 7 000 pages, terminés en janvier 1969, juste avant l'arrivée de Nixon."],
  ['fin 1969', '--ell', "Daniel Ellsberg, analyste de la RAND qui a participé à l'étude, la photocopie en secret avec Anthony Russo."],
  ['1969 → 1971', '--ell', "Ellsberg propose l'étude à des sénateurs opposés à la guerre, dont J. William Fulbright, qui ne la rendent pas publique. Il se tourne vers la presse et la confie en mars 1971 à Neil Sheehan, du New York Times."],
  ['13 juin 1971', '--nyt', "Dimanche : le New York Times publie le premier article de sa série."],
  ['14 juin', '--gov', "Le ministre de la Justice, John Mitchell, demande l'arrêt de la publication. Le Times refuse."],
  ['15 juin', '--gov', "Après le troisième article, le juge fédéral Murray Gurfein (New York) ordonne une suspension temporaire. Le même jour, le Washington Post entre en bourse."],
  ['16-17 juin', '--wp', "Ben Bagdikian, journaliste du Post, obtient environ 4 400 pages. Le 17 au soir, Katharine Graham tranche : « Let's go. Let's publish. »"],
  ['18 juin', '--wp', "Premier article du Post. Le gouvernement l'attaque aussi : une cour ordonne la suspension dans la nuit."],
  ['26 juin', '--nat', "Audience devant la Cour suprême, qui a joint les deux affaires."],
  ['30 juin 1971', '--nat', "La Cour donne raison aux journaux, à 6 voix contre 3 : le gouvernement n'a pas justifié une censure préalable."],
  ['1er juillet', '--nyt', "Le Times reprend la publication de la série."],
  ['11 mai 1973', '--ell', "Les poursuites contre Ellsberg (jusqu'à 115 ans de prison encourus) sont abandonnées, à cause des agissements illégaux du gouvernement contre lui."],
];
$('#timeline').innerHTML = TL.map(([d, c, t]) => `<div class="tl-item" style="--c:var(${c})"><div class="d">${d}</div><div class="t">${t}</div></div>`).join('');

// ====================== CONCEPTS ======================
const CONCEPTS = [
  ['Jeu séquentiel', "Les joueurs jouent à tour de rôle et chacun voit les coups déjà joués (information parfaite).", "Le Post décide après avoir vu le Times publier et Nixon le poursuivre, ou après avoir appris que le Times renonce."],
  ['Arbre et nœuds', "Chaque nœud est un moment de décision d’un joueur ; chaque branche, une action ; chaque feuille, une issue avec les gains de tous les joueurs.", "6 nœuds (Times, Post ×2, Nixon ×3) et 7 feuilles. Les juges n’ont pas de nœud : ce ne sont pas des joueurs."],
  ['Incertitude et gain espéré', "Un événement incertain, dont personne ne choisit l’issue, n’est pas un coup d’un joueur. On le traite par un gain espéré : E = p × gain si oui + (1 − p) × gain si non.", "Les verdicts des juges (q, p) sont intégrés dans les gains des feuilles « + tribunaux »."],
  ['Stratégie', "Un plan complet : une action prévue à chaque nœud où le joueur pourrait jouer, même si ce nœud n'est jamais atteint.", "Le Post a 2 nœuds, donc 4 stratégies ; Nixon en a 3, donc 8."],
  ['Sous-jeu', "La partie de l'arbre qui commence à un nœud et contient tout ce qui suit.", "Le « jeu du Post » après la poursuite du Times (x2), ou celui qui commence si le Times se tait (x4)."],
  ['Induction à rebours', "On résout depuis la fin : on trouve le meilleur choix au dernier nœud, on le remplace par sa valeur, et on remonte.", "On commence par Nixon face au Post (x3) ; on finit par le Times (x0)."],
  ['ENPS', "Équilibre de Nash parfait en sous-jeux : un profil de stratégies qui est un équilibre de Nash dans chaque sous-jeu. Il élimine les menaces non crédibles.", "Times : publier ; Post : (publier en relais ; se taire seul) ; Nixon : poursuivre à ses trois nœuds."],
  ['Menace non crédible', "Une menace qu'on n'aurait pas intérêt à exécuter le moment venu. Un joueur rationnel ne s'y laisse pas dissuader.", "« Nous poursuivrons tout journal qui publie », si le procès coûte plus qu'il ne rapporte."],
];
$('#concepts').innerHTML = CONCEPTS.map(([t, d, ex]) => `<div class="card"><h3>${t}</h3><div class="k">${d}</div><div class="k" style="color:var(--muted)"><b>Ici :</b> ${ex}</div></div>`).join('');

// mini-expérience menace crédible (une fois le Times censuré)
(function threat() {
  const r = $('#thr-k'), o = $('#thr-out'), m = $('#thr-msg'), v = $('#thr-kv'), P = BASE;
  const limit = (1 - P.p) * (1 - P.th) * P.D;
  const upd = () => {
    const k = +r.value; v.textContent = k;
    const sue = -P.k_T - k - P.D * (P.p + (1 - P.p) * P.th), let_ = -P.D - P.k_T;
    const cred = sue > let_ + 1e-9;
    o.innerHTML = `<span class="opt ${cred ? 'win' : ''}">Poursuivre le Post : <b>${fr(sue)}</b></span><span>${Math.abs(sue - let_) < 1e-9 ? '=' : cred ? '&gt;' : '&lt;'}</span><span class="opt ${cred ? '' : 'win'}">Laisser faire : <b>${fr(let_)}</b></span><span class="verdict" style="color:${cred ? 'var(--ok)' : 'var(--stamp)'}">⇒ menace ${cred ? 'crédible' : 'non crédible'}</span>`;
    m.innerHTML = cred ? `Tant que <span class="m">k<sub>W</sub></span> &lt; ${fr(limit)}, poursuivre limite les dégâts : le Post doit prendre la menace au sérieux.` : `Avec <span class="m">k<sub>W</sub></span> ≥ ${fr(limit)}, le procès coûte au moins autant que le dommage qu’il éviterait en moyenne (${fr(limit)}) : Nixon laisserait faire. Le Post le sait et publie sans crainte.`;
  };
  r.addEventListener('input', upd); upd();
})();

// ====================== JOUEURS ======================
const PLAYERS = [
  ['NYT', '--nyt', 'New York Times', 'Publier ou non (x0).', "Informer, décrocher le scoop et le prestige.", "Frais de procès, censure, sanctions si la censure est maintenue."],
  ['RN', '--gov', 'Administration Nixon', 'Poursuivre en justice ou laisser faire (x1, x3, x5).', "Protéger ses secrets et sa crédibilité ; éviter un précédent.", "Le coût des procès, surtout son image de censeur."],
  ['WP', '--wp', 'Washington Post', 'Publier ou non : en relais du Times (x2) ou seul (x4).', "Devenir un grand journal national, informer.", "Amendes, prison, entrée en bourse ratée, licences de télévision."],
];
$('#players').innerHTML = PLAYERS.map(([l, c, n, a, obj, risk]) => `<div class="card"><div class="player"><div class="disc" style="background:var(${c})">${l}</div><h3>${n}</h3></div><div class="k"><b>Action :</b> ${a}</div><div class="k"><b>Objectif :</b> ${obj}</div><div class="k"><b>Risque :</b> ${risk}</div></div>`).join('');
/* Ni choix stratégique ni gains : ces acteurs n'ont pas de nœud dans l'arbre. */
const NON_PLAYERS = [
  ['', '--nat', 'diam', 'La 1re cour : le juge local', 'Refuse la censure avec la probabilité q.', 'Pas de nœud : son verdict est intégré aux gains des feuilles, q × (gains si refus) + (1 − q) × (gains si censure).'],
  ['', '--nat', 'diam', 'La 2e cour : la Cour suprême', 'Donne raison aux journaux avec la probabilité p, pour les deux affaires jointes.', 'Pas de nœud non plus : p pondère les gains de la feuille « Procès du Post + tribunaux ».'],
  ['DE', '--ell', 'disc', 'Daniel Ellsberg', 'Remet les documents au Times, puis au Post si le Times est poursuivi ou refuse.', 'Son choix est fixé d’avance : il ouvre le jeu sans y faire de choix stratégique.'],
];
$('#non-players').innerHTML = NON_PLAYERS.map(([l, c, sh, n, role, effect]) => `<div class="card not-player"><div class="player">${sh === 'disc' ? `<div class="disc" style="background:var(${c})">${l}</div>` : `<div class="diam" style="background:var(${c})"></div>`}<h3>${n}</h3></div><div class="k"><b>Rôle :</b> ${role}</div><div class="k"><b>Gains :</b> aucun.</div><div class="k"><b>Dans l’arbre :</b> ${effect}</div></div>`).join('');

// ====================== ISSUES ======================
const OUT_DESC = {
  O1: 'Le Times publie, Nixon le poursuit, le Post prend le relais et Nixon le poursuit aussi. Les tribunaux tranchent : c’est la feuille de 1971.',
  O2: 'Nixon poursuit le Times, le Post publie et Nixon le laisse faire : tout sort, la censure du Times perd son objet.',
  O3: 'Nixon poursuit le Times et le Post se tait : si le juge censure le Times, le secret tient.',
  O4: 'Le Times publie et Nixon laisse faire : tout sort, sans procès.',
  O5: 'Le Times a renoncé ; le Post publie seul et Nixon le poursuit : un juge local tranche.',
  O6: 'Le Times a renoncé ; le Post publie seul et Nixon le laisse faire.',
  O7: 'Le Times renonce et le Post aussi : rien ne sort.',
};
const CATS = [
  ['Pas de publication', '--muted', ['O7']],
  ["Pas d'action en justice", '--ok', ['O4', 'O6']],
  ['Action contre le Times uniquement', '--gov', ['O3', 'O2']],
  ['Action contre le Post également', '--nat', ['O1']],
  ['Action contre le Post seul', '--wp', ['O5']],
];
$('#outcome-cards').innerHTML = CATS.map(([t, c, ids]) => `<div class="card"><div class="tag" style="color:var(${c})">${t}</div>${ids.map(id => `<div class="k"><b>${id}</b> · ${OUT_DESC[id]}</div>`).join('')}</div>`).join('');

// ====================== GAINS : LA LEÇON PAS À PAS ======================
const COLORS3 = ['--nyt', '--wp', '--gov'];
const VERDICT_COLOR = { judgeTimes: '#4E8F72', press: '#17695B', gov: '#8F1C13', postFree: '#3E7D8C', timesCensored: '#B42318', noSuit: '#2C7A4B', judgePost: '#3F6F9E', postCensored: '#6E2B62', postAlone: '#2F5F8A', nothing: '#7D776B' };
const par = x => (x < 0 ? `(${fr(x, 2)})` : fr(x, 2));
const signedSum = terms => terms.map((x, i) => (i === 0 ? fr(x, 2) : x < 0 ? ` − ${fr(-x, 2)}` : ` + ${fr(x, 2)}`)).join('');
const capital = s => s.charAt(0).toUpperCase() + s.slice(1);
/* Remplace chaque symbole par sa valeur : « θB_T − c_T » devient « 0,3 × 100 − 10 ». */
function numeric(expr, P) {
  const value = { B_T: P.B_T, B_W: P.B_W, c_T: P.c_T, c_W: P.c_W, S_T: P.S_T, S_W: P.S_W, k_T: P.k_T, k_W: P.k_W, D: P.D };
  return expr.replace(/(θ?)(B_T|B_W|c_T|c_W|S_T|S_W|k_T|k_W|D)/g, (_, t, s) => (t ? fr(P.th, 2) + ' × ' : '') + fr(value[s], 2));
}
/* Une ligne de calcul : symboles = nombres = résultat. */
function calcLine(expr, value, P) {
  if (!/[A-Za-zθ]/.test(expr)) return `<b>${fr(value, 2)}</b>`;
  const numbers = numeric(expr, P), single = !/[−+×]/.test(numbers.replace(/^−/, ''));
  return `<span class="m">${subH(expr)}</span>${single ? '' : ' = ' + numbers} = <b>${fr(value, 2)}</b>`;
}

/* Étape 1 · les ingrédients. */
(function ingredients() {
  const P = BASE;
  const groups = [
    ['--nyt', 'Un journal : le Times ou le Post', [
      ['B', 'Ce que lui rapporte une publication complète : le scoop, le prestige, la mission d’informer.', `B<sub>T</sub> = ${fr(P.B_T)} · B<sub>W</sub> = ${fr(P.B_W)}`],
      ['c', 'Ses frais de procès, s’il est poursuivi.', `c<sub>T</sub> = ${fr(P.c_T)} · c<sub>W</sub> = ${fr(P.c_W)}`],
      ['S', 'La sanction, si sa censure est maintenue.', `S<sub>T</sub> = ${fr(P.S_T)} · S<sub>W</sub> = ${fr(P.S_W)}`],
    ]],
    ['--gov', 'L’administration Nixon', [
      ['D', 'Le dommage si tout sort : crédibilité de l’exécutif, précédent pour les fuites futures.', `D = ${fr(P.D)}`],
      ['k', 'Le coût d’un procès : frais et image de censeur.', `k<sub>T</sub> = ${fr(P.k_T)} · k<sub>W</sub> = ${fr(P.k_W)}`],
    ]],
    ['--nat', 'Ce qu’aucun joueur ne choisit', [
      ['θ', 'La part des documents déjà parue quand une censure tombe.', `θ = ${fr(P.th, 2)}`],
      ['q', 'La probabilité que la 1re cour (le juge local) refuse la censure.', `q = ${fr(P.q, 2)}`],
      ['p', 'La probabilité que la 2e cour (la Cour suprême) donne raison aux journaux.', `p = ${fr(P.p, 2)}`],
    ]],
  ];
  $('#ingredients').innerHTML = groups.map(([c, title, rows]) => `<div class="card ing-card" style="border-top:3px solid var(${c})"><h3>${title}</h3>${rows.map(([sym, what, val]) => `<div class="ing-row"><span class="m ing-sym">${sym}</span><div><div class="k">${what}</div><div class="ing-val m">${val}</div></div></div>`).join('')}</div>`).join('');
})();
const WHY = [
  ['D = 200', 'Nixon', 'Le plus gros enjeu : quatre administrations prises en défaut, et un précédent qui exposerait tous les secrets futurs. Il sert d’étalon : les autres valeurs se lisent par rapport à lui.'],
  ['B<sub>T</sub> = 100', 'Times', 'Le scoop de la décennie (prix Pulitzer 1972), la mission d’informer. La moitié de l’enjeu de Nixon.'],
  ['B<sub>W</sub> = 120', 'Post', 'Pour le Post, publier c’est entrer dans la cour des grands : le gain relatif est plus fort que pour le Times.'],
  ['θ = 0,3', 'Tous', 'Trois articles étaient parus avant la suspension du Times : une partie seulement des révélations. Même part retenue pour le Post, par simplicité.'],
  ['c<sub>T</sub> = 10 · c<sub>W</sub> = 15', 'Journaux', 'Frais d’avocats et procédures d’urgence ; un peu plus pour le Post, en pleine entrée en bourse.'],
  ['S<sub>T</sub> = 50', 'Times', 'Poursuites possibles contre ses journalistes et sa direction ; le Times est une institution solide.'],
  ['S<sub>W</sub> = 180', 'Post', 'La sanction la plus lourde : poursuites pénales, entrée en bourse du 15 juin menacée, licences de télévision (environ 100 millions de dollars). Fixée à 1,5 fois B<sub>W</sub>.'],
  ['k<sub>T</sub> = 10 · k<sub>W</sub> = 20', 'Nixon', 'Chaque procès coûte, surtout en image de censeur ; poursuivre un second journal ressemble à une campagne contre la presse et mène jusqu’à la Cour suprême.'],
  ['q = 0,3', 'Juges', 'Le juge Gurfein, en fonction depuis quelques jours, a suspendu le Times : en matière de sécurité nationale, une suspension provisoire s’obtient facilement.'],
  ['p = 0,65', 'Juges', 'La jurisprudence (Near v. Minnesota, 1931) est très hostile à la censure préalable, mais la Cour est divisée : 6 voix contre 3 au final.'],
];
$('#whytable').innerHTML = `<thead><tr><th>Valeur</th><th>Qui</th><th>Justification</th></tr></thead><tbody>` + WHY.map(([v, j, t]) => `<tr><td class="v" style="text-align:left"><span class="m">${v}</span></td><td>${j}</td><td>${t}</td></tr>`).join('') + '</tbody>';

/* Étape 2 · tous les cas possibles, calculés avec l'équation du modèle (gains). */
(function casesTables() {
  const P = BASE, both = { pubT: 1, pubW: 1 }, sued = { suedT: 1, suedW: 1 }, cens = { censT: 1, censW: 1 };
  const paperCases = [
    ['Il ne publie pas', '—', '0', { docs: 'none' }],
    ['Il publie, personne ne le poursuit', 'σ = 1', 'B', { docs: 'all', ...both }],
    ['Il publie, il est poursuivi, tout sort quand même', 'σ = 1', 'B − c', { docs: 'all', ...both, ...sued }],
    ['Il publie, il est poursuivi, sa censure est maintenue', 'σ = θ', 'θB − c − S', { docs: 'part', ...both, ...sued, ...cens }],
  ];
  $('#journal-cases').innerHTML = `<caption>Les quatre cas d’un journal</caption><thead><tr><th>Cas</th><th>Ce qui sort</th><th>Équation</th><th style="color:var(--nyt)">Times</th><th style="color:var(--wp)">Post</th></tr></thead><tbody>` +
    paperCases.map(([label, share, generic, f]) => {
      const g = gains(f, P), sym = symbols(f);
      return `<tr><td>${label}</td><td class="m">${share}</td><td class="m">${generic}</td><td class="calc-cell" style="--c:var(--nyt)">${calcLine(sym[0], g[0], P)}</td><td class="calc-cell" style="--c:var(--wp)">${calcLine(sym[1], g[1], P)}</td></tr>`;
    }).join('') + '</tbody>';
  const nixonCases = [
    ['Rien ne sort', 'aucun', { docs: 'none' }],
    ['Tout sort', 'aucun', { docs: 'all' }],
    ['Tout sort', 'contre le Times', { docs: 'all', suedT: 1 }],
    ['Tout sort', 'contre le Post seul', { docs: 'all', suedW: 1 }],
    ['Tout sort', 'contre le Times et le Post', { docs: 'all', suedT: 1, suedW: 1 }],
    ['Seuls les premiers articles sortent', 'contre le Times', { docs: 'part', suedT: 1 }],
    ['Seuls les premiers articles sortent', 'contre le Post seul', { docs: 'part', suedW: 1 }],
    ['Seuls les premiers articles sortent', 'contre le Times et le Post', { docs: 'part', suedT: 1, suedW: 1 }],
  ];
  $('#nixon-cases').innerHTML = `<caption>Les huit cas de Nixon</caption><thead><tr><th>Ce qui sort</th><th>Procès engagés</th><th style="color:var(--gov)">Équation et calcul</th></tr></thead><tbody>` +
    nixonCases.map(([share, suits, f]) => `<tr><td>${share}</td><td>${suits}</td><td class="calc-cell" style="--c:var(--gov)">${calcLine(symbols(f)[2], gains(f, P)[2], P)}</td></tr>`).join('') + '</tbody>';
  /* Vérification : l'ordre des gains correspond aux objectifs. */
  const free = gains({ docs: 'all', ...both }, P), won = gains({ docs: 'all', ...both, ...sued }, P), lost = gains({ docs: 'part', ...both, ...sued, ...cens }, P);
  const nx = f => gains(f, P)[2];
  const chain = items => items.map(([label, value]) => `<span class="pref-item"><b>${value}</b><small>${label}</small></span>`).join('<span class="pref-gt" aria-label="préféré à">&gt;</span>');
  const blocks = [
    ['--nyt', 'Le Times : publier, sans y laisser sa réputation', [['publier librement', fr(free[0])], ['gagner son procès', fr(won[0])], ['ne pas publier', '0'], ['être censuré', fr(lost[0])]]],
    ['--wp', 'Le Post : publier aussi, mais il risque bien plus gros', [['publier librement', fr(free[1])], ['gagner son procès', fr(won[1])], ['ne pas publier', '0'], ['être censuré', fr(lost[1])]]],
    ['--gov', 'Nixon : garder le secret, avec le moins de procès possible', [['rien ne sort', '0'], ['censure maintenue', `${fr(nx({ docs: 'part', suedT: 1 }))} à ${fr(nx({ docs: 'part', suedT: 1, suedW: 1 }))}`], ['tout sort', `${fr(nx({ docs: 'all' }))} à ${fr(nx({ docs: 'all', suedT: 1, suedW: 1 }))}`]]],
  ];
  $('#pref-check').innerHTML = blocks.map(([c, title, items]) => `<div class="pref-row" style="--c:var(${c})"><div class="pref-title">${title}</div><div class="pref-chain">${chain(items)}</div></div>`).join('') +
    `<p class="step-text">L’ordre est le bon. Un journal préfère publier librement, puis gagner son procès, puis se taire ; ce qu’il craint le plus, c’est la censure. Pour le Post, l’écart entre se taire (0) et être censuré (${fr(lost[1])}) est bien plus grand que pour le Times (${fr(lost[0])}) : c’est lui qui a le plus à perdre. Nixon préfère que rien ne sorte ; sinon, il préfère une censure maintenue à une publication complète et, à résultat égal, moins de procès.</p>`;
})();

/* Étapes 3 et 4 · chaque feuille : chemin, intuition, équation générale, point du cours. */
const LEAF_DETAILS = {
  O1: {
    path: 'Le Times publie → Nixon le poursuit → le Post publie → Nixon le poursuit aussi.',
    intuition: [
      'Le Times paie ses frais dans tous les cas. Il garde tout le scoop si la 1re cour refuse la censure ou si la 2e cour lui donne raison ; sinon il ne garde que ses premiers articles et subit la sanction.',
      'Si la 1re cour refuse de censurer le Times, le Times publie tout lui-même et le Post n’a pas à prendre le relais : 0. Sinon, le Post publie, il est poursuivi, et tout se joue devant la 2e cour.',
      'Nixon paie le procès du Times dans tous les cas, et celui du Post si la 1re cour a censuré le Times. Il ne limite le dommage à θD que si la 2e cour lui donne raison.',
    ],
    eq: ['\\mathbb{E}[u_T]=q\\,(B_T-c_T)+(1-q)\\big[p\\,(B_T-c_T)+(1-p)\\,(\\theta B_T-c_T-S_T)\\big]', '\\mathbb{E}[u_W]=q\\times 0+(1-q)\\big[p\\,(B_W-c_W)+(1-p)\\,(\\theta B_W-c_W-S_W)\\big]', '\\mathbb{E}[u_N]=q\\,(-D-k_T)+(1-q)\\big[p\\,(-D-k_T-k_W)+(1-p)\\,(-\\theta D-k_T-k_W)\\big]'],
    course: 'Feuille atteinte à l’équilibre : c’est le « résultat » de l’ENPS, distinct des stratégies (S6, diapositives 14–18). Gain espéré, car les verdicts sont incertains (même calcul que dans les jeux bayésiens, diapositive 11).',
  },
  O2: {
    path: 'Le Times publie → Nixon le poursuit → le Post publie → Nixon laisse faire.',
    intuition: [
      'Dans les deux cas, tout finit par sortir : le Times garde son scoop, mais il a payé ses frais de procès.',
      'Le Post ne prend le relais que si le Times est censuré (probabilité 1 − q). Il gagne alors B_W, sans procès. Sinon, il n’a pas publié : 0.',
      'Le pire pour Nixon : tout sort, et il a payé le procès du Times pour rien.',
    ],
    eq: ['\\mathbb{E}[u_T]=q\\,(B_T-c_T)+(1-q)\\,(B_T-c_T)=B_T-c_T', '\\mathbb{E}[u_W]=q\\times 0+(1-q)\\,B_W', '\\mathbb{E}[u_N]=q\\,(-D-k_T)+(1-q)\\,(-D-k_T)=-D-k_T'],
    course: 'Feuille hors du chemin : elle compte quand même, car Nixon la compare à O1 en x3. Une menace se juge à ce qu’elle rapporterait si on l’exécutait (S6, diapositives 3–6 et 10–13).',
  },
  O3: {
    path: 'Le Times publie → Nixon le poursuit → le Post ne publie pas.',
    intuition: [
      'Tout dépend de la 1re cour. Si elle refuse la censure, le Times publie tout. Sinon, il ne garde que ses premiers articles et subit la sanction.',
      'Le Post ne publie pas : 0, quel que soit le verdict.',
      'Si la censure tient, Nixon ne subit que θD, pour le prix d’un seul procès.',
    ],
    eq: ['\\mathbb{E}[u_T]=q\\,(B_T-c_T)+(1-q)\\,(\\theta B_T-c_T-S_T)', 'u_W=0', '\\mathbb{E}[u_N]=q\\,(-D-k_T)+(1-q)\\,(-\\theta D-k_T)'],
    course: 'Le Post compare sa composante ici (0) à celle de O1 : à un nœud, seul compte le gain du joueur qui décide (S6, diapositives 21–24).',
  },
  O4: {
    path: 'Le Times publie → Nixon laisse faire.',
    facts: 'Le Times a publié, personne n’est poursuivi et tout sort : σ = 1.',
    intuition: ['Tout le scoop, sans procès : le meilleur cas du Times.', 'Le Post n’a pas publié : 0.', 'Tout sort, mais Nixon ne paie aucun procès.'],
    eq: ['u_T=B_T', 'u_W=0', 'u_N=-D'],
    course: 'Point de comparaison de Nixon en x1 : poursuivre le Times ne vaut la peine que si cela fait mieux que −200 (S6, diapositives 21–24).',
  },
  O5: {
    path: 'Le Times ne publie pas → le Post publie seul → Nixon le poursuit.',
    intuition: [
      'Le Times n’a pas publié : 0, quel que soit le verdict.',
      'Seul, le Post n’a que la 1re cour. Si elle refuse la censure, il gagne tout le scoop, moins ses frais. Sinon, il est censuré et sanctionné.',
      'Sans second journal, la 2e cour n’est pas saisie : si la 1re cour censure le Post, la censure tient et Nixon limite le dommage à θD.',
    ],
    eq: ['u_T=0', '\\mathbb{E}[u_W]=q\\,(B_W-c_W)+(1-q)\\,(\\theta B_W-c_W-S_W)', '\\mathbb{E}[u_N]=q\\,(-D-k_W)+(1-q)\\,(-\\theta D-k_W)'],
    course: 'Sous-jeu jamais atteint en 1971 (x5) : l’ENPS y fixe pourtant une action. Une stratégie dit quoi faire à chaque nœud (S6, diapositives 14–18).',
  },
  O6: {
    path: 'Le Times ne publie pas → le Post publie seul → Nixon laisse faire.',
    facts: 'Le Times n’a pas publié. Le Post a publié, il n’est pas poursuivi et tout sort : σ = 1.',
    intuition: ['Le Times n’a pas publié : 0, même si le Post publie à sa place.', 'Le Post publie tout, sans procès : son meilleur cas.', 'Tout sort, sans procès.'],
    eq: ['u_T=0', 'u_W=B_W', 'u_N=-D'],
    course: 'Avec O5, ce sous-jeu dit si les documents seraient sortis sans le Times : c’est la branche ajoutée par l’ébauche du groupe (S6, diapositives 10–13).',
  },
  O7: {
    path: 'Le Times ne publie pas → le Post ne publie pas non plus.',
    facts: 'Personne n’a publié, personne n’est poursuivi et rien ne sort : σ = 0.',
    intuition: ['Le Times n’a pas publié : 0.', 'Le Post n’a pas publié : 0.', 'Rien ne sort et aucun procès : 0, le meilleur cas de Nixon.'],
    eq: ['u_T=0', 'u_W=0', 'u_N=0'],
    course: 'Point de référence : tous les gains se lisent par rapport à « rien ne se passe ». Ajouter une constante aux gains d’un joueur ne change aucun de ses choix.',
  },
};
/* Étape 3 · feuilles sans juge : on applique directement l'équation. */
(function certainLeaves() {
  const P = BASE, O = outcomes(P);
  $('#certain-leaves').innerHTML = OUTCOME_ORDER.filter(id => !COURT_LEAVES.includes(id)).map(id => {
    const d = LEAF_DETAILS[id], situation = SITUATION[LEAVES[id].lottery(P)[0][0]];
    const lines = [0, 1, 2].map(k => `<div class="leaf-player" style="--c:var(${COLORS3[k]})"><div class="leaf-who">${PLAYERS3[k]}</div><p>${subH(d.intuition[k])}</p><div class="leaf-num">${calcLine(situation.sym[k], O[id][k], P)}</div></div>`).join('');
    return `<article class="leaf-card"><div class="leaf-head"><b>${id}</b> · ${TITLE[id].join(' ')} <span class="mono">${vec(O[id])}</span></div><p class="leaf-path">${d.path}</p><p class="leaf-verdicts">${d.facts} Aucun juge n’intervient : le gain est certain.</p>${lines}<p class="course-ref">Cours : ${d.course}</p></article>`;
  }).join('');
})();

/* Étape 4 · feuilles avec procès : verdicts, gains après chaque verdict, moyenne pondérée.
   Étape 5 · tableau final. Les deux suivent les curseurs q et p de la leçon. */
let GP = { ...BASE };
function probabilityCalc(symbol, P) {
  if (symbol === 'q') return '';
  if (symbol === '1 − q') return ` = 1 − ${fr(P.q, 2)}`;
  if (symbol === '(1 − q) × p') return ` = ${fr(1 - P.q, 2)} × ${fr(P.p, 2)}`;
  return ` = ${fr(1 - P.q, 2)} × ${fr(1 - P.p, 2)}`;
}
function renderCourtLeaves() {
  const P = GP, O = outcomes(P), S = situations(P);
  $('#court-leaves').innerHTML = COURT_LEAVES.map(id => {
    const d = LEAF_DETAILS[id], parts = LEAVES[id].lottery(P);
    const bar = `<div class="probbar verdict-bar" role="img" aria-label="Probabilités des verdicts : ${parts.map(([, w, why]) => `${why}, ${pct(w)}`).join(' ; ')}">${parts.filter(([, w]) => w > 1e-9).map(([sit, w]) => `<div style="width:${w * 100}%;background:${VERDICT_COLOR[sit]}">${w > 0.09 ? pct(w) : ''}</div>`).join('')}</div>`;
    const verdicts = `<ul class="verdict-list">${parts.map(([sit, w, why, symbol]) => `<li><span class="dot" style="background:${VERDICT_COLOR[sit]}"></span><span>${capital(why)} : <span class="m">${symbol}</span>${probabilityCalc(symbol, P)} = <b>${pct(w)}</b></span></li>`).join('')}</ul><p class="verdict-total">Total : ${parts.map(([, w]) => pct(w)).join(' + ')} = <b>100 %</b>.</p>`;
    const table = `<div class="scroll-x"><table class="pay verdict-table"><thead><tr><th>Après le verdict</th><th>Probabilité</th><th style="color:var(--nyt)">Times</th><th style="color:var(--wp)">Post</th><th style="color:var(--gov)">Nixon</th></tr></thead><tbody>` +
      parts.map(([sit, w, why]) => `<tr><td><span class="dot" style="background:${VERDICT_COLOR[sit]}"></span> ${capital(why)}</td><td class="v">${pct(w)}</td>${S[sit].map((x, k) => `<td class="v" style="color:var(${COLORS3[k]})">${fr(x, 2)}<small class="m">${subH(SITUATION[sit].sym[k])}</small></td>`).join('')}</tr>`).join('') +
      `<tr class="lottery-total"><td>Gain espéré de la feuille</td><td class="v">100 %</td>${O[id].map((x, k) => `<td class="v" style="color:var(${COLORS3[k]})">${fr(x, 2)}</td>`).join('')}</tr></tbody></table></div>`;
    const lines = [0, 1, 2].map(k => {
      const values = parts.map(([sit]) => S[sit][k]), products = parts.map(([sit, w]) => w * S[sit][k]);
      const weighted = parts.map(([sit, w]) => `${fr(w, 3)} × ${par(S[sit][k])}`).join(' + ');
      const detail = values.every(v => Math.abs(v) < 1e-9) ? `${weighted} = ` : `${weighted} = ${signedSum(products)} = `;
      return `<div class="leaf-player" style="--c:var(${COLORS3[k]})"><div class="leaf-who">${PLAYERS3[k]}</div><p>${subH(d.intuition[k])}</p><div class="leaf-eq"><span class="tex">${esc(d.eq[k])}</span></div><div class="leaf-num">${detail}<b>${fr(O[id][k], 2)}</b></div></div>`;
    }).join('');
    return `<article class="leaf-card court-card" data-leaf="${id}"><div class="leaf-head"><b>${id}</b> · ${TITLE[id].join(' ')} <span class="mono">${vec(O[id])}</span></div><p class="leaf-path">${d.path}</p>` +
      `<div class="geste"><span class="geste-n">1</span>Les verdicts possibles et leurs probabilités</div>${bar}${verdicts}` +
      `<div class="geste"><span class="geste-n">2</span>Les gains après chaque verdict, avec les équations de l’étape 2</div>${table}` +
      `<div class="geste"><span class="geste-n">3</span>On multiplie par les probabilités, puis on additionne</div>${lines}<p class="course-ref">Cours : ${d.course}</p></article>`;
  }).join('');
}
function renderLeafTable() {
  const P = GP, O = outcomes(P);
  const judges = id => { const parts = LEAVES[id].lottery(P); return parts.length === 1 ? 'aucun' : parts.some(([sit]) => sit === 'press') ? '1re et 2e cours' : '1re cour'; };
  $('#leaftable').innerHTML = `<thead><tr><th>Feuille</th><th>Juges</th><th style="text-align:right;color:var(--nyt)">Times</th><th style="text-align:right;color:var(--wp)">Post</th><th style="text-align:right;color:var(--gov)">Nixon</th></tr></thead><tbody>` +
    OUTCOME_ORDER.map(id => `<tr><td class="issue-id">${id} · ${TITLE[id].join(' ')}</td><td>${judges(id)}</td>${O[id].map((x, k) => `<td class="v" style="color:var(${COLORS3[k]})">${fr(x, 2)}</td>`).join('')}</tr>`).join('') + '</tbody>';
  const changed = Math.abs(P.q - BASE.q) > 1e-9 || Math.abs(P.p - BASE.p) > 1e-9;
  $('#leaftable-note').innerHTML = changed
    ? `Tableau calculé avec vos valeurs : <span class="m">q</span> = ${pct(P.q, 0)} et <span class="m">p</span> = ${pct(P.p, 0)}. Le reste du dossier garde les valeurs de référence (${pct(BASE.q, 0)} et ${pct(BASE.p, 0)}).`
    : `Valeurs de référence : <span class="m">q</span> = ${pct(BASE.q, 0)} et <span class="m">p</span> = ${pct(BASE.p, 0)}. Le Times a 0 dans O5, O6 et O7 : il n’y a pas publié.`;
  $('#gain-lab-status').innerHTML = `Quand les deux journaux sont poursuivis, ils gagnent au bout du compte avec la probabilité <span class="m">q + (1 − q) × p</span> = ${fr(P.q, 2)} + ${fr(1 - P.q, 2)} × ${fr(P.p, 2)} = <b>${pct(P.q + (1 - P.q) * P.p)}</b>.`;
}
function syncGainLab() {
  $('#g-q').value = GP.q; $('#g-p').value = GP.p;
  $('#g-qv').textContent = pct(GP.q, 0); $('#g-pv').textContent = pct(GP.p, 0);
  renderCourtLeaves(); renderLeafTable(); renderTex($('#court-leaves'));
}
let gainFrame = 0;
for (const [id, key] of [['g-q', 'q'], ['g-p', 'p']]) $('#' + id).addEventListener('input', event => { GP[key] = +event.target.value; cancelAnimationFrame(gainFrame); gainFrame = requestAnimationFrame(syncGainLab); });
$('#g-reset').addEventListener('click', () => { GP = { ...BASE }; syncGainLab(); });
syncGainLab();
document.querySelectorAll('[data-step-target]').forEach(button => button.addEventListener('click', () => {
  document.getElementById(button.dataset.stepTarget).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}));

/* Formules LaTeX rendues en MathML par Temml (hors ligne). Le source reste lisible si le rendu échoue. */
function renderTex(root = document) {
  if (typeof temml === 'undefined') return;
  root.querySelectorAll('.tex:not([data-rendered])').forEach(el => {
    const source = el.textContent;
    try {
      temml.render(source, el, { displayMode: el.classList.contains('tex-display'), throwOnError: true });
      el.dataset.rendered = '1'; el.setAttribute('title', source);
    } catch (e) { el.textContent = source; el.classList.add('tex-error'); }
  });
}
renderTex();
$('#copy-latex').addEventListener('click', async () => {
  const text = $('#latex-source').textContent, button = $('#copy-latex');
  try { await navigator.clipboard.writeText(text); button.textContent = 'Code copié ✓'; }
  catch (e) { const range = document.createRange(); range.selectNodeContents($('#latex-source')); getSelection().removeAllRanges(); getSelection().addRange(range); button.textContent = 'Sélectionné : Ctrl+C'; }
  setTimeout(() => { button.textContent = 'Copier le code'; }, 2500);
});

// ====================== PAS À PAS ======================
const M0 = solve(BASE);
function buildSteps(P, M) {
  const O = M.O, V = M.V, t = M.th;
  const cmp = (a, la, b, lb, verdict) => `<div class="cmp"><span class="opt ${a >= b ? 'win' : ''}">${la} : <b>${fr(a, 2)}</b></span> ${a > b ? '&gt;' : a < b ? '&lt;' : '='} <span class="opt ${a < b ? 'win' : ''}">${lb} : <b>${fr(b, 2)}</b></span><span class="verdict">⇒ ${verdict}</span></div>`;
  const ui = s => `<p class="ui" style="font-size:15px">${s}</p>`;
  return [
    ['Le principe', `<p>On part de la <b>fin</b> du jeu. À chaque nœud, on garde le <b>meilleur choix</b> du joueur qui décide, en comparant <b>sa</b> composante, et on reporte le triplet de gains. Les juges ne sont pas des joueurs : ils n’ont pas de nœud, leurs verdicts sont déjà dans les gains des feuilles (gains espérés). On traite la branche « le Times publie » (x3 → x1), puis la branche « le Times se tait » (x5 → x4), et on finit par le Times (x0).</p>`],
    ['Étape 1 · x3, Nixon face au Post', cmp(O.O1[2], 'Poursuivre (O1)', O.O2[2], 'Laisser faire (O2)', M.g2Sue ? 'il poursuit' : 'il laisse faire') + `<div class="eq"><span class="m">(1 − p)(1 − θ)D &gt; k<sub>W</sub></span> ⟺ <span class="m">p &lt; 1 − <span class="frac"><span>k<sub>W</sub></span><span>(1 − θ)D</span></span></span> ≈ ${pct(t.gPost)} &nbsp;·&nbsp; ici ${dec(1 - P.p)} × ${dec(1 - P.th)} × ${fr(P.D)} = <b>${fr(t.kWcred)}</b> ${t.kWcred > P.k_W ? '&gt;' : '≤'} ${fr(P.k_W)}</div>` + ui(`O1 contient les verdicts : ${dec(P.q)} × (1re cour favorable au Times) + ${dec((1 - P.q) * P.p)} × (victoire des journaux) + ${dec((1 - P.q) * (1 - P.p))} × (censure confirmée). Le dommage encore évitable en espérance (${fr(t.kWcred)}) dépasse le coût du procès (${fr(P.k_W)}) : la menace contre le Post est <b>crédible</b>.`)],
    ['Étape 2 · x2, le Post en relais', cmp(V.x3[1], 'Publier', O.O3[1], 'Ne pas publier (O3)', M.wPub ? 'il publie, de justesse' : 'il se tait') + `<div class="eq"><span class="m">p(B<sub>W</sub> − c<sub>W</sub>) + (1 − p)(θB<sub>W</sub> − c<sub>W</sub> − S<sub>W</sub>) ≥ 0</span> ⟺ <span class="m">p ≥ <span class="frac"><span>c<sub>W</sub> + S<sub>W</sub> − θB<sub>W</sub></span><span>(1 − θ)B<sub>W</sub> + S<sub>W</sub></span></span></span> = <span class="frac"><span>${fr(P.c_W + P.S_W - P.th * P.B_W)}</span><span>${fr((1 - P.th) * P.B_W + P.S_W)}</span></span> ≈ <b>${pct(t.tauW)}</b></div>` + ui(`Publier rapporte ${fr(V.x3[1], 2)} = ${dec(1 - P.q)} × ${fr(V.x3[1] / (1 - P.q), 2)} : dans ${pct(P.q, 0)} des cas, le juge refuse de censurer le Times et le choix du Post ne change rien pour lui. Avec ${pct(P.p, 0)} de chances à la Cour suprême, le Post est juste au-dessus de son seuil : une décision risquée.`)],
    ['Étape 3 · x1, Nixon face au Times', cmp(V.x2[2], 'Poursuivre', O.O4[2], 'Laisser faire (O4)', M.g1Sue ? 'il poursuit' : 'il laisse faire') + `<div class="eq"><span class="m">k<sub>T</sub> + (1 − q)k<sub>W</sub> &lt; (1 − q)(1 − p)(1 − θ)D</span> &nbsp;·&nbsp; ici ${fr(P.k_T)} + ${dec(1 - P.q)} × ${fr(P.k_W)} = <b>${fr(t.totalCost)}</b> &lt; <b>${fr(t.avoided)}</b></div>` + ui('Ce premier procès n’a de sens que parce que Nixon est prêt à aller jusqu’au bout contre le Post. Sinon, le Post publierait sans risque et poursuivre le Times ne servirait à rien.')],
    ['Étape 4 · x5, Nixon face au Post seul', cmp(O.O5[2], 'Poursuivre (O5)', O.O6[2], 'Laisser faire (O6)', M.g3Sue ? 'il poursuivrait' : 'il laisserait faire') + `<div class="eq"><span class="m">(1 − q)(1 − θ)D &gt; k<sub>W</sub></span> &nbsp;·&nbsp; ici ${dec(1 - P.q)} × ${fr(t.free)} = <b>${fr((1 - P.q) * t.free)}</b> &gt; ${fr(P.k_W)}</div>` + ui('On passe à la branche que l’histoire n’a pas suivie : le Times a renoncé. O5 contient le verdict du juge local : 30 % de refus, 70 % de censure du Post.')],
    ['Étape 5 · x4, le Post seul', cmp(V.x5[1], 'Publier', O.O7[1], 'Ne pas publier (O7)', M.wAlone ? 'il publierait' : 'il se tairait') + `<div class="eq"><span class="m">q(B<sub>W</sub> − c<sub>W</sub>) + (1 − q)(θB<sub>W</sub> − c<sub>W</sub> − S<sub>W</sub>) ≥ 0</span> ⟺ <span class="m">q ≥ ${pct(t.tauW)}</span> &nbsp;·&nbsp; ici <span class="m">q</span> = ${pct(P.q, 0)}</div>` + ui('Seul, le Post affronterait un juge local qui censure 7 fois sur 10, sans espoir rapide de Cour suprême. Il ne publierait pas : <b>sans le Times, rien ne sortirait</b>.')],
    ['Étape 6 · x0, le Times', cmp(V.x1[0], 'Publier', V.x4[0], 'Ne pas publier', M.tPub ? 'il publie' : 'il renonce') + ui(`Ne pas publier lui rapporte 0, quoi que fasse ensuite le Post : un journal qui ne publie pas n’a ni gain ni perte. Il publie parce que ses chances de gagner au bout du compte (30 % devant le juge, puis 65 % à la Cour suprême grâce au relais du Post : ${pct(P.q + (1 - P.q) * P.p)}) dépassent largement son seuil de ${pct(t.tauT, 0)}.`)],
    ['L’ENPS', `<div class="chips"><span class="chip" style="--c:var(--nyt)">Times : publier</span><span class="chip" style="--c:var(--wp)">Post : (publier en relais ; se taire seul)</span><span class="chip" style="--c:var(--gov)">Nixon : (poursuivre le Times ; poursuivre le Post ; poursuivre le Post seul)</span></div>` + ui(`Une stratégie dit quoi faire à <b>chaque</b> nœud, même non atteint (x4, x5). Gains espérés à l'équilibre : Times <b>${fr(M.root[0], 2)}</b> · Post <b>${fr(M.root[1], 2)}</b> · Nixon <b>${fr(M.root[2], 2)}</b>. L’ENPS est unique ; on compte pourtant 4 équilibres de Nash, qui ne diffèrent que par des actions hors du chemin (x4, x5).`)],
    ['1971 : le chemin suivi', ui('Le chemin d’équilibre mène à la feuille <b>O1</b> : le Times publie, Nixon le poursuit, le Post prend le relais, Nixon le poursuit aussi. Ensuite, les juges : le 15 juin, le juge local suspend le Times (70 % dans le modèle) ; le 30 juin, la Cour suprême donne raison aux journaux (65 % dans le modèle).') + ui(`Dans la feuille O1, trois verdicts étaient possibles : juge favorable au Times <b>${pct(M.situ.judgeTimes)}</b>, victoire des journaux à la Cour suprême <b>${pct(M.situ.press)}</b>, censure confirmée et sanctions <b>${pct(M.situ.gov)}</b> (près d'une chance sur quatre).`)],
  ];
}
const STEPS = buildSteps(BASE, M0);
let step = 0, reduceTree = true;
const LAST_NODE_STEP = INDUCTION_ORDER.length;
function renderStep() {
  $('#st-card').innerHTML = `<div class="ttl">${STEPS[step][0]}</div>${STEPS[step][1]}`;
  $('#st-dots').innerHTML = STEPS.map((s, i) => `<button type="button" aria-label="${esc(s[0])}" ${i === step ? 'aria-current="step"' : ''} data-i="${i}">${i === 0 ? '·' : i <= LAST_NODE_STEP ? i : i === LAST_NODE_STEP + 1 ? 'É' : '71'}</button>`).join('');
  let options = {};
  if (step >= 1 && step <= LAST_NODE_STEP) {
    const node = INDUCTION_ORDER[step - 1], solvedNow = INDUCTION_ORDER.slice(0, step);
    options = reduceTree ? { root: node, reduce: true, solved: solvedNow, focus: node } : { solved: solvedNow, values: true, focus: node };
  } else if (step > LAST_NODE_STEP) options = { eq: true, values: true, probs: step === STEPS.length - 1, path: step === STEPS.length - 1 ? 'O1' : null };
  drawTree($('#tree-step'), BASE, { mode: 'num', ...options });
  $('#st-prev').disabled = step === 0; $('#st-next').disabled = step === STEPS.length - 1;
  $('#reduction-toggle').setAttribute('aria-pressed', String(reduceTree));
  $('#reduction-toggle').textContent = reduceTree ? 'Voir l’arbre entier' : 'Isoler le calcul courant';
  $('#reduction-caption').textContent = step >= 1 && step <= LAST_NODE_STEP && reduceTree
    ? 'Sous-jeu courant : les suites déjà résolues sont remplacées par leurs profils de gains. La composante du joueur qui décide est encadrée. On remonte ensuite d’un nœud.'
    : step > LAST_NODE_STEP ? 'Les décisions forment un plan complet. Les verdicts des juges restent incertains : ils sont dans les gains espérés des feuilles, pas dans l’ENPS.'
    : 'Construire : du nœud initial vers les feuilles. Résoudre : des derniers sous-jeux vers le nœud initial.';
  frameTreeRoot($('#tree-step'));
}
$('#st-dots').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { step = +b.dataset.i; renderStep(); } });
$('#st-prev').onclick = () => { if (step > 0) { step--; renderStep(); } };
$('#st-next').onclick = () => { if (step < STEPS.length - 1) { step++; renderStep(); } };
$('#reduction-toggle').addEventListener('click', () => { reduceTree = !reduceTree; renderStep(); });

// ====================== ARBRE GUIDÉ ======================
/* Une lecture guidée de la forme étendue, d’après S6, diapositives 8–18. */
const TREE_GUIDE_STEPS = [
  ['x₀ · Le Times', 'Le Times joue en premier : publier ou ne pas publier. Aucune des deux branches ne se termine encore : quoi que fasse le Times, quelqu’un joue après lui. Si le Times se tait, Ellsberg peut se tourner vers le Post.'],
  ['x₁ · Nixon face au Times', 'Après la publication, l’administration Nixon poursuit le Times ou laisse faire. Laisser faire termine le jeu en O4 : tout sort, sans procès. Chaque nœud de Nixon sera distinct : on ne fusionne pas ses décisions.'],
  ['x₂ · Le Post, en relais', 'Nixon a poursuivi le Times ; Ellsberg remet les documents au Post. Ne pas publier mène en O3 : Times censuré, Post muet. Le juge local n’a pas de nœud : ce n’est pas un joueur. Son verdict est dans les gains de O3 (30 % de chances qu’il refuse finalement la censure).'],
  ['x₃ · Nixon face au Post', 'Poursuivre mène en O1, « Procès du Post + tribunaux » : ses gains sont la moyenne des verdicts possibles des juges. Laisser faire mène en O2 : le Post publie, tout sort. La branche « le Times publie » est complète : quatre feuilles.'],
  ['x₄ · Le Post, si le Times se tait', 'Retour à la racine : si le Times renonce, le Post peut publier seul. Ne pas publier mène en O7 : rien ne sort. Le Post a maintenant deux nœuds : sa stratégie devra préciser une action à chacun.'],
  ['x₅ · Nixon face au Post seul', 'Poursuivre mène en O5 : un juge local tranche, et son verdict est dans les gains. Laisser faire mène en O6 : le Post publie seul. L’arbre est complet : six nœuds de décision, sept feuilles, et aucun nœud pour les juges.'],
];
const TREE_PATHS = {
  O1: ['Le Times publie → Nixon poursuit → le Post publie → Nixon poursuit → les tribunaux tranchent.', 'Deux procès ; gains espérés selon les verdicts.'],
  O2: ['Le Times publie → Nixon poursuit → le Post publie → Nixon laisse faire.', 'Un procès ; le Post diffuse les documents.'],
  O3: ['Le Times publie → Nixon poursuit → le Post se tait.', 'Un procès ; si le juge censure, publication partielle seulement.'],
  O4: ['Le Times publie → Nixon laisse faire.', 'Aucun procès.'],
  O5: ['Le Times renonce → le Post publie seul → Nixon poursuit → un juge local tranche.', 'Un procès contre le Post seul.'],
  O6: ['Le Times renonce → le Post publie seul → Nixon laisse faire.', 'Aucun procès ; le Post publie seul.'],
  O7: ['Le Times renonce → le Post renonce aussi.', 'Aucune publication.'],
};
$('#tree-path').insertAdjacentHTML('beforeend', OUTCOME_ORDER.map(k => `<option value="${k}">${k} · ${TITLE[k].join(' ')}</option>`).join(''));
let treeView = 'build', buildStage = 1, treePath = '', subgameRoot = 'x2';
function frameTreeRoot(svg, nodeId) {
  requestAnimationFrame(() => {
    const wrap = svg.closest('.tree-wrap');
    if (!wrap || !wrap.clientWidth) return;
    const group = (nodeId && svg.querySelector(`[data-node="${nodeId}"]`)) || svg.querySelector('[data-node]');
    const marker = group && group.querySelector('circle, rect');
    if (!marker) return;
    const x = marker.tagName.toLowerCase() === 'circle' ? Number(marker.getAttribute('cx')) : Number(marker.getAttribute('x')) + Number(marker.getAttribute('width')) / 2;
    wrap.scrollLeft = Math.max(0, x * svg.getBoundingClientRect().width / svg.viewBox.baseVal.width - wrap.clientWidth / 2);
  });
}
function renderMain() {
  const options = { mode: 'num' };
  if (treeView === 'build') options.built = NODE_ORDER.slice(0, buildStage);
  if (treeView === 'full' && treePath) options.path = treePath;
  if (treeView === 'post') options.root = subgameRoot;
  drawTree($('#tree-main'), BASE, options);
  document.querySelectorAll('[data-tree-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.treeView === treeView)));
  document.querySelectorAll('[data-subgame]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.subgame === subgameRoot)));
  $('#tree-build-controls').hidden = treeView !== 'build'; $('#tree-path-control').hidden = treeView !== 'full'; $('#tree-sub-control').hidden = treeView !== 'post';
  $('#build-count').textContent = buildStage + ' / ' + TREE_GUIDE_STEPS.length; $('#build-prev').disabled = buildStage === 1; $('#build-next').disabled = buildStage === TREE_GUIDE_STEPS.length;
  let title, copy;
  if (treeView === 'build') [title, copy] = TREE_GUIDE_STEPS[buildStage - 1];
  else if (treeView === 'post') {
    title = 'Un sous-jeu contient toutes les suites possibles.';
    copy = subgameRoot === 'x2'
      ? 'On part de x₂, où le Post décide après la poursuite du Times, et on conserve ses deux actions et tout ce qui suit. Un seul chemin vers O1 ne serait pas un sous-jeu. Les coûts déjà engagés (le procès du Times) restent inclus dans les gains affichés.'
      : 'On part de x₄, où le Post décide si le Times a renoncé. Ce sous-jeu n’est jamais atteint en 1971, mais l’ENPS exige d’y prévoir une conduite optimale : c’est lui qui dit ce que vaut, pour le Times, le fait de se taire.';
  } else if (treePath) { title = treePath + ' · ' + TREE_PATHS[treePath][1]; copy = TREE_PATHS[treePath][0] + ' On lit ici une histoire possible : la mettre en évidence ne signifie pas que c’est un équilibre.'; }
  else { title = 'Sept feuilles, sept histoires possibles.'; copy = 'Partez du Times et descendez jusqu’à une feuille. Chaque feuille reçoit trois gains, dans l’ordre Times / Post / Nixon. Quand un procès a lieu, ce sont des gains espérés : les verdicts des juges y sont déjà intégrés.'; }
  $('#tree-guide-copy').innerHTML = '<h3>' + title + '</h3><p>' + copy + '</p>';
  frameTreeRoot($('#tree-main'), treeView === 'build' ? NODE_ORDER[buildStage - 1] : null);
}
document.querySelectorAll('[data-tree-view]').forEach(button => button.addEventListener('click', () => { treeView = button.dataset.treeView; renderMain(); }));
document.querySelectorAll('[data-subgame]').forEach(button => button.addEventListener('click', () => { subgameRoot = button.dataset.subgame; renderMain(); }));
$('#build-prev').addEventListener('click', () => { buildStage = Math.max(1, buildStage - 1); renderMain(); });
$('#build-next').addEventListener('click', () => { buildStage = Math.min(TREE_GUIDE_STEPS.length, buildStage + 1); renderMain(); });
$('#tree-path').addEventListener('change', e => { treePath = e.target.value; renderMain(); });
let treeBeforePrint;
window.addEventListener('beforeprint', () => { treeBeforePrint = { treeView, treePath, reduceTree }; treeView = 'full'; treePath = ''; reduceTree = false; renderMain(); renderStep(); });
window.addEventListener('afterprint', () => { if (treeBeforePrint) { ({ treeView, treePath, reduceTree } = treeBeforePrint); renderMain(); renderStep(); } });
/* Questions de contrôle avant d’appliquer la méthode à tous les nœuds. */
document.querySelectorAll('[data-checkpoint]').forEach(box => {
  box.addEventListener('click', event => {
    const button = event.target.closest('[data-answer]'); if (!button) return;
    const correct = button.dataset.answer === box.dataset.correct;
    const response = box.querySelector('.checkpoint-feedback');
    response.textContent = correct ? box.dataset.explanation : 'Reprenez la règle : à un nœud de décision, on compare uniquement les gains du joueur qui décide, en gardant le même ordre des composantes.';
    response.hidden = false;
    box.querySelectorAll('[data-answer]').forEach(b => { b.classList.toggle('checkpoint-correct', correct && b === button); b.setAttribute('aria-pressed', String(b === button)); });
  });
});

// ====================== CARTE ======================
const hatchBg = r => REG[r].hatch ? `background-image:repeating-linear-gradient(135deg, color-mix(in srgb, var(--ok) 45%, transparent) 0 2px, transparent 2px 9px);` : '';
function drawMap(box, P, marker) {
  const cv = box.querySelector('canvas'), g = cv.getContext('2d'), N = 130, W = cv.width, cell = W / N;
  const mapKey = JSON.stringify([Object.entries(P).filter(([k]) => k !== 'q' && k !== 'p'), ['--reg-none', '--reg-alone', '--reg-nosuit', '--reg-nyt', '--reg-both', '--ok', '--ink', '--ink2'].map(css), document.fonts?.status]);
  if (cv._mapKey === mapKey && cv._mapRaster) g.putImageData(cv._mapRaster, 0, 0);
  else {
    const grid = [], nc = [];
    for (let j = 0; j < N; j++) { grid.push([]); nc.push([]); for (let i = 0; i < N; i++) { const q = (i + 0.5) / N, p = 1 - (j + 0.5) / N; const M = solve({ ...P, q, p }); grid[j].push(M.regime); nc[j].push(regKey(M) === 'NC'); } }
    const cols = {}; for (const r in REG) cols[r] = css(REG[r].css);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { g.fillStyle = cols[grid[j][i]]; g.fillRect(Math.floor(i * cell), Math.floor(j * cell), Math.ceil(cell) + 1, Math.ceil(cell) + 1); }
    g.save(); g.beginPath();
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (nc[j][i]) g.rect(i * cell, j * cell, cell + 0.6, cell + 0.6);
    g.clip(); g.strokeStyle = css('--ok'); g.globalAlpha = 0.45; g.lineWidth = 2;
    for (let d = -W; d < W; d += 12) { g.beginPath(); g.moveTo(d, W); g.lineTo(d + W, 0); g.stroke(); }
    g.restore(); g.globalAlpha = 1;
    g.fillStyle = css('--ink');
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      if (i < N - 1 && grid[j][i] !== grid[j][i + 1]) g.fillRect((i + 1) * cell - 1, j * cell, 2, cell + 1);
      if (j < N - 1 && grid[j][i] !== grid[j + 1][i]) g.fillRect(i * cell, (j + 1) * cell - 1, cell + 1, 2);
    }
    g.strokeStyle = css('--ink2'); g.globalAlpha = 0.25; g.lineWidth = 1;
    for (let k = 1; k < 4; k++) { const x = W * k / 4; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, W); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(W, x); g.stroke(); }
    g.globalAlpha = 1;
    g.font = '600 15px "IBM Plex Mono", monospace'; g.fillStyle = css('--ink2');
    ['0', '25 %', '50 %', '75 %'].forEach((t, k) => { g.fillText(t, W * k / 4 + 5, W - 7); if (k) g.fillText(t, 5, W - W * k / 4 - 6); });
    cv._mapRaster = g.getImageData(0, 0, W, W); cv._mapKey = mapKey;
  }
  if (marker) {
    const x = P.q * W, y = (1 - P.p) * W;
    g.beginPath(); g.arc(x, y, 11, 0, 7); g.fillStyle = css('--stamp'); g.fill(); g.lineWidth = 4; g.strokeStyle = css('--surface'); g.stroke();
    g.font = '700 17px "IBM Plex Mono", monospace'; g.fillStyle = css('--ink'); g.fillText(marker, Math.min(x + 16, W - 70), Math.max(y - 12, 20));
  }
}
function legend(el, P) {
  const M = solve(P);
  el.innerHTML = Object.entries(REG).map(([k, r]) => `<div><span class="sw" style="background-color:var(${r.css});${hatchBg(k)}"></span><b>${r.label}</b><div class="small ui" style="margin-left:26px">${r.long}</div></div>`).join('') +
    `<div class="note" style="margin-top:6px"><p>${thresholdText('post', M)}</p><p style="margin-top:8px">${thresholdText('government', M)}</p></div>`;
}
function hookMap(box, getP, onPick) {
  const cv = box.querySelector('canvas'), tip = box.querySelector('.tip');
  const at = e => { const r = cv.getBoundingClientRect(); return [clamp01((e.clientX - r.left) / r.width), clamp01(1 - (e.clientY - r.top) / r.height), e.clientX - box.getBoundingClientRect().left, e.clientY - box.getBoundingClientRect().top]; };
  cv.addEventListener('pointermove', e => {
    const [q, p, x, y] = at(e); const M = solve({ ...getP(), q, p });
    tip.innerHTML = `<b>q = ${pct(q, 0)} · p = ${pct(p, 0)}</b><br>${REG[regKey(M)].label}<br>Tout sort avec la probabilité ${pct(M.full, 0)}`;
    tip.style.left = Math.max(0, Math.min(x + 14, box.clientWidth - 225)) + 'px'; tip.style.top = (y + 14) + 'px'; tip.style.opacity = 1;
  });
  cv.addEventListener('pointerleave', () => { tip.style.opacity = 0; });
  if (onPick) cv.addEventListener('click', e => { const [q, p] = at(e); onPick(Math.round(q * 100) / 100, Math.round(p * 100) / 100); });
}
(function thresholdCards() {
  const t = M0.th, P = BASE, m = s => `<span class="m">${s}</span>`;
  const cards = [
    ['--wp', 'Le Post publie en relais', `${m('p ≥ <span class="frac"><span>c<sub>W</sub> + S<sub>W</sub> − θB<sub>W</sub></span><span>(1 − θ)B<sub>W</sub> + S<sub>W</sub></span></span>')} = <span class="frac"><span>${fr(P.c_W + P.S_W - P.th * P.B_W)}</span><span>${fr((1 - P.th) * P.B_W + P.S_W)}</span></span> ≈ <b>${pct(t.tauW)}</b>`, 'si Nixon le poursuivrait ; sinon il publie toujours.'],
    ['--wp', 'Le Post publie seul', `${m('q')} ≥ <b>${pct(t.tauW)}</b>`, 'même seuil, mais face au juge local : sans second journal, pas de Cour suprême en urgence.'],
    ['--nyt', 'Le Times publie', `${m('π ≥ <span class="frac"><span>c<sub>T</sub> + S<sub>T</sub> − θB<sub>T</sub></span><span>(1 − θ)B<sub>T</sub> + S<sub>T</sub></span></span>')} = <span class="frac"><span>${fr(P.c_T + P.S_T - P.th * P.B_T)}</span><span>${fr((1 - P.th) * P.B_T + P.S_T)}</span></span> = <b>${pct(t.tauT)}</b>`, `π = q + (1 − q)p = ${pct(P.q + (1 - P.q) * P.p)} si le Post prend le relais ; π = q = ${pct(P.q, 0)} sinon. S’il ne publie pas, il a 0 : il publie donc dès que son gain espéré est positif.`],
    ['--gov', 'Nixon attaque le Post', `${m('(1 − p)(1 − θ)D &gt; k<sub>W</sub>')} ⟺ ${m('p &lt; 1 − <span class="frac"><span>k<sub>W</sub></span><span>(1 − θ)D</span></span>')} ≈ <b>${pct(t.gPost)}</b>`, `en relais ; face au Post seul, il suffit que ${m('q')} &lt; ${pct(t.gPost)}.`],
    ['--gov', 'Nixon attaque le Times', `${m('q &lt; 1 − <span class="frac"><span>k<sub>T</sub></span><span>(1 − p)(1 − θ)D − k<sub>W</sub></span></span>')} ≈ <b>${pct(t.gTimesRelay)}</b> (avec ${m('p')} = ${pct(P.p, 0)})`, `si le Post prendrait le relais et serait poursuivi ; ${m('q')} &lt; ${pct(t.gTimesSilent)} si le Post se tairait ; jamais si le Post publierait sans être poursuivi.`],
    ['--ok', 'Le coût total des procès', `${m('k<sub>T</sub> + (1 − q)k<sub>W</sub> &lt; (1 − q)(1 − p)(1 − θ)D')}`, `${fr(t.totalCost)} &lt; ${fr(t.avoided)} : les deux procès coûtent, en espérance, moins que le dommage qu’ils évitent.`],
  ];
  $('#threshold-cards').innerHTML = cards.map(([c, t1, f, k]) => `<div class="card"><div class="tag" style="color:var(${c})">${t1}</div><div class="k">${f}</div><div class="k">${k}</div></div>`).join('');
})();

// ====================== BANDES DE RÉGIME ======================
const STRIPS = [
  ['k_W', 'Coût du procès contre le Post pour Nixon (k<sub>W</sub>)', 0, 80],
  ['k_T', 'Coût du procès contre le Times pour Nixon (k<sub>T</sub>)', 0, 40],
  ['c_W', 'Frais de procès du Post (c<sub>W</sub>)', 0, 60],
  ['S_W', 'Sanction du Post si sa censure est maintenue (S<sub>W</sub>)', 0, 400],
  ['c_T', 'Frais de procès du Times (c<sub>T</sub>)', 0, 120],
  ['S_T', 'Sanction du Times si sa censure est maintenue (S<sub>T</sub>)', 0, 400],
];
function drawStrips(fig, P, interactive) {
  fig.innerHTML = STRIPS.map(([k, lab, mn, mx]) => {
    const n = 400; const segs = []; let prev = null, start = mn, lastV = mn;
    const keyAt = v => regKey(solve({ ...P, [k]: v }));
    for (let i = 0; i <= n; i++) {
      const v = mn + (mx - mn) * i / n; const r = keyAt(v);
      if (r !== prev) {
        let b = v;
        if (prev) { let lo = lastV, hi = v; for (let it = 0; it < 30; it++) { const mid = (lo + hi) / 2; if (keyAt(mid) === prev) lo = mid; else hi = mid; } b = hi; segs.push([start, b, prev]); }
        prev = r; start = b;
      }
      lastV = v;
    }
    segs.push([start, mx, prev]);
    const val = P[k];
    const bars = segs.map(([a, b, r]) => `<div style="width:${(b - a) / (mx - mn) * 100}%;background-color:var(${REG[r].css});${hatchBg(r)}" title="${REG[r].label}">${(b - a) / (mx - mn) > 0.16 ? REG[r].label.replace(' (comme en 1971)', '').replace('Sans procès · ', '') : ''}</div>`).join('');
    const ticks = segs.slice(1).map(([a]) => `<span style="left:${(a - mn) / (mx - mn) * 100}%">${fr(a, 1)}</span>`).join('');
    return `<div class="strip" data-k="${k}"><div class="lab"><span>${lab}</span><span class="mono">valeur : ${fr(val, 1)}</span></div><div class="bar" ${interactive ? 'style="cursor:pointer"' : ''} data-min="${mn}" data-max="${mx}">${bars}<span class="mk" style="left:${Math.min(100, (val - mn) / (mx - mn) * 100)}%"></span></div><div class="ticks">${ticks}</div></div>`;
  }).join('');
}

// ====================== LABORATOIRE ======================
const SL = [
  ['Juges · pas des joueurs', '--nat', [['q', '1re cour : le juge local refuse la censure (q)', 0, 1, 0.01, 'pct'], ['p', '2e cour : la Cour suprême donne raison aux journaux (p)', 0, 1, 0.01, 'pct'], ['th', 'Part publiée avant une censure (θ)', 0, 0.95, 0.01, 'dec']]],
  ['New York Times', '--nyt', [['B_T', 'Gain si tout est publié (B<sub>T</sub>)', 0, 300, 1], ['c_T', 'Frais de procès (c<sub>T</sub>)', 0, 120, 1], ['S_T', 'Sanction si censure maintenue (S<sub>T</sub>)', 0, 400, 1]]],
  ['Washington Post', '--wp', [['B_W', 'Gain si tout est publié (B<sub>W</sub>)', 0, 300, 1], ['c_W', 'Frais de procès (c<sub>W</sub>)', 0, 120, 1], ['S_W', 'Sanction si censure maintenue (S<sub>W</sub>)', 0, 400, 1]]],
  ['Administration Nixon', '--gov', [['D', 'Dommage si tout sort (D)', 0, 500, 1], ['k_T', 'Coût du procès contre le Times (k<sub>T</sub>)', 0, 120, 1], ['k_W', 'Coût du procès contre le Post (k<sub>W</sub>)', 0, 120, 1]]],
];
const PRESETS = {
  '1971': ['1971 · scénario de référence', {}],
  peur: ['Le Post prend peur', { p: 0.5 }],
  sanction: ['Sanction du Post à 250', { S_W: 250 }],
  renonce: ['Le Times renonce', { c_T: 80 }],
  hostile: ['Tribunaux hostiles', { q: 0.2, p: 0.5 }],
  cher: ['Procès du Post trop cher', { k_W: 40 }],
  noncred: ['Menace non crédible', { k_W: 60 }],
  cour: ['Cour suprême acquise', { p: 0.9 }],
  juge: ['Juge local favorable', { q: 0.8 }],
  seul: ['Le Post publie seul', { q: 0.65, p: 0.5, c_T: 30, S_T: 150 }],
  nash: ['Menace crue à tort', { p: 0.5, k_W: 80 }],
};
let LP = { ...BASE, ...(saved || {}) };
const fmtP = (k, v) => { const meta = SL.flatMap(g => g[2]).find(s => s[0] === k); return meta && meta[5] === 'pct' ? pct(v, 0) : meta && meta[5] === 'dec' ? fr(v, 2) : fr(v, 0); };
$('#sliders').innerHTML = SL.map(([g, c, list]) => `<div class="sgroup"><div class="tag" style="color:var(${c})"><span class="dot" style="background:var(${c})"></span>${g}</div>` + list.map(([k, lab, mn, mx, st]) => `<div class="sl"><label for="s-${k}">${lab}</label><output id="o-${k}"></output><input type="range" id="s-${k}" min="${mn}" max="${mx}" step="${st}" data-k="${k}"></div>`).join('') + '</div>').join('');
$('#presets').innerHTML = Object.entries(PRESETS).map(([id, [lab]]) => `<button type="button" class="btn sm ghost" data-p="${id}">${lab}</button>`).join('');
function setLab(over) { LP = { ...BASE, ...over }; syncSliders(); renderLab(); }
function syncSliders() { document.querySelectorAll('#sliders input').forEach(i => { i.value = LP[i.dataset.k]; $('#o-' + i.dataset.k).textContent = fmtP(i.dataset.k, LP[i.dataset.k]); }); }
let labFrame = 0;
$('#sliders').addEventListener('input', e => { const k = e.target.dataset.k; if (!k) return; LP[k] = +e.target.value; $('#o-' + k).textContent = fmtP(k, LP[k]); cancelAnimationFrame(labFrame); labFrame = requestAnimationFrame(() => renderLab()); });
$('#presets').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setLab(PRESETS[b.dataset.p][1]); });
document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => { setLab(PRESETS[b.dataset.preset][1]); window.Papers.navigate('labo'); }));
$('#strips2').addEventListener('click', e => {
  const bar = e.target.closest('.bar'); if (!bar) return; const k = bar.parentElement.dataset.k;
  const r = bar.getBoundingClientRect(); const v = +bar.dataset.min + (+bar.dataset.max - +bar.dataset.min) * clamp01((e.clientX - r.left) / r.width);
  LP[k] = Math.round(v); syncSliders(); renderLab();
});
function explain(P, M) {
  const O = M.O, V = M.V, L = [], sign = (a, b) => Math.abs(a - b) < 1e-9 ? '=' : a > b ? '&gt;' : '&lt;';
  L.push(`Face au Post (x3), Nixon ${M.g2Sue ? '<b>poursuivrait</b>' : '<b>laisserait faire</b>'} : ${fr(O.O1[2], 2)} en poursuivant (O1, gains espérés avec les verdicts) ${sign(O.O1[2], O.O2[2])} ${fr(O.O2[2], 2)} sans procès (O2). ${thresholdText('government', M)}`);
  L.push(`Le Post en relais (x2) ${M.wPub ? '<b>publierait</b>' : '<b>se tairait</b>'} : publier lui rapporterait ${fr(V.x3[1], 2)} ${sign(V.x3[1], O.O3[1])} ${fr(O.O3[1], 2)}. ${thresholdText('post', M)}`);
  L.push(`Face au Times (x1), Nixon ${M.g1Sue ? '<b>poursuit</b>' : '<b>laisse faire</b>'} : ${fr(V.x2[2], 2)} en poursuivant ${sign(V.x2[2], O.O4[2])} ${fr(O.O4[2], 2)} sans procès.${!M.g1Sue && M.wPub && !M.g2Sue ? ' Poursuivre le Times ne servirait à rien : le Post publierait sans risque.' : ''}`);
  L.push(`Si le Times se taisait : Nixon ${M.g3Sue ? 'poursuivrait' : 'laisserait faire'} le Post seul (x5) et le Post ${M.wAlone ? '<b>publierait seul</b>' : '<b>se tairait</b>'} (x4), d’où ${vec(V.x4)}.`);
  L.push(`Le Times (x0) ${M.tPub ? '<b>publie</b>' : '<b>ne publie pas</b>'} : ${fr(V.x1[0], 2)} en publiant ${sign(V.x1[0], V.x4[0])} ${fr(V.x4[0], 2)} en se taisant.${!M.tPub ? ' Un journal qui ne publie pas a 0 : le Times renonce dès que publier lui rapporterait moins.' : ''}`);
  return L.map((t, i) => `<div class="ln"><b class="n">${i + 1}</b><span>${t}</span></div>`).join('') +
    `<div class="note ${M.full > 0.5 ? 'green' : 'red'}" style="margin-top:6px">Une fois les juges passés, probabilité que tout sorte : <b>${pct(M.full)}</b>. Probabilité que l'essentiel reste secret : <b>${pct(1 - M.full)}</b>.</div>`;
}
const PC = VERDICT_COLOR;
function renderLab() {
  const M = drawTree($('#tree-lab'), LP, { mode: 'num', eq: true, probs: true, values: true });
  const reg = $('#lab-regime'), key = regKey(M); reg.textContent = REG[key].label; reg.style.background = `var(${REG[key].css})`;
  $('#lab-strat').innerHTML = `<span class="chip" style="--c:var(--nyt)">Times : ${M.tPub ? 'publier' : 'ne pas publier'}</span><span class="chip" style="--c:var(--wp)">Post : (${M.wPub ? 'publier' : 'se taire'} en relais ; ${M.wAlone ? 'publier' : 'se taire'} seul)</span><span class="chip" style="--c:var(--gov)">Nixon : (${M.g1Sue ? 'poursuivre' : 'laisser faire'} le Times ; ${M.g2Sue ? 'poursuivre' : 'laisser faire'} le Post ; ${M.g3Sue ? 'poursuivre' : 'laisser faire'} le Post seul)</span>`;
  const leaf = OUTCOME_ORDER.find(k => M.probs[k] > 0.5);
  const ent = Object.entries(M.situ).filter(([, v]) => v > 1e-9);
  $('#lab-leaf').innerHTML = `Feuille atteinte : <b>${leaf} · ${TITLE[leaf].join(' ')}</b>. ${ent.length > 1 ? 'Les juges décident ensuite :' : ''}`;
  $('#lab-prob').innerHTML = ent.map(([k, v]) => `<div style="width:${v * 100}%;background:${PC[k]}">${v > 0.07 ? pct(v) : ''}</div>`).join('');
  $('#lab-problab').innerHTML = ent.map(([k, v]) => `<span><span class="dot" style="background:${PC[k]}"></span> ${SITUATION[k].short} · <b class="mono">${pct(v)}</b></span>`).join('');
  $('#lab-explain').innerHTML = explain(LP, M);
  drawMap($('#map2'), LP, 'vous'); legend($('#legend2'), LP);
  drawStrips($('#strips2'), LP, true);
  try { localStorage.setItem('pp-lab-v3', JSON.stringify(LP)); } catch (e) {}
}
hookMap($('#map2'), () => LP, (q, p) => { LP.q = q; LP.p = p; syncSliders(); renderLab(); });

// ====================== ÉNONCÉ ======================
/* Une réponse rédigée par consigne. Les nombres sont ceux du scénario de référence. */
const ANSWERS = {
  1: `<p>Trois joueurs : le <b>New York Times</b>, le <b>Washington Post</b> et l’<b>administration Nixon</b>. Ordre : Times (x0) → Nixon (x1) → Post (x2) → Nixon (x3). Si le Times renonce : Post (x4) → Nixon (x5). Chaque joueur observe tout ce qui précède : le jeu est à information parfaite.</p>
     <p><b>Les juges ne sont pas des joueurs</b> : ils n’ont ni gains ni choix stratégique, donc pas de nœud dans l’arbre. Seuls leurs verdicts ont une probabilité : la 1re cour (le juge local) refuse la censure avec la probabilité <span class="m">q</span>, la 2e cour (la Cour suprême) donne raison aux journaux avec la probabilité <span class="m">p</span>. Ces probabilités agissent seulement sur les gains des trois joueurs. Ellsberg déclenche le jeu par un coup fixé.</p>`,
  2: `<p>Sept feuilles, classées comme dans l’énoncé :</p>
     <ul><li><b>Pas de publication</b> : O7.</li><li><b>Pas d’action en justice</b> : O4 (le Times publie), O6 (le Post publie seul).</li><li><b>Action contre le New York Times uniquement</b> : O3 (Times censuré, Post muet), O2 (le Post publie sans être poursuivi).</li><li><b>Action contre le Washington Post également</b> : O1 (procès du Post + tribunaux, 1971).</li><li><b>Action contre le Post seul</b>, si le Times renonce : O5.</li></ul>
     <p>Dans les feuilles avec procès, les juges tranchent ensuite. Dans O1 par exemple : la 1re cour donne raison au Times (30 %), la 2e cour donne raison aux journaux (45,5 %), ou la censure est confirmée (24,5 %).</p>`,
  3: `<p><b>Les journaux.</b> Face à un procès, un journal publie si la probabilité que la justice lui donne finalement raison atteint son seuil <span class="m">τ = (c + S − θB) / ((1 − θ)B + S)</span>.</p>
     <ul><li>Post en relais : <span class="m">p</span> ≥ 159/264 ≈ <b>60,2 %</b> (son sort dépend de la 2e cour).</li><li>Post seul : <span class="m">q</span> ≥ <b>60,2 %</b> (il n’a que la 1re cour).</li><li>Times : <span class="m">q + (1 − q)p</span> ≥ <b>25 %</b> s’il anticipe le relais du Post, <span class="m">q</span> ≥ 25 % sinon.</li><li>Si la menace de procès n’est pas crédible, le journal publie sans condition.</li></ul>
     <p><b>L’administration.</b> Elle poursuit le Post en relais si <span class="m">p</span> &lt; <b>85,7 %</b>, le Post seul si <span class="m">q</span> &lt; 85,7 %, et le Times si <span class="m">q</span> &lt; <b>65,5 %</b> (avec <span class="m">p</span> = 65 %, quand le Post prendrait le relais), <span class="m">q</span> &lt; 92,9 % si le Post se tairait, jamais si le Post publierait sans être poursuivi.</p>
     <p><b>Le coût total.</b> Nixon engage les deux procès si <span class="m">k<sub>T</sub> + (1 − q)k<sub>W</sub> &lt; (1 − q)(1 − p)(1 − θ)D</span> (ici 24 &lt; 34,3) et si <span class="m">k<sub>W</sub> &lt; (1 − p)(1 − θ)D</span> (20 &lt; 49). Plus les procès coûtent, plus ces conditions se resserrent.</p>
     <p><b>Le scénario de 1971 en entier.</b> Toutes ces conditions doivent tenir à la fois. Avec <span class="m">q</span> = 30 %, il faut <b>60,2 % ≤ <span class="m">p</span> &lt; 75,5 %</b> : au-delà de 75,5 %, Nixon ne poursuivrait plus le Times, car le second procès aurait trop de chances d’échouer. Le chapitre « Le simulateur » recalcule cet intervalle pour n’importe quelles valeurs.</p>`,
  4: `<p><b>Quand les documents ne sortent pas.</b></p>
     <ul><li><b>Le Post prend peur</b> (<span class="m">p</span> = 50 %, ou <span class="m">S<sub>W</sub></span> = 250, ou <span class="m">c<sub>W</sub></span> &gt; 27,6) : en relais, il perdrait en moyenne (−27 ou −11,9), donc il se tait. Nixon poursuit le Times : feuille O3, et la censure tient 70 % du temps.</li>
     <li><b>Le Times renonce</b> (<span class="m">c<sub>T</sub></span> = 80, ou <span class="m">S<sub>T</sub></span> &gt; 297) : publier lui rapporterait −9,4, moins que le 0 de celui qui ne publie pas. Seul, le Post perdrait 79,8 : personne ne publie (O7).</li>
     <li><b>Des tribunaux hostiles</b> (<span class="m">q</span> = 20 %, <span class="m">p</span> = 50 %) : le Post ne prendrait pas le relais ; le Times n’a alors que 20 % de chances, sous son seuil de 25 % : O7.</li>
     <li>Dans le scénario de référence, même dans la feuille O1, le secret garde <b>24,5 %</b> de chances de tenir : ce n’est pas un choix, c’est le verdict défavorable des juges.</li>
     <li>Un équilibre de Nash peut garder le secret grâce à une menace non crédible (<span class="m">p</span> = 50 %, <span class="m">k<sub>W</sub></span> = 80) ; l’ENPS l’écarte.</li></ul>
     <p><b>L’importance des coûts.</b></p>
     <ul><li><b>Côté Nixon, le coût du second procès commande le premier.</b> <span class="m">k<sub>W</sub></span> &lt; 34,7 : deux procès. Entre 34,7 et 49 : aucun procès (la menace contre le Post resterait crédible, mais le premier procès ne rapporte plus assez). Au-delà de 49 : aucun procès, la menace n’est plus crédible. <span class="m">k<sub>T</sub></span> ≥ 20,3 : aucun procès.</li>
     <li><b>Côté journaux, le Post est le maillon faible</b> (seuil de 60,2 % pour 65 % de chances) : des frais au-delà de 27,6 ou une sanction au-delà de 216 le font taire, et la censure du Times devient efficace. Le Times résiste jusqu’à 70,6 de frais ; au-delà, rien ne sort.</li>
     <li>Des procès chers pour le pouvoir rendent la presse plus libre ; des procès chers pour les journaux mènent à l’autocensure.</li></ul>`,
  5: `<p><b>Les gains.</b> Chaque joueur a une seule équation, appliquée à toutes les issues (pièce 7) :</p>
     <ul><li>un journal qui ne publie pas a <b>0</b> ; s’il publie, il a <span class="m">B·σ − c</span> (s’il est poursuivi) <span class="m">− S</span> (si sa censure est maintenue), où <span class="m">σ</span> est la part des documents qui sort (1 ou <span class="m">θ</span>) ;</li>
     <li>Nixon a <span class="m">−D·σ − k</span> par procès engagé ;</li>
     <li>les juges ne jouent pas : une feuille avec procès vaut la moyenne des gains, pondérée par <span class="m">q</span> et <span class="m">p</span>.</li></ul>
     <p><b>Cohérents avec les objectifs</b> : un journal préfère publier librement (100 ou 120), puis gagner son procès (90 ou 105), puis se taire (0), et craint la censure (−30 ou −159). Nixon préfère que rien ne sorte (0), puis une censure maintenue, puis une publication complète (−200 à −230). <b>Cohérents entre les sous-jeux</b> : la même équation sert partout, donc une même situation a toujours le même gain. Le Times a ainsi 0 dans O5, O6 et O7, où il n’a pas publié.</p>
     <p><b>L’ENPS</b>, unique :</p>
     <ul><li><b>Times</b> : publier.</li><li><b>Post</b> : (publier en relais ; se taire si le Times renonce).</li><li><b>Nixon</b> : (poursuivre le Times ; poursuivre le Post ; poursuivre le Post seul).</li></ul>
     <p>Sous-jeu du Post en relais (x2) : le Post publie, Nixon le poursuit. Sous-jeu « le Times se tait » (x4) : le Post se tairait, donc O7. Jeu complet : gains espérés (60,6 ; 8,82 ; −189,7).</p>
     <p><b>Résultat.</b> Le Times publie → Nixon poursuit → le Post publie → Nixon poursuit → <b>O1</b>. Les juges tranchent ensuite : la 1re cour censure le Times (70 %), puis la 2e cour donne raison aux journaux (65 %) : c’est l’issue de 1971, probable à 45,5 % avant le premier article.</p>
     <p><b>Ce que le modèle explique.</b> Le Times publie car ses chances (75,5 % grâce au relais) dépassent son seuil (25 %). Nixon attaque car la censure peut tenir jusqu’au bout (24,5 %) et les procès coûtent moins que le dommage évité. Le Post publie car ses chances devant la 2e cour (65 %) dépassent de peu son seuil (60,2 %). Seul, il ne l’aurait pas fait.</p>`,
};
$('#answers').innerHTML = CONSIGNES.map(c => `<article class="answer"><div class="answer-n">${String(c.n).padStart(2, '0')}</div><div><h3>${c.short}</h3><blockquote class="answer-quote">« ${c.text} »</blockquote><div class="answer-body">${ANSWERS[c.n]}</div><p class="answer-links">Le détail : ${c.pages.map(id => `<a href="#${id}">${pieceLabel(id)}</a>`).join(' · ')}</p></div></article>`).join('');

// ====================== QUIZ ======================
const QUIZ = [
  ['Pourquoi les juges ne sont-ils pas des joueurs ?', ['Parce qu’ils jouent toujours en dernier', 'Parce qu’ils n’ont pas de gains : leur verdict modifie seulement les gains des trois joueurs', 'Parce qu’ils sont neutres politiquement'], 1, 'Sans gains, ils n’ont rien à maximiser. Ils n’ont donc pas de nœud : les probabilités de leurs verdicts (q pour la 1re cour, p pour la 2e) sont intégrées dans les gains espérés des feuilles.'],
  ['Combien de stratégies le Post a-t-il dans notre arbre ?', ['2', '4', '8'], 1, 'Il décide à deux nœuds (x2 et x4), avec deux actions chacun : 2 × 2 = 4 stratégies.'],
  ['Par quel nœud commence l’induction à rebours ?', ['Par le Times', 'Par Nixon face au Post (x3), dont les deux branches mènent à des feuilles', 'Par Nixon face au Times'], 1, 'On part des nœuds dont toutes les suites sont des feuilles (x3, puis x5), et on remonte jusqu’au Times.'],
  ['Avec nos valeurs, à partir de quelle probabilité de victoire à la Cour suprême le Post publie-t-il en relais ?', ['50 %', 'Environ 60 %', '86 %'], 1, '(c_W + S_W − θB_W)/((1 − θ)B_W + S_W) = 159/264 ≈ 60,2 %. 85,7 % est le seuil de Nixon.'],
  ['Si le Times avait renoncé, que se serait-il passé avec nos valeurs ?', ['Le Post aurait publié seul', 'Rien ne serait sorti', 'Nixon aurait poursuivi le Times'], 1, 'Seul, le Post n’aurait que le juge local (30 % de chances) : publier lui rapporterait −79,8 en moyenne. Il se tairait : O7.'],
  ['Si poursuivre le Post coûtait 40 à Nixon (au lieu de 20), que se passerait-il ?', ['Toujours deux procès', 'Aucun procès : le Times publie librement', 'Le Times renoncerait à publier'], 1, 'Le gain net du 2e procès tombe à 9 : 0,7 × 9 = 6,3 &lt; 10, poursuivre le Times ne vaut plus la peine.'],
  ['Qu’est-ce qu’une menace non crédible ?', ['Une menace qu’on n’aurait pas intérêt à exécuter le moment venu', 'Une menace annoncée en secret', 'Une menace qui coûte cher à celui qui la subit'], 0, 'L’ENPS impose d’agir au mieux dans chaque sous-jeu : une telle menace ne dissuade personne.'],
  ['Dans la feuille O1 (1971), quelle était la probabilité d’une censure confirmée avec sanctions ?', ['7 %', '24,5 %', '65 %'], 1, '(1 − q)(1 − p) = 0,7 × 0,35 = 0,245.'],
  ['Le Times renonce et le Post publie seul, sans procès (O6). Quel est le gain du Times ?', ['−50', '0', '100'], 1, 'Un journal qui ne publie pas n’a ni gain ni perte : 0, quoi que fasse ensuite le Post.'],
];
let good = 0, done = 0;
$('#quizbox').innerHTML = QUIZ.map(([q, opts], i) => `<div class="q" data-i="${i}"><div class="tag" style="color:var(--muted)">Question ${i + 1}</div><h3 style="font-size:17px">${q}</h3><div class="opts">${opts.map((o, j) => `<button type="button" data-j="${j}">${o}</button>`).join('')}</div><div class="fb" hidden></div></div>`).join('');
$('#quizbox').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const box = b.closest('.q'); if (box.dataset.done) return;
  const i = +box.dataset.i, j = +b.dataset.j, [, , ok, why] = QUIZ[i];
  box.dataset.done = 1; done++; if (j === ok) good++;
  box.querySelectorAll('button').forEach((x, k) => { if (k === ok) x.classList.add('good'); else if (k === j) x.classList.add('bad'); x.disabled = true; });
  const fb = box.querySelector('.fb'); fb.hidden = false; fb.innerHTML = (j === ok ? '<b style="color:var(--ok)">Exact.</b> ' : '<b style="color:var(--stamp)">Pas tout à fait.</b> ') + why;
});

// ====================== LEXIQUE ======================
const GL = [
  ['Jeu séquentiel', 'Jeu où les joueurs décident à tour de rôle, en connaissant les coups précédents.'],
  ['Information parfaite', 'Chaque joueur sait exactement où il se trouve dans l’arbre quand il décide : chaque ensemble d’information contient un seul nœud.'],
  ['Gain espéré', 'Moyenne des gains pondérée par les probabilités : p × a + (1 − p) × b. Ici, il intègre les verdicts des juges dans les gains des feuilles.'],
  ['Nature', 'Tirage au hasard placé dans un arbre ; ce n’est pas un joueur (ni gains ni choix). Ici, les verdicts des juges : on les remplace par des gains espérés dans les feuilles.'],
  ['Information complète', 'Chaque joueur connaît les gains de tous les joueurs. C’est notre cas. Si un joueur ignorait le « type » (la fonction de gains) d’un autre, l’information serait incomplète et le jeu bayésien.'],
  ['Jeu répété', 'Un même jeu de période rejoué plusieurs fois, avec des gains actualisés par δ. Notre modèle décrit une seule affaire : ce n’est pas un jeu répété.'],
  ['Action', 'Choix possible à un nœud donné.'],
  ['Stratégie', 'Plan complet qui précise une action à chaque nœud où le joueur pourrait jouer.'],
  ['Profil de stratégies', 'Une stratégie pour chaque joueur. Ici 2 × 4 × 8 = 64 profils.'],
  ['Sous-jeu', 'Partie de l’arbre qui commence à un nœud et comprend tout ce qui suit.'],
  ['Induction à rebours', 'Méthode de résolution qui part de la fin de l’arbre et remonte nœud par nœud.'],
  ['Équilibre de Nash', 'Profil de stratégies où aucun joueur n’a intérêt à changer seul de stratégie.'],
  ['ENPS', 'Équilibre de Nash parfait en sous-jeux : un équilibre de Nash dans chaque sous-jeu.'],
  ['Menace non crédible', 'Menace qu’on n’aurait pas intérêt à exécuter le moment venu ; l’ENPS l’écarte.'],
  ['Censure préalable', 'Interdiction de publier décidée avant la publication (prior restraint). La Cour suprême exige une justification très lourde.'],
  ['Affaires jointes', 'Deux procès examinés ensemble par un même tribunal : la Cour suprême a joint ceux du Times et du Post.'],
  ['Espionage Act', 'Loi américaine de 1917 sur la divulgation d’informations de défense, invoquée contre Ellsberg.'],
  ['Entrée en bourse (IPO)', 'Première vente d’actions au public. Celle du Post a eu lieu le 15 juin 1971.'],
];
$('#gloss').innerHTML = GL.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('');

// ====================== INITIALISATION ======================
function renderAll() {
  renderMain(); renderStep();
  drawMap($('#map1'), BASE, '1971'); legend($('#legend1'), BASE);
  drawStrips($('#strips1'), BASE, false);
  syncSliders(); renderLab();
}
hookMap($('#map1'), () => BASE, null);
renderAll();
document.fonts && document.fonts.ready.then(() => { drawMap($('#map1'), BASE, '1971'); drawMap($('#map2'), LP, 'vous'); });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderAll);
new MutationObserver(renderAll).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
