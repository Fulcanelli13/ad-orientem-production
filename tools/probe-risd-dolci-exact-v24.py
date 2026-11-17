#!/usr/bin/env python3
"""Research RISD 59.009 open API for an exact high-resolution Dolci image.
One-shot and source-bank-only. HTTP errors or small photos must leave art on hold.
"""
import urllib.request,urllib.parse,urllib.error,hashlib,json,pathlib,io
from PIL import Image,ImageOps
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"app-data/sacred-art/staged-selected31-v24"
OUT.mkdir(parents=True,exist_ok=True)
UA={"User-Agent":"Mozilla/5.0 (compatible; AdOrientemSacredArtMuseumSourceResearch/1.0)","Accept":"application/json, image/jpeg;q=0.9, */*;q=0.8"}
SEARCH=["https://risdmuseum.org/api/v1/collection?search_api_fulltext=59.009&items_per_page=5",
        "https://risdmuseum.org/api/v1/collection?search_api_fulltext=Trinity%20in%20Glory&items_per_page=5"]
MAX=17000000
def fetch(url):
  if not url.startswith("https://") or not urllib.parse.urlsplit(url).hostname.endswith(("risdmuseum.org","risdmuseum.cdn.picturepark.com")):
    raise RuntimeError("Non-RISD image host rejected by research allowlist: "+url[:110])
  req=urllib.request.Request(url,headers=UA)
  with urllib.request.urlopen(req,timeout=45) as r:
    data=r.read(MAX+1)
    if len(data)>MAX:raise RuntimeError("Media exceeds archive byte limit")
    return data,r.headers.get("Content-Type","")
def hash256(data):return hashlib.sha256(data).hexdigest()
api_attempts=[];hits=[]
for u in SEARCH:
  try:
    data,content_type=fetch(u)
    if not data.lstrip().startswith(b"["):raise RuntimeError("Non-JSON response, content-type "+content_type)
    objects=json.loads(data)
    for obj in objects:
      if str(obj.get("objectNumber") or "").strip()!="59.009":continue
      if "Trinity" not in str(obj.get("title") or ""):continue
      hits.append(obj)
    api_attempts.append({"url":u,"status":"OK","rows":len(objects),"matching":len(hits),"content_type":content_type})
  except Exception as e:
    api_attempts.append({"url":u,"status":"UNAVAILABLE","reason":str(e)[:300]})
  if hits:break
candidates=[]
for h in hits:
  if not h.get("publicDomain"):continue
  for url in h.get("images") or []:
    if isinstance(url,str) and url.startswith("http"):
      candidates.append(url)
# The exact institutional public photo from Commons is included as a known baseline,
# but not counted as a new candidate, and not re-downloaded needlessly.
archive=json.loads((ROOT/"app-data/sacred-art/staged-selected31-v15/acquisition-results.v15.json").read_text())
old=next(x for x in archive["records"] if x["review_artwork_id"]=="tri-dolci")
assert old["source_dimensions"]==[877,1024]
source_results=[];upgrades=[]
for url in list(dict.fromkeys(candidates))[:5]:
  try:
    b,typ=fetch(url)
    with Image.open(io.BytesIO(b)) as im: im.verify()
    with Image.open(io.BytesIO(b)) as im:
      img=ImageOps.exif_transpose(im).convert("RGB")
      dims=[img.width,img.height]
      if not 0.80<img.width/img.height<0.94: raise RuntimeError("Image geometry differs from RISD 59.009; check for other view")
      if max(dims)<=1100:
        source_results.append({"url":url,"dimensions":dims,"status":"LOW_RES_ONLY__NOT_PROMOTED"})
        continue
      # Archive only; do not assume that 1.1K is enough for gallery or prayer hero.
      src=OUT/"tri-dolci-risd-api-source.jpg"
      src.write_bytes(b)
      img.thumbnail((2000,2000),Image.Resampling.LANCZOS)
      buf=io.BytesIO();img.save(buf,"WEBP",quality=88,method=6)
      der=OUT/"tri-dolci-risd-api-2000.webp";der.write_bytes(buf.getvalue())
      row={"review_artwork_id":"tri-dolci","accession":"59.009","title":"The Trinity in Glory",
         "artist":"Carlo Dolci","museum":"Rhode Island School of Design Museum",
         "source_url":url,"source_dimensions":dims,"source_path":str(src.relative_to(ROOT)),
         "source_sha256":hash256(b),"source_bytes":len(b),
         "derivative_dimensions":[img.width,img.height],"derivative_path":str(der.relative_to(ROOT)),
         "derivative_sha256":hash256(buf.getvalue()),"derivative_bytes":len(buf.getvalue()),
         "source_rights_claim":"RISD open collection API publicDomain=true; exact object 59.009; official museum CC0 policy",
         "source_status":"ARCHIVED_RESEARCH_ONLY__HUMAN_QUALITY_REVIEW_REQUIRED__NO_GALLERY_OR_PRAYER_RELEASE"}
      upgrades.append(row);source_results.append({"url":url,"status":"ARCHIVED_RESEARCH_ONLY","dimensions":dims})
      break
  except Exception as e:source_results.append({"url":url,"status":"NOT_ACQUIRED","reason":str(e)[:300]})
out={"schema":"ao.sacred-art.risd-dolci-exact-photo-probe.v24",
     "intent":"Investigate exact RISD 59.009 open API, do not publish image automatically",
     "api_attempts":api_attempts,
     "museum_exact_object_count":len(hits),
     "museum_object_summary":[{"id":x.get("id"),"accession":x.get("objectNumber"),"title":x.get("title"),"publicDomain":x.get("publicDomain"),"images":x.get("images")} for x in hits],
     "image_attempts":source_results,
     "new_high_res_archive_count":len(upgrades),"upgrades":upgrades,
     "prior_archived_size":[877,1024],
     "conclusion":"HIGHER_RES_RESEARCH_ARCHIVED__RELEASE_STILL_HELD" if upgrades else "NO_VERIFIED_HIGHER_RESOLUTION_AVAILABLE_IN_API__HOLD_UNCHANGED",
     "no_site_or_prayer_change":True}
(OUT/"risd-dolci-probe.v24.json").write_text(json.dumps(out,indent=2,ensure_ascii=False)+"\n")
assert out["no_site_or_prayer_change"] and len(upgrades)<=1
print("V24_RISD_API",json.dumps({"api":api_attempts,"matching":len(hits),"candidates":len(candidates),"image_attempts":source_results,"upgraded":len(upgrades)},ensure_ascii=False),flush=True)
