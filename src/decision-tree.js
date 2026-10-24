/* Forme étendue : lecture descendante, actions colorées, gains sous les feuilles.
   La structure et les valeurs restent celles du modèle Pentagon Papers. */
function drawTree(svg, P, opt = {}) {
  const M = solve(P);
  const o = { mode:'num', eq:false, step:99, probs:false, hist:false, scope:'full', reduce:false, ...opt };
  const focus = o.step >= 1 && o.step <= 6 ? 6 - o.step : null;
  const first = o.scope === 'focus' && focus !== null ? focus : o.scope === 'post' ? 3 : 0;
  const construction = Number.isInteger(o.constructStage) ? Math.max(1,Math.min(6,o.constructStage)) : 6;
  const last = Math.max(first,Math.min(5, construction - 1, o.reduce && focus !== null ? focus : 5));
  const count = last - first + 1;
  const rootX = 240 + count * 120;
  const width = rootX + 300;
  const height = 110 + count * 220 + 175;
  const position = index => [rootX - (index-first)*120,110 + (index-first)*220];
  const colours = ['--nyt','--gov','--nat','--wp','--gov','--nat'];
  const names = ['New York Times','Gouvernement','Juge local · Nature','Washington Post','Gouvernement','Cour suprême · Nature'];
  const nodeValues = [M.root,M.g1v,M.judge,M.wv,M.g2v,M.sc];
  const decision = {0:M.tPub,1:M.g1Sue,3:M.wPub,4:M.g2Sue};
  const outcomeAt = ['O1','O2','O3','O4','O5'];
  const continuationLabels = ['Publier','Poursuivre','Censure','Publier','Poursuivre'];
  const exitLabels = ['Ne pas publier','Laisser faire','Favorable au Times','Se taire','Laisser faire'];
  const solved = index => o.eq || (o.step >= 1 && o.step <= 8 && 6-index <= o.step);
  const path = o.pathLeaf || (o.hist ? 'O6' : null);
  const pathEnd = path ? Math.min(5,Number(path.slice(1))-1) : -1;
  const activeGain = o.scope==='focus' && o.reduce ? ({0:0,1:2,3:1,4:2}[focus] ?? null) : null;
  const shownProbs = o.scope==='post' ? {O4:!M.wPub?1:0,O5:M.wPub&&!M.g2Sue?1:0,O6:M.wPub&&M.g2Sue?P.p:0,O7:M.wPub&&M.g2Sue?1-P.p:0} : M.probs;
  const E = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text = (x,y,content,klass='',anchor='middle',colour='--ink') => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${klass}" fill="var(${colour})">${E(content)}</text>`;
  const vector = (x,y,values,symbolic=false) => ['NYT','WP','Gouv.'].map((label,k)=>{
    const colour=['--nyt','--wp','--gov'][k];
    const v=symbolic ? E(values[k]).replace(/([A-Za-zθ])_([A-Z])/g,'$1<tspan baseline-shift="sub" font-size="75%">$2</tspan>') : E(fr(values[k],2));
    const highlight=k===activeGain?`<rect x="${x-104}" y="${y+k*22-15}" width="208" height="21" rx="3" fill="var(${colour})" fill-opacity=".12" stroke="var(${colour})" stroke-width=".6"/>`:'';
    return highlight+text(x-96,y+k*22,label,'dt-pay-label','start',colour)+`<text x="${x+96}" y="${y+k*22}" text-anchor="end" class="dt-pay-value${symbolic?' dt-symbol':''}" fill="var(${colour})">${v}</text>`;
  }).join('');
  let markup = `<title>Arbre du jeu${first===3?' : sous-jeu du Washington Post':''}</title><desc>Lire de haut en bas. Les branches indiquent les actions. Sous chaque issue, les gains sont dans l’ordre New York Times, Washington Post, gouvernement. Les losanges représentent le hasard judiciaire.</desc>`;
  markup += text(24,27,o.scope==='focus' && focus!==null?'SOUS-JEU ÉTUDIÉ · NŒUD x'+focus:first===3?'SOUS-JEU DU POST · APRÈS LA CENSURE DU TIMES':'FORME ÉTENDUE · DÉROULEMENT DU JEU ↓','dt-orientation','start','--muted');
  if (o.reduce && focus !== null) markup += text(24,49,'Les suites déjà résolues sont remplacées par leurs gains.','dt-caption','start','--muted');

  function terminal(id,x,y,onPath) {
    const outline = onPath ? '--stamp' : '--rule';
    let s=`<g class="dt-terminal" data-outcome="${id}"><circle cx="${x}" cy="${y}" r="5" fill="var(--ink)"/><rect x="${x-113}" y="${y+15}" width="226" height="135" rx="6" fill="var(--surface)" stroke="var(${outline})" stroke-width="${onPath?2.5:1}"/>`;
    s+=text(x-96,y+36,id,'dt-outcome-id','start','--muted');
    if(o.probs && shownProbs[id]>1e-9) s+=text(x+96,y+36,pct(shownProbs[id]),'dt-outcome-prob','end','--stamp');
    s+=text(x,y+55,TITLE[id].join(' '),'dt-outcome-title');
    s+=vector(x,y+82,o.mode==='sym'?SYM[id]:M.O[id],o.mode==='sym');
    return s+'</g>';
  }
  function replacement(index,x,y) {
    const isComputed = construction===6 && o.reduce && focus!==null;
    let s=`<g class="dt-replacement" data-replaced-node="x${index}"><circle cx="${x}" cy="${y}" r="5" fill="var(--ink)"/><rect x="${x-113}" y="${y+15}" width="226" height="${isComputed?135:83}" rx="6" fill="var(--surface2)" stroke="var(--nat)" stroke-dasharray="4 3"/>`;
    s+=text(x,y+38,isComputed?'SOUS-JEU RÉSOLU':'LA SUITE DU JEU','dt-outcome-id','middle','--nat');
    s+=text(x,y+58,names[index].replace(' · Nature',''),'dt-outcome-title');
    s+=isComputed?vector(x,y+84,nodeValues[index]):text(x,y+81,'À développer à l’étape suivante','dt-caption','middle','--muted');
    return s+'</g>';
  }
  function edge(index,side,x1,y1,label,prob,onPath) {
    const [x0,y0]=position(index);
    const nature=index===2||index===5;
    const selected=!nature && solved(index) && (side==='left' ? decision[index] : !decision[index]);
    const rejected=!nature && solved(index) && !selected;
    const colour=rejected?'--muted':colours[index];
    const pathClass=onPath?' dt-history':'';
    let s=`<g class="dt-branch${rejected?' dt-rejected':''}${pathClass}" data-from="x${index}" data-side="${side}">`;
    if(onPath) s+=`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="var(--hl)" stroke-width="12" opacity=".5" stroke-linecap="round"/>`;
    s+=`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="var(${colour})" stroke-width="${selected?4.5:2.2}" ${rejected?'stroke-dasharray="5 5"':''} stroke-linecap="round" class="${selected?'dt-selected-edge':''}"/>`;
    const lx=side==='left'?(x0+x1)/2-14:x1,ly=side==='left'?(y0+y1)/2-4:y1-44,anchor=side==='left'?'end':'middle';
    s+=text(lx,ly,label,'dt-action',anchor,colour);
    if(prob) s+=text(lx,ly+22,prob,'dt-probability',anchor,'--nat');
    if(rejected) s+=text(lx,ly+21,'× choix écarté','dt-caption',anchor,'--muted');
    return s+'</g>';
  }

  /* Edges and leaves first; node markers stay above the connecting strokes. */
  for(let index=first;index<=last;index++) {
    const [x,y]=position(index),nextY=y+220;
    if(index===5) {
      const leftX=x-155,rightX=x+155;
      markup+=edge(index,'left',leftX,nextY,'Journaux gagnants',`p = ${pct(P.p)}`,path==='O6');
      markup+=edge(index,'right',rightX,nextY,'Gouvernement gagnant',`1 − p = ${pct(1-P.p)}`,path==='O7');
      markup+=terminal('O6',leftX,nextY,path==='O6')+terminal('O7',rightX,nextY,path==='O7');
    } else {
      const [nextX]=position(index+1),exitX=x+155;
      const leftPath=!!path && index<pathEnd,rightPath=!!path && index===pathEnd;
      markup+=edge(index,'left',nextX,nextY,continuationLabels[index],index===2?`1 − q = ${pct(1-P.q)}`:null,leftPath);
      markup+=edge(index,'right',exitX,nextY,exitLabels[index],index===2?`q = ${pct(P.q)}`:null,rightPath);
      markup+=terminal(outcomeAt[index],exitX,nextY,rightPath);
      if(index===last)markup+=replacement(index+1,nextX,nextY);
    }
  }
  for(let index=first;index<=last;index++) {
    const [x,y]=position(index),colour=colours[index],nature=index===2||index===5;
    markup+=`<g class="dt-node${focus===index?' dt-focus':''}" data-node="x${index}">`;
    if(focus===index)markup+=`<circle cx="${x}" cy="${y}" r="27" fill="var(${colour})" opacity=".12"/><circle cx="${x}" cy="${y}" r="27" fill="none" stroke="var(${colour})" stroke-width="1"/>`;
    markup+=nature?`<rect x="${x-10}" y="${y-10}" width="20" height="20" rx="1" transform="rotate(45 ${x} ${y})" fill="var(${colour})"/>`:`<circle cx="${x}" cy="${y}" r="11" fill="var(${colour})"/>`;
    markup+=text(x,y-30,names[index],'dt-actor','middle',colour);
    markup+=text(x+21,y+6,'x'+index,'dt-node-id','start','--muted');
    if(solved(index) && !(o.reduce && focus!==null)) {
      markup+=`<g class="dt-node-value"><rect x="${x-334}" y="${y-44}" width="214" height="102" rx="5" fill="var(--surface2)" stroke="var(--rule)"/>`;
      markup+=text(x-227,y-23,nature?'GAIN ESPÉRÉ':'VALEUR DU SOUS-JEU','dt-caption','middle','--muted');
      markup+=vector(x-227,y-2,nodeValues[index])+'</g>';
    }
    markup+='</g>';
  }
  svg.classList.add('course-tree');
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  svg.style.setProperty('--tree-min-width',`${Math.min(width,first===3?780:1000)}px`);
  svg.dataset.treeWidth=width;
  svg.dataset.treeScope=o.scope;
  svg.innerHTML=markup;
  return M;
}
