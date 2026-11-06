const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

// Run the model actually shipped in the standalone application, without a DOM.
const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
const modelStart = html.indexOf('const BASE');
assert.notEqual(modelStart, -1, 'The application must contain its model');
const modelEnd = html.indexOf('// ====================== FIN DU MODÈLE', modelStart);
assert.notEqual(modelEnd, -1, 'The model must end with its marker');
const presetsSource = html.match(/const PRESETS\s*=\s*(\{[\s\S]*?\n\});/);
assert.ok(presetsSource, 'The interactive scenarios must be available');
const context = vm.createContext({});
vm.runInContext(
  '"use strict";' + html.slice(modelStart, modelEnd)
    + '\nconst PRESETS = ' + presetsSource[1] + ';'
    + '\nglobalThis.model = { BASE, solve, outcomes, NODES, DOCS, PRESETS, regKey };',
  context,
  { timeout: 1000 },
);
const { BASE, solve, NODES, DOCS, PRESETS, regKey } = context.model;
const EPS = 1e-9;
const OUTCOMES = ['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'O8', 'O9', 'O10'];

function near(actual, expected, message, tolerance = 1e-8) {
  assert.ok(Number.isFinite(actual), `${message}: expected a finite number, got ${actual}`);
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
}

function checkSolution(parameters, label) {
  const result = solve(parameters);
  const probabilities = OUTCOMES.map(id => result.probs[id]);
  assert.equal(Object.keys(result.probs).length, 10, `${label}: all ten terminal outcomes exist`);
  for (const probability of probabilities) {
    assert.ok(Number.isFinite(probability) && probability >= -EPS && probability <= 1 + EPS, `${label}: terminal probabilities stay between zero and one`);
  }
  near(probabilities.reduce((sum, value) => sum + value, 0), 1, `${label}: terminal probabilities sum to one`);
  near(result.full, OUTCOMES.filter(id => DOCS[id] === 'all').reduce((s, id) => s + result.probs[id], 0), `${label}: complete publication counts the correct outcomes`);
  // Expected utility at the root equals the expectation over the terminal distribution.
  for (let player = 0; player < 3; player++) {
    const expectedUtility = OUTCOMES.reduce((sum, id) => sum + result.probs[id] * result.O[id][player], 0);
    near(result.root[player], expectedUtility, `${label}: root utility for player ${player}`, 1e-7);
  }
  // Every decision node, reached or not, chooses a best action; ties follow the documented convention.
  for (const [id, node] of Object.entries(NODES)) {
    if (node.kind !== 'decision') continue;
    const value = child => (child in result.O ? result.O[child] : result.V[child]);
    const chosen = value(node.actions[result.choice[id]][1])[node.player];
    const other = value(node.actions[1 - result.choice[id]][1])[node.player];
    assert.ok(Number.isFinite(chosen) && Number.isFinite(other), `${label}: ${id} has finite utilities`);
    assert.ok(chosen >= other - EPS, `${label}: ${id} must not choose a strictly worse action`);
    if (Math.abs(chosen - other) <= EPS) assert.equal(result.choice[id], node.tie, `${label}: ${id} follows the convention at indifference`);
  }
  assert.equal(result.tPub, result.probs.O7 + result.probs.O8 + result.probs.O9 + result.probs.O10 < EPS, `${label}: the Times' choice matches the outcomes`);
  for (const value of Object.values(result.th)) assert.ok(!Number.isNaN(value), `${label}: thresholds are never NaN`);
  return result;
}

/* Brute force over the 64 pure strategy profiles, independently of backward induction. */
const DECISIONS = ['x0', 'x1', 'x3', 'x4', 'x6', 'x7'];
function profilePayoff(P, profile) {
  const O = context.model.outcomes(P);
  const walk = id => {
    if (id in O) return O[id];
    const node = NODES[id];
    if (node.kind === 'chance') return [0, 1, 2].map(k => node.actions.reduce((s, a) => s + a[2](P) * walk(a[1])[k], 0));
    return walk(node.actions[profile[id]][1]);
  };
  return walk('x0');
}
function nashEquilibria(P) {
  const profiles = [];
  for (let mask = 0; mask < 64; mask++) profiles.push(Object.fromEntries(DECISIONS.map((id, i) => [id, (mask >> i) & 1])));
  return profiles.filter(profile => {
    const u = profilePayoff(P, profile);
    return [0, 1, 2].every(player => {
      const own = DECISIONS.filter(id => NODES[id].player === player);
      for (let alt = 0; alt < 1 << own.length; alt++) {
        const deviation = { ...profile };
        own.forEach((id, i) => { deviation[id] = (alt >> i) & 1; });
        if (profilePayoff(P, deviation)[player] > u[player] + EPS) return false;
      }
      return true;
    });
  });
}

test('the illustrative 1971 calibration reproduces the worked solution', () => {
  const result = checkSolution({ ...BASE }, '1971');
  assert.equal(result.regime, 'BOTH');
  assert.deepEqual([result.tPub, result.g1Sue, result.wPub, result.g2Sue, result.wAlone, result.g3Sue], [true, true, true, true, false, true]);
  [60.6, 8.82, -189.7].forEach((value, index) => near(result.root[index], value, `reference expected utility ${index}`));
  [48, 12.6, -181].forEach((value, index) => near(result.V.x5[index], value, `Supreme Court expectation ${index}`));
  [-25.5, -79.8, -122].forEach((value, index) => near(result.V.x8[index], value, `local judge, Post alone ${index}`));
  near(result.probs.O5, .30, 'local victory');
  near(result.probs.O2, .455, 'Supreme Court victory');
  near(result.probs.O1, .245, 'censorship and sanctions');
  near(result.full, .755, 'complete publication');
  near(result.th.tauW, 159 / 264, 'Post threshold');
  near(result.th.tauT, .25, 'Times threshold');
  near(result.th.gPost, 6 / 7, 'government threshold against the Post');
  near(result.th.gTimesRelay, 19 / 29, 'government threshold against the Times');
  near(result.th.kWcred, 49, 'credibility limit for the second lawsuit');
  near(result.th.kWfirst, 49 - 10 / .7, 'limit for the first lawsuit');
  near(result.th.kTmax, 20.3, 'limit for the cost of the first lawsuit');
  near(result.th.totalCost, 24, 'expected total cost of lawsuits');
  near(result.th.avoided, 34.3, 'expected damage avoided');
});

test('the leaf payoffs match the worked table', () => {
  const O = context.model.outcomes(BASE);
  const table = {
    O1: [-30, -159, -90], O2: [90, 105, -230], O3: [90, 120, -210], O4: [-30, 0, -70], O5: [90, 0, -210],
    O6: [100, 0, -200], O7: [-15, -159, -80], O8: [-50, 105, -220], O9: [-50, 120, -200], O10: [0, 0, 0],
  };
  for (const [id, values] of Object.entries(table)) values.forEach((v, k) => near(O[id][k], v, `${id} payoff ${k}`));
});

test('every named laboratory scenario has the advertised result', () => {
  const expected = {
    '1971': { regime: 'BOTH', full: .755, root: [60.6, 8.82, -189.7] },
    peur: { regime: 'NYT_ONLY', full: .3, root: [6, 0, -112] },
    sanction: { regime: 'NYT_ONLY', full: .3, root: [6, 0, -112] },
    renonce: { regime: 'NONE', full: 0, root: [0, 0, 0], wPub: true },
    hostile: { regime: 'NONE', full: 0, root: [0, 0, 0] },
    cher: { regime: 'NOSUIT', full: 1, root: [100, 0, -200], g2Sue: true },
    noncred: { regime: 'NC', full: 1, root: [100, 0, -200], g2Sue: false },
    cour: { regime: 'NC', full: 1, root: [100, 0, -200], g2Sue: false },
    juge: { regime: 'NOSUIT', full: 1, root: [100, 0, -200], wAlone: true },
    preempt: { regime: 'NYT_ONLY', full: .65, root: [-7, 0, -161], wAlone: true },
    nash: { regime: 'NC', full: 1, root: [100, 0, -200], g2Sue: false },
  };
  assert.deepEqual(Object.keys(PRESETS).sort(), Object.keys(expected).sort(), 'Every available scenario has an explicit expected result');
  for (const [id, [, overrides]] of Object.entries(PRESETS)) {
    const result = checkSolution({ ...BASE, ...overrides }, id);
    const fixture = expected[id];
    assert.equal(regKey(result), fixture.regime, `${id}: equilibrium regime`);
    near(result.full, fixture.full, `${id}: complete publication`);
    fixture.root.forEach((value, index) => near(result.root[index], value, `${id}: expected utility ${index}`));
    for (const key of ['g2Sue', 'wPub', 'wAlone']) if (key in fixture) assert.equal(result[key], fixture[key], `${id}: ${key}`);
  }
  // Without the scoop loss, the Times would leave the story to the Post: the new branch matters.
  const noRivalry = checkSolution({ ...BASE, ...PRESETS.preempt[1], R_T: 0 }, 'preempt without R_T');
  assert.equal(noRivalry.regime, 'ALONE');
  near(noRivalry.probs.O8, .65, 'the Post alone wins before the local judge');
});

test('Nash equilibria: the subgame-perfect profile is one of them, non-credible threats add others', () => {
  const asProfile = result => Object.fromEntries(DECISIONS.map(id => [id, result.choice[id]]));
  const base = nashEquilibria(BASE);
  assert.equal(base.length, 4, 'four Nash equilibria in the reference game');
  const spne = asProfile(solve(BASE));
  assert.ok(base.some(profile => DECISIONS.every(id => profile[id] === spne[id])), 'the SPNE is a Nash equilibrium');
  for (const profile of base) {
    const outcome = profilePayoff(BASE, profile);
    [60.6, 8.82, -189.7].forEach((value, index) => near(outcome[index], value, 'all reference equilibria share the same outcome'));
  }
  const threat = { ...BASE, ...PRESETS.nash[1] };
  const threatEquilibria = nashEquilibria(threat);
  assert.equal(threatEquilibria.length, 12);
  const sustainedByThreat = threatEquilibria.filter(profile => profile.x1 === 0 && profile.x3 === 1 && profile.x4 === 0);
  assert.ok(sustainedByThreat.length > 0, 'a Nash equilibrium keeps the secret through a non-credible threat');
  assert.equal(solve(threat).g2Sue, false, 'the threat is not credible in the subgame');
});

test('indifference follows publication and no-litigation conventions', () => {
  const postTie = checkSolution({ ...BASE, S_W: 216 }, 'Post indifferent');
  near(postTie.V.x4[1], 0, 'Post gain at the exact sanction threshold');
  assert.equal(postTie.wPub, true);
  const postAloneTie = checkSolution({ ...BASE, q: 159 / 264 }, 'Post alone indifferent');
  near(postAloneTie.V.x8[1], 0, 'Post alone gain at the threshold');
  assert.equal(postAloneTie.wAlone, true);
  const secondLawsuitTie = checkSolution({ ...BASE, k_W: 49 }, 'second lawsuit indifferent');
  near(secondLawsuitTie.V.x5[2], secondLawsuitTie.O.O3[2], 'government second lawsuit tie');
  assert.equal(secondLawsuitTie.g2Sue, false);
  const firstLawsuitTie = checkSolution({ ...BASE, k_T: 20.3 }, 'first lawsuit indifferent');
  near(firstLawsuitTie.V.x2[2], firstLawsuitTie.O.O6[2], 'government first lawsuit tie');
  assert.equal(firstLawsuitTie.g1Sue, false);
  const timesTie = checkSolution({ ...BASE, c_T: 70.6 }, 'Times indifferent');
  near(timesTie.V.x1[0], 0, 'Times gain at indifference', 1e-7);
  assert.equal(timesTie.tPub, true);
});

test('zero-damage and zero-benefit cases retain meaningful thresholds', () => {
  const noDamage = checkSolution({ ...BASE, D: 0 }, 'zero government damage');
  assert.equal(noDamage.g1Sue, false);
  assert.equal(noDamage.g2Sue, false);
  assert.equal(noDamage.g3Sue, false);
  assert.equal(noDamage.th.gPost, -Infinity);
  const noStake = checkSolution({ ...BASE, B_W: 0, S_W: 0, c_W: 0 }, 'Post without costs or gains');
  assert.equal(noStake.th.tauW, -Infinity);
  assert.equal(noStake.wPub, true);
  const pureCost = checkSolution({ ...BASE, B_W: 0, S_W: 0, c_W: 15 }, 'Post pure cost');
  assert.equal(pureCost.th.tauW, Infinity);
  assert.equal(pureCost.wPub, false);
  const allZero = Object.fromEntries(Object.keys(BASE).map(key => [key, 0]));
  const noStakes = checkSolution(allZero, 'all stakes zero');
  assert.equal(noStakes.tPub, true);
  assert.equal(noStakes.wPub, true);
  assert.equal(noStakes.g1Sue, false);
  assert.equal(noStakes.g2Sue, false);
});

test('probability endpoints and parameter sweeps preserve equilibrium consistency', () => {
  for (const q of [0, .3, 1]) for (const p of [0, .5, .65, 1]) checkSolution({ ...BASE, q, p }, `probability endpoints q=${q}, p=${p}`);
  const values = {
    B_T: [0, 1, 100, 300], c_T: [0, 10, 70.6, 120], S_T: [0, 50, 297, 400], R_T: [0, 50, 200],
    th: [0, .3, .95], B_W: [0, 1, 120, 300], c_W: [0, 15, 27.6, 120],
    S_W: [0, 180, 216, 400], D: [0, 1, 200, 500], k_T: [0, 10, 20.3, 120], k_W: [0, 20, 34.7, 49, 120],
  };
  for (const [parameter, candidates] of Object.entries(values)) {
    for (const value of candidates) for (const q of [0, .3, 1]) for (const p of [0, .5, .65, 1]) {
      checkSolution({ ...BASE, [parameter]: value, q, p }, `${parameter}=${value}, q=${q}, p=${p}`);
    }
  }
  // Fixed seed makes broad mixed-parameter checks reproducible.
  let seed = 1971;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let index = 0; index < 1000; index++) {
    const parameters = { ...BASE, q: random(), p: random() };
    for (const [parameter, candidates] of Object.entries(values)) parameters[parameter] = candidates[Math.floor(random() * candidates.length)];
    checkSolution(parameters, `deterministic mixed sample ${index}`);
  }
});
