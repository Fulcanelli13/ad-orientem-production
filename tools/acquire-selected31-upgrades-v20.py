#!/usr/bin/env python3
"""V20: upgrade only exact preselected source photographs. Never publish to site/ or change cards."""
import hashlib,io,json,pathlib,re,time,urllib.request,urllib.parse,urllib.error
from PIL import Image,ImageOps,ImageStat
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"app-data/sacred-art/staged-selected31-v20"
REG=json.loads((ROOT/"app-data/sacred-art/selected31-clearance-v19.json").read_text())
BY_ID={r["review_artwork_id"]:r for r in REG["records"]}
SPECS=[
 {"id":"cana-francken","old":[1000,558],"minimum":1750,
  "provider":"Nationalmuseum Stockholm NM 7504; Commons exact Nationalmuseum photograph, 1920x919",
  "file":"The Wedding at Cana by Frans Francken the Younger, Nationalmuseum, Stockholm.jpg",
  "sha1":"e0e1011ae234d7dbfced32f6eacd544392a87541",
  "licence":"Commons Public Domain Mark, Nationalmuseum photo credit/rights recheck pending",
  "gate":"SOURCE_ONLY__NATIONALMUSEUM_EXACT_PHOTOGRAPH_RIGHTS_CHECK"},
 {"id":"cana-vermeyen","old":[1166,925],"minimum":2400,
  "provider":"Rijksmuseum Amsterdam SK-A-4820; current Linked Art -> IIIF original",
  "licence":"Rijksmuseum object Public Domain (official page); credit Rijksmuseum Amsterdam",
  "gate":"SOURCE_ONLY__RIJKSMUSEUM_PRIMARY_IMAGE_VISUAL_QA"},
 {"id":"tri-dolci","old":[877,1024],"minimum":1500,
  "provider":"RISD Museum 59.009; public-domain / CC0 museum source",
  "url":"https://risdmuseum.org/sites/default/files/museumplus/69902.jpg",
  "licence":"RISD Museum CC0 1.0; credit courtesy of RISD Museum",
  "gate":"SOURCE_ONLY__RISD_IMAGE_COMPOSITION_QA"}
]
assert set(x["id"] for x in SPECS)<=set(BY_ID)
UA="AdOrientemSacredArtResearch/2.0 (exact selected museum paintings; source-only no publication)"
def get(url,limit=55000000):
  req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"application/ld+json, application/json, image/jpeg;q=0.8, */*;q=0.5"})
  for i in range(3):
    try:
      with urllib.request.urlopen(req,timeout=75) as f: data=f.read(limit+1)
      if not 100<len(data)<=limit:raise RuntimeError("Unexpected byte length")
      return data
    except (urllib.error.HTTPError,urllib.error.URLError,TimeoutError) as exc:
      if isinstance(exc,urllib.error.HTTPError) and exc.code not in (429,502,503,504):raise
      if i==2:raise
      print("retry",i,url,str(exc)[:150],flush=True);time.sleep(3*(2**i))
def url_commons(name):
  slug=name.replace(" ","_");d=hashlib.md5(slug.encode()).hexdigest()
  return f"https://upload.wikimedia.org/wikipedia/commons/{d[0]}/{d[:2]}/{urllib.parse.quote(slug)}"
def get_json(url):return json.loads(get(url))
def rijks():
  object_uri="https://data.rijksmuseum.nl/200108373"
  record=get_json(object_uri+"?_profile=la-framed")
  ids=[x.get("content","") for x in record.get("identified_by",[]) if x.get("type")=="Identifier"]
  if "SK-A-4820" not in ids:raise RuntimeError("Rijksmuseum object mismatch: "+repr(ids[:6]))
  shows=record.get("shows") or []
  if not shows:raise RuntimeError("No Rijksmuseum visual item")
  vi=shows[0]["id"].replace("id.rijksmuseum.nl","data.rijksmuseum.nl")
  v=get_json(vi+"?_profile=la-framed")
  dig=v.get("digitally_shown_by") or []
  if not dig:raise RuntimeError("No Rijksmuseum digital object")
  do=dig[0]["id"].replace("id.rijksmuseum.nl","data.rijksmuseum.nl")
  d=get_json(do+"?_profile=la-framed")
  links=[x.get("id","") for x in d.get("access_point",[]) if "iiif.micr.io/" in x.get("id","")]
  if not links:raise RuntimeError("Missing Rijksmuseum IIIF media URL")
  code=links[0].split("iiif.micr.io/")[1].split("/")[0]
  info=get_json(f"https://iiif.micr.io/{code}/info.json")
  if info.get("width",0)<2400 or info.get("height",0)<1800:raise RuntimeError("Original IIIF unexpectedly small")
  url=f"https://iiif.micr.io/{code}/full/4000,/0/default.jpg"
  return url,get(url),{"iiif_id":code,"iiif_native_dimensions":[info.get("width"),info.get("height")],"object_uri":object_uri}
