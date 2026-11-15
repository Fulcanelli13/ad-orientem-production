// Explore viewport-reflow regression. Chromium resizing and a deliberately
// overridden visualViewport height approximate two browser keyboard models;
// neither simulates actual iOS Safari, a physical keyboard, nor WebView chrome.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {existsSync,readFileSync,mkdirSync} from "node:fs";
import {resolve,extname,join} from "node:path";
import {chromium} from "playwright";
const root=resolve("site");
const mime={".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
 ".png":"image/png",".svg":"image/svg+xml",".webp":"image/webp"};
const server=createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const p=resolve(root,"."+(pathname==="/"?"/index.html":pathname));
  if(!p.startsWith(root+"/")||!existsSync(p)){
   res.writeHead(404);res.end();return;
  }
  res.writeHead(200,{"Content-Type":mime[extname(p)]||"application/octet-stream",
   "Cache-Control":"no-store"});
  res.end(readFileSync(p));
 }catch(e){res.writeHead(500);res.end(String(e.message));}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const origin="http://127.0.0.1:"+server.address().port+"/";
mkdirSync("artifacts/production-explore-viewport",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const checks=[];
function close(actual,expected,name,tolerance=2){
 assert.ok(Math.abs(actual-expected)<=tolerance,
  name+": expected "+expected+" actual "+actual);
}
try{
 const context=await browser.newContext({viewport:{width:390,height:780},
  isMobile:true,hasTouch:true,deviceScaleFactor:2,
  reducedMotion:"reduce",locale:"en-US"});
 const page=await context.newPage();
 const errors=[];
 page.on("pageerror",e=>errors.push(String(e.message||e)));
 await page.goto(origin,{waitUntil:"domcontentloaded"});
 await page.locator('[data-route="atlas"]').first().click();
 await page.waitForFunction(()=>document.querySelector("#atlas-count")?.textContent==="10 / 10",
  null,{timeout:30000});
 await page.waitForFunction(()=>document.querySelector("#atlas-map canvas")&&
  document.querySelector("#atlas-map-status")?.hidden===true,
  null,{timeout:30000});
 const geometry=()=>page.evaluate(()=>{
  const box=s=>{
   const el=document.querySelector(s),r=el.getBoundingClientRect();
   return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,
    height:r.height,width:r.width};
  };
  return {view:box("#atlas-view"),search:box("#atlas-search"),
   sheet:box("#atlas-sheet"),nav:box(".tabbar"),
   world:box("#atlas-world"),
   mapControlsVisible:getComputedStyle(document.querySelector(
    "#atlas-map .maplibregl-ctrl-top-right")).visibility!=="hidden",
   navVisible:getComputedStyle(document.querySelector(".tabbar")).visibility!=="hidden",
   keyboard:document.querySelector("#atlas-view").classList.contains("atlas-keyboard-visible"),
   snap:parseFloat(document.querySelector("#atlas-sheet").style.getPropertyValue("--h")),
   canvas:document.querySelectorAll("#atlas-map canvas").length,
   overlap:Math.max(0,document.querySelector("#atlas-sheet").getBoundingClientRect().bottom-
     document.querySelector(".tabbar").getBoundingClientRect().top),
   overflow:document.documentElement.scrollWidth-innerWidth};
 });
 // The source sheet deliberately animates its height for ~450ms.
 // Geometry assertions must measure a settled frame, not an interim one.
 const settleSheet=expected=>page.waitForFunction(expected=>{
  const el=document.querySelector("#atlas-sheet");
  return !!el&&Math.abs(el.getBoundingClientRect().height-expected)<=2;
 },expected,{timeout:5000,polling:50});
 const baseline=await geometry();
 close(baseline.sheet.height,376,"baseline source peek");
 assert.equal(baseline.canvas,1);
 checks.push({scenario:"baseline",...baseline});
 await page.locator("#atlas-search").focus();
 await page.locator("#atlas-search").fill("Patrick");
 assert.ok(await page.locator("#atlas-count").innerText()!=="10 / 10");
 // Mobile browsers which shrink the layout viewport when a keyboard opens.
 for(const scenario of [{width:390,height:460},{width:390,height:390}]){
  await page.setViewportSize(scenario);
  await page.waitForFunction(()=>document.querySelector("#atlas-sheet")?.
   style.getPropertyValue("--h")==="150px");
  await settleSheet(150);
  const g=await geometry();
  close(g.view.height,scenario.height,"layout-viewport height");
  close(g.sheet.height,150,"keyboard-shrunk sheet");
  assert.ok(g.search.bottom<g.sheet.top,
   "Search must not be under the sheet on keyboard-sized viewport");
  assert.equal(g.canvas,1,"Map must not remount on viewport change");
  assert.ok(g.overflow<=1,"Horizontal overflow while keyboard open");
  checks.push({scenario:"resized-"+scenario.width+"x"+scenario.height,...g});
  await page.screenshot({path:join("artifacts/production-explore-viewport",
    "resized-"+scenario.height+".png"),animations:"disabled"});
 }
 await page.setViewportSize({width:390,height:780});
 await page.waitForFunction(()=>document.querySelector("#atlas-sheet")?.style.getPropertyValue("--h")==="376px");
 await settleSheet(376);
 close((await geometry()).sheet.height,376,"restored source peek");
 await page.locator("#atlas-search").fill("");
 await page.locator("#atlas-search").blur();
 // Software keyboards on some browsers shrink *only visualViewport*:
 // emulate that signal without changing production code or layout viewport.
 await page.locator("#atlas-search").focus();
 const overridden=await page.evaluate(()=>{
  const vv=window.visualViewport;
  if(!vv)return false;
  try{
   Object.defineProperty(vv,"height",{configurable:true,get:()=>455});
   vv.dispatchEvent(new Event("resize"));
   return true;
  }catch{return false;}
 });
 assert.ok(overridden,"Cannot emulate visualViewport keyboard contraction");
 await page.waitForFunction(()=>document.querySelector("#atlas-view")?.classList.contains("atlas-keyboard-visible"));
 // With the Home tabbar temporarily hidden under the visual-only keyboard,
 // 455px usable height - 300px map-control reserve = 155px peek.
 // The 150px value is a floor, not the universal keyboard-height target.
 const visualKeyboardPeek=155;
 await settleSheet(visualKeyboardPeek);
 const visualKeyboard=await geometry();
 close(visualKeyboard.view.height,455,"visualViewport OSK height",3);
 close(visualKeyboard.sheet.height,visualKeyboardPeek,"keyboard-state peek");
 assert.equal(visualKeyboard.navVisible,false,
  "Navigation should be noninteractive behind visual-only keyboard");
 assert.ok(visualKeyboard.search.bottom<visualKeyboard.sheet.top,
  "Search must remain above keyboard-visible sheet");
 assert.equal(visualKeyboard.canvas,1);
 checks.push({scenario:"visualViewport-only-keyboard",...visualKeyboard});
 await page.screenshot({path:join("artifacts/production-explore-viewport",
  "visual-viewport-keyboard.png"),animations:"disabled"});
 // Leave the route while the OSK is still present. A hidden Atlas skips
 // resize events; its transient keyboard state must not survive a return.
 await page.evaluate(()=>{window.location.hash="#home";});
 await page.locator("#home-view").waitFor({state:"visible"});
 await page.evaluate(()=>{
  Object.defineProperty(window.visualViewport,"height",
   {configurable:true,get:()=>window.innerHeight});
  window.visualViewport.dispatchEvent(new Event("resize"));
 });
 await page.evaluate(()=>{window.location.hash="#atlas";});
 await page.locator("#atlas-view").waitFor({state:"visible"});
 await page.waitForFunction(()=>!document.querySelector("#atlas-view")?.classList.contains("atlas-keyboard-visible"));
 await settleSheet(376);
 const restored=await geometry();
 close(restored.sheet.height,376,"keyboard closed source peek");
 assert.equal(restored.navVisible,true);
 checks.push({scenario:"keyboard-closed",...restored});
 await page.locator("#atlas-search").blur();
 // Genuine viewport aspect-ratio rotation in Chromium, using mobile/coarse.
 for(const dims of [{width:844,height:390},{width:740,height:360}]){
  await page.setViewportSize(dims);
  await page.waitForFunction(()=>document.querySelector("#atlas-view")?.getBoundingClientRect().height===window.innerHeight);
  const g=await geometry();
  close(g.view.height,dims.height,"landscape viewport");
  assert.ok(g.search.top>=0&&g.search.bottom<g.sheet.top,
   "Landscape search must remain usable above the places sheet");
  assert.ok(g.sheet.height>=100,
   "Landscape sheet grip and headings must not collapse completely");
  assert.ok(g.sheet.bottom<=dims.height+1,
   "Landscape sheet must remain inside screen");
  assert.ok(g.nav.bottom<=dims.height+1);
  assert.ok(g.overflow<=1,"Landscape horizontal overflow");
  assert.equal(g.canvas,1,"Must reuse one MapLibre canvas across rotation");
  checks.push({scenario:"landscape-"+dims.width+"x"+dims.height,...g});
  await page.screenshot({path:join("artifacts/production-explore-viewport",
   "landscape-"+dims.width+".png"),animations:"disabled"});
 }
 await page.setViewportSize({width:390,height:780});
 await page.waitForFunction(()=>document.querySelector("#atlas-sheet")?.style.getPropertyValue("--h")==="376px");
 await settleSheet(376);
 const back=await geometry();
 close(back.sheet.height,376,"portrait after landscape");
 assert.equal(back.canvas,1);
 assert.ok(back.navVisible);
 checks.push({scenario:"portrait-return",...back});
 assert.deepEqual(errors,[],"Console errors: "+errors.join(" | "));
 await context.close();
 console.log("PASS Explore mobile viewport+keyboard+landscape",JSON.stringify(
  checks.map(x=>({scenario:x.scenario,view:x.view.height,
   sheet:x.sheet.height,keyboard:x.keyboard,canvas:x.canvas}))));
}finally{
 await browser.close();
 await new Promise(ok=>server.close(ok));
}
