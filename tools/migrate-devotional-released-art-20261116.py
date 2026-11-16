#!/usr/bin/env python3
"""Recover already approved devotional sources; no new selection or screen activation."""
import json, hashlib, pathlib, urllib.request, time

old_commit="14cd9d3ac11a6f27856f4740ae7c81e1b073bf1a"
base_url="https://raw.githubusercontent.com/Fulcanelli13/ad-orientem/"+old_commit+"/"
def fetch(path):
  for attempt in range(3):
    try:
      req=urllib.request.Request(base_url+path,headers={"User-Agent":"AO-Exact-Devotional-Recovery"})
      with urllib.request.urlopen(req,timeout=100) as rsp:
        return rsp.read(16000000)
    except Exception:
      if attempt==2: raise
      time.sleep(2*(attempt+1))
def digest(b): return hashlib.sha256(b).hexdigest()
def git_sha(b): return hashlib.sha1(("blob "+str(len(b))+"\0").encode()+b).hexdigest()
def read(p): return json.loads(pathlib.Path(p).read_text())
def save(p,obj):
  q=pathlib.Path(p);q.parent.mkdir(parents=True,exist_ok=True)
  q.write_text(json.dumps(obj,indent=2,ensure_ascii=False)+"\n")
def patch(p,old,new):
  q=pathlib.Path(p);s=q.read_text();assert old in s,(p,old)
  q.write_text(s.replace(old,new))
def assert_image(data,sha256,blob_sha,size,kind):
  assert len(data)==size,(size,len(data))
  assert digest(data)==sha256
  assert git_sha(data)==blob_sha
  if kind=="webp": assert data[:4]==b"RIFF" and data[8:12]==b"WEBP"
  if kind=="jpeg": assert data[:2]==b"\xff\xd8"

gallery=read("site/gallery/catalogue.v1.json")
proofs=read("site/gallery/image-provenance.v1.json")
master=read("app-data/sacred-art/source-master-migration-20261116.v1.json")
old_ids={r["id"] for r in gallery["records"]}
assert len(old_ids)==870
assert gallery["counts"]["distinct_locally_hosted_paintings"]==68
assert gallery["counts"]["image_available_records"]==71
assert len(proofs["sources"])==68
source=json.loads(fetch("assets/prayer/user-approved/source-provenance.v1.json"))
assert source["schema"]=="AO_20261031_DIRECT_USER_PRESCRIBED_PD_IMAGE_ASSETS_V1"
assert len(source["images"])==2 and source["originalSourceImagesSaved"] is False
transfer=[]

# Painting 1: the existing owner-approved Mystic Lamb work, exact original released WebP.
entry=source["images"][0]
assert entry["slot"]=="STG-pray.benediction-03" and entry["userApproval"]=="APPROVED_THEMATIC_SCENE"
old_path="assets/prayer/user-approved/benediction-mystic-lamb.webp"
binary=fetch(old_path)
assert_image(binary,"16b5803b9bd1945c065a848a345ef84c6771c88b57e1cb664af267dc2226fe8a","043354b2103b144522a096eeda46bf0fe83c30cd",1536710,"webp")
target="site/gallery/images/van-eyck-mystic-lamb-exact-released.webp"
pathlib.Path(target).write_bytes(binary)
art=next(r for r in gallery["records"] if r["id"]=="PRAYER::saints--vaneyck")
assert art["image"] is None and art["owner_selected_artwork"] and art["title"]=="Adoration of the Mystic Lamb"
art["image"]={
 "src":"./gallery/images/van-eyck-mystic-lamb-exact-released.webp",
 "provenance":"Original Ad Orientem previously approved selected WebP; Commons PD-Art / Public Domain Mark, not CC0. The original JPEG is not preserved.",
 "quality":"EXACT_PREVIOUSLY_APPROVED_WEBP__ORIGINAL_JPEG_NOT_PRESERVED",
 "usage":"GALLERY_IMAGE_ONLY__PRAYER_DEFAULTS_UNCHANGED",
 "license":"Commons PD-Art / Public Domain Mark (not CC0)",
 "license_url":entry["originalCommonsPage"],
 "scene_use_note":"Heavenly adoration of the Mystic Lamb, not the priest giving liturgical Benediction."
}
proofs["sources"].append({
 "artwork_id":art["id"],"title":art["title"],"artist":art["artist"],"path":target,
 "image_bytes":len(binary),"sha256":digest(binary),"git_blob_sha":git_sha(binary),
 "source_url":entry["originalCommonsPage"],"source_old_path":old_path,"source_old_ref":old_commit,
 "source_record":"app-data/sacred-art/devotional-asset-recovery-20261116.v1.json",
 "photo_rights":entry["rightsBasis"],"photo_original_jpeg_preserved":False,
 "release_scope":"GALLERY_IMAGE_ONLY__NO_NEW_PRAYER_DEFAULT"
})
transfer.append({"key":"mystic_lamb","image_type":"painting_webp","source_path":old_path,"source_ref":old_commit,"gallery_path":target,
 "catalogue_id":art["id"],"sha256":digest(binary),"git_blob_sha":git_sha(binary),"bytes":len(binary),
 "old_approval":entry["userApproval"],"rights":entry["rightsBasis"],"source_page":entry["originalCommonsPage"],
 "gallery_published":True,"source_original_jpeg_preserved":False})

