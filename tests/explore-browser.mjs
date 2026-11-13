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
  await page.waitForFunction(()=>document.querySelector("#atlas-count")?.textContent==="18 / 18",
   null,{timeout:20000});
  await page.waitForFunction(()=>document.querySelectorAll("#atlas-map canvas").length===1,
   null,{timeout:30000});
  // Canvas allocation alone does not imply that tiles and source-backed pins
  // are ready. The "load" event hides this status only after adding GeoJSON.
  await page.waitForFunction(()=>document.getElementById("atlas-map-status")?.hidden===true,
   null,{timeout:30000});
  assert.equal(await page.locator(".atlas-switch > button").count(),2,"Exactly two top-level Atlases");
  assert.equal(await page.locator(".tabbar > button").count(),4,"Exactly four original bottom tabs");
  assert.equal(await page.locator("#atlas-results > li").count(),18);
  const dom=await page.evaluate(()=>({
    horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
    mapCount:document.querySelectorAll("#atlas-map canvas").length,
    worldHeight:document.getElementById("atlas-world").getBoundingClientRect().height,
    mapHeight:document.getElementById("atlas-map").getBoundingClientRect().height,
    attribution:Boolean(document.querySelector("#atlas-map .maplibregl-ctrl-attrib"))
  }));
  assert.ok(dom.horizontalOverflow<=1,width+"px overflow: "+JSON.stringify(dom));
  assert.equal(dom.mapCount,1);
  assert.ok(dom.mapHeight>=300&&dom.worldHeight>=44,JSON.stringify(dom));
  assert.ok(dom.attribution,"Source map attribution control missing");
  await page.locator("#atlas-results .atlas-result-button").first().click();
  await page.locator("#atlas-card").waitFor({state:"visible"});
  assert.equal(await page.locator("#atlas-card [data-visual-kind='category-symbol']").count(),1,
    "No unapproved images should be substituted for missing verified media");
  assert.ok(await page.locator("#atlas-card a[href^='https://']").count()>=1,
    "Missing coordinate-source link");
  await page.screenshot({path:join("artifacts/production-explore",width+"-en-sacred.png"),
   animations:"disabled",fullPage:true});
  await page.locator("#atlas-lens-tlm").click();
  await page.waitForFunction(()=>document.querySelector("#atlas-count")?.textContent==="10 / 10");
  assert.equal(await page.locator("#atlas-results > li").count(),10);
  await page.locator("#atlas-results .atlas-result-button").first().click();
  await page.locator("#atlas-card").waitFor({state:"visible"});
  assert.ok(await page.locator("#atlas-card a[href*='institute-christ-king.org']").count()>=1,
    "TLM venue official institute evidence missing");
  assert.match(await page.locator("#atlas-card").innerText(),/Mass times are not imported/);
  await page.locator("#atlas-language").click();
  assert.match(await page.locator("#atlas-map-hint").innerText(),/horaires/);
  await page.screenshot({path:join("artifacts/production-explore",width+"-fr-tlm.png"),
   animations:"disabled",fullPage:true});
  await page.locator("#atlas-world").click();
  await page.locator('#atlas-view [data-route="home"]').click();
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
