#!/usr/bin/env python3
"""Source-specific high-resolution acquisition for 182 previously approved photo-quality holds.

Never reapprove an artwork or change canonical prayer assignments. Use Commons exact
original when only its >85MP dimensions previously blocked a 1600px derivative,
or an exact museum object with unambiguous inventory, identity and reuse evidence.
"""
import collections,hashlib,html,io,json,pathlib,re,time,unicodedata,urllib.error,urllib.parse,urllib.request
from PIL import Image,ImageOps

P=pathlib.Path(".")
UA="AdOrientemImageSourceAudit/1.0 (https://github.com/Fulcanelli13/ad-orientem-production; original artwork source verification)"
def read(path):return json.loads((P/path).read_text(encoding="utf8"))
def write(path,value):(P/path).write_text(json.dumps(value,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
def sha(b):return hashlib.sha256(b).hexdigest()
def blob(b):return hashlib.sha1(("blob "+str(len(b))+"\0").encode()+b).hexdigest()
def fetch(url,limit=16_000_000,timeout=43):
 req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"application/json,image/*,text/html;q=0.8"})
 with urllib.request.urlopen(req,timeout=timeout) as r:
  content=r.read(limit+1)
  if len(content)>limit:raise ValueError("SOURCE_EXCEEDS_DOWNLOAD_BYTE_LIMIT")
  return content,r.headers.get("Content-Type","")
def norm(s):
 x=unicodedata.normalize("NFKD",str(s or "")).encode("ascii","ignore").decode().lower()
 return re.sub(r"[^a-z0-9]","",x)
def decode_source(s):
 return urllib.parse.unquote(str(s or "")).replace("_"," ").casefold()
def file_title(url):
 if not url.startswith("https://commons.wikimedia.org/wiki/"):return None
 tail=urllib.parse.unquote(url.split("/wiki/",1)[1].split("#",1)[0].split("?",1)[0]).replace("_"," ")
 return tail if tail.startswith("File:") and re.search(r"\.(?:jpe?g|png|webp|tiff?)$",tail,re.I) else None
def strip(s):return re.sub(r"\s+"," ",re.sub("<[^>]*>"," ",html.unescape(str(s)))).strip()
def metadata(ext,key):
 x=ext.get(key,{})
 return strip(x.get("value","") if isinstance(x,dict) else "")
def commons_rights(i):
 meta=i.get("extmetadata") or {}
 lic=metadata(meta,"LicenseShortName").lower()
 code=metadata(meta,"License").lower()
 copyright=metadata(meta,"Copyrighted").lower()
 credit=metadata(meta,"Credit")
 artist=metadata(meta,"Artist")
 usage=metadata(meta,"UsageTerms").lower()
 restrictions=metadata(meta,"Restrictions").lower()
 if copyright not in ("false","0","no"):return False,"COMMONS_EXPLICIT_COPYRIGHT_FLAG_MISSING"
 if not ("public domain" in lic or "cc0" in lic or code in ("pd","cc0","cc0-1.0")):
  return False,"COMMONS_FILE_NOT_EXPLICIT_PUBLIC_DOMAIN_OR_CC0"
 if any(t in lic+" "+code+" "+usage+" "+restrictions for t in ("by-sa","by-nc","cc by","noncommercial","commercial use prohibited","no derivatives","fair use")):
  return False,"COMMONS_RESTRICTIONS_OR_PHOTO_LICENSE"
 if "©" in artist or "©" in credit:return False,"COMMONS_NAMED_PHOTOGRAPHER_COPYRIGHT_SIGNAL"
 return True,{"license_short":lic,"license_code":code,"copyrighted_flag":copyright,"credit":credit[:300],"artist_metadata":artist[:300]}
