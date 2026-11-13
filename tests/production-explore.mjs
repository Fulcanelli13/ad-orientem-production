import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import {validatedDataset,publishable,searchEntries,featureCollection,nearbySelected,sitePrecision,safeLink}
  from "../site/explore/model.js";
import {exploreDebugState} from "../site/explore.js";

const read=file=>readFileSync(file,"utf8");
const data=JSON.parse(read("site/explore/selected-sites.v1.json"));
assert.equal(data.schema,"AO_PRODUCTION_EXPLORE_SELECTED_V1");
assert.equal(data.research_commit,"9b7fafd120b90632b2c376aed4f609235cd15709");
assert.equal(data.sacred.length,18,"Only 18 explicitly selected Sacred records");
assert.equal(data.tlm.length,10,"Only 10 official-venue TLM records");
assert.equal(Object.keys(data.source_blobs).length,4);
const records=validatedDataset(data);
assert.equal(records.sacred.length,18);
assert.equal(records.tlm.length,10);
const ids=[...records.sacred,...records.tlm].map(x=>x.id);
assert.equal(new Set(ids).size,28,"Canonical Place or venue identities cannot be merged");
assert.equal(new Set(records.sacred.map(x=>x.country_code)).size,10);
assert.equal(records.sacred.filter(x=>x.country_code==="MU").length,3);
assert.equal(records.sacred.filter(x=>x.country_code==="IE").length,2);
for(const place of records.sacred){
  assert.equal(publishable(place,"sacred"),true,"Not a source-verified public site: "+place.id);
  assert.ok(place.id.startsWith("place:"),"Place ID must be canonical");
  assert.ok(place.source_ids.length>=1&&place.geo.source_ref&&place.geo.source_url);
  assert.ok(place.geo.verified_at,"Coordinate source date missing: "+place.id);
  assert.ok(safeLink(place.geo.source_url));
  assert.equal(place.media_status,"NO_IMAGE_TRANSFERRED");
  if(place.geo.precision==="complex_anchor")
    assert.match(sitePrecision(place,"en"),/Indicative/);
}
for(const venue of records.tlm){
  assert.equal(publishable(venue,"tlm"),true,"Venue must pass official ministry and geo: "+venue.id);
  assert.equal(venue.community_id,"ICKSP");
  assert.equal(venue.relationship,"served_by");
  assert.equal(venue.schedule_status,"NOT_IMPORTED");
  assert.equal(venue.liturgical_form,"TRADITIONAL_LATIN");
  assert.ok(safeLink(venue.official_url)&&safeLink(venue.source_url));
  assert.ok(venue.geo.match_score>=.8,"Insufficient map-source matching");
  assert.equal(venue.geo.matched_country_code,venue.country_code);
}
const invalid=structuredClone(data);
invalid.tlm[0].geo.source_ref="";
assert.throws(()=>validatedDataset(invalid),/Held or duplicate record/);
const duplicates=structuredClone(data);
duplicates.tlm.push({...duplicates.tlm[0]});
assert.throws(()=>validatedDataset(duplicates),/Held or duplicate record/);
assert.equal(searchEntries(records.sacred,"Mauritius").length>0,true);
assert.equal(searchEntries(records.tlm,"Stanislaus").length,1);
assert.equal(searchEntries(records.tlm,"this definitely does not exist").length,0);
const geojson=featureCollection(records.sacred);
assert.equal(geojson.type,"FeatureCollection");
assert.equal(geojson.features.length,18);
assert.ok(geojson.features.every(x=>x.geometry.type==="Point"&&
  x.properties.id===x.id&&x.geometry.coordinates.length===2));
const selected=records.sacred[0];
const near=nearbySelected(selected,records.sacred,3);
assert.ok(near.length>=1&&near.length<=3);
assert.ok(near.every(x=>x.place_id!==selected.id&&x.distance_km>=0));
const html=read("site/index.html"),css=read("site/explore.css");
const js=read("site/explore.js"),model=read("site/explore/model.js"),app=read("site/app.js");
assert.match(html,/id="atlas-view"/);
for(const id of ["atlas-map","atlas-lens-sacred","atlas-lens-tlm",
  "atlas-results","atlas-card","atlas-search","atlas-world"]){
 assert.equal(html.split('id="'+id+'"').length-1,1,"Missing or duplicate Explore control: "+id);
}
assert.equal((html.match(/class="tab(?: active)?"/g)||[]).length,4,
  "Do not replace Claude's four exact Home V9 bottom tabs");
assert.match(app,/byId\("atlas-view"\)\.hidden = !explore/);
assert.match(app,/import\("\.\/explore\.js"\)/,"Explore must mount lazily into the Home shell");
assert.match(html,/\.\/explore\.css/);
assert.match(js,/const BASEMAP = "https:\/\/tiles\.openfreemap\.org\/styles\/dark"/);
assert.match(js,/maplibre-gl@6\.13\.0/);
assert.equal((js.match(/new lib\.Map\(/g)||[]).length,1,
  "Only one map instance may be created for the two Atlas lenses");
assert.match(js,/getSource\("ao-selected-sites"\)\?\.setData/);
assert.match(js,/renderSacredPlaceFallback\(/);
assert.match(model,/schedule_status/); // the validation model enforces no imported schedules
assert.doesNotMatch(js,/nextMass|next_mass|liveAvailability|<iframe|srcdoc|eval\(/i);
assert.doesNotMatch(JSON.stringify(records),/"nextMass"|"mass_times"|"schedule_url"/i);
assert.ok(!html.includes("src/find/"),"Do not expose the old repository tree as a website");
assert.doesNotMatch(js,/data\/directory\/generated|seed-registry|research\/|vercel/i);
assert.doesNotMatch(css,/font-face|url\(https?:\/\/|vercel/i,
  "Do not smuggle unlicensed embedded fonts or unknown image URLs into styles");
assert.match(model,/from "\.\/core\/geo-provenance\.js"/);
assert.match(model,/from "\.\/core\/heritage-map\.js"/);
assert.match(model,/from "\.\/core\/place-source-synopsis\.js"/);
for(const file of ["geo-provenance","heritage-map","place-source-synopsis","sacred-place-visual-fallback"]){
 assert.equal(read("site/explore/core/"+file+".js"),read("src/find/"+file+".js"),
  "Only byte-identical allowlisted core should be published: "+file);
}
assert.equal(exploreDebugState().mounted,false,"Map must not initialize before Atlas opens");
assert.ok(statSync("site/explore/selected-sites.v1.json").size<55_000,
  "Curated subset only: not the full worldwide research registry");
console.log("PASS production Explore: 18 Sacred, 10 TLM, verified sources, one map, four existing tabs and no fake schedules");
