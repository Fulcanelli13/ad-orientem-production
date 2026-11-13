import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PUBLIC_HERITAGE_CATEGORIES,projectHeritagePlaces,nearbyHeritagePlaces,heritageCustomCards,
} from "../src/find/heritage-map.js";
import {sacredPlaceSynopsis} from "../src/find/place-source-synopsis.js";
import {
  auditDirectoryGeo,isMapPublishableGeo,isApproximateDirectoryGeo,directoryGeoLabel,
} from "../src/find/geo-provenance.js";
import {renderSacredPlaceFallback,sacredPlaceFallbackKind}
  from "../src/find/sacred-place-visual-fallback.js";

// Synthetic test-only fixtures. These are NOT exported or presented as
// canonical places in the app. Production Place, CL2 and photo data are held.
const geo=(lat,lng,overrides={})=>({
  lat,lng,precision:"building",geocoding_source:"OFFICIAL_SOURCE",
  source_ref:"TEST:coordinate-evidence",source_url:"https://example.org/test-evidence",
  matched_country_code:"FR",...overrides,
});
const a={place_id:"TEST-PLACE-A",title:"Fixture A",subtitle:"Fixture locality",
  search_text:"fixture a shared identity",map_publishable:true,geo:geo(0,0),
  raw:{place:{place_type:"shrine"}}};
const projection={byLens:{
  shrines:[{...a,kind:"SHRINE",title:"Fixture A — shrine"}],
  apparitions:[{...a,kind:"APPARITION",title:"Fixture A — apparition"}],
  relics:[
    {...a,place_id:"TEST-PLACE-B",title:"Fixture B",geo:geo(0,1),kind:"RELIC"},
    {...a,place_id:"TEST-UNMAPPED",geo:null},
    {...a,place_id:"TEST-HELD",map_publishable:false}
  ],
  pilgrimages:[],
  traditions:[{...a,place_id:"TEST-TRADITION",kind:"CUSTOM_ATTESTATION",
    raw:{custom:{custom_id:"TEST-CUSTOM"},place:{place_type:"church"}}}],
}};
assert.deepEqual(PUBLIC_HERITAGE_CATEGORIES,["shrines","relics","pilgrimages","apparitions"]);
const sites=projectHeritagePlaces(projection);
assert.equal(sites.length,2,"Same exact Place must have a single map pin");
assert.deepEqual(sites.map(x=>x.place_id),["TEST-PLACE-A","TEST-PLACE-B"]);
assert.equal(sites[0].heritage_primary,"shrines");
assert.equal(sites[0].heritage_record_count,2);
assert.deepEqual(sites[0].heritage_categories,["shrines","apparitions"]);
assert.equal(sites[0].title,"Fixture A — shrine");
assert.ok(sites.every(x=>x.map_publishable&&x.place_id));
assert.equal(projectHeritagePlaces(projection,{query:"no-match"}).length,0);
assert.equal(projectHeritagePlaces(projection,{categories:["traditions"]}).length,1,
  "Documented practice attestations are internal only, not public Atlas pins");
assert.equal(projectHeritagePlaces(projection,{categories:["traditions"],customId:"not-found"}).length,0);
assert.deepEqual(heritageCustomCards([{kind:"CANONICAL_CUSTOM",title:"Test-only practice",search_text:"practice"}],{enabled:false}),[]);
const nearby=nearbyHeritagePlaces(sites,{lat:0,lng:0});
assert.equal(nearby.length,2);
assert.equal(nearby[0].place_id,"TEST-PLACE-A");
assert.ok(nearby[1].distance_km>110&&nearby[1].distance_km<113,
  "Geodesic proximity must not be described as journey time");
assert.equal(nearbyHeritagePlaces(sites,{lat:null,lng:0}).length,0);
assert.equal(nearbyHeritagePlaces([...sites,sites[0]],{lat:0,lng:0}).length,2);
const approximate=geo(0,1,{precision:"locality"});
assert.equal(isMapPublishableGeo(approximate,"FR"),true);
assert.equal(isApproximateDirectoryGeo(approximate),true);
assert.match(directoryGeoLabel(approximate,{language:"fr"}),/approximative/);
assert.equal(isMapPublishableGeo(geo(0,0,{matched_country_code:"IT"}),"FR"),false);
assert.ok(auditDirectoryGeo(geo(0,0,{source_ref:""})).some(i=>i.code==="MISSING_GEO_SOURCE_REF"));
assert.equal(isMapPublishableGeo(geo(99,0),"FR"),false);
assert.equal(isMapPublishableGeo(geo(0,0,{precision:"unknown"}),"FR"),false);
const sourced={
  shrines:[{summary:"English shrine evidence",summary_fr:"Notice française vérifiée"}],
  relics:[{summary:"",summary_fr:""}],
  apparitions:[{summary:"Separate apparition evidence"}],
};
assert.equal(sacredPlaceSynopsis(sourced,{language:"fr",preferredCategory:"shrines"}),
  "Notice française vérifiée");
assert.equal(sacredPlaceSynopsis(sourced,{language:"en",preferredCategory:"relics"}),"",
  "Missing preferred source text must not be replaced with an unrelated theme");
assert.equal(sacredPlaceSynopsis(null),"");
const fallback=renderSacredPlaceFallback({place_type:"shrine"},"fr","preview");
assert.equal(sacredPlaceFallbackKind({place_type:"shrine"}),"SHRINE");
assert.match(fallback,/aucune photographie approuvée/);
assert.doesNotMatch(fallback,/<img\b/i,"Unapproved photographs must not be fabricated");
assert.doesNotMatch(fallback,/official coat|official arms/i);
for(const file of ["src/find/heritage-map.js","src/find/place-source-synopsis.js",
  "src/find/geo-provenance.js","src/find/sacred-place-visual-fallback.js"]){
  const text=readFileSync(file,"utf8");
  assert.doesNotMatch(text,/\bfetch\s*\(|https?:\/\/unpkg\.com|maplibre-gl|\bvercel\b/i,
    "Pure selectively transferred modules must not fetch hidden research data: "+file);
}
const live=readFileSync("site/app.js","utf8");
assert.match(live,/still in the research repository/,
  "Do not advertise Atlas as published before runtime+registry acceptance");
assert.ok(!readFileSync("site/index.html","utf8").includes("src/find/"),
  "New core functions must not silently join the deployed site");
console.log("PASS selected Explore core: exact Place identity, geo provenance, source-scoped text, no invented photo, no public transfer");
