import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

test('mobile menu opens, follows a section, closes and restores focus on Escape', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const menu = page.getByRole('button', {name:'Menu', exact:false});
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded','true');
  await page.locator('#main-nav').getByRole('link',{name:'Recipes',exact:true}).click();
  await expect(page).toHaveURL(/#recipes$/);
  await expect(menu).toHaveAttribute('aria-expanded','false');
  await menu.click();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded','false');
  await expect(menu).toBeFocused();
});

test('discount copy button writes the exact code and gives accessible feedback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/');
  await page.getByRole('button',{name:'Copy discount code DADDAGGER'}).click();
  await expect(page.getByRole('status')).toHaveText('Code copied: DADDAGGER');
  await expect(page.getByRole('button',{name:'Copy discount code DADDAGGER'})).toHaveText('Copied!');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('DADDAGGER');
  await expect(page.getByRole('button',{name:'Copy discount code DADDAGGER'})).toHaveText('Copy code',{timeout:3000});
});

test('blocked clipboard offers honest manual-copy instructions', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('Not allowed');}}}));
  await page.goto('/');
  await page.getByRole('button',{name:'Copy discount code DADDAGGER'}).click();
  await expect(page.getByRole('status')).toHaveText('Select and copy DADDAGGER above.');
  await expect(page.getByRole('button',{name:'Copy discount code DADDAGGER'})).toHaveText('Copy code');
});

test('homepage copy animates once and retains heading semantics, links and slider', async ({page}) => {
  await page.goto('/');
  const hero=page.getByRole('heading',{level:1,name:'Food, fitness & real life.'});
  await expect(hero).toBeVisible();
  await expect(hero).toHaveClass(/is-visible/);
  expect(await hero.locator('.reveal-line').first().evaluate(el=>getComputedStyle(el).animationDuration)).toBe('0.9s');
  await expect(page.getByRole('slider',{name:"Compare James's before and after photos"})).toBeVisible();
  const about=page.getByRole('heading',{level:2,name:"Hey, I'm James."});
  await about.scrollIntoViewIfNeeded();
  await expect(about).toHaveClass(/is-visible/);
  await expect(about.locator('.reveal-word')).toHaveCount(3);
  const cards=page.locator('.recipe-card');
  await cards.first().scrollIntoViewIfNeeded();
  await expect(cards.first()).toHaveClass(/is-visible/);
  await page.waitForTimeout(750);
  expect(await cards.first().evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
  for (const selector of ['#recipes-title','#sauce-title','.sauce-section .eyebrow','.affiliate-intro .eyebrow']) {
    const el=page.locator(selector);
    await el.scrollIntoViewIfNeeded();
    await expect(el).toHaveClass(/is-visible/);
  }
  await expect(page.locator('.section-number')).toHaveText(['01','02','03','04']);
  const link=cards.first().locator('h3 a');
  await link.hover();
  await expect.poll(()=>link.evaluate(el=>getComputedStyle(el).backgroundSize)).toBe('100% 1px');
  const footer=page.locator('.footer-top a[href="/privacy/"]');
  await footer.focus();
  await expect.poll(()=>footer.evaluate(el=>getComputedStyle(el).backgroundSize)).toBe('100% 1px');
});

test('reduced motion, missing observer and no JavaScript keep copy visible',async ({browser})=>{
  for(const options of [{reducedMotion:'reduce'},{javaScriptEnabled:false}]){
    const context=await browser.newContext({...options,baseURL:process.env.SITE_URL || 'http://127.0.0.1:4178'});
    const page=await context.newPage();
    await page.goto('/');
    for(const selector of ['#hero-title','#about-title','#recipes-title','#sauce-title','.recipe-card']){
      const el=page.locator(selector).first();
      expect(await el.evaluate(node=>getComputedStyle(node).opacity)).toBe('1');
      await expect(el).not.toHaveClass(/motion-ready/);
    }
    await context.close();
  }
  const context=await browser.newContext({baseURL:process.env.SITE_URL || 'http://127.0.0.1:4178'});
  await context.addInitScript(()=>{delete window.IntersectionObserver;});
  const page=await context.newPage();
  await page.goto('/');
  await expect(page.locator('.recipe-card').first()).not.toHaveClass(/motion-ready/);
  await context.close();
});

test('desktop uses visible navigation without a mobile menu button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Menu',exact:false})).toBeHidden();
  await expect(page.locator('#main-nav')).toBeVisible();
});

