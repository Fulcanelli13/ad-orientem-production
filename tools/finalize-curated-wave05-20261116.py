#!/usr/bin/env python3
"""Finalize gallery counts, prior batch checks and historical ledger for curated wave05."""
import json,pathlib,re
P=pathlib.Path
m=json.loads(P("app-data/sacred-art/curated-cohort-image-wave05-20261116.v1.json").read_text())
n=m["summary"]["new_gallery_images"]
assert 12<=n<=84,(n,m["summary"])
assert m["summary"]["owner_selected_candidate_records"]==84
assert m["summary"]["held_or_deferred_rows"]+n==84
a,b=429+n,432+n
for name in ("tests/sacred-art-gallery.mjs","tests/sacred-art-san-polo.mjs",
  "tests/sacred-art-devotional-recovery.mjs","tests/sacred-art-class-i-gallery.mjs"):
 p=P(name);s=p.read_text()
 pairs=[
  ("gallery.counts.distinct_locally_hosted_paintings, 429",f"gallery.counts.distinct_locally_hosted_paintings, {a}"),
  ("gallery.counts.distinct_locally_hosted_paintings,429",f"gallery.counts.distinct_locally_hosted_paintings,{a}"),
  ("catalogue.counts.distinct_locally_hosted_paintings,429",f"catalogue.counts.distinct_locally_hosted_paintings,{a}"),
  ("gallery.counts.image_available_records, 432",f"gallery.counts.image_available_records, {b}"),
  ("gallery.counts.image_available_records,432",f"gallery.counts.image_available_records,{b}"),
  ("catalogue.counts.image_available_records,432",f"catalogue.counts.image_available_records,{b}"),
  ("gallery.records.filter(x => x.image !== null).length, 432",f"gallery.records.filter(x => x.image !== null).length, {b}"),
  ("gallery.counts.verified_image_files, 429",f"gallery.counts.verified_image_files, {a}"),
  ("gallery.counts.verified_image_files,429",f"gallery.counts.verified_image_files,{a}"),
  ("catalogue.counts.verified_image_files,429",f"catalogue.counts.verified_image_files,{a}"),
  ("images.sources.length,429",f"images.sources.length,{a}"),
  ("provenance.sources.length,429",f"provenance.sources.length,{a}"),
  ("srcFiles.size,429",f"srcFiles.size,{a}"),
  ("873 records, 429 paintings on display, 432 image-bearing rows",f"873 records, {a} paintings on display, {b} image-bearing rows"),
  ("873 catalogued works, 429 images",f"873 catalogued works, {a} images")
 ]
 for old,new in pairs:s=s.replace(old,new)
 p.write_text(s)
for name in ("tests/sacred-art-bulk-commons.mjs","tests/sacred-art-bulk-commons-batch02.mjs",
             "tests/sacred-art-commons-wave03.mjs","tests/sacred-art-selected-museum-wave04.mjs"):
 p=P(name);s=p.read_text()
 if name.endswith("sacred-art-selected-museum-wave04.mjs"):
  anchor="const n=report.summary.new_gallery_paintings;"
 else:
  anchor="const n04=wave04.summary.new_gallery_paintings;"
 assert anchor in s,(name,anchor)
 var="load" if name.endswith("sacred-art-bulk-commons-batch02.mjs") else "json" if name.endswith("sacred-art-commons-wave03.mjs") else "read"
 patch=anchor+"\nconst wave05="+var+"('app-data/sacred-art/curated-cohort-image-wave05-20261116.v1.json');\nconst n05=wave05.summary.new_gallery_images;"
 s=s.replace(anchor,patch)
 for prefix in ("distinct_locally_hosted_paintings","image_available_records","verified_image_files",
  "sources.length","local_image_count","catalogue_record_images_count"):
  pattern=r"("+re.escape(prefix)+r",\s*\d+\+n(?:\+n02)?(?:\+n03)?(?:\+n04)?)(\))"
  s=re.sub(pattern,lambda q:q.group(1)+"+n05"+q.group(2),s)
 p.write_text(s)
with P("site/gallery/README.md").open("a",encoding="utf8") as f:
 f.write("\n### Previously curated 84 painting-source records, fifth bulk batch — 16 November 2026\n\n")
 f.write("The earlier 491-record Commons batch targeted only the APPROVED_BY_USER_2026_11_03 status. This fifth wave correctly recovered the **84 different, historically owner-approved OWNER_APPROVED_CURATED records** that had been left out solely because of their status name. Every record was assessed against the exact originally selected Commons File page, historical 103 rejected originals, reproduction-specific Commons Public Domain/CC0/copyright metadata, actual pixel dimensions and full-frame image quality. ")
 f.write(f"**{n} full-composition WebP images** ({m['summary']['new_bytes']:,} bytes) were permanently added; **{84-n} records** remain held with individual reasons. ")
 f.write(f"Gallery now has **{a} displayed painting images** and **{b} image-bearing catalogue rows** across the same 873 original artwork IDs. Original photo fingerprints, Commons File/page ID, licence metadata and dimensions are in app-data/sacred-art/curated-cohort-image-wave05-20261116.v1.json; full-resolution source JPEGs were *not* added to the original source-master bank. No new owner selection, prayer assignment, Calendar attribution, original source or old rejection was changed.\n")
with P("app-data/sacred-art/README.md").open("a",encoding="utf8") as f:
 f.write(f"\n### Historical OWNER_APPROVED_CURATED acquisition, wave 05\n\n")
 f.write(f"The 84 previously missed original owner-approved RECENT575 artworks had a different but valid historical curated status from the earlier 491 source batch. All 84 were processed in one exact-file Commons image qualification sweep, {n} permanent local WebPs were added, and {84-n} unsupported image-source cases were held with per-file reasons. Current gallery: {a} paintings, {b} image-bearing catalogue records, original 873 catalogue identities and 54 historical source-master JPEGs unchanged. New display WebPs are not original full-resolution photo masters. Details: curated-cohort-image-wave05-20261116.v1.json.\n")
print(json.dumps({"wave05_new":n,"gallery_total":a,"image_bearing":b,"held":84-n,"bytes":m["summary"]["new_bytes"]}))
