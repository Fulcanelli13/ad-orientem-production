#!/usr/bin/env python3
import pathlib,hashlib,json
P=pathlib.Path
def load(p):return json.loads(P(p).read_text())
def save(p,x):P(p).write_text(json.dumps(x,indent=2,ensure_ascii=False)+"\n")
def sha256(b):return hashlib.sha256(b).hexdigest()
def blob(b):return hashlib.sha1(("blob "+str(len(b))+"\0").encode()+b).hexdigest()
gallery=load("site/gallery/catalogue.v1.json")
provenance=load("site/gallery/image-provenance.v1.json")
archive=load("app-data/sacred-art/class-i-source-recovery-20261116.v1.json")
assert len(gallery["records"])==870
assert gallery["counts"]["distinct_locally_hosted_paintings"]==70
assert len(provenance["sources"])==70
old_ids={x["id"] for x in gallery["records"]}
specs=[
 ("RELEASED::class-i-2026:ngi-72",0,"Giovanni Lanfranco","The Miracle of the Loaves and Fishes",
  "National Gallery of Ireland, NGI.72, Dublin, Ireland",
  "https://onlinecollection.nationalgallery.ie/objects/10345/the-miracle-of-the-loaves-and-fishes",
  "https://commons.wikimedia.org/wiki/File:Giovanni_Lanfranco_-_Miracle_of_the_Bread_and_Fish_-_WGA12454.jpg",
  "2026-03-15","Laetare Sunday","tempora:Quad4-0:1:pv","Tempora/Quad4-0",
  "site/gallery/images/lanfranco-ngi72-class-i-original.jpg",
  "LOW_RES_PREVIEW__PREVIOUSLY_RELEASED_JPEG_1285x683",None),
 ("RELEASED::class-i-2026:vatican-mv-40333",1,"Raphael","The Transfiguration",
  "Vatican Museums, Pinacoteca Vaticana MV.40333, Vatican City",
  "https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/la-pinacoteca/sala-viii---secolo-xvi/raffaello-sanzio--trasfigurazione.html",
  "https://commons.wikimedia.org/wiki/File:Raffael-verkl%C3%A4rung-christi.jpg",
  "2026-03-01","Second Sunday of Lent","tempora:Quad2-0:1:v","Tempora/Quad2-0",
  "site/gallery/images/raphael-transfiguration-class-i-original.jpg",
  "EXACT_PREVIOUSLY_RELEASED_CLASS_I_JPEG__HISTORIC_ARTBOOK_SCAN",None),
 ("RELEASED::class-i-2026:pafa-1900-1",2,"Henry Ossawa Tanner","Nicodemus Visiting Jesus",
  "Pennsylvania Academy of the Fine Arts 1900.1, Philadelphia, USA",
  "https://www.pafa.org/museum/collection/item/nicodemus",
  "https://commons.wikimedia.org/wiki/File:Nicodemus_Visiting_Jesus,_by_Henry_Ossawa_Tanner.jpg",
  "2026-05-25","Pentecost Monday","tempora:Pasc7-1:1:r","Tempora/Pasc7-1",
  "site/gallery/images/tanner-nicodemus-class-i-original.jpg",
  "EXACT_PREVIOUSLY_RELEASED_CLASS_I_JPEG__PAFA_EXIF_RIGHTS_NOTE",
  "Barbara Katus, PAFA photo credit")
]
rows=[]
for item in specs:
 (id,i,artist,title,place,museum_url,file_url,date,occasion,principal,proper,
  output,quality,photographer)=item
 old=archive["sources"][i]
 assert old["date"]==date and old["historical_release_pr"] in [2852,2857,2861]
 master=old["source_master_path"]
 assert master.startswith("app-data/sacred-art/source-masters/")
 data=P(master).read_bytes()
 assert data[:2]==b"\xff\xd8"
 assert len(data)==old["source_bytes"] and sha256(data)==old["source_sha256"]
 assert blob(data)==old["source_git_sha"]
 assert id not in old_ids
 P(output).write_bytes(data)
 image={"src":"./"+output.removeprefix("site/"),"quality":quality,
 "usage":"GALLERY_ONLY__EXISTING_CALENDAR_SELECTION__NO_NEW_PRAYER_DEFAULT",
 "pixel_width":old["pixels"][0],"pixel_height":old["pixels"][1],
 "provenance":"Existing owner-selected 2026 Class I Home Calendar painting released in old PR #"+str(old["historical_release_pr"]),
 "source_note":old["rights"],
 "license":"Commons PD-Art / Public Domain Mark; photograph caveats retained",
 "license_url":file_url}
 if photographer:image["photographer"]=photographer
 record={"id":id,"title":title,"artist":artist,"institution":place,
 "source_url":museum_url,"record_status":"OWNER_SELECTED_ALREADY_RELEASED_CLASS_I_2026",
 "owner_selected_artwork":True,"image":image,"image_url_source_only":None,
 "rights_note":old["rights"],"scene_ids":[],"prayer_parts":[],"exact_prayer_cards":[],
 "parent_prayer_candidates":[],"eligible_card_count":0,"historical_destinations":[],
 "attribution_status":"RECORDED_EXACT_PRIOR_RELEASE",
 "calendar_placements":[{"date":date,"occasion":occasion,"calendar_principal":principal,
 "calendar_proper":proper,"old_release_pr":old["historical_release_pr"]}]}
 gallery["records"].append(record)
 provenance["sources"].append({"artwork_id":id,"path":output,"title":title,"artist":artist,
 "image_bytes":len(data),"sha256":sha256(data),"git_blob_sha":blob(data),
 "pixel_dimensions":old["pixels"],"source_master_path":master,
 "source_master_sha256":sha256(data),"source_master_git_blob_sha":blob(data),
 "source_record":"app-data/sacred-art/class-i-gallery-link-20261116.v1.json",
 "source_url":file_url,"museum_url":museum_url,"source_rights_note":old["rights"],
 "prior_date":date,"old_release_pr":old["historical_release_pr"],
 "release_scope":"GALLERY_ONLY__EXISTING_CALENDAR_SELECTION__NO_PRAYER_DEFAULT",
 "source_original_preserved":True})
 rows.append({"artwork_id":id,"title":title,"artist":artist,"museum_url":museum_url,
 "old_release_pr":old["historical_release_pr"],"calendar_date":date,
 "calendar_occasion":occasion,"calendar_principal":principal,"calendar_proper":proper,
 "old_source_path":old["source_path"],"source_master_path":master,"gallery_path":output,
 "bytes":len(data),"sha256":sha256(data),"git_blob_sha":blob(data),
 "pixels":old["pixels"],"photographer":photographer,"file_source":file_url,
 "rights_caveat":old["rights"],"gallery_only":True})
