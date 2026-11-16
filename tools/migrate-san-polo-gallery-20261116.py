#!/usr/bin/env python3
"""One-time exact old-release San Polo migration. No new painting curation or museum research."""
import hashlib, json, pathlib, urllib.request

ROOT=pathlib.Path(".")
SOURCE_REF="14cd9d3ac11a6f27856f4740ae7c81e1b073bf1a"
OLD=f"https://raw.githubusercontent.com/Fulcanelli13/ad-orientem/{SOURCE_REF}/"
SOURCE_DIR="data/prayer/stations/san-polo-tiepolo-oils-1747/"
GALLERY_DIR=ROOT/"site/gallery/images"

def get(url):
    req=urllib.request.Request(url,headers={"User-Agent":"AdOrientem-SacredArt-ExactLegacyTransfer/1.0"})
    with urllib.request.urlopen(req,timeout=120) as rsp:
        return rsp.read(25000000)

def save_json(path,data):
    pathlib.Path(path).write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n",encoding="utf8")

def replace_exact(path,old,new):
    p=ROOT/path
    s=p.read_text()
    assert old in s, f"Missing expected anchor: {path}: {old[:90]}"
    p.write_text(s.replace(old,new),encoding="utf8")

def blob_hash(b):
    return hashlib.sha1(f"blob {len(b)}\0".encode()+b).hexdigest()

