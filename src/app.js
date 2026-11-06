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
    if (!M.g2Sue) return `Après la censure du Times, Nixon ne poursuivrait pas le Post : le Post publie quelle que soit sa chance devant la Cour suprême.`;
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
  ['Jeu séquentiel', "Les joueurs jouent à tour de rôle et chacun voit les coups déjà joués (information parfaite).", "Le Post décide après avoir vu le Times publier puis être censuré, ou après avoir appris qu’il renonce."],
  ['Arbre et nœuds', "Chaque nœud est un moment de décision ; chaque branche, une action ; chaque feuille, une issue avec les gains de tous les joueurs.", "9 nœuds (6 décisions, 3 coups de la Nature) et 10 issues, de O1 à O10."],
  ['La Nature et le gain espéré', "Un coup de hasard est joué par « la Nature » avec des probabilités connues. On évalue alors un gain espéré : E = p × gain si oui + (1 − p) × gain si non.", "Les juges locaux (q) et la Cour suprême (p)."],
  ['Stratégie', "Un plan complet : une action prévue à chaque nœud où le joueur pourrait jouer, même si ce nœud n'est jamais atteint.", "Le Post a 2 nœuds, donc 4 stratégies ; Nixon en a 3, donc 8."],
  ['Sous-jeu', "La partie de l'arbre qui commence à un nœud et contient tout ce qui suit.", "Le « jeu du Post » après la censure du Times (x3), ou celui qui commence si le Times se tait (x6)."],
  ['Induction à rebours', "On résout depuis la fin : on trouve le meilleur choix au dernier nœud, on le remplace par sa valeur, et on remonte.", "On commence par la Cour suprême et le juge du Post seul ; on finit par le Times."],
  ['ENPS', "Équilibre de Nash parfait en sous-jeux : un profil de stratégies qui est un équilibre de Nash dans chaque sous-jeu. Il élimine les menaces non crédibles.", "Times : publier ; Post : (publier en relais ; se taire seul) ; Nixon : poursuivre à ses trois nœuds."],
  ['Menace non crédible', "Une menace qu'on n'aurait pas intérêt à exécuter le moment venu. Un joueur rationnel ne s'y laisse pas dissuader.", "« Nous poursuivrons tout journal qui publie », si le procès coûte plus qu'il ne rapporte."],
];
$('#concepts').innerHTML = CONCEPTS.map(([t, d, ex]) => `<div class="card"><h3>${t}</h3><div class="k">${d}</div><div class="k" style="color:var(--muted)"><b>Ici :</b> ${ex}</div></div>`).join('');

// mini-expérience menace crédible
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
  ['NYT', '--nyt', 'disc', 'New York Times', 'Publier ou non (x0).', "Informer, décrocher le scoop et le prestige ; ne pas se faire doubler par le Post.", "Frais de procès, censure, sanctions si la censure est maintenue."],
  ['RN', '--gov', 'disc', 'Administration Nixon', 'Poursuivre en justice ou laisser faire (x1, x4, x7).', "Protéger ses secrets et sa crédibilité ; éviter un précédent.", "Le coût des procès, surtout son image de censeur."],
  ['WP', '--wp', 'disc', 'Washington Post', 'Publier ou non : en relais du Times (x3) ou seul (x6).', "Devenir un grand journal national, informer.", "Amendes, prison, entrée en bourse ratée, licences de télévision."],
  ['', '--nat', 'diam', 'Juges locaux (Nature)', 'Refusent la censure avec la probabilité q (x2, x8).', "Appliquent le droit : ce ne sont pas des joueurs stratégiques.", '—'],
  ['', '--nat', 'diam', 'Cour suprême (Nature)', 'Donne raison aux journaux avec la probabilité p (x5).', "Tranche les deux affaires jointes.", '—'],
  ['DE', '--ell', 'disc', 'Daniel Ellsberg', 'Coup fixé : le Times d’abord, le Post si le Times est censuré ou refuse.', "Que tout soit publié.", "Jusqu'à 115 ans de prison (poursuites abandonnées en 1973)."],
];
$('#players').innerHTML = PLAYERS.map(([l, c, sh, n, a, obj, risk]) => `<div class="card"><div class="player">${sh === 'disc' ? `<div class="disc" style="background:var(${c})">${l}</div>` : `<div class="diam" style="background:var(${c})"></div>`}<h3>${n}</h3></div><div class="k"><b>Action :</b> ${a}</div><div class="k"><b>Objectif :</b> ${obj}</div>${risk !== '—' ? `<div class="k"><b>Risque :</b> ${risk}</div>` : ''}</div>`).join('');

// ====================== ISSUES ======================
const OUT_DESC = {
  O1: 'Les deux journaux ont publié et sont poursuivis ; la Cour suprême donne raison au gouvernement : censure confirmée et sanctions.',
  O2: 'Même chemin, mais la Cour suprême donne raison aux journaux : tout sort. C’est l’issue de 1971.',
  O3: 'Le Times est censuré, le Post publie et Nixon le laisse faire : tout sort, la censure du Times perd son objet.',
  O4: 'Le Times est censuré et le Post se tait : seule la part déjà publiée est connue.',
  O5: 'Nixon poursuit le Times, mais le juge local refuse la censure : le Times publie tout.',
  O6: 'Le Times publie et Nixon laisse faire : tout sort, sans procès.',
  O7: 'Le Times a renoncé ; le Post publie seul, il est poursuivi et censuré : sanctions.',
  O8: 'Le Times a renoncé ; le Post publie seul, il est poursuivi mais le juge refuse la censure.',
  O9: 'Le Times a renoncé ; le Post publie seul et Nixon le laisse faire.',
  O10: 'Le Times renonce et le Post aussi : rien ne sort.',
};
const CATS = [
  ['Pas de publication', '--muted', ['O10']],
  ["Pas d'action en justice", '--ok', ['O6', 'O9']],
  ['Action contre le Times uniquement', '--gov', ['O5', 'O4', 'O3']],
  ['Action contre le Post également', '--nat', ['O2', 'O1']],
  ['Action contre le Post seul', '--wp', ['O8', 'O7']],
];
$('#outcome-cards').innerHTML = CATS.map(([t, c, ids]) => `<div class="card"><div class="tag" style="color:var(${c})">${t}</div>${ids.map(id => `<div class="k"><b>${id}</b> · ${OUT_DESC[id]}</div>`).join('')}</div>`).join('');