def derivative(raw,kind):
 with Image.open(io.BytesIO(raw)) as im:
  im=ImageOps.exif_transpose(im)
  if min(im.size)<750:raise ValueError("INSUFFICIENT_INPUT_THUMB_PIXELS")
  if max(im.size)/min(im.size)>3.1:raise ValueError("EXCESSIVE_SOURCE_ASPECT")
  im.thumbnail((1600,1600),Image.Resampling.LANCZOS)
  if min(im.size)<700:raise ValueError("FINAL_IMAGE_BELOW_700PX")
  if im.mode not in ("RGB","RGBA"):im=im.convert("RGB")
  if im.mode=="RGBA":
   bg=Image.new("RGB",im.size,(255,255,255))
   bg.paste(im,mask=im.getchannel("A"));im=bg
  buffer=io.BytesIO();im.save(buffer,format="WEBP",quality=85,method=5)
  b=buffer.getvalue()
  if len(b)>2_300_000:raise ValueError("LOCAL_DERIVATIVE_EXCEEDS_2_3_MB")
  return b,list(im.size)
gallery=read("site/gallery/catalogue.v1.json")
prov=read("site/gallery/image-provenance.v1.json")
second=read("app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json")
third=read("app-data/sacred-art/commons-rate-limit-recovery-wave03-20261116.v1.json")
fourth=read("app-data/sacred-art/selected-museum-image-wave04-20261116.v1.json")
fifth=read("app-data/sacred-art/curated-cohort-image-wave05-20261116.v1.json")
rejections=read("app-data/sacred-art/legacy-artwork-rejections-20261116.v1.json")
assert gallery["counts"]["total_records"]==873
assert gallery["counts"]["distinct_locally_hosted_paintings"]==467
assert gallery["counts"]["image_available_records"]==470
assert len(prov["sources"])==467
assert len(rejections["rejected_originals"])==103
existing={r["id"]:r for r in gallery["records"]}
snap={k:{x:r[x] for x in ("id","title","artist","source_url","rights_note","record_status","owner_selected_artwork","exact_prayer_cards","prayer_parts")} for k,r in existing.items()}
published_pages={x.get("commons_page_id") or x.get("commons_pageid") for x in prov["sources"]}
published_pages.discard(None)
for x in fourth["artworks"]:
 if x.get("commons_pageid"):published_pages.add(x["commons_pageid"])
quality_pattern=re.compile(r"BELOW_FULL|EXTREME_ASPECT|SOURCE_THUMBNAIL|LOW_QUALITY|INAD.*GEOMET|QUALITY|PREVIEW",re.I)
all_holds=second["held"]+third["held"]+fourth["held"]+fifth["held"]
quality_by_id={}
for h in all_holds:
 if quality_pattern.search(h["reason"]) and h["artwork_id"] in existing and existing[h["artwork_id"]]["image"] is None:
  quality_by_id[h["artwork_id"]]=h
assert len(quality_by_id)==182,("Previously confirmed unique quality holds changed",len(quality_by_id))
excluded_urls={decode_source(x.get("source_url")) for x in rejections["rejected_originals"]}
excluded_pair={(norm(x.get("artist")),norm(x.get("title"))) for x in rejections["rejected_originals"]}
base_ids=set(existing)
hold_rows=[]
ready=[]
probe=[]
def hold(row,code,detail=""):
 hold_rows.append({"artwork_id":row["id"],"source_url":row["source_url"],
  "title":row["title"],"decision":"HOLD","reason":code,"detail":str(detail)[:220]})
def accession_for(row,title):
 # Explicit object-identifier matches only; do not search by artist/title alone
 f=title.replace("_"," ")
 m=re.search(r"- ([0-9]{4}-[A-Z]{1,3}|S-[0-9]{1,3}|[0-9]{4}-[A-Z]{1,3}) - Museum of Fine Arts Ghent",f,re.I)
 if m:return m.group(1).upper()
 if row["id"]=="RECENT575::072":return "S-91" # verified MSK object+artist+title
 return None
candidates=[]
for art_id,h in sorted(quality_by_id.items()):
 row=existing[art_id]
 assert row["owner_selected_artwork"] and row["image"] is None
 u=row["source_url"]
 if decode_source(u) in excluded_urls or (norm(row["artist"]),norm(row["title"])) in excluded_pair:
  hold(row,"HISTORICAL_REJECTED_ARTWORK_SOURCE_OR_ID");continue
 if "prado" in " ".join(str(row.get(k) or "") for k in ("id","title","source_url","institution")).lower():
  hold(row,"OWNER_PRADO_IMAGE_EXCLUSION");continue
 title=file_title(u)
 if not title:
  hold(row,"NO_EXACT_COMMONS_FILE_PAGE");continue
 candidates.append((row,title,quality_by_id[art_id]))
