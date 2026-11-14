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
  ".jpg":"image/jpeg",".png":"image/png",".svg":"image/svg+xml"};
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
  page.on("pageerror",error=>errors.push(String(error.message||error)));
  await page.goto("http://127.0.0.1:"+port+"/",{waitUntil:"domcontentloaded"});
  await page.locator('[data-route="atlas"]').first().click();
  await page.locator("#atlas-view").waitFor({state:"visible"});
  await page.waitForFunction(()=>document.querySelector("#atlas-count")?.textContent==="10 / 10",
   null,{timeout:20000});
  assert.equal(await page.locator("#atlas-lens-tlm").getAttribute("aria-selected"),"true",
    "Claude source opens with TLM Atlas first");
  await page.locator("#atlas-lens-sacred").click();
  await page.waitForFunction(()=>document.querySelector("#atlas-count")?.textContent==="18 / 18",
   null,{timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll("#atlas-map canvas").length===1,
   null,{timeout:30000});
  // Canvas allocation alone does not imply that tiles and source-backed pins
  // are ready. The "load" event hides this status only after adding GeoJSON.
  await page.waitForFunction(()=>document.getElementById("atlas-map-status")?.hidden===true,
   null,{timeout:30000});
  assert.equal(await page.locator(".atlas-switch > button").count(),2,"Exactly two top-level Atlases");
  assert.equal(await page.locator(".tabbar > button").count(),4,"Exactly four original bottom tabs");
  assert.equal(await page.locator("#atlas-results > li").count(),18);
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
      zoomButtons:[...document.querySelectorAll("#atlas-map .maplibregl-ctrl-zoom-in,#atlas-map .maplibregl-ctrl-zoom-out")]
        .map(el=>{
          const r=el.getBoundingClientRect();
          const target=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
          return {visible:r.width>=29&&r.height>=29,
            reachable:target===el||el.contains(target)};
        })
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
  assert.equal(dom.zoomButtons.length,2,width+"px missing map zoom controls");
  assert.ok(dom.zoomButtons.every(button=>button.visible&&button.reachable),
    width+"px zoom button covered by floating controls: "+JSON.stringify(dom.zoomButtons));
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
    // Keep real pointer tests for short source gestures. Chromium cancels a
    // long synthetic downward gesture after the sheet begins moving; do not
    // pretend the 150px pointer gesture is accepted on this evidence.
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
  await page.screenshot({path:join("artifacts/production-explore",width+"-en-sacred-map.png"),
   animations:"disabled",fullPage:false});
  await page.locator("#atlas-results .atlas-result-button").first().click();
  await page.locator("#atlas-card").waitFor({state:"visible"});
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
  await page.locator("#atlas-card .atlas-folio-back").click();
  await page.locator("#atlas-lens-tlm").click();
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
  outcomes.push({width,height,records:"18 Sacred / 10 TLM",mapCount:1,overflow:dom.horizontalOverflow});
  await context.close();
 }
 console.log("PASS real production Explore MapLibre",JSON.stringify(outcomes));
}finally{
 await browser.close();await new Promise(resolve=>server.close(resolve));
}
