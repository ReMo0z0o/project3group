/* Navigation, reading comfort and presentation enhancements. No dependencies. */
(() => {
  const qs = (s, root = document) => root.querySelector(s);
  const all = (s, root = document) => [...root.querySelectorAll(s)];
  const sections = all('section.piece');
  const groups = [
    { id:'histoire', label:'01 — Comprendre', pages:['video','affaire','question','rappels','joueurs'] },
    { id:'modele', label:'02 — Modéliser', pages:['arbre','gains','resolution'] },
    { id:'explorer', label:'03 — Expérimenter', pages:['carte','secret','couts','labo'] },
    { id:'synthese', label:'04 — Retenir', pages:['enonce','limites','quiz','lexique','sources'] },
  ];
  const labels = Object.fromEntries(sections.map(s => [s.id, s.dataset.toc]));
  const order = groups.flatMap(g => g.pages);
  const mobileMedia = matchMedia('(max-width:780px)');
  let active = 'accueil';
  let visited = new Set();
  try { visited = new Set(JSON.parse(localStorage.getItem('pp-visited') || '[]').filter(id => order.includes(id))); } catch {}
  const escapeText = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getGroup = id => groups.find(g => g.pages.includes(id))?.id || 'accueil';

  qs('#toc').innerHTML = '<li class="toc-home"><a href="#accueil"><span>⌂</span><span>Vue d’ensemble</span></a></li>' + groups.map(group =>
    `<li><div class="toc-group">${group.label}</div><ol>${group.pages.map(id => `<li><a href="#${id}"><span>${id === 'video' ? '▷' : String(order.indexOf(id)).padStart(2,'0')}</span><span>${escapeText(labels[id])}</span></a></li>`).join('')}</ol></li>`
  ).join('');

  function updateVisited() {
    qs('#visited-fill').style.width = `${visited.size / order.length * 100}%`;
    qs('#visited-copy').textContent = `${visited.size} / ${order.length} chapitres explorés`;
    try { localStorage.setItem('pp-visited', JSON.stringify([...visited])); } catch {}
  }
  function closeMenu() {
    qs('#sidebar').classList.remove('open');
    qs('#mobile-backdrop').classList.remove('open');
    qs('#menu-toggle').setAttribute('aria-expanded','false');
    qs('#menu-toggle').setAttribute('aria-label','Ouvrir le sommaire');
    qs('#sidebar').inert = mobileMedia.matches;
  }
  function progress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    qs('#read-progress').style.width = `${max > 0 ? Math.min(100, scrollY / max * 100) : 100}%`;
  }
  function navigate(raw, options = {}) {
    let id = raw?.replace(/^#/, '') || 'accueil';
    if (id === 'top' || id === 'app-main') id = 'accueil';
    if (!order.includes(id)) id = 'accueil';
    const changed = active !== id;
    active = id;
    qs('#accueil').hidden = id !== 'accueil';
    sections.forEach(section => { section.hidden = section.id !== id; });
    all('#toc a').forEach(a => {
      const selected = a.hash === '#' + id;
      a.classList.toggle('on', selected);
      if (selected) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    all('.top-nav a').forEach(a => {
      const selected = a.dataset.group === getGroup(id);
      a.classList.toggle('is-active',selected);
      if (selected) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    qs('#breadcrumb').textContent = id === 'accueil' ? 'Vue d’ensemble' : labels[id];
    qs('#reader-count').textContent = id === 'accueil' ? 'THÉORIE DES JEUX · GROUPE 5–6' : `CHAPITRE ${String(order.indexOf(id) + 1).padStart(2,'0')} / ${order.length}`;
    document.title = id === 'accueil' ? 'Pentagon Papers — Une affaire de décisions' : `${labels[id]} — Pentagon Papers`;
    const nav = qs('#chapter-nav');
    nav.hidden = id === 'accueil';
    if (id !== 'accueil') {
      visited.add(id);
      const index = order.indexOf(id), prev = order[index - 1] || 'accueil', next = order[index + 1];
      nav.innerHTML = `<a href="#${prev}"><small>← ${prev === 'accueil' ? 'Le point de départ' : 'Chapitre précédent'}</small><span>${escapeText(labels[prev] || 'Vue d’ensemble')}</span></a>` +
        `<a href="#${next || 'accueil'}"><small>${next ? 'Chapitre suivant' : 'Revenir à l’essentiel'}</small><span>${escapeText(labels[next] || 'Vue d’ensemble')}</span></a>`;
    }
    updateVisited();
    closeMenu();
    if (options.updateHash && location.hash !== '#' + id) history.pushState(null,'','#' + id);
    if (options.scroll !== false) window.scrollTo({ top:0, behavior:'instant' });
    if (changed && options.focus !== false) {
      const heading = id === 'accueil' ? qs('.hero h1') : qs(`#${id} h2`);
      heading?.setAttribute('tabindex','-1');
      heading?.focus({ preventScroll:true });
    }
    requestAnimationFrame(progress);
    document.dispatchEvent(new CustomEvent('papers:chapter', { detail:{ id } }));
  }
  window.Papers = { navigate:id => navigate(id,{ updateHash:true }) };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = link.getAttribute('href').slice(1);
    if (id !== 'app-main' && id !== 'top' && id !== 'accueil' && !order.includes(id)) return;
    event.preventDefault();
    navigate(id,{ updateHash:true });
  });
  window.addEventListener('popstate', () => navigate(location.hash, {focus:false}));
  window.addEventListener('hashchange', () => navigate(location.hash));
  window.addEventListener('scroll', progress, { passive:true });
  qs('#menu-toggle').addEventListener('click', () => {
    const opened = qs('#sidebar').classList.toggle('open');
    qs('#mobile-backdrop').classList.toggle('open',opened);
    qs('#menu-toggle').setAttribute('aria-expanded',String(opened));
    qs('#menu-toggle').setAttribute('aria-label',opened ? 'Fermer le sommaire' : 'Ouvrir le sommaire');
    qs('#sidebar').inert = mobileMedia.matches && !opened;
    if (opened) qs('#toc a.on')?.focus();
  });
  qs('#mobile-backdrop').addEventListener('click',closeMenu);
  mobileMedia.addEventListener('change',closeMenu);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && qs('#sidebar').classList.contains('open')) {closeMenu();qs('#menu-toggle').focus();}
    if (event.key === 'Tab' && qs('#sidebar').classList.contains('open')) {
      const links = all('#toc a');
      if (event.shiftKey && document.activeElement === links[0]) {event.preventDefault();qs('#menu-toggle').focus();}
      else if (!event.shiftKey && document.activeElement === links.at(-1)) {event.preventDefault();qs('#menu-toggle').focus();}
      else if (document.activeElement === qs('#menu-toggle')) {event.preventDefault();(event.shiftKey ? links.at(-1) : links[0]).focus();}
    }
  });
  const theme = qs('#theme-toggle');
  function applyTheme(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    theme.setAttribute('aria-pressed',String(dark));
    theme.setAttribute('aria-label',dark ? 'Activer l’ambiance papier' : 'Activer l’ambiance nuit');
    theme.title = dark ? 'Ambiance papier' : 'Ambiance nuit';
    try { localStorage.setItem('pp-theme',dark ? 'dark' : 'light'); } catch {}
  }
  theme.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme !== 'dark'));
  qs('#print-app').addEventListener('click', () => window.print());
  applyTheme(document.documentElement.dataset.theme === 'dark');
  let themeBeforePrint;
  window.addEventListener('beforeprint',()=>{themeBeforePrint=document.documentElement.dataset.theme;document.documentElement.dataset.theme='light';renderAll();});
  window.addEventListener('afterprint',()=>{if(themeBeforePrint)document.documentElement.dataset.theme=themeBeforePrint;});

  /* Clear, visible model conventions, including its boundary cases. */
  const modelNote = document.createElement('div');
  modelNote.className = 'note';
  modelNote.innerHTML = '<strong>Comment lire ce modèle.</strong> Les gains sont des points d’utilité hypothétiques ; q = 30 % et p = 65 % sont des croyances choisies pour illustrer l’histoire. À égalité de gains, nous retenons la publication et l’absence de poursuite. Plusieurs ENPS peuvent exister à ces frontières.';
  qs('#gains .prose').after(modelNote);
  const assumptions = document.createElement('div');
  assumptions.className = 'note';
  assumptions.innerHTML = '<strong>Une simplification assumée.</strong> Les juges sont représentés par la Nature : leur verdict est incertain pour les joueurs. Le choix d’Ellsberg est fixé. Si le Times renonce, le jeu s’arrête ; si le Post se tait, on ne représente pas l’appel autonome du Times. Ces hypothèses définissent le modèle, pas toutes les possibilités de l’histoire réelle.';
  qs('#joueurs').append(assumptions);

  /* Compact live summary for the laboratory. */
  const metrics = document.createElement('div');
  metrics.className = 'lab-summary';
  metrics.setAttribute('aria-live','polite');
  metrics.innerHTML = '<div><span>PUBLICATION COMPLÈTE</span><strong id="live-full">75,5 %</strong><small>Probabilité dans le modèle</small></div><div><span>GAIN ESPÉRÉ · TIMES</span><strong id="live-nyt">60,6</strong><small>Points d’utilité</small></div><div><span>GAIN ESPÉRÉ · POST</span><strong id="live-wp">7,35</strong><small>Points d’utilité</small></div>';
  qs('#presets').after(metrics);
  const liveBadge = document.createElement('div');
  liveBadge.className='lab-live';
  liveBadge.innerHTML='<span class="status-dot"></span> RÉSULTAT CALCULÉ EN DIRECT';
  qs('#lab-regime').before(liveBadge);
  const scenarioTools = document.createElement('div');
  scenarioTools.className = 'scenario-tools';
  scenarioTools.innerHTML = '<span class="small ui">Votre scénario est mémorisé sur cet appareil.</span><button type="button" class="btn sm ghost" id="export-scenario">Exporter le scénario ↓</button>';
  metrics.after(scenarioTools);
  const originalRenderLab = renderLab;
  renderLab = function renderEnhancedLab() {
    originalRenderLab();
    const result = solve(LP);
    qs('#live-full').textContent = pct(result.full);
    qs('#live-nyt').textContent = fr(result.root[0],2);
    qs('#live-wp').textContent = fr(result.root[1],2);
    all('#presets button').forEach(button => {
      const expected = {...BASE,...PRESETS[button.dataset.p][1]};
      const matches = Object.keys(BASE).every(key => Math.abs(LP[key] - expected[key]) < 1e-9);
      button.classList.toggle('is-active',matches);
      button.setAttribute('aria-pressed',String(matches));
    });
    all('#sliders input').forEach(input => {
      const label = qs(`label[for="${input.id}"]`);
      input.setAttribute('aria-valuetext', fmtP(input.dataset.k, +input.value));
      if(label) qs('#o-' + input.dataset.k).setAttribute('for',input.id);
    });
  };
  renderLab();
  qs('#export-scenario').addEventListener('click', () => {
    const result = solve(LP);
    const data = {
      dossier:'Pentagon Papers — modèle pédagogique',
      avertissement:'Gains et probabilités illustratifs, pas des estimations historiques.',
      convention:'À égalité : publication, absence de poursuite.',
      parametres:LP,
      resultat:{regime:REG[result.regime].label,probabilites:result.probs,gainsEsperes:result.root,publicationComplete:result.full},
    };
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='pentagon-papers-scenario.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Scénario exporté.');
  });
  let toastTimer;
  function toast(message) {const el=qs('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800);}

  /* The original interactive maps also work with a keyboard. */
  all('.map canvas').forEach(canvas => {
    canvas.tabIndex = 0;
    canvas.setAttribute('role','img');
    if (canvas.closest('#map2')) {
      canvas.setAttribute('aria-label','Carte des équilibres. Cliquez pour choisir q et p, ou utilisez les flèches du clavier ; Maj accélère le déplacement. Les curseurs ci-dessus proposent les mêmes paramètres.');
      canvas.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
        event.preventDefault();const delta=event.shiftKey ? 0.05 : 0.01;
        if(event.key==='ArrowLeft')LP.q=clamp01(LP.q-delta);
        if(event.key==='ArrowRight')LP.q=clamp01(LP.q+delta);
        if(event.key==='ArrowUp')LP.p=clamp01(LP.p+delta);
        if(event.key==='ArrowDown')LP.p=clamp01(LP.p-delta);
        LP.q=Math.round(LP.q*100)/100;LP.p=Math.round(LP.p*100)/100;syncSliders();renderLab();
      });
    } else canvas.setAttribute('aria-describedby','legend1');
  });

  /* Expand diagrams without sacrificing mobile text legibility. */
  const dialog = document.createElement('dialog');
  dialog.className='tree-dialog';dialog.id='tree-dialog';
  dialog.setAttribute('aria-labelledby','tree-dialog-title');
  dialog.innerHTML='<div class="tree-dialog-head"><div><span class="eyebrow">LE MODÈLE EN GRAND</span><h2 id="tree-dialog-title">L’arbre de décision</h2></div><button type="button" class="icon-btn" aria-label="Fermer l’arbre" id="tree-close">×</button></div><div class="tree-dialog-controls"><button type="button" class="btn sm ghost" id="tree-zoom-out" aria-label="Réduire l’arbre">−</button><span id="tree-zoom">100 %</span><button type="button" class="btn sm ghost" id="tree-zoom-in" aria-label="Agrandir l’arbre">+</button><span class="small ui">Faites défiler pour explorer les branches.</span></div><div class="tree-dialog-body"></div>';
  document.body.append(dialog);
  let zoom=1;
  function applyZoom(){const svg=qs('.tree-dialog-body svg');if(svg)svg.style.width=`${1290*zoom}px`;qs('#tree-zoom').textContent=Math.round(zoom*100)+' %';qs('#tree-zoom-out').disabled=zoom<=.6;qs('#tree-zoom-in').disabled=zoom>=1.8;}
  all('.tree-wrap').forEach(wrap=>{
    const figure=wrap.closest('figure');
    const button=document.createElement('button');button.type='button';button.className='tree-expand';button.innerHTML='↗ Agrandir l’arbre';
    figure.prepend(button);
    button.addEventListener('click',()=>{qs('.tree-dialog-body').replaceChildren(wrap.querySelector('svg').cloneNode(true));qs('.tree-dialog-body svg').removeAttribute('id');zoom=1;applyZoom();dialog.showModal();});
  });
  qs('#tree-close').addEventListener('click',()=>dialog.close());
  qs('#tree-zoom-in').addEventListener('click',()=>{zoom=Math.min(1.8,Math.round((zoom+.2)*10)/10);applyZoom();});
  qs('#tree-zoom-out').addEventListener('click',()=>{zoom=Math.max(.6,Math.round((zoom-.2)*10)/10);applyZoom();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});

  const quizTools = document.createElement('div');
  quizTools.className='quiz-tools';
  quizTools.innerHTML='<span class="small ui">7 questions pour vérifier votre compréhension.</span><button type="button" class="btn sm ghost" id="reset-quiz">Recommencer ↻</button>';
  qs('#quizbox').before(quizTools);
  qs('#score').textContent='0 / 7 réponses';
  qs('#reset-quiz').addEventListener('click',()=>{
    good=0;done=0;qs('#score').textContent='0 / 7 réponses';
    all('#quizbox .q').forEach(box=>{delete box.dataset.done;all('button',box).forEach(b=>{b.disabled=false;b.classList.remove('good','bad');});qs('.fb',box).hidden=true;qs('.fb',box).textContent='';});
    toast('Le quiz est prêt pour une nouvelle tentative.');
  });
  qs('#quizbox').addEventListener('click',()=>{qs('#score').textContent=`${good} / 7 bonnes réponses · ${done} / 7 complétées`;});
  all('#quizbox .fb').forEach(fb=>fb.setAttribute('aria-live','polite'));
  window.initPresentation?.();
  navigate(location.hash,{focus:false});
})();
