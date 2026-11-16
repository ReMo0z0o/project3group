/* End-to-end checks against the actual standalone artifact. No web framework. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');

let playwright;
for (const name of [process.env.PLAYWRIGHT_MODULE, 'playwright', 'playwright-core', '/opt/codex/cua_node/lib/node_modules/playwright-core'].filter(Boolean)) {
  try { playwright = require(name); break; } catch {}
}
if (!playwright) throw new Error('Install playwright-core or set PLAYWRIGHT_MODULE to its path.');

(async () => {
  const html = fs.readFileSync(path.join(__dirname,'../index.html'));
  const server = http.createServer((req,res) => {res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/`;
  const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const browser=await playwright.chromium.launch({executablePath,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  const page=await context.newPage();
  const errors=[],external=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',route=>{const destination=route.request().url();if(destination.startsWith(url))return route.continue();external.push(destination);return route.abort();});
  try {
    await page.goto(url);
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.title(),'Pentagon Papers — Une affaire de décisions');
    assert.equal(await page.locator('#chapter-nav').isVisible(),false,'no previous-chapter controls on the overview');
    const ids=await page.locator('section.piece').evaluateAll(elements=>elements.map(e=>e.id));
    assert.equal(ids.length,18,'all the educational chapters are available');
    let routes=0;
    for(const width of [1440,768,390,320]){
      await page.setViewportSize({width,height:900});
      for(const id of ['accueil',...ids]){
        await page.evaluate(id=>window.Papers.navigate(id),id);
        assert.equal(await page.locator('#'+id).isVisible(),true,`${id} visible at ${width}px`);
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
        assert.equal(overflow,false,`${id} has no page overflow at ${width}px`);
        assert.equal(await page.locator('section.piece:visible').count(),id==='accueil'?0:1);
        routes++;
      }
    }
    console.log(`PASS ${routes} chapter/viewport combinations`);
    await page.setViewportSize({width:390,height:844});
    await page.locator('#menu-toggle').click();
    assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');
    await page.locator('#toc a[href="#labo"]').click();
    assert.equal(await page.locator('#labo').isVisible(),true);
    assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
    await page.setViewportSize({width:1440,height:1000});
    const scenarios={1971:'Deux procès',peur:'Times seulement',sanction:'Times seulement',renonce:'Rien ne sort',hostile:'Rien ne sort',cher:'Publication sans procès',noncred:'menace non crédible',cour:'menace non crédible',juge:'Publication sans procès',seul:'Le Post publie seul',nash:'menace non crédible'};
    for(const [key,label]of Object.entries(scenarios)){
      await page.locator(`#presets [data-p="${key}"]`).click();
      assert.ok((await page.locator('#lab-regime').textContent()).includes(label),key);
      assert.equal(await page.locator(`#presets [data-p="${key}"]`).getAttribute('aria-pressed'),'true');
    }
    await page.locator('#presets [data-p="1971"]').click();
    assert.match(await page.locator('#live-full').textContent(),/75,5/);
    await page.locator('#s-p').focus();await page.keyboard.press('End');
    await page.waitForTimeout(150);
    assert.match(await page.locator('#lab-regime').textContent(),/sans procès/i,'a real slider keyboard edit changes equilibrium');
    await page.reload();
    assert.equal(await page.locator('#s-p').inputValue(),'1','scenario survives a reload');
    await page.locator('#presets [data-p="1971"]').click();
    const canvas=page.locator('#map2 canvas');await canvas.scrollIntoViewIfNeeded();await canvas.focus();await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#s-q').inputValue(),'0.31','the map is usable with a keyboard');
    await page.locator('#s-D').evaluate(input=>{input.value=0;input.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.waitForTimeout(150);
    assert.doesNotMatch(await page.locator('#labo').textContent(),/NaN|Infinity/,'zero damage has readable explanations');
    await page.locator('#presets [data-p="1971"]').click();
    const downloadPromise=page.waitForEvent('download');
    await page.locator('#export-scenario').click();
    const download=await downloadPromise;
    const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.equal(exported.parametres.p,.65);assert.ok(Math.abs(exported.resultat.publicationComplete-.755)<1e-9);
    console.log('PASS presets, sliders, live model, persistence, keyboard map and JSON export');

    await page.evaluate(()=>window.Papers.navigate('arbre'));
    assert.equal(await page.locator('#tree-main [data-node]').count(),1,'guided construction starts with the root only');
    for(let count=2;count<=6;count++){
      await page.locator('#build-next').click();
      assert.equal(await page.locator('#tree-main [data-node]').count(),count,'one node is added at a time');
    }
    assert.equal(await page.locator('#build-next').isDisabled(),true,'construction ends with the sixth node');
    assert.equal(await page.locator('#tree-main [data-outcome]').count(),7,'the complete tree shows the seven leaves of the sketch');
    assert.equal(await page.locator('#tree-main [data-pending-node]').count(),0,'nothing is left to develop');
    await page.locator('[data-tree-view="full"]').click();
    await page.locator('#tree-path').selectOption('O1');
    assert.equal(await page.locator('#tree-main .dt-history').count(),4,'the historical path traverses four branches');
    assert.match(await page.locator('#tree-guide-copy').textContent(),/ne signifie pas que c’est un équilibre/);
    await page.locator('[data-tree-view="post"]').click();
    assert.equal(await page.locator('#tree-main [data-node]').count(),2);
    assert.equal(await page.locator('#tree-main [data-outcome]').count(),3,'a subgame retains every continuation, not just a path');
    await page.locator('[data-subgame="x4"]').click();
    assert.equal(await page.locator('#tree-main [data-node="x4"]').count(),1,'the unreached subgame can be isolated too');
    assert.equal(await page.locator('#tree-main [data-outcome="O7"]').count(),1);
    await page.evaluate(()=>window.Papers.navigate('gains'));
    const tex=await page.evaluate(()=>({all:document.querySelectorAll('.tex').length,rendered:document.querySelectorAll('.tex[data-rendered] math').length,failed:document.querySelectorAll('.tex-error').length}));
    assert.ok(tex.all>20,'the payoff equations are written in LaTeX');
    assert.equal(tex.rendered,tex.all,'every LaTeX formula is rendered as MathML, offline');
    assert.equal(tex.failed,0,'no LaTeX formula fails to render');
    assert.match(await page.locator('#latex-source').textContent(),/\\begin\{cases\}/,'the LaTeX source can be copied into the report');
    // The payoff lesson: five steps, certain leaves, court leaves and the zero rule.
    assert.equal(await page.locator('#gains .lesson-step').count(),5,'the payoff lesson has five steps');
    assert.equal(await page.locator('#journal-cases tbody tr').count(),4,'four cases for a newspaper');
    assert.equal(await page.locator('#nixon-cases tbody tr').count(),8,'eight cases for the administration');
    assert.equal(await page.locator('#certain-leaves .leaf-card').count(),3,'three leaves without judges');
    assert.equal(await page.locator('#court-leaves .court-card').count(),4,'four leaves with a trial');
    const leafRow=async id=>(await page.locator('#leaftable tbody tr',{hasText:id+' ·'}).locator('td.v').allTextContents()).join(' | ');
    assert.equal(await leafRow('O5'),'0 | −79,8 | −122','the Times gets zero when it does not publish (O5)');
    assert.equal(await leafRow('O6'),'0 | 120 | −200','the Times gets zero when it does not publish (O6)');
    assert.equal(await leafRow('O1'),'60,6 | 8,82 | −189,7');
    await page.locator('#g-p').evaluate(input=>{input.value=0.5;input.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.waitForFunction(()=>document.querySelector('#g-pv').textContent.trim()==='50 %');
    assert.equal(await leafRow('O1'),'48 | −18,9 | −175','the judges\' probabilities change the payoffs of the three players');
    assert.equal(await leafRow('O6'),'0 | 120 | −200','leaves without judges do not move');
    assert.match(await page.locator('#leaftable-note').textContent(),/vos valeurs/);
    assert.equal(await page.evaluate(()=>document.querySelectorAll('#court-leaves .tex:not([data-rendered])').length),0,'recomputed cards keep rendered equations');
    await page.locator('#g-reset').click();
    assert.equal(await leafRow('O1'),'60,6 | 8,82 | −189,7','the reference probabilities can be restored');
    await page.locator('[data-step-target="gain-step-4"]').click();
    console.log('PASS guided construction, seven leaves, path exploration, subgames and the payoff lesson');
    // Every instruction of the assignment is quoted where it is answered.
    assert.equal(await page.locator('.consigne').count(),7,'seven chapters recall the instruction they answer');
    assert.equal(await page.locator('#consigne-map li').count(),5);
    assert.equal(await page.locator('#home-consignes li').count(),5);
    assert.equal(await page.locator('#answers .answer').count(),5,'one written answer per instruction');
    await page.evaluate(()=>window.Papers.navigate('accueil'));
    await page.locator('#home-consignes a').nth(4).click();
    assert.equal(await page.locator('#gains').isVisible(),true,'the home page leads to the chapter that answers each instruction');
    await page.locator('#gains .consigne-link').click();
    assert.equal(await page.locator('#enonce').isVisible(),true);
    console.log('PASS instructions mapped to chapters and answers');

    await page.evaluate(()=>window.Papers.navigate('rappels'));
    await page.locator('#thr-k').focus();await page.keyboard.press('End');
    assert.match(await page.locator('#thr-msg').textContent(),/49/);
    assert.match(await page.locator('#thr-out').textContent(),/non crédible/);
    await page.evaluate(()=>window.Papers.navigate('resolution'));
    const replaced=[0,1,1,0,1,2];
    for(let i=0;i<8;i++){
      await page.locator('#st-next').click();
      if(i<6){
        assert.equal(await page.locator('#tree-step [data-node]').count(),1,'focus shows only the node currently being resolved');
        assert.equal(await page.locator('#tree-step').getAttribute('data-tree-scope'),'focus');
        assert.equal(await page.locator('#tree-step [data-replaced-node]').count(),replaced[i],'solved continuations are replaced by their values');
      }
    }
    assert.equal(await page.locator('#st-next').isDisabled(),true);
    assert.match(await page.locator('#st-card').textContent(),/45,5/);
    await page.locator('#st-prev').click();assert.match(await page.locator('#st-card').textContent(),/ENPS/);
    await page.locator('#resolution .tree-expand').click();
    assert.equal(await page.locator('#tree-dialog').isVisible(),true);
    await page.locator('#tree-zoom-in').click();assert.equal(await page.locator('#tree-zoom').textContent(),'120 %');
    await page.keyboard.press('Escape');assert.equal(await page.locator('#tree-dialog').isVisible(),false);
    console.log('PASS threat experiment, all induction steps and enlarged tree');

    await page.evaluate(()=>window.Papers.navigate('video'));
    for(let i=0;i<5;i++){
      await page.locator(`[data-story-goto="${i}"]`).click();
      assert.equal(await page.locator(`[data-story-scene="${i}"]`).getAttribute('aria-hidden'),'false');
    }
    await page.locator('[data-story-goto="0"]').click();
    await page.locator('[data-story-play]').click();
    await page.waitForFunction(()=>document.querySelector('[data-story-goto="1"]').getAttribute('aria-current')==='step',{},{timeout:12000});
    assert.equal(await page.locator('[data-story-goto="1"]').getAttribute('aria-current'),'step','the narrative actually advances');
    await page.evaluate(()=>window.Papers.navigate('quiz'));await page.waitForTimeout(150);
    assert.equal(await page.locator('[data-story-play]').getAttribute('aria-pressed'),'false','hidden narratives stop running');
    const answers=[1,1,1,1,1,1,0,1,1];
    for(let i=0;i<answers.length;i++)await page.locator(`.q[data-i="${i}"] button[data-j="${answers[i]}"]`).click();
    assert.match(await page.locator('#score').textContent(),/^9 \/ 9 bonnes/);
    await page.locator('#reset-quiz').click();assert.equal(await page.locator('#quizbox button:disabled').count(),0);
    await page.locator('.q[data-i="0"] button[data-j="0"]').click();
    assert.equal(await page.locator('.q[data-i="0"] .bad').count(),1);
    assert.equal(await page.locator('.q[data-i="0"] .good').count(),1);
    console.log('PASS five animated scenes, playback, hidden-view pause and quiz scoring/reset');

    await page.locator('#theme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.locator('#theme-toggle').click();
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('section.piece:visible').count(),18,'print includes every chapter');
    assert.equal(await page.locator('#accueil').isVisible(),true,'print includes the overview');
    await page.emulateMedia({media:'screen',reducedMotion:'reduce'});
    const animation=await page.locator('.archive-art').evaluate(element=>getComputedStyle(element).animationName);
    assert.equal(animation,'none','motion preferences are respected');
    await page.evaluate(()=>window.Papers.navigate('accueil'));
    assert.equal(await page.locator('#chapter-nav').isVisible(),false);
    assert.deepEqual(external,[],'the artifact uses no remote fonts, media, scripts or styles');
    assert.deepEqual(errors,[],'no browser console or script errors');
    console.log('PASS theme persistence, complete print layout, reduced motion and zero external dependencies');
    console.log('ALL BROWSER CHECKS PASSED');
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
