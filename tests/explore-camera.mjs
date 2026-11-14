import assert from "node:assert/strict";
import {boundsForLens} from "../site/explore/lens-camera.mjs";
const sourceRecord=(lat,lng)=>({geo:{lat,lng}});
assert.equal(boundsForLens(null),null);
assert.equal(boundsForLens([]),null);
assert.equal(boundsForLens([{geo:{lat:NaN,lng:0}}]),null);
assert.equal(boundsForLens([{geo:{lat:100,lng:0}}]),null);
const us=boundsForLens([
 sourceRecord(41.55,-73.04),sourceRecord(38.62,-90.25),sourceRecord(29.99,-93.37)
]);
assert.ok(us,"Geographically clustered TLM source records must produce camera bounds");
assert.ok(us[0][0] < -93.37 && us[1][0] > -73.04,"US longitudes must be inside camera");
assert.ok(us[0][1] < 29.99 && us[1][1] > 41.55,"US latitudes must be inside camera");
assert.equal(boundsForLens([sourceRecord(-20.17,57.5),sourceRecord(53.8,-6.0),sourceRecord(48.8,121.5)]),null,
 "Global Sacred Places should retain WORLD rather than zooming to a giant rectangle");
assert.equal(boundsForLens([sourceRecord(0,170),sourceRecord(0,-175)]),null,
 "Dateline-crossing sources need a separate geodesic treatment");
const single=boundsForLens([sourceRecord(-20.16,57.5)]);
assert.ok(single[0][0] < single[1][0] && single[0][1] < single[1][1],
 "A single grounded site still needs nonzero bounds");
console.log("PASS Explore grounded initial camera bounds");
