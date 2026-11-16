#!/usr/bin/env python3
"""Staged only. Exact museum-object/public-domain gates. Never writes to site/."""
import csv, io, json, pathlib, hashlib, re, urllib.request
from PIL import Image, ImageOps, ImageStat

ROOT=pathlib.Path(__file__).resolve().parents[1]
M=json.loads((ROOT/"app-data/sacred-art/selected31-gallery-reconciliation-v12.json").read_text())
OUT=ROOT/"app-data/sacred-art/staged-selected31-v13"
UA="AdOrientem-SacredArt-Acquisition/1.0 (GitHub Actions)"
def get(url, max_bytes=65000000):
    req=urllib.request.Request(url,headers={"User-Agent":UA})
    with urllib.request.urlopen(req,timeout=150) as resp:
        data=resp.read(max_bytes+1)
        if len(data)>max_bytes: raise ValueError("Download exceeds allowed size")
        return data
def jget(url): return json.loads(get(url).decode("utf-8"))
def sha(data): return hashlib.sha256(data).hexdigest()

queue=[r for r in M["records"] if r["gallery_status"]=="OPEN_ACCESS_FETCH_QUEUE"]
assert len(queue)==5 and len(set(r["review_artwork_id"] for r in queue))==5
nga=[r for r in queue if r["acquisition"]["provider"]=="NGA"]
ids={r["acquisition"]["iiif"].lower() for r in nga}
image_rows={}
if nga:
    url="https://raw.githubusercontent.com/NationalGalleryOfArt/opendata/main/data/published_images.csv"
    req=urllib.request.Request(url,headers={"User-Agent":UA})
    with urllib.request.urlopen(req,timeout=180) as stream:
        reader=csv.DictReader(io.TextIOWrapper(stream,encoding="utf-8-sig",newline=""))
        for row in reader:
            uuid=(row.get("uuid") or "").lower()
            if uuid in ids: image_rows[uuid]=row
    if set(image_rows)!=ids: raise ValueError("NGA image UUID not found in official dataset")

OUT.mkdir(parents=True,exist_ok=True)
result=[]
for r in queue:
    rid=r["review_artwork_id"]; spec=r["acquisition"]; provider=spec["provider"]
    if provider=="NGA":
        uid=spec["iiif"].lower(); entry=image_rows[uid]
        if (str(entry["depictstmsobjectid"])!=str(spec["object"]) or
            str(entry["openaccess"])!="1" or str(entry["viewtype"]).lower()!="primary"):
            raise ValueError("NGA identity/openaccess mismatch: "+rid)
        # The live NGA CSV uses the lowercase field "iiifurl" (not "iiifURL").
        base=next((v for k,v in entry.items() if k.strip().lower()=="iiifurl"),"")
        if not (base.startswith("https://api.nga.gov/iiif/") and uid in base.lower()):
            raise ValueError("NGA published image URL mismatch: "+rid+"; official IIIF base="+str(base))
        prefix=base.split("/full/")[0].rstrip("/")
        url=prefix+"/full/!3500,3500/0/default.jpg"
        rights="NGA published_images.csv openaccess=1"
        evidence={"objectID":str(spec["object"]),"uuid":uid,"viewtype":"primary"}
    elif provider=="CMA":
        # Official object page 1950.400 confirms the workshop attribution and
        # explicitly permits reuse. The CMA API intermittently returns HTTP 522;
        # use the accession-specific official Open Access CDN instead.
        acc=spec["accession"]
        if acc!="1950.400": raise ValueError("Unexpected CMA accession")
        url=f"https://openaccess-cdn.clevelandart.org/{acc}/{acc}_print.jpg"
        rights="CMA object page 1950.400: open-access, reusable without permission"
        evidence={"accession":acc,"object_page":"https://www.clevelandart.org/art/1950.400",
                  "title":"Baptism of Christ","artist":"workshop of Jacopo Tintoretto"}
    elif provider=="MET":
        oid=int(spec["object"])
        work=jget(f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{oid}")
        if (work.get("objectID")!=oid or work.get("isPublicDomain") is not True or
            "Bassano" not in work.get("artistDisplayName","") or "Baptism" not in work.get("title","")):
            raise ValueError("Met object/artist/license mismatch: "+rid)
        url=work.get("primaryImage")
        rights="Met isPublicDomain=true"
        evidence={"objectID":oid,"title":work["title"],"artist":work["artistDisplayName"]}
    else: raise ValueError("Unknown provider")
    if not url or not url.startswith("https://"): raise ValueError("No secure image URL: "+rid)
    raw=get(url)
    with Image.open(io.BytesIO(raw)) as im: im.verify()
    with Image.open(io.BytesIO(raw)) as im:
        img=ImageOps.exif_transpose(im).convert("RGB")
        dimensions=[img.width,img.height]
        if min(dimensions)<500 or sum(ImageStat.Stat(img.resize((32,32))).stddev)<15:
            raise ValueError("Low resolution or placeholder: "+rid)
        img.thumbnail((2000,2000),Image.Resampling.LANCZOS)
        buf=io.BytesIO(); img.save(buf,"WEBP",quality=88,method=6)
        thumb=buf.getvalue(); thumb_dim=[img.width,img.height]
    stem=re.sub(r"[^a-z0-9-]+","-",rid.lower()).strip("-")
    source=OUT/(stem+"-museum-source.jpg")
    derivative=OUT/(stem+"-gallery-2000.webp")
    source.write_bytes(raw); derivative.write_bytes(thumb)
    result.append({"review_artwork_id":rid,"title":r["title"],"artist":r["artist"],
        "museum_page":r["museum_page"],"rights_evidence":rights,"identity_evidence":evidence,
        "source_url":url,"source_path":str(source.relative_to(ROOT)),
        "source_sha256":sha(raw),"source_bytes":len(raw),"source_dimensions":dimensions,
        "derivative_path":str(derivative.relative_to(ROOT)),
        "derivative_sha256":sha(thumb),"derivative_bytes":len(thumb),
        "derivative_dimensions":thumb_dim,"full_composition":True,
        "publication_status":"STAGED_ONLY_NOT_LIVE_NOT_PRAYER_APPROVED"})
    print("ACQUIRED",rid,dimensions,"->",thumb_dim,flush=True)
assert len(result)==5
(OUT/"acquisition-results.v13.json").write_text(json.dumps({
    "schema":"ao.sacred-art.selected31-acquisition-results.v13",
    "publication_status":"STAGED_ONLY_NOT_LIVE_NOT_PRAYER_APPROVED",
    "records":result},indent=2,ensure_ascii=False)+"\n")
print("All five acquired; nothing written to site/",flush=True)
