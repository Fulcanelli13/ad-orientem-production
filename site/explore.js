/* Ad Orientem production Explore: one map, two curated lenses.
   Deliberately independent from the old research app shell and runtime. */
import {
  validatedDataset, publishable, searchEntries, featureCollection,
  sitePrecision, nearbySelected, sourceSynopsis, safeLink
} from "./explore/model.js";
import {renderSacredPlaceFallback} from "./explore/core/sacred-place-visual-fallback.js";
import {CLAUDE_MAP_STYLE} from "./explore/claude-map-style.js";
import {boundsForLens} from "./explore/lens-camera.js";
import {facetOptions,filterEntriesByFacet} from "./explore/category-facets.js";
import {CLAUDE_SACRED_GLYPHS,sacredMarkerMode,verifiedMarkerGlyph,
  markerLabelVisible,visibleMarkerGeometry} from "./explore/marker-policy.js";

const $ = id => document.getElementById(id);
const MAPLIBRE_MODULE = "https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.mjs";
const BASEMAP = CLAUDE_MAP_STYLE;
const WORLD = {center:[14,15],zoom:1.25};
const dictionary={
 en:{
  heading:"Sacred geography",subtitle:"The map for discovering · the card for deciding",
  sacred:"Sacred Atlas",tlm:"TLM Atlas",search:"Search a church, shrine, town…",reset:"World view",
  filter:"Selected sites",list:"Browse places",source:"Coordinate source",
  official:"Official institute page",method:"Location evidence",
  discover:"Discover",hide:"Close",nearby:"Nearby selected sites · straight-line distance",
  notice:"Curated starting selection · not a complete worldwide directory",
  tnotice:"Mass times are not imported. Confirm services directly with the official institute.",
  snote:"A site pin identifies a documented site or indicative complex anchor, not an entrance.",
  initial:"Choose a pin or a place below",viewMap:"View on map",empty:"No matching selected places",
  noPhoto:"No site photograph has been transferred to this production selection.",
  pending:"Loading the map and selected source records",
  unavailable:"Interactive tiles unavailable. The source-backed place list remains usable.",
  showAll:"Clear search",featured:"Reviewed source",credit:"Geographic coordinates and source",
  lang:"Français",place:"Place",pattern:"No live Mass time claim",expand:"Expand places",collapse:"Collapse places",openFolio:"Discover place",churches:"churches",places:"sacred places",selected:"source-backed pilot",cards:"Cards",listMode:"List",churchWay:"Churches",massWay:"Mass times",placeWay:"Places",pilgrimWay:"Pilgrimages",feastWay:"Feasts",notImported:"Not imported"
 },
 fr:{
  heading:"Géographie sacrée",subtitle:"La carte pour découvrir · la fiche pour comprendre",
  sacred:"Atlas sacré",tlm:"Atlas TLM",search:"Rechercher une église, un sanctuaire, une ville…",reset:"Vue du monde",
  filter:"Sites sélectionnés",list:"Parcourir les lieux",source:"Source des coordonnées",
  official:"Site officiel de l'institut",method:"Justificatif du lieu",
  discover:"Découvrir",hide:"Fermer",nearby:"Autres lieux sélectionnés · à vol d'oiseau",
  notice:"Sélection de départ · ce n'est pas un répertoire mondial complet",
  tnotice:"Les horaires des messes ne sont pas importés. Vérifier auprès de l'institut.",
  snote:"Le repère cartographique ne constitue pas une indication d'entrée précise.",
  initial:"Choisir un repère ou un lieu ci-dessous",viewMap:"Voir sur la carte",empty:"Aucun lieu trouvé",
  noPhoto:"Aucune photographie du lieu n'a été transférée dans cette sélection.",
  pending:"Chargement de la carte et des sources retenues",
  unavailable:"Carte interactive indisponible. La liste des lieux sourcés reste utilisable.",
  showAll:"Effacer la recherche",featured:"Source documentée",credit:"Coordonnées et source",
  lang:"English",place:"Lieu",pattern:"Aucun horaire de messe confirmé",expand:"Déployer les lieux",collapse:"Réduire les lieux",openFolio:"Découvrir le lieu",churches:"églises",places:"lieux sacrés",selected:"sélection documentée",cards:"Cartes",listMode:"Liste",churchWay:"Églises",massWay:"Horaires",placeWay:"Lieux",pilgrimWay:"Pèlerinages",feastWay:"Fêtes",notImported:"Non importé"
 }
};
const state={
 initialized:false,lens:"tlm",language:"en",data:null,selectedId:null,
 map:null,sourceLoaded:false,mapFailed:false,markers:null,loading:null,all:[],query:"",facet:"all",viewMode:"cards",folioHistory:[],lastError:null,
};
const tr=key=>dictionary[state.language][key]||key;
const make=(tag,className,txt)=>{
 const el=document.createElement(tag);
 if(className)el.className=className;
 if(txt!=null)el.textContent=txt;
 return el;
};
function external(url,text,klass) {
 const href=safeLink(url);if(!href)return null;
 const a=make("a",klass||"",text);
 a.href=href;a.rel="noopener noreferrer";a.target="_blank";
 return a;
}
function setStatus(message,failed=false){
 const node=$("atlas-map-status");
 node.textContent=message||"";
 node.classList.toggle("error",Boolean(failed));
 node.hidden=!message;
}
function visibleEntries(){
 return filterEntriesByFacet(searchEntries(state.all,state.query),state.lens,state.facet);
}
function activeRecord(id){
 return state.all.find(row=>row.id===id)||null;
}
function chosenPhoto(record){
 return record?.media_status==="OWNER_SELECTED_PHOTO_TRANSFERRED"?record.media:null;
}
function photoCredit(photo){
 const credit=make("div","atlas-folio-photo-credit");
 credit.append(document.createTextNode((state.language==="fr"?"Photographie : ":"Photograph: ")+photo.photographer+" · "));
 const source=external(photo.source_url,state.language==="fr"?"Source originale":"Original source");
 const licence=external(photo.license_url,photo.license);
 if(source)credit.append(source,document.createTextNode(" · "));
 if(licence)credit.append(licence);
 credit.append(document.createTextNode(state.language==="fr"?" · Image redimensionnée et convertie au format WebP.":" · Resized and converted to WebP."));
 return credit;
}
function renderHeader() {
 $("atlas-heading").textContent=tr("heading");
 $("atlas-subtitle").textContent=tr("subtitle");
 $("atlas-search").placeholder=tr("search");
 $("atlas-search").setAttribute("aria-label",tr("search"));
 $("atlas-world").textContent=tr("reset");
 $("atlas-world").setAttribute("aria-label",tr("reset"));
 $("atlas-language").textContent=tr("lang");
 $("atlas-selection-note").textContent=tr("notice");
 $("atlas-map-hint").textContent=state.lens==="tlm"?tr("tnotice"):tr("snote");
 const ways=$("atlas-ways");ways.replaceChildren();
 ways.setAttribute("role","group");
 ways.setAttribute("aria-label",state.language==="fr"?"Filtrer les lieux par catégorie":"Filter places by category");
 for(const facet of facetOptions(state.lens,state.language)){
  const button=make("button","atlas-way"+(state.facet===facet.id?" active":"")+
    (facet.held?" withheld":""),facet.label);
  button.type="button";
  button.dataset.atlasFacet=facet.id;
  button.disabled=facet.held;
  if(facet.held)button.title=tr("notImported");
  button.setAttribute("aria-pressed",String(!facet.held&&state.facet===facet.id));
  ways.append(button);
 }
 $("atlas-sheet-subtitle").textContent=tr("selected");
 $("atlas-list-toggle").textContent=tr(state.viewMode==="cards"?"listMode":"cards");
 $("atlas-list-toggle").setAttribute("aria-pressed",String(state.viewMode==="list"));
 $("atlas-lens-sacred").textContent=tr("sacred");
 $("atlas-lens-tlm").textContent=tr("tlm");
 const expanded=$("atlas-sheet").dataset.sheetState==="expanded";
 $("atlas-sheet-handle").setAttribute("aria-expanded",String(expanded));
 $("atlas-sheet-handle").setAttribute("aria-label",tr(expanded?"collapse":"expand"));
 for(const lens of ["sacred","tlm"]){
  const button=$("atlas-lens-"+lens);
  const active=lens===state.lens;
  button.classList.toggle("active",active);
  button.setAttribute("aria-selected",String(active));
  button.tabIndex=active?0:-1;
 }
}
function recordBadge(record){
 return record.community_id==="ICKSP"?"ICKSP":String(record.place_type||"place").replace(/_/g," ");
}
function renderSummary(){
 const records=visibleEntries();
 $("atlas-count").textContent=records.length+" / "+state.all.length;
 $("atlas-results-title").textContent=records.length+" "+tr(state.lens==="tlm"?"churches":"places");
 $("atlas-results").classList.toggle("is-list",state.viewMode==="list");
 const root=$("atlas-results");
 root.replaceChildren();
 if(!records.length){
  root.append(make("li","atlas-no-results",tr("empty")));
  return;
 }
 for(const entry of records){
  const photo=chosenPhoto(entry);
  const li=make("li","atlas-result"+(photo?" atlas-result--photo":""));
  const button=make("button","atlas-result-button");
  button.type="button";button.dataset.atlasId=entry.id;
  button.setAttribute("aria-label",tr("openFolio")+": "+entry.name);
  button.setAttribute("aria-pressed",String(entry.id===state.selectedId));
  const media=make("span","atlas-result-media");
  if(photo){
   const img=make("img","atlas-result-photo");
   img.src=photo.src;
   img.alt=state.language==="fr"?photo.alt_fr:photo.alt_en;
   img.loading="lazy";img.decoding="async";
   img.style.objectPosition=photo.card_position;
   media.append(img,make("small","atlas-result-photo-credit",
     photo.photographer+" · "+photo.license));
  }else{
   media.innerHTML=renderSacredPlaceFallback(
     {place_type:entry.place_type||"church"},state.language,"preview");
  }
  const copy=make("span","atlas-result-copy");
  copy.append(make("small","atlas-result-kicker",recordBadge(entry)));
  copy.append(make("strong","atlas-result-name",entry.name));
  copy.append(make("span","atlas-result-location",entry.address));
  copy.append(make("span","atlas-result-action",tr("discover")+"  →"));
  button.append(media,copy);
  li.append(button);root.append(li);
 }
}
// Direct port of Claude's 3-position sheet: min 150, peek 376,
// list 62% of map height. Keep real tabbar height instead of demo 84px.
const snapHeight=stateName=>{
 const el=$("atlas-view");
 const available=el.clientHeight;
 const bottom=el.classList.contains("atlas-keyboard-visible")?0:
  (document.querySelector(".tabbar")?.getBoundingClientRect().height||79);
 const contentHeight=Math.max(200,available-bottom);
 if(stateName==="min")return 150;
 if(stateName==="expanded")return Math.round(contentHeight*.62);
 // On a short notched handset the default 376px card sheet could cover
 // Claude's zoom buttons. Reserve their 205px top offset, ~70px stacked
 // controls and a clear gap, plus the actual top safe-area padding.
 // Full-height phones retain Claude's exact original 376px peek.
 const header=document.querySelector("#atlas-view .atlas-top");
 const paddingTop=Number.parseFloat(getComputedStyle(header).paddingTop)||14;
 const safeTop=Math.max(0,paddingTop-14);
 const reserved=300+safeTop;
 const mobile=window.matchMedia("(max-width: 799px)").matches;
 return mobile?Math.min(376,Math.max(150,available-bottom-reserved)):376;
};
function setSheetState(next){
 const stateName=["min","peek","expanded"].includes(next)?next:"peek";
 const expanded=stateName==="expanded";
 const h=snapHeight(stateName);
 const sheet=$("atlas-sheet");
 sheet.dataset.sheetState=stateName;
 sheet.style.setProperty("--h",h+"px");
 $("atlas-view").style.setProperty("--atlas-sheet-height",h+"px");
 state.viewMode=expanded?"list":"cards";
 $("atlas-sheet-handle").setAttribute("aria-expanded",String(expanded));
 $("atlas-sheet-handle").setAttribute("aria-label",tr(expanded?"collapse":"expand"));
}
function appendLabel(parent,head,body){
 if(!body)return;
 const section=make("div","atlas-detail-field");
 section.append(make("small","atlas-field-label",head));
 section.append(make("p","",body));
 parent.append(section);
}
// Claude's original source hierarchy: immersive hero, actions, chapter
// navigation, factual folio, related sites. Content is ONLY verified pilot data.
function mapPinUrl(entry){
 const lat=Number(entry.geo.lat),lng=Number(entry.geo.lng);
 if(!Number.isFinite(lat)||!Number.isFinite(lng))return null;
 const url=new URL("https://www.openstreetmap.org/");
 url.searchParams.set("mlat",String(lat));
 url.searchParams.set("mlon",String(lng));
 url.hash="map=15/"+lat+"/"+lng;
 return url.href;
}
function folioLink(root,record,text,url,primary=false){
 const a=external(url,text,"atlas-folio-action"+(primary?" primary":""));
 if(a)root.append(a);
}
function folioFacts(data){
 const wrap=make("div","atlas-folio-facts");
 for(const [title,body] of data){
  if(!body)continue;
  const item=make("div","atlas-folio-fact");
  item.append(make("small","",title),make("b","",body));
  wrap.append(item);
 }
 return wrap;
}
function folioChapter(root,id,title,body){
 const heading=make("h3","atlas-folio-section",title);
 heading.id=id;
 root.append(heading);
 if(body)root.append(body);
}
function folioRow(title,detail,action){
 const b=make("button","atlas-folio-row");
 b.type="button";
 const copy=make("span","atlas-folio-row-copy");
 copy.append(make("b","",title),make("small","",detail));
 b.append(copy,make("span","atlas-folio-chevron","›"));
 b.addEventListener("click",action);
 return b;
}
function selectRecord(id,{fly=true,fromFolio=false,back=false}={}){
 const record=activeRecord(id);if(!record)return;
 if(fromFolio&&state.selectedId&&state.selectedId!==id){
  state.folioHistory.push(state.selectedId);
 }else if(!back){state.folioHistory=[];}
 state.selectedId=record.id;
 const root=$("atlas-card");
 root.hidden=false;root.replaceChildren();root.scrollTop=0;
 const exit=()=>{
  if(state.folioHistory.length){
   const previous=state.folioHistory.pop();
   selectRecord(previous,{fly:false,back:true});
  }else{
   state.selectedId=null;root.hidden=true;renderSummary();updateSacredMarkers();
   $("atlas-sheet-handle").focus({preventScroll:true});
  }
 };
 const backButton=make("button","atlas-folio-back","‹");
 backButton.type="button";backButton.setAttribute("aria-label",tr("hide"));
 backButton.addEventListener("click",exit);
 root.append(backButton);
 if(state.folioHistory.length){
  const closeAll=make("button","atlas-folio-closeall","×");
  closeAll.type="button";closeAll.setAttribute("aria-label",tr("hide"));
  closeAll.addEventListener("click",()=>{
   state.folioHistory=[];state.selectedId=null;root.hidden=true;renderSummary();
   updateSacredMarkers();$("atlas-sheet-handle").focus({preventScroll:true});
  });
  root.append(closeAll);
 }
 const sc=make("div","atlas-folio-scroll");
 const photo=chosenPhoto(record);
 const hero=make("header","atlas-folio-hero "+
   (photo?"atlas-folio-hero-photo":"atlas-folio-hero-band"));
 let media;
 if(photo){
  media=make("img","atlas-folio-photo-image");
  media.src=photo.src;
  media.alt=state.language==="fr"?photo.alt_fr:photo.alt_en;
  media.decoding="async";
  media.style.objectPosition=photo.hero_position;
 }else{
  media=make("div","atlas-folio-hero-symbol");
  media.innerHTML=renderSacredPlaceFallback(
    {place_type:record.place_type||record.venue_type||"church"},
    state.language,"preview");
 }
 const title=make("div","atlas-folio-ttl");
 title.append(make("small","",
   record.community_id==="ICKSP"?"ICKSP · "+record.country_code:
   recordBadge(record)+" · "+record.country_code));
 title.append(make("h1","",record.name));
 if(record.community_id==="ICKSP")title.append(make("p","",record.address));
 hero.append(media,title);sc.append(hero);
 if(photo)sc.append(photoCredit(photo));
 const actions=make("div","atlas-folio-actions");
 // These links point to source/indicative map positions, not a verified
 // entrance or confirmed service. No "Directions" wording is inferred.
 folioLink(actions,record,
  state.language==="fr"?"Position sur la carte":"Map position",
  mapPinUrl(record),true);
 if(record.community_id==="ICKSP")
  folioLink(actions,record,tr("official"),record.official_url);
 folioLink(actions,record,tr("source"),record.geo.source_url);
 if(actions.childElementCount)sc.append(actions);
 const links=make("nav","atlas-folio-toc");
 links.setAttribute("aria-label",
  state.language==="fr"?"Chapitres du lieu":"Place chapters");
 const chapters=record.community_id==="ICKSP"?
  [[state.language==="fr"?"Messes":"Mass","#folio-mass"],
   [state.language==="fr"?"L’église":"Church","#folio-place"],
   [state.language==="fr"?"Sources":"Sources","#folio-source"]]:
  [[state.language==="fr"?"Le lieu":"Place","#folio-place"],
   [state.language==="fr"?"Sources":"Sources","#folio-source"],
   [state.language==="fr"?"À proximité":"Nearby","#folio-near"]];
 for(const [label,anchor] of chapters){
  const b=make("button","",label);b.type="button";
  b.addEventListener("click",()=>sc.querySelector(anchor)?.scrollIntoView({
   behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",
   block:"start"
  }));
  links.append(b);
 }
 sc.append(links);
 if(record.community_id==="ICKSP"){
  const timetableNotice=make("section","atlas-folio-nextm");
  timetableNotice.id="folio-mass";
  timetableNotice.append(make("small","",
    state.language==="fr"?"Horaires des messes":"Mass timetable"));
  timetableNotice.append(make("b","",tr("tnotice").split(".")[0]+"."));
  timetableNotice.append(make("em","",state.language==="fr"?
   "Consulter la page officielle de l’institut pour les horaires actuels.":
   "Verify current services directly with the official institute."));
  sc.append(timetableNotice);
 }
 folioChapter(sc,"folio-place",
  record.community_id==="ICKSP"?
   (state.language==="fr"?"L’église":"The church"):
   (state.language==="fr"?"Le lieu":"The place"),
  folioFacts([
   [state.language==="fr"?"Adresse":"Address",record.address],
   [state.language==="fr"?"Repère":"Pin",sitePrecision(record,state.language)],
   [state.language==="fr"?"Desservi par":"Served by",record.community_id==="ICKSP"?
     "Institute of Christ the King Sovereign Priest":null],
   [state.language==="fr"?"Photographie":"Photograph",photo?
     photo.photographer+" · "+photo.license:
     state.language==="fr"?"Aucune photographie du lieu approuvée":
       "No approved exact-site photograph"]
  ]));
 const synopsis=sourceSynopsis(record,state.language);
 if(synopsis){
  const chapter=make("section","atlas-folio-chapter");
  chapter.append(make("p","",synopsis));
  sc.append(chapter);
 }else{
  sc.append(make("p","atlas-folio-unrecorded",
    state.language==="fr"?
    "Le guide historique et illustré de ce lieu n’a pas encore été transféré.":
    "The historical and illustrated guide for this place has not yet been transferred."));
 }
 folioChapter(sc,"folio-source",
  state.language==="fr"?"Sources et vérification":"Sources and verification",
  folioFacts([
   [state.language==="fr"?"Précision":"Precision",sitePrecision(record,state.language)],
   [state.language==="fr"?"Référence":"Source ref",record.geo.source_ref],
   [state.language==="fr"?"Contrôlé":"Checked",record.geo.verified_at],
   [state.language==="fr"?"Site canonique":"Canonical site",
    record.cl2_site_id||record.id]
  ]));
 if(record.geo.locator_note)
  sc.append(make("p","atlas-folio-unrecorded",record.geo.locator_note));
 const near=nearbySelected(record,state.all,3);
 if(near.length){
  const section=make("div","atlas-folio-near");
  folioChapter(sc,"folio-near",state.language==="fr"?
   "Lieux à proximité":"Places nearby",null);
  for(const n of near)
   section.append(folioRow(n.title,
     n.distance_km+" km · "+(state.language==="fr"?"à vol d’oiseau":"straight-line distance"),
     ()=>selectRecord(n.place_id,{fromFolio:true,fly:false})));
  sc.append(section);
 }
 sc.append(make("p","atlas-folio-note",
  state.language==="fr"?
  "Les positions et distances indiquent des repères documentés, non des entrées vérifiées. Vérifier les sources avant une visite.":
  "Positions and distances describe documented sites, not verified entrances. Consult the original sources before visiting."));
 root.append(sc);
 renderSummary();updateSacredMarkers();
 if(fly&&state.map)moveMapToVisiblePoint(
  [Number(record.geo.lng),Number(record.geo.lat)],
  Math.max(7,state.map.getZoom()));
}
function renderLens(lens){
 if(lens!=="sacred"&&lens!=="tlm")return;
 state.lens=lens;state.selectedId=null;state.facet="all";
 state.viewMode="cards";setSheetState("peek");
 state.all=state.data?state.data[lens]:[];
 $("atlas-card").hidden=true;
 $("atlas-card").replaceChildren();
 renderHeader();renderSummary();syncMap();
}
// Claude's original source used HTML MapLibre markers (not plain GL circles)
// at 7 / 22 / 52px sizes; this small verified-site pool is independent from
// its France-only regional labels, demo timetables and generated photos.
const markerShortName=name=>String(name).replace(
 /^(Sanctuaire|Basilique|Cathédrale|Chapelle|Sanctuary of|Abbaye|Église)\s+(de\s+la\s+|du\s+|de\s+|d')?/i,"")
 .replace(/^Notre-Dame/,"N.-D.").slice(0,42);
function installSacredMarkers(lib){
 if(state.markers||!state.map||!state.data)return;
 state.markers=state.data.sacred.map(record=>{
  const root=make("button","atlas-place-marker");
  root.type="button";root.dataset.atlasMarkerId=record.id;
  root.setAttribute("aria-label",record.name);
  const med=make("span","atlas-map-med");
  const glyph=verifiedMarkerGlyph(record);
  if(glyph){
   const icon=make("span","atlas-map-glyph");
   icon.innerHTML='<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">'+
     CLAUDE_SACRED_GLYPHS[glyph]+"</svg>";
   med.append(icon);
  }
  const label=make("span","atlas-map-label",markerShortName(record.name));
  root.append(med,label);
  root.addEventListener("click",ev=>{
   ev.stopPropagation();selectRecord(record.id);
  });
  const marker=new lib.Marker({element:root,anchor:"center"})
   .setLngLat([Number(record.geo.lng),Number(record.geo.lat)]).addTo(state.map);
  return {record,root,med,label,marker};
 });
 updateSacredMarkers();
}
function updateSacredMarkers(){
 if(!state.map||!state.markers)return;
 const sacred=state.lens==="sacred";
 const filtered=sacred?new Set(visibleEntries().map(p=>p.id)):new Set();
 const zoom=state.map.getZoom();
 const width=state.map.getContainer().clientWidth;
 const height=state.map.getContainer().clientHeight;
 const occupied=[];
 const ordered=[...state.markers].sort((a,b)=>
  Number(b.record.id===state.selectedId)-Number(a.record.id===state.selectedId));
 for(const item of ordered){
  const {record,root,med,label}=item;
  const selected=record.id===state.selectedId;
  const p=state.map.project([Number(record.geo.lng),Number(record.geo.lat)]);
  const mode=sacredMarkerMode(record,zoom,selected);
  const {diameter,hitDiameter,collisionRadius}=
   visibleMarkerGeometry(zoom,selected,mode);
  const hit=[p.x-collisionRadius,p.y-collisionRadius,
             p.x+collisionRadius,p.y+collisionRadius];
  const inView=p.x>=0&&p.y>=0&&p.x<=width&&p.y<=height;
  const collides=occupied.some(b=>hit[0]<b[2]&&hit[2]>b[0]&&
                         hit[1]<b[3]&&hit[3]>b[1]);
  const show=filtered.has(record.id)&&inView&&(selected||!collides);
  root.dataset.visible=String(show);
  root.hidden=!show;
  root.tabIndex=show?0:-1;
  if(!show)continue;
  occupied.push(hit);
  root.dataset.mode=mode;
  root.dataset.selected=String(selected);
  root.style.setProperty("--ao-marker-size",diameter+"px");
  root.style.setProperty("--ao-marker-hit-size",hitDiameter+"px");
  med.className="atlas-map-med atlas-map-med--"+mode;
  const hasPhoto=mode==="ph";
  med.style.backgroundImage=hasPhoto?'url("'+record.media.src+'")':"";
  if(hasPhoto){
   med.replaceChildren();
  }else if(!med.childElementCount){
   const glyph=verifiedMarkerGlyph(record);
   if(glyph){
    const icon=make("span","atlas-map-glyph");
    icon.innerHTML='<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">'+
      CLAUDE_SACRED_GLYPHS[glyph]+"</svg>";
    med.append(icon);
   }
  }
  label.hidden=!markerLabelVisible(zoom,selected,mode);
 }
}

function syncMap(){
 if(!state.map||!state.sourceLoaded)return;
 state.map.getSource("ao-selected-sites")?.setData(featureCollection(visibleEntries()));
 // Claude's Sacred markers are DOM medallions, TLM remains MapLibre dots.
 // No TLM schedule is imported; never express unverified Mass activity.
 for(const id of ["ao-selected-pins","ao-selected-halos","ao-selected-hit"]){
  if(state.map.getLayer(id))state.map.setLayoutProperty(id,"visibility",
   state.lens==="tlm"?"visible":"none");
 }
 updateSacredMarkers();
}
async function loadDataset(){
 const res=await fetch("./explore/selected-sites.v1.json",{cache:"no-cache"});
 if(!res.ok)throw new Error("Selected source records unavailable: "+res.status);
 const raw=await res.json();return validatedDataset(raw);
}
function ensureMapLibreCss(){
 if(document.getElementById("atlas-maplibre-css"))return;
 const css=make("link");css.id="atlas-maplibre-css";css.rel="stylesheet";
 css.href="https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.css";
 document.head.append(css);
}
let mapLibreModulePromise;
function loadMapLibre(){
 // MapLibre v6 is ES-module-only: there is no UMD maplibre-gl.js bundle.
 // This pinned import is the same published ESM distribution used by research.
 if (!mapLibreModulePromise) mapLibreModulePromise=import(MAPLIBRE_MODULE);
 return mapLibreModulePromise;
}
function mapCameraPadding(){
 // Restore Claude's PAD(): active controls above, sheet and tabbar below.
 // Measure the actual integrated Home geometry instead of assuming an
 // 84px demo tabbar or a fixed physical-device viewport.
 const map=$("atlas-map")?.getBoundingClientRect();
 const top=document.querySelector("#atlas-view .atlas-top")?.getBoundingClientRect();
 const sheet=$("atlas-sheet")?.getBoundingClientRect();
 if(!map)return {top:130,bottom:480,left:30,right:30};
 return {
  top:Math.max(0,Math.ceil((top?.bottom??map.top)-map.top))+10,
  bottom:Math.max(0,Math.ceil(map.bottom-(sheet?.top??map.bottom)))+24,
  left:30,right:30
 };
}
function moveMapToVisiblePoint(center,zoom){
 const options={center,zoom,padding:mapCameraPadding()};
 // MapLibre's reduced-motion flyTo fallback drops 'padding'. An immediate
 // jumpTo preserves both accessibility and Claude's visible camera focus.
 if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  state.map.jumpTo(options);
 else state.map.flyTo({...options,duration:650,essential:false});
}
function frameInitialLens() {
 if(!state.map || !state.sourceLoaded) return;
 const bounds=boundsForLens(state.all);
 if(!bounds)return; // Globally dispersed lenses retain the WORLD view.
 const visible=$("atlas-view");
 const sheet=$("atlas-sheet");
 const height=visible?.clientHeight||844;
 const sheetHeight=Number.parseFloat(sheet?.style.getPropertyValue("--h"))||376;
 state.map.fitBounds(bounds,{
  padding:{
   top:Math.min(180,Math.max(100,Math.round(height*.17))),
   bottom:Math.min(Math.max(160,sheetHeight+34),Math.floor(height*.65)),
   left:30,right:30
  },
  maxZoom:7,duration:0
 });
}
async function startMap(){
 ensureMapLibreCss();
 const lib=await loadMapLibre();
 if(!lib?.Map)throw new Error("MapLibre browser module unavailable");
 if(state.map){state.map.resize();return;}
 state.map=new lib.Map({
  container:"atlas-map",style:BASEMAP,
  center:WORLD.center,zoom:WORLD.zoom,minZoom:1,maxZoom:18,
  attributionControl:true,dragRotate:false,pitchWithRotate:false,
 });
 state.map.addControl(new lib.NavigationControl({showCompass:false}),"top-right");
 state.map.on("load",()=>{
  if(state.sourceLoaded)return;
  state.map.addSource("ao-selected-sites",{type:"geojson",data:featureCollection(visibleEntries())});
  state.map.addLayer({id:"ao-selected-halos",type:"circle",source:"ao-selected-sites",
   layout:{visibility:"visible"},
   paint:{"circle-radius":8,"circle-color":"rgba(170,160,145,0.08)",
    "circle-stroke-width":0}});
  state.map.addLayer({id:"ao-selected-pins",type:"circle",source:"ao-selected-sites",
   layout:{visibility:"visible"},
   paint:{"circle-radius":["interpolate",["linear"],["zoom"],1,3.2,10,4.5],
    "circle-color":"#a9a195",
    "circle-stroke-color":"#0c0f14","circle-stroke-width":1}});
  // A transparent 40px hit diameter keeps Claude's 3.2px neutral dot
  // independently touchable; it does not imply a scheduled Mass.
  state.map.addLayer({id:"ao-selected-hit",type:"circle",source:"ao-selected-sites",
   layout:{visibility:"visible"},
   paint:{"circle-radius":20,"circle-color":"#ffffff",
    "circle-opacity":0.001,"circle-stroke-width":0}});
  state.map.on("click","ao-selected-hit",ev=>{
   const id=ev.features?.[0]?.properties?.id;
   if(id)selectRecord(id,{fly:false});
  });
  state.map.on("mouseenter","ao-selected-hit",()=>state.map.getCanvas().style.cursor="pointer");
  state.map.on("mouseleave","ao-selected-hit",()=>state.map.getCanvas().style.cursor="");
  state.sourceLoaded=true;
  installSacredMarkers(lib);
  syncMap();
  state.map.on("move",updateSacredMarkers);
  setStatus(state.mapFailed?tr("unavailable"):"",state.mapFailed);
  frameInitialLens();
 });
 state.map.on("error",ev=>{
  // A failed vector tile/font may occur after MapLibre's initial 'load'.
  // Keep the existing warning visible while the local directory works.
  state.mapFailed=true;
  setStatus(tr("unavailable"),true);
  if(ev?.error)state.lastError=String(ev.error.message||ev.error);
 });
}
function attachControls(){
 // Claude's sheet snap height must be recalculated when the available
 // viewport changes after mount (rotation, browser chrome, soft keyboard).
 // Do not remount MapLibre, reset the lens, or re-frame selected places.
 const search=$("atlas-search"),atlas=$("atlas-view"),sheet=$("atlas-sheet");
 let resizeFrame=0;
 const syncViewport=()=>{
  resizeFrame=0;
  if(atlas.hidden)return;
  const vv=window.visualViewport;
  const usable=vv?Math.min(window.innerHeight,vv.height+vv.offsetTop):window.innerHeight;
  const keyboardVisible=document.activeElement===search &&
   Number.isFinite(usable)&&window.innerHeight-usable>140;
  atlas.classList.toggle("atlas-keyboard-visible",keyboardVisible);
  if(keyboardVisible)
   atlas.style.setProperty("--ao-visual-height",Math.round(usable)+"px");
  else atlas.style.removeProperty("--ao-visual-height");
  setSheetState(sheet.dataset.sheetState||"peek");
  if(state.map){state.map.resize();updateSacredMarkers();}
 };
 const scheduleViewport=()=>{
  if(resizeFrame)return;
  resizeFrame=requestAnimationFrame(syncViewport);
 };
 window.addEventListener("resize",scheduleViewport);
 window.visualViewport?.addEventListener("resize",scheduleViewport);
 window.visualViewport?.addEventListener("scroll",scheduleViewport);
 search.addEventListener("focus",scheduleViewport);
 search.addEventListener("blur",scheduleViewport);
 $("atlas-ways").addEventListener("click",event=>{
  const button=event.target.closest("button[data-atlas-facet]");
  if(!button || button.disabled)return;
  const facet=facetOptions(state.lens,state.language).find(f=>f.id===button.dataset.atlasFacet);
  if(!facet || facet.held || facet.id===state.facet)return;
  state.facet=facet.id;
  state.selectedId=null;
  $("atlas-card").hidden=true;
  $("atlas-card").replaceChildren();
  renderHeader();renderSummary();syncMap();
 });
 const handle=$("atlas-sheet-handle");
 const header=$("atlas-sheet-header");
 // Capture gestures on the stationary viewport. Capturing on the moving
 // sheet/handle can cause Chromium to cancel a long drag mid-gesture.
 const capture=$("atlas-view");
 let drag=null,lastDragAt=0;
 const start=event=>{
  if(event.button!==0||event.target.closest("button:not(#atlas-sheet-handle),a"))return;
  // Disallow native touch scrolling, dragging and text selection only on
  // the two source-authored sheet drag surfaces. Map gestures are unchanged.
  event.preventDefault();
  const current=Number.parseFloat(sheet.style.getPropertyValue("--h"))||snapHeight("peek");
  drag={y:event.clientY,h:current,moved:false};
  sheet.classList.add("drag");
  capture.setPointerCapture?.(event.pointerId);
 };
 const move=event=>{
  if(!drag)return;
  const delta=event.clientY-drag.y;
  if(Math.abs(delta)>4)drag.moved=true;
  const next=Math.max(90,Math.min(snapHeight("expanded")+30,drag.h-delta));
  sheet.style.setProperty("--h",next+"px");
  $("atlas-view").style.setProperty("--atlas-sheet-height",next+"px");
 };
 const end=()=>{
  if(!drag)return;
  const states=["min","peek","expanded"];
  let next;
  if(!drag.moved)next=sheet.dataset.sheetState==="expanded"?"peek":"expanded";
  else{
   const current=Number.parseFloat(sheet.style.getPropertyValue("--h"))||snapHeight("peek");
   next=states.reduce((best,candidate)=>
    Math.abs(snapHeight(candidate)-current)<Math.abs(snapHeight(best)-current)?
     candidate:best);
  }
  lastDragAt=Date.now();
  drag=null;sheet.classList.remove("drag");
  const before=state.viewMode;
  setSheetState(next);
  if(before!==state.viewMode){renderHeader();renderSummary();}
 };
 [handle,header].forEach(el=>el.addEventListener("pointerdown",start));
 capture.addEventListener("pointermove",move);
 capture.addEventListener("pointerup",end);
 capture.addEventListener("pointercancel",()=>{
  // A canceled gesture must not activate a different sheet state.
  if(!drag)return;
  drag=null;sheet.classList.remove("drag");
  setSheetState(sheet.dataset.sheetState);
 });
 handle.addEventListener("click",()=>{
  if(Date.now()-lastDragAt<300)return;
  const before=state.viewMode;
  setSheetState(sheet.dataset.sheetState==="expanded"?"peek":"expanded");
  if(before!==state.viewMode){renderHeader();renderSummary();}
 });
 // Nonvisual keyboard path ensures all three owner-source snap positions
 // remain accessible when browser gesture arbitration cancels long drags.
 handle.addEventListener("keydown",event=>{
  if(!["ArrowDown","ArrowUp","Home","End"].includes(event.key))return;
  event.preventDefault();
  const before=state.viewMode;
  setSheetState(event.key==="ArrowDown"||event.key==="Home"?"min":"expanded");
  if(before!==state.viewMode){renderHeader();renderSummary();}
 });
 // Tabs also support arrow-key navigation while preserving the single map.
 for(const lens of ["sacred","tlm"]){
  $("atlas-lens-"+lens).addEventListener("keydown",event=>{
   if(event.key!=="ArrowLeft"&&event.key!=="ArrowRight")return;
   event.preventDefault();
   const next=lens==="sacred"?"tlm":"sacred";
   renderLens(next);
   $("atlas-lens-"+next).focus();
  });
 }
 $("atlas-search").addEventListener("input",ev=>{
  state.query=ev.currentTarget.value;state.selectedId=null;
  $("atlas-card").hidden=true;renderSummary();syncMap();
 });
 $("atlas-near").addEventListener("click",()=>{
  // The owner prototype exposes Near me as a user-triggered action.
  // Never request precise position on mount, store it, or infer a church.
  if(!navigator.geolocation){setStatus(
    state.language==="fr"?"Localisation indisponible.":"Location unavailable.",true);return;}
  navigator.geolocation.getCurrentPosition(position=>{
    setStatus("");
    if(state.map)moveMapToVisiblePoint(
      [position.coords.longitude,position.coords.latitude],
      Math.max(9,state.map.getZoom()));
  },()=>{
    setStatus(state.language==="fr"?"Position non disponible.":"Location was not shared.",true);
  },{enableHighAccuracy:false,timeout:8000,maximumAge:60000});
 });
 $("atlas-list-toggle").addEventListener("click",()=>{
  state.viewMode=state.viewMode==="cards"?"list":"cards";
  setSheetState(state.viewMode==="list"?"expanded":"peek");
  renderHeader();renderSummary();
 });
 $("atlas-lens-sacred").addEventListener("click",()=>renderLens("sacred"));
 $("atlas-lens-tlm").addEventListener("click",()=>renderLens("tlm"));
 $("atlas-world").addEventListener("click",()=>{
  if(state.map){state.map.flyTo({center:WORLD.center,zoom:WORLD.zoom,duration:600,essential:false});}
  else $("atlas-results").focus();
 });
 $("atlas-language").addEventListener("click",()=>{
  state.language=state.language==="en"?"fr":"en";
  renderHeader();renderSummary();
  if(state.mapFailed)setStatus(tr("unavailable"),true);
  if(state.selectedId)selectRecord(state.selectedId,{fly:false});
 });
 $("atlas-results").addEventListener("click",ev=>{
  const button=ev.target.closest("button[data-atlas-id]");
  if(button)selectRecord(button.dataset.atlasId);
 });
}
export async function mountExplore(){
 if(state.initialized){
  if(state.map)requestAnimationFrame(()=>{
   state.map.resize();
   // Resuming an already-mounted Atlas after a route change must use
   // the current viewport dimensions, not the prior phone orientation.
   setSheetState($("atlas-sheet").dataset.sheetState||"peek");
   updateSacredMarkers();
  });
  return;
 }
 state.initialized=true;
 attachControls();setSheetState("peek");renderHeader();
 setStatus(tr("pending"));
 try{
  state.data=await loadDataset();
  state.all=state.data.tlm;
  renderSummary();
 }catch(e){
  setStatus("Atlas records could not be validated: "+String(e.message||e),true);
  return;
 }
 try{await startMap();}
 catch(e){state.lastError=String(e.message||e);
  state.mapFailed=true;setStatus(tr("unavailable"),true);}
}
export function exploreDebugState(){
 // Nonvisual map readiness for browser acceptance. Initial 'load' alone
 // cannot certify tiles after a later flyTo. Never alters map behaviour.
 const map=state.map;
 const moving=map?map.isMoving():false;
 const tilesLoaded=map?map.areTilesLoaded():false;
 const mapLoaded=map?map.loaded():false;
 const selected=state.selectedId?activeRecord(state.selectedId):null;
 const projected=map&&selected?map.project([
  Number(selected.geo.lng),Number(selected.geo.lat)]):null;
 return {mounted:state.initialized,sourceLoaded:state.sourceLoaded,mapCount:map?1:0,
  lens:state.lens,selectedRecords:state.all.length,
  error:state.lastError,mapFailed:state.mapFailed,
  cameraMoving:moving,tilesLoaded,mapLoaded,
  mapReady:!!map && state.sourceLoaded && !moving && tilesLoaded && mapLoaded,
  sacredMarkers:state.markers?.length||0,
  visibleSacredMarkers:(state.markers||[]).filter(o=>o.root.dataset.visible==="true").length,
  tlmTapDiameter:map?.getLayer("ao-selected-hit")?
    2*map.getPaintProperty("ao-selected-hit","circle-radius"):0,
  selectedCameraPoint:projected?{x:projected.x,y:projected.y}:null};
}
