import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { load } from 'cheerio';
const home = new URL('../site/index.html', import.meta.url);

test('all published recipe pages have ingredients, real navigation and no made-up nutrition', () => {
  for (const slug of ['chipotle-cheese-sauce','chicken-and-potatoes','smoky-chipotle-beef-pasta','cheesy-jalapeno-ranch-chicken-burritos','bbq-jalapeno-chicken','cajun-cream-chicken','creamy-salsa-verde-chicken','creamy-pizza-chicken','crispy-chicken-dill-pickle-sauce']) {
    const path = new URL(`../site/recipes/${slug}/index.html`, import.meta.url);
    assert.ok(existsSync(path), `Recipe page missing: ${slug}`);
    const html = readFileSync(path, 'utf8');
    assert.match(html, /id="ingredients"/);
    assert.match(html, /href="\/#recipes"/);
    assert.match(html, /type="checkbox"/);
    assert.doesNotMatch(html, /aggregateRating|ratingValue|calories|proteinContent/);
  }
});

test('home has the four requested sections and the exact disclosed affiliate link', () => {
  assert.ok(existsSync(home), 'The public homepage must exist');
  const html = readFileSync(home, 'utf8');
  for (const id of ['about', 'recipes', 'sauce', 'htlt']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.ok(html.includes('https://www.htltsupps.com?sca_ref=10886340.d8RxKeL1BQC'));
  assert.match(html, /DADDAGGER/);
  assert.match(html, /15%/);
  assert.match(html, /earn a commission/i);
  assert.match(html, /rel="[^"]*sponsored/);
  assert.doesNotMatch(html, /add to cart|buy now|testimonials/i);
  assert.doesNotMatch(html, /(?:action|href)="[^"]*\/(?:cart|checkout)(?:[/?"])/i);
});

test('the hero uses James’s supplied two-panel photo without replacing the source', () => {
  const $ = load(readFileSync(home, 'utf8'));
  const hero = $('.hero-portrait img');
  assert.equal(hero.length, 1);
  assert.equal(hero.attr('src'), '/assets/james-progress-hero.webp');
  assert.match(hero.attr('alt'), /Two side-by-side photos of James/);
  assert.ok(existsSync(new URL('../site/assets/james-progress-hero.webp', import.meta.url)));
});

test('burrito recipe has the supplied photos, six servings and grouped ingredients without unverified macros', () => {
  const $ = load(readFileSync(new URL('../site/recipes/cheesy-jalapeno-ranch-chicken-burritos/index.html', import.meta.url), 'utf8'));
  assert.equal($('#main h1').text(), 'Cheesy jalapeño ranch chicken burritos');
  assert.equal($('.recipe-cover').attr('src'), '/assets/jalapeno-ranch-chicken-burritos.webp');
  assert.ok(existsSync(new URL('../site/assets/jalapeno-ranch-chicken-burritos.webp', import.meta.url)));
  assert.match($('.recipe-meta').text(), /6 burritos/);
  assert.deepEqual($('.ingredient-group h3').map((_,el)=>$(el).text()).get(), ['For the sauce','For the burritos']);
  assert.equal($('.ingredients input[type="checkbox"]').length, 9);
  assert.match($('#ingredients').text(), /2 lb Costco Chargrilled Chipotle Chicken/);
  assert.match($('.recipe-note').text(), /can sizes/);
  assert.doesNotMatch($('#main').text(), /416 kcal|42g|estimated macros per burrito/i);
  const homePage = load(readFileSync(home, 'utf8'));
  assert.equal(homePage('.recipe-grid a[href="/recipes/cheesy-jalapeno-ranch-chicken-burritos/"]').length, 3);
});

test('five collection recipes preserve their own ingredients, methods, photo caveats and untested status', () => {
  const recipes = JSON.parse(readFileSync(new URL('../content/recipes.json', import.meta.url), 'utf8'));
  const expected = [
    ['bbq-jalapeno-chicken',11,'sugar-free BBQ sauce'],
    ['cajun-cream-chicken',11,'Cajun seasoning'],
    ['creamy-salsa-verde-chicken',13,'salsa verde'],
    ['creamy-pizza-chicken',12,'turkey pepperoni'],
    ['crispy-chicken-dill-pickle-sauce',15,'pickle brine'],
  ];
  const homePage = load(readFileSync(home,'utf8'));
  assert.equal(homePage('.collection-grid .recipe-card').length,5);
  assert.equal(homePage('.notebook-link').length,0);
  assert.equal(homePage('.notebook-separator').length,1);
  assert.equal(homePage('.notebook-separator').text(),'');
  assert.equal(homePage('a[href="/recipes/smoky-chipotle-beef-pasta/"]').length,0);
  assert.equal(homePage('.collection-intro').length,0);
  assert.equal(homePage('.collection-grid .recipe-image .image-label').length,0);
  assert.match(homePage('.section-heading').text(),/not yet kitchen-tested/);
  assert.equal(homePage('.icon-credit').attr('href'),'https://www.flaticon.com/free-icon/arrows_13554816');
  assert.match(homePage('.icon-credit').text(),/designed by Atif Arshad from Flaticon/);
  assert.ok(existsSync(new URL('../site/assets/flaticon-arrows-13554816.png',import.meta.url)));
  const css=readFileSync(new URL('../site/assets/styles.css',import.meta.url),'utf8');
  assert.match(css,/flaticon-arrows-13554816\.png/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  for(const [slug,count,ingredient] of expected){
    const recipe = recipes.find(item=>item.slug===slug);
    assert.ok(recipe,slug);
    assert.equal(recipe.yield,'4 servings');
    assert.equal(recipe.steps.length,6);
    const $ = load(readFileSync(new URL(`../site/recipes/${slug}/index.html`,import.meta.url),'utf8'));
    assert.equal($('.ingredients input[type="checkbox"]').length,count);
    assert.equal($('.method-list li').length,6);
    assert.ok($('#ingredients').text().includes(ingredient));
    assert.match($('.recipe-meta').text(),/From the Five Creamy Chicken Recipes collection/);
    assert.match($('.recipe-note').text(),/not a dish James has tested/);
    assert.match($('.recipe-caption').text(),/not this|not the/);
    assert.doesNotMatch($('.recipe-note').text(),/\b(?:349|354|364|409|407) kcal\b/);
    assert.equal($('.recipe-cover').attr('src'),`/assets/${recipe.image}`);
    assert.ok(existsSync(new URL(`../site/assets/${recipe.image}`,import.meta.url)));
    assert.equal(homePage(`.collection-grid .recipe-card a[href="/recipes/${slug}/"]`).length,3);
  }
  assert.deepEqual(load(readFileSync(new URL('../site/recipes/crispy-chicken-dill-pickle-sauce/index.html',import.meta.url),'utf8'))('.ingredient-group h3').map((_,el)=>el.children[0].data).get(),['For the chicken','For the dipping sauce']);
});

test('HTLT cards preserve all four supplied affiliate URLs and have matching local images', () => {
  const $ = load(readFileSync(home, 'utf8'));
  const expected = [
    ['https://www.htltsupps.com/products/turk-builder?variant=45645992329429&sca_ref=10886340.d8RxKeL1BQC','htlt-turk-builder-max.png'],
    ['https://www.htltsupps.com/products/sleep-aid?sca_ref=10886340.d8RxKeL1BQC','htlt-delta-sleep.jpg'],
    ['https://www.htltsupps.com/products/cicobar-protein-bar-12-pack?variant=51296724811989&sca_ref=10886340.d8RxKeL1BQC','htlt-cico-bar-smores.jpg'],
    ['https://www.htltsupps.com/products/ferula-max?sca_ref=10886340.d8RxKeL1BQC','htlt-ferula-max.png'],
  ];
  const cards = $('#htlt .htlt-product');
  assert.equal(cards.length, expected.length);
  cards.each((index, card) => {
    const anchor = $(card).find('a');
    const image = anchor.find('img');
    assert.equal(anchor.attr('href'), expected[index][0]);
    assert.match(anchor.attr('rel'), /sponsored/);
    assert.ok(anchor.attr('aria-label'));
    assert.equal(image.attr('src'), `/assets/${expected[index][1]}`);
    assert.ok(image.attr('alt'));
    assert.ok(existsSync(new URL(`../site/assets/${expected[index][1]}`, import.meta.url)));
  });
  assert.match($('#htlt').text(), /I use Turk Builder Max/);
  assert.match($('#htlt .htlt-products-heading').text(), /earn a commission/);
});
