#!/usr/bin/env python3
"""V21: recover exact Nationalmuseum NM 7504 Francken from institution/Commons, source bank only.
No gallery changes; all attempts and failed paths are recorded. No reuse claims beyond object/source metadata.
"""
import hashlib,io,json,pathlib,urllib.request,urllib.parse,urllib.error,time
from PIL import Image,ImageOps
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"app-data/sacred-art/staged-selected31-v21";OUT.mkdir(parents=True,exist_ok=True)
IMAGE="The Wedding at Cana by Frans Francken the Younger, Nationalmuseum, Stockholm.jpg"
NAME=IMAGE.replace(" ","_")
M=hashlib.md5(NAME.encode("utf-8")).hexdigest()
IIIF="e8f15809c31cfff45a7abd09bd3cc9a2e2f5d91d247cea31e14b63896a171ec3"
URLS=[
 ("nationalmuseum_iiif_2500",f"https://nationalmuseumse.iiifhosting.com/iiif/{IIIF}/full/2500,/0/default.jpg"),
 ("commons_original",f"https://upload.wikimedia.org/wikipedia/commons/{M[0]}/{M[:2]}/{urllib.parse.quote(NAME)}"),
 ("commons_1920",f"https://upload.wikimedia.org/wikipedia/commons/thumb/{M[0]}/{M[:2]}/{urllib.parse.quote(NAME)}/1920px-{urllib.parse.quote(NAME)}"),
 ("nationalmuseum_iiif_2000",f"https://nationalmuseumse.iiifhosting.com/iiif/{IIIF}/full/2000,/0/default.jpg")
]
EXPECTED_SHA1="e0e1011ae234d7dbfced32f6eacd544392a87541"
def sha(b):return hashlib.sha256(b).hexdigest()
def http(u):
  request=urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0 (compatible; AdOrientemSourceResearch/1.0; educational selected art; no public release)","Accept":"image/jpeg,image/*;q=0.9,*/*;q=0.5","Referer":"https://collection.nationalmuseum.se/"})
  with urllib.request.urlopen(request,timeout=65) as resp:return resp.read(18000000)
tries=[];record=None
for lane,u in URLS:
  if record:break
  for attempt in range(2):
    try:
      b=http(u)
      if len(b)<40000:raise RuntimeError("Image too small")
      with Image.open(io.BytesIO(b)) as im:im.verify()
      with Image.open(io.BytesIO(b)) as im:
        im=ImageOps.exif_transpose(im).convert("RGB")
        dims=[im.width,im.height]
        if im.width<1750 or im.height<850 or not 1.90<im.width/im.height<2.25:
          raise RuntimeError("Not exact target reproduction geometry: "+str(dims))
        im.thumbnail((2000,2000),Image.Resampling.LANCZOS)
        buf=io.BytesIO();im.save(buf,"WEBP",quality=89,method=6)
        webp=buf.getvalue();outdims=[im.width,im.height]
      source=OUT/"cana-francken-source.jpg";derived=OUT/"cana-francken-2000.webp"
      source.write_bytes(b);derived.write_bytes(webp)
      record={
       "review_artwork_id":"cana-francken",
       "title":"The Wedding at Cana","artist":"Frans Francken the Younger",
       "verified_museum":"Nationalmuseum Stockholm","accession":"NM 7504",
       "selected_object_page":"https://collection.nationalmuseum.se/en/collection/item/231135/",
       "source_file_page":"https://commons.wikimedia.org/wiki/File:"+urllib.parse.quote(NAME),
       "verified_iiif_original":f"https://nationalmuseumse.iiifhosting.com/iiif/{IIIF}/info.json",
       "acquisition_lane":lane,"source_url":u,
       "expected_commons_sha1":EXPECTED_SHA1,
       "source_sha1":hashlib.sha1(b).hexdigest(),"source_sha256":sha(b),
       "source_bytes":len(b),"source_dimensions":dims,"source_path":str(source.relative_to(ROOT)),
       "derivative_sha256":sha(webp),"derivative_bytes":len(webp),"derivative_dimensions":outdims,
       "derivative_path":str(derived.relative_to(ROOT)),
       "photo_reuse_evidence":"Nationalmuseum NM 7504 has individual photographs variously labelled Public Domain or CC BY-SA; Commons selected exact photographic image marked Public Domain",
       "rights_gate":"GALLERY_PHOTO_SOURCE_SPECIFIC_RIGHTS_REVIEW",
       "identity_gate":"NATIONALMUSEUM_NM7504_EXACT_OBJECT",
       "quality_gate":"FULL_FRAME_1920PX_OR_ABOVE__VISUAL_QA_PENDING",
       "status":"SOURCE_ARCHIVE_ONLY__NO_APP_OR_PRAYER_BINDING"}
      if lane=="commons_original" and record["source_sha1"]!=EXPECTED_SHA1:raise RuntimeError("Commons expected SHA1 mismatch")
      print("ACQUIRED",lane,dims,outdims,record["source_sha256"],flush=True)
      break
    except Exception as e:
      tries.append({"lane":lane,"attempt":attempt+1,"reason":str(e)[:220]})
      print("TRY_FAIL",lane,attempt+1,str(e)[:180],flush=True)
      if "429" in str(e) and attempt==0:time.sleep(8)
      else:break
output={"schema":"ao.sacred-art.selected31-v21-source-acquisition","intent":"Research bank only, no public site changes",
        "attempted":1,"acquired_count":int(record is not None),"records":[record] if record else [],
        "hold_count":int(record is None),"holds":[] if record else [{"review_artwork_id":"cana-francken","reason":"All official/Commons image endpoints failed or supplied inadequate dimensions"}],
        "attempts":tries}
(OUT/"acquisition-results.v21.json").write_text(json.dumps(output,indent=2,ensure_ascii=False)+"\n")
print("V21",output["acquired_count"],"acquired",output["hold_count"],"held",flush=True)
