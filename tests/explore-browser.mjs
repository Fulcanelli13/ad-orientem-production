// Real headless browser acceptance for the clean production Atlas branch.
// Never runs on a deployment trigger: GitHub PR review only.
import {createServer} from "node:http";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {resolve,extname,join} from "node:path";
import {chromium} from "playwright";
import assert from "node:assert/strict";

const base=resolve("site");
const contentType={".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
  ".jpg":"image/jpeg",".png":"image/png",".svg":"image/svg+xml",".webp":"image/webp"};
const server=createServer((req,res)=>{
 try{
  let pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  if(pathname==="/")pathname="/index.html";
  const path=resolve(base,"."+pathname);
  if(!path.startsWith(base+"/")||!existsSync(path)){
   res.writeHead(404);res.end("Not found");return;
  }
  res.writeHead(200,{"Content-Type":contentType[extname(path)]||"application/octet-stream",
    "Cache-Control":"no-cache"});
  res.end(readFileSync(path));
 }catch(e){res.writeHead(500);res.end(String(e.message||e));}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const port=server.address().port;
mkdirSync("artifacts/production-explore",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const outcomes=[];
try{
 for(const width of [320,390,430,1440]){
  const height=width===1440?900:780;
  const context=await browser.newContext({
   viewport:{width,height},reducedMotion:"reduce",locale:"en-US",
   deviceScaleFactor:1,ignoreHTTPSErrors:false});
  const page=await context.newPage(),errors=[];
  const tileNetwork={ok:0,httpErrors:[],failed:[]};
  page.on("pageerror",error=>errors.push(String(error.message||error)));
  page.on("response",response=>{
    if(!response.url().includes("tiles.openfreemap.org"))return;
    if(response.status()>=400)tileNetwork.httpErrors.push(
      response.status()+" "+response.url());
    else if(response.url().includes("/planet/"))tileNetwork.ok++;
  });
  page.on("requestfailed",request=>{
    if(request.url().includes("tiles.openfreemap.org") &&
       !/ERR_ABORTED/.test(request.failure()?.errorText||""))
      tileNetwork.failed.push((request.failure()?.errorText||"unknown")+
        " "+request.url());
  });
  const mapSnapshot=()=>page.evaluate(async()=>{
    const {exploreDebugState}=await import("./explore.js");
    return exploreDebugState();
  });
  const waitForMapReady=async label=>{
    try{
      await page.waitForFunction(async()=>{
        const {exploreDebugState}=await import("./explore.js");
        return exploreDebugState().mapReady;
      },null,{timeout:30000,polling:125});
      // The state check may precede the browser compositor by a frame.
      await page.evaluate(()=>new Promise(resolve=>
        requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    }catch(error){
      const diagnostic={label,state:await mapSnapshot(),tileNetwork};
      throw new Error("Map tiles/camera did not settle for "+width+
        "px "+JSON.stringify(diagnostic)+"; "+String(error.message||error));
    }
  };
  const assertSelectedPinInVisibleMap=async label=>{
    await waitForMapReady("visible-focus-"+label);
    const f=await page.evaluate(async()=>{
      const {exploreDebugState}=await import("./explore.js");
      const point=exploreDebugState().selectedCameraPoint;
      const map=document.getElementById("atlas-map").getBoundingClientRect();
      const top=document.querySelector("#atlas-view .atlas-top").getBoundingClientRect();
      const sheet=document.getElementById("atlas-sheet").getBoundingClientRect();
      return {point,top:top.bottom-map.top+8,bottom:sheet.top-map.top-23,
        left:30,right:map.width-30};
    });
    assert.ok(f.point && f.point.x>f.left && f.point.x<f.right &&
      f.point.y>f.top && f.point.y<f.bottom,
      "Selected "+label+" pin remains behind top controls or bottom sheet "+
      width+"px: "+JSON.stringify(f));
  };
  await page.goto("http://127.0.0.1:"+port+"/",{waitUntil:"domcontentloaded"});
  await page.locator('[data-route="atlas"]').first().click();
  await page.locator("#atlas-view").waitFor({state:"visible"});
  await page.waitForFunction(()=>document.querySelector("#atlas-count")?.textContent==="10 / 10",
   null,{timeout:20000});
  assert.equal(await page.locator("#atlas-lens-tlm").getAttribute("aria-selected"),"true",
    "Claude source opens with TLM Atlas first");
  // Approved-source type filters must change cards AND GeoJSON, never invent services.
  await page.locator('#atlas-ways button[data-atlas-facet="oratory"]').click();
  assert.equal(await page.locator("#atlas-count").textContent(),"9 / 10",
    "Exact nine source-typed oratories should be selected");
  assert.equal(await page.locator("#atlas-results > li").count(),9);
  await page.locator('#atlas-ways button[data-atlas-facet="all"]').click();
  assert.equal(await page.locator("#atlas-count").textContent(),"10 / 10");
  assert.equal(await page.locator('#atlas-ways button[data-atlas-facet="times"]').isDisabled(),true,
    "Missing Mass-time data must remain unavailable");
  await page.locator("#atlas-lens-sacred").click();
  await page.waitForFunction(()=>document.querySelector("#atlas-count")?.textContent==="18 / 18",
   null,{timeout:15000});
  await page.locator('#atlas-ways button[data-atlas-facet="shrine"]').click();
  assert.equal(await page.locator("#atlas-count").textContent(),"7 / 18",
    "Only the seven source-typed shrines belong in this category");
  assert.equal(await page.locator("#atlas-results > li").count(),7);
  await page.locator('#atlas-ways button[data-atlas-facet="all"]').click();
  assert.equal(await page.locator("#atlas-count").textContent(),"18 / 18");
  assert.equal(await page.locator('#atlas-ways button[data-atlas-facet="feasts"]').isDisabled(),true,
    "Unimported feast layer cannot be activated");
  await page.waitForFunction(()=>document.querySelectorAll("#atlas-map canvas").length===1,
   null,{timeout:30000});
  // Canvas allocation alone does not imply that tiles and source-backed pins
  // are ready. The "load" event hides this status only after adding GeoJSON.
  await page.waitForFunction(()=>document.getElementById("atlas-map-status")?.hidden===true,
   null,{timeout:30000});
  // The 'load' status reports initial source creation, not tiles after pan.
  await waitForMapReady("initial-mapped-lens");
  assert.equal(await page.locator(".atlas-switch > button").count(),2,"Exactly two top-level Atlases");
  assert.equal(await page.locator(".tabbar > button").count(),4,"Exactly four original bottom tabs");
  assert.equal(await page.locator("#atlas-results > li").count(),18);
  assert.equal(await page.locator("#atlas-map .atlas-place-marker").count(),18,
    "Claude's 18 exact-source Sacred medallions must be anchored to one map");
  // Search must update the rendered Sacred marker overlay, not only the
  // carousel or the old MapLibre GeoJSON source underneath it.
  const visibleMarkerId=await page.locator(
    "#atlas-map .atlas-place-marker[data-visible='true']").first()
    .getAttribute("data-atlas-marker-id");
  assert.ok(visibleMarkerId,"Need a source marker already in the current map camera");
  const visibleMarkerName=await page.locator(
    '#atlas-results button[data-atlas-id="'+visibleMarkerId+'"] .atlas-result-name'
  ).innerText();
  await page.locator("#atlas-search").fill(visibleMarkerName);
  assert.equal(await page.locator("#atlas-count").textContent(),"1 / 18");
  assert.equal(await page.locator("#atlas-map .atlas-place-marker[data-visible='true']").count(),1,
    "Source text search must leave exactly one visible Sacred marker");
  assert.equal(await page.locator(
    '#atlas-map .atlas-place-marker[data-atlas-marker-id="'+visibleMarkerId+'"]'
  ).getAttribute("data-visible"),"true");
  await page.locator("#atlas-search").fill("");
  assert.equal(await page.locator("#atlas-count").textContent(),"18 / 18");
  assert.equal(await page.locator("#atlas-map .atlas-place-marker[data-visible='true']").count()>0,true,
    "At least one selected source marker must be visible in the current lens");
  const hitTargets=await page.locator(
    "#atlas-map .atlas-place-marker[data-visible='true']").evaluateAll(nodes=>
    nodes.map(el=>{
      const r=el.getBoundingClientRect();
      return {id:el.dataset.atlasMarkerId,mode:el.dataset.mode,
        visual:parseFloat(el.style.getPropertyValue("--ao-marker-size")),
        hit:parseFloat(el.style.getPropertyValue("--ao-marker-hit-size")),
        rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,
          width:r.width,height:r.height}};
    }));
  assert.ok(hitTargets.length>0,"Sacred Atlas must retain visible markers");
  for(const [i,hit] of hitTargets.entries()){
    const expectedVisual=hit.mode==="dot"?7:hit.mode==="sm"?22:52;
    assert.equal(hit.visual,expectedVisual,
      "Do not alter Claude's original visible marker diameter: "+JSON.stringify(hit));
    assert.ok(hit.hit>=44&&Math.abs(hit.rect.width-hit.hit)<1&&
      Math.abs(hit.rect.height-hit.hit)<1,
      "Visible and CSS hit footprints disagree: "+JSON.stringify(hit));
    for(const other of hitTargets.slice(i+1)){
      const overlaps=hit.rect.left<other.rect.right&&hit.rect.right>other.rect.left&&
        hit.rect.top<other.rect.bottom&&hit.rect.bottom>other.rect.top;
      assert.equal(overlaps,false,
        "Overlapping invisible Sacred tap regions: "+hit.id+" / "+other.id);
    }
  }
  assert.equal((await mapSnapshot()).tlmTapDiameter,40,
    "Source-neutral TLM dots retain a 40px invisible pointer target");
  assert.equal(await page.locator("#atlas-results .atlas-result--photo").count(),6,
    "Only the six owner-selected photos may replace placeholder cards");
  const dom=await page.evaluate(()=>{
    const rect=id=>document.getElementById(id).getBoundingClientRect();
    const css=id=>getComputedStyle(document.getElementById(id));
    const world=rect("atlas-world"),sheet=rect("atlas-sheet");
    const result=rect("atlas-results"),map=rect("atlas-map"),toolbar=rect("atlas-search");
    const at=document.elementFromPoint((world.left+world.right)/2,(world.top+world.bottom)/2);
    return {
      horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
      mapCount:document.querySelectorAll("#atlas-map canvas").length,
      worldHeight:world.height,mapHeight:map.height,mapWidth:map.width,
      frameHeight:rect("atlas-view").height,toolbarBottom:toolbar.bottom,
      sheetTop:sheet.top,sheetHeight:sheet.height,
      sheetState:document.getElementById("atlas-sheet").dataset.sheetState,
      railOverflow:document.getElementById("atlas-results").scrollWidth-document.getElementById("atlas-results").clientWidth,
      railSnap:css("atlas-results").scrollSnapType,
      worldClickable:at===document.getElementById("atlas-world") ||
        document.getElementById("atlas-world").contains(at),
      claudeOrder:[...document.querySelectorAll("#atlas-lens-tlm,#atlas-lens-sacred")].map(el=>el.id),
      searchRect:(()=>{const r=rect("atlas-search");return {top:r.top,bottom:r.bottom}})(),
      tabRect:(()=>{const r=rect("atlas-lens-tlm");return {top:r.top,bottom:r.bottom}})(),
      sheetDockGap:Math.abs(document.querySelector(".tabbar").getBoundingClientRect().top -
        rect("atlas-sheet").bottom),
      sourceCardHeight:document.querySelector("#atlas-results .atlas-result-button")?.getBoundingClientRect().height,
      sheetCorners:(()=>{const style=css("atlas-sheet");return {
        topLeft:style.borderTopLeftRadius,topRight:style.borderTopRightRadius,
        bottomLeft:style.borderBottomLeftRadius,bottomRight:style.borderBottomRightRadius
      }})(),
      attribution:Boolean(document.querySelector("#atlas-map .maplibregl-ctrl-attrib")),
      attributionCompact:document.querySelector("#atlas-map .maplibregl-ctrl-attrib")
        ?.classList.contains("maplibregl-compact"),
      attributionText:document.querySelector("#atlas-map .maplibregl-ctrl-attrib")?.textContent||"",
      attributionToggle:(()=>{
        const button=document.querySelector("#atlas-map .maplibregl-ctrl-attrib-button");
        if(!button)return null;
        const r=button.getBoundingClientRect();
        const target=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
        return {width:r.width,height:r.height,
          reachable:target===button||button.contains(target)};
      })(),
      zoomButtons:document.querySelectorAll(
        "#atlas-map .maplibregl-ctrl-zoom-in,#atlas-map .maplibregl-ctrl-zoom-out").length
    };
  });
  assert.ok(dom.horizontalOverflow<=1,width+"px overflow: "+JSON.stringify(dom));
  assert.equal(dom.mapCount,1);
  assert.ok(dom.mapHeight>=height*.70&&dom.mapWidth>=Math.min(width,430)*.90&&dom.worldHeight>=25,
    width+"px map must fill the atlas frame: "+JSON.stringify(dom));
  assert.ok(dom.sheetTop>dom.toolbarBottom+16&&dom.sheetHeight>=175,
    width+"px sheet covers floating map controls: "+JSON.stringify(dom));
  assert.deepEqual(dom.claudeOrder,["atlas-lens-tlm","atlas-lens-sacred"]);
  assert.ok(dom.searchRect.bottom<=dom.tabRect.top+2,
    width+"px search must precede tabs as in Claude source: "+JSON.stringify(dom));
  assert.ok(dom.sheetDockGap<=2,
    width+"px Claude bottom sheet must dock directly above Home tabbar: "+JSON.stringify(dom));
  assert.ok(Math.abs(dom.sourceCardHeight-226)<=2,
    width+"px Claude source card height must be 226px: "+JSON.stringify(dom));
  assert.deepEqual(dom.sheetCorners,{topLeft:"24px",topRight:"24px",
    bottomLeft:"0px",bottomRight:"0px"},
    width+"px sheet corners must match owner source, not a floating island");
  assert.equal(dom.sheetState,"peek");
  assert.ok(dom.railOverflow>20&&dom.railSnap.includes("x"),
    width+"px place cards cannot swipe horizontally: "+JSON.stringify(dom));
  assert.ok(dom.worldClickable,width+"px World View is obstructed: "+JSON.stringify(dom));
  assert.ok(dom.attribution,"Source map attribution control missing");
  assert.match(dom.attributionText,/OpenStreetMap/i,
    width+"px rendered map must credit OpenStreetMap contributors");
  assert.match(dom.attributionText,/OpenMapTiles/i,
    width+"px rendered map must credit OpenMapTiles");
  assert.equal(dom.zoomButtons,0,
    width+"px unexpected white zoom buttons: Claude uses map gestures only");
  assert.equal(dom.attributionCompact,true,
    width+"px source requires MapLibre's compact information control");
  assert.ok(dom.attributionToggle?.width>=20 && dom.attributionToggle?.reachable,
    width+"px compact attribution info must remain tappable: "+JSON.stringify(dom));
  const rail=page.locator("#atlas-results");
  const railMoved=await rail.evaluate(el=>{
    el.scrollLeft=el.clientWidth;
    const moved=el.scrollLeft>12;
    el.scrollLeft=0;
    return moved;
  });
  assert.equal(railMoved,true,width+"px horizontally swipeable card rail did not scroll");
  const handle=page.locator("#atlas-sheet-handle");
  await handle.click();
  assert.equal(await page.locator("#atlas-sheet").getAttribute("data-sheet-state"),"expanded");
  assert.equal(await handle.getAttribute("aria-expanded"),"true");
  assert.ok(await page.locator("#atlas-results").evaluate(el=>el.classList.contains("is-list")),
    "Claude expanded mode must present a real vertically scrollable list");
  await page.screenshot({path:join("artifacts/production-explore",width+"-en-sacred-list.png"),
    animations:"disabled",fullPage:false});
  await handle.click();
  assert.equal(await page.locator("#atlas-sheet").getAttribute("data-sheet-state"),"peek");
  if(width===320){
    // Verify the original short source gestures, then the 150px long
    // downward drag while the stationary viewport owns pointer capture.
    await page.waitForFunction(()=>Math.abs(document.getElementById("atlas-sheet")
      .getBoundingClientRect().height-376)<2,null,{timeout:3500});
    const start=await handle.boundingBox();
    const x=start.x+start.width/2,y=start.y+start.height/2;
    await page.mouse.move(x,y);
    await page.mouse.down();
    await page.mouse.move(x,y-68,{steps:4});
    await page.mouse.up();
    assert.equal(await page.locator("#atlas-sheet").getAttribute("data-sheet-state"),"expanded",
      "Short upward pointer drag must expand Claude sheet");
    await page.waitForTimeout(450);
    await handle.hover();
    const exp=await handle.boundingBox();
    const xx=exp.x+exp.width/2,yy=exp.y+exp.height/2;
    await page.mouse.down();
    await page.mouse.move(xx,yy+68,{steps:4});
    await page.mouse.up();
    assert.equal(await page.locator("#atlas-sheet").getAttribute("data-sheet-state"),"peek",
      "Short downward pointer drag must restore Claude peek sheet");
    await page.waitForFunction(()=>Math.abs(document.getElementById("atlas-sheet")
      .getBoundingClientRect().height-376)<2,null,{timeout:3500});
    await handle.hover();
    const long=await handle.boundingBox();
    const lx=long.x+long.width/2,ly=long.y+long.height/2;
    await page.mouse.down();
    await page.mouse.move(lx,ly+240,{steps:6});
    await page.mouse.up();
    const longState=await page.locator("#atlas-sheet").evaluate(el=>({
      state:el.dataset.sheetState,
      height:parseFloat(el.style.getPropertyValue("--h"))
    }));
    assert.equal(longState.state,"min",
      "Long downward drag must reach Claude 150px minimum: "+JSON.stringify(longState));
    assert.equal(longState.height,150);
    await handle.focus();
    await page.keyboard.press("ArrowDown");
    const minState=await page.locator("#atlas-sheet").evaluate(el=>({
      state:el.dataset.sheetState,height:parseFloat(el.style.getPropertyValue("--h"))
    }));
    assert.equal(minState.state,"min","Accessible Claude 150px minimum sheet state");
    assert.equal(minState.height,150,"Claude min snap CSS variable must be 150px");
    await page.keyboard.press("ArrowUp");
    assert.equal(await page.locator("#atlas-sheet").getAttribute("data-sheet-state"),"expanded");
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.locator("#atlas-sheet").getAttribute("data-sheet-state"),"min");
    await handle.click();
    assert.equal(await page.locator("#atlas-sheet").getAttribute("data-sheet-state"),"expanded");
    await handle.click();
    assert.equal(await page.locator("#atlas-sheet").getAttribute("data-sheet-state"),"peek");
  }
  // The earlier search filter test leaves keyboard focus in the field.
  // Capture the standard, unfocused Claude view without suppressing the
  // accessible focus outline used when a user actively types.
  await page.locator("#atlas-search").blur();
  await waitForMapReady("sacred-map-screenshot");
  await page.screenshot({path:join("artifacts/production-explore",width+"-en-sacred-map.png"),
   animations:"disabled",fullPage:false});
  await page.locator("#atlas-results .atlas-result-button").first().click();
  await page.locator("#atlas-card").waitFor({state:"visible"});
  await assertSelectedPinInVisibleMap("initial-sacred-folio");
  assert.equal(await page.locator("#atlas-card .atlas-folio-hero").count(),1,
    "The source folio must use Claude's immersive hero, not a generic details panel");
  assert.equal(await page.locator("#atlas-card .atlas-folio-toc").count(),1,
    "Claude source requires chapter navigation inside the folio");
  assert.ok(await page.locator("#atlas-card .atlas-folio-fact").count()>1,
    "A source-backed place folio must include factual rows");
  assert.equal(await page.locator("#atlas-card [data-visual-kind='category-symbol']").count(),1,
    "No unapproved images should be substituted for missing verified media");
  assert.ok(await page.locator("#atlas-card a[href^='https://']").count()>=1,
    "Missing coordinate-source link");
  await page.screenshot({path:join("artifacts/production-explore",width+"-en-sacred-folio.png"),
   animations:"disabled",fullPage:false});
  if(width===320){
    const firstTitle=await page.locator("#atlas-card .atlas-folio-ttl h1").innerText();
    const related=page.locator("#atlas-card .atlas-folio-row").first();
    assert.ok(await related.count()>0,"Source folio should link other selected Sacred Places");
    await related.click();
    assert.equal(await page.locator("#atlas-card .atlas-folio-closeall").count(),1,
      "Following a related Place requires Claude's separate close-all action");
    assert.notEqual(await page.locator("#atlas-card .atlas-folio-ttl h1").innerText(),firstTitle);
    await page.locator("#atlas-card .atlas-folio-back").click();
    assert.equal(await page.locator("#atlas-card .atlas-folio-ttl h1").innerText(),firstTitle,
      "Claude folio Back must return to the prior canonical Place");
  }
  await page.locator("#atlas-card .atlas-folio-back").click();
  // Claude's source-authored .card .im+.bd and .hero img are exercised
  // at exact responsive widths, with the six owner-selected originals only.
  const selectedPhotos=[
    ["place:MU:saint-louis-cathedral-port-louis","saint-louis"],
    ["place:MU:marie-reine-de-la-paix-port-louis","marie-reine"],
    ["place:PT:santarem-santissimo-milagre","santarem"],
    ["place:ES:santiago-compostela-cathedral","santiago"],
    ["place:ES:basilica-del-pilar-zaragoza","pilar"],
    ["place:PH:national-shrine-of-our-lady-of-lourdes-quezon-city","quezon"]
  ];
  for(const [photoId,slug] of selectedPhotos){
    const card=page.locator('#atlas-results .atlas-result-button[data-atlas-id="'+photoId+'"]');
    assert.equal(await card.count(),1,"No exact selected photo card: "+photoId);
    await card.scrollIntoViewIfNeeded();
    const img=card.locator(".atlas-result-photo");
    await img.evaluate(el=>el.decode());
    assert.ok(await img.evaluate(el=>el.naturalWidth>=900));
    assert.equal(await card.locator(".atlas-result-photo-credit").count(),1);
    const dims=await card.evaluate(el=>({h:el.getBoundingClientRect().height,
      image:getComputedStyle(el.querySelector(".atlas-result-media")).position,
      copy:getComputedStyle(el.querySelector(".atlas-result-copy")).position}));
    assert.ok(Math.abs(dims.h-226)<=2 && dims.image==="absolute" && dims.copy==="absolute",
      "Photo card cannot abandon Claude overlay geometry: "+JSON.stringify(dims));
    if(width===390 || (width===320 && ["santarem","santiago","pilar"].includes(slug))
       || (width===430 && ["marie-reine","quezon"].includes(slug))
       || (width===1440 && ["saint-louis","pilar"].includes(slug))){
      await waitForMapReady("photo-card-"+slug);
      await page.screenshot({path:join("artifacts/production-explore",
        width+"-en-photo-"+slug+"-card.png"),animations:"disabled",fullPage:false});
    }
    await card.click();
    const folio=page.locator("#atlas-card");
    await folio.waitFor({state:"visible"});
    await assertSelectedPinInVisibleMap(slug);
    const mark=page.locator('#atlas-map button.atlas-place-marker[data-atlas-marker-id="'+photoId+'"]');
    assert.equal(await mark.getAttribute("data-visible"),"true",
      "The verified selected marker must be visible in Claude's padded map");
    assert.equal(await mark.getAttribute("data-mode"),"ph",
      "Only selected and explicitly approved photo records receive 52px medallions");
    const heroImg=folio.locator(".atlas-folio-hero-photo .atlas-folio-photo-image");
    assert.equal(await heroImg.count(),1,"Photo folio must use donor image hero");
    await heroImg.evaluate(el=>el.decode());
    const credit=folio.locator(".atlas-folio-photo-credit");
    assert.equal(await credit.count(),1,"Photo credit must be visible in folio");
    assert.match(await credit.innerText(),/Resized and converted to WebP/);
    assert.equal(await credit.locator('a[href*="commons.wikimedia.org"]').count(),1);
    assert.equal(await credit.locator('a[href*="creativecommons.org"]').count(),1);
    assert.equal(await folio.locator("[data-visual-kind='category-symbol']").count(),0);
    if(width===390 || (width===320 && ["santarem","santiago","pilar"].includes(slug))
       || (width===430 && ["marie-reine","quezon"].includes(slug))
       || (width===1440 && ["saint-louis","pilar"].includes(slug))){
      await page.screenshot({path:join("artifacts/production-explore",
        width+"-en-photo-"+slug+"-folio.png"),animations:"disabled",fullPage:false});
    }
    await folio.locator(".atlas-folio-back").click();
    if(width===390 && slug==="santiago"){
      // An isolated, source-backed marker must be a real touch/click target,
      // not merely a decorative SVG drawn at the correct coordinate.
      await mark.click();
      assert.equal(await page.locator("#atlas-card .atlas-folio-ttl h1").innerText(),
        "Catedral de Santiago de Compostela");
      await page.locator("#atlas-card .atlas-folio-back").click();
      await mark.focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator("#atlas-card .atlas-folio-ttl h1").innerText(),
        "Catedral de Santiago de Compostela",
        "The source marker must open its canonical folio by keyboard");
      await page.locator("#atlas-card .atlas-folio-back").click();
    }
  }
  await page.locator("#atlas-lens-tlm").click();
  assert.equal(await page.locator("#atlas-map .atlas-place-marker[data-visible='true']").count(),0,
    "Sacred medallions may never remain on TLM Atlas");
  await page.waitForFunction(()=>document.querySelector("#atlas-count")?.textContent==="10 / 10");
  assert.equal(await page.locator("#atlas-results > li").count(),10);
  await page.locator("#atlas-results .atlas-result-button").first().click();
  await page.locator("#atlas-card").waitFor({state:"visible"});
  assert.ok(await page.locator("#atlas-card a[href*='institute-christ-king.org']").count()>=1,
    "TLM venue official institute evidence missing");
  assert.match(await page.locator("#atlas-card").innerText(),/Mass times are not imported/);
  assert.equal(await page.locator("#atlas-card .atlas-folio-nextm").count(),1,
    "The original TLM folio timetable section must state the data hold");
  await page.locator("#atlas-card .atlas-folio-back").click();
  await page.locator("#atlas-language").click();
  assert.match(await page.locator("#atlas-map-hint").innerText(),/horaires/);
  await waitForMapReady("tlm-map-after-country-hops");
  await page.screenshot({path:join("artifacts/production-explore",width+"-fr-tlm-map.png"),
   animations:"disabled",fullPage:false});
  await page.locator("#atlas-results .atlas-result-button").first().click();
  await page.screenshot({path:join("artifacts/production-explore",width+"-fr-tlm-folio.png"),
   animations:"disabled",fullPage:false});
  await page.locator("#atlas-card .atlas-folio-back").click();
  await page.locator("#atlas-world").click();
  await page.locator('.tabbar [data-route="home"]').click();
  await page.locator("#home-view").waitFor({state:"visible"});
  await page.locator('[data-route="atlas"]').first().click();
  await page.locator("#atlas-view").waitFor({state:"visible"});
  assert.equal(await page.locator("#atlas-map canvas").count(),1,
    "TLM/Sacred and Home return must never remount MapLibre");
  assert.deepEqual(errors,[],width+"px console errors: "+errors.slice(0,3).join(" | "));
  outcomes.push({width,height,records:"18 Sacred / 10 TLM",
    mapCount:1,overflow:dom.horizontalOverflow,
    tiles:{responses:tileNetwork.ok,httpErrors:tileNetwork.httpErrors.length,
      requestFailures:tileNetwork.failed.length},ready:await mapSnapshot()});
  await context.close();
 }
 console.log("PASS real production Explore MapLibre",JSON.stringify(outcomes));
}finally{
 await browser.close();await new Promise(resolve=>server.close(resolve));
}