test('recipe checkboxes and print action work, with clean print styling', async ({ page }) => {
  await page.goto('/recipes/chicken-and-potatoes/');
  await page.getByRole('checkbox').first().check();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await page.evaluate(() => {window.print=()=>{window.__printed=true;};});
  await page.getByRole('button',{name:'Print this page'}).click();
  expect(await page.evaluate(()=>window.__printed)).toBe(true);
  await page.emulateMedia({media:'print'});
  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.locator('#ingredients')).toBeVisible();
  for (const selector of ['.ingredients label','.method-list li','.recipe-note p','.recipe-safety p','.recipe-credit','.recipe-deck','.recipe-meta']) {
    const points = await page.locator(selector).first().evaluate(el => parseFloat(getComputedStyle(el).fontSize) * 0.75);
    expect(points,`print text size for ${selector}`).toBeGreaterThanOrEqual(12);
  }
  expect(await page.locator('.recipe-safety').evaluate(el=>getComputedStyle(el).breakInside)).toBe('avoid');
  await mkdir('verification',{recursive:true});
  await page.pdf({path:'verification/recipe-print.pdf',format:'Letter',printBackground:true,margin:{top:'14mm',bottom:'14mm',left:'14mm',right:'14mm'}});
});

test('new burrito card opens its recipe with a photo and usable ingredient list', async ({ page }) => {
  await page.goto('/');
  await page.locator('.recipe-card').filter({hasText:'Cheesy jalapeño ranch chicken burritos'}).getByRole('link',{name:'Read the recipe'}).click();
  await expect(page).toHaveURL(/\/recipes\/cheesy-jalapeno-ranch-chicken-burritos\/$/);
  await expect(page.getByRole('heading',{name:'Cheesy jalapeño ranch chicken burritos'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'For the sauce'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'For the burritos'})).toBeVisible();
  await page.getByRole('checkbox').first().check();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await expect(page.locator('.recipe-cover')).toHaveJSProperty('naturalWidth',1600);
});

test('a collection card opens a measured recipe with untested and stock-photo labels', async ({ page }) => {
  await page.goto('/');
  const card=page.locator('.collection-grid .recipe-card').filter({hasText:'Crispy chicken with creamy dill pickle sauce'});
  await expect(card.locator('.image-label')).toHaveCount(0);
  await expect(page.locator('.collection-intro')).toHaveCount(0);
  await expect(card.locator('.text-link .arrow-icon')).toBeVisible();
  await card.getByRole('link',{name:'Read the recipe'}).click();
  await expect(page).toHaveURL(/\/recipes\/crispy-chicken-dill-pickle-sauce\/$/);
  await expect(page.getByRole('heading',{name:'For the chicken'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'For the dipping sauce'})).toBeVisible();
  await expect(page.locator('.recipe-note')).toContainText('not a dish James has tested');
  await page.getByRole('checkbox').first().check();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await expect(page.locator('.recipe-cover')).toHaveJSProperty('naturalWidth',1200);
});

test('recipe notebook strip is blank between two separator lines', async ({page}) => {
  await page.goto('/');
  const separator=page.locator('.notebook-separator');
  await expect(separator).toHaveCount(1);
  await expect(separator).toBeVisible();
  expect(await separator.evaluate(el=>({text:el.textContent.trim(),children:el.children.length,top:getComputedStyle(el).borderTopWidth,bottom:getComputedStyle(el).borderBottomWidth}))).toEqual({text:'',children:0,top:'1px',bottom:'1px'});
  await expect(page.locator('.collection-grid .recipe-card')).toHaveCount(5);
});

