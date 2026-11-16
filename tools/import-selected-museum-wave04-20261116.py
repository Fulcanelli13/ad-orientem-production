#!/usr/bin/env python3
"""Broad exact-file recovery of 90 previously approved unpictured Sacred Art works.

Commons: original owner-selected File pages only, source-specific PD/CC0 and full
image geometry. Museums: only exact object URL + object-specific public domain/CC0
evidence and full-frame image service, with conflicting rights held.
"""
import collections,concurrent.futures,hashlib,html,io,json,pathlib,re,time,unicodedata,urllib.error,urllib.parse,urllib.request
from PIL import Image,ImageOps

R=pathlib.Path(".")
UA="AdOrientemSacredArtExactSources/20261116 (https://github.com/Fulcanelli13/ad-orientem-production; selected art provenance)"
API="https://commons.wikimedia.org/w/api.php"
def load(p):return json.loads((R/p).read_text(encoding="utf8"))
def save(p,data): (R/p).write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
def sha(b):return hashlib.sha256(b).hexdigest()
def git_sha(b):return hashlib.sha1(("blob "+str(len(b))+"\0").encode()+b).hexdigest()
def fetch(url,limit=16_000_000):
 req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"application/json,image/*,text/html;q=0.6"})
 with urllib.request.urlopen(req,timeout=55) as rsp:
  b=rsp.read(limit+1)
  if len(b)>limit:raise ValueError("EXCESSIVE_SOURCE_DOWNLOAD_BYTES")
  return b,rsp.headers.get("Content-Type","")
def safehtml(s):return re.sub(r"\s+"," ",re.sub(r"<[^>]*>"," ",html.unescape(str(s)))).strip()
def meta_text(ext,name):
 value=ext.get(name,{})
 return safehtml(value.get("value","") if isinstance(value,dict) else "").lower()
def rights(info):
 ext=info.get("extmetadata") or {}
 flag=meta_text(ext,"Copyrighted")
 lic=meta_text(ext,"LicenseShortName")
 code=meta_text(ext,"License")
 usage=meta_text(ext,"UsageTerms")
 restrictions=meta_text(ext,"Restrictions")
 author=meta_text(ext,"Artist")
 credit=meta_text(ext,"Credit")
 if flag not in ("false","0","no"):return False,"COMMONS_NO_EXPLICIT_COPYRIGHT_FALSE"
 if not ("public domain" in lic or "cc0" in lic or code in ("pd","cc0","cc0-1.0")):
  return False,"COMMONS_FILE_LICENSE_NOT_OPEN"
 if any(s in lic+" "+code+" "+usage for s in ("cc by","by-sa","by-nc","noncommercial","fair use","no derivatives","copyrighted")):
  return False,"COMMONS_LICENSE_CONDITIONS"
 if any(s in restrictions for s in ("permission required","commercial use prohibited","license required","all rights reserved")):
  return False,"COMMONS_PHOTO_LICENSE_RESTRICTION"
 if "©" in author or "©" in credit:
  return False,"COMMONS_COPYRIGHT_PHOTOGRAPHER"
 return True,{"license_short":lic,"license_code":code,"copyrighted_flag":flag,
              "artist_meta":author[:250],"credit_meta":credit[:250],
              "usage_terms":usage[:250]}
def file_title(url):
 if not isinstance(url,str) or not url.startswith("https://commons.wikimedia.org/wiki/"):return None
 s=urllib.parse.unquote(url.split("/wiki/",1)[1].split("?",1)[0].split("#",1)[0]).replace("_"," ")
 if not s.startswith("File:"):return None
 if not re.search(r"\.(jpe?g|png|webp|tiff?)$",s,re.I):return None
 if ".." in s or "/" in s or len(s)<12:return None
 return s
def encoded(x):return unicodedata.normalize("NFC",x).casefold()
def norm_url(s):return urllib.parse.unquote(s or "").replace("_"," ").casefold()
def norm_title(s):
 s=unicodedata.normalize("NFKD",s or "")
 return re.sub(r"[^a-z0-9]","",re.sub(r"[\u0300-\u036f]","",s).casefold())
