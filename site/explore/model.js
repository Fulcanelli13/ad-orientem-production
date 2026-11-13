// Production Explore model — curated records only, no inferred liturgical times.
import { isMapPublishableGeo, directoryGeoLabel } from "./core/geo-provenance.js";
import { nearbyHeritagePlaces } from "./core/heritage-map.js";
import { sacredPlaceSynopsis } from "./core/place-source-synopsis.js";

const plain = value => String(value ?? "").trim();
const safeLink = url => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.href : null;
  } catch { return null; }
};
const coord = geo => geo && Number.isFinite(Number(geo.lat)) &&
  Number.isFinite(Number(geo.lng)) && Math.abs(Number(geo.lat)) <= 90 &&
  Math.abs(Number(geo.lng)) <= 180;
export function publishable(entry, lens) {
  if (!entry || !plain(entry.id) || !plain(entry.name) ||
      !plain(entry.address) || !plain(entry.country_code) ||
      !coord(entry.geo) || !plain(entry.geo.source_ref) ||
      !safeLink(entry.geo.source_url)) return false;
  if (lens === "sacred") {
    return /^place:/.test(entry.id) && Array.isArray(entry.source_ids) &&
      entry.source_ids.length > 0 && plain(entry.geo.verified_at).length > 0 &&
      plain(entry.geo.precision) !== "unknown" &&
      entry.media_status === "NO_IMAGE_TRANSFERRED";
  }
  if (lens === "tlm") {
    return /^ao-icksp-/.test(entry.id) &&
      entry.community_id === "ICKSP" && entry.relationship === "served_by" &&
      entry.liturgical_form === "TRADITIONAL_LATIN" &&
      entry.schedule_status === "NOT_IMPORTED" &&
      entry.media_status === "NO_IMAGE_TRANSFERRED" &&
      safeLink(entry.official_url) && safeLink(entry.source_url) &&
      isMapPublishableGeo(entry.geo, entry.country_code);
  }
  return false;
}
export function validatedDataset(data) {
  if (data?.schema !== "AO_PRODUCTION_EXPLORE_SELECTED_V1" ||
      !Array.isArray(data.sacred) || !Array.isArray(data.tlm) ||
      !plain(data.research_commit) || !data.source_blobs) {
    throw new Error("Invalid curated Atlas schema");
  }
  const result = { sacred:[], tlm:[] }, seen = new Set();
  for (const lens of ["sacred","tlm"]) {
    for (const item of data[lens]) {
      if (!publishable(item,lens) || seen.has(item.id)) {
        throw new Error("Held or duplicate record: " + plain(item?.id));
      }
      seen.add(item.id);
      result[lens].push(Object.freeze(item));
    }
    Object.freeze(result[lens]);
  }
  return Object.freeze(result);
}
export function searchEntries(entries, term) {
  const q = plain(term).toLocaleLowerCase();
  if (!q) return entries;
  return entries.filter(x => [x.name,x.address,x.country_code,
      x.community_id,x.place_type,...(x.aliases||[])].some(v =>
    plain(v).toLocaleLowerCase().includes(q)));
}
export function featureCollection(entries) {
  return { type:"FeatureCollection", features:entries.map(entry => ({
    type:"Feature", id:entry.id,
    properties:{id:entry.id,name:entry.name},
    geometry:{type:"Point",coordinates:[Number(entry.geo.lng),Number(entry.geo.lat)]}
  })) };
}
export function sitePrecision(entry, language="en") {
  if (entry.community_id === "ICKSP") return directoryGeoLabel(entry.geo,{language});
  if (entry.geo.indicative_only || entry.geo.precision === "complex_anchor") {
    return language === "fr" ? "Repère indicatif du site · pas une entrée" :
      "Indicative site pin · not an entrance";
  }
  return language === "fr" ? "Emplacement du site documenté" : "Documented site position";
}
export function sourceSynopsis(entry, language="en") {
  // Future editorial summary must come from a matching attested category.
  return sacredPlaceSynopsis(entry,{language,maxLength:250});
}
export function nearbySelected(selected, all, limit=3) {
  if (!selected || !Array.isArray(all)) return [];
  const points = all.filter(item => item.id !== selected.id).map(item => ({
    place_id:item.id,title:item.name,place_type:item.place_type,
    map_publishable:true,geo:item.geo
  }));
  return nearbyHeritagePlaces(points,selected.geo,{limit});
}
export {safeLink};