assert len(rows)==3 and sum(x["bytes"] for x in rows)==11438704
assert old_ids.issubset({x["id"] for x in gallery["records"]})
gallery["counts"].update(total_records=873,selected_artwork_records=740,
 image_available_records=76,distinct_locally_hosted_paintings=73,verified_image_files=73)
gallery["source_references"]["class_i_gallery_link"]="app-data/sacred-art/class-i-gallery-link-20261116.v1.json"
provenance["local_image_count"]=73
provenance["catalogue_record_images_count"]=76
provenance["source_contract"]="Prior 70 photos/870 records unchanged. Three already selected and old-released Class I Calendar photos (Raphael, Tanner, Lanfranco) copied without modifications from preexisting 54-JPEG production source bank, maintaining old photo-rights caveats and date locks. No new prayer defaults."
provenance["pending"]="Other records and photo-rights holds remain. These three old-released photo sources have Commons PD-Art position but jurisdictional caveats (including PAFA copyright EXIF); not globally certified CC0."
save("site/gallery/catalogue.v1.json",gallery)
save("site/gallery/image-provenance.v1.json",provenance)
save("app-data/sacred-art/class-i-gallery-link-20261116.v1.json",{
 "schema":"ao.sacred-art.class-i-exact-gallery-link.v1","date":"2026-11-16",
 "source_manifest":"app-data/sacred-art/class-i-source-recovery-20261116.v1.json",
 "scope":"Three already selected and released Class I Calendar paintings only; not newly curated or prayer assigned.",
 "sources":rows,"summary":{"originals":3,"bytes":11438704,"prior_records_preserved":870,
 "new_released_work_records":3,"source_masters_reused":3,
 "external_acquisitions":0,"new_prayer_defaults":0,"hash_mismatches":0}})
def replace(path,a,b):
 p=P(path);s=p.read_text();assert a in s,(path,a)
 p.write_text(s.replace(a,b))
replace("site/gallery/gallery.js","data.records?.length !== 870","data.records?.length !== 873")
replace("site/gallery/gallery.js",
 '    if (item.image?.scene_use_note) inside.append(detailMeta("Scene context:",item.image.scene_use_note));',
 '    if (item.image?.scene_use_note) inside.append(detailMeta("Scene context:",item.image.scene_use_note));\n    if (item.image?.source_note) inside.append(detailMeta("Photo reuse caveat:",item.image.source_note));\n    if (item.calendar_placements?.length) inside.append(detailMeta("Approved 2026 Calendar date:",item.calendar_placements.map(x=>x.date+" · "+x.occasion).join("; ")));')
