#!/usr/bin/env python3
"""V18: acquire seven owner-selected artwork source candidates into the private draft-branch research bank.
No site/, gallery or prayer-card modifications. Incomplete rights and identity gates remain explicit.
"""
import hashlib,io,json,pathlib,time,urllib.request,urllib.parse,urllib.error
from PIL import Image,ImageOps,ImageStat
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"app-data/sacred-art/staged-selected31-v18"
SELECTION=json.loads((ROOT/"app-data/sacred-art/selected31-gallery-reconciliation-v12.json").read_text())
BY_ID={r["review_artwork_id"]:r for r in SELECTION["records"]}
SPECS=[
 {"id":"cana-tintoretto","filename":"Tintoretto - Marriage at Cana.jpg",
  "object":"Jacopo Tintoretto, 1561, Santa Maria della Salute, Venice",
  "photographer":"Gleb Simonov","license":"CC0 1.0 (photographer dedication)",
  "license_url":"https://creativecommons.org/publicdomain/zero/1.0/",
  "gate":"SOURCE_ONLY__VENICE_INSTITUTIONAL_REUSE_REVIEW"},
 {"id":"king-bourdon","filename":"Le Christ et les enfants - Sébastien Bourdon - Musée du Louvre Peintures INV 2806 ; MR 1256.jpg",
  "object":"Musée du Louvre INV 2806 / MR 1256","photographer":"Shonagon (2025)",
  "license":"Commons Public Domain Mark / faithful reproduction; French institutional rights to verify",
  "license_url":"https://creativecommons.org/publicdomain/mark/1.0/",
  "gate":"SOURCE_ONLY__LOUVRE_PHOTOGRAPH_REUSE_REVIEW"},
 {"id":"king-jordaens","filename":"Jacob Jordaens - Christ blessing little Children. Suffer Little Children to Come unto me - KMSsp234 - Statens Museum for Kunst.jpg",
  "object":"Statens Museum for Kunst KMSsp234 (museum attribution: attributed to Jacob Jordaens)",
  "photographer":"Statens Museum for Kunst","license":"CC0 1.0, SMK reproduction",
  "license_url":"https://creativecommons.org/publicdomain/zero/1.0/",
  "gate":"SOURCE_ONLY__ORIGINAL_OWNER_SELECTED_OBJECT_NOT_VERIFIED"},
 {"id":"trans-rubens","filename":"Transfiguration-Rubens.JPG",
  "object":"Musée des Beaux-Arts de Nancy inventory 71","photographer":"Commons faithful reproduction",
  "license":"Public Domain Mark / PD-Art","license_url":"https://creativecommons.org/publicdomain/mark/1.0/",
  "gate":"SOURCE_ONLY__NANCY_MUSEUM_REUSE_AND_IMAGE_QUALITY_REVIEW"},
 {"id":"trans-savoldo","filename":"Giovanni girolamo savoldo, trasfigurazione, 1530-35 ca. 01.jpg",
  "object":"Gallerie degli Uffizi inventory 00289148 (Transfiguration of Christ)",
  "photographer":"Francesco Bini / Sailko","license":"CC BY-SA 4.0 with Italian heritage disclaimer",
  "license_url":"https://creativecommons.org/licenses/by-sa/4.0/",
  "gate":"SOURCE_ONLY__ITALIAN_HERITAGE_REUSE_HOLD"},
 {"id":"trans-carracci","filename":"Lodovico Carracci, Trasfigurazione di Gesù Cristo, 1595.jpg",
  "object":"Pinacoteca Nazionale di Bologna inventory 475",
  "photographer":"Mongolo1984","license":"CC BY-SA 4.0 with Italian heritage disclaimer",
  "license_url":"https://creativecommons.org/licenses/by-sa/4.0/",
  "gate":"SOURCE_ONLY__ITALIAN_HERITAGE_REUSE_HOLD"},
 {"id":"euch-leonardo","filename":"Leonardo da Vinci (1452-1519) - The Last Supper (1495-1498).jpg",
  "object":"Santa Maria delle Grazie, Milan, Leonardo mural (1495-98)",
  "photographer":"Unknown (Commons faithful reproduction; original source unspecified)",
  "license":"Public Domain Mark / PD-Art; original photographic provenance incomplete",
  "license_url":"https://creativecommons.org/publicdomain/mark/1.0/",
  "gate":"SOURCE_ONLY__PHOTOGRAPH_ORIGIN_AND_ITALIAN_HERITAGE_REVIEW"}
]
assert len(SPECS)==7 and len({s["id"] for s in SPECS})==7
assert {s["id"] for s in SPECS}<=set(BY_ID)
def hexhash(data,alg="sha256"): return hashlib.new(alg,data).hexdigest()
def commons_url(filename):
    norm=filename.replace(" ","_")
    h=hashlib.md5(norm.encode("utf-8")).hexdigest()
    return f"https://upload.wikimedia.org/wikipedia/commons/{h[0]}/{h[:2]}/{urllib.parse.quote(norm)}"
