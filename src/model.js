'use strict';
// ====================== MODÈLE ======================
/* Jeu séquentiel à information parfaite entre trois joueurs : Times, Post, Nixon (administration).
   Ordre des gains, partout : Times, Post, Nixon.
   Les juges ne sont pas des joueurs : ils n'ont ni gains ni choix stratégique. Ils n'apparaissent
   donc pas comme nœuds de l'arbre ; leurs verdicts (probabilités q et p) sont intégrés dans les
   gains des feuilles, sous forme de gains espérés.
   Six nœuds de décision (x0 … x5) et sept feuilles (O1 … O7, de gauche à droite sous l'arbre).
   Un journal qui ne publie pas a toujours un gain de 0 : c'est le cas du Times s'il renonce. */
const BASE = { q: 0.30, p: 0.65, th: 0.30, B_T: 100, c_T: 10, S_T: 50, B_W: 120, c_W: 15, S_W: 180, D: 200, k_T: 10, k_W: 20 };
const PLAYERS3 = ['Times', 'Post', 'Nixon'];

/* Situations finales possibles, une fois les juges passés. Chacune est décrite par des faits :
   pubT / pubW : le journal a publié ; suedT / suedW : il est poursuivi ;
   censT / censW : sa censure est maintenue ;
   docs : ce qui est public à la fin ('all' : tout, 'part' : la part θ déjà parue, 'none' : rien). */
const SITUATION_ORDER = ['judgeTimes', 'press', 'gov', 'postFree', 'timesCensored', 'noSuit', 'judgePost', 'postCensored', 'postAlone', 'nothing'];
const SITUATION = {
  judgeTimes: { label: 'La 1re cour refuse de censurer le Times', short: '1re cour favorable au Times', docs: 'all', pubT: 1, suedT: 1 },
  press: { label: '2e cour : victoire des journaux (1971)', short: 'victoire des journaux', docs: 'all', pubT: 1, suedT: 1, pubW: 1, suedW: 1 },
  gov: { label: '2e cour : censure confirmée + sanctions', short: 'censure confirmée', docs: 'part', pubT: 1, suedT: 1, censT: 1, pubW: 1, suedW: 1, censW: 1 },
  postFree: { label: 'Times censuré, le Post publie sans procès', short: 'le Post publie librement', docs: 'all', pubT: 1, suedT: 1, pubW: 1 },
  timesCensored: { label: 'Times censuré, le Post se tait', short: 'Times censuré', docs: 'part', pubT: 1, suedT: 1, censT: 1 },
  noSuit: { label: 'Le Times publie, aucun procès', short: 'tout sort sans procès', docs: 'all', pubT: 1 },
  judgePost: { label: 'La 1re cour refuse de censurer le Post seul', short: '1re cour favorable au Post', docs: 'all', pubW: 1, suedW: 1 },
  postCensored: { label: 'Le Post seul est censuré + sanctions', short: 'Post censuré', docs: 'part', pubW: 1, suedW: 1, censW: 1 },
  postAlone: { label: 'Le Post publie seul, aucun procès', short: 'le Post publie seul', docs: 'all', pubW: 1 },
  nothing: { label: 'Personne ne publie', short: 'rien ne sort', docs: 'none' },
};
/* Une équation par joueur, appliquée de la même façon à toutes les situations (σ = part publique) :
   journal : 0 s'il n'a pas publié ; sinon B·σ − c (s'il est poursuivi) − S (si sa censure est maintenue) ;
   Nixon   : −D·σ − k_T (s'il poursuit le Times) − k_W (s'il poursuit le Post). */
const shareOf = (f, P) => (f.docs === 'all' ? 1 : f.docs === 'part' ? P.th : 0);
function gains(f, P) {
  const sigma = shareOf(f, P);
  const paper = (pub, sued, cens, B, c, S) => (pub ? B * sigma - (sued ? c : 0) - (cens ? S : 0) : 0);
  return [
    paper(f.pubT, f.suedT, f.censT, P.B_T, P.c_T, P.S_T),
    paper(f.pubW, f.suedW, f.censW, P.B_W, P.c_W, P.S_W),
    -P.D * sigma - (f.suedT ? P.k_T : 0) - (f.suedW ? P.k_W : 0) + 0,
  ];
}
/* La même équation, écrite en symboles (pour l'affichage). */
function symbols(f) {
  const t = f.docs === 'part' ? 'θ' : '';
  const paper = (pub, sued, cens, j) => (pub ? `${t}B_${j}${sued ? ` − c_${j}` : ''}${cens ? ` − S_${j}` : ''}` : '0');
  const nixon = [f.docs === 'none' ? '' : `−${t}D`, f.suedT ? '− k_T' : '', f.suedW ? '− k_W' : ''].filter(Boolean).join(' ') || '0';
  return [paper(f.pubT, f.suedT, f.censT, 'T'), paper(f.pubW, f.suedW, f.censW, 'W'), nixon];
}
for (const f of Object.values(SITUATION)) f.sym = symbols(f);
function situations(P) { return Object.fromEntries(SITUATION_ORDER.map(k => [k, gains(SITUATION[k], P)])); }

