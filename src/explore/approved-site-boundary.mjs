/**
 * Ad Orientem Explore — selective canonical-data boundary.
 *
 * This is intentionally independent of the French sample data and of MapLibre.
 * A future mapping from the owner-approved Location Master Registry must supply
 * the accessor functions below. This code cannot grant approval to a row.
 */
const validWebUrl = value => {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch { return false; }
};

export function prepareApprovedSites(rows, accessors) {
  if (!Array.isArray(rows)) throw new TypeError("Expected an array of canonical site rows");
  const required = ["id", "approved", "name", "sourceUrl", "coordinates", "coordinateQuality"];
  if (!accessors || required.some(k => typeof accessors[k] !== "function")) {
    throw new TypeError("Explicit canonical-registry mapping functions are required: " + required.join(", "));
  }

  const sites = [];
  const pins = [];
  const held = [];
  const seen = new Set();
  for (const row of rows) {
    const id = String(accessors.id(row) ?? "").trim();
    const name = String(accessors.name(row) ?? "").trim();
    const sourceUrl = accessors.sourceUrl(row);
    const approved = accessors.approved(row) === true;

    if (!id || !approved || !name || !validWebUrl(sourceUrl)) {
      held.push(Object.freeze({ id: id || null, reason:
        !id ? "missing-canonical-id" : !approved ? "not-approved" : !name ? "missing-site-name" : "unverifiable-source" }));
      continue;
    }
    if (seen.has(id)) throw new Error("Duplicate canonical site ID: " + id);
    seen.add(id);

    const site = Object.freeze({ id, name, sourceUrl });
    sites.push(site);

    const coordinate = accessors.coordinates(row);
    if (!coordinate || typeof coordinate !== "object") continue;
    const { lat, lon } = coordinate;
    const quality = accessors.coordinateQuality(row);
    const valid = typeof lat === "number" && Number.isFinite(lat) && lat >= -90 && lat <= 90
      && typeof lon === "number" && Number.isFinite(lon) && lon >= -180 && lon <= 180;
    if (!valid || !["verified", "illustrative"].includes(quality)) {
      held.push(Object.freeze({ id, reason: valid ? "coordinate-quality-unlabelled" : "invalid-coordinates" }));
      continue;
    }
    pins.push(Object.freeze({ siteId: id, name, lat, lon, coordinateQuality: quality, sourceUrl }));
  }
  return Object.freeze({ sites: Object.freeze(sites), pins: Object.freeze(pins), held: Object.freeze(held) });
}
