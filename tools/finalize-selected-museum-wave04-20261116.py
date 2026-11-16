#!/usr/bin/env python3
"""Maintain original gallery regression contracts after the exact 90-record wave04."""
import json,pathlib
P=pathlib.Path
w=json.loads(P("app-data/sacred-art/selected-museum-image-wave04-20261116.v1.json").read_text())
n=w["summary"]["new_gallery_paintings"]
assert 4<=n<=90,(n,w["summary"])
assert w["summary"]["reviewed_owner_selected_records"]==90
assert n+w["summary"]["held_count"]==90
a,b=392+n,395+n
for filename in ("tests/sacred-art-gallery.mjs","tests/sacred-art-san-polo.mjs",
 "tests/sacred-art-devotional-recovery.mjs","tests/sacred-art-class-i-gallery.mjs"):
 p=P(filename);s=p.read_text()
 pairs=[
 ("gallery.counts.distinct_locally_hosted_paintings, 392",f"gallery.counts.distinct_locally_hosted_paintings, {a}"),
 ("gallery.counts.distinct_locally_hosted_paintings,392",f"gallery.counts.distinct_locally_hosted_paintings,{a}"),
 ("catalogue.counts.distinct_locally_hosted_paintings,392",f"catalogue.counts.distinct_locally_hosted_paintings,{a}"),
 ("gallery.counts.image_available_records, 395",f"gallery.counts.image_available_records, {b}"),
 ("gallery.counts.image_available_records,395",f"gallery.counts.image_available_records,{b}"),
 ("catalogue.counts.image_available_records,395",f"catalogue.counts.image_available_records,{b}"),
 ("gallery.records.filter(x => x.image !== null).length, 395",f"gallery.records.filter(x => x.image !== null).length, {b}"),
 ("gallery.counts.verified_image_files, 392",f"gallery.counts.verified_image_files, {a}"),
 ("gallery.counts.verified_image_files,392",f"gallery.counts.verified_image_files,{a}"),
 ("catalogue.counts.verified_image_files,392",f"catalogue.counts.verified_image_files,{a}"),
 ("images.sources.length,392",f"images.sources.length,{a}"),
 ("provenance.sources.length,392",f"provenance.sources.length,{a}"),
 ("srcFiles.size,392",f"srcFiles.size,{a}"),
 ("873 records, 392 paintings on display, 395 image-bearing rows",f"873 records, {a} paintings on display, {b} image-bearing rows"),
 ("873 catalogued works, 392 images",f"873 catalogued works, {a} images")
 ]
 for old,new in pairs:s=s.replace(old,new)
 p.write_text(s)
# Each prior batch test pins its OWN physical images and prior hold decisions,
# but image-count assertions must include this new batch.
p=P("tests/sacred-art-bulk-commons.mjs")
s=p.read_text()
anchor="const n03=wave03.summary.recovered_images;"
assert anchor in s
s=s.replace(anchor,anchor+"\nconst wave04=read('app-data/sacred-art/selected-museum-image-wave04-20261116.v1.json');\nconst n04=wave04.summary.new_gallery_paintings;")
for old,new in [
 ("distinct_locally_hosted_paintings,73+n+n02+n03","distinct_locally_hosted_paintings,73+n+n02+n03+n04"),
 ("image_available_records,76+n+n02+n03","image_available_records,76+n+n02+n03+n04"),
 ("verified_image_files,73+n+n02+n03","verified_image_files,73+n+n02+n03+n04"),
 ("sources.length,73+n+n02+n03","sources.length,73+n+n02+n03+n04"),
 ("local_image_count,73+n+n02+n03","local_image_count,73+n+n02+n03+n04"),
 ("catalogue_record_images_count,76+n+n02+n03","catalogue_record_images_count,76+n+n02+n03+n04")]:
 assert old in s,old
 s=s.replace(old,new)