// ====================== GAINS ======================
const ING = [
  ['B', 'Valeur de la publication', 'Le scoop, le prestige, la mission d’informer : <span class="m">B<sub>T</sub></span> = 100 pour le Times, <span class="m">B<sub>W</sub></span> = 120 pour le Post.'],
  ['θ', 'Part publiée avant une censure', '<span class="m">θ</span> = 0,3. Un journal censuré garde <span class="m">θB</span> ; Nixon ne subit alors que <span class="m">θD</span>.'],
  ['c', 'Frais totaux d’un procès', 'Avocats et procédures d’urgence, jusqu’au dernier tribunal : <span class="m">c<sub>T</sub></span> = 10, <span class="m">c<sub>W</sub></span> = 15.'],
  ['S', 'Sanction d’une censure maintenue', 'Poursuites, amendes ; pour le Post, bourse et licences : <span class="m">S<sub>T</sub></span> = 50, <span class="m">S<sub>W</sub></span> = 180.'],
  ['R', 'Scoop laissé au rival', 'Si le Times renonce et que le Post publie : <span class="m">R<sub>T</sub></span> = 50.'],
  ['D', 'Dommage de Nixon si tout sort', '<span class="m">D</span> = 200 : crédibilité de l’exécutif et précédent pour toutes les fuites futures.'],
  ['k', 'Coût total d’un procès pour Nixon', 'Frais et surtout image de censeur : <span class="m">k<sub>T</sub></span> = 10 contre le Times, <span class="m">k<sub>W</sub></span> = 20 contre le Post.'],
  ['q · p', 'Probabilités des tribunaux', '<span class="m">q</span> = 0,3 : un juge local refuse la censure. <span class="m">p</span> = 0,65 : la Cour suprême donne raison aux journaux.'],
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
  ['q = 0,3', 'Nature', 'Le juge Gurfein, en fonction depuis quelques jours, a suspendu le Times : en matière de sécurité nationale, une suspension provisoire s’obtient facilement.'],
  ['p = 0,65', 'Nature', 'La jurisprudence (Near v. Minnesota, 1931) est très hostile à la censure préalable, mais la Cour est divisée : 6 voix contre 3 au final.'],
];
$('#whytable').innerHTML = `<thead><tr><th>Valeur</th><th>Joueur</th><th>Justification</th></tr></thead><tbody>` + WHY.map(([v, j, t]) => `<tr><td class="v" style="text-align:left"><span class="m">${v}</span></td><td>${j}</td><td>${t}</td></tr>`).join('') + '</tbody>';
const DESC = {
  O1: 'Deux procès : la Cour suprême donne raison au gouvernement', O2: 'Deux procès : la Cour suprême donne raison aux journaux (1971)',
  O3: 'Times censuré ; le Post publie sans être poursuivi', O4: 'Times censuré ; le Post se tait', O5: 'Procès du Times : le juge local refuse la censure',
  O6: 'Le Times publie ; aucun procès', O7: 'Le Times renonce ; le Post, seul, est censuré', O8: 'Le Times renonce ; le juge refuse de censurer le Post',
  O9: 'Le Times renonce ; le Post publie seul, sans procès', O10: 'Personne ne publie',
};
let payMode = 'num';
function renderPay() {
  const O = outcomes(BASE);
  let h = `<thead><tr><th>Issue</th><th></th><th style="text-align:right;color:var(--nyt)">Times</th><th style="text-align:right;color:var(--wp)">Post</th><th style="text-align:right;color:var(--gov)">Nixon</th></tr></thead><tbody>`;
  for (const k of OUTCOME_ORDER) h += `<tr><td class="issue-id">${k}</td><td>${DESC[k]}</td>` + [0, 1, 2].map(j => `<td class="v" style="color:${['var(--nyt)', 'var(--wp)', 'var(--gov)'][j]}">${payMode === 'sym' ? `<span class="m" style="color:var(--ink)">${subH(SYM[k][j])}</span>` : fr(O[k][j])}</td>`).join('') + '</tr>';
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
  const O = outcomes(BASE);
  $('#calc').innerHTML = OUTCOME_ORDER.map(k => `<div class="calc-row"><div class="calc-head"><b>${k}</b> · ${TITLE[k].join(' ')}</div>` + [0, 1, 2].map(j => {
    const expr = SYM[k][j], constant = !/[A-Za-zθ]/.test(expr), simple = !/[−+×]/.test(numeric(expr, BASE).replace(/^−/, ''));
    const body = constant ? `<b>${fr(O[k][j])}</b>` : `<span class="m">${subH(expr)}</span>${simple ? '' : ' = ' + numeric(expr, BASE)} = <b>${fr(O[k][j])}</b>`;
    return `<div class="calc-line" style="--c:var(${['--nyt', '--wp', '--gov'][j]})"><span class="calc-who">${PLAYERS3[j]}</span><span>${body}</span></div>`;
  }).join('') + '</div>').join('');
})();