expected_blobs=[
 "b44f4919bd04d2a947249489f7b8d891fd11e1fc",
 "42bc1a72830d49c168f14495d5775c53bbc92e60",
 "d91a8600aa1084c0e99d9e4218b66813bd0135cf",
 "18ccda04549f0b7c32f622e4457d8f1120e8a3c0",
 "f752bcb0c0d2f877a7fb9634215c185bc7f67f80",
 "a5b266ef80256aafa8d9daf3cdf106021b80e222",
 "04bd5c2600b1a4d9264ed190ab56a723ea35b9a4",
 "4dd9b66c05ad938ed64979ff7566b28cba9fcc11",
 "75c0c994a1cce72eece78322e0550fc0b4253c23",
 "7bb173467241e9723edb046dec353a1d1bfd226b",
 "aff831a636dadbbdff126ee1ea36c905ffac293c",
 "09947e09d48a837adfdc2508c02fc5856ddf6499",
 "2f7b01404d4b75d71c4c0d085e46c3607ac93038",
 "c1288aefec1e44f3df6873f3b1de4e8b51a39b8b",
]
existing_ids={
 2:["CANONICAL::ART-iandomenico-iepolo-an-olo-ia-rucis-tation-02-esus-akes-p-the-ross"],
 4:["CANONICAL::ART-iandomenico-iepolo-an-olo-ia-rucis-tation-04-esus-eets-is-other"],
 5:["CANONICAL::ART-iandomenico-iepolo-an-olo-ia-rucis-tation-05-imon-of-yrene-elps"],
 7:["CANONICAL::ART-iandomenico-iepolo-an-olo-ia-rucis-tation-07-econd-all"],
 11:["CANONICAL::ART-iandomenico-iepolo-an-olo-ia-rucis-tation-11-ailing-to-the-ross"],
 12:["CANONICAL::ART-iandomenico-iepolo-an-olo-ia-rucis-tation-12-eath-on-the-ross"]
}
assert len(existing_ids)==6
sources=json.loads(get(OLD+SOURCE_DIR+"cc-by-sa-complete-series-release-candidate.v1.json"))
assert len(sources["entries"])==14 and sources["userDecision"].find("user-authorized")>=0
assert sources["assetCount"]==14
gallery=json.loads((ROOT/"site/gallery/catalogue.v1.json").read_text())
provenance=json.loads((ROOT/"site/gallery/image-provenance.v1.json").read_text())
assert gallery["counts"]["total_records"]==862
assert gallery["counts"]["image_available_records"]==57
assert gallery["counts"]["distinct_locally_hosted_paintings"]==54
assert len(provenance["sources"])==54
historical_ids={x["id"] for x in gallery["records"]}
assert len(historical_ids)==862
manifest=[]
added_count=0
updated_count=0
image_attached=0
GALLERY_DIR.mkdir(parents=True,exist_ok=True)
for n,entry in enumerate(sources["entries"],1):
    assert entry["station"]==n
    assert entry["photographer"].startswith("Didier Descouens")
    assert entry["sourcePhotographLicense"]=="CC BY-SA 4.0"
    assert entry["productionPolicyExceptionAuthorized"]==True
    assert entry["policyAuthority"].find("#2144")>=0
    assert entry["sourceLicenseConfirmed"]==True
    assert entry["nativePixelDimensions"][0]>=1000
    src=OLD+f"assets/stations/san-polo/station-{n:02d}.webp"
    data=get(src)
    digest=hashlib.sha256(data).hexdigest()
    assert digest==entry["sha256"],f"Station {n}: published SHA256 mismatch"
    sha=blob_hash(data)
    assert sha==expected_blobs[n-1],f"Station {n}: pinned old Git blob hash mismatch"
    assert data[:4]==b"RIFF" and data[8:12]==b"WEBP", f"Station {n} not WebP"
    local=f"site/gallery/images/san-polo-station-{n:02d}.webp"
    pathlib.Path(local).write_bytes(data)
    ids=existing_ids.get(n)
    if ids is None:
        ids=[f"RELEASED::san-polo-oils:station-{n:02d}"]
        assert not any(x["id"]==ids[0] for x in gallery["records"])
        add={
          "id":ids[0],"title":f"San Polo Via Crucis — Station {n:02d}: {entry['subject']}",
          "artist":"Giandomenico Tiepolo",
          "institution":"Oratory of the Crucifix, Church of San Polo, Venice, Italy",
          "source_url":entry["sourceFilePage"],
          "record_status":"OWNER_SELECTED_COMPLETE_SAN_POLO_OILS_OPTION__NO_DEFAULT_PRAYER_PLACEMENT",
          "owner_selected_artwork":True,
          "image":None,
          "image_url_source_only":None,
          "rights_note":"Didier Descouens / Archaeodontosaurus photograph CC BY-SA 4.0; WebP resize/recompression remains CC BY-SA 4.0.",
          "scene_ids":[],"prayer_parts":[],"exact_prayer_cards":[],
          "parent_prayer_candidates":[],"eligible_card_count":0,
          "historical_destinations":[],"attribution_status":"RECORDED_ATTRIBUTION"
        }
        gallery["records"].append(add)
        added_count+=1
    else:
        updated_count+=1
    for art_id in ids:
        row=next(z for z in gallery["records"] if z["id"]==art_id)
        assert row["image"] is None
        assert row["artist"]=="Giandomenico Tiepolo"
        row["image"]={
            "src":"./"+local[len("site/"):],
            "quality":"EXACT_PREVIOUSLY_RELEASED_SAN_POLO_WEBP__NATIVE_PHONE_QA_LEGACY",
            "usage":"GALLERY_IMAGE_ONLY__NO_NEW_PRAYER_DEFAULT",
            "pixel_width":entry["nativePixelDimensions"][0],
            "pixel_height":entry["nativePixelDimensions"][1],
            "provenance":"Exact WebP already released as optional 14-painting San Polo Stations cycle in original Ad Orientem PR #2699; not an original JPEG photographic master.",
            "photographer":"Didier Descouens / Archaeodontosaurus",
            "license":"CC BY-SA 4.0",
            "license_url":entry["photoLicenseURL"],
            "adaptation":"Original Commons photograph resized/recompressed to WebP. This adaptation remains CC BY-SA 4.0."
        }
        image_attached+=1
    proof={
      "artwork_id":ids[0],
      "additional_catalogue_ids":ids[1:],
      "path":local,
      "title":f"San Polo Via Crucis — Station {n:02d}: {entry['subject']}",
      "artist":"Giandomenico Tiepolo",
      "image_bytes":len(data),
      "git_blob_sha":sha,
      "sha256":digest,
      "pixel_dimensions":entry["nativePixelDimensions"],
      "source_record":"app-data/sacred-art/san-polo-released-cycle-migration.v1.json",
      "source_url":entry["sourceFilePage"],
      "source_git_ref":SOURCE_REF,
      "source_original_path":f"assets/stations/san-polo/station-{n:02d}.webp",
      "source_photograph_license":"CC BY-SA 4.0",
      "license_url":entry["photoLicenseURL"],
      "photographer":entry["photographer"],
      "modifications":"Converted from Commons JPEG to resized/recompressed WebP by original research project",
      "release_authority":"Old repository merged PR #2699 (2026-11-09); user-scoped 14 Stations licence exception #2144",
      "recorded_reproduction_rights":"CC BY-SA 4.0 (not CC0 or PD); attribution and share-alike required",
      "quality_gate":"PREVIOUSLY_RELEASED_OPTIONAL_14_STATIONS_READER__EXACT_WEBP_HASH",
      "release_scope":"GALLERY_ONLY__PRAYER_DEFAULTS_UNCHANGED",
      "exact_original_image_for_prayer":False
    }
    provenance["sources"].append(proof)
    manifest.append({
      "station":n,"roman":entry["roman"],"subject":entry["subject"],
      "existing_or_added_gallery_ids":ids,
      "new_registry_record":n not in existing_ids,
      "source_ref":SOURCE_REF,
      "source_path":f"assets/stations/san-polo/station-{n:02d}.webp",
      "source_url":entry["sourceFilePage"],
      "local_path":local,
      "source_sha256":digest,"source_git_blob_sha":sha,
      "bytes":len(data),"pixels":entry["nativePixelDimensions"],
      "artist":"Giandomenico Tiepolo",
      "photographer":entry["photographer"],
      "license":"CC BY-SA 4.0","license_url":entry["photoLicenseURL"],
      "adapted_from_original_jpeg":True,
      "original_jpeg_preserved_in_production":False,
      "prior_release_pr":2699,
      "usage":"GALLERY_IMAGE_ONLY__NO_NEW_PRAYER_DEFAULT"
    })
