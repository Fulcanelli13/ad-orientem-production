#!/usr/bin/env python3
"""Preserve historical image and prayer regressions after exact source QA wave06."""
import json,pathlib,re
P=pathlib.Path
r=json.loads(P("app-data/sacred-art/quality-recovery-wave06-20261116.v1.json").read_text())
s=r["summary"]
n=s["new_gallery_paintings"]
assert 0<=n<=182,(n,s)
assert s["candidate_quality_hold_records"]==182
assert s["held_for_better_photo"]==182-n
a,b=467+n,470+n
for name in ("tests/sacred-art-gallery.mjs","tests/sacred-art-san-polo.mjs",
 "tests/sacred-art-devotional-recovery.mjs","tests/sacred-art-class-i-gallery.mjs"):
 p=P(name);src=p.read_text()
 pairs=[
 ("gallery.counts.distinct_locally_hosted_paintings, 467",f"gallery.counts.distinct_locally_hosted_paintings, {a}"),
 ("gallery.counts.distinct_locally_hosted_paintings,467",f"gallery.counts.distinct_locally_hosted_paintings,{a}"),
 ("catalogue.counts.distinct_locally_hosted_paintings,467",f"catalogue.counts.distinct_locally_hosted_paintings,{a}"),
 ("gallery.counts.image_available_records, 470",f"gallery.counts.image_available_records, {b}"),
 ("gallery.counts.image_available_records,470",f"gallery.counts.image_available_records,{b}"),
 ("catalogue.counts.image_available_records,470",f"catalogue.counts.image_available_records,{b}"),
 ("gallery.records.filter(x => x.image !== null).length, 470",f"gallery.records.filter(x => x.image !== null).length, {b}"),
 ("gallery.counts.verified_image_files, 467",f"gallery.counts.verified_image_files, {a}"),
 ("gallery.counts.verified_image_files,467",f"gallery.counts.verified_image_files,{a}"),
 ("catalogue.counts.verified_image_files,467",f"catalogue.counts.verified_image_files,{a}"),
 ("images.sources.length,467",f"images.sources.length,{a}"),
 ("provenance.sources.length,467",f"provenance.sources.length,{a}"),
 ("srcFiles.size,467",f"srcFiles.size,{a}"),
 ("873 records, 467 paintings on display, 470 image-bearing rows",f"873 records, {a} paintings on display, {b} image-bearing rows"),
 ("873 catalogued works, 467 images",f"873 catalogued works, {a} images")
 ]
 for old,new in pairs:src=src.replace(old,new)
 p.write_text(src)
# Previous cumulative tests must include n06 but keep exact old batch hashes and states.
for filename in ("tests/sacred-art-bulk-commons.mjs","tests/sacred-art-bulk-commons-batch02.mjs",
  "tests/sacred-art-commons-wave03.mjs","tests/sacred-art-selected-museum-wave04.mjs",
  "tests/sacred-art-curated-wave05.mjs"):
 p=P(filename);src=p.read_text()
 if filename.endswith("sacred-art-curated-wave05.mjs"):anchor="const n=m.summary.new_gallery_images;"
 else:
  anchors=["const n05=wave05.summary.new_gallery_images;"]
  anchor=next((a for a in anchors if a in src),None)
 assert anchor and anchor in src,filename
 reader="load" if filename.endswith("sacred-art-bulk-commons-batch02.mjs") else "json" if filename.endswith("sacred-art-commons-wave03.mjs") else "read"
 src=src.replace(anchor,anchor+"\nconst quality06="+reader+"('app-data/sacred-art/quality-recovery-wave06-20261116.v1.json');\nconst n06=quality06.summary.new_gallery_paintings;")
 for prefix in ("distinct_locally_hosted_paintings","image_available_records","verified_image_files","sources.length","local_image_count","catalogue_record_images_count"):
  pattern=r"("+re.escape(prefix)+r",\s*\d+\+n(?:\+n02)?(?:\+n03)?(?:\+n04)?(?:\+n05)?)(\))"
  src=re.sub(pattern,lambda mt:mt.group(1)+"+n06"+mt.group(2),src)
 p.write_text(src)
with P("site/gallery/README.md").open("a",encoding="utf8") as f:
 f.write("\n### Wave06 full resolution-source quality audit and exact image recovery — 16 November 2026\n\n")
 f.write(f"Reconciled **all 182 unique owner-selected but image-quality-held artworks**, including apparently unmanageable giant photo source files that are actually adequately detailed when reduced, and investigated matching MSK Gent institutional object pages by museum inventory and source artist. **{n} exact-source full-composition 1600px WebPs** were newly archived, taking the gallery to **{a} painting images** and **{b} image-bearing records** across 873 unaltered artworks. ")
 f.write(f"**{182-n}** photo candidates remain unpublished with recorded reasons rather than being upscaled or silently replacing the artwork with a near-title match. Photo rights, CMS source, museum exact object and full-image provenance appear in app-data/sacred-art/quality-recovery-wave06-20261116.v1.json. ")
 f.write("The 54 original JPEG masters are unchanged. No user rejection or prayer/Calendar mapping changed. MSK Gent explicitly permits online reuse of collection pictures at offered resolutions but has separate higher resolution/commercial conditions; do not generalize any one object's photo rights to another source.\n")
with P("app-data/sacred-art/README.md").open("a",encoding="utf8") as f:
 f.write(f"\n### Full source-quality inventory and verified high-resolution recovery wave06\n\n")
 f.write(f"**182** previously held, approved artworks were each re-evaluated from original source rights and quality evidence, not from title matching. Exactly {n} new locally hosted WebP images were admitted; {182-n} remain documented quality, museum image identity, license, or source access holds. Gallery total: {a} physical image files, {b} image-bearing record links, 873 unchanged artwork identities. Neither original source-master bank (54 JPEGs) nor prayer/Calendar assignments changed.\n")
print(json.dumps({"new_photographs":n,"total_gallery":a,"record_images":b,"remaining_quality_holds":182-n,"added_bytes":s["new_image_bytes"]}))
