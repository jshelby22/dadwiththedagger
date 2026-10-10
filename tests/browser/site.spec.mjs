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
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('DADDAGGER');
});

test('blocked clipboard offers honest manual-copy instructions', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('Not allowed');}}}));
  await page.goto('/');
  await page.getByRole('button',{name:'Copy discount code DADDAGGER'}).click();
  await expect(page.getByRole('status')).toHaveText('Select and copy DADDAGGER above.');
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