assert added_count==8 and updated_count==6 and image_attached==14
assert len(gallery["records"])==870
assert {x["id"] for x in gallery["records"] if x["id"] in historical_ids}==historical_ids
assert len(provenance["sources"])==68
gallery["counts"].update(
  total_records=870,
  selected_artwork_records=737,
  image_available_records=71,
  distinct_locally_hosted_paintings=68,
  verified_image_files=68
)
gallery["source_references"]["san_polo_released_cycle"]="app-data/sacred-art/san-polo-released-cycle-migration.v1.json"
provenance["local_image_count"]=68
provenance["catalogue_record_images_count"]=71
provenance["source_contract"]="54 earlier gallery photographs remain intact, supplemented with 14 exact previously released optional San Polo Stations WebP derivatives (photo CC BY-SA 4.0; photographer credit, licence and changes preserved). The separate source bank holds 54 legacy original JPEGs; these 14 files are faithful byte-for-byte recoveries of the old gallery-ready WebPs, NOT museum source JPEG masters. Historical 862 records are preserved and eight extra released-cycle identities are appended. No new prayer-card defaults."
provenance["pending"]="Other records still await images; old source-master migration rights holds and photographic exclusions remain unchanged. San Polo CC BY-SA scope applies only to the exact 14 old released photographs; their publication in the image gallery does not authorize a new default Stations or Rosary prayer-card placement."
save_json("site/gallery/catalogue.v1.json",gallery)
save_json("site/gallery/image-provenance.v1.json",provenance)
copy_license=get(OLD+"assets/stations/san-polo/LICENSE-ATTRIBUTION.md")
assert b"Didier Descouens" in copy_license and b"CC BY-SA 4.0" in copy_license
pathlib.Path("site/gallery/SAN-POLO-LICENSE-ATTRIBUTION.md").write_bytes(copy_license)
save_json("app-data/sacred-art/san-polo-released-cycle-migration.v1.json",{
  "schema":"ao.sacred-art.san-polo-released-14-exact-transfer.v1",
  "date":"2026-11-16",
  "old_repo":"Fulcanelli13/ad-orientem",
  "old_commit":SOURCE_REF,
  "release":"Merged original repository PR #2699 (9 November 2026)",
  "photo_exception":"Fourteen pre-selected Tiepolo San Polo oils only, CC BY-SA 4.0; old PR #2144",
  "scope":"Previously released optional reader photos added to new gallery. No new art choices, no prayer-card primary/default activation.",
  "originals_note":"Transferred exact previously released 1920–2400px WebP derivatives, NOT original Commons JPEG masters.",
  "files":manifest,
  "summary":{"files":14,"bytes":sum(z["bytes"] for z in manifest),"existing_gallery_records_linked":6,
             "new_records_for_previously_selected_works":8,"new_prayer_defaults":0,"sha256_failures":0,"blob_sha_failures":0}
})
replace_exact("site/gallery/gallery.js",
 '            data.records?.length !== 862)',
 '            data.records?.length !== 870)')
