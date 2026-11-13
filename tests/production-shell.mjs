import { readFileSync, statSync } from "node:fs";
import { strict as assert } from "node:assert";
const read = path => readFileSync(path,"utf8");
const html=read("site/index.html");
const css=read("site/styles.css");
const js=read("site/app.js");
const art=statSync("site/artwork/saraceni-paradise-v9.jpg");
for(const id of ["home-view","module-view","civil-week","about-button","about-dialog","back-button","module-title"]) {
  assert.match(html,new RegExp('id="'+id+'"'),"Missing required target "+id);
}
for(const route of ["home","pray","formation","atlas","calendar","mass"]) {
  assert.match(html,new RegExp('data-route="'+route+'"'),"Missing route "+route);
}
assert.equal((html.match(/<nav class="tabbar"/g)||[]).length,1,"Exactly one main tabbar");
assert.equal((html.match(/class="tab(?: active)?"/g)||[]).length,4,"Exactly four Home V9 tabs");
assert.match(html,/<div class="home-hero"/,"V9 painting hero missing");
assert.match(html,/artwork\/saraceni-paradise-v9\.jpg/,"Locally hosted artwork absent");
assert.ok(art.size>30_000,"Painting image unexpectedly empty");
assert.match(css, /\.home-hero\{/,"V9 hero CSS missing");
assert.match(css, /\.hero-dots button\.active/,"V9 pager CSS missing");
assert.match(js, /function showHero\(/,"V9 carousel not interactive");
assert.match(js, /const MODULES = Object\.freeze/,"Module transfer boundary removed");
assert.doesNotMatch(html,/\bvercel\b/i,"Vercel reference must not enter site");
assert.doesNotMatch(html,/1962 Roman liturgical calendar.{0,10}loaded/i);
console.log("Production shell contracts passed. Painting bytes:",art.size);
