'use strict';
// ====================== MODÈLE ======================
/* Jeu séquentiel à information parfaite avec coups de la Nature.
   Ordre des gains, partout : Times, Post, Nixon (administration).
   Neuf nœuds non terminaux (x0 … x8, numérotés de haut en bas, branche de gauche d'abord)
   et dix issues (O1 … O10, numérotées de gauche à droite sous l'arbre). */
const BASE = { q: 0.30, p: 0.65, th: 0.30, B_T: 100, c_T: 10, S_T: 50, R_T: 50, B_W: 120, c_W: 15, S_W: 180, D: 200, k_T: 10, k_W: 20 };
const PLAYERS3 = ['Times', 'Post', 'Nixon'];

/* Cinq règles, appliquées de la même façon dans tous les sous-jeux :
   1. un journal qui a publié reçoit B si tout finit par sortir, θB si une censure est maintenue ;
   2. un journal poursuivi paie ses frais de procédure c ;
   3. une censure maintenue coûte en plus la sanction S au journal censuré ;
   4. Nixon perd D si tout sort, θD si une censure est maintenue, et paie k par procès ;
   5. si le Times renonce et que le Post publie, le Times perd R (scoop laissé au rival), au prorata de ce qui sort. */
function outcomes(P) {
  const { th, B_T, c_T, S_T, R_T, B_W, c_W, S_W, D, k_T, k_W } = P;
  return {
    O1: [th * B_T - c_T - S_T, th * B_W - c_W - S_W, -th * D - k_T - k_W],
    O2: [B_T - c_T, B_W - c_W, -D - k_T - k_W],
    O3: [B_T - c_T, B_W, -D - k_T],
    O4: [th * B_T - c_T - S_T, 0, -th * D - k_T],
    O5: [B_T - c_T, 0, -D - k_T],
    O6: [B_T, 0, -D],
    O7: [-th * R_T, th * B_W - c_W - S_W, -th * D - k_W],
    O8: [-R_T, B_W - c_W, -D - k_W],
    O9: [-R_T, B_W, -D],
    O10: [0, 0, 0],
  };
}
const SYM = {
  O1: ['θB_T − c_T − S_T', 'θB_W − c_W − S_W', '−θD − k_T − k_W'],
  O2: ['B_T − c_T', 'B_W − c_W', '−D − k_T − k_W'],
  O3: ['B_T − c_T', 'B_W', '−D − k_T'],
  O4: ['θB_T − c_T − S_T', '0', '−θD − k_T'],
  O5: ['B_T − c_T', '0', '−D − k_T'],
  O6: ['B_T', '0', '−D'],
  O7: ['−θR_T', 'θB_W − c_W − S_W', '−θD − k_W'],
  O8: ['−R_T', 'B_W − c_W', '−D − k_W'],
  O9: ['−R_T', 'B_W', '−D'],
  O10: ['0', '0', '0'],
};
const TITLE = {
  O1: ['Censure confirmée', '+ sanctions'], O2: ['Victoire', 'des journaux'], O3: ['Le Post publie', 'sans procès'],
  O4: ['Times censuré,', 'Post muet'], O5: ['Le juge donne', 'raison au Times'], O6: ['Tout sort,', 'sans procès'],
  O7: ['Post censuré', '+ sanctions'], O8: ['Le juge donne', 'raison au Post'], O9: ['Le Post', 'publie seul'], O10: ['Rien', 'ne sort'],
};
/* Ce qui est public à la fin : tout, seulement la part θ, ou rien. */
const DOCS = { O1: 'part', O2: 'all', O3: 'all', O4: 'part', O5: 'all', O6: 'all', O7: 'part', O8: 'all', O9: 'all', O10: 'none' };
/* Catégories de l'énoncé. */
const CATEGORY = {
  O1: 'both', O2: 'both', O3: 'times', O4: 'times', O5: 'times', O6: 'nosuit', O7: 'post', O8: 'post', O9: 'nosuit', O10: 'none',
};
/* actions : [libellé, nœud suivant, probabilité (Nature), libellé de la probabilité]. tie : action retenue à égalité. */
const NODES = {
  x0: { kind: 'decision', player: 0, name: 'Times', long: 'New York Times', actions: [['Publier', 'x1'], ['Ne pas publier', 'x6']], tie: 0 },
  x1: { kind: 'decision', player: 2, name: 'Nixon', long: 'Nixon face au Times', actions: [['Poursuivre', 'x2'], ['Laisser faire', 'O6']], tie: 1 },
  x2: { kind: 'chance', name: 'Juge local', long: 'Juge local (affaire du Times)', actions: [['Censure', 'x3', P => 1 - P.q, '1 − q'], ['Refus', 'O5', P => P.q, 'q']] },
  x3: { kind: 'decision', player: 1, name: 'Post', long: 'Post, après la censure du Times', actions: [['Publier', 'x4'], ['Ne pas publier', 'O4']], tie: 0 },
  x4: { kind: 'decision', player: 2, name: 'Nixon', long: 'Nixon face au Post', actions: [['Poursuivre', 'x5'], ['Laisser faire', 'O3']], tie: 1 },
  x5: { kind: 'chance', name: 'Cour suprême', long: 'Cour suprême (affaires jointes)', actions: [['Gouvernement', 'O1', P => 1 - P.p, '1 − p'], ['Journaux', 'O2', P => P.p, 'p']] },
  x6: { kind: 'decision', player: 1, name: 'Post', long: 'Post, si le Times se tait', actions: [['Publier', 'x7'], ['Ne pas publier', 'O10']], tie: 0 },
  x7: { kind: 'decision', player: 2, name: 'Nixon', long: 'Nixon face au Post seul', actions: [['Poursuivre', 'x8'], ['Laisser faire', 'O9']], tie: 1 },
  x8: { kind: 'chance', name: 'Juge local', long: 'Juge local (affaire du Post seul)', actions: [['Censure', 'O7', P => 1 - P.q, '1 − q'], ['Refus', 'O8', P => P.q, 'q']] },
};
const NODE_ORDER = ['x0', 'x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8'];
const OUTCOME_ORDER = ['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'O8', 'O9', 'O10'];
/* Ordre de l'induction à rebours : chaque nœud n'est traité qu'une fois ses suites résolues. */
const INDUCTION_ORDER = ['x5', 'x4', 'x3', 'x2', 'x1', 'x8', 'x7', 'x6', 'x0'];
const mix = (a, pa, b) => a.map((x, i) => pa * x + (1 - pa) * b[i]);
const isOutcome = id => /^O\d+$/.test(id);

function solve(P) {
  const O = outcomes(P);
  const V = {}, choice = {}, EPS = 1e-9;
  const value = id => {
    if (isOutcome(id)) return O[id];
    if (V[id]) return V[id];
    const n = NODES[id];
    if (n.kind === 'chance') {
      V[id] = [0, 1, 2].map(k => n.actions.reduce((sum, a) => sum + a[2](P) * value(a[1])[k], 0));
    } else {
      const first = value(n.actions[0][1]), second = value(n.actions[1][1]);
      const gap = first[n.player] - second[n.player];
      choice[id] = Math.abs(gap) <= EPS ? n.tie : gap > 0 ? 0 : 1;
      V[id] = choice[id] === 0 ? first : second;
    }
    return V[id];
  };
  const root = value('x0');
  const probs = Object.fromEntries(OUTCOME_ORDER.map(k => [k, 0]));
  const reach = Object.fromEntries(NODE_ORDER.map(k => [k, 0]));
  (function walk(id, w) {
    if (isOutcome(id)) { probs[id] += w; return; }
    reach[id] += w;
    const n = NODES[id];
    if (n.kind === 'chance') n.actions.forEach(a => walk(a[1], w * a[2](P)));
    else walk(n.actions[choice[id]][1], w);
  })('x0', 1);
  const tPub = choice.x0 === 0, g1Sue = choice.x1 === 0, wPub = choice.x3 === 0, g2Sue = choice.x4 === 0;
  const wAlone = choice.x6 === 0, g3Sue = choice.x7 === 0;
  const regime = !tPub ? (wAlone ? 'ALONE' : 'NONE') : !g1Sue ? 'NOSUIT' : wPub && g2Sue ? 'BOTH' : 'NYT_ONLY';
  const full = OUTCOME_ORDER.filter(k => DOCS[k] === 'all').reduce((s, k) => s + probs[k], 0);
  const part = OUTCOME_ORDER.filter(k => DOCS[k] === 'part').reduce((s, k) => s + probs[k], 0);
  return { O, V, choice, root, probs, reach, tPub, g1Sue, wPub, g2Sue, wAlone, g3Sue, regime, full, part, none: probs.O10, th: thresholds(P) };
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
  NYT_ONLY: { label: 'Procès contre le Times seulement', css: '--reg-nyt', long: 'Nixon poursuit le Times ; si le juge le censure, le Post se tait.' },
  BOTH: { label: 'Deux procès (comme en 1971)', css: '--reg-both', long: 'Nixon poursuit le Times, le Post prend le relais, Nixon le poursuit aussi : la Cour suprême tranche.' },
  NC: { label: 'Sans procès · menace non crédible', css: '--reg-nosuit', long: 'Nixon ne poursuivrait même pas le Post : toute menace contre lui serait non crédible.', hatch: true },
};
const regKey = M => (M.regime === 'NOSUIT' && !M.g2Sue ? 'NC' : M.regime);
// ====================== FIN DU MODÈLE
