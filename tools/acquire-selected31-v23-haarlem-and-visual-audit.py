#!/usr/bin/env python3
"""V23: exact owner-selected Haarlem CC BY source + review-sheet audit for all 13 unresolved photos.
Research only. Do not add media to site/, edit prayer-card links or infer release from byte acquisition.
"""
from __future__ import annotations
import hashlib,io,json,pathlib,urllib.request,urllib.parse,urllib.error,time,statistics
from PIL import Image,ImageOps,ImageDraw,ImageStat
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"app-data/sacred-art/staged-selected31-v23"
OUT.mkdir(parents=True,exist_ok=True)
PREV=json.loads((ROOT/"app-data/sacred-art/selected31-clearance-v22.json").read_text())
HELD=[x for x in PREV["records"] if x["disposition"]=="HOLD_SOURCE_ONLY"]
assert len(HELD)==13 and len({x["review_artwork_id"] for x in HELD})==13
SOURCES=[
 {"name":"Cornelis van haarlem, battesimo di cristo, 1588, 02.JPG",
  "sha1":"85d22cb79366926281e7bcaa876f4290c46678d2",
  "width":3312,"height":2736,"file_license":"CC BY 3.0","photographer":"Sailko",
  "page":"https://commons.wikimedia.org/wiki/File:Cornelis_van_haarlem,_battesimo_di_cristo,_1588,_02.JPG"},
 {"name":"Cornelis van haarlem, battesimo di cristo, 1588, 01.JPG",
  "sha1":"ab3841e229d04ad0adc761b67b5ef878e795faf6",
  "width":2756,"height":2736,"file_license":"CC BY 3.0","photographer":"Sailko",
  "page":"https://commons.wikimedia.org/wiki/File:Cornelis_van_haarlem,_battesimo_di_cristo,_1588,_01.JPG"}
]
def sha(b): return hashlib.sha256(b).hexdigest()
def source_url(name):
 n=name.replace(" ","_");d=hashlib.md5(n.encode("utf-8")).hexdigest()
 return f"https://upload.wikimedia.org/wikipedia/commons/{d[:1]}/{d[:2]}/{urllib.parse.quote(n)}"
def get(url):
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; AdOrientemArtSourceAudit/1.0; source photo exact selection)", "Accept":"image/jpeg,image/*;q=0.9,*/*;q=0.5"})
 with urllib.request.urlopen(req,timeout=75) as f:
  b=f.read(15000000)
  if not 50000<len(b)<15000000: raise ValueError("unexpected download size")
  return b
acquired=[];failed=[]
for src in SOURCES:
 try:
  u=source_url(src["name"]);b=get(u)
  if hashlib.sha1(b).hexdigest()!=src["sha1"]:raise ValueError("Commons original SHA-1 mismatch")
  with Image.open(io.BytesIO(b)) as im:im.verify()
  with Image.open(io.BytesIO(b)) as im:
   image=ImageOps.exif_transpose(im).convert("RGB")
   dimensions=[image.width,image.height]
   if dimensions!=[src["width"],src["height"]]:raise ValueError(f"size mismatch {dimensions}")
   if abs(image.width/image.height-206/170)/(206/170)>0.09:
    raise ValueError("Photograph aspect too different from Louvre object; likely framed/perspective view")
   image.thumbnail((2000,2000),Image.Resampling.LANCZOS)
   o=io.BytesIO();image.save(o,format="WEBP",quality=89,method=6);webp=o.getvalue()
   derivative_dims=[image.width,image.height]
  name=OUT/"bap-haarlem-sailko-source.jpg"
  derived=OUT/"bap-haarlem-sailko-2000.webp"
  name.write_bytes(b);derived.write_bytes(webp)
  acquired=[{"review_artwork_id":"bap-haarlem","selected_owner_object":"Louvre RF 1983-25 (1588)",
             "candidate_page":src["page"],"source_url":u,"source_sha1":src["sha1"],
             "source_sha256":sha(b),"source_bytes":len(b),"source_dimensions":dimensions,
             "source_path":str(name.relative_to(ROOT)),"derivative_sha256":sha(webp),
             "derivative_bytes":len(webp),"derivative_dimensions":derivative_dims,
             "derivative_path":str(derived.relative_to(ROOT)),
             "photographer":src["photographer"],"photo_license":src["file_license"],
             "photo_license_url":"https://creativecommons.org/licenses/by/3.0/",
             "photo_credit":"Sailko / Wikimedia Commons; resized, not cropped",
             "object_inventory":"RF 1983-25","object_url":"https://collections.louvre.fr/ark:/53355/cl010064767",
             "rights_gate":"INDEPENDENT_PHOTO_CC_BY3_WITH_ATTRIBUTION__DRAFT_GALLERY_ONLY",
             "visual_gate":"RESOLUTION_AND_GEOMETRY_PASSED__HUMAN_VISUAL_QA_PENDING",
             "status":"SOURCE_ARCHIVE_ONLY__NOT_PUBLISHED"}]
  print("ACQUIRED",src["name"],dimensions,"SHA256",sha(b),flush=True)
  break
 except Exception as e:
  failed.append({"candidate":src["name"],"error":str(e)})
  print("FAILED",src["name"],str(e)[:190],flush=True)