test('hero entrance starts at 80%, reaches 50% once in view, and stops immediately on interaction', async ({page}) => {
  await page.addInitScript(() => {
    window.IntersectionObserver=class {
      constructor(callback){this.callback=callback;}
      observe(target){this.target=target;if(target.matches('[data-comparison]'))window.testComparisonObserver=this;}
      unobserve(){}
      disconnect(){}
      fire(){this.callback([{isIntersecting:true,target:this.target}]);}
    };
  });
  await page.goto('/');
  const frame=page.locator('[data-comparison]');
  const slider=page.getByRole('slider');
  await expect(slider).toHaveAttribute('aria-valuenow','80');
  await page.evaluate(()=>window.testComparisonObserver.fire());
  await page.waitForTimeout(750);
  const middle=Number(await slider.getAttribute('aria-valuenow'));
  expect(middle).toBeGreaterThan(50);
  expect(middle).toBeLessThan(80);
  await expect(slider).toHaveAttribute('aria-valuenow','50',{timeout:3000});
  await page.evaluate(()=>window.testComparisonObserver.fire());
  await expect(slider).toHaveAttribute('aria-valuenow','50');
  await page.reload();
  await expect(slider).toHaveAttribute('aria-valuenow','80');
  await page.evaluate(()=>window.testComparisonObserver.fire());
  await page.waitForTimeout(300);
  await slider.press('End');
  await expect(slider).toHaveAttribute('aria-valuenow','100');
  await page.waitForTimeout(1500);
  await expect(slider).toHaveAttribute('aria-valuenow','100');
  await expect(frame).toHaveClass(/is-interacted/);
});

test('hero comparison animates once, mouse drags without moving either photo, and keyboard works', async ({page}) => {
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const frame=page.locator('[data-comparison]');
  const slider=page.getByRole('slider',{name:"Compare James's before and after photos"});
  await expect(slider).toBeVisible();
  await expect.poll(async()=>Number(await frame.evaluate(el=>parseFloat(el.style.getPropertyValue('--reveal'))))).toBeGreaterThan(49);
  await expect(slider).toHaveAttribute('aria-valuenow','50',{timeout:4500});
  const fixed=await frame.locator('.comparison-photo img').evaluateAll(images=>images.map(img=>img.getBoundingClientRect().toJSON()));
  const box=await frame.boundingBox();
  const y=box.y+box.height/2;
  await page.mouse.move(box.x+box.width/2,y);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.2,y,{steps:5});
  await page.mouse.up();
  await expect(slider).toHaveAttribute('aria-valuenow','20');
  await page.mouse.move(box.x+box.width*.8,y);
  await page.mouse.down();
  await page.mouse.up();
  await expect(slider).toHaveAttribute('aria-valuenow','80');
  expect(await frame.locator('.comparison-photo img').evaluateAll(images=>images.map(img=>img.getBoundingClientRect().toJSON()))).toEqual(fixed);
  await slider.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(slider).toHaveAttribute('aria-valuenow','75');
  await page.keyboard.press('Home');
  await expect(slider).toHaveAttribute('aria-valuenow','0');
  await page.keyboard.press('End');
  await expect(slider).toHaveAttribute('aria-valuenow','100');
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuenow','100');
  await page.waitForTimeout(1700);
  await expect(slider).toHaveAttribute('aria-valuenow','100');
  await expect(frame).toHaveClass(/is-interacted/);
});

test('hero reveal responds to finger swipes and stays within the mobile viewport', async ({browser}) => {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,baseURL:process.env.SITE_URL || 'http://127.0.0.1:4178'});
  const page=await context.newPage();
  await page.goto('/');
  const frame=page.locator('[data-comparison]');
  await frame.scrollIntoViewIfNeeded();
  const box=await frame.boundingBox();
  const client=await context.newCDPSession(page);
  const start={x:box.x+box.width*.8,y:box.y+box.height/2};
  const end={x:box.x+box.width*.2,y:start.y};
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[end]});
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow','20');
  expect(await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}))).toEqual({viewport:390,scroll:390});
  await context.close();
});

test('reduced motion and no JavaScript keep a usable static split', async ({browser}) => {
  const context=await browser.newContext({reducedMotion:'reduce',javaScriptEnabled:false,baseURL:process.env.SITE_URL || 'http://127.0.0.1:4178'});
  const page=await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-comparison]')).toHaveAttribute('style','--reveal:50%');
  await expect(page.locator('.comparison-photo img')).toHaveCount(2);
  await expect(page.getByRole('slider')).toHaveCount(0);
  await context.close();
  const motion=await browser.newContext({reducedMotion:'reduce',baseURL:process.env.SITE_URL || 'http://127.0.0.1:4178'});
  const reduced=await motion.newPage();
  await reduced.goto('/');
  await expect(reduced.getByRole('slider')).toHaveAttribute('aria-valuenow','50');
  await reduced.waitForTimeout(1750);
  await expect(reduced.getByRole('slider')).toHaveAttribute('aria-valuenow','50');
  await motion.close();
});

