// The owner-controlled glyphs and zoom thresholds are source-derived.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CLAUDE_SACRED_GLYPHS,CLAUDE_MARKER_SIZES,
 sacredMarkerMode,verifiedMarkerGlyph,markerLabelVisible} from "../site/explore/marker-policy.js";
const manifest=JSON.parse(readFileSync("site/explore/selected-sites.v1.json","utf8"));
assert.deepEqual(CLAUDE_MARKER_SIZES,{dot:7,sm:22,ph:52});
assert.deepEqual(Object.keys(CLAUDE_SACRED_GLYPHS).sort(),
 ["christ","church","marian","saint"]);
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

import {createHash} from "node:crypto";
const ownerGlyphSha256=Object.freeze({
 marian:"a8d6556722e16cfaead046a02c5aa11b88931941c9fbeaac0ecc7a81dfe30f6a",
 christ:"bb718c331130c2bd1d384c9ac264e251691503bb57c370c7e1124e5d7108246c",
 saint:"057b3ec2fb65bf1396614a7bd2d614cb58e933f0f76da400616fb02416d758f7",
 church:"fbbde91cb71b27237f91c862c1e662c1cc7a568d34a118334dd642cc6b2fda64"
});
for(const [kind,digest] of Object.entries(ownerGlyphSha256)){
 const actual=createHash("sha256").update(CLAUDE_SACRED_GLYPHS[kind],"utf8").digest("hex");
 assert.equal(actual,digest,
  "Claude owner source SVG drift: "+kind+" (source file SHA-256 97d56600db6118e1a826004d90970db155aa7f7e2c5662e1b6acec0a04b4e771)");
}
// The original donor is not imported into the production repository.
console.log("PASS Claude 7/22/52px medallion, six owner-photo and unlit TLM source contract");
