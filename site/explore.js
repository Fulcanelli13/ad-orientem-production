/* Ad Orientem production Explore: one map, two curated lenses.
   Deliberately independent from the old research app shell and runtime. */
import {
  validatedDataset, publishable, searchEntries, featureCollection,
  sitePrecision, nearbySelected, sourceSynopsis, safeLink
} from "./explore/model.js";
import {renderSacredPlaceFallback} from "./explore/core/sacred-place-visual-fallback.js";

const $ = id => document.getElementById(id);
const MAPLIBRE_SCRIPT = "https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.js";
const BASEMAP = "https://tiles.openfreemap.org/styles/dark";
const WORLD = {center:[14,15],zoom:1.25};
const dictionary={
 en:{
  heading:"Sacred geography",subtitle:"The map for discovering · the card for deciding",
  sacred:"Sacred Atlas",tlm:"TLM Atlas",search:"Search selected places",reset:"World view",
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
  lang:"Français",place:"Place",pattern:"No live Mass time claim"
 },
 fr:{
  heading:"Géographie sacrée",subtitle:"La carte pour découvrir · la fiche pour comprendre",
  sacred:"Atlas sacré",tlm:"Atlas TLM",search:"Rechercher parmi les lieux choisis",reset:"Vue du monde",
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
  lang:"English",place:"Lieu",pattern:"Aucun horaire de messe confirmé"
 }
};
const state={
 initialized:false,lens:"sacred",language:"en",data:null,selectedId:null,
 map:null,sourceLoaded:false,loading:null,all:[],query:"",lastError:null,
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
 $("atlas-results-title").textContent=tr("list");
 $("atlas-lens-sacred").textContent=tr("sacred");
 $("atlas-lens-tlm").textContent=tr("tlm");
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
  button.setAttribute("aria-label",tr("discover")+": "+entry.name);
  button.setAttribute("aria-pressed",String(entry.id===state.selectedId));
  button.append(make("small","atlas-result-kicker",recordBadge(entry)));
  button.append(make("strong","atlas-result-name",entry.name));
  button.append(make("span","atlas-result-location",entry.address));
  li.append(button);root.append(li);
 }
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
 const close=make("button","atlas-card-close","×");close.type="button";close.setAttribute("aria-label",tr("hide"));
 close.addEventListener("click",()=>{state.selectedId=null;root.hidden=true;renderSummary();});
 top.append(type,close);root.append(top);
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
 const topOfCard=root.getBoundingClientRect().top;
 if(topOfCard>window.innerHeight*.85)root.scrollIntoView({behavior:"smooth",block:"nearest"});
 renderSummary();
 if(fly&&state.map)state.map.flyTo({center:[Number(record.geo.lng),Number(record.geo.lat)],zoom:Math.max(7,state.map.getZoom()),essential:true});
}
function renderLens(lens){
 if(lens!=="sacred"&&lens!=="tlm")return;
 state.lens=lens;state.selectedId=null;
 state.all=state.data?state.data[lens]:[];
 $("atlas-card").hidden=true;
 $("atlas-card").replaceChildren();
 renderHeader();renderSummary();syncMap();
}
function syncMap(){
 if(!state.map||!state.sourceLoaded)return;
 state.map.getSource("ao-selected-sites")?.setData(featureCollection(visibleEntries()));
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
function loadMapLibre(){
 if(window.maplibregl)return Promise.resolve(window.maplibregl);
 return new Promise((resolve,reject)=>{
  const old=document.getElementById("atlas-maplibre-js");
  if(old){old.addEventListener("load",()=>resolve(window.maplibregl),{once:true});old.addEventListener("error",reject,{once:true});return;}
  const script=make("script");script.id="atlas-maplibre-js";script.src=MAPLIBRE_SCRIPT;script.async=true;
  script.onload=()=>window.maplibregl?resolve(window.maplibregl):reject(new Error("MapLibre failed to initialize"));
  script.onerror=()=>reject(new Error("MapLibre cannot be downloaded"));
  document.head.append(script);
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
 $("atlas-search").addEventListener("input",ev=>{
  state.query=ev.currentTarget.value;state.selectedId=null;
  $("atlas-card").hidden=true;renderSummary();syncMap();
 });
 $("atlas-lens-sacred").addEventListener("click",()=>renderLens("sacred"));
 $("atlas-lens-tlm").addEventListener("click",()=>renderLens("tlm"));
 $("atlas-world").addEventListener("click",()=>{
  if(state.map){state.map.flyTo({center:WORLD.center,zoom:WORLD.zoom,essential:true});}
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
 attachControls();renderHeader();
 setStatus(tr("pending"));
 try{
  state.data=await loadDataset();
  state.all=state.data.sacred;
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
