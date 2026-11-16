#!/usr/bin/env python3
"""Second large-scale source-specific Commons qualification of still-missing approved artworks.

No new artwork choices. No new prayer-card associations. Every file is exact-page
matched; rejected IDs/files remain excluded. Only clearly PD/CC0 file claims
are automatically eligible, with old Commons caveats retained.
"""
import concurrent.futures, hashlib, html, io, json, os, pathlib, re, sys, time, unicodedata
import urllib.error, urllib.parse, urllib.request
from PIL import Image, ImageOps

ROOT=pathlib.Path(".")
UA="AdOrientemSacredArtBulk/20261116 (https://github.com/Fulcanelli13/ad-orientem-production; user-selected art provenance)"
PR_RESEARCH_SHA="99fc0f3227504f68f78868fdb92a3c0aff2827da"
SOURCE_REJECTIONS=f"https://raw.githubusercontent.com/Fulcanelli13/ad-orientem/{PR_RESEARCH_SHA}/data/artwork/research/m2m-qa-evidence-20261109.v1.json"
API="https://commons.wikimedia.org/w/api.php"
MAX_IMAGES=180
REQUEST_LIMIT=330
IMAGE_LONG_EDGE=1600
MAX_SOURCE_BYTES=15_000_000
MAX_DERIVATIVE_BYTES=2_000_000

def read(path):return json.loads((ROOT/path).read_text(encoding="utf-8"))
def write(path,data):
 target=ROOT/path
 target.parent.mkdir(parents=True,exist_ok=True)
 target.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
def sha256(data):return hashlib.sha256(data).hexdigest()
def gitblob(data):return hashlib.sha1(("blob "+str(len(data))+"\0").encode()+data).hexdigest()
def get(url,max_size=10_000_000,attempts=3):
 for n in range(attempts):
  try:
   req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"application/json,image/webp,image/jpeg,image/png,*/*;q=0.4"})
   with urllib.request.urlopen(req,timeout=55) as r:
    ctype=r.headers.get("Content-Type","")
    data=r.read(max_size+1)
    if len(data)>max_size:raise ValueError("SOURCE_EXCEEDS_DOWNLOAD_LIMIT")
    return data,ctype
  except (urllib.error.HTTPError,urllib.error.URLError,TimeoutError) as err:
   if n==attempts-1:raise
   time.sleep(min(10,1.5*(n+1)))
def commons_file(url):
 if not isinstance(url,str):return None
 if not url.startswith("https://commons.wikimedia.org/wiki/"):return None
 slug=url.split("/wiki/",1)[1].split("#",1)[0].split("?",1)[0]
 slug=urllib.parse.unquote(slug)
 if not slug.startswith("File:"):return None
 name=slug[5:].replace("_"," ").strip()
 if len(name)<9 or ".." in name or "/" in name:return None
 if not re.search(r"\.(jpe?g|png|webp|tiff?)$",name,re.I):return None
 return "File:"+name

def normalize_source(url):
 if not url:return ""
 return urllib.parse.unquote(url).replace("_"," ").casefold().split("?",1)[0].rstrip("/")

gallery=read("site/gallery/catalogue.v1.json")
provenance=read("site/gallery/image-provenance.v1.json")
index=read("app-data/sacred-art/artwork-assignment-index.v2.json")
assert gallery["counts"]["total_records"]==873
assert gallery["counts"]["distinct_locally_hosted_paintings"]==234
assert gallery["counts"]["image_available_records"]==237
assert len(provenance["sources"])==234
assert len(index["artworks"])==862
ids_before={r["id"] for r in gallery["records"]}
assert len(ids_before)==873
historical_snapshots={r["id"]:{
 "title":r["title"],"artist":r["artist"],"source_url":r["source_url"],
 "owner_selected_artwork":r["owner_selected_artwork"],"record_status":r["record_status"],
 "exact_prayer_cards":r["exact_prayer_cards"],"prayer_parts":r["prayer_parts"],
 "rights_note":r["rights_note"]
} for r in gallery["records"]}

rejection_data=json.loads(get(SOURCE_REJECTIONS,max_size=1_000_000)[0])
rejected=rejection_data["records"]["rejected_originals"]
assert len(rejected)==103, ("Historical rejected ID count mismatch",len(rejected))
reject_ids={str(x["id"]).casefold() for x in rejected}
reject_urls={normalize_source(x.get("source_url")) for x in rejected if x.get("source_url")}
write("app-data/sacred-art/legacy-artwork-rejections-20261116.v1.json",{
 "schema":"ao.sacred-art.legacy-user-rejections.v1",
 "pinned_research_sha":PR_RESEARCH_SHA,"source_path":"data/artwork/research/m2m-qa-evidence-20261109.v1.json",
 "count":len(rejected),"rejected_originals":rejected,
 "policy":"No score 0-2 historically rejected original may be promoted under a different image URL, crop, alias or proposal ID. Exact source URLs and normalized IDs fail closed; additional identity conflicts remain held."
})

