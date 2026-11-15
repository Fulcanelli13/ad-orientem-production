// Exact-sized medallion vocabulary from owner AO_Explore_AppDesign.html,
// SHA-256 97d56600db6118e1a826004d90970db155aa7f7e2c5662e1b6acec0a04b4e771.
// This production policy NEVER infers Marian/Christological/saint associations
// from a place name or fabricates Mass activity from venue coordinates.
export const CLAUDE_SACRED_GLYPHS=Object.freeze({
 marian:'<path d="M12 3l1.6 5.2L19 6.6l-3.4 4.3L21 12l-5.4 1.1L19 17.4l-5.4-1.6L12 21l-1.6-5.2L5 17.4l3.4-4.3L3 12l5.4 1.6z" fill="currentColor"/>',
 christ:'<path d="M10.2 3h3.6v7.2H21v3.6h-7.2V21h-3.6v-7.2H3v-3.6h7.2z" fill="currentColor"/>',
 saint:'<circle cx="12" cy="8.5" r="5.2" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M6 21c.6-4.4 3-6.6 6-6.6s5.4 2.2 6 6.6z" fill="currentColor"/>',
 church:'<path d="M12 2.5v3M10.6 4h2.8" stroke="currentColor" stroke-width="1.4"/><path d="M5 12a7 7 0 0114 0z" fill="currentColor"/><path d="M4 12h16v8.5H4z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10.4 20.5v-4a1.6 1.6 0 013.2 0v4" fill="currentColor"/>'
});
export const CLAUDE_MARKER_SIZES=Object.freeze({dot:7,sm:22,ph:52});
export function verifiedMarkerGlyph(record){
 // Only source-attested PHYSICAL architectural type, not thematic inference.
 if(["church","cathedral","basilica"].includes(record?.place_type))
  return "church";
 // A shrine/pilgrimage site is not thereby proven Marian, saint or Christ.
 return null;
}
export function sacredMarkerMode(record,zoom,selected=false){
 // Original owner levels: world <3.3, country <6.6, local otherwise.
 // Unlike the France sample's world counts, retain known global pilot dots.
 if(zoom<6.6)return selected?"sm":"dot";
 // A photo medallion is allowed only for an exact owner-selected image.
 if(selected&&record?.media_status==="OWNER_SELECTED_PHOTO_TRANSFERRED"
      &&record?.media?.src?.startsWith("./explore/media/"))
  return "ph";
 return "sm";
}
export function markerLabelVisible(zoom,selected,mode){
 return selected || (zoom>10.4 && mode!=="dot");
}
export function visibleMarkerGeometry(zoom,selected,mode){
 const diameter=CLAUDE_MARKER_SIZES[mode];
 return {diameter,collisionRadius:diameter/2+2,priority:selected?100:0};
}
