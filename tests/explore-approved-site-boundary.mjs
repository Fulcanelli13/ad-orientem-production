import assert from "node:assert/strict";
import { prepareApprovedSites } from "../src/explore/approved-site-boundary.mjs";

const pick = {
  id: r => r.id,
  approved: r => r.review === "approved",
  name: r => r.name,
  sourceUrl: r => r.sourceUrl,
  coordinates: r => r.coords,
  coordinateQuality: r => r.precision
};

assert.deepEqual(prepareApprovedSites([], pick), { sites: [], pins: [], held: [] }, "Empty official registry must show zero sites, not French examples");

const rows = [
  { id: "SITE-001", name: "Illustrative Approved Church", review: "approved", sourceUrl: "https://example.org/source", coords: { lat: -20.2, lon: 57.5 }, precision: "illustrative" },
  { id: "SITE-002", name: "Unapproved sample", review: "research", sourceUrl: "https://example.org/research", coords: { lat: 48.85, lon: 2.35 }, precision: "verified" },
  { id: "SITE-003", name: "Unverified coordinates", review: "approved", sourceUrl: "https://example.org/source", coords: { lat: 999, lon: 57.4 }, precision: "verified" },
  { id: "SITE-004", name: "No attribution", review: "approved", sourceUrl: null, coords: { lat: 48, lon: 2 }, precision: "verified" },
  { id: "SITE-005", name: "Missing precision", review: "approved", sourceUrl: "https://example.org/source", coords: { lat: 12, lon: 13 } },
  { id: "SITE-006", name: "No coordinates", review: "approved", sourceUrl: "https://example.org/source" }
];
const result = prepareApprovedSites(rows, pick);
assert.deepEqual(result.sites.map(x => x.id), ["SITE-001", "SITE-003", "SITE-005", "SITE-006"]);
assert.deepEqual(result.pins.map(x => x.siteId), ["SITE-001"]);
assert.equal(result.pins[0].coordinateQuality, "illustrative");
assert.equal(result.held.length, 4);
assert.ok(result.held.some(x => x.id === "SITE-002" && x.reason === "not-approved"));
assert.ok(result.held.some(x => x.id === "SITE-003" && x.reason === "invalid-coordinates"));
assert.ok(result.held.some(x => x.id === "SITE-004" && x.reason === "unverifiable-source"));
assert.ok(result.held.some(x => x.id === "SITE-005" && x.reason === "coordinate-quality-unlabelled"));
assert.throws(() => prepareApprovedSites([{ ...rows[0] }, { ...rows[0] }], pick), /Duplicate canonical site ID/);
assert.throws(() => prepareApprovedSites(rows, {}), /mapping functions/);
assert.ok(Object.isFrozen(result.pins));
console.log("Explore canonical-data boundary: all tests passed");