// ====================== PAS À PAS ======================
const M0 = solve(BASE);
function buildSteps(P, M) {
  const O = M.O, V = M.V, t = M.th;
  const cmp = (a, la, b, lb, verdict) => `<div class="cmp"><span class="opt ${a >= b ? 'win' : ''}">${la} : <b>${fr(a, 2)}</b></span> ${a > b ? '&gt;' : a < b ? '&lt;' : '='} <span class="opt ${a < b ? 'win' : ''}">${lb} : <b>${fr(b, 2)}</b></span><span class="verdict">⇒ ${verdict}</span></div>`;
  const nat = (pa, A, pb, Bv, R) => `<div class="eq">${dec(pa)} × ${vec(A)} + ${dec(pb)} × ${vec(Bv)} = <b>${vec(R)}</b></div>`;
  const ui = s => `<p class="ui" style="font-size:15px">${s}</p>`;
  return [
    ['Le principe', `<p>On part de la <b>fin</b> du jeu. À un nœud de la Nature, on remplace la loterie par son <b>gain espéré</b>. À un nœud de décision, on garde le <b>meilleur choix</b> du joueur qui décide et on reporte le triplet de gains. On traite d’abord la branche « le Times publie » (x5 → x1), puis la branche « le Times se tait » (x8 → x6), et on finit par le Times (x0).</p>`],
    ['Étape 1 · x5, Cour suprême (Nature)', nat(1 - P.p, O.O1, P.p, O.O2, V.x5) + ui('Gains espérés (Times ; Post ; Nixon) si les deux affaires, jointes, vont jusqu’à la Cour suprême.')],
    ['Étape 2 · x4, Nixon face au Post', cmp(V.x5[2], 'Poursuivre', O.O3[2], 'Laisser faire', M.g2Sue ? 'il poursuit' : 'il laisse faire') + `<div class="eq"><span class="m">(1 − p)(1 − θ)D &gt; k<sub>W</sub></span> ⟺ <span class="m">p &lt; 1 − <span class="frac"><span>k<sub>W</sub></span><span>(1 − θ)D</span></span></span> ≈ ${pct(t.gPost)} &nbsp;·&nbsp; ici ${dec(1 - P.p)} × ${dec(1 - P.th)} × ${fr(P.D)} = <b>${fr(t.kWcred)}</b> ${t.kWcred > P.k_W ? '&gt;' : '≤'} ${fr(P.k_W)}</div>` + ui(`Le dommage encore évitable en espérance (${fr(t.kWcred)}) dépasse le coût du procès (${fr(P.k_W)}) : la menace contre le Post est <b>crédible</b>.`)],
    ['Étape 3 · x3, le Post en relais', cmp(V.x4[1], 'Publier', O.O4[1], 'Ne pas publier', M.wPub ? 'il publie, de justesse' : 'il se tait') + `<div class="eq"><span class="m">p(B<sub>W</sub> − c<sub>W</sub>) + (1 − p)(θB<sub>W</sub> − c<sub>W</sub> − S<sub>W</sub>) ≥ 0</span> ⟺ <span class="m">p ≥ <span class="frac"><span>c<sub>W</sub> + S<sub>W</sub> − θB<sub>W</sub></span><span>(1 − θ)B<sub>W</sub> + S<sub>W</sub></span></span></span> = <span class="frac"><span>${fr(P.c_W + P.S_W - P.th * P.B_W)}</span><span>${fr((1 - P.th) * P.B_W + P.S_W)}</span></span> ≈ <b>${pct(t.tauW)}</b></div>` + ui(`Le calibrage de ${pct(P.p, 0)} place le Post juste au-dessus de son seuil : le modèle illustre une décision risquée, sans mesurer la croyance réelle de ses dirigeants.`)],
    ['Étape 4 · x2, juge local (Nature)', nat(1 - P.q, V.x3, P.q, O.O5, V.x2) + ui('Ce que chacun peut espérer si Nixon poursuit le Times : censure dans 70 % des cas (et la suite déjà résolue), refus dans 30 %.')],
    ['Étape 5 · x1, Nixon face au Times', cmp(V.x2[2], 'Poursuivre', O.O6[2], 'Laisser faire', M.g1Sue ? 'il poursuit' : 'il laisse faire') + `<div class="eq"><span class="m">k<sub>T</sub> + (1 − q)k<sub>W</sub> &lt; (1 − q)(1 − p)(1 − θ)D</span> &nbsp;·&nbsp; ici ${fr(P.k_T)} + ${dec(1 - P.q)} × ${fr(P.k_W)} = <b>${fr(t.totalCost)}</b> &lt; <b>${fr(t.avoided)}</b></div>` + ui('Ce premier procès n’a de sens que parce que Nixon est prêt à aller jusqu’au bout contre le Post. Sinon, le Post publierait sans risque et la censure du Times ne servirait à rien.')],
    ['Étape 6 · x8, juge local du Post seul (Nature)', nat(1 - P.q, O.O7, P.q, O.O8, V.x8) + ui('On passe à la branche que l’histoire n’a pas suivie : le Times a renoncé, le Post a publié seul et Nixon le poursuit.')],
    ['Étape 7 · x7, Nixon face au Post seul', cmp(V.x8[2], 'Poursuivre', O.O9[2], 'Laisser faire', M.g3Sue ? 'il poursuivrait' : 'il laisserait faire') + `<div class="eq"><span class="m">(1 − q)(1 − θ)D &gt; k<sub>W</sub></span> &nbsp;·&nbsp; ici ${dec(1 - P.q)} × ${fr(t.free)} = <b>${fr((1 - P.q) * t.free)}</b> &gt; ${fr(P.k_W)}</div>` + ui('Sans Cour suprême, la censure locale tiendrait : poursuivre le Post seul serait très rentable pour Nixon.')],
    ['Étape 8 · x6, le Post seul', cmp(V.x7[1], 'Publier', O.O10[1], 'Ne pas publier', M.wAlone ? 'il publierait' : 'il se tairait') + `<div class="eq"><span class="m">q(B<sub>W</sub> − c<sub>W</sub>) + (1 − q)(θB<sub>W</sub> − c<sub>W</sub> − S<sub>W</sub>) ≥ 0</span> ⟺ <span class="m">q ≥ ${pct(t.tauW)}</span> &nbsp;·&nbsp; ici <span class="m">q</span> = ${pct(P.q, 0)}</div>` + ui('Seul, le Post affronterait un juge local qui censure 7 fois sur 10, sans espoir rapide de Cour suprême. Il ne publierait pas : <b>sans le Times, rien ne sortirait</b>.')],
    ['Étape 9 · x0, le Times', cmp(V.x1[0], 'Publier', V.x6[0], 'Ne pas publier', M.tPub ? 'il publie' : 'il renonce') + ui(`Ne pas publier mènerait en O10 : le Times n’a pas à craindre d’être doublé ici. Il publie parce que ses chances de gagner au bout du compte (30 % devant le juge, puis 65 % à la Cour suprême grâce au relais du Post : ${pct(P.q + (1 - P.q) * P.p)}) dépassent largement son seuil de ${pct(t.tauT, 0)}.`)],
    ['L’ENPS', `<div class="chips"><span class="chip" style="--c:var(--nyt)">Times : publier</span><span class="chip" style="--c:var(--wp)">Post : (publier en relais ; se taire seul)</span><span class="chip" style="--c:var(--gov)">Nixon : (poursuivre le Times ; poursuivre le Post ; poursuivre le Post seul)</span></div>` + ui(`Une stratégie dit quoi faire à <b>chaque</b> nœud, même non atteint (x6, x7, x8). Gains espérés à l'équilibre : Times <b>${fr(M.root[0], 2)}</b> · Post <b>${fr(M.root[1], 2)}</b> · Nixon <b>${fr(M.root[2], 2)}</b>. L’ENPS est unique ; on compte pourtant 4 équilibres de Nash, qui ne diffèrent que par des actions hors du chemin (x6, x7).`)],
    ['1971 : le chemin suivi', ui('Le chemin d’équilibre, combiné aux tirages historiques de la Nature : <b>15 juin</b>, le juge local suspend le Times (70 % dans le modèle) ; <b>30 juin</b>, la Cour suprême donne raison aux journaux (65 % dans le modèle). On arrive en <b>O2</b>.') + ui(`Dans ce calibrage, trois issues ont une probabilité positive : O5 <b>${pct(M.probs.O5)}</b>, O2 <b>${pct(M.probs.O2)}</b>, O1 <b>${pct(M.probs.O1)}</b> (près d'une chance sur quatre de censure et de sanctions).`)],
  ];
}
const STEPS = buildSteps(BASE, M0);
let step = 0, reduceTree = true;
function renderStep() {
  $('#st-card').innerHTML = `<div class="ttl">${STEPS[step][0]}</div>${STEPS[step][1]}`;
  $('#st-dots').innerHTML = STEPS.map((s, i) => `<button type="button" aria-label="${esc(s[0])}" ${i === step ? 'aria-current="step"' : ''} data-i="${i}">${i === 0 ? '·' : i <= 9 ? i : i === 10 ? 'É' : '71'}</button>`).join('');
  let options = {};
  if (step >= 1 && step <= 9) {
    const node = INDUCTION_ORDER[step - 1], done = INDUCTION_ORDER.slice(0, step);
    options = reduceTree ? { root: node, reduce: true, solved: done, focus: node } : { solved: done, values: true, focus: node };
  } else if (step >= 10) options = { eq: true, values: true, probs: step === 11, path: step === 11 ? 'O2' : null };
  drawTree($('#tree-step'), BASE, { mode: 'num', ...options });
  $('#st-prev').disabled = step === 0; $('#st-next').disabled = step === STEPS.length - 1;
  $('#reduction-toggle').setAttribute('aria-pressed', String(reduceTree));
  $('#reduction-toggle').textContent = reduceTree ? 'Voir l’arbre entier' : 'Isoler le calcul courant';
  $('#reduction-caption').textContent = step >= 1 && step <= 9 && reduceTree
    ? 'Sous-jeu courant : les suites déjà résolues sont remplacées par leurs profils de gains. La composante du joueur qui décide est encadrée. On remonte ensuite d’un nœud.'
    : step >= 10 ? 'Les décisions forment un plan complet. La Nature conserve ses deux branches possibles : un ENPS ne fixe pas le verdict des juges.'
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
  ['x₀ · Le Times', 'Le Times joue en premier : publier ou ne pas publier. Aucune des deux branches ne se termine encore : quoi que fasse le Times, quelqu’un joue après lui. C’est la nouveauté de notre arbre : si le Times se tait, Ellsberg peut se tourner vers le Post.'],
  ['x₁ · Nixon face au Times', 'Après la publication, l’administration Nixon observe cette action. Elle poursuit le Times ou laisse faire. Laisser faire termine le jeu en O6 : tout sort, sans procès. Chaque nœud de Nixon sera distinct : on ne fusionne pas ses décisions.'],
  ['x₂ · Le juge local (Nature)', 'Poursuivre ne suffit pas à censurer : un juge doit l’ordonner. La Nature joue : refus de la censure avec la probabilité q (O5, le Times publie tout) ou censure avec 1 − q. Les probabilités des deux branches s’additionnent à 1. Avec q = 0, on retrouverait l’idée « poursuivre = censurer ».'],
  ['x₃ · Le Post, en relais', 'Le Times est censuré ; Ellsberg remet les documents au Post. Ne pas publier mène en O4 : Times censuré, Post muet. Publier ouvre une nouvelle décision de Nixon. Tout ce qui suit x₃ forme le sous-jeu du Post.'],
  ['x₄ · Nixon face au Post', 'Laisser faire mène en O3 : le Post publie, tout sort et la censure du Times perd son objet. Poursuivre porte les deux affaires, jointes, devant la Cour suprême.'],
  ['x₅ · La Cour suprême (Nature)', 'Elle donne raison au gouvernement avec la probabilité 1 − p (O1 : censure confirmée et sanctions) ou aux journaux avec p (O2, l’issue de 1971). La branche « le Times publie » est complète : six issues.'],
  ['x₆ · Le Post, si le Times se tait', 'Retour à la racine : si le Times renonce, le Post peut publier seul. Ne pas publier mène en O10 : rien ne sort. Le Post a maintenant deux nœuds : sa stratégie devra préciser une action à chacun.'],
  ['x₇ · Nixon face au Post seul', 'Laisser faire mène en O9 : le Post publie seul, sans procès. Poursuivre mène devant un juge local. Nixon a désormais trois nœuds, donc 2 × 2 × 2 = 8 stratégies.'],
  ['x₈ · Le juge local (Nature)', 'Sans second journal, pas d’affaires jointes ni de Cour suprême en urgence : le juge local tranche. Censure (1 − q) : O7 ; refus (q) : O8. L’arbre est complet : neuf nœuds non terminaux et dix feuilles.'],
];
const TREE_PATHS = {
  O1: ['Le Times publie → Nixon poursuit → censure locale → le Post publie → Nixon poursuit → la Cour suprême donne raison au gouvernement.', 'Deux procès ; censure et sanctions.'],
  O2: ['Le Times publie → Nixon poursuit → censure locale → le Post publie → Nixon poursuit → la Cour suprême donne raison aux journaux.', 'Deux procès ; publication complète.'],
  O3: ['Le Times publie → Nixon poursuit → censure locale → le Post publie → Nixon laisse faire.', 'Un procès ; le Post diffuse les documents.'],
  O4: ['Le Times publie → Nixon poursuit → censure locale → le Post se tait.', 'Un procès ; publication partielle seulement.'],
  O5: ['Le Times publie → Nixon poursuit → le juge local refuse la censure.', 'Un procès ; publication complète.'],
  O6: ['Le Times publie → Nixon laisse faire.', 'Aucun procès.'],
  O7: ['Le Times renonce → le Post publie seul → Nixon poursuit → censure locale.', 'Un procès contre le Post ; censure et sanctions.'],
  O8: ['Le Times renonce → le Post publie seul → Nixon poursuit → le juge local refuse la censure.', 'Un procès contre le Post ; publication complète.'],
  O9: ['Le Times renonce → le Post publie seul → Nixon laisse faire.', 'Aucun procès ; le Post publie seul.'],
  O10: ['Le Times renonce → le Post renonce aussi.', 'Aucune publication.'],
};
$('#tree-path').insertAdjacentHTML('beforeend', OUTCOME_ORDER.map(k => `<option value="${k}">${k} · ${TITLE[k].join(' ')}</option>`).join(''));
let treeView = 'build', buildStage = 1, treePath = '', subgameRoot = 'x3', mainMode = 'num';
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
  const options = { mode: mainMode };
  if (treeView === 'build') options.built = NODE_ORDER.slice(0, buildStage);
  if (treeView === 'full' && treePath) options.path = treePath;
  if (treeView === 'post') options.root = subgameRoot;
  drawTree($('#tree-main'), BASE, options);
  $('#t-sym').setAttribute('aria-pressed', String(mainMode === 'sym'));
  $('#t-num').setAttribute('aria-pressed', String(mainMode === 'num'));
  document.querySelectorAll('[data-tree-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.treeView === treeView)));
  document.querySelectorAll('[data-subgame]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.subgame === subgameRoot)));
  $('#tree-build-controls').hidden = treeView !== 'build'; $('#tree-path-control').hidden = treeView !== 'full'; $('#tree-sub-control').hidden = treeView !== 'post';
  $('#build-count').textContent = buildStage + ' / ' + TREE_GUIDE_STEPS.length; $('#build-prev').disabled = buildStage === 1; $('#build-next').disabled = buildStage === TREE_GUIDE_STEPS.length;
  let title, copy;
  if (treeView === 'build') [title, copy] = TREE_GUIDE_STEPS[buildStage - 1];
  else if (treeView === 'post') {
    title = 'Un sous-jeu contient toutes les suites possibles.';
    copy = subgameRoot === 'x3'
      ? 'On part de x₃, où le Post décide après la censure du Times, et on conserve ses deux actions et tous les nœuds qui suivent. Un seul chemin vers O2 ne serait pas un sous-jeu. Les coûts déjà engagés (le procès du Times) restent inclus dans les gains affichés.'
      : 'On part de x₆, où le Post décide si le Times a renoncé. Ce sous-jeu n’est jamais atteint en 1971, mais l’ENPS exige d’y prévoir une conduite optimale : c’est lui qui dit ce que vaut, pour le Times, le fait de se taire.';
  } else if (treePath) { title = treePath + ' · ' + TREE_PATHS[treePath][1]; copy = TREE_PATHS[treePath][0] + ' On lit ici une histoire possible : la mettre en évidence ne signifie pas que c’est un équilibre.'; }
  else { title = 'Dix feuilles, dix histoires possibles.'; copy = 'Partez du Times et descendez jusqu’à une feuille. Chaque feuille reçoit trois gains, dans l’ordre Times / Post / Nixon. Dans le cours, cet ordre est celui des joueurs : il ne change pas selon la personne qui vient de jouer.'; }
  $('#tree-guide-copy').innerHTML = '<h3>' + title + '</h3><p>' + copy + '</p>';
  frameTreeRoot($('#tree-main'), treeView === 'build' ? NODE_ORDER[buildStage - 1] : null);
}
$('#t-sym').onclick = () => { mainMode = 'sym'; renderMain(); };
$('#t-num').onclick = () => { mainMode = 'num'; renderMain(); };
document.querySelectorAll('[data-tree-view]').forEach(button => button.addEventListener('click', () => { treeView = button.dataset.treeView; renderMain(); }));
document.querySelectorAll('[data-subgame]').forEach(button => button.addEventListener('click', () => { subgameRoot = button.dataset.subgame; renderMain(); }));
$('#build-prev').addEventListener('click', () => { buildStage = Math.max(1, buildStage - 1); renderMain(); });
$('#build-next').addEventListener('click', () => { buildStage = Math.min(TREE_GUIDE_STEPS.length, buildStage + 1); renderMain(); });
$('#tree-path').addEventListener('change', e => { treePath = e.target.value; renderMain(); });
document.addEventListener('papers:chapter', event => document.querySelectorAll('#' + event.detail.id + ' .course-tree').forEach(svg => frameTreeRoot(svg)));
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
  ['Nature', '--nat', [['q', 'Un juge local refuse la censure (q)', 0, 1, 0.01, 'pct'], ['p', 'La Cour suprême donne raison aux journaux (p)', 0, 1, 0.01, 'pct'], ['th', 'Part publiée avant une censure (θ)', 0, 0.95, 0.01, 'dec']]],
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
  L.push(`Cour suprême (x5) : si les deux journaux sont poursuivis, les gains espérés valent ${vec(V.x5)}.`);
  L.push(`Face au Post (x4), Nixon ${M.g2Sue ? '<b>poursuivrait</b>' : '<b>laisserait faire</b>'} : ${fr(V.x5[2], 2)} en poursuivant ${sign(V.x5[2], O.O3[2])} ${fr(O.O3[2], 2)} sans procès. ${thresholdText('government', M)}`);
  L.push(`Le Post en relais (x3) ${M.wPub ? '<b>publierait</b>' : '<b>se tairait</b>'} : publier lui rapporterait ${fr(V.x4[1], 2)} ${sign(V.x4[1], 0)} 0. ${thresholdText('post', M)}`);
  L.push(`Juge local (x2) : si le Times est poursuivi, les gains espérés valent ${vec(V.x2)}.`);
  L.push(`Face au Times (x1), Nixon ${M.g1Sue ? '<b>poursuit</b>' : '<b>laisse faire</b>'} : ${fr(V.x2[2], 2)} en poursuivant ${sign(V.x2[2], O.O6[2])} ${fr(O.O6[2], 2)} sans procès.${!M.g1Sue && M.wPub && !M.g2Sue ? ' Censurer le Times ne servirait à rien : le Post publierait sans risque.' : ''}`);
  L.push(`Si le Times se taisait : juge local (x8) ${vec(V.x8)} ; Nixon ${M.g3Sue ? 'poursuivrait' : 'laisserait faire'} le Post seul (x7) ; le Post ${M.wAlone ? '<b>publierait seul</b>' : '<b>se tairait</b>'} (x6), d’où ${vec(V.x6)} au nœud x6.`);
  L.push(`Le Times (x0) ${M.tPub ? '<b>publie</b>' : '<b>ne publie pas</b>'} : ${fr(V.x1[0], 2)} en publiant ${sign(V.x1[0], V.x6[0])} ${fr(V.x6[0], 2)} en se taisant.${M.tPub && V.x1[0] < 0 ? ' Il publie à perte, pour ne pas laisser le scoop au Post.' : ''}`);
  return L.map((t, i) => `<div class="ln"><b class="n">${i + 1}</b><span>${t}</span></div>`).join('') +
    `<div class="note ${M.full > 0.5 ? 'green' : 'red'}" style="margin-top:6px">Probabilité que tout sorte : <b>${pct(M.full)}</b>. Probabilité que l'essentiel reste secret : <b>${pct(1 - M.full)}</b>.</div>`;
}
const PC = { O1: ['#8F1C13', 'O1 censure confirmée'], O2: ['#17695B', 'O2 victoire des journaux'], O3: ['#3E7D8C', 'O3 le Post publie sans procès'], O4: ['#B42318', 'O4 Times censuré, Post muet'], O5: ['#4E8F72', 'O5 le juge donne raison au Times'], O6: ['#2C7A4B', 'O6 tout sort sans procès'], O7: ['#6E2B62', 'O7 Post censuré'], O8: ['#3F6F9E', 'O8 le juge donne raison au Post'], O9: ['#2F5F8A', 'O9 le Post publie seul'], O10: ['#7D776B', 'O10 rien ne sort'] };
function renderLab() {
  const M = drawTree($('#tree-lab'), LP, { mode: 'num', eq: true, probs: true, values: true });
  const reg = $('#lab-regime'), key = regKey(M); reg.textContent = REG[key].label; reg.style.background = `var(${REG[key].css})`;
  $('#lab-strat').innerHTML = `<span class="chip" style="--c:var(--nyt)">Times : ${M.tPub ? 'publier' : 'ne pas publier'}</span><span class="chip" style="--c:var(--wp)">Post : (${M.wPub ? 'publier' : 'se taire'} en relais ; ${M.wAlone ? 'publier' : 'se taire'} seul)</span><span class="chip" style="--c:var(--gov)">Nixon : (${M.g1Sue ? 'poursuivre' : 'laisser faire'} le Times ; ${M.g2Sue ? 'poursuivre' : 'laisser faire'} le Post ; ${M.g3Sue ? 'poursuivre' : 'laisser faire'} le Post seul)</span>`;
  const ent = Object.entries(M.probs).filter(([, v]) => v > 1e-9);
  $('#lab-prob').innerHTML = ent.map(([k, v]) => `<div style="width:${v * 100}%;background:${PC[k][0]}">${v > 0.07 ? pct(v) : ''}</div>`).join('');
  $('#lab-problab').innerHTML = ent.map(([k, v]) => `<span><span class="dot" style="background:${PC[k][0]}"></span> ${PC[k][1]} · <b class="mono">${pct(v)}</b></span>`).join('');
  $('#lab-explain').innerHTML = explain(LP, M);
  drawMap($('#map2'), LP, 'vous'); legend($('#legend2'), LP);
  drawStrips($('#strips2'), LP, true);
  try { localStorage.setItem('pp-lab-v2', JSON.stringify(LP)); } catch (e) {}
}
hookMap($('#map2'), () => LP, (q, p) => { LP.q = q; LP.p = p; syncSliders(); renderLab(); });

