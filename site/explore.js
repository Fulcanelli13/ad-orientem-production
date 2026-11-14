/* Ad Orientem production Explore: one map, two curated lenses.
   Deliberately independent from the old research app shell and runtime. */
import {
  validatedDataset, publishable, searchEntries, featureCollection,
  sitePrecision, nearbySelected, sourceSynopsis, safeLink
} from "./explore/model.js";
import {renderSacredPlaceFallback} from "./explore/core/sacred-place-visual-fallback.js";
import {CLAUDE_MAP_STYLE} from "./explore/claude-map-style.js";

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
 map:null,sourceLoaded:false,loading:null,all:[],query:"",viewMode:"cards",lastError:null,
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
 return searchEntries(state.all,state.query);
}
function activeRecord(id){
 return state.all.find(row=>row.id===id)||null;
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
 const keys=state.lens==="tlm"?["churchWay","massWay"]:["placeWay","pilgrimWay","feastWay"];
 keys.forEach((key,index)=>{
  const el=make("span","atlas-way"+(index===0?" active":" withheld"),tr(key));
  if(index!==0){el.setAttribute("aria-disabled","true");el.title=tr("notImported");}
  ways.append(el);
 });
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
  const li=make("li","atlas-result");
  const button=make("button","atlas-result-button");
  button.type="button";button.dataset.atlasId=entry.id;
  button.setAttribute("aria-label",tr("openFolio")+": "+entry.name);
  button.setAttribute("aria-pressed",String(entry.id===state.selectedId));
  const media=make("span","atlas-result-media");
  // Exact-site approved imagery has not been transferred. No demo photographs.
  media.innerHTML=renderSacredPlaceFallback(
    {place_type:entry.place_type||"church"},state.language,"preview");
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
 const bottom=document.querySelector(".tabbar")?.getBoundingClientRect().height||79;
 const contentHeight=Math.max(200,available-bottom);
 return stateName==="min"?150:stateName==="expanded"?Math.round(contentHeight*.62):376;
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
function selectRecord(id,{fly=true}={}){
 const record=activeRecord(id);if(!record)return;
 state.selectedId=record.id;
 const root=$("atlas-card");root.hidden=false;root.replaceChildren();
 const top=make("div","atlas-card-heading");
 const type=make("span","atlas-card-type",recordBadge(record));
 const folioMeta=make("div","atlas-card-meta");
 folioMeta.append(make("span","atlas-folio-kicker","LIBER LOCORUM"),type);
 const close=make("button","atlas-card-close","×");close.type="button";close.setAttribute("aria-label",tr("hide"));
 close.addEventListener("click",()=>{state.selectedId=null;root.hidden=true;renderSummary();$("atlas-sheet-handle").focus({preventScroll:true});});
 top.append(folioMeta,close);root.append(top);
 root.append(make("h2","atlas-card-title",record.name));
 const figure=make("div","atlas-card-media");
 // This SVG belongs to the source-owned no-photo fallback, not an approved photograph.
 figure.innerHTML=renderSacredPlaceFallback({place_type:record.place_type||"church"},state.language,"preview");
 root.append(figure);
 appendLabel(root,tr("place"),record.address);
 appendLabel(root,tr("method"),sitePrecision(record,state.language));
 const synopsis=sourceSynopsis(record,state.language);
 if(synopsis)root.append(make("p","atlas-card-synopsis",synopsis));
 if(record.geo.locator_note)root.append(make("p","atlas-card-caution",record.geo.locator_note));
 const links=make("div","atlas-source-links");
 const source=external(record.geo.source_url,tr("source"),"atlas-source-link");
 if(source)links.append(source);
 if(record.community_id==="ICKSP"){
  const official=external(record.official_url,tr("official"),"atlas-source-link primary");
  if(official)links.prepend(official);
 }
 if(links.childElementCount)root.append(links);
 root.append(make("p","atlas-card-remark",record.community_id==="ICKSP"?tr("tnotice"):tr("noPhoto")));
 if(state.lens==="sacred"){
  const nearby=nearbySelected(record,state.all,3);
  if(nearby.length){
   const section=make("section","atlas-nearby");
   section.append(make("h3","",tr("nearby")));
   for(const next of nearby){
    const b=make("button","atlas-nearby-button",next.title+" · "+next.distance_km+" km");
    b.type="button";b.addEventListener("click",()=>selectRecord(next.place_id));
    section.append(b);
   }
   root.append(section);
  }
 }
 root.scrollTop=0;
 renderSummary();
 if(fly&&state.map)state.map.flyTo({center:[Number(record.geo.lng),Number(record.geo.lat)],zoom:Math.max(7,state.map.getZoom()),duration:650,essential:false});
}
function renderLens(lens){
 if(lens!=="sacred"&&lens!=="tlm")return;
 state.lens=lens;state.selectedId=null;
 state.viewMode="cards";setSheetState("peek");
 state.all=state.data?state.data[lens]:[];
 $("atlas-card").hidden=true;
 $("atlas-card").replaceChildren();
 renderHeader();renderSummary();syncMap();
}
function syncMap(){
 if(!state.map||!state.sourceLoaded)return;
 state.map.getSource("ao-selected-sites")?.setData(featureCollection(visibleEntries()));
 // Reuse the one map/source, but make the active lens visibly distinct.
 if(state.map.getLayer("ao-selected-pins"))
  state.map.setPaintProperty("ao-selected-pins","circle-color",
   state.lens==="sacred"?"#c9ad78":"#e6d8b4");
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
   paint:{"circle-radius":11,"circle-color":"rgba(201,173,120,.14)",
    "circle-stroke-width":0}});
  state.map.addLayer({id:"ao-selected-pins",type:"circle",source:"ao-selected-sites",
   paint:{"circle-radius":["interpolate",["linear"],["zoom"],1,5,8,8],
    "circle-color":state.lens==="sacred"?"#c9ad78":"#e6d8b4",
    "circle-stroke-color":"#131c27","circle-stroke-width":2}});
  state.map.on("click","ao-selected-pins",ev=>{
   const id=ev.features?.[0]?.properties?.id;
   if(id)selectRecord(id,{fly:false});
  });
  state.map.on("mouseenter","ao-selected-pins",()=>state.map.getCanvas().style.cursor="pointer");
  state.map.on("mouseleave","ao-selected-pins",()=>state.map.getCanvas().style.cursor="");
  state.sourceLoaded=true;setStatus("");
 });
 state.map.on("error",ev=>{
  if(!state.sourceLoaded)setStatus(tr("unavailable"),true);
  if(ev?.error)state.lastError=String(ev.error.message||ev.error);
 });
}
function attachControls(){
 const handle=$("atlas-sheet-handle");
 const sheet=$("atlas-sheet"),header=$("atlas-sheet-header");
 let drag=null,lastDragAt=0;
 const start=event=>{
  if(event.button!==0||event.target.closest("button:not(#atlas-sheet-handle),a"))return;
  const current=Number.parseFloat(sheet.style.getPropertyValue("--h"))||snapHeight("peek");
  drag={y:event.clientY,h:current,moved:false};
  sheet.classList.add("drag");
  event.currentTarget.setPointerCapture?.(event.pointerId);
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
 [handle,header].forEach(el=>{
  el.addEventListener("pointerdown",start);
  el.addEventListener("pointermove",move);
  el.addEventListener("pointerup",end);
  el.addEventListener("pointercancel",end);
 });
 handle.addEventListener("click",()=>{
  if(Date.now()-lastDragAt<300)return;
  const before=state.viewMode;
  setSheetState(sheet.dataset.sheetState==="expanded"?"peek":"expanded");
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
    if(state.map)state.map.flyTo({
      center:[position.coords.longitude,position.coords.latitude],
      zoom:Math.max(9,state.map.getZoom()),duration:650,essential:false
    });
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
  if(state.selectedId)selectRecord(state.selectedId,{fly:false});
 });
 $("atlas-results").addEventListener("click",ev=>{
  const button=ev.target.closest("button[data-atlas-id]");
  if(button)selectRecord(button.dataset.atlasId);
 });
}
export async function mountExplore(){
 if(state.initialized){
  if(state.map)requestAnimationFrame(()=>state.map.resize());
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
 catch(e){state.lastError=String(e.message||e);setStatus(tr("unavailable"),true);}
}
export function exploreDebugState(){
 return {mounted:state.initialized,sourceLoaded:state.sourceLoaded,mapCount:state.map?1:0,
  lens:state.lens,selectedRecords:state.all.length,error:state.lastError};
}
