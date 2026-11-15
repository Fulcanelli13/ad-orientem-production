/**
 * Bounds of an actual source-validated Atlas lens.
 *
 * Never invent coordinates. For globally scattered collections the existing
 * WORLD camera remains appropriate; a geographically concentrated pilot
 * (such as the selected US TLM venues) should open over its records.
 */
export function boundsForLens(records) {
  if (!Array.isArray(records)) return null;
  const pts=records.map(row=>row?.geo).filter(g =>
    g && typeof g.lng==="number" && Number.isFinite(g.lng) && g.lng>=-180 && g.lng<=180 &&
    typeof g.lat==="number" && Number.isFinite(g.lat) && g.lat>=-90 && g.lat<=90);
  if (!pts.length) return null;
  const lon=pts.map(g=>g.lng),lat=pts.map(g=>g.lat);
  const minLng=Math.min(...lon),maxLng=Math.max(...lon);
  const minLat=Math.min(...lat),maxLat=Math.max(...lat);
  const spanLng=maxLng-minLng,spanLat=maxLat-minLat;
  // A global collection, or a group crossing the antimeridian, keeps WORLD.
  if (spanLng>115 || spanLat>65) return null;
  const lngMargin=Math.max(.15,spanLng*.08);
  const latMargin=Math.max(.15,spanLat*.08);
  return [
    [Math.max(-180,minLng-lngMargin),Math.max(-85,minLat-latMargin)],
    [Math.min(180,maxLng+lngMargin),Math.min(85,maxLat+latMargin)]
  ];
}
