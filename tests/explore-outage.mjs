// Fault-injection: Explore's locally curated directory must survive remote CDN/tiles outages.
// Uses a fresh Chromium session and deliberately blocks provider traffic. Does not
// replace Claude's approved UI, make up pins, or touch production publication.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {existsSync,readFileSync,mkdirSync} from "node:fs";
import {extname,join,resolve} from "node:path";
import {chromium} from "playwright";

const root=resolve("site");
const records=JSON.parse(readFileSync("site/explore/selected-sites.v1.json","utf8"));
const types={".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
  ".svg":"image/svg+xml",".webp":"image/webp",".png":"image/png",
  ".jpg":"image/jpeg",".woff":"font/woff",".woff2":"font/woff2"};
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
 }catch(error){res.writeHead(500);res.end(String(error.message));}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const url="http://127.0.0.1:"+server.address().port+"/";
mkdirSync("artifacts/production-explore-outage",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];

async function checkLens(page,lens,full){
 const expected=records[lens];
 await page.locator("#atlas-lens-"+lens).click();
 await page.waitForFunction((n)=>document.querySelector("#atlas-count")?.textContent===n,
  expected.length+" / "+expected.length,{timeout:10000});
 assert.equal(await page.locator("#atlas-results > li").count(),expected.length);
 const sheet=page.locator("#atlas-sheet");
 assert.equal(await sheet.isVisible(),true);
 // Every locally curated record can be opened from its original card/folio.
 const selected=full?expected:[expected[0],expected[expected.length-1]];
 for(const place of selected){
  const card=page.locator('#atlas-results button[data-atlas-id="'+place.id+'"]');
  assert.equal(await card.count(),1,"Missing "+lens+" card "+place.id);
  await card.scrollIntoViewIfNeeded();
  await card.click();
  const folio=page.locator("#atlas-card");
  assert.equal(await folio.isVisible(),true);
  assert.equal(await folio.locator(".atlas-folio-ttl h1").innerText(),place.name);
  assert.ok(await folio.locator('a[href^="https://"]').count()>=1,
    "No canonical evidence link in "+place.id);
  assert.equal(await folio.locator(".atlas-folio-hero").count(),1,
    "The original Claude folio visual structure must survive outage");
  if(place.media_status==="OWNER_SELECTED_PHOTO_TRANSFERRED"){
   const img=folio.locator(".atlas-folio-photo-image");
   assert.equal(await img.count(),1);
   await img.evaluate(image=>image.decode());
   assert.ok(await img.evaluate(image=>image.naturalWidth>0));
   assert.equal(await folio.locator(".atlas-folio-photo-credit").count(),1);
  }else{
   assert.equal(await folio.locator(".atlas-folio-photo-image").count(),0);
  }
  if(lens==="tlm")
   assert.match(await folio.locator(".atlas-folio-nextm").innerText(),/Mass times are not imported/);
  await folio.locator(".atlas-folio-back").click();
  assert.equal(await folio.isVisible(),false);
 }
 // Search remains independent of basemap/camera.
 const q=page.locator("#atlas-search");
 await q.fill(expected[0].name);
 assert.ok(await page.locator("#atlas-results > li").count()>=1);
 assert.equal(await page.locator('#atlas-results button[data-atlas-id="'+expected[0].id+'"]').count(),1);
 await q.fill("NOT-A-REAL-ATLAS-VENUE-000000");
 assert.equal(await page.locator("#atlas-results .atlas-result-button").count(),0);
 await q.fill("");
 assert.equal(await page.locator("#atlas-results > li").count(),expected.length);
}

