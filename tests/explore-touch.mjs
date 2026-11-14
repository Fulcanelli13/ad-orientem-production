// Touch emulation acceptance for owner-supplied Claude Explore gestures.
// Chromium CDP dispatches touchStart/touchMove/touchEnd, not mouse events.
// This is NOT proof of physical-device behaviour.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {resolve,extname,join} from "node:path";
import {chromium} from "playwright";

const root=resolve("site");
const types={".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
  ".png":"image/png",".svg":"image/svg+xml",".webp":"image/webp"};
const server=createServer((req,res)=>{
 try{
  const url=new URL(req.url,"http://localhost");
  const pathname=decodeURIComponent(url.pathname==="/"?"/index.html":url.pathname);
  const file=resolve(root,"."+pathname);
  if(!file.startsWith(root+"/")||!existsSync(file)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream",
   "Cache-Control":"no-store"});
  res.end(readFileSync(file));
 }catch(error){res.writeHead(500);res.end(String(error.message));}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const address="http://127.0.0.1:"+server.address().port+"/";
mkdirSync("artifacts/production-explore-touch",{recursive:true});

async function touchDrag(session,x,y,x2,y2,steps=12){
 await session.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});
 for(let i=1;i<=steps;i++){
  const progress=i/steps;
  await session.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{
   x:x+(x2-x)*progress,y:y+(y2-y)*progress
  }]});
  await new Promise(resolve=>setTimeout(resolve,18));
 }
 await session.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
}
function center(box){return{x:box.x+box.width/2,y:box.y+box.height/2};}
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const findings=[];
try{
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:780},
   isMobile:true,hasTouch:true,deviceScaleFactor:2,reducedMotion:"reduce",
   locale:"en-US",ignoreHTTPSErrors:false});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",error=>errors.push(String(error.message||error)));
  await page.goto(address,{waitUntil:"domcontentloaded"});
  await page.locator('[data-route="atlas"]').first().tap();
  await page.locator("#atlas-view").waitFor({state:"visible"});
  await page.waitForFunction(()=>document.querySelector("#atlas-count")?.textContent==="10 / 10",
   null,{timeout:20000});
  await page.waitForFunction(()=>document.getElementById("atlas-map-status")?.hidden===true,
   null,{timeout:30000});
  assert.equal(await page.locator("#atlas-lens-tlm").getAttribute("aria-selected"),"true");
  const session=await context.newCDPSession(page);
  await page.screenshot({
   path:join("artifacts/production-explore-touch",width+"-touch-tlm-initial.png"),
   animations:"disabled",fullPage:false
  });
  const handle=page.locator("#atlas-sheet-handle");
  const sheet=page.locator("#atlas-sheet");
  const initial=await sheet.getAttribute("data-sheet-state");
  assert.equal(initial,"peek");
  let start=center(await handle.boundingBox());
  await touchDrag(session,start.x,start.y,start.x,start.y-85,8);
  assert.equal(await sheet.getAttribute("data-sheet-state"),"expanded",
   width+"px touch up failed");
  await page.waitForTimeout(350);
  start=center(await handle.boundingBox());
  await touchDrag(session,start.x,start.y,start.x,start.y+100,9);
  assert.equal(await sheet.getAttribute("data-sheet-state"),"peek",
   width+"px touch down to peek failed");
  await page.waitForTimeout(350);
  start=center(await handle.boundingBox());
  await touchDrag(session,start.x,start.y,start.x,start.y+238,12);
  const min=await sheet.evaluate(el=>({
   state:el.dataset.sheetState,height:parseFloat(el.style.getPropertyValue("--h"))
  }));
  assert.equal(min.state,"min",width+"px long touch down failed: "+JSON.stringify(min));
  assert.equal(min.height,150);
  await handle.tap();
  assert.equal(await sheet.getAttribute("data-sheet-state"),"expanded");
  await page.waitForTimeout(350);
  await handle.tap();
  assert.equal(await sheet.getAttribute("data-sheet-state"),"peek");
  await page.locator("#atlas-lens-sacred").tap();
  await page.waitForFunction(()=>document.querySelector("#atlas-count")?.textContent==="18 / 18");
  const rail=page.locator("#atlas-results");
  const before=await rail.evaluate(el=>el.scrollLeft);
  const box=await rail.boundingBox();
  // The rail should scroll horizontally with a real finger swipe, not only
  // programmatic scrollLeft changes used by the desktop test.
  const y=box.y+Math.min(box.height*.65,115);
  await touchDrag(session,box.x+box.width*.77,y,box.x+box.width*.18,y,14);
  await page.waitForTimeout(650); // scroll snap settles
  const after=await rail.evaluate(el=>el.scrollLeft);
  assert.ok(after>before+20,width+"px real touch card rail did not swipe: "+before+" -> "+after);
  await page.screenshot({
   path:join("artifacts/production-explore-touch",width+"-touch-sacred-swiped.png"),
   animations:"disabled",fullPage:false
  });
  const visibleCard=page.locator("#atlas-results .atlas-result-button").nth(1);
  await visibleCard.scrollIntoViewIfNeeded();
  await visibleCard.tap();
  await page.locator("#atlas-card").waitFor({state:"visible"});
  assert.equal(await page.locator("#atlas-card .atlas-folio-hero").count(),1);
  assert.ok(await page.locator("#atlas-card a[href^='https://']").count()>0);
  await page.screenshot({
   path:join("artifacts/production-explore-touch",width+"-touch-sacred-folio.png"),
   animations:"disabled",fullPage:false
  });
  await page.locator("#atlas-card .atlas-folio-back").tap();
  await page.locator('.tabbar [data-route="home"]').tap();
  await page.locator("#home-view").waitFor({state:"visible"});
  const geom=await page.evaluate(()=>({
   overflow:document.documentElement.scrollWidth-innerWidth,
   mapCount:document.querySelectorAll("#atlas-map canvas").length
  }));
  assert.ok(geom.overflow<=1,"Touch emulation horizontal page overflow: "+JSON.stringify(geom));
  assert.equal(geom.mapCount,1);
  assert.deepEqual(errors,[],width+"px errors: "+errors.join(" | "));
  findings.push({width,min:min.height,swipePixels:after-before,mapCount:geom.mapCount});
  await context.close();
 }
 console.log("PASS mobile CDP touch emulation",JSON.stringify(findings));
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
