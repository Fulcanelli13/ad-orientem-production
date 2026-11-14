import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { prepareApprovedSites } from "../site/explore/approved-site-boundary.mjs";
const html=readFileSync("site/explore/index.html","utf8");
const css=readFileSync("site/explore/explore.css","utf8");
const script=readFileSync("site/explore/explore.mjs","utf8");
const data=JSON.parse(readFileSync("site/explore/approved-sites.json","utf8"));

assert.equal(data.schema,"ao.explore.approved-sites.v1");
assert.deepEqual(data.sites,[],"No prototype sample records may enter the release candidate");
for(const id of ["map","map-fallback","open-search","search-panel","search-input","search-results",
  "tab-tlm","tab-sac","sheet","sheet-handle","toggle-sheet","ways","place-panel",
  "results","near","zoom-in","zoom-out","reset-view","where"]){
  assert.match(html,new RegExp('id="'+id+'"'),"Missing Explore control: "+id);
}
for(const name of ["TLM Atlas","Sacred Atlas","Search a church, shrine, town","REVIEW · CANONICAL DATA ONLY"]){
  assert.ok(html.includes(name),"Missing AppDesign affordance: "+name);
}
for(const name of ["function setMode","function buildWays","function setSheet","function renderSearch",
  "function locateSite","function startMap","function nearMe","function loadRegistry"]){
  assert.ok(script.includes(name),"Missing Explore implementation: "+name);
}
assert.match(script,/if\(!state\.mapReady\)showMapFallback/,"Map needs graceful fallback");
assert.match(script,/state\.mode==='tlm'/,"TLM-only branch must remain explicit");
assert.match(script,/site\.coordinateQuality|pin\.coordinateQuality/,"Coordinate precision must appear in UX");
assert.match(script,/maplibre-gl@4\.7\.1/,"Review map must pin MapLibre version");
assert.match(script,/STYLE = 'https:\/\/demotiles\.maplibre\.org\/style\.json'/,"Preview-only demo map source must be explicit");
assert.match(css,/\.sheet\{/);
assert.match(css,/bottom:calc\(84px \+ var\(--sb\)\)/,"Preserve AppDesign bottom bar offset");
assert.match(css,/@media\(max-width:340px\)/,"320px compact layout must exist");
assert.doesNotMatch(html,/Eglise Saint-Sébastien|Notre-Dame de|Chartres Cathedral|Saint-Nicolas-du-Chardonnet/,"Example location leaked");
assert.doesNotMatch(script,/const AO\s*=|const IM\s*=|const CITIES\s*=|const LIT\s*=/,"No prototype data or image bank");
const accessors={
  id:r=>r.id,approved:r=>r.approved===true,name:r=>r.name,
  sourceUrl:r=>r.sourceUrl,coordinates:r=>r.coordinates,
  coordinateQuality:r=>r.coordinateQuality
};
const empty=prepareApprovedSites(data.sites,accessors);
assert.equal(empty.sites.length,0);
assert.equal(empty.pins.length,0);
console.log("Explore staged UI/source contracts passed (no sampled locations).");
