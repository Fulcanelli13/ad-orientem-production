import { prepareApprovedSites } from './approved-site-boundary.mjs';

const $ = id => document.getElementById(id);
const accessors = Object.freeze({
  id: row => row.id,
  approved: row => row.approved === true,
  name: row => row.name,
  sourceUrl: row => row.sourceUrl,
  coordinates: row => row.coordinates,
  coordinateQuality: row => row.coordinateQuality
});
const state = {
  mode: 'tlm',
  view: 'churches',
  expanded: false,
  search: '',
  data: Object.freeze({ sites: [], pins: [], held: [] }),
  map: null,
  markers: [],
  selected: null,
  mapReady: false,
  lastFocus: null
};
const kinds = Object.freeze({
  tlm: [
    { key: 'churches', name: 'Churches' },
    { key: 'times', name: 'Mass times' },
    { key: 'institutes', name: 'Institutes' }
  ],
  sac: [
    { key: 'places', name: 'Places' },
    { key: 'pilgrimages', name: 'Pilgrimages' },
    { key: 'feasts', name: 'Feasts' }
  ]
});
const STYLE = 'https://demotiles.maplibre.org/style.json'; // REVIEW ONLY; replace with production-licensed tiles before merge.
const TILE_NOTICE = 'MapLibre demonstration basemap; not a production tile contract.';
let mapAttempt = 0;
let sheetTouchStart = null;

