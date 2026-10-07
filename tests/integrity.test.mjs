import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { load } from 'cheerio';
const root=resolve(import.meta.dirname,'../site');
function files(dir){return readdirSync(dir).flatMap(name=>{const path=join(dir,name);return statSync(path).isDirectory()?files(path):[path];});}

test('every generated page has valid local links/assets, headings, metadata and unique IDs',()=>{
 const pages=files(root).filter(f=>f.endsWith('.html'));
 assert.equal(pages.length,6);
 for(const page of pages){
  const $=load(readFileSync(page,'utf8'));
  assert.equal($('h1').length,1,page);
  assert.equal($('main').length,1,page);
  assert.equal($('html').attr('lang'),'en');
  assert.ok($('title').text().length>10);
  assert.ok($('meta[name="description"]').attr('content'));
  assert.ok($('link[rel="canonical"]').attr('href').startsWith('https://dadwiththedagger.com/'));
  const ids=$('[id]').map((_,el)=>$(el).attr('id')).get();
  assert.equal(new Set(ids).size,ids.length,`Duplicate ID in ${page}`);
  $('script[type="application/ld+json"]').each((_,el)=>assert.doesNotThrow(()=>JSON.parse($(el).html())));
  $('img').each((_,el)=>assert.notEqual($(el).attr('alt'),undefined));
  $('[href],[src]').each((_,el)=>{
    const link=$(el).attr('href')||$(el).attr('src');
    if(!link||/^(https?:|mailto:|data:)/.test(link))return;
    const [path,hash]=link.split('#');
    let target=path?(path.startsWith('/')?join(root,path):resolve(dirname(page),path)):page;
    if(existsSync(target)&&statSync(target).isDirectory())target=join(target,'index.html');
    assert.ok(existsSync(target),`${relative(root,page)} -> missing ${link}`);
    if(hash&&target.endsWith('.html')){
      const targetPage=load(readFileSync(target,'utf8'));
      assert.equal(targetPage(`[id="${hash}"]`).length,1,`${page} -> missing anchor ${link}`);
    }
  });
  $('a[target="_blank"]').each((_,el)=>assert.ok($(el).attr('rel')?.includes('noopener')));
 }
});

test('CSS assets exist and the production site does not load remote scripts or embeds',()=>{
 const css=readFileSync(join(root,'assets/styles.css'),'utf8');
 for(const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))assert.ok(existsSync(join(root,match[1])),match[1]);
 for(const page of files(root).filter(f=>f.endsWith('.html'))){
  const $=load(readFileSync(page,'utf8'));
  assert.equal($('iframe,form').length,0);
  $('script[src]').each((_,el)=>assert.ok($(el).attr('src').startsWith('/assets/')));
 }
 assert.equal(readFileSync(join(root,'CNAME'),'utf8'),'dadwiththedagger.com\n');
 assert.ok(readFileSync(join(root,'robots.txt'),'utf8').includes('https://dadwiththedagger.com/sitemap.xml'));
});
