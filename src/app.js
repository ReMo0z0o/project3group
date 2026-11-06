// ====================== OUTILS ======================
const $ = s => document.querySelector(s);
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
function fr(x, dec = 1) {
  if (!Number.isFinite(x)) return x > 0 ? '+∞' : x < 0 ? '−∞' : '—';
  const r = Math.round(x * 10 ** dec) / 10 ** dec;
  let s = Math.abs(r).toFixed(dec); if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  s = s.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (r < 0 ? '−' : '') + s;
}
const pct = (x, d = 1) => Number.isFinite(x) ? fr(x * 100, d) + ' %' : '—';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const subH = s => s.replace(/([A-Za-zθ])_([A-Z])/g, '$1<sub>$2</sub>');
const clamp01 = x => Math.max(0, Math.min(1, x));
const vec = v => '(' + v.map(x => fr(x, 2)).join(' ; ') + ')';
const dec = x => fr(x, 2);
const BOUNDS = { q: [0, 1], p: [0, 1], th: [0, 0.95], B_T: [0, 300], c_T: [0, 120], S_T: [0, 400], R_T: [0, 200], B_W: [0, 300], c_W: [0, 120], S_W: [0, 400], D: [0, 500], k_T: [0, 120], k_W: [0, 120] };
let saved = null; try { saved = JSON.parse(localStorage.getItem('pp-lab-v2') || 'null'); } catch (e) { saved = null; }
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
  ['NYT', '--nyt', 'New York Times', 'Publier ou non (x0).', "Informer, décrocher le scoop et le prestige ; ne pas se faire doubler par le Post.", "Frais de procès, censure, sanctions si la censure est maintenue."],
  ['RN', '--gov', 'Administration Nixon', 'Poursuivre en justice ou laisser faire (x1, x3, x5).', "Protéger ses secrets et sa crédibilité ; éviter un précédent.", "Le coût des procès, surtout son image de censeur."],
  ['WP', '--wp', 'Washington Post', 'Publier ou non : en relais du Times (x2) ou seul (x4).', "Devenir un grand journal national, informer.", "Amendes, prison, entrée en bourse ratée, licences de télévision."],
];
$('#players').innerHTML = PLAYERS.map(([l, c, n, a, obj, risk]) => `<div class="card"><div class="player"><div class="disc" style="background:var(${c})">${l}</div><h3>${n}</h3></div><div class="k"><b>Action :</b> ${a}</div><div class="k"><b>Objectif :</b> ${obj}</div><div class="k"><b>Risque :</b> ${risk}</div></div>`).join('');
/* Ni choix stratégique ni gains : ces acteurs n'ont pas de nœud dans l'arbre. */
const NON_PLAYERS = [
  ['', '--nat', 'diam', 'Les juges locaux', 'Refusent la censure avec la probabilité q.', 'Pas de nœud dans l’arbre : leur verdict est intégré aux gains des feuilles, q × (gains si refus) + (1 − q) × (gains si censure).'],
  ['', '--nat', 'diam', 'La Cour suprême', 'Donne raison aux journaux avec la probabilité p, pour les deux affaires jointes.', 'Pas de nœud non plus : p pondère les gains de la feuille « Procès du Post + tribunaux ».'],
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

// ====================== OÙ SONT LES JUGES ? ======================
/* Chaque feuille « + tribunaux » est une loterie sur les verdicts : ses gains sont une espérance. */
function lotteryRows(P) {
  const M = solve(P), S = M.S;
  return COURT_LEAVES.map(id => ({ id, parts: LEAVES[id].lottery(P).map(([s, w, why]) => ({ s, w, why, v: S[s] })), total: M.O[id] }));
}
(function foldedTree() {
  const rows = lotteryRows(BASE);
  $('#folded-table').innerHTML = `<thead><tr><th>Feuille</th><th>Verdict des juges</th><th>Probabilité</th><th style="text-align:right;color:var(--nyt)">Times</th><th style="text-align:right;color:var(--wp)">Post</th><th style="text-align:right;color:var(--gov)">Nixon</th></tr></thead><tbody>` +
    rows.map(r => r.parts.map((x, i) => `<tr>${i === 0 ? `<td rowspan="${r.parts.length + 1}"><b>${r.id}</b> · ${TITLE[r.id].join(' ')}</td>` : ''}<td>${x.why}</td><td class="v">${pct(x.w)}</td>${x.v.map((y, k) => `<td class="v" style="color:${['var(--nyt)', 'var(--wp)', 'var(--gov)'][k]};font-weight:400">${fr(y, 2)}</td>`).join('')}</tr>`).join('') +
      `<tr class="lottery-total"><td colspan="2"><b>Gains espérés de la feuille</b></td>${r.total.map((y, k) => `<td class="v" style="color:${['var(--nyt)', 'var(--wp)', 'var(--gov)'][k]}">${fr(y, 2)}</td>`).join('')}</tr>`).join('') + '</tbody>';
  $('#folded-note').innerHTML = 'Les juges n’ont ni gains ni choix : ce ne sont pas des joueurs, ils n’ont donc pas de nœud. Leurs verdicts possibles sont regroupés dans la feuille, et chaque joueur y reçoit la moyenne de ses gains, pondérée par la probabilité de chaque verdict. Exemple : la feuille O3 « Times censuré, Post muet » vaut 0,3 × (90 ; 0 ; −210) + 0,7 × (−30 ; 0 ; −70) = (6 ; 0 ; −112), car dans 30 % des cas le juge refuse finalement de censurer le Times.';
})();

// ====================== GAINS ======================
const ING = [
  ['B', 'Valeur de la publication', 'Le scoop, le prestige, la mission d’informer : <span class="m">B<sub>T</sub></span> = 100 pour le Times, <span class="m">B<sub>W</sub></span> = 120 pour le Post.'],
  ['θ', 'Part publiée avant une censure', '<span class="m">θ</span> = 0,3. Un journal censuré garde <span class="m">θB</span> ; Nixon ne subit alors que <span class="m">θD</span>.'],
  ['c', 'Frais totaux d’un procès', 'Avocats et procédures d’urgence, jusqu’au dernier tribunal : <span class="m">c<sub>T</sub></span> = 10, <span class="m">c<sub>W</sub></span> = 15.'],
  ['S', 'Sanction d’une censure maintenue', 'Poursuites, amendes ; pour le Post, bourse et licences : <span class="m">S<sub>T</sub></span> = 50, <span class="m">S<sub>W</sub></span> = 180.'],
  ['R', 'Scoop laissé au rival', 'Si le Times renonce et que le Post publie : <span class="m">R<sub>T</sub></span> = 50.'],
  ['D', 'Dommage de Nixon si tout sort', '<span class="m">D</span> = 200 : crédibilité de l’exécutif et précédent pour toutes les fuites futures.'],
  ['k', 'Coût total d’un procès pour Nixon', 'Frais et surtout image de censeur : <span class="m">k<sub>T</sub></span> = 10 contre le Times, <span class="m">k<sub>W</sub></span> = 20 contre le Post.'],
  ['q · p', 'Probabilités des verdicts', '<span class="m">q</span> = 0,3 : un juge local refuse la censure. <span class="m">p</span> = 0,65 : la Cour suprême donne raison aux journaux. Les juges ne sont pas des joueurs : ces probabilités pondèrent les gains des feuilles.'],
];
$('#ingredients').innerHTML = ING.map(([s, t, d]) => `<div class="card"><div style="display:flex;gap:12px;align-items:baseline"><span class="m" style="font-size:30px">${s}</span><h3 style="font-size:16.5px">${t}</h3></div><div class="k">${d}</div></div>`).join('');
const WHY = [
  ['D = 200', 'Nixon', 'Le plus gros enjeu : quatre administrations prises en défaut, et un précédent qui exposerait tous les secrets futurs. Il sert d’étalon : les autres valeurs se lisent par rapport à lui.'],
  ['B<sub>T</sub> = 100', 'Times', 'Le scoop de la décennie (prix Pulitzer 1972), la mission d’informer.'],
  ['B<sub>W</sub> = 120', 'Post', 'Pour le Post, publier c’est entrer dans la cour des grands : le gain relatif est plus fort que pour le Times.'],
  ['θ = 0,3', 'Tous', 'Trois articles étaient parus avant la suspension du Times : une partie seulement des révélations. Même part retenue pour le Post, par simplicité.'],
  ['c<sub>T</sub> = 10 · c<sub>W</sub> = 15', 'Journaux', 'Frais d’avocats et procédures d’urgence ; un peu plus pour le Post, en pleine entrée en bourse.'],
  ['S<sub>T</sub> = 50', 'Times', 'Poursuites possibles contre ses journalistes et sa direction ; le Times est une institution solide.'],
  ['S<sub>W</sub> = 180', 'Post', 'La sanction la plus lourde : poursuites pénales, entrée en bourse du 15 juin menacée, licences de télévision (environ 100 millions de dollars). Fixée à 1,5 fois B<sub>W</sub>.'],
  ['R<sub>T</sub> = 50', 'Times', 'Laisser son grand rival publier l’enquête qu’on a refusée : la moitié du scoop perdue, en prestige et en lecteurs.'],
  ['k<sub>T</sub> = 10 · k<sub>W</sub> = 20', 'Nixon', 'Chaque procès coûte, surtout en image de censeur ; poursuivre un second journal ressemble à une campagne contre la presse et mène jusqu’à la Cour suprême.'],
  ['q = 0,3', 'Juges', 'Le juge Gurfein, en fonction depuis quelques jours, a suspendu le Times : en matière de sécurité nationale, une suspension provisoire s’obtient facilement.'],
  ['p = 0,65', 'Juges', 'La jurisprudence (Near v. Minnesota, 1931) est très hostile à la censure préalable, mais la Cour est divisée : 6 voix contre 3 au final.'],
];
$('#whytable').innerHTML = `<thead><tr><th>Valeur</th><th>Joueur</th><th>Justification</th></tr></thead><tbody>` + WHY.map(([v, j, t]) => `<tr><td class="v" style="text-align:left"><span class="m">${v}</span></td><td>${j}</td><td>${t}</td></tr>`).join('') + '</tbody>';
let payMode = 'num';
/* Tableau 1 : les situations finales, construites avec les cinq règles. */
function renderPay() {
  const S = situations(BASE);
  let h = `<thead><tr><th>Situation finale</th><th style="text-align:right;color:var(--nyt)">Times</th><th style="text-align:right;color:var(--wp)">Post</th><th style="text-align:right;color:var(--gov)">Nixon</th></tr></thead><tbody>`;
  for (const k of SITUATION_ORDER) h += `<tr><td>${SITUATION[k].label}</td>` + [0, 1, 2].map(j => `<td class="v" style="color:${['var(--nyt)', 'var(--wp)', 'var(--gov)'][j]}">${payMode === 'sym' ? `<span class="m" style="color:var(--ink)">${subH(SITUATION[k].sym[j])}</span>` : fr(S[k][j])}</td>`).join('') + '</tr>';
  $('#paytable').innerHTML = h + '</tbody>';
  $('#p-sym').setAttribute('aria-pressed', payMode === 'sym'); $('#p-num').setAttribute('aria-pressed', payMode === 'num');
}
$('#p-sym').onclick = () => { payMode = 'sym'; renderPay(); };
$('#p-num').onclick = () => { payMode = 'num'; renderPay(); };
/* Calcul détaillé : chaque symbole est remplacé par sa valeur de référence. */
function numeric(expr, P) {
  const value = { B_T: P.B_T, B_W: P.B_W, c_T: P.c_T, c_W: P.c_W, S_T: P.S_T, S_W: P.S_W, R_T: P.R_T, k_T: P.k_T, k_W: P.k_W, D: P.D };
  return expr.replace(/(θ?)(B_T|B_W|c_T|c_W|S_T|S_W|R_T|k_T|k_W|D)/g, (_, t, s) => (t ? fr(P.th, 2) + ' × ' : '') + fr(value[s], 2));
}
(function renderCalc() {
  const S = situations(BASE);
  $('#calc').innerHTML = SITUATION_ORDER.map(k => `<div class="calc-row"><div class="calc-head">${SITUATION[k].label}</div>` + [0, 1, 2].map(j => {
    const expr = SITUATION[k].sym[j], constant = !/[A-Za-zθ]/.test(expr), simple = !/[−+×]/.test(numeric(expr, BASE).replace(/^−/, ''));
    const body = constant ? `<b>${fr(S[k][j])}</b>` : `<span class="m">${subH(expr)}</span>${simple ? '' : ' = ' + numeric(expr, BASE)} = <b>${fr(S[k][j])}</b>`;
    return `<div class="calc-line" style="--c:var(${['--nyt', '--wp', '--gov'][j]})"><span class="calc-who">${PLAYERS3[j]}</span><span>${body}</span></div>`;
  }).join('') + '</div>').join('');
})();
/* Tableau 2 : les sept feuilles de l'arbre, espérances des situations selon les verdicts des juges. */
(function renderLeaves() {
  const P = BASE, O = outcomes(P), S = situations(P);
  $('#leaftable').innerHTML = `<thead><tr><th>Feuille</th><th>Calcul (verdicts des juges)</th><th style="text-align:right;color:var(--nyt)">Times</th><th style="text-align:right;color:var(--wp)">Post</th><th style="text-align:right;color:var(--gov)">Nixon</th></tr></thead><tbody>` +
    OUTCOME_ORDER.map(k => {
      const parts = LEAVES[k].lottery(P);
      const calc = parts.length === 1 ? 'pas de juge : ' + SITUATION[parts[0][0]].short : parts.map(([s, w]) => `${fr(w, 3)} × ${vec(S[s])}`).join(' + ');
      return `<tr><td class="issue-id">${k} · ${TITLE[k].join(' ')}</td><td class="mono" style="font-size:12.5px">${calc}</td>${O[k].map((x, j) => `<td class="v" style="color:${['var(--nyt)', 'var(--wp)', 'var(--gov)'][j]}">${fr(x, 2)}</td>`).join('')}</tr>`;
    }).join('') + '</tbody>';
})();

// ====================== PAS À PAS ======================
const M0 = solve(BASE);
function buildSteps(P, M) {
  const O = M.O, V = M.V, t = M.th;
  const cmp = (a, la, b, lb, verdict) => `<div class="cmp"><span class="opt ${a >= b ? 'win' : ''}">${la} : <b>${fr(a, 2)}</b></span> ${a > b ? '&gt;' : a < b ? '&lt;' : '='} <span class="opt ${a < b ? 'win' : ''}">${lb} : <b>${fr(b, 2)}</b></span><span class="verdict">⇒ ${verdict}</span></div>`;
  const ui = s => `<p class="ui" style="font-size:15px">${s}</p>`;
  return [
    ['Le principe', `<p>On part de la <b>fin</b> du jeu. À chaque nœud, on garde le <b>meilleur choix</b> du joueur qui décide, en comparant <b>sa</b> composante, et on reporte le triplet de gains. Les juges ne sont pas des joueurs : ils n’ont pas de nœud, leurs verdicts sont déjà dans les gains des feuilles (gains espérés). On traite la branche « le Times publie » (x3 → x1), puis la branche « le Times se tait » (x5 → x4), et on finit par le Times (x0).</p>`],
    ['Étape 1 · x3, Nixon face au Post', cmp(O.O1[2], 'Poursuivre (O1)', O.O2[2], 'Laisser faire (O2)', M.g2Sue ? 'il poursuit' : 'il laisse faire') + `<div class="eq"><span class="m">(1 − p)(1 − θ)D &gt; k<sub>W</sub></span> ⟺ <span class="m">p &lt; 1 − <span class="frac"><span>k<sub>W</sub></span><span>(1 − θ)D</span></span></span> ≈ ${pct(t.gPost)} &nbsp;·&nbsp; ici ${dec(1 - P.p)} × ${dec(1 - P.th)} × ${fr(P.D)} = <b>${fr(t.kWcred)}</b> ${t.kWcred > P.k_W ? '&gt;' : '≤'} ${fr(P.k_W)}</div>` + ui(`O1 contient les verdicts : ${dec(P.q)} × (juge favorable au Times) + ${dec((1 - P.q) * P.p)} × (victoire des journaux) + ${dec((1 - P.q) * (1 - P.p))} × (censure confirmée). Le dommage encore évitable en espérance (${fr(t.kWcred)}) dépasse le coût du procès (${fr(P.k_W)}) : la menace contre le Post est <b>crédible</b>.`)],
    ['Étape 2 · x2, le Post en relais', cmp(V.x3[1], 'Publier', O.O3[1], 'Ne pas publier (O3)', M.wPub ? 'il publie, de justesse' : 'il se tait') + `<div class="eq"><span class="m">p(B<sub>W</sub> − c<sub>W</sub>) + (1 − p)(θB<sub>W</sub> − c<sub>W</sub> − S<sub>W</sub>) ≥ 0</span> ⟺ <span class="m">p ≥ <span class="frac"><span>c<sub>W</sub> + S<sub>W</sub> − θB<sub>W</sub></span><span>(1 − θ)B<sub>W</sub> + S<sub>W</sub></span></span></span> = <span class="frac"><span>${fr(P.c_W + P.S_W - P.th * P.B_W)}</span><span>${fr((1 - P.th) * P.B_W + P.S_W)}</span></span> ≈ <b>${pct(t.tauW)}</b></div>` + ui(`Publier rapporte ${fr(V.x3[1], 2)} = ${dec(1 - P.q)} × ${fr(V.x3[1] / (1 - P.q), 2)} : dans ${pct(P.q, 0)} des cas, le juge refuse de censurer le Times et le choix du Post ne change rien pour lui. Avec ${pct(P.p, 0)} de chances à la Cour suprême, le Post est juste au-dessus de son seuil : une décision risquée.`)],
    ['Étape 3 · x1, Nixon face au Times', cmp(V.x2[2], 'Poursuivre', O.O4[2], 'Laisser faire (O4)', M.g1Sue ? 'il poursuit' : 'il laisse faire') + `<div class="eq"><span class="m">k<sub>T</sub> + (1 − q)k<sub>W</sub> &lt; (1 − q)(1 − p)(1 − θ)D</span> &nbsp;·&nbsp; ici ${fr(P.k_T)} + ${dec(1 - P.q)} × ${fr(P.k_W)} = <b>${fr(t.totalCost)}</b> &lt; <b>${fr(t.avoided)}</b></div>` + ui('Ce premier procès n’a de sens que parce que Nixon est prêt à aller jusqu’au bout contre le Post. Sinon, le Post publierait sans risque et poursuivre le Times ne servirait à rien.')],
    ['Étape 4 · x5, Nixon face au Post seul', cmp(O.O5[2], 'Poursuivre (O5)', O.O6[2], 'Laisser faire (O6)', M.g3Sue ? 'il poursuivrait' : 'il laisserait faire') + `<div class="eq"><span class="m">(1 − q)(1 − θ)D &gt; k<sub>W</sub></span> &nbsp;·&nbsp; ici ${dec(1 - P.q)} × ${fr(t.free)} = <b>${fr((1 - P.q) * t.free)}</b> &gt; ${fr(P.k_W)}</div>` + ui('On passe à la branche que l’histoire n’a pas suivie : le Times a renoncé. O5 contient le verdict du juge local : 30 % de refus, 70 % de censure du Post.')],
    ['Étape 5 · x4, le Post seul', cmp(V.x5[1], 'Publier', O.O7[1], 'Ne pas publier (O7)', M.wAlone ? 'il publierait' : 'il se tairait') + `<div class="eq"><span class="m">q(B<sub>W</sub> − c<sub>W</sub>) + (1 − q)(θB<sub>W</sub> − c<sub>W</sub> − S<sub>W</sub>) ≥ 0</span> ⟺ <span class="m">q ≥ ${pct(t.tauW)}</span> &nbsp;·&nbsp; ici <span class="m">q</span> = ${pct(P.q, 0)}</div>` + ui('Seul, le Post affronterait un juge local qui censure 7 fois sur 10, sans espoir rapide de Cour suprême. Il ne publierait pas : <b>sans le Times, rien ne sortirait</b>.')],
    ['Étape 6 · x0, le Times', cmp(V.x1[0], 'Publier', V.x4[0], 'Ne pas publier', M.tPub ? 'il publie' : 'il renonce') + ui(`Ne pas publier mènerait en O7 : le Times n’a pas à craindre d’être doublé ici. Il publie parce que ses chances de gagner au bout du compte (30 % devant le juge, puis 65 % à la Cour suprême grâce au relais du Post : ${pct(P.q + (1 - P.q) * P.p)}) dépassent largement son seuil de ${pct(t.tauT, 0)}.`)],
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
    ['--nyt', 'Le Times publie', `${m('π ≥ <span class="frac"><span>c<sub>T</sub> + S<sub>T</sub> − θB<sub>T</sub></span><span>(1 − θ)B<sub>T</sub> + S<sub>T</sub></span></span>')} = <span class="frac"><span>${fr(P.c_T + P.S_T - P.th * P.B_T)}</span><span>${fr((1 - P.th) * P.B_T + P.S_T)}</span></span> = <b>${pct(t.tauT)}</b>`, `π = q + (1 − q)p = ${pct(P.q + (1 - P.q) * P.p)} si le Post prend le relais ; π = q = ${pct(P.q, 0)} sinon. Si le Post publiait seul, se taire coûterait en plus R<sub>T</sub> au Times.`],
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
  ['Juges · pas des joueurs', '--nat', [['q', 'Un juge local refuse la censure (q)', 0, 1, 0.01, 'pct'], ['p', 'La Cour suprême donne raison aux journaux (p)', 0, 1, 0.01, 'pct'], ['th', 'Part publiée avant une censure (θ)', 0, 0.95, 0.01, 'dec']]],
  ['New York Times', '--nyt', [['B_T', 'Gain si tout est publié (B<sub>T</sub>)', 0, 300, 1], ['c_T', 'Frais de procès (c<sub>T</sub>)', 0, 120, 1], ['S_T', 'Sanction si censure maintenue (S<sub>T</sub>)', 0, 400, 1], ['R_T', 'Perte si le Post publie à sa place (R<sub>T</sub>)', 0, 200, 1]]],
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
  preempt: ['Publier pour ne pas être doublé', { q: 0.65, p: 0.5, c_T: 30, S_T: 150 }],
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
  L.push(`Le Times (x0) ${M.tPub ? '<b>publie</b>' : '<b>ne publie pas</b>'} : ${fr(V.x1[0], 2)} en publiant ${sign(V.x1[0], V.x4[0])} ${fr(V.x4[0], 2)} en se taisant.${M.tPub && V.x1[0] < 0 ? ' Il publie à perte, pour ne pas laisser le scoop au Post.' : ''}`);
  return L.map((t, i) => `<div class="ln"><b class="n">${i + 1}</b><span>${t}</span></div>`).join('') +
    `<div class="note ${M.full > 0.5 ? 'green' : 'red'}" style="margin-top:6px">Une fois les juges passés, probabilité que tout sorte : <b>${pct(M.full)}</b>. Probabilité que l'essentiel reste secret : <b>${pct(1 - M.full)}</b>.</div>`;
}
const PC = { judgeTimes: '#4E8F72', press: '#17695B', gov: '#8F1C13', postFree: '#3E7D8C', timesCensored: '#B42318', noSuit: '#2C7A4B', judgePost: '#3F6F9E', postCensored: '#6E2B62', postAlone: '#2F5F8A', nothing: '#7D776B' };
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
  try { localStorage.setItem('pp-lab-v2', JSON.stringify(LP)); } catch (e) {}
}
hookMap($('#map2'), () => LP, (q, p) => { LP.q = q; LP.p = p; syncSliders(); renderLab(); });

// ====================== ÉNONCÉ ======================
const ANS = [
  ['Identifier les joueurs et l’ordre dans lequel ils interviennent',
    `<p>Trois joueurs : le <b>New York Times</b>, le <b>Washington Post</b> et l’<b>administration Nixon</b>. Ordre : Times (x0) → Nixon (x1) → Post (x2) → Nixon (x3). Si le Times renonce : Post (x4) → Nixon (x5). Chaque joueur observe tout ce qui précède : le jeu est à information parfaite.</p>
     <p><b>Les juges ne sont pas des joueurs</b> : ils n’ont ni gains ni choix stratégique. Ils n’ont donc pas de nœud dans l’arbre. Leurs verdicts (un juge local refuse la censure avec la probabilité <span class="m">q</span>, la Cour suprême donne raison aux journaux avec la probabilité <span class="m">p</span>) modifient seulement les gains des trois joueurs, intégrés dans les feuilles sous forme de gains espérés. Ellsberg déclenche le jeu par un coup fixé (<a href="#joueurs">pièce 4</a>).</p>`],
  ['Identifier les différents résultats potentiels',
    `<p>Sept feuilles, classées comme dans l’énoncé :</p>
     <ul><li><b>Pas de publication</b> : O7.</li><li><b>Pas d’action en justice</b> : O4 (le Times publie), O6 (le Post publie seul).</li><li><b>Action contre le New York Times uniquement</b> : O3 (Times censuré, Post muet), O2 (le Post publie sans être poursuivi).</li><li><b>Action contre le Washington Post également</b> : O1 (procès du Post + tribunaux, 1971).</li><li><b>Action contre le Post seul</b>, si le Times renonce : O5.</li></ul>
     <p>Dans les feuilles avec procès, les juges tranchent ensuite : par exemple dans O1, juge favorable au Times (30 %), victoire des journaux à la Cour suprême (45,5 %) ou censure confirmée (24,5 %). Voir <a href="#arbre">pièce 5</a>.</p>`],
  ['Impact du coût total des procédures et des probabilités : quand publie-t-on, quand attaque-t-on ?',
    `<p><b>Les journaux.</b> Face à un procès, un journal publie si la probabilité que la justice lui donne finalement raison atteint son seuil <span class="m">τ = (c + S − θB) / ((1 − θ)B + S)</span>.</p>
     <ul><li>Post en relais : <span class="m">p</span> ≥ 159/264 ≈ <b>60,2 %</b> (son sort dépend de la Cour suprême).</li><li>Post seul : <span class="m">q</span> ≥ <b>60,2 %</b> (il n’a que le juge local).</li><li>Times : <span class="m">q + (1 − q)p</span> ≥ <b>25 %</b> s’il anticipe le relais du Post, <span class="m">q</span> ≥ 25 % sinon.</li><li>Si la menace de procès n’est pas crédible, le journal publie sans condition.</li></ul>
     <p><b>L’administration.</b> Elle poursuit le Post en relais si <span class="m">p</span> &lt; <b>85,7 %</b>, le Post seul si <span class="m">q</span> &lt; 85,7 %, et le Times si <span class="m">q</span> &lt; <b>65,5 %</b> (avec <span class="m">p</span> = 65 %, quand le Post prendrait le relais), <span class="m">q</span> &lt; 92,9 % si le Post se tairait, jamais si le Post publierait sans être poursuivi.</p>
     <p><b>Le coût total.</b> Nixon engage les deux procès si <span class="m">k<sub>T</sub> + (1 − q)k<sub>W</sub> &lt; (1 − q)(1 − p)(1 − θ)D</span> (ici 24 &lt; 34,3) et si <span class="m">k<sub>W</sub> &lt; (1 − p)(1 − θ)D</span> (20 &lt; 49). Plus les procès coûtent, plus ces conditions se resserrent (<a href="#resolution">pièces 8</a>, <a href="#carte">9</a> et <a href="#couts">11</a>).</p>`],
  ['Valeurs pour lesquelles les documents ne sont pas publiés, et pourquoi',
    `<ul><li><b>Le Post prend peur</b> (<span class="m">p</span> = 50 %, ou <span class="m">S<sub>W</sub></span> = 250, ou <span class="m">c<sub>W</sub></span> &gt; 27,6) : en relais, il perdrait en moyenne (−27 ou −11,9), donc il se tait. Nixon poursuit le Times : feuille O3, et la censure tient 70 % du temps.</li>
     <li><b>Le Times renonce</b> (<span class="m">c<sub>T</sub></span> = 80, ou <span class="m">S<sub>T</sub></span> &gt; 297) : publier lui rapporterait −9,4. Seul, le Post perdrait 79,8 : personne ne publie (O7).</li>
     <li><b>Des tribunaux hostiles</b> (<span class="m">q</span> = 20 %, <span class="m">p</span> = 50 %) : le Post ne prendrait pas le relais ; le Times n’a alors que 20 % de chances, sous son seuil de 25 % : O7.</li>
     <li>Dans le scénario de référence, même dans la feuille O1, le secret garde <b>24,5 %</b> de chances de tenir : ce n’est pas un choix, c’est le verdict défavorable des juges.</li>
     <li>Un équilibre de Nash peut garder le secret grâce à une menace non crédible (<span class="m">p</span> = 50 %, <span class="m">k<sub>W</sub></span> = 80) ; l’ENPS l’écarte (<a href="#secret">pièce 10</a>).</li></ul>`],
  ['Importance des coûts associés aux différentes actions en justice',
    `<ul><li><b>Côté Nixon, le coût du second procès commande le premier.</b> <span class="m">k<sub>W</sub></span> &lt; 34,7 : deux procès. Entre 34,7 et 49 : aucun procès (la menace contre le Post resterait crédible, mais le premier procès ne rapporte plus assez). Au-delà de 49 : aucun procès, la menace n’est plus crédible. <span class="m">k<sub>T</sub></span> ≥ 20,3 : aucun procès.</li>
     <li><b>Côté journaux, le Post est le maillon faible</b> (seuil de 60,2 % pour 65 % de chances) : des frais au-delà de 27,6 ou une sanction au-delà de 216 le font taire, et la censure du Times devient efficace. Le Times résiste jusqu’à 70,6 de frais ; au-delà, rien ne sort.</li>
     <li>Des procès chers pour le pouvoir rendent la presse plus libre ; des procès chers pour les journaux mènent à l’autocensure (<a href="#couts">pièce 11</a>).</li></ul>`],
  ['Des gains cohérents et les ENPS qui rationalisent l’issue',
    `<p>Les gains suivent cinq règles identiques dans tous les sous-jeux (<a href="#gains">pièce 7</a>). L’ENPS, unique, est :</p>
     <ul><li><b>Times</b> : publier.</li><li><b>Post</b> : (publier en relais ; se taire si le Times renonce).</li><li><b>Nixon</b> : (poursuivre le Times ; poursuivre le Post ; poursuivre le Post seul).</li></ul>
     <p>Sous-jeu du Post en relais (x2) : le Post publie, Nixon le poursuit. Sous-jeu « le Times se tait » (x4) : le Post se tairait, donc O7. Jeu complet : gains espérés (60,6 ; 8,82 ; −189,7).</p>
     <p><b>Résultat.</b> Le Times publie → Nixon poursuit → le Post publie → Nixon poursuit → <b>O1</b>. Les juges tranchent ensuite : censure du Times par le juge local (70 %), puis Cour suprême favorable aux journaux (65 %) : c’est l’issue de 1971 (probabilité de 45,5 % avant le premier article).</p>
     <p><b>Ce que le modèle explique.</b> Le Times publie car ses chances (75,5 % grâce au relais) dépassent son seuil (25 %). Nixon attaque car la censure peut tenir jusqu’au bout (24,5 %) et les procès coûtent moins que le dommage évité. Le Post publie car ses chances à la Cour suprême (65 %) dépassent de peu son seuil (60,2 %). Seul, il ne l’aurait pas fait (<a href="#resolution">pièce 8</a>).</p>`],
];
$('#answers').innerHTML = ANS.map(([t, a], i) => `<article class="answer"><div class="answer-n">${String(i + 1).padStart(2, '0')}</div><div><h3>${t}</h3><div class="answer-body">${a}</div></div></article>`).join('');

// ====================== QUIZ ======================
const QUIZ = [
  ['Pourquoi les juges ne sont-ils pas des joueurs ?', ['Parce qu’ils jouent toujours en dernier', 'Parce qu’ils n’ont pas de gains : leur verdict modifie seulement les gains des trois joueurs', 'Parce qu’ils sont neutres politiquement'], 1, 'Sans gains, ils n’ont rien à maximiser. Ils n’ont donc pas de nœud : leurs verdicts (q, p) sont intégrés dans les gains espérés des feuilles.'],
  ['Combien de stratégies le Post a-t-il dans notre arbre ?', ['2', '4', '8'], 1, 'Il décide à deux nœuds (x2 et x4), avec deux actions chacun : 2 × 2 = 4 stratégies.'],
  ['Par quel nœud commence l’induction à rebours ?', ['Par le Times', 'Par Nixon face au Post (x3), dont les deux branches mènent à des feuilles', 'Par Nixon face au Times'], 1, 'On part des nœuds dont toutes les suites sont des feuilles (x3, puis x5), et on remonte jusqu’au Times.'],
  ['Avec nos valeurs, à partir de quelle probabilité de victoire à la Cour suprême le Post publie-t-il en relais ?', ['50 %', 'Environ 60 %', '86 %'], 1, '(c_W + S_W − θB_W)/((1 − θ)B_W + S_W) = 159/264 ≈ 60,2 %. 85,7 % est le seuil de Nixon.'],
  ['Si le Times avait renoncé, que se serait-il passé avec nos valeurs ?', ['Le Post aurait publié seul', 'Rien ne serait sorti', 'Nixon aurait poursuivi le Times'], 1, 'Seul, le Post n’aurait que le juge local (30 % de chances) : publier lui rapporterait −79,8 en moyenne. Il se tairait : O7.'],
  ['Si poursuivre le Post coûtait 40 à Nixon (au lieu de 20), que se passerait-il ?', ['Toujours deux procès', 'Aucun procès : le Times publie librement', 'Le Times renoncerait à publier'], 1, 'Le gain net du 2e procès tombe à 9 : 0,7 × 9 = 6,3 &lt; 10, poursuivre le Times ne vaut plus la peine.'],
  ['Qu’est-ce qu’une menace non crédible ?', ['Une menace qu’on n’aurait pas intérêt à exécuter le moment venu', 'Une menace annoncée en secret', 'Une menace qui coûte cher à celui qui la subit'], 0, 'L’ENPS impose d’agir au mieux dans chaque sous-jeu : une telle menace ne dissuade personne.'],
  ['Dans la feuille O1 (1971), quelle était la probabilité d’une censure confirmée avec sanctions ?', ['7 %', '24,5 %', '65 %'], 1, '(1 − q)(1 − p) = 0,7 × 0,35 = 0,245.'],
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
  renderMain(); renderPay(); renderStep();
  drawMap($('#map1'), BASE, '1971'); legend($('#legend1'), BASE);
  drawStrips($('#strips1'), BASE, false);
  syncSliders(); renderLab();
}
hookMap($('#map1'), () => BASE, null);
renderAll();
document.fonts && document.fonts.ready.then(() => { drawMap($('#map1'), BASE, '1971'); drawMap($('#map2'), LP, 'vous'); });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderAll);
new MutationObserver(renderAll).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