# Photograph, not a painting: retain in permanent non-Pages devotional-portrait bank.
entry=source["images"][1]
assert entry["slot"]=="COV-novena.st_therese" and entry["userApproval"]=="FINAL_PHOTOGRAPH_APPROVED"
old_path="assets/prayer/user-approved/st-therese-lisieux-historical-portrait.webp"
binary=fetch(old_path)
assert_image(binary,"705cfd23686a8721faaf62ecaa50ccae1be7c227ceccffdde9f1ca09d73e909d","138e198234ec931ecf8fb1602a919b9249ac47f7",48294,"webp")
target="app-data/sacred-art/devotional-portraits/st-therese-lisieux-historical-portrait.webp"
pathlib.Path(target).parent.mkdir(parents=True,exist_ok=True)
pathlib.Path(target).write_bytes(binary)
transfer.append({"key":"st_therese","image_type":"historical_portrait_webp","source_path":old_path,"source_ref":old_commit,"gallery_path":None,
 "archive_path":target,"catalogue_id":None,"sha256":digest(binary),"git_blob_sha":git_sha(binary),"bytes":len(binary),
 "old_approval":entry["userApproval"],"rights":entry["rightsBasis"],"source_page":entry["originalCommonsPage"],
 "source_image_dimensions":entry["sourcePixels"],"gallery_published":False,"source_original_jpeg_preserved":False})

# Painting 2: Murillo existing source master already recovered and formerly released by old PR 2293.
x=next(z for z in master["inventory"] if z["source_blob_sha"]=="c0904b5d2a6a4bd99b224194217ce45c6a9fe676")
assert x["source_release_pr"]==2293
assert x["transfer_status"]=="PERMANENT_MASTER_TRANSFERRED__PRAYER_PLACEMENT_UNCHANGED"
assert "CC0" in x["source_release_rights"]
binary=pathlib.Path(x["master_path"]).read_bytes()
assert_image(binary,"b1e3d47e65f4367fd11fc23d9a63fb25ff3d8c934c3147606f1a3eba703beaa7",x["source_blob_sha"],3022309,"jpeg")
target="site/gallery/images/murillo-return-prodigal-son-nga-34956-original.jpg"
pathlib.Path(target).write_bytes(binary)
art=next(r for r in gallery["records"] if r["id"]=="CANONICAL::nga-34956")
assert art["image"] is None and art["title"]=="The Return of the Prodigal Son"
assert art["artist"]=="Bartolomé Esteban Murillo"
art["image"]={
 "src":"./gallery/images/murillo-return-prodigal-son-nga-34956-original.jpg",
 "provenance":"Exact already released NGA 34956 Murillo original from old PR #2293; same JPEG bytes as the permanent source-master bank.",
 "quality":"EXACT_RELEASED_JPEG__NGA_CC0_SOURCE_MASTER",
 "usage":"GALLERY_IMAGE_ONLY__PRAYER_DEFAULTS_UNCHANGED",
 "license":"National Gallery of Art CC0 Open Access",
 "license_url":art["source_url"],
 "scene_use_note":"Previously selected for Confession. Historical catalogue approval fields are unchanged."
}
proofs["sources"].append({
 "artwork_id":art["id"],"title":art["title"],"artist":art["artist"],"path":target,
 "image_bytes":len(binary),"sha256":digest(binary),"git_blob_sha":git_sha(binary),
 "source_url":art["source_url"],"source_old_path":x["source_path"],"source_old_ref":x["source_ref"],
 "source_master_path":x["master_path"],"source_master_sha256":digest(binary),
 "release_authority":"Old research merged PR #2293",
 "source_record":"app-data/sacred-art/devotional-asset-recovery-20261116.v1.json",
 "photo_rights":x["source_release_rights"],"release_scope":"GALLERY_IMAGE_ONLY__NO_NEW_PRAYER_DEFAULT"
})
transfer.append({"key":"murillo_confession","image_type":"painting_jpeg","source_path":x["source_path"],"source_ref":x["source_ref"],
 "gallery_path":target,"existing_master":x["master_path"],"catalogue_id":art["id"],
 "sha256":digest(binary),"git_blob_sha":git_sha(binary),"bytes":len(binary),"old_approval":"RELEASED_CONFESSION_PHOTO_PR_2293",
 "rights":x["source_release_rights"],"source_page":art["source_url"],"gallery_published":True,
 "source_original_jpeg_preserved":True})

