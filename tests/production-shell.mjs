import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { strict as assert } from "node:assert";
const read = path => readFileSync(path,"utf8");
const html=read("site/index.html");
const css=read("site/styles.css");
const js=read("site/app.js");
const art=statSync("site/artwork/saraceni-paradise-v9.jpg");
const prayerImages = [
  "site/artwork/champaigne-annunciation-home-v9.jpg",
  "site/artwork/ingres-adoration-home-v9.jpg"
];
for (const file of prayerImages) {
  const bytes=readFileSync(file);
  assert.ok(bytes.length>25_000,"Painting unexpectedly empty: "+file);
  assert.equal(bytes[0],0xff,"Painting is not a JPEG: "+file);
  assert.equal(bytes[1],0xd8,"Painting is not a JPEG: "+file);
  assert.match(html,new RegExp(file.replace("site/","").replaceAll(".","\\.")),"Painting is not in Home: "+file);
}
for(const id of ["home-view","module-view","civil-week","about-button","about-dialog","back-button","module-title"]) {
  assert.match(html,new RegExp('id="'+id+'"'),"Missing required target "+id);
}
for(const route of ["home","pray","formation","atlas","calendar","mass"]) {
  assert.match(html,new RegExp('data-route="'+route+'"'),"Missing route "+route);
}
assert.equal((html.match(/<nav class="tabbar"/g)||[]).length,1,"Exactly one main tabbar");
assert.equal((html.match(/class="tab(?: active)?"/g)||[]).length,4,"Exactly four Home V9 tabs");
assert.match(html,/<div class="home-hero"/,"V9 painting hero missing");
assert.doesNotMatch(html,/class="hero-painting"[^>]*saraceni-paradise-v9/,"Fixed study painting must not masquerade as today’s liturgical artwork");
assert.ok(art.size>30_000,"Painting image unexpectedly empty");
assert.match(css, /\.home-hero\{/,"V9 hero CSS missing");
assert.match(css, /\.hero-dots button\.active/,"V9 pager CSS missing");
assert.match(js, /function showHero\(/,"V9 carousel not interactive");
assert.match(js, /const MODULES = Object\.freeze/,"Module transfer boundary removed");
assert.doesNotMatch(html,/\bvercel\b/i,"Vercel reference must not enter site");
assert.doesNotMatch(html,/1962 Roman liturgical calendar.{0,10}loaded/i);
assert.match(html,/id="prayer-art-expand"/,"Artwork viewer trigger absent");
assert.match(html,/id="prayer-art-dialog"/,"Artwork viewer dialog absent");
assert.match(js,/prayer-art-dialog/,"Artwork viewer trigger not wired");
assert.match(html,/PRAYER ENTRANCE · PREVIEW/,"Prayer engine preview disclosure missing");
assert.match(html,/Not yet transferred|NOT YET TRANSFERRED/i,"Untransferred modules must be disclosed");
assert.match(css,/\.prayer-door-v9 \.hour-painting/,"Source-guided V9 prayer painting CSS absent");
assert.match(css,/\.home-pad \.prayer-door-v9\{display:block;width:100%/,"V9 prayer panel must override the legacy flex display");
assert.match(css,/max-width:340px/,"320px compact layout absent");
const assets=JSON.parse(read("design/approved-visual-asset-import.v1.json"));
assert.equal(assets.assets.length,14,"Expected exactly fourteen approved font/icon assets");
for(const asset of assets.assets){
  const bytes=readFileSync(asset.destination);
  assert.equal(bytes.length,asset.size_bytes,"Asset length mismatch: "+asset.destination);
  const hash=createHash("sha1").update(Buffer.from("blob "+bytes.length+"\\0")).update(bytes).digest("hex");
  assert.equal(hash,asset.git_blob_sha,"Source blob mismatch: "+asset.destination);
}
assert.match(html,/assets\/brand\/typography\.css/,"Original font loader is not linked");
assert.doesNotMatch(html,/fonts\.googleapis\.com/,"External fallback must not override source typography");
for(const icon of ["icon-home","icon-prayer","icon-book","icon-atlas","icon-calendar","icon-settings"]){
  assert.match(html,new RegExp(icon),"Original integrated icon missing: "+icon);
}
assert.match(html,/id="home-current-date"/,"Date-led Home slot absent");
assert.match(html,/DAILY OBSERVANCE · PREVIEW/,"Hero observance panel absent");
assert.match(css,/Integrated Home source hierarchy/,"Latest integrated Home layout rules missing");
console.log("Production shell contracts passed; paintings:",[art.size,...prayerImages.map(x=>statSync(x).size)]);
