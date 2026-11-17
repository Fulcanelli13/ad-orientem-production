#!/usr/bin/env python3
"""V24: create a visual 31/31 owner-selection comparison matrix, never the live gallery.
Original source files remain untouched; contact sheets are research-only, no AI reconstruction.
"""
import pathlib,json,hashlib,math,io
from PIL import Image,ImageOps,ImageDraw,ImageFont,ImageStat
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"app-data/sacred-art/staged-selected31-v24"
OUT.mkdir(parents=True,exist_ok=True)
REG=json.loads((ROOT/"app-data/sacred-art/selected31-clearance-v23.json").read_text())
assert len(REG["records"])==31
provenance={}
for f in sorted((ROOT/"app-data/sacred-art").glob("staged-selected31-v*/acquisition-results.v*.json")):
  try: raw=json.loads(f.read_text())
  except Exception:continue
  for r in raw.get("records",[]):
    if isinstance(r,dict) and "review_artwork_id" in r and "derivative_path" in r:
      provenance[r["review_artwork_id"]]=r
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def choose(row):
  if row["disposition"]=="HOLD_SOURCE_ONLY":
    r=provenance.get(row["review_artwork_id"])
    assert r is not None,row["review_artwork_id"]
    return r["derivative_path"],"RESEARCH_ARCHIVE"
  assert row["gallery_image_file"],row["review_artwork_id"]
  return row["gallery_image_file"],"GALLERY_EXISTING" if row["disposition"]=="CURRENT_MAIN_PRESERVE" else "DRAFT_GALLERY"
rows=[];images=[]
for selected in REG["records"]:
  ident=selected["review_artwork_id"]
  rel,lane=choose(selected)
  p=ROOT/rel
  assert p.is_file(),f"Missing photo {ident}: {p}"
  with Image.open(p) as im:
    im.verify()
  with Image.open(p) as im:
    img=ImageOps.exif_transpose(im).convert("RGB")
    dims=[img.width,img.height]
    assert min(dims)>120 and max(dims)<16000
    thumbnail=img.copy();thumbnail.thumbnail((325,225),Image.Resampling.LANCZOS)
    sample=img.resize((32,32),Image.Resampling.LANCZOS)
    colorstd=[round(v,1) for v in ImageStat.Stat(sample).stddev]
  rows.append({
    "review_artwork_id":ident,"title":selected["title"],"artist":selected["artist"],
    "destination":selected["destination"],"disposition":selected["disposition"],
    "source_lane":lane,"photograph_path":rel,
    "source_sha256":sha(p),"pixel_dimensions":dims,
    "source_rights_gate":selected.get("rights_gate"),
    "selection_original_unchanged":True,"approved_prayer_card_default":False,
    "needs_human_aesthetic_review":selected["disposition"]!="CURRENT_MAIN_PRESERVE",
    "image_contrast_stddev_rgb":colorstd
  })
  images.append(thumbnail)
assert len(rows)==len(images)==31
TILE_W,TILE_H=380,318
def contact(subset,path,cols):
  count=len(subset)
  sheet=Image.new("RGB",(TILE_W*cols,TILE_H*math.ceil(count/cols)),(250,249,245))
  draw=ImageDraw.Draw(sheet)
  for i,idx in enumerate(subset):
    r=rows[idx];img=images[idx]
    x=(i%cols)*TILE_W;y=(i//cols)*TILE_H
    draw.rounded_rectangle((x+5,y+5,x+TILE_W-5,y+TILE_H-5),radius=7,fill=(241,240,236),outline=(210,211,213),width=1)
    # Category belongs to research sheet, never gallery publication or release permission.
    status={"CURRENT_MAIN_PRESERVE":"ALREADY LIVE","DRAFT_GALLERY_ELIGIBLE":"DRAFT ONLY","HOLD_SOURCE_ONLY":"HELD SOURCE"}[r["disposition"]]
    bar={"CURRENT_MAIN_PRESERVE":(58,88,75),"DRAFT_GALLERY_ELIGIBLE":(70,82,125),"HOLD_SOURCE_ONLY":(137,102,77)}[r["disposition"]]
    draw.rounded_rectangle((x+14,y+13,x+TILE_W-14,y+39),radius=3,fill=bar)
    draw.text((x+25,y+19),f'{i+1:02d}   {status}',fill=(252,252,251))
    py=y+45
    sheet.paste(img,(x+(TILE_W-img.width)//2,py+(225-img.height)//2))
    draw.text((x+15,y+276),r["review_artwork_id"]+" | "+r["artist"][:24],fill=(29,30,39))
    draw.text((x+15,y+297),f'{r["pixel_dimensions"][0]} x {r["pixel_dimensions"][1]} | {r["destination"]}',fill=(83,85,93))
  sheet.save(path,format="WEBP",quality=86,method=5)
  return {"path":str(path.relative_to(ROOT)),"sha256":sha(path),"bytes":path.stat().st_size,"dimensions":[sheet.width,sheet.height],"count":count}
all_sheet=contact(list(range(31)),OUT/"selected31-all-review-matrix.v24.webp",4)
draft_ids=[i for i,r in enumerate(rows) if r["disposition"]=="DRAFT_GALLERY_ELIGIBLE"]
draft_sheet=contact(draft_ids,OUT/"selected31-eleven-draft-contact-sheet.v24.webp",4)
counts={tag:sum(r["disposition"]==tag for r in rows) for tag in ["CURRENT_MAIN_PRESERVE","DRAFT_GALLERY_ELIGIBLE","HOLD_SOURCE_ONLY"]}
assert counts=={"CURRENT_MAIN_PRESERVE":7,"DRAFT_GALLERY_ELIGIBLE":11,"HOLD_SOURCE_ONLY":13}
audit={
  "schema":"ao.sacred-art.selected31-all-visual-source-matrix.v24",
  "review_date":"2026-11-17",
  "source_registry":"app-data/sacred-art/selected31-clearance-v23.json",
  "policy":"Research-only derivatives of exact owner-selected files. All 31 artworks remain represented; no changes to live catalogue, selection, public site or prayer assignments.",
  "category_counts":counts,
  "total":31,
  "contact_sheets":{"all_31":all_sheet,"draft_11":draft_sheet},
  "rows":rows,
  "no_gallery_publication":True,
  "no_new_photo_acquisition":True,
  "no_cinematic_approval":True
}
(OUT/"selected31-all-visual-source-matrix.v24.json").write_text(json.dumps(audit,indent=2,ensure_ascii=False)+"\n")
print("V24 31/31 matrix:",json.dumps({"count":len(rows),"categories":counts,"all_bytes":all_sheet["bytes"],"draft_bytes":draft_sheet["bytes"]}),flush=True)