try{
 for(const {mode,width,full} of [
  {mode:"maplibre-cdn",width:390,full:true},
  {mode:"tiles-and-glyphs",width:390,full:true},
  {mode:"maplibre-cdn",width:320,full:false},
  {mode:"tiles-and-glyphs",width:320,full:false},
 ]){
  const context=await browser.newContext({viewport:{width,height:780},
    reducedMotion:"reduce",locale:"en-US",deviceScaleFactor:1,
    ignoreHTTPSErrors:false});
  const page=await context.newPage();
  const denied=[],localResponses=[],exceptions=[];
  let notifyDenied;
  const firstBlockedRequest=new Promise(resolve=>{notifyDenied=resolve;});
  page.on("pageerror",error=>exceptions.push(String(error.message||error)));
  page.on("response",response=>{
   if(response.url().startsWith(url))localResponses.push({
     url:response.url(),status:response.status()});
  });
  if(mode==="maplibre-cdn"){
   await page.route("**/unpkg.com/**",route=>{
    denied.push(route.request().url());notifyDenied();return route.abort("failed");
   });
  }else{
   await page.route("**/tiles.openfreemap.org/**",route=>{
    denied.push(route.request().url());notifyDenied();return route.abort("failed");
   });
  }
  await page.goto(url,{waitUntil:"domcontentloaded"});
  await page.locator('[data-route="atlas"]').first().click();
  await page.locator("#atlas-view").waitFor({state:"visible"});
  await page.waitForFunction(()=>document.querySelector("#atlas-count")?.textContent==="10 / 10",
    null,{timeout:15000});
  // A failed CDN import should resolve to a visible unavailable status.
  // Failed vector source/tile requests may leave a live MapLibre canvas, but
  // MUST NOT prevent interacting with the actual source-backed directory.
  if(mode==="maplibre-cdn"){
   await page.waitForFunction(()=>document.getElementById("atlas-map-status")?.classList.contains("error"),
    null,{timeout:15000});
   assert.match(await page.locator("#atlas-map-status").innerText(),/Interactive tiles unavailable/);
   assert.equal(await page.locator("#atlas-map canvas").count(),0);
  }else{
   await page.waitForFunction(()=>document.querySelectorAll("#atlas-map canvas").length===1,
    null,{timeout:20000});
  }
  // MapLibre allocates its canvas before async style/glyph/tile requests.
  // Wait for an actual intercepted request rather than using canvas presence
  // as proof that fault injection reached the network.
  if(!denied.length){
   let deadline;
   try{
    await Promise.race([
      firstBlockedRequest,
      new Promise((_,reject)=>{deadline=setTimeout(()=>
        reject(new Error("No external "+mode+" request attempted within 8s")),8000);})
    ]);
   }finally{clearTimeout(deadline);}
  }
  assert.ok(denied.length>0,"No outage traffic intercepted for "+mode);
  assert.equal(await page.locator(".tabbar button").count(),4);
  assert.equal(await page.locator("#atlas-results > li").count(),10);
  const originalCardHeight=await page.locator("#atlas-results .atlas-result-button").first()
    .evaluate(el=>el.getBoundingClientRect().height);
  assert.ok(Math.abs(originalCardHeight-226)<=2,"Claude's 226px cards must survive outage");
  await page.screenshot({path:join("artifacts/production-explore-outage",
    width+"-"+mode+"-tlm.png"),animations:"disabled",fullPage:false});
  await checkLens(page,"tlm",full);
  await checkLens(page,"sacred",full);
  await page.screenshot({path:join("artifacts/production-explore-outage",
    width+"-"+mode+"-sacred.png"),animations:"disabled",fullPage:false});
  // The original bilingual and list-mode controls still respond.
  await page.locator("#atlas-sheet-handle").click();
  assert.equal(await page.locator("#atlas-sheet").getAttribute("data-sheet-state"),"expanded");
  assert.ok(await page.locator("#atlas-results").evaluate(el=>el.classList.contains("is-list")));
  await page.locator("#atlas-language").click();
  assert.equal(await page.locator("#atlas-lens-tlm").innerText(),"Atlas TLM");
  await page.locator("#atlas-sheet-handle").click();
  assert.equal(await page.locator("#atlas-sheet").getAttribute("data-sheet-state"),"peek");
  await page.locator('.tabbar [data-route="home"]').click();
  assert.equal(await page.locator("#home-view").isVisible(),true);
  await page.locator('[data-route="atlas"]').first().click();
  assert.equal(await page.locator("#atlas-view").isVisible(),true);
  assert.equal(await page.locator("#atlas-results > li").count(),18);
  assert.ok(!localResponses.some(x=>x.status>=400),
    "Local selected records or photos failed despite external outage");
  assert.deepEqual(exceptions,[],"Unexpected uncaught browser errors: "+exceptions.join(" | "));
  results.push({mode,width,checked:full?28:4,
    blockedRequests:denied.length,localResponses:localResponses.length,
    mapCanvas:await page.locator("#atlas-map canvas").count()});
  await context.close();
 }
 console.log("PASS Explore external-outage fallback",JSON.stringify(results));
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
