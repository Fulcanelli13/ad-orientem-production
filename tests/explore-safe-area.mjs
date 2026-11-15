// Explore safe-area regression: inspect actual box geometry under simulated
// iOS-style insets. Chromium does not expose the physical cutout from a
// generic viewport; CSS env() is replaced in the local test CSS response
// only. This is NOT a physical iOS or Android device certification.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync,existsSync,mkdirSync} from "node:fs";
import {resolve,extname,join} from "node:path";
import {chromium} from "playwright";

const root=resolve("site");
const types={".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
 ".svg":"image/svg+xml",".png":"image/png",".webp":"image/webp"};
let current={top:0,bottom:0};
const server=createServer((req,res)=>{
 try{
  const url=new URL(req.url,"http://localhost");
  const pathname=decodeURIComponent(url.pathname==="/"?"/index.html":url.pathname);
  const file=resolve(root,"."+pathname);
  if(!file.startsWith(root+"/")||!existsSync(file)){
   res.writeHead(404);res.end();return;
  }
  const mime=types[extname(file)]||"application/octet-stream";
  let body=readFileSync(file);
  if(extname(file)===".css"){
   body=body.toString("utf8")
    .replaceAll("env(safe-area-inset-top)",current.top+"px")
    .replaceAll("env(safe-area-inset-bottom)",current.bottom+"px");
  }
  res.writeHead(200,{"Content-Type":mime,"Cache-Control":"no-store"});
  res.end(body);
 }catch(error){res.writeHead(500);res.end(String(error.message));}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const origin="http://127.0.0.1:"+server.address().port+"/";
mkdirSync("artifacts/production-explore-safe-area",{recursive:true});
const cases=[
 {label:"baseline-390",width:390,height:780,top:0,bottom:0,peek:376},
 {label:"notch-390",width:390,height:844,top:47,bottom:34,peek:376},
 {label:"notch-430",width:430,height:780,top:59,bottom:34,peek:308},
 {label:"compact-320",width:320,height:700,top:35,bottom:24,peek:262},
 {label:"compact-390",width:390,height:667,top:44,bottom:34,peek:210}
];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const findings=[];
function requireClose(actual,expected,what,tolerance=2){
 assert.ok(Math.abs(actual-expected)<=tolerance,what+": expected "+expected+" got "+actual);
}
try{
 for(const scenario of cases){
  current=scenario;
  const context=await browser.newContext({
   viewport:{width:scenario.width,height:scenario.height},
   isMobile:true,hasTouch:true,deviceScaleFactor:3,reducedMotion:"reduce"
  });
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.goto(origin,{waitUntil:"domcontentloaded"});
  await page.locator('[data-route="atlas"]').first().click();
  await page.locator("#atlas-view").waitFor({state:"visible"});
  await page.waitForFunction(()=>document.querySelector("#atlas-count")?.textContent==="10 / 10",
    null,{timeout:20000});
  await page.waitForFunction(()=>
    document.querySelector("#atlas-map .maplibregl-ctrl-zoom-out")&&
    document.querySelector("#atlas-sheet-handle")?.getBoundingClientRect().height>=20,
    null,{timeout:30000});
  const g=await page.evaluate(()=>{
   const box=selector=>{
    const el=document.querySelector(selector);
    if(!el)throw new Error("Missing "+selector);
    const r=el.getBoundingClientRect();
    return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,
     width:r.width,height:r.height};
   };
   const at=selector=>{
    const el=document.querySelector(selector),r=el.getBoundingClientRect();
    const hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
    return el===hit||el.contains(hit);
   };
   return {search:box("#atlas-search"),header:box("#atlas-view .atlas-top"),
    world:box("#atlas-world"),language:box("#atlas-language"),
    zoomIn:box("#atlas-map .maplibregl-ctrl-zoom-in"),
    zoomOut:box("#atlas-map .maplibregl-ctrl-zoom-out"),
    sheet:box("#atlas-sheet"),handle:box("#atlas-sheet-handle"),
    nav:box(".tabbar"),navButton:box('.tabbar [data-route="atlas"]'),
    peekCss:Number.parseFloat(document.querySelector("#atlas-sheet").style.getPropertyValue("--h")),
    navClickable:at('.tabbar [data-route="atlas"]'),
    searchClickable:at("#atlas-search"),
    worldClickable:at("#atlas-world"),
    languageClickable:at("#atlas-language"),
    zoomClickable:at("#atlas-map .maplibregl-ctrl-zoom-in"),
    handleClickable:at("#atlas-sheet-handle"),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  const contextName=JSON.stringify(scenario);
  // Claude's mobile source starts the search 4px below the actual safe
  // area, not 14px, and places region/language controls after the header.
  assert.ok(g.search.top>=scenario.top+3,"Search overlaps simulated cutout "+contextName+" "+JSON.stringify(g));
  assert.ok(g.world.top>=g.header.bottom+7,
   "World control intersects Atlas header "+contextName+" "+JSON.stringify(g));
  assert.ok(g.language.top>=g.header.bottom+7,
   "Language control intersects Atlas header "+contextName);
  assert.ok(g.world.top>=scenario.top+80,"World button overlaps cutout "+contextName);
  requireClose(g.world.top,g.header.bottom+10,"Claude world offset "+contextName);
  requireClose(g.language.top,g.world.top,"Source language/world row "+contextName);
  assert.ok(g.language.top>=scenario.top+80,"Language button overlaps cutout "+contextName);
  assert.ok(g.zoomIn.top>=scenario.top+8,"Map zoom controls overlap cutout "+contextName);
  assert.ok(g.navButton.bottom<=scenario.height-scenario.bottom+1,
   "Navigation content intersects home indicator "+contextName+" "+JSON.stringify(g));
  requireClose(g.nav.bottom,scenario.height,"Tabbar bottom "+contextName);
  requireClose(g.sheet.bottom,g.nav.top,"Claude sheet/tabbar docking "+contextName);
  assert.ok(g.zoomOut.bottom+10<=g.sheet.top,
   "Bottom sheet covers visible map zoom buttons "+contextName+" "+JSON.stringify(g));
  requireClose(g.peekCss,scenario.peek,"Peek height "+contextName);
  requireClose(g.sheet.height,scenario.peek,"Visible peek height "+contextName);
  assert.ok(g.navClickable&&g.searchClickable&&g.worldClickable&&
   g.languageClickable&&g.zoomClickable&&g.handleClickable,
   "A system-area control is obstructed "+contextName+" "+JSON.stringify(g));
  assert.ok(g.overflow<=1,"Horizontal overflow "+contextName);
  await page.screenshot({path:join("artifacts/production-explore-safe-area",
    scenario.label+"-map.png"),animations:"disabled",fullPage:false});
  await page.locator("#atlas-lens-sacred").click();
  await page.waitForFunction(()=>document.querySelector("#atlas-count")?.textContent==="18 / 18");
  await page.locator("#atlas-results .atlas-result-button").first().click();
  await page.locator("#atlas-card").waitFor({state:"visible"});
  const folio=await page.evaluate(()=>{
   const b=document.querySelector("#atlas-view .atlas-folio-back").getBoundingClientRect();
   const h=document.querySelector("#atlas-view .atlas-folio-hero").getBoundingClientRect();
   return {backTop:b.top,backBottom:b.bottom,heroTop:h.top,
     backWidth:b.width,backHeight:b.height};
  });
  assert.ok(folio.backTop>=scenario.top+8,
   "Folio back button collides with top safe area "+contextName+" "+JSON.stringify(folio));
  assert.ok(folio.backBottom<scenario.height-scenario.bottom,
   "Folio back button off usable viewport "+contextName);
  assert.equal(folio.backWidth,40);
  await page.screenshot({path:join("artifacts/production-explore-safe-area",
    scenario.label+"-folio.png"),animations:"disabled",fullPage:false});
  await page.locator("#atlas-card .atlas-folio-back").click();
  assert.deepEqual(errors,[],"Browser error for "+contextName);
  findings.push({name:scenario.label,searchTop:Math.round(g.search.top),
   sheetTop:Math.round(g.sheet.top),sheetHeight:Math.round(g.sheet.height),
   zoomBottom:Math.round(g.zoomOut.bottom),
   navContentBottom:Math.round(g.navButton.bottom),folioBackTop:Math.round(folio.backTop)});
  await context.close();
 }
 console.log("PASS Explore simulated safe-area geometry",JSON.stringify(findings));
}finally{
 await browser.close();
 await new Promise(ok=>server.close(ok));
}