/* Chaque feuille est une loterie sur les situations finales : seuls les juges ont une probabilité.
   1re cour (juge local) : refuse la censure avec la probabilité q.
   2e cour (Cour suprême), saisie quand les deux journaux sont poursuivis : donne raison aux journaux avec la probabilité p.
   [situation, probabilité, verdict en mots, probabilité en symboles]. */
const LEAVES = {
  O1: { title: ['Procès du Post', '+ tribunaux'], lottery: P => [
    ['judgeTimes', P.q, 'la 1re cour refuse de censurer le Times', 'q'],
    ['press', (1 - P.q) * P.p, 'la 1re cour censure le Times, puis la 2e cour donne raison aux journaux', '(1 − q) × p'],
    ['gov', (1 - P.q) * (1 - P.p), 'la 1re cour censure le Times, puis la 2e cour donne raison au gouvernement', '(1 − q) × (1 − p)']] },
  O2: { title: ['Le Post publie,', 'pas de procès'], lottery: P => [
    ['judgeTimes', P.q, 'la 1re cour refuse de censurer le Times', 'q'],
    ['postFree', 1 - P.q, 'la 1re cour censure le Times, le Post publie tout', '1 − q']] },
  O3: { title: ['Times censuré,', 'Post muet'], lottery: P => [
    ['judgeTimes', P.q, 'la 1re cour refuse de censurer le Times', 'q'],
    ['timesCensored', 1 - P.q, 'la 1re cour censure le Times et la censure tient', '1 − q']] },
  O4: { title: ['Tout sort,', 'sans procès'], lottery: () => [['noSuit', 1, 'aucun juge n’intervient', '1']] },
  O5: { title: ['Procès du Post', '+ juge local'], lottery: P => [
    ['judgePost', P.q, 'la 1re cour refuse de censurer le Post', 'q'],
    ['postCensored', 1 - P.q, 'la 1re cour censure le Post et la censure tient', '1 − q']] },
  O6: { title: ['Le Post', 'publie seul'], lottery: () => [['postAlone', 1, 'aucun juge n’intervient', '1']] },
  O7: { title: ['Rien', 'ne sort'], lottery: () => [['nothing', 1, 'aucun juge n’intervient', '1']] },
};
const TITLE = Object.fromEntries(Object.entries(LEAVES).map(([k, v]) => [k, v.title]));
const COURT_LEAVES = ['O1', 'O2', 'O3', 'O5'];
/* Gains des feuilles : espérance des situations finales, pondérées par les verdicts des juges. */
function outcomes(P) {
  const S = situations(P);
  return Object.fromEntries(Object.entries(LEAVES).map(([id, leaf]) => [id, [0, 1, 2].map(k => leaf.lottery(P).reduce((sum, [s, w]) => sum + w * S[s][k], 0))]));
}
/* actions : [libellé, nœud suivant]. tie : action retenue à égalité (publier ; ne pas poursuivre). */
const NODES = {
  x0: { kind: 'decision', player: 0, name: 'Times', long: 'New York Times', actions: [['Publier', 'x1'], ['Ne pas publier', 'x4']], tie: 0 },
  x1: { kind: 'decision', player: 2, name: 'Nixon', long: 'Nixon face au Times', actions: [['Poursuivre', 'x2'], ['Laisser faire', 'O4']], tie: 1 },
  x2: { kind: 'decision', player: 1, name: 'Post', long: 'Post, après la poursuite du Times', actions: [['Publier', 'x3'], ['Ne pas publier', 'O3']], tie: 0 },
  x3: { kind: 'decision', player: 2, name: 'Nixon', long: 'Nixon face au Post', actions: [['Poursuivre', 'O1'], ['Laisser faire', 'O2']], tie: 1 },
  x4: { kind: 'decision', player: 1, name: 'Post', long: 'Post, si le Times se tait', actions: [['Publier', 'x5'], ['Ne pas publier', 'O7']], tie: 0 },
  x5: { kind: 'decision', player: 2, name: 'Nixon', long: 'Nixon face au Post seul', actions: [['Poursuivre', 'O5'], ['Laisser faire', 'O6']], tie: 1 },
};
const NODE_ORDER = ['x0', 'x1', 'x2', 'x3', 'x4', 'x5'];
const OUTCOME_ORDER = ['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7'];
/* Ordre de l'induction à rebours : chaque nœud n'est traité qu'une fois ses suites résolues. */
const INDUCTION_ORDER = ['x3', 'x2', 'x1', 'x5', 'x4', 'x0'];
const mix = (a, pa, b) => a.map((x, i) => pa * x + (1 - pa) * b[i]);
const isOutcome = id => /^O\d+$/.test(id);