test('header dagger moves continuously, with a glint and a reduced-motion fallback', async ({page}) => {
  await page.goto('/');
  const brand=page.getByRole('link',{name:'Dad With The Dagger home'});
  const mark=brand.locator('.brand-mark');
  const icon=mark.locator('img');
  await expect(icon).toHaveAttribute('src','/assets/dagger-mark.svg');
  await expect(brand).toHaveAttribute('href','/');
  const motion=await icon.evaluate(el=>({name:getComputedStyle(el).animationName,count:getComputedStyle(el).animationIterationCount,glint:getComputedStyle(el.parentElement,'::after').animationName}));
  expect(motion).toEqual({name:'dagger-hover',count:'infinite',glint:'dagger-shine'});
  const first=await icon.evaluate(el=>getComputedStyle(el).transform);
  await page.waitForTimeout(500);
  expect(await icon.evaluate(el=>getComputedStyle(el).transform)).not.toBe(first);
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await icon.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  expect(await mark.evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('none');
});

test('supplied arrows animate on focus or hover, and stop for reduced motion', async ({ page }) => {
  await page.goto('/');
  const link=page.locator('.collection-grid .recipe-card .text-link').first();
  const icon=link.locator('.arrow-icon');
  await expect(icon).toBeVisible();
  expect(await icon.evaluate(el=>getComputedStyle(el).maskImage)).toContain('flaticon-arrows-13554816.png');
  await link.hover();
  expect(await icon.evaluate(el=>getComputedStyle(el).animationName)).toBe('arrow-nudge');
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await icon.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});

test('without JavaScript, navigation, recipes and affiliate link remain usable', async ({ browser }) => {
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844},baseURL:process.env.SITE_URL || 'http://127.0.0.1:4178'});
  const page=await context.newPage();
  await page.goto('/');
  await expect(page.locator('#main-nav')).toBeVisible();
  await expect(page.getByRole('link',{name:'Visit HTLT'})).toHaveAttribute('href','https://www.htltsupps.com?sca_ref=10886340.d8RxKeL1BQC');
  await page.locator('a[href="/recipes/chicken-and-potatoes/"]').filter({hasText:'Read the recipe'}).click();
  await expect(page.locator('#ingredients')).toBeVisible();
  await context.close();
});

for (const width of [320,390,768,1440]) {
  test(`all pages at ${width}px: no overflow, missing assets, console errors or axe violations`,async ({page})=>{
    await page.setViewportSize({width,height:900});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    const paths=['/','/recipes/chipotle-cheese-sauce/','/recipes/chicken-and-potatoes/','/recipes/smoky-chipotle-beef-pasta/','/recipes/cheesy-jalapeno-ranch-chicken-burritos/','/recipes/bbq-jalapeno-chicken/','/recipes/cajun-cream-chicken/','/recipes/creamy-salsa-verde-chicken/','/recipes/creamy-pizza-chicken/','/recipes/crispy-chicken-dill-pickle-sauce/','/privacy/','/404.html'];
    for(const path of paths){
      const response=await page.goto(path);
      expect(response.status()).toBe(200); // Direct requests to the existing 404.html file succeed; unknown routes are tested separately.
      await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
      await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.evaluate(()=>document.fonts.ready);
      const size=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
      expect(size.viewport).toBe(width);
      expect(size.document).toBeLessThanOrEqual(width);
      expect(size.body).toBeLessThanOrEqual(width);
      const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      expect(results.violations,`${path} accessibility at ${width}px`).toEqual([]);
      if(path==='/' && [390,1440].includes(width)){
        await mkdir('verification',{recursive:true});
        await page.screenshot({path:`verification/home-${width}.png`,fullPage:true});
      }
    }
    expect(errors).toEqual([]);
  });
}
