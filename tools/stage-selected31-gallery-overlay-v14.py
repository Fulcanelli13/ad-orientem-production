#!/usr/bin/env python3
"""Prepare V14 images in draft gallery as additive editorial overlay, no stage approvals."""
import json,hashlib,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/"app-data/sacred-art/staged-selected31-v14/acquisition-results.v14.json"
GALLERY=ROOT/"site/gallery"
OVERLAY=GALLERY/"selected31-reviewed-images.v14.json"
JS=GALLERY/"gallery.js"
REPORT=json.loads(DATA.read_text())
assert REPORT["acquired_count"]==5 and REPORT["held_count"]==0
v12=json.loads((ROOT/"app-data/sacred-art/selected31-gallery-reconciliation-v12.json").read_text())
selected={r["review_artwork_id"]:r for r in v12["records"]}
main=json.loads((GALLERY/"catalogue.v1.json").read_text())
assert main["counts"]["total_records"]==len(main["records"])==862
present={x["id"]:x for x in main["records"]}
assert present["plate-bloch-sermon"]["title"]=="The Sermon on the Mount (1877)"
assert present["plate-bloch-sermon"]["image"] is None
assert present["plate-bloch-sermon"]["owner_selected_artwork"] is True
assert "Carl_Bloch_-_The_Sermon_on_the_Mount.jpg" in present["plate-bloch-sermon"]["source_url"]
contexts={"bap-murillo":"Luminous I · Baptism in the Jordan",
          "bap-verrocchio":"Luminous I · Baptism in the Jordan",
          "cana-francken":"Luminous II · Marriage at Cana",
          "cana-vermeyen":"Luminous II · Marriage at Cana",
          "king-bloch":"Luminous III · Proclamation of the Kingdom"}
institutions={"bap-murillo":"Staatliche Museen zu Berlin",
              "bap-verrocchio":"Uffizi Galleries, Florence",
              "cana-francken":"Nationalmuseum, Stockholm",
              "cana-vermeyen":"Rijksmuseum, Amsterdam",
              "king-bloch":"Museum of National History, Frederiksborg"}
out=[]; patches=[];provenance=[]
for a in REPORT["records"]:
    rid=a["review_artwork_id"]
    assert rid in contexts and rid in selected
    assert a["full_composition"] is True and a["publication_status"]=="SOURCE_STAGED_NOT_LIVE_NOT_PRAYER_APPROVED"
    img=(ROOT/a["derivative_path"]).read_bytes()
    assert hashlib.sha256(img).hexdigest()==a["derivative_sha256"]
    assert hashlib.sha256((ROOT/a["source_path"]).read_bytes()).hexdigest()==a["source_sha256"]
    filename=f"selected31-v14-{rid}-2000.webp"
    path=GALLERY/"images"/filename
    path.write_bytes(img)
    ispreview=min(a["derivative_dimensions"])<1200
    image={"src":"./gallery/images/"+filename,
           "provenance":a["source_page"]+" · "+a["source_license_evidence"],
           "usage":"GALLERY_IMAGE_ONLY__PRAYER_QA_PENDING",
           "quality":"LOW_RES_PREVIEW_ONLY__SOURCE_VERIFIED" if ispreview else "UNCROPPED_2000PX_LOCAL_WEBP__SOURCE_VERIFIED",
           "pixel_width":a["derivative_dimensions"][0],
           "pixel_height":a["derivative_dimensions"][1]}
    if rid=="king-bloch":
        patches.append({"id":"plate-bloch-sermon","expected_source_url":present["plate-bloch-sermon"]["source_url"],
                        "image":image,"review_context":contexts[rid]})
    else:
        out.append({"id":"REVIEW31::"+rid,"title":a["title"],"artist":a["artist"],
          "institution":institutions[rid],"source_url":selected[rid]["museum_page"],
          "record_status":"OWNER_SELECTED_EDITORIAL_V14__NOT_PRAYER_CARD_PRIMARY",
          "owner_selected_artwork":True,"rights_note":a["source_license_evidence"],
          "review_context":contexts[rid],"image":image,"image_url_source_only":a["source_image_url"],
          "scene_ids":[contexts[rid]],"prayer_parts":[],"exact_prayer_cards":[],
          "parent_prayer_candidates":[],"eligible_card_count":0,
          "historical_destinations":[contexts[rid]],
          "attribution_status":"EXACT_OBJECT_AND_IMAGE_ID_VERIFIED"})
    provenance.append({"review_artwork_id":rid,"catalogue_record_id":"plate-bloch-sermon" if rid=="king-bloch" else "REVIEW31::"+rid,
                       "gallery_file":"site/gallery/images/"+filename,"derivative_sha256":a["derivative_sha256"],
                       "derivative_bytes":a["derivative_bytes"],"source_archive":a["source_path"],
                       "original_sha1":a["original_sha1"],"source_sha256":a["source_sha256"],
                       "source_page":a["source_page"],"museum_page":selected[rid]["museum_page"],
                       "source_dimensions":a["source_dimensions"],
                       "gallery_dimensions":a["derivative_dimensions"],
                       "quality_gate":"PREVIEW_ONLY" if ispreview else "GALLERY_READY__PRAYER_QA_PENDING",
                       "publication_scope":"DRAFT_GALLERY_ONLY__NO_PRAYER_ASSIGNMENT"})
