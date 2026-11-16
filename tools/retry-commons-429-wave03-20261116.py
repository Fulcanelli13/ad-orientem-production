#!/usr/bin/env python3
"""Polite, fail-closed retry of rate-limited already-selected Commons artwork images."""
import hashlib,html,io,json,pathlib,re,time,urllib.error,urllib.parse,urllib.request
from PIL import Image,ImageOps
P=pathlib.Path
UA="AdOrientemSacredArtRetry/20261116 (https://github.com/Fulcanelli13/ad-orientem-production; owner-selected archival artwork)"
API="https://commons.wikimedia.org/w/api.php"
def read(p):return json.loads(P(p).read_text())
def write(p,value):P(p).write_text(json.dumps(value,indent=2,ensure_ascii=False)+"\n")
def sha(x):return hashlib.sha256(x).hexdigest()
def blobsha(x):return hashlib.sha1(("blob "+str(len(x))+"\0").encode()+x).hexdigest()
def get(url,limit=4_000_000):
 req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"application/json,image/*;q=0.9"})
 with urllib.request.urlopen(req,timeout=50) as resp:
  raw=resp.read(limit+1)
  if len(raw)>limit:raise ValueError("IMAGE_OR_RESPONSE_EXCEEDS_LIMIT")
  return raw,resp.headers.get("Content-Type","")
def parse_file(url):
 if not url.startswith("https://commons.wikimedia.org/wiki/"):return None
 part=urllib.parse.unquote(url.split("/wiki/",1)[1].split("#",1)[0].split("?",1)[0])
 if not part.startswith("File:"):return None
 file="File:"+part[5:].replace("_"," ")
 if ".." in file or len(file)<10:return None
 return file
def clean(x):return re.sub(r"<[^>]+>","",html.unescape(str(x))).strip().lower()
def license(info):
 meta=info.get("extmetadata") or {}
 def v(name):return clean(meta.get(name,{}).get("value",""))
 copyrighted=v("Copyrighted");short=v("LicenseShortName");code=v("License")
 terms=v("UsageTerms");credit=v("Credit");artist=v("Artist");restrictions=v("Restrictions")
 if copyrighted not in ("false","0","no"):return False,{"reason":"COPYRIGHT_FLAG_UNCLEAR"}
 if not ("public domain" in short or "cc0" in short or code in ("pd","cc0","cc0-1.0")):return False,{"reason":"NOT_PD_OR_CC0"}
 if any(p in short+" "+code+" "+terms for p in ["cc by","by-nc","by-sa","noncommercial","no derivatives","fair use","copyrighted"]):
  return False,{"reason":"LICENSE_CONDITIONS"}
 if "©" in credit or "©" in artist or any(p in restrictions for p in ["permission","commercial use prohibited"]):
  return False,{"reason":"PHOTO_RIGHTS_SIGNAL"}
 return True,{"license_short":short,"license_code":code,"copyrighted_flag":copyrighted,"credit":credit[:300],"artist":artist[:300]}
def to_image(raw):
 with Image.open(io.BytesIO(raw)) as img:
  img=ImageOps.exif_transpose(img)
  assert img.width>750 and img.height>750,(img.width,img.height)
  img.thumbnail((1600,1600),Image.Resampling.LANCZOS)
  if img.mode not in ("RGB","RGBA"):img=img.convert("RGB")
  if img.mode=="RGBA":
   canvas=Image.new("RGB",img.size,(255,255,255));canvas.paste(img,mask=img.getchannel("A"));img=canvas
  out=io.BytesIO();img.save(out,format="WEBP",quality=86,method=5)
  b=out.getvalue()
  assert len(b)<=2_000_000
  assert min(img.size)>=700,img.size
  return b,list(img.size)

g=read("site/gallery/catalogue.v1.json")
p=read("site/gallery/image-provenance.v1.json")
prev=read("app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json")
first=read("app-data/sacred-art/bulk-commons-photo-import-20261116.v1.json")
rej=read("app-data/sacred-art/legacy-artwork-rejections-20261116.v1.json")
assert len(g["records"])==873 and g["counts"]["distinct_locally_hosted_paintings"]==343
assert g["counts"]["image_available_records"]==346 and len(p["sources"])==343
assert len(rej["rejected_originals"])==103
assert prev["summary"]["new_gallery_images"]==109 and first["summary"]["new_gallery_images"]==161
lost=[h for h in prev["held"] if h["reason"]=="IMAGE_DOWNLOAD_DECODE_OR_QUALITY_FAILED"]
assert len(lost)==51
too_small=[h for h in lost if "FINAL_PIXELS_TOO_SMALL" in h.get("detail","")]
assert len(too_small)==2
retry=[h for h in lost if "HTTP Error 429" in h.get("detail","")]
assert len(retry)==49
records={r["id"]:r for r in g["records"]}
ids_before=set(records)
rejected_urls={urllib.parse.unquote(x.get("source_url","")).replace("_"," ").casefold() for x in rej["rejected_originals"]}
old_pages={x.get("commons_page_id") for x in p["sources"] if x.get("commons_page_id") is not None}
held=[{"artwork_id":r["artwork_id"],"reason":"SOURCE_THUMBNAIL_TOO_SMALL_HISTORICAL_HOLD",
       "previous_error":r.get("detail")} for r in too_small]
