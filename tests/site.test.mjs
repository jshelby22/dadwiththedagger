import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { load } from 'cheerio';
const home = new URL('../site/index.html', import.meta.url);

test('all published recipe pages have ingredients, real navigation and no made-up nutrition', () => {
  for (const slug of ['chipotle-cheese-sauce','chicken-and-potatoes','smoky-chipotle-beef-pasta']) {
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