def get(url):
    req=urllib.request.Request(url,headers={"User-Agent":"AdOrientemSacredArtSourceReview/1.0 (GitHub Actions; provenance research; no public use)"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req,timeout=110) as f: data=f.read(74000000)
            if not 200<len(data)<74000000: raise RuntimeError("Invalid image response size")
            return data
        except (urllib.error.HTTPError,TimeoutError,urllib.error.URLError) as e:
            if isinstance(e,urllib.error.HTTPError) and e.code not in (429,502,503,504): raise
            if attempt==3: raise
            print("RETRY",url,attempt,str(e),flush=True);time.sleep(7*(2**attempt))
OUT.mkdir(parents=True,exist_ok=True)
records=[];holds=[]
prior=OUT/"acquisition-results.v18.json"
existing={}
if prior.exists():
    try: existing={r["review_artwork_id"]:r for r in json.loads(prior.read_text()).get("records",[])}
    except (ValueError,KeyError): pass
for spec in SPECS:
    rid=spec["id"]
    if rid in existing:
        r=existing[rid]
        if all((ROOT/r[k+"_path"]).exists() and hexhash((ROOT/r[k+"_path"]).read_bytes())==r[k+"_sha256"] for k in ("source","derivative")):
            records.append(r);print("PRESERVED",rid,flush=True);continue
    try:
        u=commons_url(spec["filename"])
        data=get(u)
        with Image.open(io.BytesIO(data)) as probe:probe.verify()
        with Image.open(io.BytesIO(data)) as probe:
            im=ImageOps.exif_transpose(probe).convert("RGB");dims=[im.width,im.height]
            if min(dims)<700 or max(dims)<1500:raise RuntimeError("Below full-source quality gate")
            if sum(ImageStat.Stat(im.resize((32,32))).stddev)<12:raise RuntimeError("Low-contrast placeholder suspected")
            im.thumbnail((2000,2000),Image.Resampling.LANCZOS)
            out=io.BytesIO();im.save(out,"WEBP",quality=88,method=6)
            derivative=out.getvalue();small=[im.width,im.height]
        src=OUT/(rid+"-source.jpg");thumb=OUT/(rid+"-2000.webp")
        src.write_bytes(data);thumb.write_bytes(derivative)
        sel=BY_ID[rid]
        records.append({"review_artwork_id":rid,"title":sel["title"],"artist":sel["artist"],"selection_object_page":sel["museum_page"],
          "verified_or_proposed_object":spec["object"],"photographer":spec["photographer"],"photograph_license":spec["license"],
          "license_url":spec["license_url"],"source_commons_file":"https://commons.wikimedia.org/wiki/File:"+urllib.parse.quote(spec["filename"].replace(" ","_")),
          "source_image_url":u,"source_sha1":hexhash(data,"sha1"),"source_sha256":hexhash(data),"source_bytes":len(data),
          "source_dimensions":dims,"source_path":str(src.relative_to(ROOT)),"derivative_sha256":hexhash(derivative),
          "derivative_bytes":len(derivative),"derivative_dimensions":small,"derivative_path":str(thumb.relative_to(ROOT)),
          "rights_gate":spec["gate"],"object_identity_gate":"ORIGINAL_OWNER_IMAGE_UNCONFIRMED" if rid=="king-jordaens" else "MUSEUM_OBJECT_MATCHED",
          "composition_status":"REQUIRES_VISUAL_FRAME_CROP_AND_QUALITY_REVIEW",
          "status":"SOURCE_ARCHIVE_ONLY__NO_PUBLIC_APP_OR_PRAYER_BINDING"})
        print("ACQUIRED",rid,dims,len(data),flush=True)
    except Exception as e:
        holds.append({"review_artwork_id":rid,"reason":str(e)})
        print("HELD",rid,repr(e),flush=True)
holds.append({"review_artwork_id":"euch-poussin","reason":"Not acquired: Scottish National Gallery declares the selected Holy Eucharist photograph restricted or unavailable. No alternate image admitted without independent exact-photo rights."})
result={"schema":"ao.sacred-art.selected31-source-acquisition-v18","purpose":"Source-only research; no gallery, prayer-card or deployment changes",
  "attempted_selected_sources":7,"acquired_count":len(records),"failed_acquisition_count":len(holds)-1,"outstanding_poussin_count":1,
  "records":records,"holds":holds}
prior.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n")
assert len(records)+len(holds)-1==7
print("V18",len(records),"sources archived,",len(holds),"holds including Poussin",flush=True)