// ====================== ÉNONCÉ ======================
const ANS = [
  ['Identifier les joueurs et l’ordre dans lequel ils interviennent',
    `<p>Trois joueurs stratégiques : le <b>New York Times</b>, le <b>Washington Post</b> et l’<b>administration Nixon</b>. Les tribunaux sont représentés par la <b>Nature</b> : un juge local refuse la censure avec la probabilité <span class="m">q</span>, la Cour suprême donne raison aux journaux avec la probabilité <span class="m">p</span>. Ellsberg déclenche le jeu par un coup fixé.</p>
     <p>Ordre : Times (x0) → Nixon (x1) → juge local (x2) → Post (x3) → Nixon (x4) → Cour suprême (x5). Si le Times renonce : Post (x6) → Nixon (x7) → juge local (x8). Chaque joueur observe tout ce qui précède : le jeu est à information parfaite (<a href="#joueurs">pièce 4</a>).</p>`],
  ['Identifier les différents résultats potentiels',
    `<p>Dix issues, classées comme dans l’énoncé :</p>
     <ul><li><b>Pas de publication</b> : O10.</li><li><b>Pas d’action en justice</b> : O6 (le Times publie), O9 (le Post publie seul).</li><li><b>Action contre le New York Times uniquement</b> : O5 (le juge refuse la censure), O4 (Times censuré, Post muet), O3 (le Post publie sans être poursuivi).</li><li><b>Action contre le Washington Post également</b> : O2 (victoire des journaux, 1971), O1 (censure confirmée et sanctions).</li><li><b>Action contre le Post seul</b>, si le Times renonce : O8, O7.</li></ul>
     <p>Voir <a href="#arbre">pièce 5</a>.</p>`],
  ['Impact du coût total des procédures et des probabilités : quand publie-t-on, quand attaque-t-on ?',
    `<p><b>Les journaux.</b> Face à un procès, un journal publie si la probabilité que la justice lui donne finalement raison atteint son seuil <span class="m">τ = (c + S − θB) / ((1 − θ)B + S)</span>.</p>
     <ul><li>Post en relais : <span class="m">p</span> ≥ 159/264 ≈ <b>60,2 %</b> (il affronte la Cour suprême).</li><li>Post seul : <span class="m">q</span> ≥ <b>60,2 %</b> (il n’affronte que le juge local).</li><li>Times : <span class="m">q + (1 − q)p</span> ≥ <b>25 %</b> s’il anticipe le relais du Post, <span class="m">q</span> ≥ 25 % sinon.</li><li>Si la menace de procès n’est pas crédible, le journal publie sans condition.</li></ul>
     <p><b>L’administration.</b> Elle poursuit le Post en relais si <span class="m">p</span> &lt; <b>85,7 %</b>, le Post seul si <span class="m">q</span> &lt; 85,7 %, et le Times si <span class="m">q</span> &lt; <b>65,5 %</b> (avec <span class="m">p</span> = 65 %, quand le Post prendrait le relais), <span class="m">q</span> &lt; 92,9 % si le Post se tairait, jamais si le Post publierait sans être poursuivi.</p>
     <p><b>Le coût total.</b> Nixon engage les deux procès si <span class="m">k<sub>T</sub> + (1 − q)k<sub>W</sub> &lt; (1 − q)(1 − p)(1 − θ)D</span> (ici 24 &lt; 34,3) et si <span class="m">k<sub>W</sub> &lt; (1 − p)(1 − θ)D</span> (20 &lt; 49). Plus les procès coûtent, plus ces conditions se resserrent (<a href="#resolution">pièces 8</a>, <a href="#carte">9</a> et <a href="#couts">11</a>).</p>`],
  ['Valeurs pour lesquelles les documents ne sont pas publiés, et pourquoi',
    `<ul><li><b>Le Post prend peur</b> (<span class="m">p</span> = 50 %, ou <span class="m">S<sub>W</sub></span> = 250, ou <span class="m">c<sub>W</sub></span> &gt; 27,6) : en relais, il perdrait en moyenne (−27 ou −11,9), donc il se tait. Nixon poursuit le Times et la censure tient 70 % du temps (O4).</li>
     <li><b>Le Times renonce</b> (<span class="m">c<sub>T</sub></span> = 80, ou <span class="m">S<sub>T</sub></span> &gt; 297) : publier lui rapporterait −9,4. Seul, le Post perdrait 79,8 : personne ne publie (O10).</li>
     <li><b>Des tribunaux hostiles</b> (<span class="m">q</span> = 20 %, <span class="m">p</span> = 50 %) : le Post ne prendrait pas le relais ; le Times n’a alors que 20 % de chances, sous son seuil de 25 % : O10.</li>
     <li>Dans le scénario de référence, le secret garde tout de même <b>24,5 %</b> de chances de tenir (O1) : ce n’est pas un choix, c’est l’issue défavorable d’un procès.</li>
     <li>Un équilibre de Nash peut garder le secret grâce à une menace non crédible (<span class="m">p</span> = 50 %, <span class="m">k<sub>W</sub></span> = 80) ; l’ENPS l’écarte (<a href="#secret">pièce 10</a>).</li></ul>`],
  ['Importance des coûts associés aux différentes actions en justice',
    `<ul><li><b>Côté Nixon, le coût du second procès commande le premier.</b> <span class="m">k<sub>W</sub></span> &lt; 34,7 : deux procès. Entre 34,7 et 49 : aucun procès (la menace contre le Post resterait crédible, mais le premier procès ne rapporte plus assez). Au-delà de 49 : aucun procès, la menace n’est plus crédible. <span class="m">k<sub>T</sub></span> ≥ 20,3 : aucun procès.</li>
     <li><b>Côté journaux, le Post est le maillon faible</b> (seuil de 60,2 % pour 65 % de chances) : des frais au-delà de 27,6 ou une sanction au-delà de 216 le font taire, et la censure du Times devient efficace. Le Times résiste jusqu’à 70,6 de frais ; au-delà, rien ne sort.</li>
     <li>Des procès chers pour le pouvoir rendent la presse plus libre ; des procès chers pour les journaux mènent à l’autocensure (<a href="#couts">pièce 11</a>).</li></ul>`],
  ['Des gains cohérents et les ENPS qui rationalisent l’issue',
    `<p>Les gains suivent cinq règles identiques dans tous les sous-jeux (<a href="#gains">pièce 7</a>). L’ENPS, unique, est :</p>
     <ul><li><b>Times</b> : publier.</li><li><b>Post</b> : (publier après la censure du Times ; se taire si le Times renonce).</li><li><b>Nixon</b> : (poursuivre le Times ; poursuivre le Post ; poursuivre le Post seul).</li></ul>
     <p>Sous-jeu du Post en relais (x3) : le Post publie, Nixon le poursuit, gains espérés (48 ; 12,6 ; −181). Sous-jeu « le Times se tait » (x6) : le Post se tairait, donc O10. Jeu complet : (60,6 ; 8,82 ; −189,7).</p>
     <p><b>Résultat.</b> Le Times publie → Nixon poursuit → [censure, 70 %] → le Post publie → Nixon poursuit → [Cour suprême favorable aux journaux, 65 %] → <b>O2, l’issue de 1971</b> (probabilité de 45,5 % avant le premier article).</p>
     <p><b>Ce que le modèle explique.</b> Le Times publie car ses chances (75,5 % grâce au relais) dépassent son seuil (25 %). Nixon attaque car la censure peut tenir jusqu’au bout (24,5 %) et les procès coûtent moins que le dommage évité. Le Post publie car ses chances à la Cour suprême (65 %) dépassent de peu son seuil (60,2 %). Seul, il ne l’aurait pas fait (<a href="#resolution">pièce 8</a>).</p>`],
];
$('#answers').innerHTML = ANS.map(([t, a], i) => `<article class="answer"><div class="answer-n">${String(i + 1).padStart(2, '0')}</div><div><h3>${t}</h3><div class="answer-body">${a}</div></div></article>`).join('');