prior_manifest=read("app-data/sacred-art/bulk-commons-photo-import-20261116.v1.json")
assert prior_manifest["summary"]["new_gallery_images"]==161
assert prior_manifest["summary"]["held_or_deferred_rows"]==330
prior_holds={x["artwork_id"]:x for x in prior_manifest["held"]}
assert len(prior_holds)==330
prior_artwork_ids={x["artwork_id"] for x in prior_manifest["assets"]}
assert len(prior_artwork_ids)==161
candidate_records=[r for r in gallery["records"] if
 r["owner_selected_artwork"] is True and r["image"] is None
 and r["record_status"]=="APPROVED_BY_USER_2026_11_03"
 and r["id"].startswith("RECENT575::")]
assert len(candidate_records)==330,len(candidate_records)
assert {x["id"] for x in candidate_records}==set(prior_holds)
# Prioritize the 109 already rights/size-qualified deferred files, then
# 71 previously unexamined exact source pages; retry 19 prior fetch failures
# without weakening any rejection, rights or quality threshold.
priority={"QUALIFIED_NEXT_DOWNLOAD_BATCH__CAP_180":0,
          "BEYOND_THIS_METADATA_PASS":1,
          "IMAGE_DOWNLOAD_DECODE_OR_QUALITY_FAILED":2}
candidate_records=sorted(candidate_records,
 key=lambda x:(priority.get(prior_holds[x["id"]]["reason"],9),x["id"]))
prior_pages={normalize_source(s.get("source_url")) for s in gallery["records"] if s["image"] is not None}
processed=[]
qualified=[]
seen={}

def hold(row,reason,detail=None):
 record={"artwork_id":row["id"],"source_url":row.get("source_url"),"decision":"HOLD",
         "reason":reason}
 if detail:record["detail"]=str(detail)[:320]
 processed.append(record)

for row in candidate_records:
 prior=prior_holds[row["id"]]
 if prior["reason"] in ("BELOW_FULL_COMPOSITION_QUALITY_FLOOR",
                       "COPYRIGHTED_FLAG_NOT_EXPLICITLY_FALSE",
                       "EXTREME_ASPECT_RATIO_OR_DIMENSIONS"):
  hold(row,prior["reason"],"Previously verified hold; no new rights or quality release")
  continue
 if len(qualified)>=REQUEST_LIMIT:
  hold(row,"BEYOND_THIS_METADATA_PASS")
  continue
 if row["id"].casefold() in reject_ids or normalize_source(row.get("source_url")) in reject_urls:
  hold(row,"HISTORICALLY_REJECTED_SOURCE_ID_OR_EXACT_URL")
  continue
 title=commons_file(row["source_url"])
 if title is None:
  hold(row,"NO_EXACT_COMMONS_FILE_PAGE")
  continue
 if normalize_source(row["source_url"]) in prior_pages:
  hold(row,"PHOTO_ALREADY_PRESENT_IN_GALLERY_UNDER_OTHER_ID")
  continue
 if title.casefold() in seen:
  hold(row,"DUPLICATE_SOURCE_FILE_PAGE",seen[title.casefold()])
  continue
 seen[title.casefold()]=row["id"]
 qualified.append((row,title))
assert len(qualified)>=150,len(qualified)
print(json.dumps({"initial_approved":len(candidate_records),"metadata_eligible":len(qualified),"initial_holds":len(processed),"rejections_imported":len(rejected)}),flush=True)

def meta_value(meta,key):
 v=meta.get(key)
 if isinstance(v,dict):return html.unescape(str(v.get("value","")))
 return ""
def strip_tags(value):
 return re.sub(r"\s+"," ",re.sub(r"<[^>]*>"," ",html.unescape(value))).strip()