candidates=[]
for h in retry:
 row=records[h["artwork_id"]]
 assert row["image"] is None and row["owner_selected_artwork"]
 assert row["record_status"]=="APPROVED_BY_USER_2026_11_03"
 u=row["source_url"]
 assert urllib.parse.unquote(u).replace("_"," ").casefold() not in rejected_urls
 title=parse_file(u)
 assert title,title
 candidates.append((row,title))
meta={}
for n in range(0,len(candidates),10):
 batch=candidates[n:n+10]
 url=API+"?"+urllib.parse.urlencode(dict(action="query",prop="imageinfo",
   iiprop="url|size|mime|extmetadata|sha1",iiurlwidth=1600,
   titles="|".join(title for _,title in batch),format="json",formatversion="2"))
 try:
  data,ctype=get(url,limit=2_000_000)
  assert "json" in ctype
  pages=json.loads(data).get("query",{}).get("pages",[])
  for x in pages:
   if len(x.get("imageinfo",[]))==1:
    meta[x["title"].casefold()]={"pageid":x["pageid"],"title":x["title"],**x["imageinfo"][0]}
  print(json.dumps({"metadata_batch":n//10+1,"resolved":len(meta)}),flush=True)
 except Exception as e:
  print(json.dumps({"metadata_error":str(e)[:150],"batch":n//10+1}),flush=True)
 time.sleep(1.5)
assert len(meta)>=35,("Unexpected Commons metadata outage",len(meta))
eligible=[]
for row,title in candidates:
 info=meta.get(title.casefold())
 if not info:
  held.append({"artwork_id":row["id"],"reason":"COMMONS_METADATA_UNAVAILABLE"});continue
 if info.get("pageid") in old_pages:
  held.append({"artwork_id":row["id"],"reason":"DUPLICATE_COMMONS_SOURCE_PHOTO"});continue
 if info.get("mime") not in ("image/jpeg","image/png","image/webp","image/tiff"):
  held.append({"artwork_id":row["id"],"reason":"UNSUPPORTED_SOURCE_MIME"});continue
 w,h=int(info.get("width",0)),int(info.get("height",0))
 if min(w,h)<1050 or max(w,h)<1400 or max(w,h)/min(w,h)>3.1:
  held.append({"artwork_id":row["id"],"reason":"SOURCE_DIMENSION_HOLD"});continue
 ok,rights=license(info)
 if not ok:
  held.append({"artwork_id":row["id"],"reason":"RIGHTS_HOLD_REVALIDATION","detail":rights});continue
 if not (info.get("thumburl") or info.get("url")):
  held.append({"artwork_id":row["id"],"reason":"MISSING_FILE_URL"});continue
 eligible.append((row,info,rights))
print(json.dumps({"retried":len(retry),"eligible":len(eligible),"holds_before_download":len(held)}),flush=True)

assets=[];throttled=False
for idx,(row,info,rights) in enumerate(eligible,1):
 if throttled:
  held.append({"artwork_id":row["id"],"reason":"COMMONS_RATE_LIMIT_PAUSED_RETRY"});continue
 link=info.get("thumburl") or info.get("url")
 try:
  raw,ctype=get(link,limit=15_000_000)
  if not ctype.startswith("image/"):raise ValueError("Response not image")
  output,dim=to_image(raw)
 except urllib.error.HTTPError as err:
  if err.code==429:
   throttled=True
   held.append({"artwork_id":row["id"],"reason":"COMMONS_RATE_LIMIT_PAUSED_RETRY","detail":"HTTP 429; stop without further Commons file downloads"})
   print(json.dumps({"respect_rate_limit":True,"download_index":idx,"success":len(assets)}),flush=True)
   continue
  held.append({"artwork_id":row["id"],"reason":"RETRY_HTTP_FAILURE","detail":str(err)[:150]});continue
 except Exception as e:
  held.append({"artwork_id":row["id"],"reason":"RETRY_IMAGE_QUALITY_OR_DOWNLOAD_FAILURE","detail":str(e)[:150]});continue
 filepath="site/gallery/images/owner-approved-20261103-"+row["id"].split("::")[1]+".webp"
 assert not P(filepath).exists(),filepath
 P(filepath).write_bytes(output)
 image={
  "src":"./gallery/images/"+P(filepath).name,
  "quality":"FULL_COMPOSITION_1600PX_COMMONS_PD_SOURCE_VERIFIED_AFTER_RATE_LIMIT_RETRY",
  "usage":"GALLERY_ONLY__USER_SELECTED_WORK__NO_NEW_PRAYER_DEFAULT",
  "provenance":"Owner-selected exact Commons source file; previously rate-limited at image download; read with sequential request pacing and complete original frame. 1600px derivative. Original source JPEG not archived.",
  "license":rights["license_short"].title(),
  "license_url":"https://commons.wikimedia.org/wiki/"+info["title"].replace(" ","_"),
  "source_note":"Commons exact-file public-domain/CC0 claim only; not independent international photographic rights certification.",
  "source_dimensions":[info["width"],info["height"]],
  "pixel_width":dim[0],"pixel_height":dim[1]
 }
 row["image"]=image
 p["sources"].append({
  "artwork_id":row["id"],"title":row["title"],"artist":row["artist"],"path":filepath,
  "image_bytes":len(output),"sha256":sha(output),"git_blob_sha":blobsha(output),
  "source_record":"app-data/sacred-art/commons-rate-limit-recovery-wave03-20261116.v1.json",
  "source_url":row["source_url"],"commons_file_page":image["license_url"],
  "commons_page_id":info["pageid"],"commons_file_sha1":info.get("sha1"),
  "commons_source_original_pixels":[info["width"],info["height"]],
  "source_downloaded_thumbnail_bytes":len(raw),"source_downloaded_thumbnail_sha256":sha(raw),
  "display_dimensions":dim,"recorded_reproduction_rights":rights["license_short"],
  "file_license_claim":rights,"source_image_original_bytes_retained":False,
  "release_scope":"GALLERY_ONLY__NO_NEW_PRAYER_DEFAULT","exact_original_image_for_prayer":False})
 assets.append({
  "artwork_id":row["id"],"title":row["title"],"artist":row["artist"],"source_page":row["source_url"],
  "commons_file_title":info["title"],"commons_pageid":info["pageid"],"commons_sha1":info.get("sha1"),
  "original_dimensions":[info["width"],info["height"]],
  "downloaded_bytes":len(raw),"downloaded_sha256":sha(raw),
  "derivative_path":filepath,"derivative_bytes":len(output),"derivative_sha256":sha(output),
  "derivative_git_blob_sha":blobsha(output),"derivative_dimensions":dim,
  "license_evidence":rights,"previous_status":"IMAGE_DOWNLOAD_DECODE_OR_QUALITY_FAILED",
  "original_bytes_archived":False})
 if idx%10==0:print(json.dumps({"attempted":idx,"saved":len(assets)}),flush=True)
 time.sleep(2.3)
assert len(assets)+len(held)==51
assert set(records)==ids_before
for row in records.values():
 if row["id"] in {a["artwork_id"] for a in assets}:
  assert row["exact_prayer_cards"]==[] or isinstance(row["exact_prayer_cards"],list)
n=len(assets)
g["counts"]["distinct_locally_hosted_paintings"]+=n
g["counts"]["image_available_records"]+=n
g["counts"]["verified_image_files"]+=n
p["local_image_count"]+=n
p["catalogue_record_images_count"]+=n
p["source_contract"]+=f" A polite sequential retry recovered {n} of 49 previously rate-limited exact Commons photo previews without touching other original artwork/canonical assignments. If Wikimedia returned 429, download paused rather than bypassing rate limits."
g["source_references"]["commons_rate_limit_retry"]="app-data/sacred-art/commons-rate-limit-recovery-wave03-20261116.v1.json"
report={
 "schema":"ao.sacred-art.bulk-commons-rate-limit-recovery.v1","date":"2026-11-16",
 "source_batch02":"app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json",
 "only_prior_429_items":49,"small_image_held":2,
 "rate_limit_policy":"Sequential, 2.3s between image fetches; if Wikimedia Commons returns HTTP 429, immediately stop further image downloads rather than bypass or rotate request identity.",
 "assets":assets,"held":held,
 "summary":{"retry_queue":51,"previous_rate_limited":49,"recovered_images":n,
  "added_webp_bytes":sum(a["derivative_bytes"] for a in assets),
  "held_after_retry":len(held),"paused_for_rate_limit":throttled,
  "total_gallery_paintings":343+n,"image_bearing_records":346+n,
  "source_master_jpegs_unchanged":54,"historical_catalogue_records_unchanged":873,
  "new_prayer_assignments":0,"new_calendar_assignments":0,"rejected_source_items_protected":103}}
write("site/gallery/catalogue.v1.json",g)
write("site/gallery/image-provenance.v1.json",p)
write("app-data/sacred-art/commons-rate-limit-recovery-wave03-20261116.v1.json",report)
print(json.dumps({"RECOVERY_FINAL":report["summary"]}),flush=True)
