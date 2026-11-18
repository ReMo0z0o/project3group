// ====================== SIMULATEUR ======================
/* Toutes les valeurs du modèle au choix, θ et le bonus R activables, chemin d'équilibre, arbre et
   intervalle de probabilités du scénario de 1971. N'utilise que tools.js, model.js et
   decision-tree.js : la même page fonctionne dans l'application et dans simulateur.html. */
(() => {
  const root = document.getElementById('simulateur');
  if (!root) return;
  const one = s => root.querySelector(s), every = s => [...root.querySelectorAll(s)];
  const STORE = 'pp-sim-v1';
  const KEYS = ['B_T', 'c_T', 'S_T', 'B_W', 'c_W', 'S_W', 'D', 'k_T', 'k_W', 'R', 'q', 'p', 'th'];
  const PCT = new Set(['q', 'p', 'th']);
  const COLLEGUE = { B_T: 10, c_T: 1, S_T: 5, B_W: 10, c_W: 5, S_W: 5, D: 200, k_T: 1, k_W: 1, q: 0.3, p: 0.65, th: 0.3, R: 10 };
  const PRESETS = [
    ['Référence de l’application', { ...BASE, R: 10 }, { thOn: true, rOn: false }],
    ['Valeurs du collègue (sans θ)', COLLEGUE, { thOn: false, rOn: false }],
    ['Collègue + θ = 30 %', COLLEGUE, { thOn: true, rOn: false }],
    ['Collègue + θ + bonus R = 10', COLLEGUE, { thOn: true, rOn: true }],
    ['Petit dommage D = 5, sans bonus', { ...COLLEGUE, D: 5 }, { thOn: true, rOn: false }],
    ['Petit dommage D = 5 + bonus', { ...COLLEGUE, D: 5 }, { thOn: true, rOn: true }],
  ];
  const fresh = () => ({ values: { ...PRESETS[0][1] }, flags: { ...PRESETS[0][2] } });
  const valid = (k, v) => Number.isFinite(v) && v >= 0 && (!PCT.has(k) || v <= 1);

  let state = fresh();
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (raw && raw.values && raw.flags) {
      for (const k of KEYS) if (valid(k, raw.values[k])) state.values[k] = raw.values[k];
      state.flags = { thOn: !!raw.flags.thOn, rOn: !!raw.flags.rOn };
    }
  } catch (e) { state = fresh(); }

  /* Paramètres effectivement utilisés : θ = 0 et R = 0 quand ils sont désactivés. */
  const params = () => ({ ...state.values, th: state.flags.thOn ? state.values.th : 0, R: state.flags.rOn ? state.values.R : 0 });
  const num = x => fr(x, 2);
  const shownValue = (k, v) => PCT.has(k) ? String(Math.round(v * 10000) / 100) : String(Math.round(v * 10000) / 10000);

  // ---------- Formulaire ----------
  one('#sim-presets').innerHTML = PRESETS.map(([label], i) => `<button type="button" class="btn sm ghost" data-sim-preset="${i}">${label}</button>`).join('');
  function syncForm(except) {
    for (const input of every('[data-k]')) {
      if (input === except) continue;
      input.value = shownValue(input.dataset.k, state.values[input.dataset.k]);
      input.removeAttribute('aria-invalid');
    }
    for (const box of every('[data-flag]')) box.checked = !!state.flags[box.dataset.flag];
    for (const block of every('[data-needs]')) {
      const on = !!state.flags[block.dataset.needs];
      block.classList.toggle('is-off', !on);
      block.querySelectorAll('input').forEach(i => { i.disabled = !on; });
    }
  }
  /* Le bouton de valeurs choisi reste marqué tant qu'on ne modifie rien à la main. */
  const pressed = button => every('[data-sim-preset]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  let frame = 0;
  const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(render); };
  one('#sim-form').addEventListener('input', e => {
    const t = e.target;
    pressed(null);
    if (t.dataset.flag) { state.flags[t.dataset.flag] = t.checked; syncForm(); schedule(); return; }
    const k = t.dataset.k; if (!k) return;
    let v = parseFloat(String(t.value).replace(',', '.'));
    if (PCT.has(k)) v /= 100;
    if (!valid(k, v)) { t.setAttribute('aria-invalid', 'true'); one('#sim-saved').textContent = PCT.has(k) ? 'Entrez un pourcentage entre 0 et 100.' : 'Entrez un nombre positif ou nul.'; return; }
    one('#sim-saved').textContent = '';
    state.values[k] = v;
    syncForm(t);
    schedule();
  });
  one('#sim-presets').addEventListener('click', e => {
    const b = e.target.closest("[data-sim-preset]"); if (!b) return;
    const [, values, flags] = PRESETS[+b.dataset.simPreset];
    state = { values: { ...state.values, ...values }, flags: { ...flags } };
    pressed(b);
    syncForm(); schedule();
  });
  one('#sim-reset').addEventListener('click', () => { state = fresh(); pressed(one('[data-sim-preset="0"]')); syncForm(); schedule(); });

  // ---------- Textes ----------
  const STEP = {
    x0: ['Le Times publie', 'Le Times ne publie pas'],
    x1: ['Nixon poursuit le Times', 'Nixon laisse faire le Times'],
    x2: ['Le Post publie à son tour', 'Le Post se tait'],
    x3: ['Nixon poursuit aussi le Post', 'Nixon laisse faire le Post'],
    x4: ['Le Post publie seul', 'Le Post se tait aussi'],
    x5: ['Nixon poursuit le Post', 'Nixon laisse faire le Post'],
  };
  const PCOL = ['--nyt', '--wp', '--gov'];
  const DOCS_COL = { all: 'var(--ok)', part: 'var(--gov)', none: 'var(--muted)' };
  const m = s => `<span class="m">${s}</span>`;
  const bound = (x, word) => !Number.isFinite(x) ? (x > 0 ? 'impossible' : 'toujours') : x > 1 ? `${pct(x)} (impossible)` : x <= 0 ? `${pct(x)} (toujours)` : pct(x);
  const factors = () => ({ th: state.flags.thOn ? '(1 − θ)' : '', dr: state.flags.rOn ? '(D + R)' : 'D' });

  function pathHtml(M, inScenario) {
    const val = id => (isOutcome(id) ? M.O[id] : M.V[id]);
    const items = [];
    let id = 'x0';
    while (!isOutcome(id)) {
      const n = NODES[id], c = M.choice[id];
      const a = val(n.actions[0][1])[n.player], b = val(n.actions[1][1])[n.player];
      const tie = Math.abs(a - b) <= 1e-9;
      const histo = ['x0', 'x1', 'x2', 'x3'].includes(id) ? (c === 0 ? '<span class="sim-ok">✔ comme en 1971</span>' : '<span class="sim-ko">✘ en 1971 : ' + STEP[id][0].charAt(0).toLowerCase() + STEP[id][0].slice(1) + '</span>') : '<span class="sim-muted">branche hors 1971</span>';
      items.push(`<li style="--c:var(${PCOL[n.player]})"><div class="sim-step-head"><span class="sim-node">${id}</span><b>${STEP[id][c]}</b>${histo}</div>
        <div class="sim-step-cmp">${PLAYERS3[n.player]} compare ses gains : <span class="${c === 0 ? 'win' : ''}">${n.actions[0][0]} → ${num(a)}</span> · <span class="${c === 1 ? 'win' : ''}">${n.actions[1][0]} → ${num(b)}</span>${tie ? ' · égalité : par convention, un journal publie et Nixon ne poursuit pas' : ''}</div></li>`);
      id = n.actions[c][1];
    }
    items.push(`<li class="sim-step-leaf"><div class="sim-step-head"><span class="sim-node">${id}</span><b>Fin : ${TITLE[id].join(' ')}</b>${inScenario ? '<span class="sim-ok">✔ scénario de 1971</span>' : ''}</div></li>`);
    return items.join('');
  }

  function leafHtml(M, P) {
    const leaf = OUTCOME_ORDER.find(k => M.probs[k] > 0.5);
    const parts = LEAVES[leaf].lottery(P).filter(([, w]) => w > 1e-9);
    const bar = parts.map(([s, w]) => `<div style="width:${w * 100}%;background:${DOCS_COL[SITUATION[s].docs]}" title="${SITUATION[s].label}">${w > 0.08 ? pct(w) : ''}</div>`).join('');
    const list = parts.map(([s, w]) => `<li><span class="sw" style="background:${DOCS_COL[SITUATION[s].docs]}"></span>${SITUATION[s].label} · <b class="mono">${pct(w)}</b></li>`).join('');
    return `<p>Gains espérés de ${leaf} : <b style="color:var(--nyt)">Times ${num(M.O[leaf][0])}</b> ; <b style="color:var(--wp)">Post ${num(M.O[leaf][1])}</b> ; <b style="color:var(--gov)">Nixon ${num(M.O[leaf][2])}</b>.</p>` +
      (parts.length > 1 ? `<p>Ensuite, les juges tranchent :</p><div class="sim-probbar">${bar}</div><ul class="sim-verdicts">${list}</ul>` : '<p>Aucun procès : pas de hasard.</p>') +
      `<p class="sim-full">Probabilité que tout finisse par sortir : <b>${pct(M.full)}</b>.</p>`;
  }

  function condsHtml(S, P) {
    const f = factors(), t = S.th;
    const row = (c, title, text) => `<li class="${c.ok ? 'is-ok' : 'is-ko'}"><span class="sim-mark">${c.ok ? '✔' : '✘'}</span><div><b>${title}</b> <span class="sim-node">${c.node}</span><br>${text}</div></li>`;
    const [times, nixT, post, nixP] = S.conds;
    return [
      row(times, 'Le Times publie', `Sa chance de gagner à la fin, ${m('π = q + (1 − q)p')} = ${pct(S.pi)}, doit atteindre son seuil ${m('τ<sub>T</sub>')} = ${bound(t.tauT)}.`),
      row(nixT, 'Nixon poursuit le Times', `Coût moyen des procès ${m('k<sub>T</sub> + (1 − q)k<sub>W</sub>')} = ${num(nixT.cost)} doit rester sous le dommage évité ${m(`(1 − q)(1 − p)${f.th}${f.dr}`)} = ${num(nixT.gain)}.`),
      row(post, 'Le Post publie à son tour', `${m('p')} = ${pct(P.p)} doit atteindre son seuil ${m('τ<sub>W</sub>')} = ${bound(t.tauW)}.`),
      row(nixP, 'Nixon poursuit aussi le Post', `${m('p')} = ${pct(P.p)} doit rester sous ${m(`1 − k<sub>W</sub> / ${f.th}${f.dr}`)} = ${bound(t.gPost)}.`),
    ].join('');
  }

  function intervalHtml(range, letter, other, value, otherValue) {
    const head = `<div class="sim-int-title">Intervalle pour ${m(letter)} (${letter === 'p' ? 'tribunal 2, Cour suprême' : 'tribunal 1, juge local'}), avec ${m(other)} = ${pct(otherValue)} fixé</div>`;
    if (range.empty) {
      let why;
      if (range.reason === 'noDamage') why = 'Nixon n’a rien à gagner à un procès : une censure ne cacherait plus rien (dommage nul ou θ = 100 %).';
      else if (range.reason === 'q1') why = 'Avec q = 100 %, le juge local libère toujours le Times : Nixon n’a aucune raison de poursuivre le Post.';
      else if (range.reason === 'nixonPost') why = `Avec ${m('p')} = ${pct(otherValue)}, Nixon ne poursuivrait pas le Post (il faudrait ${m('p')} &lt; ${bound(range.bound)}).`;
      else if (range.reason === 'post') why = `Avec ${m('p')} = ${pct(otherValue)}, le Post n’ose pas prendre le relais (il faudrait ${m('p')} ≥ ${bound(range.bound)}).`;
      else {
        const X = m(letter);
        const lo = range.rawLo > 1 ? `les journaux ne publieraient pour aucune valeur de ${X}` : range.rawLo > 0 ? `il faut ${X} ≥ ${pct(range.rawLo)} pour que les journaux publient` : '';
        const hi = range.rawHi <= 0 ? `Nixon ne poursuivrait le Times pour aucune valeur de ${X}` : range.rawHi < 1 ? `il faut ${X} &lt; ${pct(range.rawHi)} pour que Nixon poursuive le Times` : '';
        const text = lo && hi ? `${lo}, mais ${hi.replace(/^il faut /, '')}` : lo || hi || 'les conditions sont incompatibles';
        why = text.charAt(0).toUpperCase() + text.slice(1) + '.';
      }
      return head + `<div class="sim-int-value is-empty">Aucun intervalle</div><p class="sim-int-why">${why} Le scénario de 1971 est impossible avec ${m(other)} = ${pct(otherValue)}.</p>`;
    }
    const inside = value >= range.lo && value < range.hi;
    return head + `<div class="sim-int-value">[ ${pct(range.lo)} ; ${pct(range.hi)} [</div>
      <p class="sim-int-why">${m(letter)} au moins ${pct(range.lo)} et strictement moins de ${pct(range.hi)}. Votre valeur, ${pct(value)}, ${inside ? '<b class="sim-ok">est dans l’intervalle</b>' : '<b class="sim-ko">est en dehors</b>'}.</p>
      <div class="sim-bar"><span class="seg" style="left:${range.lo * 100}%;width:${(range.hi - range.lo) * 100}%"></span><span class="mk" style="left:${value * 100}%"></span></div>
      <div class="sim-bar-ticks"><span>0 %</span><span>100 %</span></div>`;
  }

  function formulasHtml() {
    const f = factors();
    return `<p>Avec ${m(`F = ${f.th}${f.dr}`)}, le dommage que Nixon peut encore éviter par une censure :</p>
      <p>${m('p')} pour ${m('q')} fixé : ${m('max(τ<sub>W</sub> ; (τ<sub>T</sub> − q)/(1 − q)) ≤ p &lt; 1 − (k<sub>W</sub> + k<sub>T</sub>/(1 − q))/F')}</p>
      <p>${m('q')} pour ${m('p')} fixé, si ${m('τ<sub>W</sub> ≤ p &lt; 1 − k<sub>W</sub>/F')} : ${m('(τ<sub>T</sub> − p)/(1 − p) ≤ q &lt; 1 − k<sub>T</sub>/((1 − p)F − k<sub>W</sub>)')}</p>
      <p>Seuils des journaux : ${m('τ = (c + S − θB) / ((1 − θ)B + S)')}.</p>`;
  }

  function equationsHtml(P) {
    const on = state.flags, sig = on.thOn ? `θ = ${pct(P.th)}` : '0 (θ désactivé)';
    const paperRows = ['T', 'W'].map(j => {
      const B = P['B_' + j], c = P['c_' + j], S = P['S_' + j], name = j === 'T' ? 'Times' : 'Post', col = j === 'T' ? '--nyt' : '--wp';
      return `<tr><th style="color:var(${col})">${name}</th><td>0</td><td>${num(B)}</td><td>${num(B)} − ${num(c)} = <b>${num(B - c)}</b></td><td>${num(P.th)}×${num(B)} − ${num(c)} − ${num(S)} = <b>${num(P.th * B - c - S)}</b></td></tr>`;
    }).join('');
    const nx = (label, sigma, kT, kW) => {
      const v = P.R * (1 - sigma) - P.D * sigma - (kT ? P.k_T : 0) - (kW ? P.k_W : 0);
      const parts = [on.rOn && sigma < 1 ? `${num(P.R)}×${num(1 - sigma)}` : '', sigma > 0 ? `− ${num(P.D)}×${num(sigma)}` : '', kT ? `− ${num(P.k_T)}` : '', kW ? `− ${num(P.k_W)}` : ''].filter(Boolean).join(' ') || '0';
      return `<tr><td>${label}</td><td>${parts.replace(/^− /, '−')} = <b>${num(v)}</b></td></tr>`;
    };
    const leaves = OUTCOME_ORDER.map(k => `<tr><th>${k}</th><td>${TITLE[k].join(' ')}</td><td style="color:var(--nyt)">${num(LAST.M.O[k][0])}</td><td style="color:var(--wp)">${num(LAST.M.O[k][1])}</td><td style="color:var(--gov)">${num(LAST.M.O[k][2])}</td></tr>`).join('');
    return `<p><b>Part qui sort</b> ${m('σ')} : 1 si tout sort ; ${sig} si une censure est maintenue ; 0 si rien ne sort.</p>
      <p><b>Un journal</b> : ${m('u = 0')} s’il ne publie pas ; sinon ${m('u = B·σ − c')} (s’il est poursuivi) ${m('− S')} (si sa censure est maintenue).</p>
      <div class="scroll-x"><table class="sim-table"><thead><tr><th></th><th>Ne publie pas</th><th>Publie, pas de procès</th><th>Procès gagné</th><th>Procès perdu</th></tr></thead><tbody>${paperRows}</tbody></table></div>
      <p><b>Nixon</b> : ${m(`u = ${on.rOn ? 'R·(1 − σ) − ' : '−'}D·σ − k<sub>T</sub>`)} (s’il poursuit le Times) ${m('− k<sub>W</sub>')} (s’il poursuit le Post).${on.rOn ? ' Le bonus R récompense la part gardée secrète.' : ''}</p>
      <div class="scroll-x"><table class="sim-table"><tbody>
        ${nx('Rien ne sort, aucun procès', 0, 0, 0)}${nx('Tout sort, aucun procès', 1, 0, 0)}${nx('Tout sort, procès contre le Times', 1, 1, 0)}${nx('Tout sort, procès contre le Post seul', 1, 0, 1)}${nx('Tout sort, deux procès', 1, 1, 1)}
        ${nx('Censure maintenue, procès contre le Times', P.th, 1, 0)}${nx('Censure maintenue, procès contre le Post seul', P.th, 0, 1)}${nx('Censure maintenue, deux procès', P.th, 1, 1)}
      </tbody></table></div>
      <p><b>Les sept feuilles</b> (gains espérés quand il y a un procès : chaque gain × la chance du verdict, puis on additionne) :</p>
      <div class="scroll-x"><table class="sim-table sim-leaves"><thead><tr><th></th><th>Histoire</th><th>Times</th><th>Post</th><th>Nixon</th></tr></thead><tbody>${leaves}</tbody></table></div>`;
  }

  // ---------- Carte des probabilités ----------
  let zone = { key: null, image: null };
  function drawZone(P, S) {
    const cv = one('#sim-zone'), g = cv.getContext('2d'), W = cv.width, N = 110, cell = W / N;
    const colors = ['--ok', '--surface2', '--ink', '--ink2', '--stamp', '--surface'].map(css);
    const key = JSON.stringify([KEYS.filter(k => k !== 'q' && k !== 'p').map(k => P[k]), colors]);
    if (zone.key === key && zone.image) g.putImageData(zone.image, 0, 0);
    else {
      const grid = [];
      for (let j = 0; j < N; j++) { grid.push([]); for (let i = 0; i < N; i++) grid[j].push(scenario1971({ ...P, q: (i + 0.5) / N, p: 1 - (j + 0.5) / N }).ok); }
      g.clearRect(0, 0, W, W);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        g.fillStyle = grid[j][i] ? colors[0] : colors[1]; g.globalAlpha = grid[j][i] ? 0.75 : 1;
        g.fillRect(Math.floor(i * cell), Math.floor(j * cell), Math.ceil(cell) + 1, Math.ceil(cell) + 1);
      }
      g.globalAlpha = 1; g.fillStyle = colors[2];
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        if (i < N - 1 && grid[j][i] !== grid[j][i + 1]) g.fillRect((i + 1) * cell - 1, j * cell, 2, cell + 1);
        if (j < N - 1 && grid[j][i] !== grid[j + 1][i]) g.fillRect(i * cell, (j + 1) * cell - 1, cell + 1, 2);
      }
      g.strokeStyle = colors[3]; g.globalAlpha = 0.25; g.lineWidth = 1;
      for (let k = 1; k < 4; k++) { const x = W * k / 4; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, W); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(W, x); g.stroke(); }
      g.globalAlpha = 1; g.font = '600 13px "IBM Plex Mono", monospace'; g.fillStyle = colors[3];
      ['0', '25 %', '50 %', '75 %'].forEach((t, k) => { g.fillText(t, W * k / 4 + 4, W - 6); if (k) g.fillText(t, 4, W - W * k / 4 - 5); });
      zone = { key, image: g.getImageData(0, 0, W, W) };
    }
    const x = P.q * W, y = (1 - P.p) * W;
    g.lineCap = 'round'; g.strokeStyle = colors[4]; g.lineWidth = 5;
    if (!S.pRange.empty) { g.beginPath(); g.moveTo(x, (1 - S.pRange.lo) * W); g.lineTo(x, (1 - S.pRange.hi) * W); g.stroke(); }
    if (!S.qRange.empty) { g.beginPath(); g.moveTo(S.qRange.lo * W, y); g.lineTo(S.qRange.hi * W, y); g.stroke(); }
    g.beginPath(); g.arc(x, y, 9, 0, 7); g.fillStyle = colors[4]; g.fill(); g.lineWidth = 3; g.strokeStyle = colors[5]; g.stroke();
  }

  // ---------- Rendu ----------
  const LAST = { M: null };
  function render() {
    const P = params();
    const M = solve(P), S = scenario1971(P);
    LAST.M = M;
    const leaf = OUTCOME_ORDER.find(k => M.probs[k] > 0.5);
    drawTree(one('#sim-tree'), P, { eq: true, probs: true, path: leaf });
    const v = one('#sim-verdict');
    v.className = 'sim-verdict ' + (S.ok ? 'is-ok' : 'is-ko');
    const firstFail = S.conds.find(c => !c.ok);
    const failText = { times: 'le Times ne publie pas', nixonTimes: 'Nixon ne poursuit pas le Times', post: 'le Post ne prend pas le relais', nixonPost: 'Nixon ne poursuivrait pas le Post' };
    v.innerHTML = S.ok
      ? `<b>✔ Le scénario de 1971 se réalise.</b><span>Le Times publie, Nixon le poursuit, le Post publie à son tour, Nixon le poursuit aussi (feuille O1).</span>`
      : `<b>✘ Le scénario de 1971 ne se réalise pas.</b><span>Avec vos valeurs : ${REG[regKey(M)].label.toLowerCase()} (feuille ${leaf}). Première condition qui manque : ${failText[firstFail.id]}.</span>`;
    one('#sim-path').innerHTML = pathHtml(M, S.ok);
    one('#sim-leaf').innerHTML = leafHtml(M, P);
    one('#sim-strat').innerHTML = `<span class="chip" style="--c:var(--nyt)">Times : ${M.tPub ? 'publier' : 'ne pas publier'}</span><span class="chip" style="--c:var(--wp)">Post : ${M.wPub ? 'publier' : 'se taire'} en relais ; ${M.wAlone ? 'publier' : 'se taire'} seul</span><span class="chip" style="--c:var(--gov)">Nixon : ${M.g1Sue ? 'poursuivre' : 'laisser faire'} le Times ; ${M.g2Sue ? 'poursuivre' : 'laisser faire'} le Post en relais ; ${M.g3Sue ? 'poursuivre' : 'laisser faire'} le Post seul</span>`;
    one('#sim-conds').innerHTML = condsHtml(S, P);
    const pR = { ...S.pRange }, qR = { ...S.qRange };
    if (qR.reason === 'nixonPost') qR.bound = S.th.gPost;
    if (qR.reason === 'post') qR.bound = S.th.tauW;
    one('#sim-int-p').innerHTML = intervalHtml(pR, 'p', 'q', P.p, P.q);
    one('#sim-int-q').innerHTML = intervalHtml(qR, 'q', 'p', P.q, P.p);
    one('#sim-formulas').innerHTML = formulasHtml();
    one('#sim-eq').innerHTML = equationsHtml(P);
    drawZone(P, S);
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }
  one('#sim-zone').addEventListener('click', e => {
    const r = e.target.getBoundingClientRect();
    state.values.q = Math.round(clamp01((e.clientX - r.left) / r.width) * 200) / 200;
    state.values.p = Math.round(clamp01(1 - (e.clientY - r.top) / r.height) * 200) / 200;
    pressed(null); syncForm(); schedule();
  });
  /* Les couleurs de la carte suivent le thème (papier ou nuit). */
  new MutationObserver(() => { zone.key = null; render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  syncForm();
  render();
})();