# Existing approved Seven Sorrows remains a photo hold (research-only file).
hold=next(z for z in master["inventory"] if z["original_artwork_id"]=="mnac:008327-000")
assert hold["transfer_status"]=="ARCHIVE_REFERENCE_ONLY_RELEASE_NOT_CERTIFIED"
assert hold["master_path"] is None
assert gallery["records"][next(i for i,r in enumerate(gallery["records"]) if r["id"]=="HERO::mnac:008327-000")]["image"] is None
held={"artwork_id":"HERO::mnac:008327-000","title":"Virgin of the Seven Sorrows",
 "old_archival_file":hold["source_path"],"old_git_blob_sha":hold["source_blob_sha"],
 "old_sha256":hold["expected_sha256"],
 "other_staged_file":"assets/staged/prayer-selected-cover-qa/seven-sorrows-mnac-pd-art.jpg",
 "other_staged_blob_sha":"c26e1aa255b0328ec49dc8856565575be594fb1d",
 "status":"APPROVED_PAINTING__ARCHIVAL_PHOTO_NOT_CLEARED_FOR_PUBLICATION",
 "reason":"Previous draft PR #1866 requires source rights and final image QA; no certified release of this reproduction.",
 "copied":False,"gallery_published":False}
gallery["counts"]["image_available_records"]=73
gallery["counts"]["distinct_locally_hosted_paintings"]=70
gallery["counts"]["verified_image_files"]=70
assert len(gallery["records"])==870 and {z["id"] for z in gallery["records"]}==old_ids
assert len(proofs["sources"])==70
proofs["local_image_count"]=70
proofs["catalogue_record_images_count"]=73
proofs["source_contract"]="68 previous paintings remain intact, plus exact already selected Mystic Lamb and released Murillo Confession photographs. Separately one St Therese historical portrait WebP is archived outside Pages, not counted as a painting. The original source JPEG for the Mystic Lamb and St Therese is NOT preserved, only the exact previously released WebP. Seven Sorrows photograph remains held."
proofs["pending"]="Other image-pending records, restricted and rejected photographs remain unresolved. MNAC Seven Sorrows is an approved painting but old PR #1866 is a draft-only image release; do not copy or publish its restricted/uncertified source file."
gallery["source_references"]["devotional_recovery"]="app-data/sacred-art/devotional-asset-recovery-20261116.v1.json"
save("site/gallery/catalogue.v1.json",gallery)
save("site/gallery/image-provenance.v1.json",proofs)
save("app-data/sacred-art/devotional-asset-recovery-20261116.v1.json",{
 "schema":"ao.sacred-art.exact-devotional-asset-recovery.v1","date":"2026-11-16","source_commit":old_commit,
 "scope":"No new art selection or prayer-card default; preserve historical image identities and exact source bytes.",
 "source_registry":"assets/prayer/user-approved/source-provenance.v1.json",
 "assets":transfer,"held_photographs":[held],
 "summary":{"exact_assets":3,"actual_copied_bytes":sum(z["bytes"] for z in transfer),
            "newly_copied_from_old_repo":2,"reused_existing_permanent_source_master":1,
            "new_gallery_paintings":2,"nonpainting_archival_portraits":1,
            "held_approved_painting_photos":1,"new_catalogue_records":0,
            "historical_records_preserved":870,"new_prayer_defaults":0,"hash_mismatches":0}
})
assert sum(z["bytes"] for z in transfer)==4607313
patch("site/gallery/gallery.js",
 '    if (item.image?.provenance) inside.append(detailMeta("Image provenance:",item.image.provenance));',
 '    if (item.image?.provenance) inside.append(detailMeta("Image provenance:",item.image.provenance));\n    if (item.image?.scene_use_note) inside.append(detailMeta("Scene context:",item.image.scene_use_note));')
