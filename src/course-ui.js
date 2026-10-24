/* A guided reading of the extensive form, following S6 slides 8–18. */
const TREE_GUIDE_STEPS = [
  ['x₀ · La première décision', 'Le Times joue en premier. Dessinez un nœud, écrivez son nom et tracez deux branches : publier ou ne pas publier. Ne pas publier termine immédiatement le jeu en O1, avec trois gains nuls. Publier mène à une nouvelle décision, pas encore à un gain final.'],
  ['x₁ · La réaction du gouvernement', 'Après la publication du Times, le gouvernement observe cette action. Il poursuit ou laisse faire. Laisser faire termine le jeu en O2. Poursuivre mène au juge local. Les deux nœuds du gouvernement seront distincts : on ne fusionne pas ses décisions.'],
  ['x₂ · Ajouter l’incertitude judiciaire', 'Le juge local est représenté par la Nature : il ne choisit pas un gain à maximiser. Une décision favorable au Times, de probabilité q, mène à O3. La censure, de probabilité 1 − q, ouvre la décision du Post. Les probabilités de ces deux branches s’additionnent à 1.'],
  ['x₃ · La décision du Post', 'Le Post décide seulement après la censure du Times. Se taire mène à O4 ; publier ouvre une nouvelle réaction du gouvernement. Tout ce qui suit x₃ constitue le sous-jeu du Post : il faut inclure ses deux branches et toutes leurs suites.'],
  ['x₄ · La seconde décision du gouvernement', 'Le gouvernement choisit à nouveau entre poursuivre et laisser faire, cette fois face au Post. Laisser faire mène à O5. Poursuivre mène à la Cour suprême. Sa stratégie doit préciser ses actions en x₁ ET en x₄, même si l’un de ces nœuds n’est jamais atteint.'],
  ['x₅ · Fermer l’arbre par ses deux dernières issues', 'À la Cour suprême, la Nature donne raison aux journaux avec la probabilité p (O6) ou au gouvernement avec 1 − p (O7). L’arbre est complet : six nœuds non terminaux et sept feuilles. Les gains de chaque feuille décrivent toute l’histoire qui y mène.'],
];
const TREE_PATHS = {
 O1:['Le Times ne publie pas.','Aucune publication.'],
 O2:['Le Times publie → le gouvernement laisse faire.','Aucun procès.'],
 O3:['Le Times publie → le gouvernement poursuit → le juge local donne raison au Times.','Un procès ; publication complète.'],
 O4:['Le Times publie → le gouvernement poursuit → censure locale → le Post se tait.','Un procès ; publication partielle seulement.'],
 O5:['Le Times publie → le gouvernement poursuit → censure locale → le Post publie → le gouvernement laisse faire.','Un procès ; le Post diffuse les documents.'],
 O6:['Le Times publie → le gouvernement poursuit → censure locale → le Post publie → nouvelle poursuite → victoire des journaux à la Cour suprême.','Deux procès ; publication complète.'],
 O7:['Le Times publie → le gouvernement poursuit → censure locale → le Post publie → nouvelle poursuite → défaite des journaux à la Cour suprême.','Deux procès ; censure et sanctions.'],
};
let treeView = 'build', buildStage = 1, treePath = '';
function frameTreeRoot(svg) {
 requestAnimationFrame(()=>{
  const wrap=svg.closest('.tree-wrap');
  if(!wrap || !wrap.clientWidth)return;
  const marker=svg.querySelector('.dt-node circle, .dt-node rect');
  if(!marker)return;
  const x=marker.tagName.toLowerCase()==='circle'?Number(marker.getAttribute('cx')):Number(marker.getAttribute('x'))+Number(marker.getAttribute('width'))/2;
  wrap.scrollLeft=Math.max(0,x*svg.getBoundingClientRect().width/svg.viewBox.baseVal.width-wrap.clientWidth/2);
 });
}
renderMain = function renderGuidedTree() {
  drawTree($('#tree-main'), BASE, {mode:mainMode,scope:treeView==='post'?'post':'full',constructStage:treeView==='build'?buildStage:undefined,pathLeaf:treeView==='full'?treePath:undefined});
  $('#t-sym').setAttribute('aria-pressed',String(mainMode==='sym'));
  $('#t-num').setAttribute('aria-pressed',String(mainMode==='num'));
  document.querySelectorAll('[data-tree-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.treeView===treeView)));
  $('#tree-build-controls').hidden=treeView!=='build';$('#tree-path-control').hidden=treeView!=='full';
  $('#build-count').textContent=buildStage+' / 6';$('#build-prev').disabled=buildStage===1;$('#build-next').disabled=buildStage===6;
  let title,copy;
  if(treeView==='build') [title,copy]=TREE_GUIDE_STEPS[buildStage-1];
  else if(treeView==='post') {title='Un sous-jeu contient toutes les suites possibles.';copy='On part de x₃, où le Post décide après la censure du Times, puis on conserve les deux actions du Post et tous les nœuds qui suivent. Un seul chemin vers O6 ne serait pas un sous-jeu. Les coûts déjà engagés restent inclus dans les gains totaux affichés.';}
  else if(treePath) {title=treePath+' · '+TREE_PATHS[treePath][1];copy=TREE_PATHS[treePath][0]+' On lit ici une histoire possible : la mettre en évidence ne signifie pas que c’est un équilibre.';}
  else {title='Sept feuilles, sept histoires possibles.';copy='Partez du Times et descendez jusqu’à une feuille. Chaque feuille reçoit trois gains, dans l’ordre NYT / Post / gouvernement. Dans le cours, cet ordre est celui des joueurs : il ne change pas selon la personne qui vient de jouer.';}
  $('#tree-guide-copy').innerHTML='<h3>'+title+'</h3><p>'+copy+'</p>';
  frameTreeRoot($('#tree-main'));
};
document.querySelectorAll('[data-tree-view]').forEach(button=>button.addEventListener('click',()=>{treeView=button.dataset.treeView;renderMain();}));
$('#build-prev').addEventListener('click',()=>{buildStage=Math.max(1,buildStage-1);renderMain();});
$('#build-next').addEventListener('click',()=>{buildStage=Math.min(6,buildStage+1);renderMain();});
$('#tree-path').addEventListener('change',e=>{treePath=e.target.value;renderMain();});
$('#reduction-toggle').addEventListener('click',()=>{reduceTree=!reduceTree;renderStep();});
const baseRenderStep=renderStep;
renderStep=function renderCourseStep(){
 baseRenderStep();
 $('#reduction-toggle').setAttribute('aria-pressed',String(reduceTree));
 $('#reduction-toggle').textContent=reduceTree?'Voir l’arbre entier':'Isoler le calcul courant';
 $('#reduction-caption').textContent=step>=1&&step<=6&&reduceTree
 ? 'Sous-jeu courant : les suites déjà résolues sont remplacées par leurs profils de gains. La composante du joueur qui décide est encadrée. On remonte ensuite d’un nœud.'
 : step>=7?'Les décisions forment un plan complet. La Nature conserve ses deux branches possibles : un ENPS ne fixe pas le verdict des juges.'
 : 'Construire : du nœud initial vers les feuilles. Résoudre : des derniers sous-jeux vers le nœud initial.';
 frameTreeRoot($('#tree-step'));
};
renderMain();renderStep();
document.addEventListener('papers:chapter',event=>document.querySelectorAll('#'+event.detail.id+' .course-tree').forEach(frameTreeRoot));
let treeBeforePrint;
window.addEventListener('beforeprint',()=>{treeBeforePrint={treeView,treePath,reduceTree};treeView='full';treePath='';reduceTree=false;renderMain();renderStep();});
window.addEventListener('afterprint',()=>{if(treeBeforePrint){({treeView,treePath,reduceTree}=treeBeforePrint);renderMain();renderStep();}});

// Short, answerable checkpoints before applying the method to all six nodes.
document.querySelectorAll('[data-checkpoint]').forEach(box=>{
 box.addEventListener('click',event=>{
  const button=event.target.closest('[data-answer]');if(!button)return;
  const correct=button.dataset.answer===box.dataset.correct;
  const response=box.querySelector('.checkpoint-feedback');
  response.textContent=correct?box.dataset.explanation:'Reprenez la règle : à un nœud de décision, on compare uniquement les gains du joueur qui décide, en gardant le même ordre des composantes.';
  response.hidden=false;
  box.querySelectorAll('[data-answer]').forEach(b=>{b.classList.toggle('checkpoint-correct',correct&&b===button);b.setAttribute('aria-pressed',String(b===button));});
 });
});
