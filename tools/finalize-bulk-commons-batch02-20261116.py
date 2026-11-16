#!/usr/bin/env python3
"""Pin all gallery regression totals to the verified second bulk import result."""
import json,pathlib
P=pathlib.Path
m=json.loads(P("app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json").read_text())
n=m["summary"]["new_gallery_images"]
assert 40<=n<=180,(n,m["summary"])
assert m["summary"]["owner_selected_candidate_records"]==330
assert m["summary"]["held_or_deferred_rows"]+n==330
assert m["summary"]["original_rejections_protected"]==103
a,b=234+n,237+n
for path in ["tests/sacred-art-gallery.mjs","tests/sacred-art-san-polo.mjs",
             "tests/sacred-art-devotional-recovery.mjs","tests/sacred-art-class-i-gallery.mjs"]:
 p=P(path)
 s=p.read_text()
 replace_pairs=[
 ("gallery.counts.distinct_locally_hosted_paintings, 234",f"gallery.counts.distinct_locally_hosted_paintings, {a}"),
 ("gallery.counts.distinct_locally_hosted_paintings,234",f"gallery.counts.distinct_locally_hosted_paintings,{a}"),
 ("catalogue.counts.distinct_locally_hosted_paintings,234",f"catalogue.counts.distinct_locally_hosted_paintings,{a}"),
 ("gallery.counts.image_available_records, 237",f"gallery.counts.image_available_records, {b}"),
 ("gallery.counts.image_available_records,237",f"gallery.counts.image_available_records,{b}"),
 ("catalogue.counts.image_available_records,237",f"catalogue.counts.image_available_records,{b}"),
 ("gallery.records.filter(x => x.image !== null).length, 237",f"gallery.records.filter(x => x.image !== null).length, {b}"),
 ("gallery.counts.verified_image_files, 234",f"gallery.counts.verified_image_files, {a}"),
 ("gallery.counts.verified_image_files,234",f"gallery.counts.verified_image_files,{a}"),
 ("catalogue.counts.verified_image_files,234",f"catalogue.counts.verified_image_files,{a}"),
 ("images.sources.length,234",f"images.sources.length,{a}"),
 ("provenance.sources.length,234",f"provenance.sources.length,{a}"),
 ("srcFiles.size,234",f"srcFiles.size,{a}"),
 ("873 records, 234 paintings on display, 237 image-bearing rows",f"873 records, {a} paintings on display, {b} image-bearing rows"),
 ("873 catalogued works, 234 images",f"873 catalogued works, {a} images")
 ]
 for old,new in replace_pairs:
  s=s.replace(old,new)
 p.write_text(s)
# The first batch's provenance regression must check its original 161 images,
# but final gallery counts include the second batch as well.
p=P("tests/sacred-art-bulk-commons.mjs")
s=p.read_text()
anchor="const manifest=read('app-data/sacred-art/bulk-commons-photo-import-20261116.v1.json');"
assert anchor in s
s=s.replace(anchor,anchor+"\nconst batch02=read('app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json');\nconst n02=batch02.summary.new_gallery_images;")
for old,new in [
 ("distinct_locally_hosted_paintings,73+n","distinct_locally_hosted_paintings,73+n+n02"),
 ("image_available_records,76+n","image_available_records,76+n+n02"),
 ("verified_image_files,73+n","verified_image_files,73+n+n02"),
 ("sources.length,73+n","sources.length,73+n+n02"),
 ("local_image_count,73+n","local_image_count,73+n+n02"),
 ("catalogue_record_images_count,76+n","catalogue_record_images_count,76+n+n02")
]:
 assert old in s,old
 s=s.replace(old,new)
p.write_text(s)
with P("site/gallery/README.md").open("a",encoding="utf8") as f:
 f.write("\n### Second broad follow-on transfer: previous 330 missing owner selections - 16 Nov 2026\n\n")
 f.write(f"Reconciled **all 330** remaining 3 November 2026 owner-approved records and released **{n} further full-composition local Commons WebP derivatives** in a single second bulk pass; the gallery now displays **{a} distinct painting images** across **{b} image-bearing records** out of 873 curated artwork identities. Prior backlog included 109 metadata/license/size-qualified image files that were deferred by last batch's download cap, 71 previously unqueried, 19 download failures and 131 source-quality/rights holds. All 103 historical rejected originals remain excluded; initial holds remain separately explained. The exact photo metadata and rights basis (not universal clearance) are preserved in app-data/sacred-art/bulk-commons-photo-import-batch02-20261116.v1.json. Images are locally archived WebP derivatives, not full original JPEGs. No old image, original source-master JPEG, user artwork selection, prayer-card default or Calendar assignment was rewritten.\n")
with P("app-data/sacred-art/README.md").open("a",encoding="utf8") as f:
 f.write("\n### Owner-approved Commons bulk image batch 02 (16 Nov 2026)\n\n")
 f.write(f"Second batch recovered {n} further locally cached, full-composition gallery WebPs for owner-approved original File pages, for {a} total displayed paintings and {b} image-bearing catalogue records. Every previous image, 873 historical artwork records, 103 globally rejected original identifiers, prayer-card links and permanent 54-source-JPEG bank remain intact. The original Commons JPEG bytes are not archived in these batches; the durable original-source metadata and reproduction-specific licence position are in bulk-commons-photo-import-batch02-20261116.v1.json. {m['summary']['held_or_deferred_rows']} records remain held for documented reasons; these are not automatically approved by the second pass.\n")
print(json.dumps({"batch02_added":n,"gallery_photos":a,"records_with_images":b,"unresolved":m["summary"]["held_or_deferred_rows"],"bytes":m["summary"]["new_bytes"]}))