// ====================== QUIZ ======================
const QUIZ = [
  ['Pourquoi modélise-t-on les juges comme « la Nature » ?', ['Parce qu’ils jouent toujours en dernier', 'Parce que leur verdict est incertain pour les joueurs et ne suit pas une logique de gains', 'Parce qu’ils sont neutres politiquement'], 1, 'On ne leur attribue pas de gains : on représente l’incertitude sur leur verdict par des probabilités (q, p).'],
  ['Combien de stratégies le Post a-t-il dans notre arbre ?', ['2', '4', '8'], 1, 'Il décide à deux nœuds (x3 et x6), avec deux actions chacun : 2 × 2 = 4 stratégies.'],
  ['Par quels nœuds commence l’induction à rebours ?', ['Par le Times', 'Par les coups de la Nature les plus bas : la Cour suprême (x5) et le juge du Post seul (x8)', 'Par Nixon face au Times'], 1, 'On part des nœuds dont toutes les suites sont des feuilles, puis on remonte jusqu’au Times.'],
  ['Avec nos valeurs, à partir de quelle probabilité de victoire à la Cour suprême le Post publie-t-il en relais ?', ['50 %', 'Environ 60 %', '86 %'], 1, '(c_W + S_W − θB_W)/((1 − θ)B_W + S_W) = 159/264 ≈ 60,2 %. 85,7 % est le seuil de Nixon.'],
  ['Si le Times avait renoncé, que se serait-il passé avec nos valeurs ?', ['Le Post aurait publié seul', 'Rien ne serait sorti', 'Nixon aurait poursuivi le Times'], 1, 'Seul, le Post n’affronterait que le juge local (30 % de chances) : publier lui rapporterait −79,8 en moyenne. Il se tairait : O10.'],
  ['Si poursuivre le Post coûtait 40 à Nixon (au lieu de 20), que se passerait-il ?', ['Toujours deux procès', 'Aucun procès : le Times publie librement', 'Le Times renoncerait à publier'], 1, 'Le gain net du 2e procès tombe à 9 : 0,7 × 9 = 6,3 &lt; 10, poursuivre le Times ne vaut plus la peine.'],
  ['Qu’est-ce qu’une menace non crédible ?', ['Une menace qu’on n’aurait pas intérêt à exécuter le moment venu', 'Une menace annoncée en secret', 'Une menace qui coûte cher à celui qui la subit'], 0, 'L’ENPS impose d’agir au mieux dans chaque sous-jeu : une telle menace ne dissuade personne.'],
  ['Avant le premier article, quelle était la probabilité (dans le modèle) d’une censure confirmée avec sanctions ?', ['7 %', '24,5 %', '65 %'], 1, '(1 − q)(1 − p) = 0,7 × 0,35 = 0,245.'],
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
  ['Nature', 'Joueur fictif qui représente le hasard ; ses coups ont des probabilités connues.'],
  ['Gain espéré', 'Moyenne des gains pondérée par les probabilités : p × a + (1 − p) × b.'],
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