replace_exact("site/gallery/gallery.js",
 '    if (item.image?.provenance) inside.append(detailMeta("Image provenance:",item.image.provenance));',
 '''    if (item.image?.provenance) inside.append(detailMeta("Image provenance:",item.image.provenance));
    if (item.image?.photographer) inside.append(detailMeta("Photograph:",item.image.photographer));
    if (item.image?.adaptation) inside.append(detailMeta("Adaptation:",item.image.adaptation));
    if (item.image?.license_url) {
      const licence = textEl("a","gallery-detail-source","Image licence: " + item.image.license);
      licence.href = item.image.license_url;
      licence.target = "_blank";
      licence.rel = "noopener noreferrer";
      inside.append(licence);
    }''')
replace_exact("site/gallery/gallery.js",
 '    if (hasImage) {\n      caption.append(textEl("span","gallery-type",',
 '    if (hasImage && item.image?.photographer) caption.append(textEl("span","gallery-photo-credit","Photo: " + item.image.photographer + " · " + item.image.license));\n    if (hasImage) {\n      caption.append(textEl("span","gallery-type",')
css=pathlib.Path("site/gallery/gallery.css")
css.write_text(css.read_text()+"\n.ao-gallery .gallery-photo-credit{display:block;font:400 10px/1.45 var(--cap);color:var(--mu2);padding-top:3px}\n")
replace_exact("tests/sacred-art-gallery.mjs","assert.equal(gallery.records.length, 862);","assert.equal(gallery.records.length, 870);")
replace_exact("tests/sacred-art-gallery.mjs","assert.equal(gallery.counts.total_records, 862);","assert.equal(gallery.counts.total_records, 870);")
replace_exact("tests/sacred-art-gallery.mjs","assert.equal(gallery.counts.distinct_locally_hosted_paintings, 54);","assert.equal(gallery.counts.distinct_locally_hosted_paintings, 68);")
replace_exact("tests/sacred-art-gallery.mjs","assert.equal(gallery.counts.image_available_records, 57);","assert.equal(gallery.counts.image_available_records, 71);")
replace_exact("tests/sacred-art-gallery.mjs","assert.equal(gallery.records.filter(x => x.image !== null).length, 57);","assert.equal(gallery.records.filter(x => x.image !== null).length, 71);")
replace_exact("tests/sacred-art-gallery.mjs","assert.equal(new Set(gallery.records.map(x => x.id)).size, 862);","assert.equal(new Set(gallery.records.map(x => x.id)).size, 870);")
replace_exact("tests/sacred-art-gallery.mjs",
  "assert.deepEqual(new Set(gallery.records.map(x => x.id)),\n  new Set(index.artworks.map(x => x.artwork_id)), 'Gallery must include every registry record');",
  "assert.deepEqual(new Set(gallery.records.filter(x=>!x.id.startsWith('RELEASED::san-polo-oils:')).map(x => x.id)),\n  new Set(index.artworks.map(x => x.artwork_id)), 'All 862 historical registry records must be preserved unchanged');")
