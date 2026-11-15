// Safari/WebKit-engine compatibility smoke test for Explore's selected pilot.
// Linux Playwright WebKit is NOT physical iOS Safari or Android hardware.
// This tests essential place-list functions even if MapLibre/WebGL cannot render.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {resolve,extname,join} from "node:path";
import {webkit} from "playwright";

const root=resolve("site");
const types={".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
 ".png":"image/png",".svg":"image/svg+xml",".webp":"image/webp"};
const server=createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const path=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
  if(!path.startsWith(root+"/")||!existsSync(path)){
   res.writeHead(404);res.end("Not found");return;
  }
  res.writeHead(200,{"Content-Type":types[extname(path)]||"application/octet-stream",
    "Cache-Control":"no-store"});
  res.end(readFileSync(path));
 }catch(error){res.writeHead(500);res.end(String(error.message||error));}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const address="http://127.0.0.1:"+server.address().port+"/";
mkdirSync("artifacts/production-explore-webkit",{recursive:true});
const browser=await webkit.launch({headless:true});
const findings=[];
try{
 for(const width of [390,430]){
  const context=await browser.newContext({
   viewport:{width,height:780},isMobile:true,hasTouch:true,deviceScaleFactor:2,
   locale:"en-US",reducedMotion:"reduce",ignoreHTTPSErrors:false
  });
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",error=>errors.push(String(error.message||error)));
  await page.goto(address,{waitUntil:"domcontentloaded"});
  await page.locator('[data-route="atlas"]').first().tap();
  await page.locator("#atlas-view").waitFor({state:"visible"});
  await page.waitForFunction(()=>document.getElementById("atlas-count")?.textContent==="10 / 10",
    null,{timeout:20000});
  assert.equal(await page.locator("#atlas-results > li").count(),10,
    "WebKit must retain 10 documented TLM places");
  const geometry=await page.evaluate(()=>{
   const rect=id=>document.getElementById(id).getBoundingClientRect();
   const header=document.querySelector("#atlas-view .atlas-top").getBoundingClientRect();
   const world=rect("atlas-world"),sheet=rect("atlas-sheet"),tab=document.querySelector(".tabbar").getBoundingClientRect();
   const s=rect("atlas-search");
   return {
    overflow:document.documentElement.scrollWidth-innerWidth,
    pillGap:world.top-header.bottom,
    sheetDockGap:tab.top-sheet.bottom,
    searchHeight:s.height,
    sheetHeight:sheet.height,
    mapWidth:rect("atlas-map").width
   };
  });
  assert.ok(geometry.overflow<=1,"WebKit horizontal overflow: "+JSON.stringify(geometry));
  assert.ok(geometry.pillGap>=6&&geometry.pillGap<=16,
   "Dynamic Claude header-to-World control gap broke: "+JSON.stringify(geometry));
  assert.ok(geometry.sheetDockGap>=-2&&geometry.sheetDockGap<=3,
   "Sheet should dock to integrated Home bottom nav: "+JSON.stringify(geometry));
  assert.ok(geometry.mapWidth>width*.85 && geometry.searchHeight>=40,
   "Atlas map/search geometry unusable: "+JSON.stringify(geometry));
  await page.locator("#atlas-lens-sacred").tap();
  await page.waitForFunction(()=>document.getElementById("atlas-count")?.textContent==="18 / 18");
  assert.equal(await page.locator("#atlas-results > li").count(),18);
  const query=await page.locator("#atlas-results .atlas-result-name").first().innerText();
  await page.locator("#atlas-search").fill(query);
  await page.waitForFunction(()=>document.getElementById("atlas-count")?.textContent==="1 / 18");
  assert.equal(await page.locator("#atlas-results > li").count(),1,
   "Search must filter canonical Sacred records in WebKit");
  await page.locator("#atlas-search").fill("");
  await page.waitForFunction(()=>document.getElementById("atlas-count")?.textContent==="18 / 18");
  await page.locator("#atlas-search").blur();
  // A list can be functional while WebGL is still drawing blank frames.
  // The screenshot and map-facing compatibility gate must wait for
  // MapLibre source, tile requests and camera movement to settle.
  const waitForRenderedMap=async label=>{
   try{
    await page.waitForFunction(async()=>{
     const {exploreDebugState}=await import("./explore.js");
     return exploreDebugState().mapReady;
    },null,{timeout:30000,polling:125});
    await page.evaluate(()=>new Promise(done=>
      requestAnimationFrame(()=>requestAnimationFrame(done))));
   }catch(error){
    const debug=await page.evaluate(async()=>{
     const {exploreDebugState}=await import("./explore.js");
     const s=exploreDebugState();
     return {mapReady:s.mapReady,mapFailed:s.mapFailed,mapLoaded:s.mapLoaded,
      tilesLoaded:s.tilesLoaded,cameraMoving:s.cameraMoving,error:s.error};
    });
    throw new Error("WebKit "+label+" map not settled: "+JSON.stringify(debug)+
      " ; "+String(error.message||error));
   }
  };
  await waitForRenderedMap("Sacred");
  await page.screenshot({path:join("artifacts/production-explore-webkit",width+"-en-sacred-map.png"),
   animations:"disabled",fullPage:false});
  const handle=page.locator("#atlas-sheet-handle");
  await handle.tap();
  assert.equal(await page.locator("#atlas-sheet").getAttribute("data-sheet-state"),"expanded",
   "WebKit tap must expand the Claude source list");
  assert.equal(await handle.getAttribute("aria-expanded"),"true");
  await page.screenshot({path:join("artifacts/production-explore-webkit",width+"-en-sacred-list.png"),
   animations:"disabled",fullPage:false});
  await handle.tap();
  assert.equal(await page.locator("#atlas-sheet").getAttribute("data-sheet-state"),"peek");
  const first=page.locator("#atlas-results .atlas-result-button").first();
  const firstId=await first.getAttribute("data-atlas-id");
  await first.scrollIntoViewIfNeeded();
  await first.tap();
  await page.locator("#atlas-card").waitFor({state:"visible"});
  assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains("atlas-folio-back")),true,
   "WebKit fullscreen folio must receive focus on Back");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#atlas-card").isHidden(),true,
   "WebKit Escape must dismiss the folio");
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.atlasId),firstId,
   "WebKit must return focus to the originating place card");
  await page.keyboard.press("Enter");
  await page.locator("#atlas-card").waitFor({state:"visible"});
  assert.equal(await page.locator("#atlas-card .atlas-folio-hero").count(),1,
   "Source-authored place folio missing in WebKit");
  assert.equal(await page.locator("#atlas-card .atlas-folio-toc").count(),1);
  await waitForRenderedMap("Sacred folio");
  await page.screenshot({path:join("artifacts/production-explore-webkit",width+"-en-sacred-folio.png"),
   animations:"disabled",fullPage:false});
  await page.locator("#atlas-card .atlas-folio-back").tap();
  await page.locator("#atlas-language").tap();
  assert.ok((await page.locator("#atlas-search").getAttribute("placeholder"))?.includes("…"),
   "French-localized search prompt missing");
  await page.locator("#atlas-lens-tlm").tap();
  await page.waitForFunction(()=>document.getElementById("atlas-count")?.textContent==="10 / 10");
  await waitForRenderedMap("French TLM");
  assert.equal(await page.locator('#atlas-ways button[data-atlas-facet="times"]').isDisabled(),true,
   "Never offer unverified TLM Mass times");
  await page.screenshot({path:join("artifacts/production-explore-webkit",width+"-fr-tlm-map.png"),
   animations:"disabled",fullPage:false});
  await page.locator('.tabbar [data-route="home"]').tap();
  await page.locator("#home-view").waitFor({state:"visible"});
  await page.locator('[data-route="atlas"]').first().tap();
  await page.locator("#atlas-view").waitFor({state:"visible"});
  assert.equal(await page.locator("#atlas-results > li").count(),10);
  const mapState=await page.evaluate(async()=>{
   const {exploreDebugState}=await import("./explore.js");
   const s=exploreDebugState();
   return {mounted:s.mounted,mapCount:s.mapCount,mapFailed:s.mapFailed,error:s.error};
  });
  assert.equal(mapState.mounted,true);
  assert.ok(mapState.mapCount<=1,"MapLibre must never duplicate after return");
  assert.deepEqual(errors,[],"Unexpected WebKit page errors: "+errors.join(" | "));
  findings.push({width,geometry,mapState,records:"18 Sacred / 10 TLM",language:"EN/FR"});
  await context.close();
 }
 console.log("PASS WebKit-engine Explore browser smoke (NOT physical Safari)",JSON.stringify(findings));
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