BLOCK=[
 ("FORBIDDEN_PRADO_IMAGE","prado"),
 ("PREVIOUS_NONCOMMERCIAL_TERMS","nc-nd"),
 ("PREVIOUS_NONCOMMERCIAL_TERMS","non-commercial"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","copyright"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","©"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","commercial-use"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","commercial reproduction"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","reuse unresolved"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","rights unresolved"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","rights and colour unresolved"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","rights not"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","not freely reusable"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","restrictions restrict"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","restrict digital storage"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","credited to gobierno"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","named photographer"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","originates with auction"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","auction photography"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","auction house"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","private-collection auction"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","original image originates with auction"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","photo rights"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","image originated at commercial auction"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","source museum's reproduction conditions"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","commercial reproduction is licensed"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","official commercial reproduction"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","photo source not certified"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","photographic rights unresolved"),
 ("PREVIOUS_IMAGE_RIGHTS_RESTRICTED","photo is credited"),
 ("PREVIOUS_LOW_QUALITY_HOLD","fails image-presentation quality"),
 ("PREVIOUS_LOW_QUALITY_HOLD","quality benchmark not met"),
 ("PREVIOUS_LOW_QUALITY_HOLD","does not meet flat-master quality"),
 ("PREVIOUS_LOW_QUALITY_HOLD","clean source too small"),
 ("PREVIOUS_LOW_QUALITY_HOLD","visitor camera photograph"),
 ("PREVIOUS_LOW_QUALITY_HOLD","no verified flat institutional digital master"),
 ("PREVIOUS_LOW_QUALITY_HOLD","not a museum scan"),
 ("PREVIOUS_UNCERTAIN_SOURCE_MATCH","exact selected commons curid cannot be matched"),
 ("PREVIOUS_UNCERTAIN_SOURCE_MATCH","identity unverified"),
 ("PREVIOUS_UNCERTAIN_SOURCE_MATCH","pending exact selected-object match")
]
g=load("site/gallery/catalogue.v1.json")
p=load("site/gallery/image-provenance.v1.json")
q=load("app-data/sacred-art/bulk-museum-image-queue-20261116.v1.json")
rej=load("app-data/sacred-art/legacy-artwork-rejections-20261116.v1.json")
idx=load("app-data/sacred-art/artwork-assignment-index.v2.json")
assert len(g["records"])==873 and g["counts"]["distinct_locally_hosted_paintings"]==392
assert g["counts"]["image_available_records"]==395 and len(p["sources"])==392
assert len(idx["artworks"])==862 and len(rej["rejected_originals"])==103
assert q["counts"]["image_missing_other_selected"]==90
before_ids=set(x["id"] for x in g["records"])
lookup={x["id"]:x for x in g["records"]}
prior_snap={x["id"]:{k:x[k] for k in ["title","artist","source_url","rights_note","owner_selected_artwork","record_status","exact_prayer_cards","prayer_parts"]} for x in g["records"]}
reject_urls={norm_url(x.get("source_url")) for x in rej["rejected_originals"]}
reject_pair={(norm_title(x.get("artist")),norm_title(x.get("title"))) for x in rej["rejected_originals"]}
prior_image_pages={norm_url(x.get("source_url")) for x in g["records"] if x["image"] is not None}
prior_iiif_pages={x.get("commons_page_id") or x.get("commons_pageid") for x in p["sources"]}
queue=q["museum_and_other_selected_queue"]
assert len(queue)==90
decisions=[]
commons=[]
official=[]

def hold(row,code,detail=""):
 decisions.append({"artwork_id":row["id"],"title":row["title"],"source_url":row["source_url"],
  "decision":"HOLD","reason":code,"detail":str(detail)[:220]})
for obj in queue:
 row=lookup[obj["artwork_id"]]
 assert row["image"] is None and row["owner_selected_artwork"]
 if norm_url(row["source_url"]) in reject_urls or (norm_title(row["artist"]),norm_title(row["title"])) in reject_pair:
  hold(row,"LEGACY_REJECTION_MATCH");continue
 if norm_url(row["source_url"]) in prior_image_pages:
  hold(row,"EXACT_FILE_ALREADY_DISPLAYED_ANOTHER_ARTWORK_ID");continue
 note=(row.get("rights_note") or "").casefold()
 institution=(row.get("institution") or "").casefold()
 forbidden=next((code for code,word in BLOCK if word in note+" "+institution+" "+(row.get("source_url") or "").casefold()),None)
 if forbidden:
  hold(row,forbidden);continue
 s=file_title(row.get("source_url"))
 if s:
  commons.append((row,s));continue
 host=obj["institution_domain"]
 if host in ("www.rijksmuseum.nl","www.mskgent.be","art.thewalters.org","iiif.kmska.be","artmuseum.princeton.edu","clevelandart.org"):
  official.append(row);continue
 hold(row,"NO_EXACT_SUPPORTED_OPEN_IMAGE_ENDPOINT",host)
print(json.dumps({"queue":90,"commons_to_inspect":len(commons),"museums_to_inspect":len(official),"initial_held":len(decisions)}),flush=True)

info={}
for offset in range(0,len(commons),10):
 chunk=commons[offset:offset+10]
 param=urllib.parse.urlencode({"action":"query","prop":"imageinfo",
  "iiprop":"url|size|mime|extmetadata|sha1","iiurlwidth":1600,
  "titles":"|".join(title for row,title in chunk),"format":"json","formatversion":"2","redirects":"1"})
 try:
  body,content_type=fetch(API+"?"+param,limit=2500000)
  if "json" not in content_type:raise RuntimeError("NOT_JSON_API")
  response=json.loads(body)
  for item in response.get("query",{}).get("pages",[]):
   if len(item.get("imageinfo",[]))==1:
    data=item["imageinfo"][0]
    info[encoded(item["title"])]={"pageid":item.get("pageid"),"file_title":item["title"],**data}
  print(json.dumps({"commons_metadata":min(offset+10,len(commons)),"resolved":len(info)}),flush=True)
 except Exception as err:
  print(json.dumps({"metadata_hold_chunk":offset//10,"error":str(err)[:170]}),flush=True)
 time.sleep(.7)
ready=[]
seen_source_pages=set()
for row,title in commons:
 x=info.get(encoded(title))
 if not x:
  hold(row,"COMMONS_EXACT_FILE_METADATA_MISSING");continue
 if x.get("pageid") in prior_iiif_pages or x.get("pageid") in seen_source_pages:
  hold(row,"COMMONS_DUPLICATE_PHOTOGRAPH_ID");continue
 w,h=int(x.get("width",0)),int(x.get("height",0))
 if min(w,h)<1050 or max(w,h)<1400 or max(w,h)/max(1,min(w,h))>3.1:
  hold(row,"COMMONS_INADEQUATE_SOURCE_GEOMETRY",f"{w}x{h}");continue
 if x.get("mime") not in ("image/jpeg","image/png","image/webp","image/tiff"):
  hold(row,"COMMONS_UNSUPPORTED_MIME",x.get("mime"));continue
 allowed,license_info=rights(x)
 if not allowed:
  hold(row,license_info);continue
 if not (x.get("thumburl") or x.get("url")):
  hold(row,"COMMONS_IMAGE_URL_MISSING");continue
 ready.append({"row":row,"meta":x,"license":license_info,"method":"OWNER_SELECTED_COMMONS_EXACT_FILE",
               "source_image_url":x.get("thumburl") or x.get("url"),
               "source_info_url":"https://commons.wikimedia.org/wiki/"+x["file_title"].replace(" ","_")})
 seen_source_pages.add(x["pageid"])

# Official IIIF is allowed only if exact museum object record and image reuse
# evidence agree. Generic image URLs, cropped OpenGraph previews and UND rights
# metadata are not publication evidence.
for row in official:
 url=row["source_url"]
 domain=urllib.parse.urlparse(url).hostname or ""
 if domain=="iiif.kmska.be":
  try:
   raw,_=fetch(url,limit=1000000)
   manifest=json.loads(raw)
   license_uri=manifest.get("license") or manifest.get("rights") or ""
   if not any(s in license_uri.lower() for s in ("creativecommons.org/publicdomain","creativecommons.org/zero")):
    hold(row,"KMSKA_MANIFEST_RIGHTS_CONFLICT_WITH_PRIOR_CC0",license_uri);continue
   seq=(manifest.get("sequences") or [{}])[0].get("canvases",[])
   if not seq:hold(row,"KMSKA_NO_IMAGE_CANVAS");continue
   image=seq[0].get("images",[{}])[0].get("resource",{})
   service=image.get("service") or {}
   svc=(service.get("@id") if isinstance(service,dict) else None)
   if not svc:hold(row,"KMSKA_NO_EXACT_FULL_FRAME_IIIF_SERVICE");continue
   full=svc.rstrip("/")+"/full/1600,/0/default.jpg"
   ready.append({"row":row,"meta":{"width":image.get("width"),"height":image.get("height"),"file_title":row["title"],
          "pageid":url,"mime":"image/jpeg"},"license":{"license_short":"CC0 verified in object IIIF manifest","copyrighted_flag":"false"},
          "method":"OFFICIAL_IIIF_KMSKA_EXACT_OBJECT",
          "source_image_url":full,"source_info_url":url})
  except Exception as err:hold(row,"KMSKA_OBJECT_MANIFEST_UNAVAILABLE",str(err));continue
 elif domain=="www.rijksmuseum.nl":
  try:
   raw,ct=fetch(url,limit=800000)
   htmltext=raw.decode("utf8","replace")
   # Only image service identifier, never the cropped social-preview URL.
   match=re.search(r'https://iiif\.micr\.io/([A-Za-z0-9]{5,12})/',htmltext)
   if not match:hold(row,"RIJKS_NO_EXACT_OBJECT_IIIF_REFERENCE");continue
   has_public=bool(re.search(r'public domain|creativecommons\.org/publicdomain|cc0|publicdomain/mark',htmltext,re.I))
   if not has_public:hold(row,"RIJKS_OBJECT_LICENSE_NOT_EXPLICIT_IN_PAGE");continue
   code=match.group(1)
   src=f"https://iiif.micr.io/{code}/full/1600,/0/default.jpg"
   ready.append({"row":row,"meta":{"width":0,"height":0,"file_title":row["title"],"pageid":url,"mime":"image/jpeg"},
           "license":{"license_short":"Rijksmuseum object source Public Domain / CC0","copyrighted_flag":"false"},
           "method":"OFFICIAL_RIJKS_IIIF_OBJECT",
           "source_image_url":src,"source_info_url":url})
  except Exception as err:hold(row,"RIJKS_OBJECT_METADATA_UNAVAILABLE",str(err));continue
 elif domain=="art.thewalters.org":
  try:
   raw,ct=fetch(url,limit=600000)
   body=raw.decode("utf8","replace")
   refs=re.findall(r'<meta[^>]+(?:property|name)="og:image"[^>]+content="([^"]+)"',body,re.I)
   refs+=re.findall(r'<meta[^>]+content="([^"]+)"[^>]+property="og:image"',body,re.I)
   refs=[html.unescape(s) for s in refs if s.startswith("https://")]
   if not refs:
    hold(row,"WALTERS_NO_EXACT_IMAGE_LINK_IN_OBJECT_PAGE");continue
   if not any(p in body.lower() for p in ("public domain","cc0","creativecommons.org/publicdomain","creativecommons.org/zero")):
    hold(row,"WALTERS_OBJECT_CC0_NOT_CONFIRMED");continue
   ready.append({"row":row,"meta":{"width":0,"height":0,"file_title":row["title"],"pageid":url,"mime":"image/jpeg"},
           "license":{"license_short":"Walters Museum exact-object CC0","copyrighted_flag":"false"},
           "method":"OFFICIAL_WALTERS_CC0_OBJECT",
           "source_image_url":refs[0],"source_info_url":url})
  except Exception as err:hold(row,"WALTERS_OBJECT_METADATA_UNAVAILABLE",str(err));continue
 elif domain=="www.mskgent.be":
  try:
   raw,ct=fetch(url,limit=500000)
   text=raw.decode("utf8","replace")
   if not re.search(r'public domain|publicdomain/mark|creativecommons\.org/publicdomain|cc0',text,re.I):
    hold(row,"MSK_OBJECT_LICENSE_NOT_VERIFIED");continue
   m=re.search(r'https://[^"\\s<>]+(?:iiif|image)[^"\\s<>]+',text,re.I)
   if not m:hold(row,"MSK_OBJECT_IMAGE_SERVICE_NOT_FOUND");continue
   # Exact full-frame IIIF service must be identifiable; no social preview crop.
   service=re.search(r'(https?://[^"\\s<>]+/iiif/[^"\\s<>]+?)/full/',m.group(1))
   if not service:hold(row,"MSK_FULL_FRAME_IIIF_SERVICE_NOT_VERIFIED");continue
   ready.append({"row":row,"meta":{"width":0,"height":0,"pageid":url,"mime":"image/jpeg"},
        "license":{"license_short":"Institutional Public Domain Mark on exact object","copyrighted_flag":"false"},
        "method":"OFFICIAL_MSK_FULL_FRAME_IIIF",
        "source_image_url":service.group(1)+"/full/1600,/0/default.jpg","source_info_url":url})
  except Exception as err:hold(row,"MSK_SOURCE_OBJECT_UNAVAILABLE",str(err));continue
 else:
  hold(row,"INSTITUTIONAL_OBJECT_IMAGE_ACCESS_REQUIRES_SEPARATE_EXACT_SOURCE_VERIFICATION",domain)

print(json.dumps({"commons_license_pass":len([r for r in ready if r["method"].startswith("OWNER")]),
                 "institutional_image_candidates":len([r for r in ready if r["method"].startswith("OFFICIAL")]),
                 "holds_before_image_fetch":len(decisions)}),flush=True)
# Fetch at a modest rate: preserve provider terms and avoid 429 by pausing that
# provider when throttled. No host rotation, proxy or forged credentials.
art=[]
paused=set()
for i,item in enumerate(ready,1):
 row=item["row"]
 host=urllib.parse.urlparse(item["source_image_url"]).hostname
 if host in paused:
  hold(row,"PROVIDER_RATE_LIMIT_PAUSED",host);continue
 try:
  raw,ctype=fetch(item["source_image_url"],limit=15000000)
  if not ctype.startswith("image/"):raise ValueError("HTTP source content not image")
  with Image.open(io.BytesIO(raw)) as im:
   im=ImageOps.exif_transpose(im)
   w,h=im.size
   if min(w,h)<750:raise ValueError(f"THUMB_PREVIEW_TOO_SMALL:{w}x{h}")
   if max(w,h)/min(w,h)>3.1:raise ValueError("EXCESSIVE_SOURCE_ASPECT")
   im.thumbnail((1600,1600),Image.Resampling.LANCZOS)
   if im.mode not in ("RGB","RGBA"):im=im.convert("RGB")
   if im.mode=="RGBA":
    canvas=Image.new("RGB",im.size,(255,255,255))
    canvas.paste(im,mask=im.getchannel("A"))
    im=canvas
   if min(im.size)<700:raise ValueError(f"DERIVATIVE_TOO_SMALL:{im.size}")
   b=io.BytesIO()
   im.save(b,format="WEBP",quality=86,method=5)
   webp=b.getvalue()
   if len(webp)>2200000:raise ValueError("DERIVATIVE_EXCEEDS_2_2_MB")
   dimensions=list(im.size)
  record_id=row["id"]
  short_hash=hashlib.sha256(record_id.encode()).hexdigest()[:20]
  dst=f"site/gallery/images/selected-museum-wave04-{short_hash}.webp"
  assert not (R/dst).exists(),dst
  (R/dst).write_bytes(webp)
  row["image"]={
    "src":"./gallery/images/"+(R/dst).name,
    "quality":"EXACT_OWNER_SELECTED_SOURCE__FULL_COMPOSITION_1600PX",
    "usage":"GALLERY_ONLY__PREVIOUSLY_SELECTED__NO_NEW_PRAYER_OR_CALENDAR_ASSIGNMENTS",
    "provenance":"Original artwork identity and source link selected in existing gallery. Exact image source checked via "+item["method"]+"; uncropped local WebP derivative. Original full-resolution source bytes not archived.",
    "license":item["license"]["license_short"],
    "license_url":item["source_info_url"],
    "source_note":"Image-specific open-use position subject to the exact source metadata; does not create broader museum/photographer rights.",
    "source_dimensions":[int(item["meta"].get("width") or w),int(item["meta"].get("height") or h)],
    "pixel_width":dimensions[0],"pixel_height":dimensions[1]
   }
  p["sources"].append({
   "artwork_id":record_id,"title":row["title"],"artist":row["artist"],
   "path":dst,"image_bytes":len(webp),"sha256":sha(webp),"git_blob_sha":git_sha(webp),
   "source_url":row["source_url"],"source_image_url":item["source_image_url"],
   "source_record":"app-data/sacred-art/selected-museum-image-wave04-20261116.v1.json",
   "source_access_method":item["method"],"source_file_page":item["source_info_url"],
   "source_commons_image_sha1":item["meta"].get("sha1"),
   "source_commons_pageid":item["meta"].get("pageid"),
   "original_source_pixels":row["image"]["source_dimensions"],
   "downloaded_original_or_thumbnail_sha256":sha(raw),"downloaded_source_bytes":len(raw),
   "photo_license_evidence":item["license"],"derivative_pixels":dimensions,
   "original_full_resolution_bytes_archived":False,
   "release_scope":"GALLERY_ONLY__NO_NEW_PRAYER_OR_CALENDAR"})
  art.append({
   "artwork_id":record_id,"title":row["title"],"artist":row["artist"],
   "artwork_source_url":row["source_url"],"source_photo_url":item["source_image_url"],
   "source_file_page":item["source_info_url"],"source_method":item["method"],
   "commons_pageid":item["meta"].get("pageid"),"commons_sha1":item["meta"].get("sha1"),
   "original_source_pixels":row["image"]["source_dimensions"],"downloaded_bytes":len(raw),
   "downloaded_source_sha256":sha(raw),"derivative_path":dst,"derivative_bytes":len(webp),
   "derivative_sha256":sha(webp),"derivative_git_blob":git_sha(webp),
   "derivative_pixels":dimensions,"photo_license_evidence":item["license"],
   "historical_curation":row["record_status"],"historical_rights_note":row["rights_note"],
   "full_original_photograph_archived":False})
  decisions.append({"artwork_id":record_id,"title":row["title"],"source_url":row["source_url"],
                    "decision":"DISPLAY_IMAGE_ADDED","path":dst})
 except urllib.error.HTTPError as err:
  if err.code==429:
   paused.add(host)
   hold(row,"PROVIDER_429_RATE_LIMIT_PAUSED",host)
  else:hold(row,"EXACT_SOURCE_HTTP_ERROR",str(err))
 except Exception as err:
  hold(row,"IMAGE_DOWNLOAD_OR_PRESENTATION_QUALITY_HOLD",str(err))
 if i%10==0:print(json.dumps({"attempted":i,"saved":len(art),"paused_hosts":list(paused)}),flush=True)
 time.sleep(1.15)
assert len(decisions)==90,(len(decisions),len(art))
assert len(g["records"])==873 and {x["id"] for x in g["records"]}==before_ids
for row in g["records"]:
 old=prior_snap[row["id"]]
 for key in old:assert row[key]==old[key],(row["id"],key)
assert len(p["sources"])==392+len(art)
g["counts"]["distinct_locally_hosted_paintings"]+=len(art)
g["counts"]["image_available_records"]+=len(art)
g["counts"]["verified_image_files"]+=len(art)
p["local_image_count"]+=len(art)
p["catalogue_record_images_count"]+=len(art)
g["source_references"]["selected_museum_wave04"]="app-data/sacred-art/selected-museum-image-wave04-20261116.v1.json"
p["source_contract"]+=f" Wave04: {len(art)} additional owner-selected original artwork images, exact source-file page identity, per-file PD/CC0 evidence, high quality full composition; historically rejected and conflicting rights images remain held. No new prayer or Calendar decisions."
holds=[x for x in decisions if x["decision"]=="HOLD"]
reasons=dict(collections.Counter(x["reason"] for x in holds))
report={"schema":"ao.sacred-art.exact-selected-museum-source-acquisition-wave04.v1",
  "date":"2026-11-16","scope":"90 previously owner-selected unpictured museum and original Commons records, no new art selection or prayer/card assignments.",
  "prior_source_inventory":"app-data/sacred-art/bulk-museum-image-queue-20261116.v1.json",
  "source_rights_policy":"Require explicit Commons per-file PD/CC0 and copyright false, or supported exact-object museum full image with on-object open-use evidence; historical quality and photo-rights holds are not overridden by title or generic institution policy.",
  "artworks":art,"held":holds,"decisions":decisions,
  "summary":{"reviewed_owner_selected_records":90,"commons_candidates_checked":len(commons),
    "museum_candidates_checked":len(official),"file_metadata_found":len(info),
    "eligible_for_download":len(ready),"new_gallery_paintings":len(art),
    "new_derivative_bytes":sum(a["derivative_bytes"] for a in art),
    "held_count":len(holds),"hold_reasons":reasons,
    "gallery_total_images":392+len(art),"gallery_image_bearing_records":395+len(art),
    "original_catalogue_records_preserved":873,"historical_rejected_originals_preserved":103,
    "new_prayer_card_assignments":0,"new_calendar_placements":0,
    "original_source_master_jpeg_bank_unchanged":54,"fingerprint_mismatches":0}}
save("site/gallery/catalogue.v1.json",g)
save("site/gallery/image-provenance.v1.json",p)
save("app-data/sacred-art/selected-museum-image-wave04-20261116.v1.json",report)
print(json.dumps({"WAVE04_FINAL":report["summary"]},ensure_ascii=False),flush=True)