function solve(P) {
  const O = outcomes(P), S = situations(P);
  const V = {}, choice = {}, EPS = 1e-9;
  const value = id => {
    if (isOutcome(id)) return O[id];
    if (V[id]) return V[id];
    const n = NODES[id];
    const first = value(n.actions[0][1]), second = value(n.actions[1][1]);
    const gap = first[n.player] - second[n.player];
    choice[id] = Math.abs(gap) <= EPS ? n.tie : gap > 0 ? 0 : 1;
    V[id] = choice[id] === 0 ? first : second;
    return V[id];
  };
  const root = value('x0');
  const probs = Object.fromEntries(OUTCOME_ORDER.map(k => [k, 0]));
  (function walk(id) {
    if (isOutcome(id)) { probs[id] = 1; return; }
    walk(NODES[id].actions[choice[id]][1]);
  })('x0');
  /* Probabilité de chaque situation finale : feuille d'équilibre × verdicts des juges. */
  const situ = Object.fromEntries(SITUATION_ORDER.map(k => [k, 0]));
  for (const id of OUTCOME_ORDER) if (probs[id]) for (const [s, w] of LEAVES[id].lottery(P)) situ[s] += probs[id] * w;
  const tPub = choice.x0 === 0, g1Sue = choice.x1 === 0, wPub = choice.x2 === 0, g2Sue = choice.x3 === 0;
  const wAlone = choice.x4 === 0, g3Sue = choice.x5 === 0;
  const regime = !tPub ? (wAlone ? 'ALONE' : 'NONE') : !g1Sue ? 'NOSUIT' : wPub && g2Sue ? 'BOTH' : 'NYT_ONLY';
  const sum = kind => SITUATION_ORDER.filter(k => SITUATION[k].docs === kind).reduce((s, k) => s + situ[k], 0);
  return { O, S, V, choice, root, probs, situ, tPub, g1Sue, wPub, g2Sue, wAlone, g3Sue, regime, full: sum('all'), part: sum('part'), none: sum('none'), th: thresholds(P) };
}

/* Seuils obtenus en comparant les deux actions de chaque nœud (voir le chapitre « La carte »).
   Un dénominateur nul est traité explicitement pour ne jamais afficher NaN. */
function ratio(num, den) { return den > 0 ? num / den : num <= 0 ? -Infinity : Infinity; }
function thresholds(P) {
  const free = (1 - P.th) * P.D;                       // dommage encore évitable par une censure
  const tauW = ratio(P.c_W + P.S_W - P.th * P.B_W, (1 - P.th) * P.B_W + P.S_W);
  const tauT = ratio(P.c_T + P.S_T - P.th * P.B_T, (1 - P.th) * P.B_T + P.S_T);
  const gPost = free > 0 ? 1 - P.k_W / free : -Infinity;          // Nixon poursuit le Post si p < gPost (relais) ou q < gPost (seul)
  const net = (1 - P.p) * free - P.k_W;                           // gain net du second procès
  const gTimesRelay = net > 0 ? 1 - P.k_T / net : -Infinity;      // si le Post publie et serait poursuivi
  const gTimesSilent = free > 0 ? 1 - P.k_T / free : -Infinity;   // si le Post se tairait
  const kWcred = (1 - P.p) * free;                                // au-delà : menace non crédible contre le Post relais
  const kWfirst = kWcred - (P.q < 1 ? P.k_T / (1 - P.q) : Infinity);
  const kTmax = (1 - P.q) * net;
  return { free, tauW, tauT, gPost, gTimesRelay, gTimesSilent, net, kWcred, kWfirst, kTmax, avoided: (1 - P.q) * (1 - P.p) * free, totalCost: P.k_T + (1 - P.q) * P.k_W };
}
const REG = {
  NONE: { label: 'Rien ne sort', css: '--reg-none', long: 'Le Times renonce et le Post n’ose pas publier seul : les documents restent secrets.' },
  ALONE: { label: 'Le Post publie seul', css: '--reg-alone', long: 'Le Times renonce ; le Post publie seul (avec ou sans procès).' },
  NOSUIT: { label: 'Publication sans procès', css: '--reg-nosuit', long: 'Le Times publie et Nixon ne poursuit personne : tout sort.' },
  NYT_ONLY: { label: 'Procès contre le Times seulement', css: '--reg-nyt', long: 'Nixon poursuit le Times et le Post se tait : si le juge censure le Times, le secret tient.' },
  BOTH: { label: 'Deux procès (comme en 1971)', css: '--reg-both', long: 'Nixon poursuit le Times, le Post prend le relais, Nixon le poursuit aussi : les tribunaux tranchent.' },
  NC: { label: 'Sans procès · menace non crédible', css: '--reg-nosuit', long: 'Nixon ne poursuivrait même pas le Post : toute menace contre lui serait non crédible.', hatch: true },
};
const regKey = M => (M.regime === 'NOSUIT' && !M.g2Sue ? 'NC' : M.regime);
// ====================== FIN DU MODÈLE
