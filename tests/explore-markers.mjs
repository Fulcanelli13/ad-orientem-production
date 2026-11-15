// The owner-controlled glyphs and zoom thresholds are source-derived.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CLAUDE_SACRED_GLYPHS,CLAUDE_MARKER_SIZES,
 sacredMarkerMode,verifiedMarkerGlyph,markerLabelVisible} from "../site/explore/marker-policy.js";
const manifest=JSON.parse(readFileSync("site/explore/selected-sites.v1.json","utf8"));
assert.deepEqual(CLAUDE_MARKER_SIZES,{dot:7,sm:22,ph:52});
assert.deepEqual(Object.keys(CLAUDE_SACRED_GLYPHS).sort(),
 ["church","christ","marian","saint"]);
const titles=manifest.sacred.map(x=>x.id);
assert.equal(titles.length,18);
assert.equal(manifest.tlm.length,10);
assert.equal(new Set([...titles,...manifest.tlm.map(x=>x.id)]).size,28);
const approved=manifest.sacred.filter(x=>x.media_status==="OWNER_SELECTED_PHOTO_TRANSFERRED");
assert.equal(approved.length,6);
for(const x of manifest.sacred){
 const glyph=verifiedMarkerGlyph(x);
 if(["church","cathedral","basilica"].includes(x.place_type))
  assert.equal(glyph,"church","Physical architectural type must be source recorded");
 else assert.equal(glyph,null,
  "Shrine/pilgrimage association must not be invented from the title: "+x.id);
 assert.equal(sacredMarkerMode(x,2.5),"dot");
 assert.equal(sacredMarkerMode(x,5),"dot");
 assert.equal(sacredMarkerMode(x,5,true),"sm");
 assert.equal(sacredMarkerMode(x,7.5),
   "sm","Never create a photo medallion for an unselected site");
 assert.equal(sacredMarkerMode(x,8,true),
  x.media_status==="OWNER_SELECTED_PHOTO_TRANSFERRED"?"ph":"sm");
 assert.equal(markerLabelVisible(5,false,"dot"),false);
 assert.equal(markerLabelVisible(12,false,"sm"),true);
 assert.equal(markerLabelVisible(8,true,"sm"),true);
}
const fake={place_type:"shrine",name:"Notre-Dame of an imaginary place",
 media_status:"OWNER_SELECTED_PHOTO_TRANSFERRED",media:{src:"https://other.example/image.jpg"}};
assert.equal(verifiedMarkerGlyph(fake),null);
assert.equal(sacredMarkerMode(fake,8,true),"sm",
 "Remote/unapproved photograph must not be admitted");
// The original donor is not imported into the production repository.
console.log("PASS Claude 7/22/52px medallion, six owner-photo and unlit TLM source contract");