assert len(out)==4 and len(patches)==1 and len(provenance)==5
overlay={"schema":"ao.sacred-art.selected31-gallery-overlay.v14","canonical_master_unchanged":True,
         "baseline_registry_count":862,"new_review_records":4,"existing_record_image_patches":1,
         "records":out,"image_patches":patches,"provenance":provenance}
OVERLAY.write_text(json.dumps(overlay,indent=2,ensure_ascii=False)+"\n")
js=JS.read_text()
old='''        data.counts.total_records += supplement.records.length;
        data.counts.distinct_locally_hosted_paintings += supplement.records.length;
        catalogue = data;'''
new='''        data.counts.total_records += supplement.records.length;
        data.counts.distinct_locally_hosted_paintings += supplement.records.length;
        // V14 keeps existing exact artwork IDs intact; no duplicate Bloch record.
        const nextResponse = await fetch("./gallery/selected31-reviewed-images.v14.json",{cache:"no-cache"});
        if (!nextResponse.ok) throw new Error("V14 painting review supplement unavailable");
        const next = await nextResponse.json();
        if (next.schema !== "ao.sacred-art.selected31-gallery-overlay.v14" ||
            next.baseline_registry_count !== 862 || next.records?.length !== 4 ||
            next.image_patches?.length !== 1) throw new Error("Invalid V14 supplement");
        for (const art of next.records) {
          if (!art.id?.startsWith("REVIEW31::") || ids.has(art.id) ||
              !art.image?.src?.startsWith("./gallery/images/selected31-v14-") ||
              art.exact_prayer_cards?.length) throw new Error("Invalid V14 image scope");
          ids.add(art.id);
          data.records.push(art);
        }
        for (const patch of next.image_patches) {
          const item = data.records.find(x => x.id === patch.id);
          if (!item || item.image || item.source_url !== patch.expected_source_url ||
              !patch.image?.src?.startsWith("./gallery/images/selected31-v14-"))
            throw new Error("Invalid canonical image patch");
          item.image = patch.image;
        }
        data.counts.total_records += next.records.length;
        data.counts.distinct_locally_hosted_paintings += next.records.length + next.image_patches.length;
        catalogue = data;'''
if old in js:
    JS.write_text(js.replace(old,new))
elif new not in js: raise RuntimeError("Cannot locate V13 gallery overlay anchor")
readme=GALLERY/"README.md"
tail='''\n## Luminous art V14 draft — five verified photographs\n\nThe additive V14 image supplement adds four previously selected works to the\nreview collection and patches the **existing** \`plate-bloch-sermon\` record,\nwithout duplicating Bloch or changing \`catalogue.v1.json\` (862 historical rows).\nThe V13+V14 draft therefore proposes **871 searchable gallery rows and 64\nlocal paintings**. Source photographs and SHA-256/SHA-1 evidence are archived\noutside \`site/\` in \`app-data/sacred-art/staged-selected31-v14/\`.\n\nMurillo, Verrocchio/Leonardo and Bloch have 2,000px full-composition WebPs.\nFrancken and Vermeyen have exact but smaller 1,000/1,166px source images:\nthese are labelled **preview only**, not final cinematic backgrounds. No image\naddition confers a Rosary card primary or publication permission. The gallery\nimages are in a draft PR, not merged to live GitHub Pages.\n'''
if "## Luminous art V14 draft" not in readme.read_text(): readme.write_text(readme.read_text()+tail)
print("V14 gallery overlay staged, four additive review records, one canonical image patch")
