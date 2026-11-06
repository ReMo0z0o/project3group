/* Forme étendue dessinée de haut en bas, comme dans le cours (S6, diapositives 8–9 et 14).
   Chaque feuille reçoit sa colonne ; un nœud se place au milieu de ses branches.
   Options :
   - root : nœud de départ (un sous-jeu commence à un nœud et contient toutes ses suites) ;
   - built : nœuds déjà construits (les autres apparaissent « à développer ») ;
   - solved : nœuds déjà résolus (action retenue en trait plein, action écartée en pointillés) ;
   - reduce : remplace les sous-jeux déjà résolus par leur profil de gains ;
   - values : affiche les gains de continuation des nœuds résolus ;
   - probs : probabilités d'atteindre chaque issue ; path : issue dont on suit le chemin ;
   - focus : nœud étudié ; mode : 'num' ou 'sym'. */
function drawTree(svg, P, opt = {}) {
  const M = solve(P);
  const o = { mode: 'num', root: 'x0', built: null, solved: null, eq: false, reduce: false, values: false, probs: false, path: null, focus: null, ...opt };
  const solvedSet = new Set(o.eq ? NODE_ORDER : (o.solved || []));
  const builtSet = o.built ? new Set(o.built) : null;
  const COLW = 146, LEVEL = 128, SIDE = 46, TOP = 112, BOX_W = 134, BOX_H = 118;
  const colour = n => n.kind === 'chance' ? '--nat' : ['--nyt', '--wp', '--gov'][n.player];
  const E = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const subs = value => E(value).replace(/([A-Za-zθ])_([A-Z])/g, '$1<tspan baseline-shift="sub" font-size="72%">$2</tspan>');
  const text = (x, y, content, klass = '', anchor = 'middle', fill = '--ink', raw = false) => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${klass}" fill="var(${fill})">${raw ? content : E(content)}</text>`;

  /* 1. Structure visible. */
  function build(id, depth, parentIndex) {
    if (isOutcome(id)) return { id, type: 'leaf', depth, parentIndex };
    if (builtSet && !builtSet.has(id)) return { id, type: 'pending', depth, parentIndex };
    if (o.reduce && id !== o.root && solvedSet.has(id)) return { id, type: 'replaced', depth, parentIndex };
    return { id, type: 'node', depth, parentIndex, children: NODES[id].actions.map((action, index) => build(action[1], depth + 1, index)) };
  }
  const tree = build(o.root, 0, null);
  let columns = 0, maxDepth = 0;
  (function place(t) {
    maxDepth = Math.max(maxDepth, t.depth);
    if (t.type !== 'node') { t.col = columns++; return; }
    t.children.forEach(place);
    t.col = (t.children[0].col + t.children[t.children.length - 1].col) / 2;
  })(tree);
  const width = Math.max(columns * COLW + 2 * SIDE, 640);
  const offset = (width - columns * COLW) / 2;
  const X = col => Math.round(offset + COLW / 2 + col * COLW);
  const Y = depth => TOP + depth * LEVEL;
  const height = TOP + maxDepth * LEVEL + BOX_H + 40;

  /* 2. Chemin suivi et décisions résolues. */
  const pathEdges = new Set();
  if (o.path) {
    (function find(id) {
      if (id === o.path) return true;
      if (isOutcome(id)) return false;
      for (const action of NODES[id].actions) if (find(action[1])) { pathEdges.add(id + '>' + action[1]); return true; }
      return false;
    })(o.root);
  }
  const shown = o.root === 'x0' ? M.probs : null;
  const subProbs = {};
  if (o.probs && o.root !== 'x0') (function walk(id, w) {
    if (isOutcome(id)) { subProbs[id] = (subProbs[id] || 0) + w; return; }
    const n = NODES[id];
    if (n.kind === 'chance') n.actions.forEach(a => walk(a[1], w * a[2](P)));
    else walk(n.actions[M.choice[id]][1], w);
  })(o.root, 1);
  const probOf = id => (shown ? shown[id] : subProbs[id]) || 0;

  const vector = (x, y, values, symbolic, highlight) => [0, 1, 2].map(k => {
    const fill = ['--nyt', '--wp', '--gov'][k];
    const v = symbolic ? subs(values[k]) : E(fr(values[k], 2));
    const box = k === highlight ? `<rect x="${x - BOX_W / 2 + 5}" y="${y + k * 19 - 14}" width="${BOX_W - 10}" height="19" rx="3" fill="var(${fill})" fill-opacity=".14" stroke="var(${fill})" stroke-width=".8"/>` : '';
    return box + text(x - BOX_W / 2 + 12, y + k * 19, PLAYERS3[k], 'dt-pay-label', 'start', fill) + `<text x="${x + BOX_W / 2 - 12}" y="${y + k * 19}" text-anchor="end" class="dt-pay-value${symbolic ? ' dt-symbol' : ''}" fill="var(${fill})">${v}</text>`;
  }).join('');

  let edges = '', boxes = '', nodes = '';
  function leafBox(t, highlight) {
    const x = X(t.col), y = Y(t.depth), onPath = o.path === t.id;
    let s = `<g class="dt-terminal" data-outcome="${t.id}"><circle cx="${x}" cy="${y}" r="5" fill="var(--ink)"/>`;
    s += `<rect x="${x - BOX_W / 2}" y="${y + 12}" width="${BOX_W}" height="${BOX_H}" rx="6" fill="var(--surface)" stroke="var(${onPath ? '--stamp' : '--rule'})" stroke-width="${onPath ? 2.5 : 1}"/>`;
    s += text(x - BOX_W / 2 + 10, y + 30, t.id, 'dt-outcome-id', 'start', '--muted');
    if (o.probs && probOf(t.id) > 1e-9) s += text(x + BOX_W / 2 - 10, y + 30, pct(probOf(t.id)), 'dt-outcome-prob', 'end', '--stamp');
    s += text(x, y + 49, TITLE[t.id][0], 'dt-outcome-title') + text(x, y + 65, TITLE[t.id][1], 'dt-outcome-title');
    s += vector(x, y + 87, o.mode === 'sym' ? SYM[t.id] : M.O[t.id], o.mode === 'sym', highlight);
    return s + '</g>';
  }
  function replacedBox(t, highlight) {
    const x = X(t.col), y = Y(t.depth), n = NODES[t.id];
    let s = `<g class="dt-replacement" data-replaced-node="${t.id}"><circle cx="${x}" cy="${y}" r="5" fill="var(--ink)"/>`;
    s += `<rect x="${x - BOX_W / 2}" y="${y + 12}" width="${BOX_W}" height="${BOX_H}" rx="6" fill="var(--surface2)" stroke="var(--nat)" stroke-dasharray="4 3"/>`;
    s += text(x, y + 30, t.id + ' · RÉSOLU', 'dt-outcome-id', 'middle', '--nat');
    s += text(x, y + 49, n.kind === 'chance' ? 'Espérance' : 'Valeur', 'dt-outcome-title') + text(x, y + 65, n.long.replace(/\s*\(.*\)/, ''), 'dt-outcome-title dt-small');
    s += vector(x, y + 87, M.V[t.id], false, highlight);
    return s + '</g>';
  }
  function pendingBox(t) {
    const x = X(t.col), y = Y(t.depth);
    return `<g class="dt-pending" data-pending-node="${t.id}"><circle cx="${x}" cy="${y}" r="5" fill="var(--muted)"/><rect x="${x - BOX_W / 2}" y="${y + 12}" width="${BOX_W}" height="58" rx="6" fill="none" stroke="var(--muted)" stroke-dasharray="4 4"/>` +
      text(x, y + 36, 'La suite du jeu', 'dt-outcome-title', 'middle', '--muted') + text(x, y + 55, 'à développer', 'dt-caption', 'middle', '--muted') + '</g>';
  }
  function badge(t) {
    /* Gains de continuation, du côté opposé à la branche qui arrive au nœud. */
    const x = X(t.col), y = Y(t.depth), w = 92, h = 64, left = t.parentIndex !== 1;
    const bx = left ? x - 58 - w : x + 58, by = y - h - 6;
    let s = `<g class="dt-node-value"><rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="5" fill="var(--surface2)" stroke="var(--rule)"/>`;
    s += text(bx + w / 2, by + 13, NODES[t.id].kind === 'chance' ? 'ESPÉRANCE' : 'VALEUR', 'dt-caption', 'middle', '--muted');
    s += [0, 1, 2].map(k => text(bx + w - 8, by + 29 + k * 14, fr(M.V[t.id][k], 2), 'dt-pay-value', 'end', ['--nyt', '--wp', '--gov'][k]) + `<circle cx="${bx + 10}" cy="${by + 25 + k * 14}" r="3.5" fill="var(${['--nyt', '--wp', '--gov'][k]})"/>`).join('');
    return s + '</g>';
  }

  (function render(t) {
    if (t.type !== 'node') return;
    const n = NODES[t.id], x0 = X(t.col), y0 = Y(t.depth);
    const decided = n.kind === 'decision' && solvedSet.has(t.id);
    t.children.forEach((child, index) => {
      const x1 = X(child.col), y1 = Y(child.depth), action = n.actions[index];
      const selected = decided && M.choice[t.id] === index, rejected = decided && !selected;
      const onPath = pathEdges.has(t.id + '>' + child.id);
      const fill = rejected ? '--muted' : colour(n);
      edges += `<g class="dt-branch${rejected ? ' dt-rejected' : ''}${onPath ? ' dt-history' : ''}" data-from="${t.id}" data-to="${child.id}">`;
      if (onPath) edges += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="var(--hl)" stroke-width="13" opacity=".55" stroke-linecap="round"/>`;
      edges += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="var(${fill})" stroke-width="${selected ? 4.5 : 2.2}" ${rejected ? 'stroke-dasharray="5 5"' : ''} stroke-linecap="round" class="${selected ? 'dt-selected-edge eq-edge' : ''}"/>`;
      /* Each label line keeps a fixed gap from the branch at its own height. */
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, anchor = index === 0 ? 'end' : 'start', gap = index === 0 ? -11 : 11;
      const at = y => Math.round(mx + (x1 - x0) * (y - my) / (y1 - y0) + gap);
      edges += text(at(my - 2), my - 4, action[0], 'dt-action', anchor, fill);
      if (action[2]) edges += text(at(my + 17), my + 15, `${action[3]} = ${pct(action[2](P))}`, 'dt-probability', anchor, '--nat');
      else if (rejected) edges += text(at(my + 17), my + 15, '× écarté', 'dt-caption', anchor, '--muted');
      edges += '</g>';
      if (child.type === 'leaf') boxes += leafBox(child, o.reduce && t.id === o.root && n.kind === 'decision' ? n.player : null);
      else if (child.type === 'replaced') boxes += replacedBox(child, o.reduce && t.id === o.root && n.kind === 'decision' ? n.player : null);
      else if (child.type === 'pending') boxes += pendingBox(child);
      else render(child);
    });
    nodes += `<g class="dt-node${o.focus === t.id ? ' dt-focus' : ''}" data-node="${t.id}">`;
    if (o.focus === t.id) nodes += `<circle cx="${x0}" cy="${y0}" r="27" fill="var(${colour(n)})" opacity=".13"/><circle cx="${x0}" cy="${y0}" r="27" fill="none" stroke="var(${colour(n)})"/>`;
    nodes += n.kind === 'chance'
      ? `<rect x="${x0 - 10}" y="${y0 - 10}" width="20" height="20" rx="1.5" transform="rotate(45 ${x0} ${y0})" fill="var(${colour(n)})"/>`
      : `<circle cx="${x0}" cy="${y0}" r="11" fill="var(${colour(n)})"/>`;
    nodes += text(x0, y0 - 24, n.name, 'dt-actor', 'middle', colour(n));
    nodes += text(x0 + 19, y0 + 22, t.id, 'dt-node-id', 'start', '--muted');
    if (o.values && solvedSet.has(t.id) && !(o.reduce && t.id === o.root)) nodes += badge(t);
    nodes += '</g>';
  })(tree);
  if (tree.type === 'leaf') boxes += leafBox(tree, null);

  const title = o.root === 'x0' ? 'Arbre du jeu' : `Sous-jeu qui commence en ${o.root} (${NODES[o.root].long})`;
  let markup = `<title>${E(title)}</title><desc>Lire de haut en bas. Les branches portent les actions et, pour la Nature, leurs probabilités. Sous chaque issue, les gains sont dans l’ordre Times, Post, Nixon.</desc>`;
  const heading = o.reduce && o.focus ? `SOUS-JEU ÉTUDIÉ · NŒUD ${o.focus}` : o.root === 'x0' ? 'FORME ÉTENDUE · DÉROULEMENT DU JEU ↓' : `SOUS-JEU · À PARTIR DE ${o.root}`;
  markup += text(24, 30, heading, 'dt-orientation', 'start', '--muted');
  if (o.reduce && o.focus) markup += text(24, 52, 'Les suites déjà résolues sont remplacées par leurs gains.', 'dt-caption', 'start', '--muted');
  markup += edges + boxes + nodes;
  svg.classList.add('course-tree');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.style.setProperty('--tree-min-width', `${Math.min(width, 1240)}px`);
  svg.dataset.treeWidth = width;
  svg.dataset.treeScope = o.reduce && o.focus ? 'focus' : o.root === 'x0' ? 'full' : 'subgame';
  svg.innerHTML = markup;
  return M;
}
