const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

// Run the model actually shipped in the standalone application, without a DOM.
const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
const modelStart = html.indexOf('const BASE');
assert.notEqual(modelStart, -1, 'The application must contain its model');
const modelEnd = html.slice(modelStart).search(/\/\/[^\n]*OUTILS[^\n]*(?:\n|$)/);
assert.notEqual(modelEnd, -1, 'The model must end before the DOM helpers');
const presetsSource = html.match(/const PRESETS\s*=\s*(\{[\s\S]*?\n\});/);
assert.ok(presetsSource, 'The interactive scenarios must be available');
const context = vm.createContext({});
vm.runInContext(
  html.slice(modelStart, modelStart + modelEnd)
    + '\nconst PRESETS = ' + presetsSource[1] + ';'
    + '\nglobalThis.model = { BASE, solve, outcomes, PRESETS };',
  context,
  { timeout: 1000 },
);
const { BASE, solve, PRESETS } = context.model;
const EPS = 1e-9;

function near(actual, expected, message, tolerance = 1e-8) {
  assert.ok(Number.isFinite(actual), `${message}: expected a finite number, got ${actual}`);
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, got ${actual}`);
}

function checkSolution(parameters, label) {
  const result = solve(parameters);
  const probabilities = Object.values(result.probs);
  assert.equal(probabilities.length, 7, `${label}: all seven terminal outcomes exist`);
  for (const probability of probabilities) {
    assert.ok(Number.isFinite(probability), `${label}: finite terminal probabilities`);
    assert.ok(probability >= -EPS && probability <= 1 + EPS,
      `${label}: terminal probabilities stay between zero and one`);
  }
  near(probabilities.reduce((sum, value) => sum + value, 0), 1,
    `${label}: terminal probabilities sum to one`);
  near(result.full, result.probs.O2 + result.probs.O3 + result.probs.O5 + result.probs.O6,
    `${label}: complete publication counts the correct outcomes`);

  // Independently reconstruct expected utility from the terminal distribution.
  for (let player = 0; player < 3; player++) {
    const expectedUtility = Object.entries(result.probs).reduce(
      (sum, [outcome, probability]) => sum + probability * result.O[outcome][player], 0,
    );
    near(result.root[player], expectedUtility, `${label}: root utility for player ${player}`);
  }

  // Every reported strategy must be optimal even in off-path subgames.
  const decisions = [
    ['government against the Post', result.g2Sue, result.sc[2], result.O.O5[2], false],
    ['Post publication', result.wPub, result.g2v[1], result.O.O4[1], true],
    ['government against the Times', result.g1Sue, result.judge[2], result.O.O2[2], false],
    ['Times publication', result.tPub, result.g1v[0], result.O.O1[0], true],
  ];
  for (const [decision, takesAction, actionUtility, alternativeUtility, publishOnTie] of decisions) {
    assert.ok(Number.isFinite(actionUtility) && Number.isFinite(alternativeUtility),
      `${label}: ${decision} has finite utilities`);
    if (takesAction) {
      assert.ok(actionUtility >= alternativeUtility - EPS,
        `${label}: ${decision} must not choose a strictly worse action`);
    } else {
      assert.ok(alternativeUtility >= actionUtility - EPS,
        `${label}: ${decision} must not choose a strictly worse alternative`);
    }
    if (Math.abs(actionUtility - alternativeUtility) <= EPS) {
      assert.equal(takesAction, publishOnTie,
        `${label}: ${decision} follows the documented convention at indifference`);
    }
  }
  assert.equal(result.tPub, result.probs.O1 < 1, `${label}: initial publication matches the outcome`);
  assert.ok(!Number.isNaN(result.pG) && !Number.isNaN(result.pW),
    `${label}: publication and litigation thresholds are never NaN`);
  return result;
}

test('the illustrative 1971 calibration reproduces the worked solution', () => {
  const result = checkSolution({ ...BASE }, '1971');
  assert.equal(result.regime, 'BOTH');
  assert.equal(result.tPub, true);
  assert.equal(result.wPub, true);
  assert.equal(result.g1Sue, true);
  assert.equal(result.g2Sue, true);
  [60.6, 7.35, -189.7].forEach((value, index) =>
    near(result.root[index], value, `reference expected utility ${index}`));
  near(result.probs.O3, .30, 'local victory');
  near(result.probs.O6, .455, 'Supreme Court victory');
  near(result.probs.O7, .245, 'censorship and sanctions');
  near(result.full, .755, 'complete publication');
  near(result.pW, 165 / 270, 'Post threshold');
  near(result.pG, 6 / 7, 'government threshold');
});

test('every named laboratory scenario has the advertised result', () => {
  const expected = {
    '1971': { regime: 'BOTH', full: .755, root: [60.6, 7.35, -189.7] },
    peur: { regime: 'NYT_ONLY', full: .3, root: [41, 0, -112] },
    sanction: { regime: 'NYT_ONLY', full: .3, root: [41, 0, -112] },
    renonce: { regime: 'NONE', full: 0, root: [0, 0, 0] },
    cher: { regime: 'NOSUIT', full: 1, root: [100, 0, -200], g2Sue: true },
    noncred: { regime: 'NOSUIT', full: 1, root: [100, 0, -200], g2Sue: false },
    cour: { regime: 'NOSUIT', full: 1, root: [100, 0, -200], g2Sue: false },
    juge: { regime: 'NOSUIT', full: 1, root: [100, 0, -200], g2Sue: true },
  };
  assert.deepEqual(Object.keys(PRESETS).sort(), Object.keys(expected).sort(),
    'Every available scenario has an explicit expected result');
  for (const [id, [, overrides]] of Object.entries(PRESETS)) {
    const result = checkSolution({ ...BASE, ...overrides }, id);
    const fixture = expected[id];
    assert.equal(result.regime, fixture.regime, `${id}: equilibrium regime`);
    near(result.full, fixture.full, `${id}: complete publication`);
    fixture.root.forEach((value, index) =>
      near(result.root[index], value, `${id}: expected utility ${index}`));
    if ('g2Sue' in fixture) assert.equal(result.g2Sue, fixture.g2Sue,
      `${id}: on-path and off-path threats are distinguished`);
  }
});

test('indifference follows publication and no-litigation conventions', () => {
  const postTie = checkSolution({ ...BASE, S_W: 180 }, 'Post indifferent');
  near(postTie.g2v[1], 0, 'Post gain at the exact sanction threshold');
  assert.equal(postTie.wPub, true);
  const postLitigationTie = checkSolution({ ...BASE, k_W: 49 }, 'second lawsuit indifferent');
  near(postLitigationTie.sc[2], postLitigationTie.O.O5[2], 'government second lawsuit tie');
  assert.equal(postLitigationTie.g2Sue, false);
  const timesLitigationTie = checkSolution({ ...BASE, k_T: 20.3 }, 'first lawsuit indifferent');
  near(timesLitigationTie.judge[2], timesLitigationTie.O.O2[2], 'government first lawsuit tie');
  assert.equal(timesLitigationTie.g1Sue, false);
  const timesTie = checkSolution({ ...BASE, B_T: 0, c_T: 0, k_T: 120 }, 'Times indifferent');
  near(timesTie.g1v[0], 0, 'Times gain at indifference');
  assert.equal(timesTie.tPub, true);
});

test('zero-damage and zero-benefit cases retain meaningful thresholds', () => {
  const noDamage = checkSolution({ ...BASE, D: 0 }, 'zero government damage');
  assert.equal(noDamage.g1Sue, false);
  assert.equal(noDamage.g2Sue, false);
  assert.equal(noDamage.pG, 0);
  const noStake = checkSolution({ ...BASE, B_W: 0, S_W: 0, c_W: 0 }, 'Post without costs or gains');
  assert.equal(noStake.pW, 0);
  assert.equal(noStake.wPub, true);
  const pureCost = checkSolution({ ...BASE, B_W: 0, S_W: 0, c_W: 15 }, 'Post pure cost');
  assert.equal(pureCost.pW, Infinity);
  assert.equal(pureCost.wPub, false);
  const allZero = Object.fromEntries(Object.keys(BASE).map(key => [key, 0]));
  const noStakes = checkSolution(allZero, 'all stakes zero');
  assert.equal(noStakes.tPub, true);
  assert.equal(noStakes.wPub, true);
  assert.equal(noStakes.g1Sue, false);
  assert.equal(noStakes.g2Sue, false);
});

test('probability endpoints and parameter sweeps preserve equilibrium consistency', () => {
  for (const q of [0, .3, 1]) {
    for (const p of [0, .5, .65, 1]) {
      checkSolution({ ...BASE, q, p }, `probability endpoints q=${q}, p=${p}`);
    }
  }
  const values = {
    B_T: [0, 1, 100, 300], c_T: [0, 10, 70.6, 120], S_T: [0, 50, 300],
    th: [0, .3, .95], B_W: [0, 1, 120, 300], c_W: [0, 15, 25.5, 120],
    S_W: [0, 150, 180, 400], D: [0, 1, 200, 500],
    k_T: [0, 10, 20.3, 120], k_W: [0, 20, 49, 120],
  };
  for (const [parameter, candidates] of Object.entries(values)) {
    for (const value of candidates) {
      for (const q of [0, .3, 1]) {
        for (const p of [0, .5, .65, 1]) {
          checkSolution({ ...BASE, [parameter]: value, q, p },
            `${parameter}=${value}, q=${q}, p=${p}`);
        }
      }
    }
  }
  // Fixed seed makes broad mixed-parameter checks reproducible.
  let seed = 1971;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = 0; index < 1000; index++) {
    const parameters = { ...BASE, q: random(), p: random() };
    for (const [parameter, candidates] of Object.entries(values)) {
      parameters[parameter] = candidates[Math.floor(random() * candidates.length)];
    }
    checkSolution(parameters, `deterministic mixed sample ${index}`);
  }
});