manifest={"schema":"ao.sacred-art.selected31-photo-recovery.v23","purpose":"Verified exact owner-selected artwork, independent photo CC licence, 13-photo research inspection","acquired_count":len(acquired),"records":acquired,"failed_attempts":failed}
(OUT/"acquisition-results.v23.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n")
# A contact sheet and quantitative triage report, from 13 previously archived source derivatives
all_files={}
for v in (13,14,15,17,18,20,21):
 p=ROOT/f"app-data/sacred-art/staged-selected31-v{v}/acquisition-results.v{v}.json"
 if p.exists():
  d=json.loads(p.read_text())
  for x in d.get("records",[]):
   if "derivative_path" in x:all_files[x["review_artwork_id"]]=x
sizes={"bap-haarlem":206/170,"king-bourdon":61/50,"euch-champaigne":149/80,"tri-dolci":59.7/69.5}
tiles=[];details=[]
for x in HELD:
 rid=x["review_artwork_id"];a=all_files.get(rid)
 if not a or not (ROOT/a["derivative_path"]).exists():raise RuntimeError(f"Missing archived derivative {rid}")
 path=ROOT/a["derivative_path"]
 with Image.open(path) as im:
  img=im.convert("RGB");pix=[img.width,img.height];ratio=img.width/img.height
  thumb=img.copy();thumb.thumbnail((365,250),Image.Resampling.LANCZOS)
  edge=img.resize((60,60))
  corners=[edge.getpixel((i,j)) for i,j in [(0,0),(59,0),(0,59),(59,59)]]
  uniform_corners=statistics.mean([statistics.pstdev(c) for c in zip(*corners)])
  sharpness=statistics.mean(ImageStat.Stat(img.resize((128,128))).stddev)
  tile=Image.new("RGB",(390,340),(247,245,241));draw=ImageDraw.Draw(tile)
  tile.paste(thumb,((390-thumb.width)//2,4))
  label=f"{rid} | {x['artist'][:21]}"
  draw.text((12,264),label,fill=(25,30,42))
  draw.text((12,288),f"Source {x['source_dimensions'][0]}x{x['source_dimensions'][1]} | thumb {pix[0]}x{pix[1]}",fill=(75,82,98))
  draw.text((12,310),f"Gate: {x['rights_gate'][:48]}",fill=(96,58,34))
  tiles.append(tile)
  expected=sizes.get(rid);diff=round(100*abs(ratio-expected)/expected,1) if expected else None
  details.append({"review_artwork_id":rid,
    "gallery_status":"HELD__NO_PUBLICATION_AUTHORIZED",
    "photo_archive":str(path.relative_to(ROOT)),
    "photo_sha256":sha(path.read_bytes()),
    "source_dims":x["source_dimensions"],"derivative_dims":pix,
    "image_aspect_ratio":round(ratio,4),"verified_object_physical_aspect_ratio":round(expected,4) if expected else None,
    "photo_to_object_aspect_deviation_percent":diff,
    "composition_warning":"GEOMETRY_MISMATCH__FRAME_OR_CROP_REVIEW" if diff is not None and diff>8 else "NO_AUTOMATIC_COMPOSITION_CONCLUSION",
    "rights_lane":x["rights_gate"],"uniformity_corners":round(uniform_corners,1),
    "image_stddev_sample":round(sharpness,1),"needs_human_composition_review":True,
    "museum_page":x["selected_object_page"]})
sheet=Image.new("RGB",(1560,1360),(250,249,246))
for i,t in enumerate(tiles):sheet.paste(t,((i%4)*390,(i//4)*340))
sheet_name=OUT/"held-13-source-contact-sheet-v23.webp"
sheet.save(sheet_name,format="WEBP",quality=85,method=5)
audit={"schema":"ao.sacred-art.selected31-13-photo-visual-audit.v23",
       "source_clearance":"app-data/sacred-art/selected31-clearance-v22.json",
       "size_provenance":"Canvas cm from exact museum/Commons records when explicitly known; photo geometry only identifies discrepancies, not artwork loss",
       "policy":"All thirteen remain research only until independent rights/identity/quality assessment; contact sheet must NOT be copied into site/",
       "source_contact_sheet":str(sheet_name.relative_to(ROOT)),
       "contact_sheet_sha256":sha(sheet_name.read_bytes()),
       "contact_sheet_bytes":sheet_name.stat().st_size,
       "held_count":len(details),"records":details}
(OUT/"held-photo-audit.v23.json").write_text(json.dumps(audit,indent=2,ensure_ascii=False)+"\n")
assert len(details)==13
print("V23_AUDIT 13 archived research-only photographs; contact sheet",audit["contact_sheet_bytes"],flush=True)
