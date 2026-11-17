#!/usr/bin/env python3
"""V17: archive four selected, exact-object Commons source photos (not live).

Some museum/heritage rights remain unclear despite the photographers' licences.
This script NEVER writes into site/ or authorizes prayer-card publication.
"""
import hashlib,io,json,pathlib,time,urllib.request,urllib.parse,urllib.error
from PIL import Image,ImageOps,ImageStat

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"app-data/sacred-art/staged-selected31-v17"
V12=json.loads((ROOT/"app-data/sacred-art/selected31-gallery-reconciliation-v12.json").read_text())
HOLD={x["review_artwork_id"]:x for x in V12["records"] if x["gallery_status"]=="SOURCE_REVIEW_PENDING"}
WORKS=[
 {"id":"bap-haarlem","filename":"Le Baptême du Christ - Cornelis Cornelisz van Haarlem - Musée du Louvre - Peintures RF 1983-25.jpg",
  "expected_sha1":None,"institution":"Musée du Louvre, RF 1983-25",
  "photographer":"Shonagon","license":"PD-Art / Public Domain Mark (Commons faithful reproduction)",
  "license_url":"https://creativecommons.org/publicdomain/mark/1.0/",
  "gate":"SOURCE_ONLY__LOUVRE_REUSE_AND_ORIGINAL_SELECTION_IDENTITY_REVIEW"},
 {"id":"trans-raphael","filename":"Raphael, Transfiguration, 1518-20; Vatican Museums (2) (48758898761).jpg",
  "expected_sha1":None,"institution":"Vatican Museums, Pinacoteca, Raphael Transfiguration",
  "photographer":"Richard Mortel","license":"CC BY 2.0 (Flickr licence reviewed on Commons)",
  "license_url":"https://creativecommons.org/licenses/by/2.0/",
  "gate":"SOURCE_ONLY__VATICAN_PHOTOGRAPH_PUBLISHING_REVIEW"},
 {"id":"euch-bassano","filename":"Jacopo bassano, ultima cena, 1546-48 circa, 01.jpg",
  "expected_sha1":None,
  "institution":"Galleria Borghese, inventory 144",
  "photographer":"Sailko","license":"CC BY 3.0 (Sailko); separate Italian heritage-reuse warning",
  "license_url":"https://creativecommons.org/licenses/by/3.0/",
  "gate":"SOURCE_ONLY__ITALIAN_HERITAGE_REUSE_HOLD"},
 {"id":"euch-rubens","filename":"Rubens, ultima cena, 1631-32, 01.jpg",
  "expected_sha1":"db35a7900d12cd630ebf73249b732e8a3b493ba4",
  "institution":"Pinacoteca di Brera, inventory 97",
  "photographer":"Francesco Bini / Sailko","license":"CC BY-SA 4.0; separate Italian heritage-reuse warning",
  "license_url":"https://creativecommons.org/licenses/by-sa/4.0/",
  "gate":"SOURCE_ONLY__ITALIAN_HERITAGE_REUSE_HOLD"}
]
assert {x["id"] for x in WORKS} <= set(HOLD)
def http(url,limit=33000000):
    req=urllib.request.Request(url,headers={"User-Agent":"AdOrientemSacredArt/1.0 source provenance; github-actions; no-publication"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req,timeout=100) as f: data=f.read(limit+1)
            if not 100<len(data)<=limit: raise RuntimeError("Invalid response size")
            return data
        except urllib.error.HTTPError as e:
            if e.code not in (429,502,503,504) or attempt==3: raise
            print("Retry",e.code,attempt,flush=True);time.sleep(5*(2**attempt))
def raw_url(name):
    normalized=name.replace(" ","_")
    md5=hashlib.md5(normalized.encode("utf-8")).hexdigest()
    return f"https://upload.wikimedia.org/wikipedia/commons/{md5[0]}/{md5[:2]}/{urllib.parse.quote(normalized)}"
def sha256(x):return hashlib.sha256(x).hexdigest()
OUT.mkdir(parents=True,exist_ok=True)
result=[];holds=[]
prior=OUT/"acquisition-results.v17.json"
if prior.exists():
    prev=json.loads(prior.read_text())
    for record in prev.get("records",[]):
        rid=record["review_artwork_id"]
        if rid=="euch-bassano": continue  # old 04 photograph was a detail
        if rid not in {x["id"] for x in WORKS}: continue
        if all((ROOT/record[k+"_path"]).is_file() and
               hashlib.sha256((ROOT/record[k+"_path"]).read_bytes()).hexdigest()==record[k+"_sha256"]
               for k in ("source","derivative")):
            result.append(record)
            print("PRESERVED",rid,flush=True)
done={x["review_artwork_id"] for x in result}
for x in sorted(WORKS,key=lambda q:q["id"]!="euch-bassano"):
    rid=x["id"];source=HOLD[rid]
    if rid in done: continue
    try:
        u=raw_url(x["filename"]);data=http(u)
        sha1=hashlib.sha1(data).hexdigest()
        if x["expected_sha1"] and sha1!=x["expected_sha1"]: raise RuntimeError("Original SHA1 mismatch")
        with Image.open(io.BytesIO(data)) as im: im.verify()
        with Image.open(io.BytesIO(data)) as im:
            img=ImageOps.exif_transpose(im).convert("RGB")
            orig=[img.width,img.height]
            if min(orig)<500 or max(orig)<1000 or sum(ImageStat.Stat(img.resize((32,32))).stddev)<15:
                raise RuntimeError("Low quality/placeholder reproduction")
            img.thumbnail((2000,2000),Image.Resampling.LANCZOS)
            buf=io.BytesIO();img.save(buf,"WEBP",quality=88,method=6)
            webp=buf.getvalue();small=[img.width,img.height]
        src=OUT/(rid+"-source.jpg");web=OUT/(rid+"-2000.webp")
        src.write_bytes(data);web.write_bytes(webp)
        result.append({"review_artwork_id":rid,"title":source["title"],"artist":source["artist"],
         "original_selection_source":source["museum_page"],"verified_museum_identity":x["institution"],
         "photographer":x["photographer"],"license":x["license"],"license_url":x["license_url"],
         "source_commons_file":"https://commons.wikimedia.org/wiki/File:"+urllib.parse.quote(x["filename"].replace(" ","_")),
         "source_image_url":u,"source_sha1":sha1,"source_sha256":sha256(data),
         "source_bytes":len(data),"source_dimensions":orig,"source_path":str(src.relative_to(ROOT)),
         "derivative_sha256":sha256(webp),"derivative_bytes":len(webp),
         "derivative_dimensions":small,"derivative_path":str(web.relative_to(ROOT)),
         "rights_gate":x["gate"],"full_original_composition":True,
         "status":"SOURCE_ARCHIVE_ONLY__NO_PUBLIC_APP_OR_PRAYER_BINDING"})
        print("ACQUIRED",rid,orig,flush=True)
    except Exception as e:
        holds.append({"review_artwork_id":rid,"reason":str(e)})
        print("HELD",rid,str(e),flush=True)
output={"schema":"ao.sacred-art.selected31-source-acquisition-v17","intent":"Research source bank only, no gallery placement, no prayer-card authorization",
        "acquired_count":len(result),"held_count":len(holds),"records":result,"holds":holds}
(OUT/"acquisition-results.v17.json").write_text(json.dumps(output,indent=2,ensure_ascii=False)+"\n")
if not result: raise RuntimeError("No artwork passed source acquisition")
print("V17",len(result),"source originals retained,",len(holds),"held",flush=True)