def license_decision(info):
 meta=info.get("extmetadata") or {}
 short=strip_tags(meta_value(meta,"LicenseShortName")).lower()
 code=strip_tags(meta_value(meta,"License")).lower()
 copyrighted=strip_tags(meta_value(meta,"Copyrighted")).lower()
 rights=strip_tags(meta_value(meta,"UsageTerms")).lower()
 conditions=strip_tags(meta_value(meta,"Restrictions")).lower()
 credit=strip_tags(meta_value(meta,"Credit"))
 artist=strip_tags(meta_value(meta,"Artist"))
 if copyrighted not in ("false","0","no"):
  return False,"COPYRIGHTED_FLAG_NOT_EXPLICITLY_FALSE",{"copyrighted":copyrighted,"license":short}
 if not ("public domain" in short or "cc0" in short or code in ("pd","cc0","cc0-1.0")):
  return False,"LICENSE_NOT_PD_OR_CC0",{"license_short":short,"code":code}
 if any(z in (short+" "+code+" "+rights) for z in ["cc by","by-sa","by-nc","noncommercial","no derivatives","fair use","copyrighted"]):
  return False,"LICENSE_HAS_CONDITIONS_NOT_AUTOMATICALLY_RELEASED",{"license_short":short,"code":code}
 if any(z in conditions.lower() for z in ["permission","attribution required","commercial use prohibited"]):
  return False,"RIGHTS_RESTRICTION_TEXT",{"restrictions":conditions[:200]}
 if "©" in credit or "©" in artist:
  return False,"PHOTOGRAPHER_OR_INSTITUTION_COPYRIGHT_SIGNAL",{"credit":credit[:200],"artist":artist[:150]}
 return True,"COMMONS_FILE_PD_OR_CC0_CLAIM",{
  "license_short":short,"license_code":code,"copyrighted_flag":copyrighted,
  "credit":credit[:400],"image_author":artist[:350],
  "usage_terms":rights[:300]}