patch("site/gallery/gallery.js",
 'inside.append(detailMeta("Recorded rights note:",item.rights_note));',
 'inside.append(detailMeta("Historical catalogue rights note:",item.rights_note));')
for file in ("tests/sacred-art-gallery.mjs","tests/sacred-art-san-polo.mjs"):
 for old,new in [
  ("assert.equal(gallery.counts.distinct_locally_hosted_paintings, 68);","assert.equal(gallery.counts.distinct_locally_hosted_paintings, 70);"),
  ("assert.equal(gallery.counts.image_available_records, 71);","assert.equal(gallery.counts.image_available_records, 73);"),
  ("assert.equal(gallery.counts.distinct_locally_hosted_paintings,68);","assert.equal(gallery.counts.distinct_locally_hosted_paintings,70);"),
  ("assert.equal(gallery.counts.image_available_records,71);","assert.equal(gallery.counts.image_available_records,73);"),
 ]:
  if old in pathlib.Path(file).read_text(): patch(file,old,new)
 if file.endswith("sacred-art-gallery.mjs"):
  for old,new in [
   ("assert.equal(gallery.records.filter(x => x.image !== null).length, 71);","assert.equal(gallery.records.filter(x => x.image !== null).length, 73);"),
   ("assert.equal(images.sources.length,68);","assert.equal(images.sources.length,70);"),
   ("assert.equal(gallery.counts.verified_image_files,68);","assert.equal(gallery.counts.verified_image_files,70);"),
   ("assert.equal(srcFiles.size,68);","assert.equal(srcFiles.size,70);"),
   ("console.log('Sacred Art gallery validated: 862 historical records + 8 selected San Polo cycle works, 68 paintings on display and 71 image-bearing rows; no new prayer defaults.');",
    "console.log('Sacred Art gallery validated: 870 records, 70 paintings on display, 73 image-bearing rows; no new prayer defaults.');")
  ]:patch(file,old,new)
 else:
  for old,new in [
   ("assert.equal(gallery.counts.verified_image_files,68);","assert.equal(gallery.counts.verified_image_files,70);"),
   ("assert.equal(provenance.sources.length,68);","assert.equal(provenance.sources.length,70);")
  ]:patch(file,old,new)
with pathlib.Path("site/gallery/README.md").open("a") as f:
 f.write("\n### Existing devotional art source recovery - 16 November 2026\n\n")
 f.write("Transferred the previously selected Van Eyck Mystic Lamb exact WebP (1,536,710 bytes), displayed in the gallery as heavenly adoration, not liturgical Benediction; historical Commons PD-Art / PDM is not CC0. The original source JPEG was never saved. Restored the NGA CC0 Murillo Return of the Prodigal Son original JPEG (3,022,309 bytes) already permanently held in source-masters, without new downloads or new approval flags. Saved the preselected 48,294-byte historical St Therese portrait WebP in the non-Pages devotional-portraits bank, not as a painting. The MNAC Seven Sorrows painting remains selected, its uncertified archival photograph held and uncopied. See app-data/sacred-art/devotional-asset-recovery-20261116.v1.json for exact old Git blob hashes, SHA256, image rights and holds.\n\n")
 f.write("Current gallery: 870 records, 70 locally displayed paintings, 73 image-bearing rows. All original catalogue IDs and prayer relationships unchanged.\n")
print(json.dumps({"images":gallery["counts"]["distinct_locally_hosted_paintings"],
                  "records":len(gallery["records"]),"assets":len(transfer),
                  "bytes":sum(z["bytes"] for z in transfer)}))
