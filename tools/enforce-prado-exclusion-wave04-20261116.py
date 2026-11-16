#!/usr/bin/env python3
"""Keep selected Prado painting identity but exclude its photo from public gallery."""
import json,pathlib
ROOT=pathlib.Path(".")
def read(p):return json.loads((ROOT/p).read_text(encoding="utf8"))
def write(p,x):(ROOT/p).write_text(json.dumps(x,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
manifest="app-data/sacred-art/selected-museum-image-wave04-20261116.v1.json"
gallery_path="site/gallery/catalogue.v1.json"
prov_path="site/gallery/image-provenance.v1.json"
m=read(manifest);g=read(gallery_path);p=read(prov_path)
id="CANONICAL::ART-iandomenico-iepolo-escent-from-the-ross-rado-assion-series"
a=next(x for x in m["artworks"] if x["artwork_id"]==id)
assert a["derivative_bytes"]==756272
assert len(m["artworks"])==38 and len(m["held"])==52
assert m["summary"]["new_gallery_paintings"]==38
assert g["counts"]["distinct_locally_hosted_paintings"]==430
assert p["local_image_count"]==430
assert g["counts"]["image_available_records"]==433
assert len(p["sources"])==430
assert len(g["records"])==873
r=next(x for x in g["records"] if x["id"]==id)
assert r["owner_selected_artwork"] and r["image"]
assert "prado" in (id+" "+r["title"]).casefold()
assert r["image"]["src"]=="./"+a["derivative_path"].removeprefix("site/")
photofile=ROOT/a["derivative_path"]
assert photofile.exists()
assert photofile.stat().st_size==756272
photofile.unlink()
r["image"]=None
p["sources"]=[x for x in p["sources"] if x["artwork_id"]!=id]
assert len(p["sources"])==429
p["local_image_count"]-=1
p["catalogue_record_images_count"]-=1
p["source_contract"]=p["source_contract"].replace("Wave04: 38 additional owner-selected","Wave04: 37 additional owner-selected")
g["counts"]["distinct_locally_hosted_paintings"]-=1
g["counts"]["image_available_records"]-=1
g["counts"]["verified_image_files"]-=1
m["artworks"]=[x for x in m["artworks"] if x["artwork_id"]!=id]
m["decisions"]=[dict(x,decision="HOLD",reason="USER_PRADO_SOURCE_EXCLUSION",detail="Explicit museum-source exclusion; artwork selection retained but photo withdrawn") if x["artwork_id"]==id else x for x in m["decisions"]]
m["held"].append({"artwork_id":id,"title":r["title"],"source_url":r["source_url"],
                 "decision":"HOLD","reason":"USER_PRADO_SOURCE_EXCLUSION",
                 "detail":"Explicit museum-source exclusion; artwork selection retained but photo withdrawn"})
m["summary"]["new_gallery_paintings"]=37
m["summary"]["new_derivative_bytes"]-=756272
m["summary"]["held_count"]=53
m["summary"]["gallery_total_images"]=429
m["summary"]["gallery_image_bearing_records"]=432
m["summary"]["hold_reasons"]["USER_PRADO_SOURCE_EXCLUSION"]=1
assert len(m["artworks"])==37 and len(m["held"])==53
assert len(m["decisions"])==90
write(manifest,m);write(gallery_path,g);write(prov_path,p)
for name in ("tests/sacred-art-gallery.mjs","tests/sacred-art-san-polo.mjs",
 "tests/sacred-art-devotional-recovery.mjs","tests/sacred-art-class-i-gallery.mjs"):
 path=ROOT/name;s=path.read_text(encoding="utf8")
 for old,new in [("paintings on display, 433 image-bearing", "paintings on display, 432 image-bearing"),
                 ("430 paintings on display","429 paintings on display"),
                 ("873 catalogued works, 430 images","873 catalogued works, 429 images")]:
  s=s.replace(old,new)
 s=s.replace("paintings, 430","paintings, 429")
 for old,new in [("distingu_locally_hosted_paintings, 430","distingu_locally_hosted_paintings, 429"),
                 ("distinct_locally_hosted_paintings, 430","distinct_locally_hosted_paintings, 429"),
                 ("distinct_locally_hosted_paintings,430","distinct_locally_hosted_paintings,429"),
                 ("image_available_records, 433","image_available_records, 432"),
                 ("image_available_records,433","image_available_records,432"),
                 ("verified_image_files, 430","verified_image_files, 429"),
                 ("verified_image_files,430","verified_image_files,429"),
                 ("sources.length,430","sources.length,429"),
                 ("srcFiles.size,430","srcFiles.size,429"),
                 ("gallery.records.filter(x => x.image !== null).length, 433",
                  "gallery.records.filter(x => x.image !== null).length, 432")]:
  s=s.replace(old,new)
 path.write_text(s,encoding="utf8")
for name in ("site/gallery/README.md","app-data/sacred-art/README.md"):
 path=ROOT/name;s=path.read_text(encoding="utf8")
 for old,new in [("**38 more distinct full-composition paintings**","**37 more distinct full-composition paintings**"),
                 ("**430 displayed paintings**","**429 displayed paintings**"),
                 ("**433 image-bearing catalogue records**","**432 image-bearing catalogue records**"),
                 ("**52 works**","**53 works**"),
                 ("produced 38 more local WebP","produced 37 more local WebP"),
                 ("Now 430 painting images over 433 catalogue rows","Now 429 painting images over 432 catalogue rows"),
                 ("52 existing owner-selected records carry explicit hold reasons","53 existing owner-selected records carry explicit hold reasons")]:
  s=s.replace(old,new)
 path.write_text(s,encoding="utf8")
test=ROOT/"tests/sacred-art-selected-museum-wave04.mjs"
s=test.read_text(encoding="utf8")
a="assert.equal(report.artworks.length,n);"
assert a in s
s=s.replace(a,a+"\nassert(!report.artworks.some(a=>/prado/i.test(a.artwork_id+' '+a.title+' '+a.artwork_source_url)),'Prado-linked image must stay unpublished');")
test.write_text(s,encoding="utf8")
print(json.dumps({"excluded_id":id,"removed_photo_bytes":756272,
 "new_gallery_count":429,"new_image_bearing_records":432,
 "wave04_images":37,"wave04_holds":53,"manifest_exact_bytes":m["summary"]["new_derivative_bytes"]}))
