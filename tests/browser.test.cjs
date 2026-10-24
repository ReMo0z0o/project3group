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
    assert.equal(ids.length,17,'all the original educational chapters remain available');
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
    const scenarios={1971:'Deux procès',peur:'Times seulement',sanction:'Times seulement',renonce:'Aucune publication',cher:'Publication sans procès',noncred:'Publication sans procès',cour:'Publication sans procès',juge:'Publication sans procès'};
    for(const [key,label]of Object.entries(scenarios)){
      await page.locator(`#presets [data-p="${key}"]`).click();
      assert.ok((await page.locator('#lab-regime').textContent()).includes(label),key);
      assert.equal(await page.locator(`#presets [data-p="${key}"]`).getAttribute('aria-pressed'),'true');
    }
    await page.locator('#presets [data-p="1971"]').click();
    assert.match(await page.locator('#live-full').textContent(),/75,5/);
    await page.locator('#s-p').focus();await page.keyboard.press('End');
    await page.waitForTimeout(150);
    assert.match(await page.locator('#lab-regime').textContent(),/sans procès/,'a real slider keyboard edit changes equilibrium');
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

    await page.evaluate(()=>window.Papers.navigate('rappels'));
    await page.locator('#thr-k').focus();await page.keyboard.press('End');
    assert.match(await page.locator('#thr-msg').textContent(),/49/);
    assert.match(await page.locator('#thr-out').textContent(),/non crédible/);
    await page.evaluate(()=>window.Papers.navigate('resolution'));
    for(let i=0;i<8;i++)await page.locator('#st-next').click();
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
    await page.locator('[data-story-play]').click();await page.waitForTimeout(6250);
    assert.equal(await page.locator('[data-story-goto="1"]').getAttribute('aria-current'),'step','the narrative actually advances');
    await page.evaluate(()=>window.Papers.navigate('quiz'));await page.waitForTimeout(150);
    assert.equal(await page.locator('[data-story-play]').getAttribute('aria-pressed'),'false','hidden narratives stop running');
    const answers=[1,2,1,1,0,1,1];
    for(let i=0;i<answers.length;i++)await page.locator(`.q[data-i="${i}"] button[data-j="${answers[i]}"]`).click();
    assert.match(await page.locator('#score').textContent(),/^7 \/ 7 bonnes/);
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
    assert.equal(await page.locator('section.piece:visible').count(),17,'print includes every chapter');
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
