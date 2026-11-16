#!/usr/bin/env python3
"""Update collection-level test expectations after the deterministic bulk photo import."""
import json,pathlib
P=pathlib.Path
m=json.loads(P("app-data/sacred-art/bulk-commons-photo-import-20261116.v1.json").read_text())
n=m["summary"]["new_gallery_images"]
assert 25<=n<=180
old_images=73;old_image_records=76;new_images=old_images+n;new_image_records=old_image_records+n
for path in ["tests/sacred-art-gallery.mjs","tests/sacred-art-san-polo.mjs",
             "tests/sacred-art-devotional-recovery.mjs","tests/sacred-art-class-i-gallery.mjs"]:
 p=P(path);text=p.read_text()
 replacements=[
 (f"gallery.counts.distinct_locally_hosted_paintings, {old_images}",f"gallery.counts.distinct_locally_hosted_paintings, {new_images}"),
 (f"gallery.counts.distinct_locally_hosted_paintings,{old_images}",f"gallery.counts.distinct_locally_hosted_paintings,{new_images}"),
 (f"catalogue.counts.distinct_locally_hosted_paintings,{old_images}",f"catalogue.counts.distinct_locally_hosted_paintings,{new_images}"),
 (f"gallery.counts.image_available_records, {old_image_records}",f"gallery.counts.image_available_records, {new_image_records}"),
 (f"gallery.counts.image_available_records,{old_image_records}",f"gallery.counts.image_available_records,{new_image_records}"),
 (f"catalogue.counts.image_available_records,{old_image_records}",f"catalogue.counts.image_available_records,{new_image_records}"),
 (f"gallery.records.filter(x => x.image !== null).length, {old_image_records}",f"gallery.records.filter(x => x.image !== null).length, {new_image_records}"),
 (f"gallery.counts.verified_image_files, {old_images}",f"gallery.counts.verified_image_files, {new_images}"),
 (f"gallery.counts.verified_image_files,{old_images}",f"gallery.counts.verified_image_files,{new_images}"),
 (f"catalogue.counts.verified_image_files,{old_images}",f"catalogue.counts.verified_image_files,{new_images}"),
 (f"images.sources.length,{old_images}",f"images.sources.length,{new_images}"),
 (f"provenance.sources.length,{old_images}",f"provenance.sources.length,{new_images}"),
 (f"srcFiles.size,{old_images}",f"srcFiles.size,{new_images}"),
 (f"873 records, 73 paintings on display, 76 image-bearing rows",f"873 records, {new_images} paintings on display, {new_image_records} image-bearing rows"),
 (f"873 catalogued works, 73 images",f"873 catalogued works, {new_images} images")
 ]
 for a,b in replacements:text=text.replace(a,b)
 p.write_text(text)
pages=P(".github/workflows/pages.yml")
s=pages.read_text()
anchor="          node tests/sacred-art-class-i-gallery.mjs\n"
assert anchor in s
pages.write_text(s.replace(anchor,anchor+"          node tests/sacred-art-bulk-commons.mjs\n"))
with P("site/gallery/README.md").open("a",encoding="utf8") as f:
 f.write("\n### Full bulk source-check of owner-approved Commons paintings - 16 November 2026\n\n")
 f.write(f"Automatically evaluated {m['summary']['owner_selected_candidate_records']} previously selected yet unpublished artwork records against their **exact preselected Wikimedia Commons File page**, protected the 103 historic globally rejected originals, and locally published **{n} full-composition WebP images** (max 1600px). ")
 f.write(f"Gallery now contains **{new_images} distinct locally hosted paintings** and **{new_image_records} image-bearing catalogue records** among 873 immutable artwork records. ")
 f.write("Only source pages explicitly owner-selected in the 3 November artwork decisions were considered. Wikimedia file-specific rights metadata had to declare copyright false and a public-domain/CC0 status. Other licences, insufficient dimensions, image-fetch failures, missing exact source pages and questionable photographic credits were held with explicit reasons; the remaining candidate queue remains available rather than thrown away. All JPEG masters previously recovered remain in the separate source bank. These new Commons-based gallery derivatives are permanently saved in the GitHub gallery as WebP, **not** as full-resolution original JPEGs; source-page rights, original dimensions/sha1, downloaded thumbnail SHA256 and derivative hash are recorded in the machine-readable manifest. Preserved artworks and prayer-card decisions stay unchanged. Source-specific Commons file claims should not be construed as blanket museum rights or universal jurisdiction clearance.\n\n")
 f.write("See app-data/sacred-art/bulk-commons-photo-import-20261116.v1.json and legacy-artwork-rejections-20261116.v1.json.\n")
with P("app-data/sacred-art/README.md").open("a",encoding="utf8") as f:
 f.write("\n### Bulk exact Commons source decisions (Nov 16)\n\n")
 f.write(f"A single batch reconciled {m['summary']['owner_selected_candidate_records']} previously owner-selected 3 November Commons artwork candidates with 103 global historical rejects, image-specific Commons rights metadata and source-quality checks. Exactly {n} local full-image derivatives were admitted to the gallery, {m['summary']['held_or_deferred_rows']} were held or deferred with reasons. Production has {new_images} displayed paintings, {new_image_records} image-bearing records; the original 54 source JPEGs remain intact. This batch did not acquire or retain full source JPEG originals; the resulting WebP derivatives are permanent with source and fingerprint trails. No unrelated prayer placements or calendar selections were modified.\n")
print(json.dumps({"newly_imported":n,"displayed_gallery_total":new_images,"records_with_photo":new_image_records,
                  "all_artwork_records":873,"hold_counts":m["summary"]["hold_reasons"]}))
