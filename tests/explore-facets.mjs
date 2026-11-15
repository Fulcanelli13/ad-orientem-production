import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {facetOptions,filterEntriesByFacet} from "../site/explore/category-facets.js";

const raw=JSON.parse(readFileSync("site/explore/selected-sites.v1.json","utf8"));
assert.equal(raw.sacred.length,18);
assert.equal(raw.tlm.length,10);
const sacredCounts={shrine:7,basilica:5,cathedral:3,pilgrimage_destination:2,church:1};
const tlmCounts={oratory:9,church:1};
for(const [key,n] of Object.entries(sacredCounts))
 assert.equal(filterEntriesByFacet(raw.sacred,"sacred",key).length,n,"Sacred source category "+key);
for(const [key,n] of Object.entries(tlmCounts))
 assert.equal(filterEntriesByFacet(raw.tlm,"tlm",key).length,n,"TLM source category "+key);
assert.equal(filterEntriesByFacet(raw.sacred,"sacred","all").length,18);
assert.equal(filterEntriesByFacet(raw.tlm,"tlm","all").length,10);
assert.equal(filterEntriesByFacet(raw.sacred,"sacred","feasts").length,0,"No unsupported feast layer");
assert.equal(filterEntriesByFacet(raw.tlm,"tlm","times").length,0,"No unsupported Mass-time layer");
assert.equal(filterEntriesByFacet(raw.sacred,"tlm","shrine").length,0);
assert.equal(filterEntriesByFacet(raw.tlm,"tlm","fssp").length,0,"No inferred institute filter");
assert.deepEqual(facetOptions("sacred","fr").filter(x=>x.held).map(x=>x.id),["feasts"]);
assert.deepEqual(facetOptions("tlm","en").filter(x=>x.held).map(x=>x.id),["times"]);
for(const lens of ["tlm","sacred"]){
 const en=facetOptions(lens,"en"),fr=facetOptions(lens,"fr");
 assert.deepEqual(en.map(x=>x.id),fr.map(x=>x.id),"Language switch must not change categories");
 assert.equal(en[0].id,"all");
}
for(const row of filterEntriesByFacet(raw.sacred,"sacred","shrine"))
 assert.equal(row.place_type,"shrine");
for(const row of filterEntriesByFacet(raw.tlm,"tlm","oratory"))
 assert.equal(row.venue_type,"oratory");
console.log("PASS pilot Atlas exact-category filters (18 Sacred, 10 TLM; held feasts/times)");
