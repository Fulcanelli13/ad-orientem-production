/**
 * Explore category facets: exact values present in the approved pilot manifest.
 * No inferred feast, pilgrimage itinerary, Mass timetable or institute affiliation.
 * These labels are UI taxonomy only; they never mutate canonical source records.
 */
export const EXPLORE_FACETS = Object.freeze({
  tlm: Object.freeze([
    Object.freeze({id:"all",en:"Churches",fr:"Églises"}),
    Object.freeze({id:"oratory",en:"Oratories",fr:"Oratoires"}),
    Object.freeze({id:"church",en:"Church buildings",fr:"Églises (bâtiments)"}),
    Object.freeze({id:"times",en:"Mass times",fr:"Horaires",held:true}),
  ]),
  sacred: Object.freeze([
    Object.freeze({id:"all",en:"Places",fr:"Lieux"}),
    Object.freeze({id:"shrine",en:"Shrines",fr:"Sanctuaires"}),
    Object.freeze({id:"basilica",en:"Basilicas",fr:"Basiliques"}),
    Object.freeze({id:"cathedral",en:"Cathedrals",fr:"Cathédrales"}),
    Object.freeze({id:"pilgrimage_destination",en:"Pilgrimages",fr:"Pèlerinages"}),
    Object.freeze({id:"church",en:"Churches",fr:"Églises"}),
    Object.freeze({id:"feasts",en:"Feasts",fr:"Fêtes",held:true}),
  ])
});
export function facetOptions(lens, language="en") {
  if (!Object.hasOwn(EXPLORE_FACETS,lens)) return [];
  const lang=language==="fr"?"fr":"en";
  return EXPLORE_FACETS[lens].map(f => Object.freeze({
    id:f.id,label:f[lang],held:f.held===true
  }));
}
export function filterEntriesByFacet(entries,lens,facet) {
  if(!Array.isArray(entries))return [];
  const f=EXPLORE_FACETS[lens]?.find(x=>x.id===facet);
  if(!f || f.held)return [];
  if(f.id==="all")return entries;
  const field=lens==="tlm"?"venue_type":"place_type";
  return entries.filter(x=>x?.[field]===f.id);
}