p.write_text(s)
p=P("tests/sacred-art-bulk-commons-batch02.mjs")
s=p.read_text()
anchor="const n03=wave03.summary.recovered_images;"
assert anchor in s
s=s.replace(anchor,anchor+"\nconst wave04=load('app-data/sacred-art/selected-museum-image-wave04-20261116.v1.json');\nconst n04=wave04.summary.new_gallery_paintings;")
for old,new in [
 ("distinct_locally_hosted_paintings,234+n+n03","distinct_locally_hosted_paintings,234+n+n03+n04"),
 ("image_available_records,237+n+n03","image_available_records,237+n+n03+n04"),
 ("verified_image_files,234+n+n03","verified_image_files,234+n+n03+n04"),
 ("sources.length,234+n+n03","sources.length,234+n+n03+n04"),
 ("local_image_count,234+n+n03","local_image_count,234+n+n03+n04"),
 ("catalogue_record_images_count,237+n+n03","catalogue_record_images_count,237+n+n03+n04")]:
 assert old in s,old
 s=s.replace(old,new)
p.write_text(s)
p=P("tests/sacred-art-commons-wave03.mjs")
s=p.read_text()
anchor="const prior=json('app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json');"
assert anchor in s
s=s.replace(anchor,anchor+"\nconst wave04=json('app-data/sacred-art/selected-museum-image-wave04-20261116.v1.json');\nconst n04=wave04.summary.new_gallery_paintings;")
for old,new in [
 ("distinct_locally_hosted_paintings,343+n","distinct_locally_hosted_paintings,343+n+n04"),
 ("image_available_records,346+n","image_available_records,346+n+n04"),
 ("verified_image_files,343+n","verified_image_files,343+n+n04"),
 ("sources.length,343+n","sources.length,343+n+n04"),
 ("local_image_count,343+n","local_image_count,343+n+n04"),
 ("catalogue_record_images_count,346+n","catalogue_record_images_count,346+n+n04")]:
 assert old in s,old
 s=s.replace(old,new)
p.write_text(s)
with P("site/gallery/README.md").open("a",encoding="utf8") as f:
 f.write("\n### Wave04: exact-source acquisition of previously selected museum and Commons paintings (16 Nov 2026)\n\n")
 f.write(f"Reconciled **90** previously owner-selected, image-missing objects outside the November RECENT575 source group against museum object APIs / exact owner-selected Commons File pages, prior exclusion lists and image-specific licence/quality evidence. **{n} more distinct full-composition paintings** were permanently stored as WebP images, giving **{a} displayed paintings** and **{b} image-bearing catalogue records**. ")
 f.write(f"The other **{90-n} works** remain in individually reason-coded source/photo-review holds rather than being automatically approved. ")
 f.write("Exact source-file page, museum object URL, source image fingerprint, derived image SHA-256/Git blob, real pixel dimensions and photo rights evidence are in app-data/sacred-art/selected-museum-image-wave04-20261116.v1.json. Original full-resolution JPEGs have not been archived here, only WebP display images. All previous 392 paintings and 873 catalogue identities/owner decisions are unchanged. Never replace withheld sources with an arbitrary same-titled artwork, never infer photographer rights from an object's age, and never reproduce old Prado/auction/quality-held photographs on rights speculation.\n")
with P("app-data/sacred-art/README.md").open("a",encoding="utf8") as f:
 f.write(f"\n### Additional owner-selected museum original source gallery batch wave04\n\nExact owner-selected source-file and institutional collection verification produced {n} more local WebP display paintings out of a 90-object candidate registry. Now {a} painting images over {b} catalogue rows; 873 historic records remain unchanged. {90-n} existing owner-selected records carry explicit hold reasons. Original source-master JPEG count remains 54; this is a display-derivative migration, not source-JPEG preservation. See selected-museum-image-wave04-20261116.v1.json.\n")
print(json.dumps({"wave04_new_paintings":n,"live_paintings":a,"image_bearing_rows":b,"held":90-n,
                  "bytes":w["summary"]["new_derivative_bytes"]}))