function text(el, value) { $(el).textContent = String(value ?? ''); }
function setMode(mode) {
  if (!Object.hasOwn(kinds,mode)) return;
  state.mode = mode;
  state.view = mode === 'tlm' ? 'churches' : 'places';
  document.querySelectorAll('[data-mode]').forEach(b => {
    const active = b.dataset.mode === mode;
    b.classList.toggle('on',active);
    b.setAttribute('aria-selected',String(active));
  });
  buildWays();render();
  // Deliberately no TLM-mode hub fit when switching into Sacred Atlas.
  updateMapPins();
}
function buildWays() {
  const holder = $('ways');
  holder.replaceChildren();
  for (const view of kinds[state.mode]) {
    const b=document.createElement('button');
    b.type='button';b.className='way'+(state.view===view.key?' on':'');
    b.dataset.view=view.key;b.textContent=view.name;
    b.setAttribute('aria-pressed',String(state.view===view.key));
    holder.append(b);
  }
}
function setView(view) {
  if (!kinds[state.mode].some(v=>v.key===view)) return;
  state.view=view; buildWays(); render();
}
function setSheet(expanded) {
  state.expanded=!!expanded;
  const max=Math.min(590,Math.floor(($('explore-app').clientHeight-84)*.70));
  $('sheet').style.setProperty('--h',state.expanded?Math.max(290,max)+'px':'220px');
  $('toggle-sheet').textContent=state.expanded?'Collapse':'Expand';
  for (const id of ['toggle-sheet','sheet-handle']) $(id).setAttribute('aria-expanded',String(state.expanded));
  if(state.mapReady) state.map.resize();
}
function emptyMessage(title,body) {
  const wrap=document.createElement('div');wrap.className='empty';
  const h=document.createElement('strong');h.textContent=title;
  const p=document.createElement('p');p.textContent=body;
  wrap.append(h,p);return wrap;
}
function labelFor(view) {return kinds[state.mode].find(x=>x.key===view)?.name??'Explore';}
function resultsForQuery(query) {
  const q=String(query||'').trim().toLocaleLowerCase();
  if(!q)return state.data.sites;
  return state.data.sites.filter(site=>site.name.toLocaleLowerCase().includes(q)||site.id.toLocaleLowerCase().includes(q));
}
function render() {
  const isTlm=state.mode==='tlm';
  const listView=(isTlm && state.view==='churches')||(!isTlm && state.view==='places');
  text('results-title',isTlm?(state.view==='churches'?'Traditional Mass nearby':labelFor(state.view)):labelFor(state.view));
  text('results-subtitle',listView?'Only approved canonical sites':state.view==='times'?'No verified schedules imported yet':'The approved registry has not provided this layer');
  const area=$('results');area.replaceChildren();
  if(!listView){
    area.append(emptyMessage(
      state.view==='times'?'Mass times not yet available':labelFor(state.view)+' not yet available',
      'This view needs source-verified metadata from the canonical registry. Prototype sample timetables and feast dates have not been imported.'
    ));
  } else {
    const sites=resultsForQuery(state.search);
    if(!sites.length){
      area.append(emptyMessage('No approved places to display',state.search?'No approved site matches that search. Try a different church, town or canonical ID.':'The production registry is empty by design. Verified locations can appear here after the Excel approval gate.'));
    } else {
      // Profiles intentionally make no unsupported TLM affiliation claim.
      const frag=document.createDocumentFragment();
      for(const site of sites){
        const b=document.createElement('button');
        b.type='button';b.className='site-card';b.dataset.siteId=site.id;
        const pin=document.createElement('span');pin.className='pin';pin.textContent='⌖';pin.setAttribute('aria-hidden','true');
        const info=document.createElement('span');info.className='info';
        const name=document.createElement('b');name.textContent=site.name;
        const id=document.createElement('small');id.textContent='Canonical ID · '+site.id;
        const arrow=document.createElement('span');arrow.className='arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
        info.append(name,id);b.append(pin,info,arrow);frag.append(b);
      }
      area.append(frag);
    }
  }
  const n=document.createElement('p');
  n.className='source-note';n.textContent='Site affiliations, Mass times, feast dates and photographs require separate source approval.';
  area.append(n);
}
function showOverlay(id,focusEl) {
  state.lastFocus=document.activeElement;
  const e=$(id);e.hidden=false;
  if(focusEl)requestAnimationFrame(()=>$(focusEl).focus());
}
function closeOverlay(id) {
  $(id).hidden=true;
  if(state.lastFocus?.isConnected)state.lastFocus.focus();
}
function openSearch() {
  text('search-input','');
  $('search-input').value=state.search;
  renderSearch();
  showOverlay('search-panel','search-input');
}
function renderSearch() {
  const pane=$('search-results');pane.replaceChildren();
  const q=$('search-input').value.trim().toLocaleLowerCase();
  if(!q){
    pane.append(emptyMessage('Search the canonical registry','Enter a place name, town or CL2 site ID. Search does not depend on the map zoom.'));
    return;
  }
  const hits=resultsForQuery(q);
  if(!hits.length){pane.append(emptyMessage('No approved results','There are no approved matching entries. Sample French records are intentionally excluded.'));return;}
  for(const site of hits){
    const b=document.createElement('button');b.type='button';b.className='search-hit';b.dataset.searchSiteId=site.id;
    const label=document.createElement('b');label.textContent=site.name;
    const caption=document.createElement('small');caption.textContent=site.id+' · source linked';
    b.append(label,caption);pane.append(b);
  }
}
function locateSite(id) {
  const site=state.data.sites.find(x=>x.id===id);
  if(!site)return;
  state.selected=site;
  const area=$('place-profile');area.replaceChildren();
  const h=document.createElement('h3');h.textContent=site.name;area.append(h);
  const dl=document.createElement('dl');
  const field=(name,value)=>{
    const dt=document.createElement('dt');dt.textContent=name;
    const dd=document.createElement('dd');
    if(value instanceof Node)dd.append(value);else dd.textContent=String(value);
    dl.append(dt,dd);
  };
  field('Canonical ID',site.id);
  const pin=state.data.pins.find(p=>p.siteId===id);
  field('Map location',pin?(pin.coordinateQuality==='verified'?'Verified coordinates':'Illustrative area pin'):'No approved coordinates');
  const source=document.createElement('a');source.href=site.sourceUrl;source.target='_blank';source.rel='noopener noreferrer';source.textContent='View source record';
  field('Evidence',source);area.append(dl);
  if(pin){
    const locate=document.createElement('button');locate.className='pill';locate.type='button';locate.textContent=pin.coordinateQuality==='verified'?'Locate on map':'View illustrative map area';
    locate.addEventListener('click',()=>{
      closeOverlay('place-panel');
      if(state.mapReady)state.map.flyTo({center:[pin.lon,pin.lat],zoom:pin.coordinateQuality==='verified'?12:8,duration:650});
    });area.append(locate);
  }
  const note=document.createElement('p');note.className='warning';note.textContent='A pin is for discovery, not a guarantee of a GPS entrance. Verify the source before travel.';area.append(note);
  showOverlay('place-panel','close-place');
}
function mapPadding() {
  const app=$('explore-app');
  return {top:Math.min(160,app.clientHeight*.23),bottom:(state.expanded?Math.min(590,app.clientHeight*.7):220)+105,left:28,right:28};
}
function updateMapPins(){
  for(const m of state.markers)m.remove();
  state.markers=[];
  if(!state.mapReady)return;
  for(const pin of state.data.pins){
    const el=document.createElement('button');
    el.type='button';el.className='pin-marker';el.textContent='⌖';
    el.title=pin.name+(pin.coordinateQuality==='illustrative'?' (illustrative area)':'');
    el.setAttribute('aria-label',el.title);
    el.addEventListener('click',()=>locateSite(pin.siteId));
    const marker=new window.maplibregl.Marker({element:el}).setLngLat([pin.lon,pin.lat]).addTo(state.map);
    state.markers.push(marker);
  }
}
function showMapFallback(){
  $('map-fallback').hidden=false;state.mapReady=false;
}
function hideMapFallback(){ $('map-fallback').hidden=true; }
function loadMapLibre(){
  return new Promise((resolve,reject)=>{
    if(window.maplibregl){resolve();return;}
    if(document.querySelector('script[data-maplibre]')) {reject(new Error('Map library already loading'));return;}
    const s=document.createElement('script');s.dataset.maplibre='1';
    s.src='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';s.async=true;
    const limit=setTimeout(()=>{s.remove();reject(new Error('Map library timeout'));},9000);
    s.onload=()=>{clearTimeout(limit);resolve();};
    s.onerror=()=>{clearTimeout(limit);reject(new Error('Map library unavailable'));};
    document.head.append(s);
  });
}
async function startMap(){
  const attempt=++mapAttempt;
  if(state.map){state.map.remove();state.map=null;}
  state.mapReady=false;
  if(!('WebGLRenderingContext' in window)){showMapFallback();return;}
  try{
    await loadMapLibre();
    if(attempt!==mapAttempt)return;
    // REVIEW-ONLY public demo style; never substitute for a licensed production basemap.
    const map=new window.maplibregl.Map({
      container:'map',style:STYLE,
      center:[0,22],zoom:1.35,minZoom:1,
      attributionControl:true,dragRotate:false,touchPitch:false
    });
    state.map=map;
    map.on('load',()=>{
      if(attempt!==mapAttempt)return;
      state.mapReady=true;hideMapFallback();updateMapPins();
    });
    map.on('error',e=>{
      // Keep the interface functional if the demo tile endpoint is unavailable.
      if(!state.mapReady)showMapFallback();
      console.warn('Explore map render error:',e?.error?.message||e);
    });
  } catch(err){showMapFallback();console.warn('Explore map setup:',err.message);}
}
function zoom(amount){if(state.mapReady)state.map.zoomTo(state.map.getZoom()+amount,{duration:350});}
function nearMe(){
  if(!navigator.geolocation){alert('Geolocation is unavailable in this browser.');return;}
  navigator.geolocation.getCurrentPosition(
    p=>{if(state.mapReady)state.map.flyTo({center:[p.coords.longitude,p.coords.latitude],zoom:10,duration:800});else alert('Your location is available, but the map is offline.');},
    ()=>alert('Location permission was declined or location could not be retrieved.'),
    {enableHighAccuracy:false,timeout:6000,maximumAge:120000}
  );
}
async function loadRegistry(){
  try{
    const response=await fetch('./approved-sites.json',{cache:'no-store'});
    if(!response.ok)throw new Error('Canonical registry unavailable');
    const json=await response.json();
    if(json.schema!=='ao.explore.approved-sites.v1'||!Array.isArray(json.sites))throw new Error('Unexpected canonical registry format');
    state.data=prepareApprovedSites(json.sites,accessors);
  }catch(err){
    state.data=Object.freeze({sites:[],pins:[],held:[]});
    console.warn('Explore canonical registry:',err.message);
  }
  buildWays();render();updateMapPins();
}
document.addEventListener('click',e=>{
  const b=e.target.closest('button');
  if(!b)return;
  if(b.dataset.mode){setMode(b.dataset.mode);return;}
  if(b.dataset.view){setView(b.dataset.view);return;}
  if(b.dataset.siteId){locateSite(b.dataset.siteId);return;}
  if(b.dataset.searchSiteId){const id=b.dataset.searchSiteId;closeOverlay('search-panel');locateSite(id);return;}
});
$('open-search').addEventListener('click',openSearch);
$('close-search').addEventListener('click',()=>closeOverlay('search-panel'));
$('close-place').addEventListener('click',()=>closeOverlay('place-panel'));
$('search-input').addEventListener('input',renderSearch);
$('search-input').addEventListener('keydown',e=>{if(e.key==='Escape')closeOverlay('search-panel');});
$('sheet-handle').addEventListener('click',()=>setSheet(!state.expanded));
$('toggle-sheet').addEventListener('click',()=>setSheet(!state.expanded));
$('sheet').addEventListener('touchstart',e=>{sheetTouchStart=e.touches[0]?.clientY??null;},{passive:true});
$('sheet').addEventListener('touchend',e=>{
  if(sheetTouchStart===null)return;
  const delta=(e.changedTouches[0]?.clientY??sheetTouchStart)-sheetTouchStart;
  if(Math.abs(delta)>65)setSheet(delta<0);
  sheetTouchStart=null;
},{passive:true});
$('zoom-in').addEventListener('click',()=>zoom(1));
$('zoom-out').addEventListener('click',()=>zoom(-1));
$('reset-view').addEventListener('click',()=>{if(state.mapReady)state.map.flyTo({center:[0,22],zoom:1.35,duration:700});});
$('near').addEventListener('click',nearMe);
$('where').addEventListener('click',()=>{if(state.mapReady)state.map.flyTo({center:[0,22],zoom:1.35,duration:700});});
$('map-retry').addEventListener('click',startMap);
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(!$('place-panel').hidden)closeOverlay('place-panel');
  else if(!$('search-panel').hidden)closeOverlay('search-panel');
});
window.addEventListener('resize',()=>{if(state.mapReady)state.map.resize();});
setSheet(false);
loadRegistry();
startMap();
// Debug surface intentionally absent: users cannot inject or persist unapproved records.
