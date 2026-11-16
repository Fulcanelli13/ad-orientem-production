#!/usr/bin/env python3
"""Adapt gallery integrity regressions to source-verified polite Commons retry output."""
import json,pathlib
P=pathlib.Path
w=json.loads(P("app-data/sacred-art/commons-rate-limit-recovery-wave03-20261116.v1.json").read_text())
audit=json.loads(P("app-data/sacred-art/bulk-museum-image-queue-20261116.v1.json").read_text())
n=w["summary"]["recovered_images"]
assert 0<=n<=49
assert audit["counts"]["image_missing_all"]==527
pimgs=343+n;prec=346+n
files=["tests/sacred-art-gallery.mjs","tests/sacred-art-san-polo.mjs",
       "tests/sacred-art-devotional-recovery.mjs","tests/sacred-art-class-i-gallery.mjs"]
for name in files:
 file=P(name)
 s=file.read_text()
 subs=[
  ("gallery.counts.distinct_locally_hosted_paintings, 343",f"gallery.counts.distinct_locally_hosted_paintings, {pimgs}"),
  ("gallery.counts.distinct_locally_hosted_paintings,343",f"gallery.counts.distinct_locally_hosted_paintings,{pimgs}"),
  ("catalogue.counts.distinct_locally_hosted_paintings,343",f"catalogue.counts.distinct_locally_hosted_paintings,{pimgs}"),
  ("gallery.counts.image_available_records, 346",f"gallery.counts.image_available_records, {prec}"),
  ("gallery.counts.image_available_records,346",f"gallery.counts.image_available_records,{prec}"),
  ("catalogue.counts.image_available_records,346",f"catalogue.counts.image_available_records,{prec}"),
  ("gallery.records.filter(x => x.image !== null).length, 346",f"gallery.records.filter(x => x.image !== null).length, {prec}"),
  ("gallery.counts.verified_image_files, 343",f"gallery.counts.verified_image_files, {pimgs}"),
  ("gallery.counts.verified_image_files,343",f"gallery.counts.verified_image_files,{pimgs}"),
  ("catalogue.counts.verified_image_files,343",f"catalogue.counts.verified_image_files,{pimgs}"),
  ("images.sources.length,343",f"images.sources.length,{pimgs}"),
  ("provenance.sources.length,343",f"provenance.sources.length,{pimgs}"),
  ("srcFiles.size,343",f"srcFiles.size,{pimgs}"),
  ("873 records, 343 paintings on display, 346 image-bearing rows",f"873 records, {pimgs} paintings on display, {prec} image-bearing rows"),
  ("873 catalogued works, 343 images",f"873 catalogued works, {pimgs} images")
 ]
 for old,new in subs:s=s.replace(old,new)
 file.write_text(s)
# Pinned first/second manifest tests must preserve their own 161/109 file count
# while validating against latest aggregate of gallery images.
file=P("tests/sacred-art-bulk-commons.mjs")
s=file.read_text()
old="const n02=batch02.summary.new_gallery_images;"
assert old in s
s=s.replace(old,old+"\nconst wave03=read('app-data/sacred-art/commons-rate-limit-recovery-wave03-20261116.v1.json');\nconst n03=wave03.summary.recovered_images;")
for old,new in [
 ("distingu_locally_hosted_paintings,73+n+n02","distingu_locally_hosted_paintings,73+n+n02+n03"),
 ("distinct_locally_hosted_paintings,73+n+n02","distinct_locally_hosted_paintings,73+n+n02+n03"),
 ("image_available_records,76+n+n02","image_available_records,76+n+n02+n03"),
 ("verified_image_files,73+n+n02","verified_image_files,73+n+n02+n03"),
 ("sources.length,73+n+n02","sources.length,73+n+n02+n03"),
 ("local_image_count,73+n+n02","local_image_count,73+n+n02+n03"),
 ("catalogue_record_images_count,76+n+n02","catalogue_record_images_count,76+n+n02+n03")]:
 s=s.replace(old,new)
file.write_text(s)
file=P("tests/sacred-art-bulk-commons-batch02.mjs")
s=file.read_text()
old="const n=current.summary.new_gallery_images;"
assert old in s
s=s.replace(old,old+"\nconst wave03=load('app-data/sacred-art/commons-rate-limit-recovery-wave03-20261116.v1.json');\nconst n03=wave03.summary.recovered_images;")
for old,new in [
 ("distinct_locally_hosted_paintings,234+n","distinct_locally_hosted_paintings,234+n+n03"),
 ("image_available_records,237+n","image_available_records,237+n+n03"),
 ("verified_image_files,234+n","verified_image_files,234+n+n03"),
 ("sources.length,234+n","sources.length,234+n+n03"),
 ("local_image_count,234+n","local_image_count,234+n+n03"),
 ("catalogue_record_images_count,237+n","catalogue_record_images_count,237+n+n03")]:
 assert old in s,old
 s=s.replace(old,new)
file.write_text(s)
with P("site/gallery/README.md").open("a",encoding="utf-8") as f:
 f.write("\n### Commons 429 recovery and complete other-selected artwork image-source inventory - 16 Nov 2026\n\n")
 f.write(f"Revisited the 49 exact approved Commons source files previously throttled during bulk image acquisition (two known inadequate final-preview sizes remain on hold). Respectful 2.3-second sequential source requests produced **{n} further full-frame local gallery WebPs**, for **{pimgs} paintings** and **{prec} image-bearing records**. The importer halts image requests if Commons returns another HTTP 429 rather than rotating hosts or request identities. The remaining {w['summary']['held_after_retry']} entries are explicitly reason-coded. Previously stored image source references and 103 globally rejected original identities are unchanged. The original full-size Commons JPEGs are not added in this step. See app-data/sacred-art/commons-rate-limit-recovery-wave03-20261116.v1.json.\n\n")
 f.write(f"A parallel complete inventory found **{audit['counts']['image_missing_other_selected']}** *other* owner-selected artwork catalogue entries missing imagery, outside the November Commons 575-name pool; each is classified by source URL/rights status in app-data/sacred-art/bulk-museum-image-queue-20261116.v1.json. No institutionally uncertified photo was silently cleared and no new artwork/card assignment was made.\n")
with P("app-data/sacred-art/README.md").open("a",encoding="utf-8") as f:
 f.write("\n### Post-bulk preservation and museum source inventory, wave 03\n\n")
 f.write(f"Revalidated 49 prior rate-limited source-file candidates with conservative sequential Commons access, preserving exactly {n} additional full-frame WebPs. Current live gallery should contain {pimgs} painting photos across {prec} catalogue entries. A complete separate evidence-only inventory of {audit['counts']['image_missing_other_selected']} owner-selected non-November Commons records is stored in bulk-museum-image-queue-20261116.v1.json; do not equate curation approval with photography reuse clearance or count it as a gallery image import. Original JPEG bank remains at 54 and all prayer relationships remain unchanged.\n")
print(json.dumps({"wave03_recovered":n,"gallery_total":pimgs,"image_records":prec,"museum_candidates":audit["counts"]["image_missing_other_selected"]}))