print(json.dumps({"unresolved_quality_ids":len(quality_by_id),"original_file_page_candidates":len(candidates)}),flush=True)
commons={}
for i in range(0,len(candidates),18):
 chunk=candidates[i:i+18]
 args=urllib.parse.urlencode({"action":"query","prop":"imageinfo","iiprop":"url|size|mime|extmetadata|sha1",
  "iiurlwidth":1600,"titles":"|".join(t for row,t,h in chunk),"format":"json","formatversion":"2","redirects":"1"})
 try:
  raw,ctype=fetch("https://commons.wikimedia.org/w/api.php?"+args,2_800_000)
  if "json" not in ctype:raise ValueError("COMMONS_METADATA_RESPONSE_NOT_JSON")
  for pg in json.loads(raw).get("query",{}).get("pages",[]):
   if len(pg.get("imageinfo",[]))==1:
    commons[unicodedata.normalize("NFC",pg["title"]).casefold()]={"pageid":pg.get("pageid"),"title":pg["title"],**pg["imageinfo"][0]}
  print(json.dumps({"metadata_chunk":i//18+1,"resolved":len(commons)}),flush=True)
 except Exception as err:
  print(json.dumps({"metadata_chunk_failed":i//18+1,"error":str(err)[:160]}),flush=True)
 time.sleep(.45)
assert len(commons)>=145,("Commons API not sufficiently available",len(commons))
museum_candidates=[]
for row,title,h in candidates:
 meta=commons.get(unicodedata.normalize("NFC",title).casefold())
 if not meta:
  hold(row,"COMMONS_EXACT_FILE_METADATA_UNAVAILABLE");continue
 if meta.get("pageid") in published_pages:
  hold(row,"EXACT_COMMONS_FILE_ALREADY_PUBLISHED");continue
 licok,lic=commons_rights(meta)
 if not licok:
  hold(row,lic);continue
 ow,oh=int(meta.get("width",0)),int(meta.get("height",0))
 if max(ow,oh)/max(1,min(ow,oh))>3.1:
  hold(row,"ORIGINAL_ASPECT_RATIO_UNSUITABLE",f"{ow}x{oh}");continue
 if h["reason"]=="EXTREME_ASPECT_RATIO_OR_DIMENSIONS":
  if min(ow,oh)>=1050 and max(ow,oh)>=1400 and meta.get("thumburl"):
   ready.append({"row":row,"method":"ORIGINAL_OWNER_APPROVED_FILE_RESIZED_FROM_ULTRAHIGHRES",
      "download":meta["thumburl"],"rights":lic,"photo_page":"https://commons.wikimedia.org/wiki/"+meta["title"].replace(" ","_"),
      "metadata":meta,"photo_rights_evidence":"Exact owner-approved Commons File page PD/CC0 with explicit copyright=false; original over old megapixel processing cap, not low quality"})
  else:hold(row,"HIGH_PIXEL_ORIGINAL_HAS_NO_QUALIFIED_PREVIEW",f"{ow}x{oh}")
  continue
 accession=accession_for(row,title)
 if accession:
  museum_candidates.append({"row":row,"accession":accession,"commons":meta,"commons_license":lic,
     "prior_hold_reason":h["reason"]})
  continue
 hold(row,"LOW_RESOLUTION_ORIGINAL_WITH_NO_VERIFIED_INSTITUTIONAL_EQUIVALENT",
      "Exact original inadequate; record ready for institutional rights/identity research")
print(json.dumps({"oversize_eligible":len(ready),"msk_verified_accession_candidates":len(museum_candidates),
                  "other_low_res_holds":len(hold_rows)}),flush=True)

def museum_probe(entry):
 row=entry["row"];accession=entry["accession"]
 object_url="https://www.mskgent.be/en/collection/"+accession.lower()
 item={"artwork_id":row["id"],"accession":accession,"object_url":object_url,
       "original_commons_page":row["source_url"]}
 try:
  raw,ctype=fetch(object_url,1_000_000)
  page=raw.decode("utf8","replace")
  if "text/html" not in ctype:raise ValueError("MUSEUM_OBJECT_PAGE_NOT_HTML")
  # Bind exactly to inventory and prior original-artist; do not release a same-titled museum work
  if not re.search(r"(?i)\bPublic Domain\b",page):
   raise ValueError("MUSEUM_OBJECT_PAGE_NO_PUBLIC_DOMAIN_LABEL")
  if not re.search(r"(?i)(?:inventory number|inventarisnummer|inv\.|permalink)",page):
   raise ValueError("MUSEUM_OBJECT_INVENTORY_EVIDENCE_MISSING")
  if norm(accession) not in norm(html.unescape(page)):
   raise ValueError("MUSEUM_INVENTORY_NOT_FOUND_IN_OBJECT_PAGE")
  artist=norm(row["artist"])
  if not artist or artist in ("unknown","anonymous","artisttoverify") or artist not in norm(html.unescape(page)):
   raise ValueError("ORIGINAL_SELECTED_ARTIST_NOT_CONFIRMED_BY_MUSEUM_OBJECT")
  manifests=re.findall(r'https://imagehub\.mskgent\.be/iiif/3/[0-9]+/manifest\.json',page)
  if not manifests:raise ValueError("MUSEUM_OBJECT_IIIF_MANIFEST_MISSING")
  manifest_url=manifests[0]
  body,ct=fetch(manifest_url,1_500_000)
  m=json.loads(body)
  rights_uri=str(m.get("rights") or m.get("license") or "").lower()
  # Unlike an unrelated Wikimedia crop, this must be exactly the collection object
  # and the official metadata must not contradict the Public Domain object page.
  if "rightsstatements.org/page/und" in rights_uri:
   raise ValueError("MUSEUM_IIIF_RIGHTS_UNDETERMINED")
  if rights_uri and not any(s in rights_uri for s in
     ("creativecommons.org/publicdomain","creativecommons.org/zero","publicdomain","cc0")):
   raise ValueError("MUSEUM_IIIF_RIGHTS_NOT_PUBLIC_DOMAIN:"+rights_uri[:100])
  canvas=(m.get("items") or [{}])[0]
  annotations=(canvas.get("items") or [{}])[0].get("items",[])
  image=((annotations or [{}])[0].get("body") or {})
  service=image.get("service") or []
  if isinstance(service,dict):service=[service]
  ids=[s.get("id") or s.get("@id") for s in service if isinstance(s,dict)]
  base=next((x for x in ids if isinstance(x,str) and x.startswith("https://")),None)
  if not base:raise ValueError("MUSEUM_IIIF_NO_EXACT_IMAGE_SERVICE")
  original_w=int(image.get("width") or canvas.get("width") or 0)
  original_h=int(image.get("height") or canvas.get("height") or 0)
  if min(original_w,original_h)<1050 or max(original_w,original_h)<1400:
   raise ValueError("MUSEUM_IMAGE_RESOLUTION_UNDER_FLOOR")
  item.update({"decision":"QUALIFIED_EXACT_MUSEUM_PHOTO",
       "rights_uri":rights_uri,"manifest_url":manifest_url,"image_base":base,
       "source_pixels":[original_w,original_h],
       "download":base.rstrip("/")+"/full/1600,/0/default.jpg"})
 except Exception as err:
  item.update({"decision":"HOLD","reason":"MUSEUM_EXACT_OBJECT_PHOTO_NOT_RELEASED","detail":str(err)[:250]})
 return item
for idx,e in enumerate(museum_candidates):
 result=museum_probe(e)
 probe.append(result)
 if result["decision"]=="QUALIFIED_EXACT_MUSEUM_PHOTO":
  ready.append({"row":e["row"],"method":"MUSEUM_MSK_GENT_EXACT_OBJECT_IIIF",
   "download":result["download"],
   "metadata":{"pageid":result["object_url"],"sha1":None,
         "width":result["source_pixels"][0],"height":result["source_pixels"][1]},
   "photo_page":result["object_url"],
   "rights":{"license_short":"MSK Ghent Public Domain on exact catalogue object and IIIF manifest",
             "copyrighted_flag":"false","museum_policy":"https://www.mskgent.be/en/collection/image-rights",
             "rights_uri":result["rights_uri"],"inventory":e["accession"]},
   "photo_rights_evidence":"Exact MSK Gent catalogue page inventory number and artist match, Public Domain label, high-resolution IIIF manifest rights check"})
 else:hold(e["row"],result["reason"],result["detail"])
 if idx%10==0:print(json.dumps({"museum_checked":idx+1,"museum_qualified":len([x for x in probe if x["decision"]=="QUALIFIED_EXACT_MUSEUM_PHOTO"])}),flush=True)
 time.sleep(.3)
print(json.dumps({"ready_to_download":len(ready),"museum_candidates":len(museum_candidates),
                  "held_before_download":len(hold_rows)}),flush=True)
photo=[]
paused_hosts=set()
for j,item in enumerate(ready,1):
 row=item["row"];url=item["download"];host=urllib.parse.urlparse(url).hostname
 if host in paused_hosts:
  hold(row,"EXACT_PHOTO_SERVER_RATE_LIMIT_PAUSED",host);continue
 try:
  raw,ctype=fetch(url,12_000_000)
  if not ctype.startswith("image/"):raise ValueError("EXACT_PHOTO_SERVER_RETURNED_NON_IMAGE")
  webp,size=derivative(raw,item["method"])
  path="site/gallery/images/owner-selected-quality-upgrade-"+row["id"].split("::")[-1]+".webp"
  if (P/path).exists():raise ValueError("IMAGE_PATH_ALREADY_EXISTS")
  (P/path).write_bytes(webp)
  image={"src":"./"+path.removeprefix("site/"),
   "quality":"EXACT_SOURCE_HIGH_RESOLUTION_FULL_COMPOSITION_1600PX",
   "usage":"GALLERY_ONLY__OWNER_SELECTED__NO_NEW_PRAYER_OR_CALENDAR",
   "provenance":"Recovered from already owner-approved artwork after earlier quality hold; exact original Commons or matching museum accession/institutional catalogue full-image source. Not a new artwork choice.",
   "license":item["rights"]["license_short"],
   "license_url":item["photo_page"],
   "source_note":item["photo_rights_evidence"],
   "source_dimensions":[int(item["metadata"].get("width",0)),int(item["metadata"].get("height",0))],
   "pixel_width":size[0],"pixel_height":size[1]}
  row["image"]=image
  pentry={"artwork_id":row["id"],"title":row["title"],"artist":row["artist"],"path":path,
   "image_bytes":len(webp),"sha256":sha(webp),"git_blob_sha":blob(webp),
   "source_record":"app-data/sacred-art/quality-recovery-wave06-20261116.v1.json",
   "source_url":row["source_url"],"photo_source_url":url,
   "photo_object_page":item["photo_page"],"photo_access_method":item["method"],
   "photo_rights_evidence":item["rights"],"source_original_pixels":image["source_dimensions"],
   "source_download_sha256":sha(raw),"source_download_bytes":len(raw),
   "derived_pixels":size,"full_size_original_not_archived":True,
   "release_scope":"GALLERY_ONLY__NO_NEW_READER_DEFAULT"}
  prov["sources"].append(pentry)
  photo.append({"artwork_id":row["id"],"title":row["title"],"artist":row["artist"],
    "old_held_source_url":row["source_url"],"new_photo_page":item["photo_page"],
    "exact_photo_download_url":url,"method":item["method"],
    "original_dimensions":image["source_dimensions"],
    "source_download_bytes":len(raw),"source_download_sha256":sha(raw),
    "derivative_path":path,"derivative_bytes":len(webp),"derivative_sha256":sha(webp),
    "derivative_git_blob_sha":blob(webp),"derivative_dimensions":size,
    "source_rights":item["rights"],"owner_record_status":row["record_status"],
    "original_historical_rights_note":row["rights_note"],
    "original_full_resolution_jpeg_archived":False})
 except urllib.error.HTTPError as err:
  if err.code==429:paused_hosts.add(host)
  hold(row,"EXACT_IMAGE_DOWNLOAD_HTTP_ERROR",str(err))
 except Exception as err:hold(row,"EXACT_IMAGE_DECODE_OR_PHOTO_QUALITY_HOLD",str(err))
 time.sleep(.9)
assert len(photo)+len(hold_rows)==182,(len(photo),len(hold_rows))
assert {r["id"] for r in gallery["records"]}==base_ids
for row in gallery["records"]:
 for key,value in snap[row["id"]].items():
  assert row[key]==value,(row["id"],key)
new=len(photo)
assert len(prov["sources"])==467+new
gallery["counts"]["distinct_locally_hosted_paintings"]+=new
gallery["counts"]["image_available_records"]+=new
gallery["counts"]["verified_image_files"]+=new
prov["local_image_count"]+=new
prov["catalogue_record_images_count"]+=new
gallery["source_references"]["quality_recovery_wave06"]="app-data/sacred-art/quality-recovery-wave06-20261116.v1.json"
prov["source_contract"]+=f" Wave06: exact-owner-photo large originals or exactly matched open museum object, {new} more full-frame gallery derivatives; rights/rejected-source and photo quality holds untouched."
reasons=dict(collections.Counter(x["reason"] for x in hold_rows))
report={"schema":"ao.sacred-art.resolution-held-exact-source-bulk-recovery.v1",
  "date":"2026-11-16",
  "scope":"All 182 still-image-missing owner-selected resolution/photo-quality holds after waves 1-5; no new artworks or prayer/card/date placements.",
  "quality_floor":"No upscaling: actual downloaded image >=750 pixels shortest edge, displayed cropped? never; max 1600px long edge; min final >=700px. Source original should be 1050px shortest and 1400px longest. Old >85MP processing cap is not a quality fault.",
  "institutional_source_policy":"Exact museum inventory+artist match, labelled Public Domain and nonconflicting IIIF rights required; MSK reuse policy allows offered online collection resolutions, commercial/full-resolution reuse may impose extra conditions. This source evidence must not be generalized to unrelated photos.",
  "source_photo_rights_caveat":"Gallery WebP derivatives, not full original masters. Do not claim universal jurisdiction clearance.",
  "museum_object_probes":probe,
  "artworks":photo,"held":hold_rows,
  "summary":{"candidate_quality_hold_records":182,
   "commons_metadata_pages_checked":len(candidates),"commons_pages_resolved":len(commons),
   "ultrahighres_originals_qualified":len([x for x in ready if x["method"]=="ORIGINAL_OWNER_APPROVED_FILE_RESIZED_FROM_ULTRAHIGHRES"]),
   "exact_museum_accession_candidates":len(museum_candidates),
   "museum_exact_photo_qualified":len([x for x in ready if x["method"]=="MUSEUM_MSK_GENT_EXACT_OBJECT_IIIF"]),
   "source_images_download_attempted":len(ready),
   "new_gallery_paintings":new,
   "new_image_bytes":sum(x["derivative_bytes"] for x in photo),
   "held_for_better_photo":len(hold_rows),
   "hold_reasons":reasons,"gallery_total_images":467+new,
   "image_bearing_records":470+new,"catalogue_records_unchanged":873,
   "historical_rejected_originals_protected":103,"new_prayer_card_assignments":0,
   "new_calendar_placements":0,"original_jpeg_source_bank_unchanged":54}}
write("site/gallery/catalogue.v1.json",gallery)
write("site/gallery/image-provenance.v1.json",prov)
write("app-data/sacred-art/quality-recovery-wave06-20261116.v1.json",report)
print(json.dumps({"WAVE06_FINAL":report["summary"]}),flush=True)