replace_exact("tests/sacred-art-gallery.mjs","assert.equal(images.sources.length,54);","assert.equal(images.sources.length,68);")
replace_exact("tests/sacred-art-gallery.mjs","assert.equal(gallery.counts.verified_image_files,54);","assert.equal(gallery.counts.verified_image_files,68);")
replace_exact("tests/sacred-art-gallery.mjs","assert.equal(srcFiles.size,54);","assert.equal(srcFiles.size,68);")
replace_exact("tests/sacred-art-gallery.mjs",
 "console.log('Sacred Art gallery validated: 862 registry records, 54 paintings on display, 57 image-bearing rows; 40 further historical museum/legacy source images (200.7 MB) preserved byte-for-byte and hash-verified, without new prayer assignments.');",
 "console.log('Sacred Art gallery validated: 862 historical records + 8 selected San Polo cycle works, 68 paintings on display and 71 image-bearing rows; no new prayer defaults.');")
replace_exact("tests/sacred-art-class-i-sources.mjs","assert.equal(catalogue.records.length, 862);",
  "assert.equal(catalogue.records.length, 870);\nassert.equal(catalogue.records.filter(x=>!x.id.startsWith('RELEASED::san-polo-oils:')).length, 862);")
readme=pathlib.Path("site/gallery/README.md")
readme.write_text(readme.read_text()+f"""
### Released San Polo cycle — exact fourteen-image transfer · 16 November 2026

The complete set of **14 paintings by Giandomenico Tiepolo** from San Polo, Venice, previously **released as an optional Stations reader in the original repo's merged PR #2699**, now appears in the permanent Sacred Art Gallery. All fourteen WebPs were recovered **byte-for-byte** from pinned original repo commit \`{SOURCE_REF}\`: fourteen source SHA-256 values and Git object hashes match. **15,141,828 bytes** of unchanged images; these are 1920–2400px previously adapted image derivatives, **not** independently preserved Commons JPEG originals.

Exact photographic terms: **Didier Descouens / Archaeodontosaurus**, CC BY-SA 4.0, with individual original Commons links, licence link, and conversion/resizing statement visible in the gallery. The full existing attribution and source-file page register is preserved in \`site/gallery/SAN-POLO-LICENSE-ATTRIBUTION.md\`. The owner's licence exception applies **only** to these fourteen photos, not to the gallery generally. No Rauth or Stracke restricted photographs have been imported.

Six exact physical works were present in the existing 862-row registry (II, IV, V, VII, XI, XII) and now receive local images. **Eight newly indexed historical released-cycle paintings** (I, III, VI, VIII, IX, X, XIII, XIV) are appended with new stable release IDs, not fabricated prayer approvals. The original 862 registry records, candidate/approval edges and display identities remain present and unchanged. No prototype record was misrepresented as a unique new original. Gallery totals: **870 indexed records, 68 distinct paintings, 71 image-bearing records**. Station images are **gallery-only** in the new production app; current new-app prayer reader defaults and Claude interface remain untouched.
""")
print(json.dumps({"source_files":len(manifest),"source_bytes":sum(x["bytes"] for x in manifest),
                   "new_catalogue_rows":added_count,"existing_rows_linked":updated_count,
                   "public_images":gallery["counts"]["distinct_locally_hosted_paintings"],
                   "catalogue_rows":len(gallery["records"])}))
