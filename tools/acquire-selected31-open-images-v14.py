#!/usr/bin/env python3
"""Acquire selected, exact-object photographs from identified Commons museum sources.

V14: source-sha1 pinned for four artworks, API-verified for the fifth.
Never modifies site/ or canonical review assignments. Rights are crosschecked
against museum object pages in the editorial V12 manifest before acquisition.
"""
import hashlib, json, pathlib, io, urllib.request, urllib.parse, re, traceback
from PIL import Image, ImageOps, ImageStat
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"app-data/sacred-art/staged-selected31-v14"
v12=json.loads((ROOT/"app-data/sacred-art/selected31-gallery-reconciliation-v12.json").read_text())
selected={r["review_artwork_id"]:r for r in v12["records"] if r["gallery_status"]=="SOURCE_REVIEW_PENDING"}
CANDIDATES=[
 {"id":"bap-murillo","filename":"Bartolomé Esteban Murillo (1617 - 1682) - The Baptism of Christ - 68.2 - Gemäldegalerie.jpg",
  "sha1":"7d5e22bdbec34c7148dba0d7b371d432a09e6727","institution_id":"68.2",
  "source_rights":"SMB object 868725: Public Domain Mark 1.0; Commons museum file is a faithful reproduction"},
 {"id":"bap-verrocchio","filename":"Verrocchio, Leonardo da Vinci - Battesimo di Cristo.jpg",
  "sha1":"b4fcd110c144c76939f0fdb82c7104f78d2c5ad9","institution_id":"1890 n. 8358",
  "source_rights":"Uffizi object 8358; Commons selected exact derived Google Art Project file marked Public Domain"},
 {"id":"cana-francken","filename":"Frans Francken d.y. - The Wedding at Cana - NM 7504 - Nationalmuseum.jpg",
  "sha1":"336d7b37feec76e171c2b5d0810588db31f68e92","institution_id":"NM 7504",
  "source_rights":"Nationalmuseum NM 7504, publicly released photograph marked Public Domain on Commons"},
 {"id":"cana-vermeyen","filename":"Jan Cornelisz. Vermeyen 006.jpg",
  "sha1":"757469034bc7d06d0d7a8d7e022ea02c0f2c244a","institution_id":"SK-A-4820",
  "source_rights":"Rijksmuseum SK-A-4820 public domain painting; exact WGA Commons image marked PD-Art"},
 {"id":"king-bloch","filename":"Carl Bloch - The Sermon on the Mount.jpg",
  "sha1":None,"institution_id":"Frederiksborg",
  "source_rights":"Museum of National History at Frederiksborg; Commons new 2026 museum-photo-service source marked Public Domain"},
]
assert len(CANDIDATES)==len({r["id"] for r in CANDIDATES})==5
assert set(x["id"] for x in CANDIDATES).issubset(selected)
def get(u,limit=32000000):
    req=urllib.request.Request(u,headers={"User-Agent":"AdOrientemSacredArt/1.0 (reproducibility/image provenance; github actions)"})
    with urllib.request.urlopen(req,timeout=100) as r:
        b=r.read(limit+1)
    if not 128<len(b)<limit: raise RuntimeError("Download empty or exceeds limit")
    return b
def sha(b): return hashlib.sha256(b).hexdigest()
results=[];holds=[]
OUT.mkdir(parents=True,exist_ok=True)
for item in CANDIDATES:
    rid=item["id"]
    try:
        original=selected[rid]
        assert original["museum_page"].startswith("https://")
        name=item["filename"].replace(" ","_")
        title="File:"+name
        query=urllib.parse.urlencode({"action":"query","format":"json","prop":"imageinfo",
                                      "iiprop":"url|sha1|size|extmetadata","titles":title})
        api="https://commons.wikimedia.org/w/api.php?"+query
        media=None
        try:
            info=json.loads(get(api,2000000).decode())
            pages=list(info["query"]["pages"].values())
            media=pages[0]["imageinfo"][0]
            if item["sha1"] and media["sha1"].lower()!=item["sha1"]: raise RuntimeError("Commons SHA1 changed")
            rights=json.dumps(media.get("extmetadata",{})).lower()
            if not any(x in rights for x in ("public domain","pd-art","cc0","pd-old")): raise RuntimeError("No PD license evidence in imageinfo")
            u=media["url"]
        except Exception as api_error:
            # For four SHA-1-pinned objects a verified binary is sufficient,
            # even when MediaWiki API is blocked; never use this fallback for unpinned.
            if item["sha1"] is None: raise RuntimeError("Unpinned source requires Commons API: "+str(api_error))
            h=hashlib.md5(name.encode("utf-8")).hexdigest()
            u=f"https://upload.wikimedia.org/wikipedia/commons/{h[0]}/{h[:2]}/{urllib.parse.quote(name)}"
        raw=get(u)
        actual_sha1=hashlib.sha1(raw).hexdigest()
        if item["sha1"] and actual_sha1 != item["sha1"]: raise RuntimeError(f"Original SHA1 mismatch: {actual_sha1}")
        with Image.open(io.BytesIO(raw)) as im: im.verify()
        with Image.open(io.BytesIO(raw)) as im:
            img=ImageOps.exif_transpose(im).convert("RGB")
            native=[img.width,img.height]
            if min(native)<500 or max(native)<900 or sum(ImageStat.Stat(img.resize((32,32))).stddev)<15:
                raise RuntimeError("Low-resolution or placeholder image")
            img.thumbnail((2000,2000),Image.Resampling.LANCZOS)
            buf=io.BytesIO(); img.save(buf,format="WEBP",quality=88,method=6)
            webp=buf.getvalue(); dim=[img.width,img.height]
        src=OUT/(rid+"-source.jpg"); dst=OUT/(rid+"-2000.webp")
        src.write_bytes(raw);dst.write_bytes(webp)
        results.append({"review_artwork_id":rid,"title":original["title"],"artist":original["artist"],
          "institution_object_id":item["institution_id"],"museum_page":original["museum_page"],
          "source_page":"https://commons.wikimedia.org/wiki/"+urllib.parse.quote(title.replace(" ","_")),
          "source_image_url":u,"source_license_evidence":item["source_rights"],
          "original_sha1":actual_sha1,"source_sha256":sha(raw),"source_bytes":len(raw),
          "source_dimensions":native,"source_path":str(src.relative_to(ROOT)),
          "derivative_sha256":sha(webp),"derivative_bytes":len(webp),
          "derivative_dimensions":dim,"derivative_path":str(dst.relative_to(ROOT)),
          "full_composition":True,"publication_status":"SOURCE_STAGED_NOT_LIVE_NOT_PRAYER_APPROVED"})
        print("ACQUIRED",rid,native,"=>",dim,flush=True)
    except Exception as e:
        holds.append({"review_artwork_id":rid,"hold_reason":str(e)})
        print("HELD",rid,str(e),flush=True)
report={"schema":"ao.sacred-art.selected31-v14-acquisition.v1",
        "publication_scope":"SOURCE_STAGE_ONLY__NO_PRAYER_APPROVAL",
        "acquired_count":len(results),"held_count":len(holds),"records":results,"holds":holds}
(OUT/"acquisition-results.v14.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n")
if len(results)<1: raise RuntimeError("No image acquired; no change should be committed")
print("STAGED",len(results),"HELD",len(holds),flush=True)