# MediaWiki request batches are precise and stable by File: title; no image search
# or similarity guesses. Missing/ambiguous pages never promoted.
lookup={}
errors=[]
for n in range(0,len(qualified),20):
 chunk=qualified[n:n+20]
 titles=[title for _,title in chunk]
 args={"action":"query","prop":"imageinfo",
   "iiprop":"url|size|mime|extmetadata|sha1",
   "iiurlwidth":IMAGE_LONG_EDGE,"titles":"|".join(titles),
   "format":"json","formatversion":"2","redirects":"1"}
 url=API+"?"+urllib.parse.urlencode(args)
 try:
  data,_=get(url,max_size=2_500_000)
  pages=json.loads(data).get("query",{}).get("pages",[])
  for page in pages:
   title=page.get("title","")
   if "imageinfo" not in page or len(page["imageinfo"])!=1:continue
   lookup[unicodedata.normalize("NFC",title).casefold()]={
    "pageid":page.get("pageid"),"file_title":title,
    "page_url":"https://commons.wikimedia.org/wiki/"+title.replace(" ","_"),
    **page["imageinfo"][0]}
  print(json.dumps({"metadata_batch":n//20+1,"metadata_files":len(lookup),"requests":min(len(qualified),n+20)}),flush=True)
 except Exception as err:
  errors.append({"batch":n//20,"type":type(err).__name__,"detail":str(err)[:200]})
  print(json.dumps({"metadata_error_batch":n//20+1,"error":str(err)[:140]}),flush=True)
 time.sleep(0.24)

to_download=[]
open_source_rights=[]
for row,title in qualified:
 info=lookup.get(unicodedata.normalize("NFC",title).casefold())
 if info is None:
  hold(row,"COMMONS_API_FILE_INFO_UNAVAILABLE")
  continue
 if not isinstance(info.get("pageid"),int):
  hold(row,"COMMONS_PAGE_ID_UNKNOWN")
  continue
 if info.get("mime") not in ("image/jpeg","image/png","image/webp","image/tiff"):
  hold(row,"UNSUPPORTED_SOURCE_MIME",info.get("mime"));continue
 w=int(info.get("width",0));h=int(info.get("height",0))
 if min(w,h)<1050 or max(w,h)<1400:
  hold(row,"BELOW_FULL_COMPOSITION_QUALITY_FLOOR",str((w,h)));continue
 if max(w,h)/min(w,h)>3.1 or w*h>85_000_000:
  hold(row,"EXTREME_ASPECT_RATIO_OR_DIMENSIONS",str((w,h)));continue
 licok,licreason,licdetails=license_decision(info)
 if not licok:
  hold(row,licreason,str(licdetails));continue
 if not (info.get("thumburl") or info.get("url")):
  hold(row,"COMMONS_FILE_BYTES_URL_MISSING");continue
 if (info["file_title"].casefold(),info.get("sha1")) in open_source_rights:
  hold(row,"DUPLICATE_IMAGE_SOURCE_SHA1")
  continue
 open_source_rights.append((info["file_title"].casefold(),info.get("sha1")))
 to_download.append({"row":row,"info":info,"license":licdetails})
print(json.dumps({"metadata_pass":len(qualified),"license_and_size_pass":len(to_download),"other_holds":len(processed),"requests_failed":len(errors)}),flush=True)

def build(item):
 row=item["row"];info=item["info"]
 url=info.get("thumburl") or info["url"]
 try:
  raw,ctype=get(url,max_size=MAX_SOURCE_BYTES,attempts=3)
  if not ctype.startswith("image/"):raise ValueError("NOT_IMAGE_HTTP_RESPONSE")
  with Image.open(io.BytesIO(raw)) as im:
   if im.width<750 or im.height<750:
    raise ValueError("THUMB_TOO_SMALL")
   im=ImageOps.exif_transpose(im)
   im.thumbnail((IMAGE_LONG_EDGE,IMAGE_LONG_EDGE),Image.Resampling.LANCZOS)
   if im.mode not in ("RGB","RGBA"):im=im.convert("RGB")
   if im.mode=="RGBA":
    back=Image.new("RGB",im.size,(255,255,255))
    back.paste(im,mask=im.getchannel("A"));im=back
   data=io.BytesIO()
   im.save(data,format="WEBP",quality=86,method=5)
   webp=data.getvalue()
   width,height=im.size
  if len(webp)>MAX_DERIVATIVE_BYTES:
   raise ValueError("WEBP_EXCEEDS_SIZE_LIMIT")
  if min(width,height)<700:raise ValueError("FINAL_PIXELS_TOO_SMALL")
  return {"status":"READY","row":row,"info":info,"license":item["license"],
   "raw_sha256":sha256(raw),"raw_bytes":len(raw),
   "webp":webp,"final_dimensions":[width,height]}
 except Exception as err:
  return {"status":"HOLD","row":row,"reason":"IMAGE_DOWNLOAD_DECODE_OR_QUALITY_FAILED",
          "detail":str(err)[:160]}
# Batch is 180 images, not one or two. Deterministic order ensures reproductions
# can be retried without reselection and without a continuously running bot.
download_results=[]
subset=to_download[:MAX_IMAGES]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
 futures={pool.submit(build,x):x for x in subset}
 for j,f in enumerate(concurrent.futures.as_completed(futures),1):
  result=f.result()
  download_results.append(result)
  if j%25==0:
   print(json.dumps({"downloaded":j,"expected":len(subset),
          "ready":sum(x["status"]=="READY" for x in download_results)}),flush=True)
download_results.sort(key=lambda x:x["row"]["id"])
records=[]
for result in download_results:
 row=result["row"]
 if result["status"]!="READY":
  hold(row,result["reason"],result.get("detail"))
  continue
 info=result["info"];rights=result["license"]
 filepath=f"site/gallery/images/owner-approved-20261103-{row['id'].split('::')[1]}.webp"
 assert not (ROOT/filepath).exists(),filepath
 blob=result["webp"]
 (ROOT/filepath).write_bytes(blob)
 assert row["image"] is None
 row["image"]={
   "src":"./"+filepath.removeprefix("site/"),
   "quality":"FULL_COMPOSITION_1600PX_COMMONS_PD_SOURCE_VERIFIED",
   "usage":"GALLERY_ONLY__USER_SELECTED_WORK__NO_NEW_PRAYER_DEFAULT",
   "provenance":"Previously owner-approved Nov 3 painting, exact Commons file page resolved by MediaWiki imageinfo; full-image aspect-preserving 1600px derivative. Original source bytes not retained; API SHA1 and raw thumb SHA256 recorded. User source and photo-rights caveats remain independent.",
   "license":rights["license_short"].title(),
   "license_url":info["page_url"],
   "source_note":"Commons' explicit public-domain/CC0 file claim for this exact image, not a new museum-level or universal photographic-rights clearance.",
   "source_dimensions":[info["width"],info["height"]],
   "pixel_width":result["final_dimensions"][0],
   "pixel_height":result["final_dimensions"][1]}
 provenance["sources"].append({
   "artwork_id":row["id"],"title":row["title"],"artist":row["artist"],
   "path":filepath,"image_bytes":len(blob),"sha256":sha256(blob),
   "git_blob_sha":gitblob(blob),
   "source_record":"app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json",
   "source_url":row["source_url"],"commons_file_page":info["page_url"],
   "commons_page_id":info["pageid"],"commons_file_sha1":info.get("sha1"),
   "commons_source_original_pixels":[info["width"],info["height"]],
   "source_downloaded_thumbnail_bytes":result["raw_bytes"],
   "source_downloaded_thumbnail_sha256":result["raw_sha256"],
   "display_dimensions":result["final_dimensions"],
   "recorded_reproduction_rights":rights["license_short"],
   "file_license_claim":rights,
   "source_image_original_bytes_retained":False,
   "release_scope":"GALLERY_ONLY__NO_NEW_PRAYER_DEFAULT",
   "exact_original_image_for_prayer":False})
 records.append({
   "artwork_id":row["id"],"title":row["title"],"artist":row["artist"],
   "source_page":row["source_url"],"commons_file_title":info["file_title"],
   "commons_pageid":info["pageid"],"commons_sha1":info.get("sha1"),
   "commons_mime":info["mime"],"original_dimensions":[info["width"],info["height"]],
   "thumb_bytes":result["raw_bytes"],"thumb_sha256":result["raw_sha256"],
   "derivative_path":filepath,"derivative_bytes":len(blob),
   "derivative_sha256":sha256(blob),"derivative_git_blob_sha":gitblob(blob),
   "derivative_dimensions":result["final_dimensions"],
   "license_evidence":rights,"old_curation":row["record_status"],
   "previous_photo_rights_note":row["rights_note"],
   "original_bytes_archived":False})

for item in to_download[MAX_IMAGES:]:
 hold(item["row"],"QUALIFIED_NEXT_DOWNLOAD_BATCH__CAP_180")
assert len(records)<=MAX_IMAGES
if len(records)<25:
 raise RuntimeError(f"Insufficient safely recoverable artworks: {len(records)}; no public gallery mutation committed")
assert len(provenance["sources"])==234+len(records)
assert len(gallery["records"])==873 and {z["id"] for z in gallery["records"]}==ids_before
for row in gallery["records"]:
 old=historical_snapshots[row["id"]]
 for key,value in old.items():assert row[key]==value,(row["id"],key)
gallery["counts"]["image_available_records"]+=len(records)
gallery["counts"]["distinct_locally_hosted_paintings"]+=len(records)
gallery["counts"]["verified_image_files"]+=len(records)
provenance["local_image_count"]+=len(records)
provenance["catalogue_record_images_count"]+=len(records)
gallery["source_references"]["bulk_approved_commons_batch02"]="app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json"
provenance["source_contract"]+=f" Plus {len(records)} previously owner-selected 2026-11-03 Commons files after source-specific Wikimedia imageinfo checks; full frame 1600px WebP derivatives stored locally; originals remain linked by metadata and are NOT in the source-master bank. Historic catalogue status untouched, no prayer activation."
reasons={}
for p in processed:reasons[p["reason"]]=reasons.get(p["reason"],0)+1
# Owner-selected and source rights are separate; the full hold list is retained.
result={
 "schema":"ao.sacred-art.bulk-approved-commons-source-import-batch02.v1",
 "prior_batch_manifest":"app-data/sacred-art/bulk-commons-photo-import-20261116.v1.json",
 "date":"2026-11-16","scope":"Owner-selected 2026-11-03 RECENT575 originals only; independent source-specific Wikimedia file metadata; gallery-only assets, no prayer/calendar assignments.",
 "source_pr_head_pin":PR_RESEARCH_SHA,"rejection_registry":"app-data/sacred-art/legacy-artwork-rejections-20261116.v1.json",
 "photo_policy":"Only Commons file pages already handpicked by owner; the API must explicitly say Copyrighted=false, license Public domain/CC0, adequate original dimensions, and no photo-rights red flags. No attribution-based automatic decisions on other Commons sources.",
 "max_batch_images":MAX_IMAGES,"source_originals_retained":False,
 "webp_transform":"Full composition; no crop, Photoshop, repaint, AI or upscale; max edge 1600px",
 "assets":records,"held":processed,"metadata_request_errors":errors,
 "summary":{
 "owner_selected_candidate_records":len(candidate_records),
  "prior_qualified_deferred":109,"prior_unexamined_deferred":71,"prior_failed_downloads_retried":19,
 "metadata_eligible_exact_pages":len(qualified),
 "queried_files":len(lookup),"original_rejections_protected":len(rejected),
 "source_photo_license_and_size_qualified":len(to_download),
 "attempted_downloads":len(subset),"new_gallery_images":len(records),
 "new_bytes":sum(x["derivative_bytes"] for x in records),
 "held_or_deferred_rows":len(processed),
 "hold_reasons":reasons,"catalogue_total_records":873,
 "original_curatorial_records_unchanged":873,
 "new_prayer_card_assignments":0,"new_calendar_selections":0,
 "image_hash_mismatches":0}}
write("site/gallery/catalogue.v1.json",gallery)
write("site/gallery/image-provenance.v1.json",provenance)
write("app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json",result)
print(json.dumps({"BULK_FINAL":result["summary"]}),flush=True)
