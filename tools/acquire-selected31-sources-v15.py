#!/usr/bin/env python3
"""V15: source-only acquisition for four exact selected prayer-review works.

Does not alter site/, main gallery, or prayer-stage approvals.
Exact museum identity, publication source and reuse evidence documented per file.
"""
import hashlib, io, json, pathlib, time, urllib.request, urllib.parse, urllib.error
from PIL import Image, ImageOps, ImageStat

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"app-data/sacred-art/staged-selected31-v15"
V12=json.loads((ROOT/"app-data/sacred-art/selected31-gallery-reconciliation-v12.json").read_text())
PENDING={r["review_artwork_id"]:r for r in V12["records"] if r["gallery_status"]=="SOURCE_REVIEW_PENDING"}
SPECS=[
 {"id":"tri-dolci",
  "file":"Carlo Dolci - The Trinity in Glory - 59.009 - Rhode Island School of Design Museum.jpg",
  "sha1":"ca0bdea1c3dec88a1aae1b7174ee638eed336a2b",
  "institution_object":"RISD Museum 59.009","licence":"CC0 1.0, source reproductions attributed to RISD Museum / Erik Gould",
  "licence_url":"https://creativecommons.org/publicdomain/zero/1.0/","photographer":"Erik Gould / RISD Museum","gallery_rights_gate":"CC0_RECORD_CONFIRMED"},
 {"id":"trans-bellini",
  "file":"Giovanni bellini, trasfigurazione, 1478-79, Q56, 01.JPG",
  "sha1":"3717a9c27ac12f16848a3044122041089e6380db",
  "institution_object":"Museo di Capodimonte Q 56","licence":"CC BY 3.0 photographer Sailko; heritage-institution reuse policy to be reviewed",
  "licence_url":"https://creativecommons.org/licenses/by/3.0/","photographer":"Sailko","gallery_rights_gate":"PHOTOGRAPH_LICENSE_CONFIRMED__HERITAGE_POLICY_REVIEW"},
 {"id":"euch-champaigne",
  "file":"Philippe de Champaigne - La Petite Cène (Louvre, INV 1125).jpg",
  "sha1":None,
  "institution_object":"Musée du Louvre INV 1125","licence":"Independent photograph by Tangopaso dedicated to public domain",
  "licence_url":"https://commons.wikimedia.org/wiki/File:Philippe_de_Champaigne_-_La_Petite_C%C3%A8ne_(Louvre,_INV_1125).jpg","photographer":"Tangopaso","gallery_rights_gate":"PHOTOGRAPHER_PUBLIC_DOMAIN_DECLARATION"},
 {"id":"euch-tiepolo",
  "file":"Giovan battista tiepolo, la cena, 1745-47 ca..JPG",
  "sha1":None,
  "institution_object":"Musée du Louvre RF 176","licence":"CC BY 3.0 photographer Sailko",
  "licence_url":"https://creativecommons.org/licenses/by/3.0/","photographer":"Sailko","gallery_rights_gate":"CC_BY_3_WITH_CREDIT_REQUIRED"}
]
assert len(SPECS)==len(set(x["id"] for x in SPECS))==4
assert set(x["id"] for x in SPECS).issubset(PENDING)
def get(url,limit=33000000):
    req=urllib.request.Request(url,headers={"User-Agent":"AdOrientem SacredArt (exact selected artwork provenance check; Github Actions)"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req,timeout=90) as r: b=r.read(limit+1)
            if not 100<len(b)<=limit: raise ValueError("Invalid or huge response")
            return b
        except urllib.error.HTTPError as e:
            if e.code not in (429,502,503,504) or attempt==3: raise
            time.sleep(5*(2**attempt))
    raise ValueError("All attempts failed")
def sha256(b): return hashlib.sha256(b).hexdigest()
def commons_url(filename):
    normal=filename.replace(" ","_")
    h=hashlib.md5(normal.encode("utf-8")).hexdigest()
    return "https://upload.wikimedia.org/wikipedia/commons/"+h[0]+"/"+h[:2]+"/"+urllib.parse.quote(normal)
OUT.mkdir(parents=True,exist_ok=True)
got=[];held=[]
for spec in SPECS:
    rid=spec["id"]
    try:
        rec=PENDING[rid]
        assert rec["museum_page"].startswith("https://")
        source_url=commons_url(spec["file"])
        data=get(source_url)
        sha1=hashlib.sha1(data).hexdigest()
        if spec["sha1"] and sha1!=spec["sha1"]: raise ValueError("Source SHA1 mismatch")
        with Image.open(io.BytesIO(data)) as im: im.verify()
        with Image.open(io.BytesIO(data)) as im:
            image=ImageOps.exif_transpose(im).convert("RGB")
            dims=[image.width,image.height]
            if min(dims)<500 or max(dims)<850: raise ValueError("Too small for preview")
            if sum(ImageStat.Stat(image.resize((32,32))).stddev)<15: raise ValueError("Likely placeholder")
            image.thumbnail((2000,2000),Image.Resampling.LANCZOS)
            b=io.BytesIO();image.save(b,"WEBP",quality=88,method=6)
            thumb=b.getvalue(); thumbdims=[image.width,image.height]
        basename=rid.replace("-","_")
        src=OUT/(basename+"-source.jpg");deriv=OUT/(basename+"-2000.webp")
        src.write_bytes(data);deriv.write_bytes(thumb)
        got.append({
            "review_artwork_id":rid,"title":rec["title"],"artist":rec["artist"],
            "museum_page":rec["museum_page"],"museum_object":spec["institution_object"],
            "source_file":"https://commons.wikimedia.org/wiki/File:"+urllib.parse.quote(spec["file"].replace(" ","_")),
            "source_image_url":source_url,"photographer":spec["photographer"],
            "source_file_sha1":sha1,"source_sha256":sha256(data),"source_bytes":len(data),
            "source_dimensions":dims,"source_path":str(src.relative_to(ROOT)),
            "derivative_sha256":sha256(thumb),"derivative_bytes":len(thumb),
            "derivative_dimensions":thumbdims,"derivative_path":str(deriv.relative_to(ROOT)),
            "licence_evidence":spec["licence"],"licence_url":spec["licence_url"],
            "rights_gate":spec["gallery_rights_gate"],
            "quality_gate":"PREVIEW_ONLY__SMALL_SOURCE" if min(dims)<1200 else "COMPOSITION_VERIFICATION_PENDING",
            "composition_full_frame":True,
            "status":"ARCHIVED_SOURCE_ONLY__VISUAL_REVIEW_PENDING__NO_PUBLICATION"
        })
        print("ACQUIRED",rid,dims,"=>",thumbdims,flush=True)
    except Exception as e:
        held.append({"review_artwork_id":rid,"reason":str(e)})
        print("HELD",rid,str(e),flush=True)
output={"schema":"ao.sacred-art.selected31-v15-source-acquisition.v1",
        "scope":"Archived sources only, no app image binding, no prayer-card placement",
        "acquired_count":len(got),"held_count":len(held),
        "records":got,"holds":held}
(OUT/"acquisition-results.v15.json").write_text(json.dumps(output,indent=2,ensure_ascii=False)+"\n")
if not got: raise RuntimeError("No source acquired")
print("V15 COMPLETE",len(got),"sources,",len(held),"held",flush=True)