OUT.mkdir(parents=True,exist_ok=True)
records=[];holds=[]
for spec in SPECS:
  rid=spec["id"];base=BY_ID[rid]
  assert base["disposition"]=="HOLD_SOURCE_ONLY"
  try:
    metadata={}
    if rid=="cana-vermeyen":
      u,data,metadata=rijks()
    elif rid=="cana-francken":
      u=url_commons(spec["file"]);data=get(u)
      if hashlib.sha1(data).hexdigest()!=spec["sha1"]:raise RuntimeError("Commons published SHA-1 mismatch")
      metadata["commons_file_page"]="https://commons.wikimedia.org/wiki/File:"+urllib.parse.quote(spec["file"].replace(" ","_"))
    else:
      u=spec["url"];data=get(u)
    with Image.open(io.BytesIO(data)) as im:im.verify()
    with Image.open(io.BytesIO(data)) as im:
      img=ImageOps.exif_transpose(im).convert("RGB")
      dimensions=[img.width,img.height]
      if max(dimensions)<spec["minimum"]:raise RuntimeError(f"No resolution upgrade: {dimensions}")
      ratio=img.width/img.height
      if rid=="cana-vermeyen" and not 1.05<ratio<1.6:raise RuntimeError(f"Unexpected Vermeyen aspect ratio {ratio:.3f}")
      if rid=="cana-francken" and not 1.9<ratio<2.2:raise RuntimeError(f"Unexpected Francken aspect ratio {ratio:.3f}")
      if sum(ImageStat.Stat(img.resize((32,32))).stddev)<12:raise RuntimeError("Likely placeholder image")
      img.thumbnail((2000,2000),Image.Resampling.LANCZOS)
      out=io.BytesIO();img.save(out,"WEBP",quality=88,method=6)
      thumb=out.getvalue();small=[img.width,img.height]
    source=OUT/(rid+"-museum-source.jpg");derivative=OUT/(rid+"-2000.webp")
    source.write_bytes(data);derivative.write_bytes(thumb)
    row={"review_artwork_id":rid,"title":base["title"],"artist":base["artist"],
      "exact_object_page":base["selected_object_page"],"object_verified":spec["provider"],
      "source_image_url":u,"source_sha1":hashlib.sha1(data).hexdigest(),
      "source_sha256":hashlib.sha256(data).hexdigest(),"source_bytes":len(data),
      "source_dimensions":dimensions,"source_path":str(source.relative_to(ROOT)),
      "derivative_sha256":hashlib.sha256(thumb).hexdigest(),"derivative_bytes":len(thumb),
      "derivative_dimensions":small,"derivative_path":str(derivative.relative_to(ROOT)),
      "old_source_dimensions":spec["old"],"photograph_rights_statement":spec["licence"],
      "rights_gate":spec["gate"],"quality_gate":"RESOLUTION_UPGRADED__IMAGE_AND_REUSE_REVIEW_PENDING",
      "status":"SOURCE_ARCHIVE_ONLY__NO_SITE_OR_PRAYER_BINDING",**metadata}
    records.append(row)
    print("UPGRADED",rid,dimensions,small,len(data),flush=True)
  except Exception as e:
    holds.append({"review_artwork_id":rid,"reason":str(e)})
    print("REMAINS_HELD",rid,repr(e),flush=True)
result={"schema":"ao.sacred-art.selected31-v20-source-upgrade",
  "purpose":"Upgrade owner-selected source photographs in archive only; do not publish until image rights and quality gates pass",
  "attempted":len(SPECS),"acquired_count":len(records),"held_count":len(holds),"records":records,"holds":holds}
(OUT/"acquisition-results.v20.json").write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n")
assert len(records)+len(holds)==len(SPECS)
if not records:raise RuntimeError("No source upgraded")
print("V20 UPGRADE COMPLETE",len(records),"sources,",len(holds),"unresolved",flush=True)