for path in ("tests/sacred-art-gallery.mjs","tests/sacred-art-san-polo.mjs","tests/sacred-art-devotional-recovery.mjs","tests/sacred-art-class-i-sources.mjs"):
 p=P(path);s=p.read_text()
 changes=[
 ("gallery.records.length, 870","gallery.records.length, 873"),
 ("gallery.records.length,870","gallery.records.length,873"),
 ("gallery.counts.total_records, 870","gallery.counts.total_records, 873"),
 ("gallery.counts.total_records,870","gallery.counts.total_records,873"),
 ("gallery.counts.distinct_locally_hosted_paintings, 70","gallery.counts.distinct_locally_hosted_paintings, 73"),
 ("gallery.counts.distinct_locally_hosted_paintings,70","gallery.counts.distinct_locally_hosted_paintings,73"),
 ("gallery.counts.image_available_records, 73","gallery.counts.image_available_records, 76"),
 ("gallery.counts.image_available_records,73","gallery.counts.image_available_records,76"),
 ("gallery.counts.verified_image_files, 70","gallery.counts.verified_image_files, 73"),
 ("gallery.counts.verified_image_files,70","gallery.counts.verified_image_files,73"),
 ("gallery.records.filter(x => x.image !== null).length, 73","gallery.records.filter(x => x.image !== null).length, 76"),
 ("images.sources.length,70","images.sources.length,73"),
 ("provenance.sources.length,70","provenance.sources.length,73"),
 ("srcFiles.size,70","srcFiles.size,73"),
 ("catalogue.records.length, 870","catalogue.records.length, 873"),
 ("catalogue.records.filter(x=>!x.id.startsWith('RELEASED::san-polo-oils:')).length, 862",
 "catalogue.records.filter(x=>!x.id.startsWith('RELEASED::san-polo-oils:')&&!x.id.startsWith('RELEASED::class-i-2026:')).length, 862"),
 ("gallery.records.filter(x=>!x.id.startsWith('RELEASED::san-polo-oils:')).map(x => x.id)",
 "gallery.records.filter(x=>!x.id.startsWith('RELEASED::san-polo-oils:')&&!x.id.startsWith('RELEASED::class-i-2026:')).map(x => x.id)"),
 ("new Set(gallery.records.map(x => x.id)).size, 870",
  "new Set(gallery.records.map(x => x.id)).size, 873"),
 ("new Set(gallery.records.map(x=>x.id)).size,870",
  "new Set(gallery.records.map(x=>x.id)).size,873"),
 ("870 records, 70 paintings on display, 73 image-bearing rows",
  "873 records, 73 paintings on display, 76 image-bearing rows")]
 for a,b in changes:s=s.replace(a,b)
 p.write_text(s)
with P("site/gallery/README.md").open("a") as f:
 f.write("\n### Three old-released Class I Calendar originals - 16 Nov 2026\n\n")
 f.write("Displayed the already acquired and previously released old Home Calendar image originals for 2026: Raphael Transfiguration (Lent II, 1 March), Lanfranco Miracle of the Loaves and Fishes (Laetare, 15 March), and Tanner Nicodemus (Pentecost Monday, 25 May). Three exact JPEGs (11,438,704 bytes) were copied only from the existing production source-master bank, with original SHA256 and Git blob verified. Raphael is a historical art-book scan, Lanfranco a low-resolution non-museum original, and Tanner's source carries PAFA Barbara Katus institutional photographic-rights caveats. Dates are historical 2026 selections only; no new Calendar assignments or prayer defaults. Gallery now has 873 records and 73 distinct paintings. See app-data/sacred-art/class-i-gallery-link-20261116.v1.json for source evidence.\n")
with P("app-data/sacred-art/README.md").open("a") as f:
 f.write("\nThree previously released 2026 Class I original JPEGs already preserved in source-masters were linked to the gallery without new image acquisition, painting selection or prayer defaults; see class-i-gallery-link-20261116.v1.json. Exact original source bank remains 54 JPEGs; gallery now displays 73 distinct paintings across 873 records. Photo-rights caveats preserved.\n")
print(json.dumps({"records":len(gallery["records"]),"gallery_images":len(provenance["sources"]),"new_bytes":sum(z["bytes"] for z in rows)}))
