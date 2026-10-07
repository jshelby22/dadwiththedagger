import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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
